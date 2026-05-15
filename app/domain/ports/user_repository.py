"""Persistence port for the ``User`` aggregate.

Concrete implementations live in the infrastructure layer (e.g. a future
SQLAlchemy adapter) and are bound to this Protocol at the composition
root. Domain and application code depend only on ``IUserRepository``.
"""
from typing import Protocol
from uuid import UUID

from app.domain.entities.user import User


class IUserRepository(Protocol):
    """Contract every concrete User persistence adapter must satisfy."""

    async def get(self, user_id: UUID) -> User | None: ...

    async def get_by_email(self, email: str) -> User | None: ...

    async def add(self, user: User) -> User: ...

    async def update(self, user: User) -> User: ...

    async def list_active(
        self, *, limit: int = 50, offset: int = 0
    ) -> list[User]: ...
