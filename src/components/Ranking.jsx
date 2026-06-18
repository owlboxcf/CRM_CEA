import React from 'react';
import { C } from '../theme';
import { fmtMoney } from '../lib/business';

const MEDAL_COLOR = ['#E8A23D', '#C9C2B4', '#8A6B3E'];

export function RankingTab({ ranking, vendas, isGestor }) {
  const ordenado = [...ranking].sort((a, b) => b.pontos - a.pontos);

  return (
    <div className="px-4 pt-4 pb-24">
      <h2 className="text-xl font-black mb-4" style={{ color: C.text }}>
        Ranking
      </h2>
      {ordenado.map((v, i) => {
        const comissao = isGestor
          ? vendas.filter((x) => x.id_vendedor === v.id).reduce((s, x) => s + Number(x.comissao_vendedor || 0), 0)
          : null;
        return (
          <div
            key={v.id}
            className="flex items-center gap-3 rounded-xl px-4 py-3.5 mb-2.5"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
              style={{ backgroundColor: MEDAL_COLOR[i] || C.surfaceAlt, color: C.bg }}
            >
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: C.text }}>
                {v.nome}
              </p>
              <p className="text-xs" style={{ color: C.textMuted }}>
                {v.total_vendas} vendas
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono font-black" style={{ color: C.accent }}>
                {v.pontos} pt
              </p>
              {isGestor && (
                <p className="text-xs font-mono" style={{ color: C.textMuted }}>
                  {fmtMoney(comissao)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
