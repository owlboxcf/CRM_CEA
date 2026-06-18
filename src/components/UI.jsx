import React from 'react';
import { X } from 'lucide-react';
import { C, inputStyle } from '../theme';
import { monthKey, monthLabel } from '../lib/business';

export function OwlMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="27" rx="15" ry="17" fill={C.accent} opacity="0.18" />
      <path d="M10 15 L17 10 L19 17 Z" fill={C.accent} />
      <path d="M38 15 L31 10 L29 17 Z" fill={C.accent} />
      <circle cx="16.5" cy="21" r="7.5" fill={C.accent} />
      <circle cx="31.5" cy="21" r="7.5" fill={C.accent} />
      <circle cx="16.5" cy="21" r="2.6" fill={C.bg} />
      <circle cx="31.5" cy="21" r="2.6" fill={C.bg} />
      <path d="M24 24 L20.5 30.5 L27.5 30.5 Z" fill={C.accent} />
    </svg>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Novo: C.textMuted,
    'Em Contato': C.accent,
    Interessado: C.accent,
    'Visita Agendada': C.accentSoft,
    Visitou: C.accentSoft,
    Convertido: C.green,
    Perdido: C.red,
  };
  const color = map[status] || C.textMuted;
  return (
    <span
      className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full"
      style={{ color: C.bg, backgroundColor: color }}
    >
      {status}
    </span>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: C.textMuted }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border px-3 py-2.5 text-sm"
      style={inputStyle}
    >
      <option value="">Selecione...</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border px-3 py-2.5 text-sm"
      style={inputStyle}
    />
  );
}

export function PrimaryButton({ children, onClick, type = 'button', full = true, disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${full ? 'w-full' : ''} font-bold uppercase tracking-wide text-sm rounded-lg py-3 active:opacity-80 disabled:opacity-50`}
      style={{ backgroundColor: C.accent, color: C.bg }}
    >
      {children}
    </button>
  );
}

export function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full max-w-md rounded-t-2xl max-h-[88vh] overflow-y-auto" style={{ backgroundColor: C.surface }}>
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
        >
          <h2 className="text-lg font-black" style={{ color: C.text }}>
            {title}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full" style={{ color: C.textMuted }}>
            <X size={22} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
      <span className="text-sm" style={{ color: C.textMuted }}>
        {label}
      </span>
      <span className="font-mono font-bold text-sm" style={{ color: C.text }}>
        {value}
      </span>
    </div>
  );
}

export function MonthFilter({ items, dateField, value, onChange }) {
  const months = Array.from(new Set(items.map((i) => monthKey(i[dateField])))).sort().reverse();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border px-2.5 py-1.5 text-xs font-bold"
      style={inputStyle}
    >
      <option value="all">Todos os meses</option>
      {months.map((m) => (
        <option key={m} value={m}>
          {monthLabel(m)}
        </option>
      ))}
    </select>
  );
}
