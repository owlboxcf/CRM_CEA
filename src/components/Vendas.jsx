import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { C, inputStyle } from '../theme';
import { Field, Input, Select, Sheet, PrimaryButton, MonthFilter } from './UI';
import { TURNOS, TIPOS_TRANSACAO, fmtMoney, monthKey, calcVenda } from '../lib/business';

export function VendaForm({ leadId, leads, planos, onClose, onSave, meuPerfil }) {
  const [idLead, setIdLead] = useState(leadId || '');
  const [planoNome, setPlanoNome] = useState('');
  const [tipo, setTipo] = useState('Nova');
  const [turno, setTurno] = useState('');
  const [professor, setProfessor] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [receita, setReceita] = useState('');
  const [completa, setCompleta] = useState('Completa');
  const [salvando, setSalvando] = useState(false);

  const planoObj = planos.find((p) => p.nome === planoNome);
  const preview = planoObj ? calcVenda(planoObj, tipo) : null;

  async function submit() {
    if (!idLead || !planoNome || !valorTotal) return;
    setSalvando(true);
    try {
      const calc = calcVenda(planoObj, tipo);
      await onSave({
        id_lead: idLead,
        id_vendedor: meuPerfil.id,
        professor,
        plano: planoNome,
        tipo_transacao: tipo,
        turno,
        valor_total: Number(valorTotal),
        receita_recebida: Number(receita || valorTotal),
        venda_completa: completa,
        pontos: calc.pontos,
        comissao_vendedor: calc.comissaoVendedor,
        comissao_professor: calc.comissaoProfessor,
      });
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet title="Registrar venda" onClose={onClose}>
      {!leadId && (
        <Field label="Lead">
          <select
            value={idLead}
            onChange={(e) => setIdLead(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm"
            style={inputStyle}
          >
            <option value="">Selecione...</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Plano">
        <Select value={planoNome} onChange={setPlanoNome} options={planos.map((p) => p.nome)} />
      </Field>
      <Field label="Tipo de transação">
        <Select value={tipo} onChange={setTipo} options={TIPOS_TRANSACAO} />
      </Field>
      <Field label="Turno do aluno">
        <Select value={turno} onChange={setTurno} options={TURNOS} />
      </Field>
      <Field label="Professor responsável">
        <Input value={professor} onChange={setProfessor} placeholder="Nome do professor" />
      </Field>
      <Field label="Valor total do contrato (R$)">
        <Input value={valorTotal} onChange={setValorTotal} placeholder="0,00" type="number" />
      </Field>
      <Field label="Receita recebida agora (R$)">
        <Input value={receita} onChange={setReceita} placeholder="0,00" type="number" />
      </Field>
      <Field label="Venda completa? (avaliação + ficha)">
        <Select value={completa} onChange={setCompleta} options={['Completa', 'Incompleta']} />
      </Field>
      {preview && (
        <div className="rounded-lg p-3 mb-4 text-sm" style={{ backgroundColor: C.surfaceAlt, color: C.accentSoft }}>
          Pontos: <strong>{preview.pontos}</strong> · Sua comissão: <strong>{fmtMoney(preview.comissaoVendedor)}</strong>
          {preview.comissaoProfessor > 0 && (
            <>
              {' '}
              · Comissão professor: <strong>{fmtMoney(preview.comissaoProfessor)}</strong>
            </>
          )}
        </div>
      )}
      <PrimaryButton onClick={submit} disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar venda'}
      </PrimaryButton>
    </Sheet>
  );
}

export function VendasTab({ vendas, leads, onAddVenda }) {
  const [mes, setMes] = useState('all');
  const filtradas = mes === 'all' ? vendas : vendas.filter((v) => monthKey(v.data) === mes);
  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-black" style={{ color: C.text }}>
          Vendas
        </h2>
        <button onClick={onAddVenda} className="rounded-full p-2.5" style={{ backgroundColor: C.accent, color: C.bg }}>
          <Plus size={18} />
        </button>
      </div>
      <div className="mb-4">
        <MonthFilter items={vendas} dateField="data" value={mes} onChange={setMes} />
      </div>
      {filtradas.length === 0 && (
        <p className="text-sm mt-10 text-center" style={{ color: C.textMuted }}>
          Nenhuma venda nesse período.
        </p>
      )}
      {filtradas
        .slice()
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .map((v) => {
          const lead = leads.find((l) => l.id === v.id_lead);
          return (
            <div key={v.id} className="rounded-xl px-4 py-3.5 mb-2.5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm" style={{ color: C.text }}>
                  {lead ? lead.nome : v.id_lead ? '...' : 'Lead removido'}
                </p>
                <p className="font-mono font-bold text-sm" style={{ color: C.accent }}>
                  {fmtMoney(v.valor_total)}
                </p>
              </div>
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                {v.plano} · {v.tipo_transacao} · {v.pontos} pt · comissão {fmtMoney(v.comissao_vendedor)}
              </p>
            </div>
          );
        })}
    </div>
  );
}
