import React, { useState } from 'react';
import { C } from '../theme';
import { StatRow, MonthFilter } from './UI';
import { calcularSessoes, dayKeyLocal, dayLabel, fmtHoras, monthKey } from '../lib/business';

function PontoVendedorView({ pontos, meuPerfil, onRegistrar }) {
  const [registrando, setRegistrando] = useState(false);
  const meus = pontos.filter((p) => p.id_vendedor === meuPerfil.id);
  const ordenados = [...meus].sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
  const ultimo = ordenados[0];
  const clockedIn = !!ultimo && ultimo.tipo === 'Entrada';

  const { sessoes } = calcularSessoes(meus);
  const porDia = {};
  sessoes.forEach((s) => {
    const k = dayKeyLocal(s.entrada);
    porDia[k] = (porDia[k] || 0) + s.horas;
  });
  const diasOrdenados = Object.entries(porDia).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const totalMesAtual = sessoes
    .filter((s) => monthKey(s.entrada) === monthKey(new Date().toISOString()))
    .reduce((sum, s) => sum + s.horas, 0);

  async function registrar() {
    setRegistrando(true);
    try {
      await onRegistrar(clockedIn ? 'Saída' : 'Entrada');
    } finally {
      setRegistrando(false);
    }
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <h2 className="text-xl font-black mb-4" style={{ color: C.text }}>
        Ponto
      </h2>

      <div className="rounded-xl p-5 mb-5 text-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        {clockedIn ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.green }}>
              Trabalhando desde
            </p>
            <p className="text-2xl font-black font-mono mt-1" style={{ color: C.text }}>
              {new Date(ultimo.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </>
        ) : (
          <p className="text-sm" style={{ color: C.textMuted }}>
            Seu ponto está fechado
          </p>
        )}
        <button
          onClick={registrar}
          disabled={registrando}
          className="w-full mt-4 rounded-lg py-3 font-bold uppercase tracking-wide text-sm disabled:opacity-50"
          style={{ backgroundColor: clockedIn ? C.red : C.accent, color: clockedIn ? C.text : C.bg }}
        >
          {registrando ? 'Registrando...' : clockedIn ? 'Registrar saída' : 'Registrar entrada'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.textMuted }}>
          Horas este mês
        </p>
        <p className="font-mono font-black" style={{ color: C.accent }}>
          {fmtHoras(totalMesAtual)}
        </p>
      </div>

      <div className="rounded-xl px-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        {diasOrdenados.length === 0 && (
          <p className="text-sm py-3" style={{ color: C.textMuted }}>
            Nenhum dia registrado ainda.
          </p>
        )}
        {diasOrdenados.map(([dia, horas]) => (
          <StatRow key={dia} label={dayLabel(dia)} value={fmtHoras(horas)} />
        ))}
      </div>
    </div>
  );
}

function PontoGestorView({ pontos, vendedores }) {
  const [mes, setMes] = useState('all');
  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black" style={{ color: C.text }}>
          Ponto da equipe
        </h2>
        <MonthFilter items={pontos} dateField="data_hora" value={mes} onChange={setMes} />
      </div>
      {vendedores.map((v) => {
        const todosOMeus = pontos.filter((p) => p.id_vendedor === v.id);
        const { sessoes } = calcularSessoes(todosOMeus);
        const sessoesFiltradas = mes === 'all' ? sessoes : sessoes.filter((s) => monthKey(s.entrada) === mes);
        const total = sessoesFiltradas.reduce((s, x) => s + x.horas, 0);
        const ultimo = [...todosOMeus].sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))[0];
        const dentro = !!ultimo && ultimo.tipo === 'Entrada';
        return (
          <div key={v.id} className="rounded-xl p-4 mb-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-sm" style={{ color: C.text }}>
                {v.nome}
              </p>
              <span className="text-xs font-bold" style={{ color: dentro ? C.green : C.textMuted }}>
                {dentro ? '● trabalhando' : '○ fora'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: C.textMuted }}>
                Total no período
              </span>
              <span className="font-mono font-black" style={{ color: C.accent }}>
                {fmtHoras(total)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PontoTab({ pontos, meuPerfil, isGestor, vendedores, onRegistrar }) {
  if (isGestor) return <PontoGestorView pontos={pontos} vendedores={vendedores} />;
  return <PontoVendedorView pontos={pontos} meuPerfil={meuPerfil} onRegistrar={onRegistrar} />;
}
