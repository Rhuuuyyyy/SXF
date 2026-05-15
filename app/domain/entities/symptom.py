"""Symptom domain entity (catalogue item used by the FXS anamnesis).

A Symptom is a stable, addressable trait that a doctor can mark as
present/absent on a ``ChecklistResponse``. The catalogue is read-mostly:
new symptoms are introduced by clinical experts, not at request time.
"""
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class SymptomCategory(StrEnum):
    """Top-level grouping shown to the doctor on the anamnesis form."""

    PHYSICAL = "physical"
    BEHAVIORAL = "behavioral"
    COGNITIVE = "cognitive"
    FAMILY_HISTORY = "family_history"


class AgeRelevance(StrEnum):
    """Whether the symptom is meaningful for paediatric, adult, or any patient."""

    PEDIATRIC = "pediatric"
    ADULT = "adult"
    ANY = "any"


class Symptom(BaseModel):
    """A single trait checked during an FXS evaluation."""

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )

    id: UUID = Field(default_factory=uuid4)
    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=2000)
    category: SymptomCategory
    weight: int = Field(ge=0, le=10)
    age_relevance: AgeRelevance = AgeRelevance.ANY
    is_active: bool = True

    def applies_to_age(self, age_years: int) -> bool:
        if self.age_relevance is AgeRelevance.ANY:
            return True
        if self.age_relevance is AgeRelevance.PEDIATRIC:
            return age_years < 18
        return age_years >= 18
