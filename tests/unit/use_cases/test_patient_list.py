"""Unit tests for GetPatientListUseCase — CPF hashing and pagination."""
from __future__ import annotations

import hashlib
from unittest.mock import AsyncMock

from app.application.use_cases.get_patient_list import GetPatientListUseCase
from app.interfaces.repositories.patient_read_repository import PatientListItem


def _make_item(patient_id: int) -> PatientListItem:
    return PatientListItem(
        id=patient_id,
        nome=f"Paciente {patient_id}",
        sexo="F",
        data_nascimento="2018-03-10",
    )


async def test_cpf_filter_is_hashed_before_reaching_repository(
    mock_patient_read_repo: AsyncMock,
) -> None:
    """Raw CPF must be hashed to SHA-256 HEX before being sent to the repository."""
    mock_patient_read_repo.count_by_doctor.return_value = 0
    mock_patient_read_repo.list_by_doctor.return_value = []
    raw_cpf = "52998224725"  # valid CPF digits
    expected_hash = hashlib.sha256(raw_cpf.encode()).hexdigest()
    use_case = GetPatientListUseCase(patients=mock_patient_read_repo)
    await use_case.execute(usuario_id=1, cpf_raw_filter=raw_cpf)
    call_kwargs = mock_patient_read_repo.list_by_doctor.call_args.kwargs
    assert call_kwargs["cpf_hash_filter"] == expected_hash
    assert "cpf_raw" not in str(call_kwargs)  # raw CPF must NOT be forwarded


async def test_no_cpf_filter_sends_none_to_repository(
    mock_patient_read_repo: AsyncMock,
) -> None:
    """When CPF filter is absent, repository must receive cpf_hash_filter=None."""
    mock_patient_read_repo.count_by_doctor.return_value = 0
    mock_patient_read_repo.list_by_doctor.return_value = []
    use_case = GetPatientListUseCase(patients=mock_patient_read_repo)
    await use_case.execute(usuario_id=1)
    call_kwargs = mock_patient_read_repo.list_by_doctor.call_args.kwargs
    assert call_kwargs["cpf_hash_filter"] is None


async def test_hard_limit_is_capped(
    mock_patient_read_repo: AsyncMock,
) -> None:
    """Limit exceeding HARD_LIMIT must be silently capped."""
    mock_patient_read_repo.count_by_doctor.return_value = 0
    mock_patient_read_repo.list_by_doctor.return_value = []
    use_case = GetPatientListUseCase(patients=mock_patient_read_repo)
    result = await use_case.execute(usuario_id=1, limit=500)
    assert result.limit == GetPatientListUseCase.HARD_LIMIT


async def test_returns_paginated_result(
    mock_patient_read_repo: AsyncMock,
) -> None:
    """Correct total and items are returned in the result."""
    items = [_make_item(i) for i in range(1, 4)]
    mock_patient_read_repo.count_by_doctor.return_value = 3
    mock_patient_read_repo.list_by_doctor.return_value = items
    use_case = GetPatientListUseCase(patients=mock_patient_read_repo)
    result = await use_case.execute(usuario_id=42)
    assert result.total == 3
    assert len(result.items) == 3
