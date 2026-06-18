import React from 'react';
import { LogOut, ClipboardList, ShoppingBag, Clock, Trophy, AlertTriangle, Settings } from 'lucide-react';
import { C } from '../theme';
import { OwlMark } from './UI';

export function Header({ perfil, onSair }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 sticky top-0 z-30"
      style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}
    >
      <div className="flex items-center gap-2.5">
        <OwlMark size={26} />
        <div>
          <p className="text-sm font-black leading-tight" style={{ color: C.text }}>
            CORPO E AÇÃO
          </p>
          <p className="text-[11px] font-bold" style={{ color: C.accent }}>
            {perfil.nome} · {perfil.perfil}
          </p>
        </div>
      </div>
      <button onClick={onSair} className="p-2 rounded-full" style={{ color: C.textMuted }}>
        <LogOut size={18} />
      </button>
    </div>
  );
}

export function TabBar({ active, setActive, isGestor }) {
  const tabs = [
    { id: 'leads', label: 'Leads', icon: ClipboardList },
    { id: 'vendas', label: 'Vendas', icon: ShoppingBag },
    { id: 'ponto', label: 'Ponto', icon: Clock },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
  ];
  if (isGestor) tabs.push({ id: 'resumo', label: 'Resumo', icon: AlertTriangle });
  if (isGestor) tabs.push({ id: 'config', label: 'Config', icon: Settings });
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-center z-30"
      style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}
    >
      <div className="w-full max-w-md flex">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5"
              style={{ color: isActive ? C.accent : C.textMuted }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wide">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
