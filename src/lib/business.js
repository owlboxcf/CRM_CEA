export const TURNOS = ['Manhã', 'Tarde', 'Noite'];
export const STATUS_LEAD = ['Novo', 'Em Contato', 'Interessado', 'Visita Agendada', 'Visitou', 'Convertido', 'Perdido'];
export const TIPOS_TRANSACAO = ['Nova', 'Renovação', 'Reativação'];

export function calcVenda(plano, tipo) {
  // `plano` é o objeto vindo da tabela planos (id, nome, modalidade, forma, pontos, comissao_base)
  if (!plano) return { pontos: 0, comissaoVendedor: 0, comissaoProfessor: 0 };
  if (tipo === 'Renovação') {
    return {
      pontos: Number(plano.pontos),
      comissaoVendedor: Number(plano.comissao_base) * 0.3,
      comissaoProfessor: Number(plano.comissao_base) * 0.7,
    };
  }
  return {
    pontos: Number(plano.pontos),
    comissaoVendedor: Number(plano.comissao_base),
    comissaoProfessor: 0,
  };
}

export function fmtMoney(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

export function diasDesde(d) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key) {
  const [y, m] = key.split('-');
  return `${MESES[Number(m) - 1]} ${y}`;
}

export function dayKeyLocal(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayLabel(key) {
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

export function fmtHoras(h) {
  const total = Math.max(0, h);
  const horas = Math.floor(total);
  const min = Math.round((total - horas) * 60);
  return `${horas}h${String(min).padStart(2, '0')}`;
}

export function calcularSessoes(registros) {
  const ordenados = [...registros].sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
  const sessoes = [];
  let aberta = null;
  for (const r of ordenados) {
    if (r.tipo === 'Entrada') {
      aberta = r;
    } else if (r.tipo === 'Saída' && aberta) {
      sessoes.push({
        entrada: aberta.data_hora,
        saida: r.data_hora,
        horas: (new Date(r.data_hora) - new Date(aberta.data_hora)) / 3600000,
      });
      aberta = null;
    }
  }
  return { sessoes, emAndamento: aberta };
}
