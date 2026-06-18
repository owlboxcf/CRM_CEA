import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { C } from '../theme';
import { Input } from './UI';

function ListaConfiguravel({ titulo, descricao, tipo, opcoes, onAdd, onRemove }) {
  const [novoValor, setNovoValor] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function adicionar() {
    if (!novoValor.trim()) return;
    setSalvando(true);
    try {
      await onAdd(tipo, novoValor.trim());
      setNovoValor('');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mb-8">
      <h3 className="text-sm font-black uppercase tracking-wide mb-1" style={{ color: C.text }}>
        {titulo}
      </h3>
      {descricao && (
        <p className="text-xs mb-3" style={{ color: C.textMuted }}>
          {descricao}
        </p>
      )}
      <div className="flex gap-2 mb-3">
        <Input value={novoValor} onChange={setNovoValor} placeholder="Adicionar opção..." />
        <button
          onClick={adicionar}
          disabled={salvando}
          className="rounded-lg px-3 disabled:opacity-50"
          style={{ backgroundColor: C.accent, color: C.bg }}
        >
          <Plus size={18} />
        </button>
      </div>
      {opcoes.map((o) => (
        <div key={o.id} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="text-sm" style={{ color: C.text }}>
            {o.valor}
          </span>
          <button onClick={() => onRemove(o.id)} style={{ color: C.red }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      {opcoes.length === 0 && (
        <p className="text-xs" style={{ color: C.textMuted }}>
          Nenhuma opção cadastrada.
        </p>
      )}
    </div>
  );
}

export function ConfiguracoesTab({ opcoes, onAddOpcao, onRemoveOpcao }) {
  return (
    <div className="px-4 pt-4 pb-24">
      <h2 className="text-xl font-black mb-4" style={{ color: C.text }}>
        Configurações
      </h2>
      <ListaConfiguravel
        titulo="Canais de captação"
        descricao="Como o lead chegou até nós."
        tipo="canal_captacao"
        opcoes={opcoes.filter((o) => o.tipo === 'canal_captacao')}
        onAdd={onAddOpcao}
        onRemove={onRemoveOpcao}
      />
      <ListaConfiguravel
        titulo="Canais de contato"
        descricao="Por onde o vendedor entrou em contato."
        tipo="canal_contato"
        opcoes={opcoes.filter((o) => o.tipo === 'canal_contato')}
        onAdd={onAddOpcao}
        onRemove={onRemoveOpcao}
      />
      <ListaConfiguravel
        titulo="Resultados de contato"
        tipo="resultado"
        opcoes={opcoes.filter((o) => o.tipo === 'resultado')}
        onAdd={onAddOpcao}
        onRemove={onRemoveOpcao}
      />
    </div>
  );
}
