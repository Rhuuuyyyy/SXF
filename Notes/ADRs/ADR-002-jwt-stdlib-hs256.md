---
id: ADR-002
title: "JWT stdlib HS256 — Custom HMAC Implementation Without Third-Party JWT Libraries"
status: accepted
date: 2026-05-11
deciders: [backend-team]
supersedes: null
tags:
  - adr
  - jwt
  - security
  - auth
  - stdlib
related:
  - "[[file_core_security_py]]"
  - "[[file_interfaces_api_dependencies_py]]"
  - "[[008_AuthN_Strategy]]"
  - "[[file_presentation_routers_auth_py]]"
---

# ADR-002 — JWT stdlib HS256: Custom HMAC Implementation Without Third-Party JWT Libraries

## Status

**Accepted** — 2026-05-11

---

## Context

The SXFp backend requires JWT-based authentication. The original plan
(captured in the planned ADR [[008_AuthN_Strategy]]) called for RS256
asymmetric signing using `python-jose` or `PyJWT`.

During Sprint 4, both `python-jose` and `PyJWT` failed at import time on the
deployment environment. Both libraries depend on the `cryptography` package,
which ships a Rust/C extension. The extension failed to load due to a broken
system `libssl` linkage on the target host. The error prevented the application
from starting.

Installing a different version of `cryptography` introduced dependency
conflicts with `sqlalchemy` and `pydantic`. Recompiling from source was
outside the operational boundary for this sprint.

The team needed a working JWT implementation that could ship on the current
host without external dependencies beyond the Python standard library.

---

## Decision

We implement JWT signing and verification using **Python standard library
only**: `hmac`, `hashlib`, and `base64`. The algorithm is **HS256**
(HMAC-SHA-256). The signing key is the `settings.secret_key` string encoded
as UTF-8 bytes.

Token structure follows RFC 7519:
- Header: `{"alg": "HS256", "typ": "JWT"}`
- Payload: `{"sub": str(usuario_id), "role": role, "sid": sessao_id, "iat": iat, "exp": exp}`
- Signature: `HMAC-SHA256(base64url(header) + "." + base64url(payload), key)`

Key implementation decisions within `app/core/security.py`:

- `_ACCESS_TOKEN_TTL_SECONDS = 1800` (30 minutes).
- Signature verification uses `hmac.compare_digest()` — constant-time
  comparison that prevents timing-based signature forgery.
- `verify_access_token()` raises `JWTError` (a plain `Exception` subclass)
  on any failure: malformed token, invalid signature, or expired timestamp.
  The caller (`get_current_doctor`) catches `JWTError` and raises HTTP 401.

```python
# Issue
sig = base64.urlsafe_b64encode(
    hmac.new(key_bytes, f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()
).rstrip(b"=")

# Verify (constant-time)
hmac.compare_digest(signature_bytes, expected_sig_bytes)
```

---

## Consequences

**Positive:**

- Zero external dependencies for JWT; no Rust/C extension required.
- Fully auditable: the entire JWT implementation is ~80 lines in one file.
- `hmac.compare_digest()` ensures timing-safe verification.
- `JWTError` is a plain Python exception — easy to test without mocking any
  external library internals.

**Negative:**

- HS256 is symmetric: the same secret signs and verifies. If multiple
  services ever need to verify tokens, they all need the secret key, which
  increases the secret's blast radius compared to RS256 asymmetric signing.
- No automatic key rotation — rotating `secret_key` invalidates all existing
  sessions.
- The implementation does not support JWK, JWKS endpoints, or token
  introspection. Future OAuth2/OIDC integration will require a library
  migration.

---

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| `python-jose` | Crashed at import; Rust/C extension unavailable on deployment host. |
| `PyJWT` | Same root cause; same `cryptography` extension dependency. |
| `authlib` | Also depends on `cryptography`; same failure mode. |
| RS256 with custom stdlib | RSA key parsing requires `cryptography` or `rsa` package — same problem. |

---

## Implementation Notes

- `app/core/security.py` exports: `issue_access_token()`, `verify_access_token()`,
  `TokenClaims` (frozen dataclass), `JWTError`.
- `settings.secret_key` is validated with `min_length=8` in `Settings`. It is
  a plain `str` (not `SecretStr`) because it must be encoded directly in the
  HMAC call without `.get_secret_value()`.
- When the system `cryptography` issue is resolved, this ADR should be
  superseded by an ADR that migrates to RS256 with `python-jose` or `PyJWT`.

#adr #jwt #security #auth #stdlib #hs256
