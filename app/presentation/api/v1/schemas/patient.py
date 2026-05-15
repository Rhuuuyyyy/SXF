"""Request/response Pydantic schemas for patient-related endpoints.

LGPD: PatientResponse masks PII fields (CPF, full name) before serialisation.
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AcompanhanteCreateRequest(BaseModel):
    """Optional caregiver/guardian data. Provided when registering a new patient."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    nome: str = Field(min_length=2, max_length=120)
    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    telefone: str = Field(min_length=8, max_length=20)
    email: str = Field(max_length=254)


class PatientCreateRequest(BaseModel):
    """Payload for registering a new patient."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    nome: str = Field(min_length=2, max_length=120)
    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    data_nascimento: date
    sexo: str = Field(pattern="^(M|F|I)$")
    etnia: str
    uf_nascimento: str = Field(min_length=2, max_length=2)
    municipio_residencia: str = Field(min_length=2, max_length=120)
    uf_residencia: str = Field(min_length=2, max_length=2)
    prematuro: bool = False
    idade_gestacional_semanas: int | None = None
    peso_nascimento_gramas: float | None = None
    escolaridade: str | None = None
    tem_diagnostico_autismo: bool = False
    tem_diagnostico_tdah: bool = False
    outras_comorbidades: str | None = None
    medicamentos_uso: str | None = None
    grau_parentesco: str | None = None
    diagnostico_confirmado_fxs: bool | None = None
    acompanhante: AcompanhanteCreateRequest | None = None


class PatientResponse(BaseModel):
    """LGPD-aware response: PII is masked.

    db_id is the physical BIGSERIAL PK exposed for immediate use in child
    endpoints (e.g. POST /avaliacoes) without requiring a second GET call.
    """

    model_config = ConfigDict(extra="forbid")

    id: UUID
    db_id: int = Field(description="ID serial (BIGSERIAL) do paciente no banco de dados")
    nome_masked: str = Field(description="Nome com últimas letras mascaradas")
    sexo: str
    etnia: str
    uf_residencia: str
    criado_por_db_id: int


# ── Patient List Response (Sprint 6) ──────────────────────────────────────────


class PatientListItemSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    nome: str
    sexo: str | None = None
    data_nascimento: str | None = None


class PatientListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PatientListItemSchema]
    total: int
    limit: int
    offset: int
