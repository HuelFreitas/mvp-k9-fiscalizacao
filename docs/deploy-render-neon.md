# Deploy gratuito — Render + Neon

Esta arquitetura publica o frontend Vite e a API Express no Render e mantém os dados em PostgreSQL no Neon.

## 1. Criar o banco no Neon

1. Crie um projeto gratuito no Neon.
2. Selecione a região mais próxima disponível.
3. Copie a connection string do PostgreSQL, incluindo `sslmode=require`.
4. Guarde esse valor: ele será usado como `DATABASE_URL` no Render.

Não salve a connection string em arquivos versionados ou no GitHub.

## 2. Publicar pelo Blueprint do Render

1. Conecte o repositório ao Render.
2. Selecione **New > Blueprint**.
3. O Render detectará o arquivo `render.yaml` e criará:
   - `mvp-k9-fiscalizacao-api`, como Web Service gratuito;
   - `mvp-k9-fiscalizacao-web`, como Static Site gratuito.
4. Preencha os valores solicitados:

| Serviço | Variável | Valor |
|---|---|---|
| API | `DATABASE_URL` | Connection string copiada do Neon |
| API | `CORS_ORIGINS` | URL pública do frontend, sem barra final |
| API | `DEMO_DEFAULT_PASSWORD` | Senha forte com pelo menos 8 caracteres |
| Frontend | `VITE_API_BASE_URL` | URL pública da API seguida por `/api` |

Exemplos:

```text
CORS_ORIGINS=https://mvp-k9-fiscalizacao-web.onrender.com
VITE_API_BASE_URL=https://mvp-k9-fiscalizacao-api.onrender.com/api
```

O Render pode acrescentar um sufixo aos nomes dos serviços. Use sempre as URLs mostradas no painel.

## 3. Primeiro deploy

Ao iniciar a API, o comando `npm run start:prod`:

1. aplica as migrations pendentes;
2. cria os dados demonstrativos de forma idempotente;
3. inicia o servidor Express.

O endpoint de verificação é:

```text
GET https://URL-DA-API.onrender.com/api/health
```

Resposta esperada:

```json
{ "status": "ok" }
```

## 4. Verificação funcional

Depois que os dois serviços estiverem ativos:

1. abra o frontend;
2. entre com um dos usuários demonstrativos e a senha configurada;
3. crie uma solicitação como cliente;
4. reinicie a API no painel do Render;
5. confirme que a solicitação continua disponível após o reinício.

Isso comprova que os dados estão no Neon, e não no filesystem temporário do Render.

## Limitações do plano gratuito

- A API pode entrar em repouso após inatividade e demorar para responder à primeira requisição.
- Arquivos enviados não devem ser salvos no disco local da API.
- Evidências devem ser armazenadas futuramente em serviço de objetos, como Cloudflare R2 ou Supabase Storage.
- Monitore os limites do Neon e do Render nos respectivos painéis.
