"""Shared pytest fixtures for unit tests.

Design principle: Use Cases are tested in isolation.
All fixtures here are AsyncMock instances of concrete repository classes.
The spec= argument ensures mock raises AttributeError for unknown methods,
catching drift between mock and real implementation early.
"""
from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.services.symptom_scoring_orchestrator import SymptomScoringOrchestrator
from app.interfaces.repositories.avaliacao_read_repository import AvaliacaoReadRepository
from app.interfaces.repositories.avaliacao_repository import AvaliacaoRepository
from app.interfaces.repositories.checklist_repository import ChecklistRepository
from app.interfaces.repositories.dashboard_repository import DashboardRepository
from app.interfaces.repositories.patient_read_repository import PatientReadRepository
from app.interfaces.repositories.patient_repository import PatientRepository


@pytest.fixture
def mock_dashboard_repo() -> AsyncMock:
    """Async mock of DashboardRepository for k-anonymity use case tests."""
    return AsyncMock(spec=DashboardRepository)


@pytest.fixture
def mock_avaliacao_read_repo() -> AsyncMock:
    """Async mock of AvaliacaoReadRepository for history use case tests."""
    return AsyncMock(spec=AvaliacaoReadRepository)


@pytest.fixture
def mock_patient_read_repo() -> AsyncMock:
    """Async mock of PatientReadRepository for patient list use case tests."""
    return AsyncMock(spec=PatientReadRepository)


@pytest.fixture
def mock_avaliacao_repo() -> AsyncMock:
    """Async mock of AvaliacaoRepository for submit anamnesis tests."""
    return AsyncMock(spec=AvaliacaoRepository)


@pytest.fixture
def mock_checklist_repo() -> AsyncMock:
    """Async mock of ChecklistRepository for submit anamnesis tests."""
    return AsyncMock(spec=ChecklistRepository)


@pytest.fixture
def mock_patient_repo() -> AsyncMock:
    """Async mock of PatientRepository for future patient write tests."""
    return AsyncMock(spec=PatientRepository)


@pytest.fixture
def mock_scoring_orchestrator() -> AsyncMock:
    """Async mock of SymptomScoringOrchestrator for submit anamnesis tests."""
    return AsyncMock(spec=SymptomScoringOrchestrator)


@pytest.fixture
def mock_session() -> AsyncMock:
    """Async mock of AsyncSession for use cases that receive a session directly."""
    return AsyncMock(spec=AsyncSession)
