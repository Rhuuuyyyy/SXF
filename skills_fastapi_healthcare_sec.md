# Diretrizes de Segurança e Boas Práticas (AppSec & HealthCare)

Este documento define os padrões absolutos de segurança de aplicação (AppSec) que devem ser seguidos rigorosamente no desenvolvimento do Backend (FastAPI) para o projeto SXFp. Por se tratar de um sistema de triagem clínica em saúde, lidamos com Dados Pessoais Sensíveis protegidos pela LGPD (Lei Geral de Proteção de Dados - Brasil).

A IA atuando como Tech Lead DEVE aplicar estas regras em todas as sugestões de arquitetura, refatoração ou criação de código.

## 1. Proteção de Dados e LGPD (Privacy by Design)
* **Mascaramento de Logs:** NUNCA logue Dados Pessoais (PII - Personally Identifiable Information) ou Dados de Saúde (PHI). Informações como `full_name`, `guardian_name` ou o `score` exato atrelado a um nome não devem aparecer em logs de console ou arquivos de texto puro.
* **Logs de Auditoria:** Toda ação de inserção ou consulta de triagem deve gerar um log estruturado contendo apenas metadados (ex: `patient_id` (UUID), `timestamp`, `action`).
* **Minimização de Dados:** O backend deve transitar apenas os dados estritamente necessários para o cálculo.

## 2. Segurança no FastAPI (AppSec)
* **CORS Estrito:** O middleware de CORS do FastAPI nunca deve usar `allow_origins=["*"]` em produção. Ele deve ler a variável de ambiente `CORS_ORIGINS` e permitir apenas os domínios do Frontend parceiro.
* **Validação e Sanitização (Pydantic V2):** Confie no Pydantic para validação de tipos, mas vá além:
    * Use `Field(..., max_length=X)` para evitar ataques de estouro de buffer ou payloads gigantes.
    * Strings devem ser limpas de tags HTML/Scripts para evitar XSS cruzado (caso o frontend exiba esses dados depois).
* **Rate Limiting:** Rotas públicas ou de submissão de triagem devem ter limites de requisições (Rate Limit) para evitar ataques de negação de serviço (DDoS) ou envios em massa (Spam). (Sugestão de uso: `slowapi` ou similar).

## 3. Gestão de Erros e Exceções (Tratamento Silencioso)
* **Zero Stack Trace:** Em ambiente de produção (`ENVIRONMENT != development`), o sistema nunca deve retornar Stack Traces ou erros internos do servidor (Erro 500) com detalhes da infraestrutura ou do banco de dados.
* **Exception Handlers Customizados:** Use o `@app.exception_handler` do FastAPI para capturar exceções não tratadas e retornar um JSON genérico e seguro: `{"detail": "Erro interno no servidor."}`.

## 4. Autenticação e Autorização (Se aplicável)
* Caso o sistema expanda para ter painéis médicos, a autenticação deve ser feita utilizando **OAuth2 com JWT (JSON Web Tokens)**.
* Senhas (se existirem) devem ser hasheadas utilizando algoritmos fortes (ex: `bcrypt` via biblioteca `passlib`).
* Tokens JWT devem ter tempo de expiração curto (`exp`) e o backend deve validar estritamente a assinatura usando a `SECRET_KEY` do `.env`.

## 5. Injeção de Dependências Segura
* Use o sistema de injeção de dependências do FastAPI (`Depends()`) para passar sessões de banco de dados e verificar credenciais. Isso garante que as conexões sejam abertas e fechadas corretamente a cada requisição, prevenindo vazamento de recursos e isolando contextos.
* **Prevenção de SQL Injection:** Como estamos usando o padrão Repository, NUNCA concatene strings para formar consultas SQL. Se utilizar SQLAlchemy ou SQLModel no futuro, utilize as funções da ORM ou *parameterized queries*.