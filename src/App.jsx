import React, { useState, useEffect, useCallback } from 'react';
import { C } from './theme';
import { OwlMark, PrimaryButton } from './components/UI';
import Login from './components/Login';
import { Header, TabBar } from './components/Shell';
import { LeadsTab, LeadForm, LeadDetail, AtividadeForm } from './components/Leads';
import { VendasTab, VendaForm } from './components/Vendas';
import { PontoTab } from './components/Ponto';
import { RankingTab } from './components/Ranking';
import { ResumoTab } from './components/Resumo';
import { ConfiguracoesTab } from './components/Configuracoes';
import {
  getSession,
  onAuthStateChange,
  signOut,
  getMeuPerfil,
  getVendedores,
  getPlanos,
  getLeads,
  createLead,
  updateLeadStatus,
  deleteLead,
  getAtividades,
  createAtividade,
  getVendas,
  createVenda,
  getRanking,
  getPontoRegistros,
  registrarPonto,
  getTodasOpcoes,
  createOpcao,
  deleteOpcao,
  addPontoManual,
  updatePontoRegistro,
  deletePontoRegistro,
  getFeriados,
  createFeriado,
  deleteFeriado,
} from './lib/api';

function TelaCarregando() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg }}>
      <OwlMark size={48} />
    </div>
  );
}

export default function App() {
  // undefined = ainda verificando sessão · null = sem sessão (mostra login)
  const [session, setSession] = useState(undefined);
  const [meuPerfil, setMeuPerfil] = useState(null);
  const [vendedores, setVendedores] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [leads, setLeads] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [pontos, setPontos] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [opcoes, setOpcoes] = useState([]);
  const [feriados, setFeriados] = useState([]);
  const [activeTab, setActiveTab] = useState('leads');
  const [loadingDados, setLoadingDados] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');

  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showAtividadeForm, setShowAtividadeForm] = useState(false);
  const [showVendaForm, setShowVendaForm] = useState(false);
  const [vendaPrefillLead, setVendaPrefillLead] = useState(null);

  useEffect(() => {
    getSession().then(setSession);
    const subscription = onAuthStateChange(setSession);
    return () => subscription.unsubscribe();
  }, []);

  const carregarTudo = useCallback(async () => {
    if (!session) return;
    setLoadingDados(true);
    setErroCarregamento('');
    try {
      const perfil = await getMeuPerfil(session.user.id);
      setMeuPerfil(perfil);
      const [vend, pl, l, a, v, r, p, op, fer] = await Promise.all([
        getVendedores(),
        getPlanos(),
        getLeads(),
        getAtividades(),
        getVendas(),
        getRanking(),
        getPontoRegistros(),
        getTodasOpcoes(),
        getFeriados(),
      ]);
      setVendedores(vend);
      setPlanos(pl);
      setLeads(l);
      setAtividades(a);
      setVendas(v);
      setRanking(r);
      setPontos(p);
      setOpcoes(op);
      setFeriados(fer);
    } catch (e) {
      console.error(e);
      setErroCarregamento(
        'Não foi possível carregar os dados. Verifique sua internet e se o esquema do banco (schema.sql) já foi executado no Supabase.'
      );
    } finally {
      setLoadingDados(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) carregarTudo();
  }, [session, carregarTudo]);

  if (session === undefined) return <TelaCarregando />;
  if (!session) return <Login />;
  if (loadingDados || (!meuPerfil && !erroCarregamento)) return <TelaCarregando />;

  if (erroCarregamento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: C.bg }}>
        <OwlMark size={40} />
        <p className="text-sm mt-4 mb-5" style={{ color: C.textMuted }}>
          {erroCarregamento}
        </p>
        <div className="w-full max-w-xs">
          <PrimaryButton onClick={carregarTudo}>Tentar de novo</PrimaryButton>
        </div>
        <button onClick={signOut} className="text-xs font-bold mt-5" style={{ color: C.textMuted }}>
          Sair
        </button>
      </div>
    );
  }

  const isGestor = meuPerfil.perfil === 'Gestor';
  const meusLeads = isGestor ? leads : leads.filter((l) => l.id_vendedor === meuPerfil.id);
  const minhasVendas = isGestor ? vendas : vendas.filter((v) => v.id_vendedor === meuPerfil.id);
  const canaisCaptacao = opcoes.filter((o) => o.tipo === 'canal_captacao').map((o) => o.valor);
  const canaisContato = opcoes.filter((o) => o.tipo === 'canal_contato').map((o) => o.valor);
  const resultados = opcoes.filter((o) => o.tipo === 'resultado').map((o) => o.valor);

  async function handleAddLead(leadData) {
    const novo = await createLead(leadData);
    setLeads((prev) => [novo, ...prev]);
  }

  async function handleUpdateLeadStatus(id, status) {
    const atualizado = await updateLeadStatus(id, status);
    setLeads((prev) => prev.map((l) => (l.id === id ? atualizado : l)));
    setSelectedLead((prev) => (prev && prev.id === id ? atualizado : prev));
  }

  async function handleAddAtividade(atividadeData) {
    const nova = await createAtividade(atividadeData);
    setAtividades((prev) => [nova, ...prev]);
    const lead = leads.find((l) => l.id === atividadeData.id_lead);
    if (lead && lead.status === 'Novo') {
      await handleUpdateLeadStatus(lead.id, 'Em Contato');
    }
  }

  async function handleAddVenda(vendaData) {
    const nova = await createVenda(vendaData);
    setVendas((prev) => [nova, ...prev]);
    await handleUpdateLeadStatus(vendaData.id_lead, 'Convertido');
    try {
      const r = await getRanking();
      setRanking(r);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteLead(id) {
    await deleteLead(id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setAtividades((prev) => prev.filter((a) => a.id_lead !== id));
    setSelectedLead(null);
  }

  async function handleAddOpcao(tipo, valor) {
    const nova = await createOpcao(tipo, valor);
    setOpcoes((prev) => [...prev, nova]);
  }

  async function handleRemoveOpcao(id) {
    await deleteOpcao(id);
    setOpcoes((prev) => prev.filter((o) => o.id !== id));
  }

  async function handleRegistrarPonto(tipo) {
    const novo = await registrarPonto(meuPerfil.id, tipo);
    setPontos((prev) => [novo, ...prev]);
  }

  async function handleAddPontoManual(dados) {
    const novo = await addPontoManual(dados);
    setPontos((prev) => [novo, ...prev].sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora)));
  }

  async function handleUpdatePonto(id, data_hora) {
    const atualizado = await updatePontoRegistro(id, data_hora);
    setPontos((prev) => prev.map((p) => (p.id === id ? atualizado : p)));
  }

  async function handleDeletePonto(id) {
    await deletePontoRegistro(id);
    setPontos((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleAddFeriado(dados) {
    const novo = await createFeriado(dados);
    setFeriados((prev) => [...prev, novo].sort((a, b) => (a.data < b.data ? -1 : 1)));
  }

  async function handleDeleteFeriado(id) {
    await deleteFeriado(id);
    setFeriados((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <div className="max-w-md mx-auto" style={{ backgroundColor: C.bg }}>
        <Header perfil={meuPerfil} onSair={signOut} />

        {activeTab === 'leads' && (
          <LeadsTab leads={meusLeads} onAddLead={() => setShowLeadForm(true)} onOpenLead={setSelectedLead} />
        )}
        {activeTab === 'vendas' && (
          <VendasTab
            vendas={minhasVendas}
            leads={leads}
            onAddVenda={() => {
              setVendaPrefillLead(null);
              setShowVendaForm(true);
            }}
          />
        )}
        {activeTab === 'ranking' && <RankingTab ranking={ranking} vendas={vendas} isGestor={isGestor} />}
        {activeTab === 'ponto' && (
          <PontoTab
            pontos={pontos}
            meuPerfil={meuPerfil}
            isGestor={isGestor}
            vendedores={vendedores}
            feriados={feriados}
            onRegistrar={handleRegistrarPonto}
            onAddManual={handleAddPontoManual}
            onDeletePonto={handleDeletePonto}
            onUpdatePonto={handleUpdatePonto}
            onAddFeriado={handleAddFeriado}
            onDeleteFeriado={handleDeleteFeriado}
          />
        )}
        {activeTab === 'resumo' && isGestor && (
          <ResumoTab leads={leads} atividades={atividades} vendas={vendas} planos={planos} vendedores={vendedores} />
        )}
        {activeTab === 'config' && isGestor && (
          <ConfiguracoesTab opcoes={opcoes} onAddOpcao={handleAddOpcao} onRemoveOpcao={handleRemoveOpcao} />
        )}

        <TabBar active={activeTab} setActive={setActiveTab} isGestor={isGestor} />

        {showLeadForm && (
          <LeadForm
            meuPerfil={meuPerfil}
            isGestor={isGestor}
            vendedores={vendedores}
            canaisCaptacao={canaisCaptacao}
            onClose={() => setShowLeadForm(false)}
            onSave={handleAddLead}
          />
        )}

        {selectedLead && !showAtividadeForm && !showVendaForm && (
          <LeadDetail
            lead={selectedLead}
            atividades={atividades}
            vendas={vendas}
            onClose={() => setSelectedLead(null)}
            onAddAtividade={() => setShowAtividadeForm(true)}
            onAddVenda={() => {
              setVendaPrefillLead(selectedLead.id);
              setShowVendaForm(true);
            }}
            onDelete={handleDeleteLead}
          />
        )}

        {showAtividadeForm && selectedLead && (
          <AtividadeForm
            leadId={selectedLead.id}
            meuPerfil={meuPerfil}
            canaisContato={canaisContato}
            resultados={resultados}
            onClose={() => setShowAtividadeForm(false)}
            onSave={handleAddAtividade}
          />
        )}

        {showVendaForm && (
          <VendaForm
            leadId={vendaPrefillLead}
            leads={leads}
            planos={planos}
            meuPerfil={meuPerfil}
            onClose={() => {
              setShowVendaForm(false);
              setVendaPrefillLead(null);
            }}
            onSave={handleAddVenda}
          />
        )}
      </div>
    </div>
  );
}
