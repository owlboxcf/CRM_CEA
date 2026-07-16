import React, { useState } from 'react';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { C, inputStyle } from '../theme';
import { StatRow, MonthFilter, Sheet, Field, Input, Select, PrimaryButton } from './UI';
import { calcularSessoes, dayKeyLocal, dayLabel, fmtHoras, monthKey, fmtDate } from '../lib/business';

// ---------- Formulário de registro manual ----------

function PontoManualForm({ vendedores, onClose, onSave }) {
  const [idVendedor, setIdVendedor] = useState('');
  const [tipo, setTipo] = useState('Entrada');
  const [dataHora, setDataHora] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function submit() {
    if (!idVendedor || !dataHora) return;
    setSalvando(true);
    try {
      await onSave({ id_vendedor: idVendedor, tipo, data_hora: new Date(dataHora).toISOString() });
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet title="Adicionar registro de ponto" onClose={onClose}>
      <Field label="Funcionário">
        <select
          value={idVendedor}
          onChange={(e) => setIdVendedor(e.target.value)}
          className="w-full rounded-lg border px-3 py-2.5 text-sm"
          style={inputStyle}
        >
          <option value="">Selecione...</option>
          {vendedores.map((v) => (
            <option key={v.id} value={v.id}>{v.nome}</option>
          ))}
        </select>
      </Field>
      <Field label="Tipo">
        <Select value={tipo} onChange={setTipo} options={['Entrada', 'Saída']} />
      </Field>
      <Field label="Data e hora">
        <input
          type="datetime-local"
          value={dataHora}
          onChange={(e) => setDataHora(e.target.value)}
          className="w-full rounded-lg border px-3 py-2.5 text-sm"
          style={inputStyle}
        />
      </Field>
      <PrimaryButton onClick={submit} disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar'}
      </PrimaryButton>
    </Sheet>
  );
}

// ---------- Formulário de feriado ----------

function FeriadoForm({ onClose, onSave }) {
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function submit() {
    if (!data || !descricao.trim()) return;
    setSalvando(true);
    try {
      await onSave({ data, descricao: descricao.trim() });
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet title="Adicionar feriado" onClose={onClose}>
      <Field label="Data">
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full rounded-lg border px-3 py-2.5 text-sm"
          style={inputStyle}
        />
      </Field>
      <Field label="Descrição">
        <Input value={descricao} onChange={setDescricao} placeholder="Ex: Natal, Carnaval..." />
      </Field>
      <PrimaryButton onClick={submit} disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar'}
      </PrimaryButton>
    </Sheet>
  );
}

// ---------- Linha editável de um registro de ponto ----------

function PontoRow({ reg, onDelete, onUpdate }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(
    new Date(reg.data_hora).toLocaleString('sv').slice(0, 16)
  );
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try {
      await onUpdate(reg.id, new Date(valor).toISOString());
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  }

  const hora = new Date(reg.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const corTipo = reg.tipo === 'Entrada' ? C.green : C.red;

  return (
    <div className="flex items-center gap-2 py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}>
      <span className="text-xs font-bold w-14" style={{ color: corTipo }}>
        {reg.tipo}
      </span>
      {editando ? (
        <>
          <input
            type="datetime-local"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="flex-1 rounded border px-2 py-1 text-xs"
            style={inputStyle}
          />
          <button onClick={salvar} disabled={salvando} style={{ color: C.green }}>
            <Check size={15} />
          </button>
          <button onClick={() => setEditando(false)} style={{ color: C.textMuted }}>
            <X size={15} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-xs font-mono" style={{ color: C.text }}>{hora}</span>
          <button onClick={() => setEditando(true)} style={{ color: C.textMuted }}>
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(reg.id)} style={{ color: C.red }}>
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}

// ---------- View do vendedor (sem alterações) ----------

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
      <h2 className="text-xl font-black mb-4" style={{ color: C.text }}>Ponto</h2>
      <div className="rounded-xl p-5 mb-5 text-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        {clockedIn ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.green }}>Trabalhando desde</p>
            <p className="text-2xl font-black font-mono mt-1" style={{ color: C.text }}>
              {new Date(ultimo.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </>
        ) : (
          <p className="text-sm" style={{ color: C.textMuted }}>Seu ponto está fechado</p>
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
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.textMuted }}>Horas este mês</p>
        <p className="font-mono font-black" style={{ color: C.accent }}>{fmtHoras(totalMesAtual)}</p>
      </div>
      <div className="rounded-xl px-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        {diasOrdenados.length === 0 && (
          <p className="text-sm py-3" style={{ color: C.textMuted }}>Nenhum dia registrado ainda.</p>
        )}
        {diasOrdenados.map(([dia, horas]) => (
          <StatRow key={dia} label={dayLabel(dia)} value={fmtHoras(horas)} />
        ))}
      </div>
    </div>
  );
}

// ---------- View do Gestor ----------

function PontoGestorView({ pontos, vendedores, feriados, onAddManual, onDeletePonto, onUpdatePonto, onAddFeriado, onDeleteFeriado }) {
  const [mes, setMes] = useState('all');
  const [vendedorAberto, setVendedorAberto] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showFeriadoForm, setShowFeriadoForm] = useState(false);

  const feriadoSet = new Set(feriados.map((f) => f.data));

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black" style={{ color: C.text }}>Ponto da equipe</h2>
        <div className="flex items-center gap-2">
          <MonthFilter items={pontos} dateField="data_hora" value={mes} onChange={setMes} />
          <button
            onClick={() => setShowManualForm(true)}
            className="rounded-full p-2"
            style={{ backgroundColor: C.accent, color: C.bg }}
            title="Adicionar registro manual"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Equipe */}
      {vendedores.map((v) => {
        const todosOMeus = pontos.filter((p) => p.id_vendedor === v.id);
        const { sessoes } = calcularSessoes(todosOMeus);
        const sessoesFiltradas = mes === 'all' ? sessoes : sessoes.filter((s) => monthKey(s.entrada) === mes);
        const total = sessoesFiltradas.reduce((s, x) => s + x.horas, 0);
        const ultimo = [...todosOMeus].sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))[0];
        const dentro = !!ultimo && ultimo.tipo === 'Entrada';
        const aberto = vendedorAberto === v.id;

        // Registros brutos filtrados pelo mês selecionado para exibição
        const regsFiltrados = todosOMeus.filter((r) =>
          mes === 'all' ? true : monthKey(r.data_hora) === mes
        ).sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));

        return (
          <div key={v.id} className="rounded-xl mb-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <button
              className="w-full flex items-center justify-between px-4 py-3.5"
              onClick={() => setVendedorAberto(aberto ? null : v.id)}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: C.text }}>{v.nome}</span>
                <span className="text-xs font-bold" style={{ color: dentro ? C.green : C.textMuted }}>
                  {dentro ? '● trabalhando' : '○ fora'}
                </span>
              </div>
              <span className="font-mono font-black text-sm" style={{ color: C.accent }}>
                {fmtHoras(total)}
              </span>
            </button>

            {aberto && (
              <div className="px-4 pb-3">
                {regsFiltrados.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: C.textMuted }}>Nenhum registro neste período.</p>
                ) : (
                  regsFiltrados.map((r) => (
                    <PontoRow
                      key={r.id}
                      reg={r}
                      onDelete={onDeletePonto}
                      onUpdate={onUpdatePonto}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Feriados */}
      <p className="text-xs font-bold uppercase tracking-wide mb-1 mt-2" style={{ color: C.accent }}>
        Feriados
      </p>
      <div className="rounded-xl px-4 mb-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        {feriados.length === 0 && (
          <p className="text-sm py-3" style={{ color: C.textMuted }}>Nenhum feriado cadastrado.</p>
        )}
        {feriados.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between py-2.5"
            style={{ borderBottom: `1px solid ${C.border}` }}
          >
            <div>
              <span className="text-sm font-bold" style={{ color: C.text }}>{f.descricao}</span>
              <span className="text-xs ml-2" style={{ color: C.textMuted }}>
                {new Date(f.data + 'T12:00:00').toLocaleDateString('pt-BR')}
              </span>
            </div>
            <button onClick={() => onDeleteFeriado(f.id)} style={{ color: C.red }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setShowFeriadoForm(true)}
          className="w-full py-2.5 text-xs font-bold uppercase tracking-wide"
          style={{ color: C.accent }}
        >
          + Adicionar feriado
        </button>
      </div>

      {showManualForm && (
        <PontoManualForm
          vendedores={vendedores}
          onClose={() => setShowManualForm(false)}
          onSave={onAddManual}
        />
      )}
      {showFeriadoForm && (
        <FeriadoForm
          onClose={() => setShowFeriadoForm(false)}
          onSave={onAddFeriado}
        />
      )}
    </div>
  );
}

// ---------- Export ----------

export function PontoTab({ pontos, meuPerfil, isGestor, vendedores, feriados, onRegistrar, onAddManual, onDeletePonto, onUpdatePonto, onAddFeriado, onDeleteFeriado }) {
  if (isGestor) {
    return (
      <PontoGestorView
        pontos={pontos}
        vendedores={vendedores}
        feriados={feriados}
        onAddManual={onAddManual}
        onDeletePonto={onDeletePonto}
        onUpdatePonto={onUpdatePonto}
        onAddFeriado={onAddFeriado}
        onDeleteFeriado={onDeleteFeriado}
      />
    );
  }
  return <PontoVendedorView pontos={pontos} meuPerfil={meuPerfil} onRegistrar={onRegistrar} />;
}
