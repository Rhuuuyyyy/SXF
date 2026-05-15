"""Unit tests for GetPatientHistoryUseCase — pagination and RBAC forwarding."""
from __future__ import annotations

from datetime import datetime
from unittest.mock import AsyncMock

from app.application.use_cases.get_patient_history import GetPatientHistoryUseCase
from app.interfaces.repositories.avaliacao_read_repository import AvaliacaoHistoricoItem


def _make_item(avaliacao_id: int) -> AvaliacaoHistoricoItem:
    return AvaliacaoHistoricoItem(
        avaliacao_id=avaliacao_id,
        paciente_id=1,
        usuario_id=42,
        data_avaliacao=datetime(2025, 1, avaliacao_id),
        score_final=7.5,
        recomenda_exame=True,
    )


async def test_returns_empty_list_for_patient_with_no_evaluations(
    mock_avaliacao_read_repo: AsyncMock,
) -> None:
    """Patient with no evaluations returns empty list, no error."""
    mock_avaliacao_read_repo.count_by_paciente.return_value = 0
    mock_avaliacao_read_repo.list_by_paciente.return_value = []
    use_case = GetPatientHistoryUseCase(avaliacoes=mock_avaliacao_read_repo)
    result = await use_case.execute(paciente_id=1, usuario_id=42)
    assert result.items == []
    assert result.total == 0


async def test_hard_cap_on_limit_is_enforced(
    mock_avaliacao_read_repo: AsyncMock,
) -> None:
    """Limit > 200 must be capped silently at 200."""
    mock_avaliacao_read_repo.count_by_paciente.return_value = 0
    mock_avaliacao_read_repo.list_by_paciente.return_value = []
    use_case = GetPatientHistoryUseCase(avaliacoes=mock_avaliacao_read_repo)
    result = await use_case.execute(paciente_id=1, usuario_id=42, limit=9999)
    assert result.limit == 200
    call_kwargs = mock_avaliacao_read_repo.list_by_paciente.call_args.kwargs
    assert call_kwargs["limit"] == 200


async def test_usuario_id_is_forwarded_to_repository(
    mock_avaliacao_read_repo: AsyncMock,
) -> None:
    """RBAC: usuario_id from the JWT must be forwarded to both repo methods."""
    mock_avaliacao_read_repo.count_by_paciente.return_value = 1
    mock_avaliacao_read_repo.list_by_paciente.return_value = [_make_item(1)]
    use_case = GetPatientHistoryUseCase(avaliacoes=mock_avaliacao_read_repo)
    await use_case.execute(paciente_id=5, usuario_id=99)
    mock_avaliacao_read_repo.count_by_paciente.assert_called_once_with(
        paciente_id=5, usuario_id=99
    )
    mock_avaliacao_read_repo.list_by_paciente.assert_called_once_with(
        paciente_id=5, usuario_id=99, limit=50, offset=0
    )
