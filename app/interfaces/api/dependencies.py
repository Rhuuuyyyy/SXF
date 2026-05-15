"""FastAPI Depends providers — the single wiring surface for all routers.

Centralising here:
- Keeps router files focused on path operations.
- Provides one surface for test dependency_overrides.
- Translates domain exceptions to HTTP before they reach the router.
"""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import JWTError, TokenClaims, verify_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@dataclass(frozen=True)
class AuthenticatedDoctor:
    """Lightweight authenticated identity extracted from a verified JWT.

    Does NOT carry the full domain User entity — that would require a DB
    round-trip per request. Use this for authorization guards; load the
    full User entity inside use cases only when needed.
    """

    usuario_id: int   # DB integer PK from 'usuarios.id'
    sessao_id: int    # Active session in 'tb_log_sessoes'
    role: str         # 'doctor' | 'admin'


async def get_current_doctor(
    token: str = Depends(oauth2_scheme),
) -> AuthenticatedDoctor:
    """Verify the Bearer JWT and return the authenticated doctor's identity.

    Raises HTTP 401 if the token is absent, expired, or invalid.
    Does NOT hit the database — verification is cryptographic only.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        claims: TokenClaims = verify_access_token(token)
    except (JWTError, Exception):
        raise credentials_exception from None

    if claims.role not in ("doctor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role não autorizado para este endpoint.",
        )

    return AuthenticatedDoctor(
        usuario_id=claims.usuario_id,
        sessao_id=claims.sessao_id,
        role=claims.role,
    )
