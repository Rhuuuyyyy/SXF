"""Domain layer — pure business logic, framework- and infrastructure-agnostic.

Code in this package MUST NOT import from FastAPI, SQLAlchemy, or any concrete
infrastructure adapter. Dependencies flow inward: outer layers depend on this
one, never the other way around.
"""
