"use client";

import { useState } from "react";
import Icons from "./Icons";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function CalendarWidget({ marks = {} }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today.getDate());

  function changeMonth(dir) {
    let m = month + dir;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setMonth(m);
    setYear(y);
  }

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();
  const cells       = [];

  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, current: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, current: true });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++)
    cells.push({ day: d, current: false });

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full lift"
          style={{ border: "1px solid var(--hair)", color: "var(--ink)" }}
        >
          {Icons.chevronLeft}
        </button>
        <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="w-8 h-8 flex items-center justify-center rounded-full lift"
          style={{ border: "1px solid var(--hair)", color: "var(--ink)" }}
        >
          {Icons.chevronRight}
        </button>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Day headers */}
        {DAYS.map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium py-1"
            style={{ color: "var(--subtle)" }}
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((c, i) => {
          const isToday =
            c.current &&
            c.day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const isSel = c.current && c.day === selected && !isToday;
          const isMarked = c.current && marks[c.day] && !isToday && !isSel;

          return (
            <button
              key={i}
              onClick={() => c.current && setSelected(c.day)}
              className="flex flex-col items-center justify-center aspect-square rounded-lg text-[12px] transition-all"
              style={{
                opacity: !c.current ? 0.3 : 1,
                cursor: c.current ? "pointer" : "default",
                background: isToday
                  ? "var(--ink)"
                  : isSel
                  ? "var(--muted)"
                  : "transparent",
                color: isToday || isSel ? "var(--on-ink)" : "var(--ink)",
                fontWeight: isToday ? "700" : "normal",
              }}
            >
              {c.day}
              {isMarked && (
                <span
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{ background: "var(--ink)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
