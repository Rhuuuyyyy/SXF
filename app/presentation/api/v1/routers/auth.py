"""HTTP router for authentication endpoints.

Sprint 3 scope: login endpoint that verifies credentials via PostgreSQL
crypt() and opens a session in tb_log_sessoes.
Sprint 4 scope: JWT HS256 issuance (ADR-008). RS256 in Sprint 5.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import issue_access_token
from app.db.database import get_db_session
from app.presentation.api.v1.schemas.auth import TokenLoginResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post(
    "/login",
    response_model=TokenLoginResponse,
    summary="Autenticar médico e abrir sessão",
    description=(
        "Verifica credenciais usando bcrypt nativo do PostgreSQL (crypt()). "
        "Registra a tentativa de login em tb_log_tentativas_login. "
        "Abre uma sessão em tb_log_sessoes e retorna um JWT HS256 assinado. "
        "Sprint 5 migrará para RS256 (ADR-008)."
    ),
)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_db_session),
) -> TokenLoginResponse:
    """Authenticate a doctor and open a session.

    Returns a signed JWT access token.
    The OAuth2PasswordRequestForm uses 'username' field for email
    (standard OAuth2 convention).
    """
    auth_service = AuthService(session)
    ip_origem = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    # Brute-force guard — must run before credential check
    if await auth_service.check_brute_force(ip_origem=ip_origem):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas de login. Tente novamente em 10 minutos.",
        )

    usuario_id = await auth_service.authenticate_doctor(
        email=form_data.username,  # OAuth2 standard: username = email
        senha_plain=form_data.password,
    )

    sucesso = usuario_id is not None
    sessao_id: int | None = None

    if sucesso and usuario_id is not None:
        sessao_id = await auth_service.open_session(
            usuario_id=usuario_id,
            ip_origem=ip_origem,
            user_agent=user_agent,
        )

    await auth_service.log_tentativa_login(
        email_tentado=form_data.username,
        ip_origem=ip_origem,
        user_agent=user_agent,
        sucesso=sucesso,
        usuario_id=usuario_id,
        sessao_id=sessao_id,
        motivo_falha=None if sucesso else "credenciais_invalidas",
    )

    if not sucesso or sessao_id is None or usuario_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # The role field is hardcoded to "doctor" for Sprint 4.
    # Sprint 5 will query 'usuarios.role' during authentication.
    access_token = issue_access_token(
        usuario_id=usuario_id,
        role="doctor",
        sessao_id=sessao_id,
    )

    return TokenLoginResponse(
        access_token=access_token,
        token_type="Bearer",  # noqa: S106
        sessao_id=sessao_id,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Encerrar sessão ativa",
)
async def logout(
    sessao_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> None:
    """Close an active session in tb_log_sessoes."""
    auth_service = AuthService(session)
    await auth_service.close_session(
        sessao_id=sessao_id,
        tipo_encerramento="logout",
    )
