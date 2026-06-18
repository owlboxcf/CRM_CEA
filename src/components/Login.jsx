import React, { useState } from 'react';
import { C, inputStyle } from '../theme';
import { OwlMark, PrimaryButton } from './UI';
import { signIn, resetPassword } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [modoReset, setModoReset] = useState(false);
  const [resetEnviado, setResetEnviado] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const { error } = await signIn(email.trim(), senha);
    setCarregando(false);
    if (error) {
      setErro('E-mail ou senha incorretos.');
    }
  }

  async function submitReset(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const { error } = await resetPassword(email.trim());
    setCarregando(false);
    if (error) {
      setErro('Não foi possível enviar o e-mail de redefinição.');
    } else {
      setResetEnviado(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: C.bg }}>
      <OwlMark size={64} />
      <h1 className="text-2xl font-black mt-4 tracking-tight" style={{ color: C.text }}>
        CORPO E AÇÃO
      </h1>
      <p className="text-xs font-bold uppercase tracking-widest mt-1 mb-8" style={{ color: C.accent }}>
        Owl Box · CRM Comercial
      </p>

      {!modoReset ? (
        <form onSubmit={submit} className="w-full max-w-xs">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu e-mail"
            autoComplete="username"
            className="w-full rounded-lg border px-3 py-2.5 text-sm mb-3"
            style={inputStyle}
          />
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="sua senha"
            autoComplete="current-password"
            className="w-full rounded-lg border px-3 py-2.5 text-sm mb-3"
            style={inputStyle}
          />
          {erro && (
            <p className="text-xs mb-3" style={{ color: C.red }}>
              {erro}
            </p>
          )}
          <PrimaryButton type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => {
              setModoReset(true);
              setErro('');
            }}
            className="text-xs font-bold mt-4 block w-full text-center"
            style={{ color: C.textMuted }}
          >
            Esqueci minha senha
          </button>
        </form>
      ) : (
        <form onSubmit={submitReset} className="w-full max-w-xs">
          {resetEnviado ? (
            <p className="text-sm text-center mb-4" style={{ color: C.text }}>
              Se esse e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.
            </p>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu e-mail"
                className="w-full rounded-lg border px-3 py-2.5 text-sm mb-3"
                style={inputStyle}
              />
              {erro && (
                <p className="text-xs mb-3" style={{ color: C.red }}>
                  {erro}
                </p>
              )}
              <PrimaryButton type="submit" disabled={carregando}>
                {carregando ? 'Enviando...' : 'Enviar link de redefinição'}
              </PrimaryButton>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setModoReset(false);
              setResetEnviado(false);
              setErro('');
            }}
            className="text-xs font-bold mt-4 block w-full text-center"
            style={{ color: C.textMuted }}
          >
            Voltar ao login
          </button>
        </form>
      )}
    </div>
  );
}
