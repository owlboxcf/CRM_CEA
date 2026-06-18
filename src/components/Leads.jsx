import React, { useState } from 'react';
import { Plus, Phone, ShoppingBag, ChevronRight } from 'lucide-react';
import { C, inputStyle } from '../theme';
import { Field, Input, Select, Sheet, PrimaryButton, StatusBadge } from './UI';
import { TURNOS, fmtDate, fmtMoney } from '../lib/business';

export function LeadForm({ onClose, onSave, meuPerfil, isGestor, vendedores, canaisCaptacao }) {
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [canal, setCanal] = useState('');
  const [turno, setTurno] = useState('');
  const [idVendedor, setIdVendedor] = useState(isGestor ? '' : meuPerfil.id);
  const [salvando, setSalvando] = useState(false);

  async function submit() {
    if (!nome || !idVendedor) return;
    setSalvando(true);
    try {
      await onSave({
        nome,
        contato,
        canal,
        turno,
        id_vendedor: idVendedor,
        status: 'Novo',
      });
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet title="Novo lead" onClose={onClose}>
      <Field label="Nome">
        <Input value={nome} onChange={setNome} placeholder="Nome da pessoa" />
      </Field>
      <Field label="Contato (telefone / @)">
        <Input value={contato} onChange={setContato} placeholder="(19) 99999-0000" />
      </Field>
      <Field label="Canal de captação">
        <Select value={canal} onChange={setCanal} options={canaisCaptacao} />
      </Field>
      <Field label="Turno de interesse">
        <Select value={turno} onChange={setTurno} options={TURNOS} />
      </Field>
      {isGestor && (
        <Field label="Vendedor responsável">
          <select
            value={idVendedor}
            onChange={(e) => setIdVendedor(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm"
            style={inputStyle}
          >
            <option value="">Selecione...</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="mt-2">
        <PrimaryButton onClick={submit} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar lead'}
        </PrimaryButton>
      </div>
    </Sheet>
  );
}

export function AtividadeForm({ leadId, onClose, onSave, meuPerfil, canaisContato, resultados }) {
  const [canal, setCanal] = useState('');
  const [resultado, setResultado] = useState('');
  const [proximaAcao, setProximaAcao] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function submit() {
    if (!resultado) return;
    setSalvando(true);
    try {
      await onSave({
        id_lead: leadId,
        id_vendedor: meuPerfil.id,
        canal,
        resultado,
        proxima_acao: proximaAcao,
      });
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet title="Registrar contato" onClose={onClose}>
      <Field label="Canal usado">
        <Select value={canal} onChange={setCanal} options={canaisContato} />
      </Field>
      <Field label="Resultado">
        <Select value={resultado} onChange={setResultado} options={resultados} />
      </Field>
      <Field label="Próxima ação (opcional)">
        <Input value={proximaAcao} onChange={setProximaAcao} placeholder="Ex: ligar de novo sexta" />
      </Field>
      <div className="mt-2">
        <PrimaryButton onClick={submit} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar contato'}
        </PrimaryButton>
      </div>
    </Sheet>
  );
}

export function LeadDetail({ lead, atividades, vendas, onClose, onAddAtividade, onAddVenda, onDelete }) {
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const minhasAtividades = atividades
    .filter((a) => a.id_lead === lead.id)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  const minhasVendas = vendas.filter((v) => v.id_lead === lead.id);

  async function confirmarExclusao() {
    setExcluindo(true);
    try {
      await onDelete(lead.id);
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <Sheet title={lead.nome} onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <StatusBadge status={lead.status} />
        <span className="text-xs" style={{ color: C.textMuted }}>
          {lead.canal} · {lead.turno} · desde {fmtDate(lead.data_entrada)}
        </span>
      </div>
      <p className="text-sm mb-5" style={{ color: C.text }}>
        {lead.contato || 'Sem contato registrado'}
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={onAddAtividade}
          className="flex-1 rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-1.5"
          style={{ backgroundColor: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}
        >
          <Phone size={15} /> Registrar contato
        </button>
        <button
          onClick={onAddVenda}
          className="flex-1 rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-1.5"
          style={{ backgroundColor: C.accent, color: C.bg }}
        >
          <ShoppingBag size={15} /> Registrar venda
        </button>
      </div>

      {minhasVendas.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.textMuted }}>
            Vendas
          </p>
          {minhasVendas.map((v) => (
            <div key={v.id} className="text-sm py-2" style={{ borderBottom: `1px solid ${C.border}`, color: C.text }}>
              {v.plano} · {v.tipo_transacao} · {fmtMoney(v.valor_total)}
            </div>
          ))}
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.textMuted }}>
          Histórico de contato
        </p>
        {minhasAtividades.length === 0 && (
          <p className="text-sm" style={{ color: C.textMuted }}>
            Nenhum contato registrado ainda.
          </p>
        )}
        {minhasAtividades.map((a) => (
          <div key={a.id} className="text-sm py-2" style={{ borderBottom: `1px solid ${C.border}`, color: C.text }}>
            <span style={{ color: C.textMuted }}>{fmtDate(a.data)}</span> · {a.canal} · {a.resultado}
          </div>
        ))}
      </div>

      {!confirmando ? (
        <button onClick={() => setConfirmando(true)} className="w-full text-sm font-bold py-2.5" style={{ color: C.red }}>
          Excluir lead
        </button>
      ) : (
        <div className="rounded-lg p-3" style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.red}` }}>
          <p className="text-sm mb-3" style={{ color: C.text }}>
            Excluir {lead.nome}? Isso remove o lead e o histórico de contato dele
            {minhasVendas.length > 0 ? ', mas mantém as vendas já registradas (ficam sem o lead vinculado).' : '.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmando(false)}
              className="flex-1 rounded-lg py-2 text-sm font-bold"
              style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="flex-1 rounded-lg py-2 text-sm font-bold disabled:opacity-50"
              style={{ backgroundColor: C.red, color: C.text }}
            >
              {excluindo ? 'Excluindo...' : 'Confirmar exclusão'}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function LeadCard({ lead, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center justify-between rounded-xl px-4 py-3.5 mb-2.5 text-left"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
    >
      <div>
        <p className="font-bold text-sm" style={{ color: C.text }}>
          {lead.nome}
        </p>
        <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
          {lead.canal} · {lead.turno}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={lead.status} />
        <ChevronRight size={16} style={{ color: C.textMuted }} />
      </div>
    </button>
  );
}

export function LeadsTab({ leads, onAddLead, onOpenLead }) {
  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black" style={{ color: C.text }}>
          Leads
        </h2>
        <button onClick={onAddLead} className="rounded-full p-2.5" style={{ backgroundColor: C.accent, color: C.bg }}>
          <Plus size={18} />
        </button>
      </div>
      {leads.length === 0 && (
        <p className="text-sm mt-10 text-center" style={{ color: C.textMuted }}>
          Nenhum lead ainda. Toque no + para cadastrar o primeiro.
        </p>
      )}
      {leads
        .slice()
        .sort((a, b) => new Date(b.data_entrada) - new Date(a.data_entrada))
        .map((l) => (
          <LeadCard key={l.id} lead={l} onOpen={() => onOpenLead(l)} />
        ))}
    </div>
  );
}
