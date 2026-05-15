"""HTTP router for patient registration and listing.

POST /api/v1/pacientes — register a new patient (requires JWT).
GET  /api/v1/pacientes — list patients registered by the authenticated doctor.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.get_patient_list import GetPatientListUseCase
from app.application.use_cases.register_patient import RegisterPatientUseCase
from app.db.database import get_db_session
from app.interfaces.api.dependencies import AuthenticatedDoctor, get_current_doctor
from app.interfaces.repositories.acompanhante_repository import AcompanhanteRepository
from app.interfaces.repositories.patient_read_repository import PatientReadRepository
from app.interfaces.repositories.patient_repository import PatientRepository
from app.presentation.api.v1.schemas.patient import (
    PatientCreateRequest,
    PatientListItemSchema,
    PatientListResponse,
    PatientResponse,
)

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar novo paciente",
    description=(
        "Cria um novo registro de paciente e, opcionalmente, um acompanhante. "
        "O médico autenticado (extraído do JWT) é registrado como criador. "
        "Requer autenticação via Bearer token."
    ),
)
async def register_patient(
    payload: PatientCreateRequest,
    doctor: AuthenticatedDoctor = Depends(get_current_doctor),
    session: AsyncSession = Depends(get_db_session),
) -> PatientResponse:
    use_case = RegisterPatientUseCase(
        patients=PatientRepository(session),
        acompanhantes=AcompanhanteRepository(session),
    )

    try:
        patient = await use_case.execute(
            request=payload,
            usuario_db_id=doctor.usuario_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    # LGPD: mask full_name in the response
    nome_parts = patient.full_name.split()
    nome_masked = (
        nome_parts[0] + " " + " ".join(p[0] + "***" for p in nome_parts[1:])
        if len(nome_parts) > 1
        else patient.full_name[0] + "***"
    )

    return PatientResponse(
        id=patient.id,
        nome_masked=nome_masked,
        sexo=patient.sex_at_birth.value,
        etnia=patient.etnia.value,
        uf_residencia=patient.uf_residencia,
        criado_por_db_id=patient.criado_por_db_id,
    )


@router.get(
    "",
    response_model=PatientListResponse,
    summary="Listar pacientes do médico logado",
    description=(
        "Retorna lista paginada de pacientes cadastrados pelo médico autenticado. "
        "Busca por nome (ILIKE parcial) ou CPF (hash SHA-256, exato). "
        "Nunca retorna pacientes de outros médicos."
    ),
)
async def list_patients(
    doctor: AuthenticatedDoctor = Depends(get_current_doctor),
    session: AsyncSession = Depends(get_db_session),
    nome: str | None = Query(default=None, description="Busca parcial por nome"),
    cpf: str | None = Query(default=None, description="CPF em dígitos (sem formatação)"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> PatientListResponse:
    use_case = GetPatientListUseCase(patients=PatientReadRepository(session))
    result = await use_case.execute(
        usuario_id=doctor.usuario_id,
        nome_filter=nome,
        cpf_raw_filter=cpf,
        limit=limit,
        offset=offset,
    )
    return PatientListResponse(
        items=[
            PatientListItemSchema(
                id=item.id,
                nome=item.nome,
                sexo=item.sexo,
                data_nascimento=item.data_nascimento,
            )
            for item in result.items
        ],
        total=result.total,
        limit=result.limit,
        offset=result.offset,
    )
