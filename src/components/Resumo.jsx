import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { C } from '../theme';
import { StatRow, MonthFilter } from './UI';
import { STATUS_LEAD, fmtMoney, monthKey, diasDesde } from '../lib/business';

export function ResumoTab({ leads, atividades, vendas, planos, vendedores }) {
  const [mes, setMes] = useState('all');
  const [vendedorAberto, setVendedorAberto] = useState(null);
  const vendasFiltradas = mes === 'all' ? vendas : vendas.filter((v) => monthKey(v.data) === mes);

  const planoPorNome = Object.fromEntries(planos.map((p) => [p.nome, p]));

  const contratado = vendasFiltradas
    .filter((v) => {
      const p = planoPorNome[v.plano];
      return p && p.forma !== 'Recorrência';
    })
    .reduce((s, v) => s + Number(v.valor_total || 0), 0);

  // MRR atual: pega só a venda mais recente de cada contrato recorrente
  // (aluno + plano), em todo o histórico, pra não somar renovações
  // antigas do mesmo contrato como se fossem receita recorrente extra.
  // Usa receita_recebida (o valor da parcela/1º pagamento), não
  // valor_total — em plano recorrente não existe "valor total do
  // contrato" fechado, só a mensalidade que de fato é cobrada.
  const ultimaPorContrato = new Map();
  vendas.forEach((v) => {
    const p = planoPorNome[v.plano];
    if (!p || p.forma !== 'Recorrência') return;
    const chave = `${v.id_lead || v.id}|${v.plano}`;
    const atual = ultimaPorContrato.get(chave);
    if (!atual || new Date(v.data) > new Date(atual.data)) {
      ultimaPorContrato.set(chave, v);
    }
  });
  const recorrenciaMensal = Array.from(ultimaPorContrato.values()).reduce(
    (s, v) => s + Number(v.receita_recebida || 0),
    0
  );

  const projetado = contratado + recorrenciaMensal * 12;
  const receitaCaixa = vendasFiltradas.reduce((s, v) => s + Number(v.receita_recebida || 0), 0);
  const comissaoVend = vendasFiltradas.reduce((s, v) => s + Number(v.comissao_vendedor || 0), 0);
  const comissaoProf = vendasFiltradas.reduce((s, v) => s + Number(v.comissao_professor || 0), 0);

  const leadsAtivos = leads.filter((l) => l.status !== 'Convertido' && l.status !== 'Perdido');
  const semContato = leadsAtivos.filter((l) => {
    const tem = atividades.some((a) => a.id_lead === l.id);
    return !tem && diasDesde(l.data_entrada) > 3;
  });
  const semAtividade7d = leadsAtivos.filter((l) => {
    const ats = atividades.filter((a) => a.id_lead === l.id);
    if (ats.length === 0) return false;
    const ultima = Math.max(...ats.map((a) => new Date(a.data).getTime()));
    return diasDesde(new Date(ultima).toISOString()) > 7;
  });

  const porVendedor = (vendedores || [])
    .map((vd) => {
      const vendasVd = vendasFiltradas.filter((v) => v.id_vendedor === vd.id);
      const leadsVd = leads.filter((l) => l.id_vendedor === vd.id);
      const faturamento = vendasVd
        .filter((v) => {
          const p = planoPorNome[v.plano];
          return p && p.forma !== 'Recorrência';
        })
        .reduce((s, v) => s + Number(v.valor_total || 0), 0);
      const comissao = vendasVd.reduce((s, v) => s + Number(v.comissao_vendedor || 0), 0);
      return {
        vendedor: vd,
        faturamento,
        comissao,
        statusCounts: STATUS_LEAD.map((s) => ({ s, n: leadsVd.filter((l) => l.status === s).length })),
        totalLeads: leadsVd.length,
      };
    })
    .sort((a, b) => b.comissao - a.comissao);

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black" style={{ color: C.text }}>
          Resumo gerencial
        </h2>
        <MonthFilter items={vendas} dateField="data" value={mes} onChange={setMes} />
      </div>

      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.accent }}>
        Faturamento
      </p>
      <div className="rounded-xl px-4 mb-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <StatRow label="Contratado (real)" value={fmtMoney(contratado)} />
        <StatRow label="Receita recebida (caixa)" value={fmtMoney(receitaCaixa)} />
        <StatRow label="Projetado (com recorrência ×12)" value={fmtMoney(projetado)} />
      </div>

      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.accent }}>
        Comissões
      </p>
      <div className="rounded-xl px-4 mb-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <StatRow label="Total vendedores" value={fmtMoney(comissaoVend)} />
        <StatRow label="Total professores" value={fmtMoney(comissaoProf)} />
      </div>

      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.accent }}>
        Funil
      </p>
      <div className="rounded-xl px-4 mb-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        {STATUS_LEAD.map((s) => (
          <StatRow key={s} label={s} value={leads.filter((l) => l.status === s).length} />
        ))}
      </div>

      {porVendedor.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.accent }}>
            Por vendedor
          </p>
          <div className="mb-5">
            {porVendedor.map(({ vendedor: vd, faturamento, comissao, statusCounts, totalLeads }) => {
              const aberto = vendedorAberto === vd.id;
              return (
                <div
                  key={vd.id}
                  className="rounded-xl px-4 mb-2.5"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <button
                    className="w-full flex items-center justify-between py-2.5"
                    onClick={() => setVendedorAberto(aberto ? null : vd.id)}
                  >
                    <span className="font-bold text-sm" style={{ color: C.text }}>
                      {vd.nome}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm" style={{ color: C.accent }}>
                        {fmtMoney(comissao)}
                      </span>
                      {aberto ? (
                        <ChevronUp size={16} style={{ color: C.textMuted }} />
                      ) : (
                        <ChevronDown size={16} style={{ color: C.textMuted }} />
                      )}
                    </span>
                  </button>
                  {aberto && (
                    <div className="pb-2">
                      <StatRow label="Faturamento (contratado)" value={fmtMoney(faturamento)} />
                      <StatRow label="Leads no funil" value={totalLeads} />
                      {statusCounts.map(({ s, n }) => (
                        <StatRow key={s} label={s} value={n} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.red }}>
        Alertas
      </p>
      <div className="rounded-xl px-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <StatRow label="Leads sem 1º contato há +3 dias" value={semContato.length} />
        <StatRow label="Leads sem atividade há +7 dias" value={semAtividade7d.length} />
      </div>
    </div>
  );
}
