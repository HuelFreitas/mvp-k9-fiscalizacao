# Especificação da API — K9 Fiscalização

Resumo: especificação mínima para um backend REST para suportar o protótipo.

URL base: `/api` (v1 implícita)

Autenticação
- Tokens JWT Bearer
- Endpoints de autenticação retornam `{ token, user }` onde `token` é JWT com `sub`, `role` e `exp`.
- Header: `Authorization: Bearer <token>`

Formato de erro (JSON):
```
{ "error": { "code": "INVALID_PAYLOAD", "message": "Mensagem amigável", "details": { ... } } }
```

Códigos HTTP recomendados:
- 200 OK
- 201 Created
- 204 No Content
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 422 Unprocessable Entity
- 500 Internal Server Error

Modelos principais
- User
  - id: string (uuid)
  - role: 'client' | 'operator' | 'admin'
  - name, email
  - company (client) | certification (operator)
  - createdAt, updatedAt

- Request
  - id: string (uuid)
  - clientId: string (fk)
  - assignedOperatorId: string | null
  - title, port, vessel, cargo
  - scheduledFor: datetime
  - description, status: 'pending'|'in-progress'|'completed'
  - tags: string[]
  - timeline: TimelineEntry[]
  - evidence: Evidence[] (metadados)
  - report: Report | null
  - createdAt, updatedAt

- Evidence
  - id: string
  - requestId: string
  - name, size, type
  - storageKey / url
  - uploadedAt

- Report
  - summary, findings, recommendations
  - generatedAt, operatorId

- TimelineEntry
  - id, timestamp, actor {id,name,role}, title, description, category

Endpoints

## Autenticação
### POST /api/auth/register
Cria usuário (MVP) — corpo:
```
{ "email":"user@ex.com", "name":"Ana", "role":"client", "company":"X", "password":"123456" }
```
Resposta 201:
```
{ "user": { ... }, "token": "..." }
```

### POST /api/auth/login
Corpo:
```
{ "email": "user@ex.com", "password":"123456" }
```
Em desenvolvimento, é possível liberar login sem senha com `ALLOW_DEV_PASSWORDLESS_LOGIN=true`.
Em produção, usar senha é obrigatório.
Resposta 200:
```
{ "user": {...}, "token": "..." }
```

## Usuários
- GET /api/users/:id — retorna usuário (autorizado)
- GET /api/users?role=operator — lista operadores (visão admin/client)

## Requests
### GET /api/requests
Query: `?clientId=&status=&assignedOperatorId=&page=&limit=`
Resposta atual: `{ items: [...], total }`

### POST /api/requests
Autorizado: `client`
Corpo:
```
{
  "title": "Inspeção X",
  "port": "Porto Y",
  "vessel": "Vessel",
  "cargo": "...",
  "scheduledFor": "2026-05-30",
  "scheduledTime": "08:00",
  "description": "...",
  "tags": ["prevenção"]
}
```
Resposta 201: `{ request: { ... } }`

### GET /api/requests/:id
Resposta 200: `{ request: {...} }`

### PUT /api/requests/:id
Atualiza campos editáveis (client/operator/admin)
Resposta 200: `{ request: {...} }`

### DELETE /api/requests/:id
Resposta 204

## Status e Progresso
### POST /api/requests/:id/status
Corpo:
```
{ "status": "in-progress", "notes": "Iniciando varredura" }
```
Cabeçalho: Authorization
Retorna 200: `{ request, entry }`

### POST /api/requests/:id/progress
Adiciona checkpoint (entrada operacional)
Corpo:
```
{ "title":"Varredura de porão", "details":"Encontrado pacote suspeito", "next":"Coletar amostra" }
```
Resposta 201: `{ request, entry }`

## Relatórios
### POST /api/requests/:id/report
Corpo:
```
{ "summary":"...", "findings":"...", "recommendations":"..." }
```
- Valida campos obrigatórios
- Cria `report`, define `status: completed`, retorna `{ request, entry }`

### GET /api/requests/:id/report/pdf
- Gera PDF no servidor (opcional) e retorna `Content-Type: application/pdf` ou URL
- Alternativa: frontend gera via jsPDF (já implementado); este endpoint é opcional

## Evidências (arquivos)
Opções de implementação (simples -> recomendado):
1) Upload direto ao servidor (multipart/form-data) -> armazenar em S3 or disk (MVP: local)
2) Melhor: gerar presigned URL para upload direto ao S3 (server fornece key + URL)

### POST /api/requests/:id/evidence
Body (multipart) ou JSON com `filename,type,size` para obter presigned URL
Resposta 201:
```
{ "evidence": { id, name, size, type, storageKey, uploadedAt }, "uploadUrl": "..." }
```

### GET /api/requests/:id/evidence/:evidenceId
Retorna metadados e URL assinado para download

### DELETE /api/requests/:id/evidence/:evidenceId
Remove metadados e apaga do storage (async)
Resposta 204

Segurança: validar tamanho e tipo no backend (mesmas regras do frontend)

Considerações de armazenagem
- Usar S3 / Spaces / R2
- Salvar apenas metadados no DB, usar `storageKey` para localizar arquivo
- Uso de URLs assinadas para uploads e downloads

DB & Migrations
- Tabela `users`, `requests`, `evidence`, `timeline`, `reports` (ou JSONB para timeline/report)
- Exemplo: `requests.timeline` como JSONB facilita protótipo

Autorização e roles
- `client` pode criar e ver suas requests
- `operator` pode atualizar status/progress, completar relatório quando atribuído
- `admin` pode listar/gerenciar tudo
- Middlewares: `ensureAuth`, `ensureRole(role|roles)`

Exemplos de payloads e respostas enviadas acima.

Observações para desenvolvimento rápido
- Persistência implementada com Node + Express + PostgreSQL, configurada por `DATABASE_URL`.
- Storage: Minio local para teste de S3 ou usar DigitalOcean Spaces
- Auth: JWT com secret env var; para produção, usar refresh tokens e expirations curtas

Próximos passos sugeridos (curto prazo)
1. Implementar upload com presigned URLs
2. Adicionar refresh tokens e revogação de sessão
3. Normalizar timeline e relatórios em tabelas próprias quando o volume justificar
4. Adicionar paginação e filtros no banco

## Como usar no protótipo atual

Backend local:
1. `cd backend`
2. `npm run dev`

Variáveis de ambiente:
- `JWT_SECRET`: recomendado em todos os ambientes.
- `NODE_ENV=production`: torna obrigatório `JWT_SECRET`.
- `ALLOW_DEV_PASSWORDLESS_LOGIN=true`: libera login sem senha apenas fora de produção.

Fluxo básico:
1. Registrar usuário:
```json
POST /api/auth/register
{
  "email": "ana@ex.com",
  "name": "Ana",
  "role": "client",
  "company": "Empresa X",
  "password": "123456"
}
```
2. Fazer login:
```json
POST /api/auth/login
{
  "email": "ana@ex.com",
  "password": "123456"
}
```
3. Usar token JWT nas rotas protegidas:
- Header: `Authorization: Bearer <token>`
- Exemplo: `GET /api/requests`

### Endpoints já conectados ao frontend
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/requests`
- `POST /api/requests`
- `PUT /api/requests/:id`
- `DELETE /api/requests/:id`
- `POST /api/requests/:id/status`
- `POST /api/requests/:id/progress`
- `POST /api/requests/:id/report`
