"""Unit tests for SubmitAnamnesisUseCase — orchestration and scoring delegation.

Verifies that the use case correctly coordinates the four repository
operations: create_rascunho → open_log_analise → insert_respostas → execute_scoring.
Score calculation is delegated to the DB function (not tested here).
"""
from __future__ import annotations

from unittest.mock import AsyncMock

from app.application.dtos.anamnesis import ChecklistItemDTO, SubmitAnamnesisDTO
from app.application.use_cases.submit_anamnesis import SubmitAnamnesisUseCase


def _make_dto(paciente_id: int = 1) -> SubmitAnamnesisDTO:
    return SubmitAnamnesisDTO(
        paciente_id=paciente_id,
        sessao_id=1,
        observacoes="",
        diagnostico_previo_fxs=False,
        respostas=[
            ChecklistItemDTO(sintoma_id=1, presente=True),
            ChecklistItemDTO(sintoma_id=2, presente=False),
        ],
    )


async def test_creates_rascunho_before_inserting_respostas(
    mock_avaliacao_repo: AsyncMock,
    mock_checklist_repo: AsyncMock,
    mock_scoring_orchestrator: AsyncMock,
    mock_session: AsyncMock,
) -> None:
    """create_rascunho must be called, and its return value used as avaliacao_id."""
    mock_avaliacao_repo.create_rascunho.return_value = 99
    use_case = SubmitAnamnesisUseCase(
        avaliacoes=mock_avaliacao_repo,
        checklist=mock_checklist_repo,
        scoring=mock_scoring_orchestrator,
    )
    await use_case.execute(request=_make_dto(), usuario_id=42, session=mock_session)
    mock_avaliacao_repo.create_rascunho.assert_called_once()
    call_kwargs = mock_checklist_repo.insert_respostas.call_args.kwargs
    assert call_kwargs["avaliacao_id"] == 99


async def test_all_four_steps_are_executed(
    mock_avaliacao_repo: AsyncMock,
    mock_checklist_repo: AsyncMock,
    mock_scoring_orchestrator: AsyncMock,
    mock_session: AsyncMock,
) -> None:
    """Full orchestration: rascunho → log_analise → respostas → scoring."""
    mock_avaliacao_repo.create_rascunho.return_value = 7
    use_case = SubmitAnamnesisUseCase(
        avaliacoes=mock_avaliacao_repo,
        checklist=mock_checklist_repo,
        scoring=mock_scoring_orchestrator,
    )
    await use_case.execute(request=_make_dto(), usuario_id=42, session=mock_session)
    mock_avaliacao_repo.create_rascunho.assert_called_once()
    mock_avaliacao_repo.open_log_analise.assert_called_once()
    mock_checklist_repo.insert_respostas.assert_called_once()
    mock_scoring_orchestrator.execute_scoring.assert_called_once()


async def test_respostas_forwarded_verbatim_to_checklist_repo(
    mock_avaliacao_repo: AsyncMock,
    mock_checklist_repo: AsyncMock,
    mock_scoring_orchestrator: AsyncMock,
    mock_session: AsyncMock,
) -> None:
    """The checklist items from the DTO must reach the checklist repository unchanged."""
    mock_avaliacao_repo.create_rascunho.return_value = 1
    dto = _make_dto()
    use_case = SubmitAnamnesisUseCase(
        avaliacoes=mock_avaliacao_repo,
        checklist=mock_checklist_repo,
        scoring=mock_scoring_orchestrator,
    )
    await use_case.execute(request=dto, usuario_id=42, session=mock_session)
    call_kwargs = mock_checklist_repo.insert_respostas.call_args.kwargs
    assert call_kwargs["respostas"] == dto.respostas
