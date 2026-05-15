"""Read-only adapter for the anonymised statistics dashboard.

Reads from 'vw_dashboard_anonimizado' (MATERIALIZED VIEW).
The k-anonymity policy (total_avaliacoes >= 5) is enforced in the use case,
not here. This adapter only fetches and returns raw rows.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import cast

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass(frozen=True)
class DashboardRow:
    """One aggregated row from the anonymised dashboard view."""

    uf_residencia: str | None
    sexo: str | None
    faixa_etaria: str | None
    etnia: str | None
    total_avaliacoes: int
    media_score: float | None
    taxa_recomendacao_exame: float | None


class DashboardRepository:
    """Reads from the vw_dashboard_anonimizado materialised view."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_stats(
        self,
        *,
        uf: str | None = None,
        sexo: str | None = None,
        etnia: str | None = None,
    ) -> list[DashboardRow]:
        """Fetch aggregated anonymised statistics with optional filters.

        Filters are applied as WHERE clauses only when provided.
        The k-anonymity check happens in GetDashboardStatsUseCase, not here.
        """
        conditions = []
        params: dict[str, str] = {}
        if uf:
            conditions.append("uf_residencia = :uf")
            params["uf"] = uf
        if sexo:
            conditions.append("sexo = :sexo")
            params["sexo"] = sexo
        if etnia:
            conditions.append("etnia = :etnia")
            params["etnia"] = etnia

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        result = await self._session.execute(
            text(
                f"""
                SELECT uf_residencia,
                       sexo,
                       faixa_etaria,
                       etnia,
                       total_avaliacoes,
                       media_score,
                       taxa_recomendacao_exame
                FROM   vw_dashboard_anonimizado
                {where_clause}
                ORDER  BY total_avaliacoes DESC
                """
            ),
            params,
        )
        rows = result.mappings().all()
        return [
            DashboardRow(
                uf_residencia=cast("str | None", r["uf_residencia"]),
                sexo=cast("str | None", r["sexo"]),
                faixa_etaria=cast("str | None", r["faixa_etaria"]),
                etnia=cast("str | None", r["etnia"]),
                total_avaliacoes=cast(int, r["total_avaliacoes"]),
                media_score=cast("float | None", r["media_score"]),
                taxa_recomendacao_exame=cast("float | None", r["taxa_recomendacao_exame"]),
            )
            for r in rows
        ]

    async def refresh_materialized_view(self) -> None:
        """Trigger a non-blocking refresh of the materialized view.

        Uses CONCURRENTLY so the view remains readable during refresh.
        Requires the view to have a unique index (pre-condition owned by DBA team).
        """
        await self._session.execute(
            text("REFRESH MATERIALIZED VIEW CONCURRENTLY vw_dashboard_anonimizado")
        )
