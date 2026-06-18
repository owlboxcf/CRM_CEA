# CRM Corpo e Ação / Owl Box

App de gestão comercial (Leads, Vendas, Ponto, Ranking, Resumo gerencial) rodando em React + Vite, com banco de dados e login de verdade no Supabase.

O que mudou da versão anterior (artifact do Claude): os dados agora ficam num banco próprio seu (Supabase), o login é com e-mail e senha de cada pessoa (em vez de PIN), e a separação entre o que cada vendedor vê é garantida pelo próprio banco (Row Level Security) — não depende mais só da lógica do app.

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Clique em "New project". Escolha um nome (ex: `corpoeacao-crm`), defina uma senha de banco (guarde em local seguro) e a região mais próxima (ex: South America).
3. Espere o projeto terminar de provisionar (1-2 minutos).

## 2. Rodar o schema do banco

1. No painel do projeto, vá em **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/schema.sql` (está nesta pasta), copie todo o conteúdo e cole no editor.
3. Clique em **Run**. Isso cria todas as tabelas (leads, vendas, atividades, ponto, planos, perfis), já com as 6 regras de plano cadastradas e as permissões de segurança configuradas.

## 3. Criar os logins da equipe

Vá em **Authentication → Users → Add user → Create new user**, e crie um usuário para cada pessoa:

- Bruna Souza
- Gabriela Ferraz
- Renan Bento
- Você (Augusto)

Para cada um, preencha e-mail e senha, e marque **Auto Confirm User** (assim a pessoa já consegue logar direto, sem precisar confirmar e-mail). No campo **User Metadata**, cole um JSON assim (ajustando nome e perfil):

```json
{ "nome": "Bruna Souza", "perfil": "Vendedor" }
```

Para o seu usuário (Augusto), use `"perfil": "Gestor"`. Isso preenche automaticamente a tabela de perfis com o nome certo e o papel certo de cada um — é o que decide o que cada pessoa vê no app.

> Esqueceu de preencher o metadata ou errou o perfil? Vá em **Table Editor → perfis** e edite a linha diretamente.

## 4. Pegar a URL e a chave do projeto

Em **Project Settings → API**, copie:

- **Project URL**
- **anon public key**

Na pasta do projeto, copie `.env.example` para um novo arquivo `.env` e cole esses dois valores:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

## 5. Rodar local no VS Code

Abra esta pasta no VS Code, abra um terminal e rode:

```bash
npm install
npm run dev
```

Vai aparecer um link (geralmente `http://localhost:5173`). Abra no navegador e faça login com um dos e-mails/senhas que você criou no passo 3.

## 6. Subir o código pro GitHub

O GitHub guarda o código (controle de versão) — o banco de dados de verdade continua sendo o Supabase, não o GitHub.

```bash
git init
git add .
git commit -m "CRM Corpo e Ação - versão inicial"
```

Depois crie um repositório vazio em [github.com/new](https://github.com/new) (pode ser privado) e siga as instruções que o próprio GitHub mostra na tela de "…or push an existing repository from the command line".

## Quando quiser publicar um link pra equipe acessar de qualquer lugar

Esse projeto está pronto pra ser publicado em qualquer serviço de hospedagem de site estático (ele só fala com o Supabase pela internet, não precisa de servidor próprio). Quando chegar essa hora, me avise — nessa etapa eu recomendo a Netlify em vez da Vercel, porque o plano gratuito da Netlify permite uso comercial (o da Vercel, não). Você só vai precisar configurar as duas variáveis do `.env` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) nas configurações do site lá.

## Estrutura do projeto

```
src/
  App.jsx              orquestra autenticação + todas as telas
  theme.js             paleta de cores
  lib/
    supabase.js        cliente do Supabase
    business.js         regras de negócio (cálculo de pontos/comissão, datas, horas)
    api.js              todas as chamadas ao banco (leads, vendas, ponto, ranking...)
  components/
    UI.jsx              botões, campos, modal, badges reutilizáveis
    Login.jsx           tela de login (e-mail/senha)
    Shell.jsx           cabeçalho e menu de abas
    Leads.jsx           aba Leads + formulários de lead/contato
    Vendas.jsx          aba Vendas + formulário de venda
    Ponto.jsx           aba Ponto (visão vendedor e visão gestor)
    Ranking.jsx         aba Ranking
    Resumo.jsx          aba Resumo gerencial (só Gestor)
supabase/
  schema.sql            schema completo do banco (tabelas + segurança)
```

## Uma melhoria em relação à versão anterior

Antes, pontos e comissão de cada venda eram recalculados toda vez com base na tabela de planos atual. Agora eles são calculados uma vez, no momento da venda, e gravados junto com a venda. Isso significa que, se um dia você ajustar a comissão de um plano na tabela `planos`, as vendas já registradas mantêm o valor de comissão de quando foram feitas — o que é o jeito correto de fazer isso financeiramente.
