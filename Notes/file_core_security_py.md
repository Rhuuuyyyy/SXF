---
id: file-core-security
title: "security.py (core)"
type: File
status: Active
language: python
path: app/core/security.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_core]]"
tags:
  - file
  - core
  - security
  - authentication
  - jwt
  - hs256
  - stdlib
related:
  - "[[file_core_config_py]]"
  - "[[file_interfaces_api_dependencies_py]]"
  - "[[file_presentation_routers_auth_py]]"
  - "[[ADR-002-jwt-stdlib-hs256]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/core/security.py` — JWT Issuance and Verification (stdlib HS256)

## Context & Purpose

Implements the JWT token lifecycle using **Python standard library only**:
`hmac`, `hashlib`, `base64`, `json`, and `time`. No third-party JWT library
is used. See [[ADR-002-jwt-stdlib-hs256]] for the full decision record.

Splitting cryptographic primitives here — rather than inlining them in the
auth router — allows:
- Testing JWT behaviour without booting the full auth flow.
- A clean, auditable implementation in ~80 lines.
- A stable surface for [[file_interfaces_api_dependencies_py]] to depend on.

## Public Surface

```python
_ACCESS_TOKEN_TTL_SECONDS: int = 1800  # 30 minutes
_ALGORITHM: str = "HS256"

@dataclass(frozen=True)
class TokenClaims:
    usuario_id: int    # from JWT claim 'sub' (stored as str, converted to int)
    role: str          # 'doctor' | 'admin'
    sessao_id: int     # from JWT claim 'sid'
    exp: float         # POSIX timestamp

class JWTError(Exception): ...

def issue_access_token(
    *, usuario_id: int, role: str, sessao_id: int, ttl_seconds: int = _ACCESS_TOKEN_TTL_SECONDS
) -> str: ...

def verify_access_token(token: str) -> TokenClaims: ...
```

## Logic Walkthrough

### `issue_access_token()`

1. Build header JSON: `{"alg": "HS256", "typ": "JWT"}`.
2. Build payload: `{"sub": str(usuario_id), "role": role, "sid": sessao_id, "iat": int(now), "exp": int(now + ttl_seconds)}`.
3. Base64url-encode both (no padding).
4. Compute signature: `hmac.new(key_bytes, f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()`.
5. Base64url-encode signature (no padding).
6. Return `f"{header_b64}.{payload_b64}.{sig_b64}"`.

### `verify_access_token()`

1. Split token on `.` — expect exactly 3 parts; raise `JWTError` otherwise.
2. Recompute expected signature using same HMAC key.
3. **Constant-time comparison**: `hmac.compare_digest(sig_bytes, expected_sig_bytes)` — prevents timing-based signature forgery.
4. Decode and JSON-parse payload.
5. Check `exp > time.time()` — raise `JWTError("Token expired")` if stale.
6. Extract `sub` (convert to `int`), `role`, `sid`, `exp` → return `TokenClaims`.

## JWT Payload Schema

| Claim | Type | Value |
|---|---|---|
| `sub` | `str` | `str(usuario_id)` (DB integer PK) |
| `role` | `str` | `"doctor"` or `"admin"` |
| `sid` | `int` | `sessao_id` (FK to `tb_log_sessoes`) |
| `iat` | `int` | Issued-at POSIX timestamp |
| `exp` | `int` | Expiry POSIX timestamp (`iat + 1800`) |

## Dependencies

- **External:** standard library only (`hmac`, `hashlib`, `base64`, `json`, `time`, `dataclasses`).
- **Internal:** [[file_core_config_py]] — `settings.secret_key` encoded to UTF-8 bytes.

## Consumers

| Consumer | Function used |
|---|---|
| [[file_presentation_routers_auth_py]] | `issue_access_token()` after successful login |
| [[file_interfaces_api_dependencies_py]] | `verify_access_token()` in `get_current_doctor` |

## Invariants / Pitfalls

- `_ACCESS_TOKEN_TTL_SECONDS = 1800` is the **single source of truth** for
  token lifetime. Do not hardcode 1800 elsewhere.
- `secret_key` is read from `settings` at module import time. Rotating the key
  invalidates all existing sessions; process must restart.
- **Never log the token string** — it is a bearer credential.
- `hmac.compare_digest()` is mandatory for signature comparison — `==` would
  enable timing attacks.
- `JWTError` is a plain `Exception` subclass; `get_current_doctor` catches it
  and raises HTTP 401. Do not catch it inside security.py.

## Related ADRs

- [[ADR-002-jwt-stdlib-hs256]] — full decision record for this implementation.
- [[006_LGPD_PII_Strategy]] — tokens must not contain PII beyond `sub`/`role`/`sid`.
- [[008_AuthN_Strategy]] *(planned)* — migration path to RS256.

#file #core #security #jwt #hs256 #stdlib
