# K9 Fiscalização Portal

Protótipo responsivo para gestão de operações de fiscalização marítima com uso de cães farejadores da K9 Fiscalização. O projeto atende dois perfis principais:

- **Cliente**: registra solicitações, acompanha inspeções em andamento, envia mensagens complementares e gera relatórios concluídos.
- **Operador**: recebe missões, atualiza status, adiciona checkpoints de campo e emite relatório final para liberação ao cliente.

> ⚠️ O projeto possui frontend Vite e API Node.js/Express. Em produção, usuários e solicitações são persistidos em PostgreSQL; apenas o token da sessão permanece no `localStorage`.

## Aplicação em produção

- **Portal:** [mvp-k9-fiscalizacao-web.onrender.com](https://mvp-k9-fiscalizacao-web.onrender.com)
- **Base da API:** `https://mvp-k9-fiscalizacao-api.onrender.com/api`
- **Health check:** [GET /api/health](https://mvp-k9-fiscalizacao-api.onrender.com/api/health)
- **Banco de dados:** PostgreSQL serverless no Neon

A API utiliza uma instância gratuita do Render e pode levar cerca de 50 segundos para responder ao primeiro acesso após um período de inatividade.

### Acesso de demonstração

| Perfil | E-mail |
|---|---|
| Cliente | `marina@portosafemar.com` |
| Operador | `carlos.silva@guardcan.com` |

A senha de produção é definida exclusivamente na variável protegida `DEMO_DEFAULT_PASSWORD` do Render. Ela não é armazenada no repositório; solicite-a ao responsável pela demonstração.

Consulte o [roteiro de demonstração](./docs/demo.md) para apresentar o fluxo completo do MVP.

## Arquitetura publicada

```text
Navegador
   │
   ├── Frontend Vite ── Render Static Site
   │                         │
   └─────────────────────────┼── HTTPS/JSON ── API Express no Render
                                                     │
                                                     └── PostgreSQL no Neon
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- npm (incluso no Node.js)

## Desenvolvimento (local)

Passos rápidos para desenvolver localmente:

1. Instale dependências:

```bash
npm install
```

2. Rode o servidor de desenvolvimento (Vite):

```bash
npm run dev
```

3. Rode os testes:

```bash
npm test
```

4. Gerar compilação de produção:

```bash
npm run build
```

Observações:
- Execute `npm install` antes de `npm run dev` para garantir que `jspdf` e outras dependências estejam instaladas.
- Pull requests devem rodar CI (lint + testes) automaticamente.

## 🧪 Testes e Qualidade de Código

### Comandos de teste

```bash
# Rodar testes uma vez
npm test

# Rodar testes em modo observação
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage

# Ver relatório de cobertura no navegador
npm run coverage
```

### Métricas atuais

- **194 testes de frontend** e **37 testes de backend** passando ✅
- **Thresholds configurados (frontend):** 70% statements/lines/functions e 65% branches (aplicados a `src/**/*.js`)
- **Threshold backend:** execução com cobertura habilitada em `backend` para monitoramento contínuo

> A cobertura mede somente os módulos em `src/`. Execute `npm run test:coverage` para gerar o relatório atualizado.

📊 [Relatório de Cobertura Detalhado](./coverage/index.html)

### Estrutura de testes

```
test/
├── helpers.test.js       (36 testes) ✅
├── storage.test.js       (26 testes) ✅
├── notifications.test.js (22 testes) ✅
├── search.test.js        (9 testes)  ✅
├── dashboards.test.js    (7 testes)  ✅
├── actions.test.js       (4 testes)  ✅
└── ...outros             (~29 testes)✅
```

### CI/CD - GitHub Actions

![Testes e Cobertura](https://github.com/HuelFreitas/mvp-k9-fiscalizacao/actions/workflows/ci.yml/badge.svg)

Configurado para rodar **automaticamente em cada pull request**:

- ✅ Linter (ESLint)
- ✅ Testes (Vitest em Node 20.x)
- ✅ Cobertura (V8)
- ✅ Envio de cobertura para Codecov
- ✅ Comentário automático no PR

**Branch Protection:** `main` requer que todos os testes passem antes de merge.

## Como executar

1. Faça o download/clonagem do repositório.
   ```bash
   git clone https://github.com/<seu-usuario>/mvp-k9-fiscalizacao.git
   cd mvp-k9-fiscalizacao
   ```
2. **Opção rápida:** dê um duplo clique em [`index.html`](./index.html) para abrir o protótipo diretamente no navegador.
3. **Opção recomendada:** sirva a pasta do projeto com um servidor estático para garantir que todos os recursos sejam carregados sem restrições de segurança do navegador.
   ```bash
   # usando Node.js
   npx serve .

   # ou com Python 3
   python -m http.server 5173
   ```
   Em seguida acesse a URL exibida no terminal (por padrão `http://localhost:3000` para `npx serve` ou `http://localhost:5173` para o comando do Python).
4. **Executando pela IDE:** caso utilize VS Code ou outra IDE com Live Server, abra a pasta clonada e ative o servidor embutido para carregar o `index.html` automaticamente.
5. Utilize as credenciais de demonstração sugeridas ou cadastre um novo acesso informando nome, e-mail e perfil.

## Fluxos implementados

### Autenticação

- Formulário único para clientes e operadores.
- Login e registro via backend (`/api/auth/login` e `/api/auth/register`).
- Sessão persistida com token JWT no `localStorage`.

### Área do cliente

- Dashboard com indicadores de solicitações.
- Formulário completo para abertura de nova inspeção (porto, embarcação, data, tags, contexto).
- Lista com filtros por status (todas, pendentes, em andamento, concluídas).
- Modal de detalhes contendo linha do tempo e opção de enviar mensagens complementares.

### Área do operador

- Painel com cards das operações ordenadas pelas mais recentes.
- Atualização de status (pendente, em andamento, concluída) com rastreabilidade.
- Registro de checkpoints operacionais com descrição e próximos passos.
- Formulário de relatório final com resumo, achados e recomendações.
- Exportação de relatório em PDF (via jsPDF) para auditoria.

## Recursos adicionais

- Layout mobile-first utilizando CSS Grid e tipografia flexível.
- Elementos com suporte a teclado, mensagens de feedback em região `aria-live` e foco gerenciado.
- Conjunto inicial de dados demonstrativos para acelerar a avaliação.
- Backend Express para autenticação e CRUD principal de solicitações.
- Evidências privadas em Cloudflare R2, com URLs temporárias de upload e download.

## Estrutura do projeto

```
├── assets/
│   ├── app.js              # Orquestrador principal (~180 linhas); lógica de negócio em src/
│   └── styles.css          # Design system
├── backend/
│   ├── src/
│   │   ├── index.js        # Servidor Express
│   │   ├── routes/         # Rotas de auth e requests
│   │   ├── controllers/    # Controladores REST
│   │   ├── middleware/     # JWT e autorização por perfil
│   │   └── services/       # Serviços locais do backend
│   └── package.json
├── src/
│   ├── main.js             # Entry point do Vite (importa assets/app.js)
│   ├── components/
│   │   ├── calendar.js     # Seletor de data/hora
│   │   ├── dashboards.js   # Painéis do cliente e do operador
│   │   ├── header.js       # Informações de usuário no cabeçalho
│   │   ├── login.js        # Formulário de autenticação
│   │   ├── modal.js        # Componente de modal genérico
│   │   ├── requests.js     # Listagem e filtros de solicitações
│   │   ├── search.js       # Busca de operações
│   │   ├── timeline.js     # Linha do tempo de eventos
│   │   ├── ui.js           # Chips de status e elementos visuais
│   │   └── upload.js       # Upload e galeria de evidências
│   ├── data/
│   │   └── constants.js    # Constantes globais (chaves de storage, limites)
│   ├── handlers/
│   │   ├── actions.js      # Ações de cliente e operador
│   │   ├── client.js       # Notas e gestão do cliente
│   │   ├── export.js       # Exportação de relatório em PDF
│   │   ├── metrics.js      # Cálculo de métricas do dashboard
│   │   ├── progress.js     # Atualização de progresso/checkpoints
│   │   ├── report.js       # Submissão de relatório final
│   │   ├── requests.js     # Criação de nova solicitação
│   │   └── status.js       # Atualização de status da operação
│   ├── ui/
│   │   └── notifications.js # Notificações de sucesso/erro/aviso
│   └── utils/
│       ├── dom.js           # Manipulação do DOM e acessibilidade
│       ├── helpers.js       # Utilitários de negócio (tags, usuários)
│       ├── misc.js          # Formatação de datas, UIDs, tamanhos
│       ├── storage.js       # Leitura/escrita no localStorage
│       ├── string.js        # Sanitização e trim seguro
│       └── validators.js    # Validações de data e formulário
├── test/                   # Testes unitários de frontend (Vitest + jsdom)
├── index.html              # Shell da aplicação
└── vite.config.js          # Configuração do bundler
```

## Execução com backend

1. Suba o backend:
```bash
cd backend
npm install
npm start
```
2. Em outro terminal, suba o frontend:
```bash
cd ..
npm install
npm run dev
```
3. Acesse a URL do Vite e faça login/cadastro normalmente.
4. Opcional (hot reload no backend): se instalar `nodemon`, use `npm run dev` na pasta `backend`.

Sem `DATABASE_URL`, o backend usa dados demonstrativos em memória para facilitar o desenvolvimento. Em produção, `DATABASE_URL` é obrigatória. Para testar com PostgreSQL local ou Neon, configure `backend/.env` e execute `npm run migrate && npm run seed` antes de iniciar a API.

### Configuração e segurança

Copie `backend/.env.example` para `backend/.env` e substitua os valores de demonstração antes de publicar a aplicação.

- `JWT_SECRET`: segredo longo e aleatório; obrigatório em produção.
- `CORS_ORIGINS`: origens permitidas, separadas por vírgula.
- `DEMO_DEFAULT_PASSWORD`: senha dos usuários demonstrativos.
- `ALLOW_DEV_PASSWORDLESS_LOGIN`: mantenha `false`; nunca é aceito em produção.

O cadastro público cria exclusivamente clientes. Operadores visualizam apenas operações livres ou atribuídas a eles, enquanto clientes só podem editar ou excluir solicitações próprias que ainda estejam pendentes. Campos internos, como status, cliente, operador, timeline e relatório, não podem ser alterados pelo endpoint genérico de edição.

A API também disponibiliza `GET /api/health`, limita requisições de autenticação, restringe o tamanho dos payloads e envia cabeçalhos HTTP de segurança.

Para publicar gratuitamente o frontend, a API e o PostgreSQL, siga o guia [Render + Neon](./docs/deploy-render-neon.md). O arquivo `render.yaml` descreve os dois serviços do Render, e as migrations em `backend/migrations/` preparam o banco automaticamente.

Para habilitar fotos e laudos persistentes, siga o guia de [armazenamento de evidências no Cloudflare R2](./docs/storage-r2.md).

### Usuários demo

- Cliente: `marina@portosafemar.com`
- Operador: `carlos.silva@guardcan.com`
- Senha local padrão: `123456`. Em produção, a senha é definida no Render por `DEMO_DEFAULT_PASSWORD` e nunca deve ser publicada no repositório.

## Próximos passos sugeridos

- Adicionar assinatura digital aos relatórios exportados.
- Implementar fluxo de notificações por e-mail ou push.
- Adicionar antivírus e geração de miniaturas ao fluxo de evidências.
- Aumentar cobertura dos componentes com menor cobertura (`dashboards`, `modal`, `search`, `client`).

## 🤝 Contribuindo

Para contribuir com o projeto:

1. **Faça um fork** do repositório
2. **Clone** seu fork localmente
3. **Crie uma branch** para sua funcionalidade: `git checkout -b feature/sua-feature`
4. **Faça as mudanças** e adicione testes
5. **Rode testes localmente**: `npm test && npm run lint`
6. **Commit** com mensagens descritivas
7. **Envie (push)** para sua branch
8. **Abra um pull request**

### Pré-requisitos para PR

- ✅ Lint frontend: `npm run lint`
- ✅ Lint backend: `cd backend && npm run lint`
- ✅ Testes passando: `npm test` (frontend) e `cd backend && npm test` (backend)
- ✅ Cobertura mantida: `npm run test:coverage`
- ✅ Nova funcionalidade tem testes
- ✅ Documentação atualizada

## Licença

Distribuído sob a licença [MIT](./LICENSE).
