"""Unit tests for GetDashboardStatsUseCase — focused on k-anonymity policy.

These tests verify the business rule WITHOUT touching a real database.
The DashboardRepository is replaced by an AsyncMock configured per test.
"""
from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from app.application.use_cases.get_dashboard_stats import (
    K_ANONYMITY_THRESHOLD,
    GetDashboardStatsUseCase,
)
from app.core.exceptions import LGPDComplianceError
from app.interfaces.repositories.dashboard_repository import DashboardRow


def _make_row(total: int) -> DashboardRow:
    """Helper: minimal DashboardRow with only total_avaliacoes filled."""
    return DashboardRow(
        uf_residencia="SP",
        sexo="M",
        faixa_etaria="6-10",
        etnia=None,
        total_avaliacoes=total,
        media_score=None,
        taxa_recomendacao_exame=None,
    )


async def test_raises_lgpd_error_when_single_row_below_threshold(
    mock_dashboard_repo: AsyncMock,
) -> None:
    """A single row with total < 5 must raise LGPDComplianceError."""
    mock_dashboard_repo.get_stats.return_value = [_make_row(3)]
    use_case = GetDashboardStatsUseCase(dashboard=mock_dashboard_repo)
    with pytest.raises(LGPDComplianceError):
        await use_case.execute()


async def test_raises_lgpd_error_when_any_row_below_threshold_in_mixed_list(
    mock_dashboard_repo: AsyncMock,
) -> None:
    """Even one offending row in a larger result must suppress the entire response."""
    mock_dashboard_repo.get_stats.return_value = [
        _make_row(10),  # OK
        _make_row(4),   # violation — below threshold
        _make_row(20),  # OK
    ]
    use_case = GetDashboardStatsUseCase(dashboard=mock_dashboard_repo)
    with pytest.raises(LGPDComplianceError):
        await use_case.execute()


async def test_returns_result_when_all_rows_meet_threshold(
    mock_dashboard_repo: AsyncMock,
) -> None:
    """All rows >= 5: use case must return data without raising."""
    rows = [_make_row(5), _make_row(10), _make_row(100)]
    mock_dashboard_repo.get_stats.return_value = rows
    use_case = GetDashboardStatsUseCase(dashboard=mock_dashboard_repo)
    result = await use_case.execute()
    assert result.total_rows == 3
    assert len(result.rows) == 3


async def test_exactly_threshold_is_allowed(
    mock_dashboard_repo: AsyncMock,
) -> None:
    """Boundary: total_avaliacoes == K_ANONYMITY_THRESHOLD must pass."""
    mock_dashboard_repo.get_stats.return_value = [_make_row(K_ANONYMITY_THRESHOLD)]
    use_case = GetDashboardStatsUseCase(dashboard=mock_dashboard_repo)
    result = await use_case.execute()
    assert result.total_rows == 1


async def test_empty_result_does_not_raise(
    mock_dashboard_repo: AsyncMock,
) -> None:
    """Empty response from view (no data yet) must not raise LGPDComplianceError."""
    mock_dashboard_repo.get_stats.return_value = []
    use_case = GetDashboardStatsUseCase(dashboard=mock_dashboard_repo)
    result = await use_case.execute()
    assert result.total_rows == 0


async def test_filters_are_forwarded_to_repository(
    mock_dashboard_repo: AsyncMock,
) -> None:
    """Filters passed to execute() must be forwarded verbatim to the repo."""
    mock_dashboard_repo.get_stats.return_value = [_make_row(50)]
    use_case = GetDashboardStatsUseCase(dashboard=mock_dashboard_repo)
    await use_case.execute(uf="SP", sexo="F", etnia="Parda")
    mock_dashboard_repo.get_stats.assert_called_once_with(
        uf="SP", sexo="F", etnia="Parda"
    )
