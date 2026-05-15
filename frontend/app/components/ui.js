"use client";

// ── PILL ──────────────────────────────────────────────────────────────────
export function Pill({ tone = "neutral", children, dot = true }) {
  const toneStyles = {
    neutral: {
      background: "var(--paper-2)",
      color: "var(--ink-2)",
      border: "1px solid transparent",
      dotColor: "var(--muted)",
    },
    honey: {
      background: "var(--ink)",
      color: "var(--on-ink)",
      border: "1px solid transparent",
      dotColor: "var(--on-ink)",
    },
    sage: {
      background: "var(--surface)",
      color: "var(--ink)",
      border: "1px solid var(--ink)",
      dotColor: "var(--ink)",
    },
    rust: {
      background: "var(--surface)",
      color: "var(--ink)",
      border: "1px solid var(--hair)",
      dotColor: "var(--ink)",
    },
    ink: {
      background: "var(--ink)",
      color: "var(--on-ink)",
      border: "1px solid transparent",
      dotColor: "var(--on-ink)",
    },
  };

  const s = toneStyles[tone] || toneStyles.neutral;

  return (
    <span
      className="rounded-full px-2.5 py-[3px] text-[11px] font-medium tracking-tight inline-flex items-center gap-1.5"
      style={{
        background: s.background,
        color: s.color,
        border: s.border,
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: s.dotColor }}
        />
      )}
      {children}
    </span>
  );
}

// ── BTN PRIMARY ───────────────────────────────────────────────────────────
export function BtnPrimary({ children, onClick, type = "button", className = "", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-2.5 text-[13px] font-medium lift inline-flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      style={{
        background: "var(--ink)",
        color: "var(--on-ink)",
        border: "none",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ink-2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--ink)"; }}
    >
      {children}
    </button>
  );
}

// ── BTN GHOST ─────────────────────────────────────────────────────────────
export function BtnGhost({ children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-[13px] font-medium lift inline-flex items-center gap-2 ${className}`}
      style={{
        background: "transparent",
        color: "var(--ink)",
        border: "1px solid var(--hair)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-tint)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

// ── CARD ──────────────────────────────────────────────────────────────────
export function Card({ children, className = "", interactive = false, style = {} }) {
  return (
    <div
      className={`rounded-3xl card-shadow ${interactive ? "card-shadow-hover cursor-pointer lift" : ""} ${className}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--hair-soft)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── FIELD ─────────────────────────────────────────────────────────────────
export function Field({ label, required = false, children, error }) {
  return (
    <div className="mb-4">
      <label
        className="block text-[11px] font-medium uppercase tracking-[0.12em] mb-1.5"
        style={{ color: "var(--muted)" }}
      >
        {label}
        {required && (
          <span className="ml-0.5 normal-case" style={{ color: "var(--rust)" }}>
            {" "}*
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-[12px] mt-1.5" style={{ color: "var(--rust)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── INPUT STYLE CONSTANTS ─────────────────────────────────────────────────
export const inputCls = "w-full rounded-2xl px-4 py-3 text-[14px] outline-none focus-ink lift";
export const inputStyle = {
  border: "1px solid var(--hair)",
  color: "var(--ink)",
  background: "var(--surface)",
};
export const selectCls = inputCls + " appearance-none";
