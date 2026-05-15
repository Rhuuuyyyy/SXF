#!/usr/bin/env python3
"""
SXFp — Runner automático
========================
Executa o Backend (FastAPI/uvicorn) e o Frontend (Next.js) simultaneamente,
cuidando de toda a configuração de dependências e ambiente.

Uso:
    python run.py              # instala tudo e inicia os servidores
    python run.py --skip-install   # pula pip/npm install (mais rápido)
    python run.py --backend-only   # inicia só o FastAPI
    python run.py --frontend-only  # inicia só o Next.js
"""

from __future__ import annotations

import argparse
import os
import platform
import shutil
import signal
import subprocess
import sys
import threading
import venv
from pathlib import Path

# ── Caminhos ──────────────────────────────────────────────────────────────────
ROOT     = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
VENV_DIR = ROOT / ".venv"

IS_WIN = platform.system() == "Windows"

VENV_PYTHON  = VENV_DIR / ("Scripts" if IS_WIN else "bin") / ("python.exe" if IS_WIN else "python")
NPM          = "npm.cmd" if IS_WIN else "npm"

# ── Cores ANSI ────────────────────────────────────────────────────────────────
# Desabilitadas automaticamente quando o terminal não as suporta
_use_color = sys.stdout.isatty() and not IS_WIN
BLUE   = "\033[94m" if _use_color else ""
GREEN  = "\033[92m" if _use_color else ""
YELLOW = "\033[93m" if _use_color else ""
RED    = "\033[91m" if _use_color else ""
BOLD   = "\033[1m"  if _use_color else ""
DIM    = "\033[2m"  if _use_color else ""
RESET  = "\033[0m"  if _use_color else ""

# ── Log helpers ───────────────────────────────────────────────────────────────
_log_lock = threading.Lock()


def _print(prefix: str, msg: str) -> None:
    with _log_lock:
        for line in msg.rstrip("\n").splitlines() or [""]:
            print(f"{prefix}{line}{RESET}", flush=True)


def info(msg: str)  -> None: _print(f"{BOLD}{YELLOW}[run.py] {RESET}", msg)
def ok(msg: str)    -> None: _print(f"{BOLD}{GREEN}[run.py] ✓ {RESET}", msg)
def err(msg: str)   -> None: _print(f"{BOLD}{RED}[run.py] ✗ {RESET}", msg)
def step(msg: str)  -> None: _print(f"\n{BOLD}[run.py] ▶ ", msg)
def header(msg: str) -> None:
    bar = "─" * 54
    _print("", f"{BOLD}{bar}\n  {msg}\n{bar}{RESET}")


def stream(proc: subprocess.Popen, label: str, color: str) -> None:
    """Encaminha stdout/stderr de um processo com prefixo colorido."""
    prefix = f"{BOLD}{color}[{label}]{RESET} "
    assert proc.stdout is not None
    for line in proc.stdout:
        with _log_lock:
            print(f"{prefix}{line}", end="", flush=True)


# ── Processos em execução (para shutdown limpo) ───────────────────────────────
_procs: list[subprocess.Popen] = []


def shutdown(signum=None, frame=None) -> None:  # noqa: ARG001
    print(f"\n{BOLD}{YELLOW}[run.py] Encerrando servidores…{RESET}", flush=True)
    for p in _procs:
        if p.poll() is None:
            p.terminate()
    for p in _procs:
        try:
            p.wait(timeout=6)
        except subprocess.TimeoutExpired:
            p.kill()
    print(f"{BOLD}{GREEN}[run.py] Encerrado com sucesso.{RESET}", flush=True)
    sys.exit(0)


# ── Pré-requisitos ────────────────────────────────────────────────────────────

def check_prerequisites() -> None:
    step("Verificando pré-requisitos")

    if sys.version_info < (3, 11):
        err(f"Python 3.11+ é obrigatório. Versão atual: {sys.version.split()[0]}")
        err("Baixe em https://www.python.org/downloads/")
        sys.exit(1)
    ok(f"Python {sys.version.split()[0]}")

    for tool, url in [
        ("node", "https://nodejs.org"),
        ("npm",  "https://nodejs.org"),
    ]:
        if not shutil.which(tool) and not (IS_WIN and shutil.which(f"{tool}.cmd")):
            err(f"'{tool}' não encontrado. Instale Node.js em {url}")
            sys.exit(1)

    node_ver = subprocess.check_output(["node", "--version"], text=True).strip()
    npm_ver  = subprocess.check_output([NPM, "--version"], text=True).strip()
    ok(f"Node.js {node_ver}  |  npm {npm_ver}")


# ── Virtualenv e dependências Python ─────────────────────────────────────────

def setup_venv() -> None:
    step("Ambiente virtual Python (.venv)")
    if VENV_PYTHON.exists():
        ok("Virtualenv já existe — pulando criação")
        return
    info("Criando .venv (pode demorar alguns segundos…)")
    venv.create(str(VENV_DIR), with_pip=True, clear=False, upgrade_deps=True)
    ok("Virtualenv criado em .venv/")


def install_python_deps() -> None:
    step("Instalando dependências Python (pip install -e .)")

    # Silently upgrade pip first
    subprocess.run(
        [str(VENV_PYTHON), "-m", "pip", "install", "--upgrade", "pip", "--quiet"],
        cwd=ROOT,
        check=True,
    )

    # Install project + all declared dependencies in editable mode
    result = subprocess.run(
        [str(VENV_PYTHON), "-m", "pip", "install", "-e", ".", "--quiet"],
        cwd=ROOT,
        check=False,
    )
    if result.returncode != 0:
        err("Falha ao instalar dependências Python.")
        err("Verifique se pyproject.toml está correto e tente novamente.")
        sys.exit(1)

    ok("Dependências Python instaladas")


# ── Dependências Node.js ──────────────────────────────────────────────────────

def install_node_deps() -> None:
    step("Instalando dependências Node.js (npm install)")

    node_modules = FRONTEND / "node_modules"
    lock_file    = FRONTEND / "package-lock.json"

    if node_modules.exists() and lock_file.exists():
        # Check if package.json is newer than node_modules (deps may have changed)
        pkg_mtime  = (FRONTEND / "package.json").stat().st_mtime
        lock_mtime = lock_file.stat().st_mtime
        nm_mtime   = node_modules.stat().st_mtime

        if nm_mtime >= pkg_mtime and nm_mtime >= lock_mtime:
            ok("node_modules já está atualizado — pulando npm install")
            return
        info("package.json foi modificado — atualizando node_modules…")

    result = subprocess.run([NPM, "install"], cwd=FRONTEND, check=False)

    if result.returncode != 0:
        if IS_WIN:
            # Windows Group Policy may block native-addon post-install scripts (EPERM/napi-postinstall).
            # Retry without them — pure-JS packages still work correctly.
            info("npm install falhou — tentando com --ignore-scripts (política de grupo detectada)…")
            result = subprocess.run(
                [NPM, "install", "--ignore-scripts"],
                cwd=FRONTEND,
                check=False,
            )
            if result.returncode == 0:
                ok("Dependências npm instaladas (pós-install scripts ignorados por política de grupo)")
                return

        err("Falha ao instalar dependências npm.")
        err(f"Execute manualmente: cd {FRONTEND} && npm install")
        sys.exit(1)

    ok("Dependências npm instaladas")


# ── Arquivos de configuração (.env) ──────────────────────────────────────────

def setup_backend_env() -> None:
    step("Configuração do Backend (.env)")

    env_file    = ROOT / ".env"
    env_example = ROOT / ".env.example"

    if env_file.exists():
        ok(".env já existe")

        # Garantir que CORS_ORIGINS inclua localhost:3000
        content = env_file.read_text()
        if "CORS_ORIGINS" not in content:
            env_file.write_text(content.rstrip() + "\nCORS_ORIGINS=http://localhost:3000\n")
            info("CORS_ORIGINS=http://localhost:3000 adicionado ao .env")
        return

    if env_example.exists():
        shutil.copy(env_example, env_file)

        # Garantir CORS
        content = env_file.read_text()
        if "CORS_ORIGINS=" not in content or "CORS_ORIGINS=\n" in content:
            content = content.replace("CORS_ORIGINS=\n", "CORS_ORIGINS=http://localhost:3000\n")
            content = content.replace("CORS_ORIGINS= \n", "CORS_ORIGINS=http://localhost:3000\n")
            if "CORS_ORIGINS" not in content:
                content += "\nCORS_ORIGINS=http://localhost:3000\n"
            env_file.write_text(content)

        ok(".env criado a partir do .env.example")
    else:
        # Cria com valores mínimos de desenvolvimento
        env_file.write_text(
            'APP_NAME="SXFp Backend"\n'
            "APP_VERSION=0.1.0\n"
            "ENVIRONMENT=development\n"
            "DEBUG=true\n"
            "API_PREFIX=/api/v1\n"
            "SECRET_KEY=dev-secret-mude-em-producao\n"
            "CORS_ORIGINS=http://localhost:3000\n"
            "# DATABASE_URL=postgresql+asyncpg://user:senha@host:5432/sxfp\n"
            "# PGP_KEY=chave-pgp-para-criptografia\n"
        )
        ok(".env criado com valores padrão de desenvolvimento")

    info("⚠  Preencha DATABASE_URL e PGP_KEY no .env antes de usar o banco de dados.")


def setup_frontend_env() -> None:
    step("Configuração do Frontend (.env.local)")

    env_local = FRONTEND / ".env.local"
    if env_local.exists():
        ok(".env.local já existe")
        return

    env_local_example = FRONTEND / ".env.local.example"
    if env_local_example.exists():
        shutil.copy(env_local_example, env_local)
        ok(".env.local criado a partir do .env.local.example")
    else:
        env_local.write_text("NEXT_PUBLIC_API_URL=http://localhost:8000\n")
        ok(".env.local criado (NEXT_PUBLIC_API_URL=http://localhost:8000)")


# ── Inicialização dos servidores ──────────────────────────────────────────────

def start_backend() -> subprocess.Popen:
    step("Iniciando Backend — FastAPI + uvicorn")

    if not VENV_PYTHON.exists():
        err(f"Python do virtualenv não encontrado em {VENV_PYTHON}")
        err("Execute sem --skip-install para instalar as dependências.")
        sys.exit(1)

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    # Usa "python -m uvicorn" em vez do executável direto para contornar
    # restrições de execução de binários em .venv\Scripts\ no Windows.
    proc = subprocess.Popen(
        [
            str(VENV_PYTHON),
            "-m", "uvicorn",
            "app.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload",
            "--reload-dir", str(ROOT / "app"),
        ],
        cwd=ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    _procs.append(proc)
    return proc


def start_frontend() -> subprocess.Popen:
    step("Iniciando Frontend — Next.js")

    env = os.environ.copy()
    env["FORCE_COLOR"] = "1"   # preserva cores do Next.js
    env["NODE_ENV"]    = "development"

    proc = subprocess.Popen(
        [NPM, "run", "dev"],
        cwd=FRONTEND,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    _procs.append(proc)
    return proc


# ── Entrypoint ────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="SXFp — inicia Backend e Frontend automaticamente.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument(
        "--skip-install",
        action="store_true",
        help="Pula pip install e npm install (útil para reinicios rápidos).",
    )
    p.add_argument(
        "--backend-only",
        action="store_true",
        help="Inicia apenas o servidor FastAPI.",
    )
    p.add_argument(
        "--frontend-only",
        action="store_true",
        help="Inicia apenas o servidor Next.js.",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()

    signal.signal(signal.SIGINT,  shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    header("SXFp — Sistema de Triagem do X Frágil")

    # ── Setup ──
    check_prerequisites()

    if not args.frontend_only:
        setup_venv()
        if not args.skip_install:
            install_python_deps()
        setup_backend_env()

    if not args.backend_only:
        if not args.skip_install:
            install_node_deps()
        setup_frontend_env()

    # ── Start ──
    header("Iniciando servidores")

    threads: list[threading.Thread] = []

    if not args.frontend_only:
        backend_proc = start_backend()
        t = threading.Thread(
            target=stream,
            args=(backend_proc, "BACKEND ", BLUE),
            daemon=True,
        )
        t.start()
        threads.append(t)

    if not args.backend_only:
        frontend_proc = start_frontend()
        t = threading.Thread(
            target=stream,
            args=(frontend_proc, "FRONTEND", GREEN),
            daemon=True,
        )
        t.start()
        threads.append(t)

    # Aguarda um momento para os servidores iniciarem antes de mostrar o resumo
    import time
    time.sleep(1)

    print(f"""
{BOLD}{'─' * 54}{RESET}
  {BOLD}Servidores em execução{RESET}
{'─' * 54}
  {BLUE}Backend {RESET} → {BOLD}http://localhost:8000{RESET}
             API Docs: {DIM}http://localhost:8000/api/v1/docs{RESET}
  {GREEN}Frontend{RESET} → {BOLD}http://localhost:3000{RESET}

  {YELLOW}Ctrl+C para encerrar ambos os servidores.{RESET}
{'─' * 54}
""", flush=True)

    # Loop de monitoramento — encerra tudo se qualquer processo cair
    procs_to_watch = list(_procs)
    while True:
        for proc in procs_to_watch:
            code = proc.poll()
            if code is not None:
                label = "Backend" if proc == procs_to_watch[0] else "Frontend"
                err(f"{label} encerrou inesperadamente (código de saída: {code})")
                shutdown()
        threading.Event().wait(2)


if __name__ == "__main__":
    main()
