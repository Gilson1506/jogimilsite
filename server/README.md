# JOGIMIL Omnichannel Backend Microservice (v2.0)

Microserviço autónomo de alta performance para o ecossistema JOGIMIL Tecnologias. Responsável pelo processamento de formulários, integração oficial com WhatsApp via Evolution API, envio e leitura de emails (SMTP/IMAP), disparo de SMS em massa, CRM e gestão de conteúdos dinâmicos.

---

## 🏛️ Arquitetura em Camadas (Clean Architecture / DDD)

```
server/
├── src/
│   ├── application/        # Casos de uso (SubmitForm, ListSubmissions, Health)
│   ├── domain/             # Entidades de negócio e regras de validação
│   ├── infrastructure/     # Adaptadores de I/O, fila em memória e persistência
│   │   ├── config/         # Gestão de variáveis de ambiente (.env)
│   │   ├── logging/        # Logger estruturado JSON com Correlation IDs
│   │   ├── mail/           # NodemailerAdapter (SMTP 465/587) & IMAP Sync (993)
│   │   ├── monitoring/     # Liveness & Readiness probes
│   │   ├── persistence/    # Repositório persistente JSON/JSONL (admin, team, portfolio, crm)
│   │   ├── queue/          # Fila de tarefas assíncronas com retentativas
│   │   └── services/       # Evolution API Client (WhatsApp) & SMS Gateways
│   └── interfaces/         # Camada HTTP Express (Rotas, Controladores, Middlewares)
│       └── http/
│           ├── controllers/ # FormsController, HealthController, AdminController
│           ├── routes/      # Rotas v1 (/forms, /health, /admin)
│           ├── app.js       # Configuração da app Express (CORS, Rate Limiting)
│           └── server.js    # Gestor de ciclo de vida e Graceful Shutdown
├── data/                   # Ficheiros de dados persistentes do microserviço
├── test/                   # Suite de testes automatizados
├── Dockerfile              # Imagem Docker de produção
└── docker-compose.yml      # Orquestração local do microserviço + Evolution API
```

---

## 🚀 Como Executar de Forma Independente

### 1. Requisitos
- Node.js >= 18
- Porta `3001` disponível (ou definida via variável `PORT`)

### 2. Instalação e Execução
```bash
cd server
npm install
npm run dev   # Executa em modo watch
# ou
npm start     # Executa em modo produção
```

O microserviço iniciará em `http://localhost:3001`.

### 3. Execução dos Testes Automatizados
```bash
npm test
```

---

## 📡 Catálogo de Endpoints RESTful

### 1. Monitorização & Health Check
- `GET /health` - Verificação global de integridade (Status, Memória, SMTP, Fila)
- `GET /health/live` - Liveness probe (Kubernetes / Docker)
- `GET /health/ready` - Readiness probe

### 2. Formulários Públicos
- `POST /api/v1/forms/submit` - Submissão de pedidos de orçamento/contacto
- `GET /api/v1/forms/recent` - Consulta de submissões recentes

### 3. Gestão Administrativa & Omnicanal (`/api/v1/admin`)
- **Dashboard**: `GET /api/v1/admin/dashboard`
- **WhatsApp (Evolution API)**:
  - `GET /api/v1/admin/whatsapp/status`
  - `GET /api/v1/admin/whatsapp/qrcode`
  - `POST /api/v1/admin/whatsapp/send`
- **Email (SMTP & IMAP)**:
  - `GET /api/v1/admin/email/status`
  - `POST /api/v1/admin/email/test-send`
- **Disparo em Massa (WhatsApp, Email & SMS)**:
  - `GET /api/v1/admin/broadcast`
  - `POST /api/v1/admin/broadcast`
- **CRM & Funil de Vendas**:
  - `GET /api/v1/admin/crm/deals`
  - `POST /api/v1/admin/crm/deals`
  - `PUT /api/v1/admin/crm/deals/:id/stage`
  - `POST /api/v1/admin/crm/deals/:id/interactions`
  - `DELETE /api/v1/admin/crm/deals/:id`
- **Central de Atendimento Multicanal**:
  - `GET /api/v1/admin/support`
  - `POST /api/v1/admin/support/:id/messages`
  - `PUT /api/v1/admin/support/:id/status`
- **Conteúdo (Notícias, Equipa, Portfólio)**:
  - `/api/v1/admin/news` (GET, POST, DELETE)
  - `/api/v1/admin/team` (GET, POST, DELETE)
  - `/api/v1/admin/portfolio` (GET, POST, DELETE)
- **Definições**:
  - `GET /api/v1/admin/settings`
  - `POST /api/v1/admin/settings`
  - `POST /api/v1/admin/settings/test-evolution`
  - `POST /api/v1/admin/settings/test-email`

---

## 🔐 Configuração das Variáveis de Ambiente (`.env`)
Configurado com suporte nativo a servidores angolanos e domínios corporativos:
```env
PORT=3001
DESTINATION_EMAIL=geral@jogimiltecnologias.it.ao
SMTP_HOST=mx109.angoweb.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=geral@jogimiltecnologias.it.ao
SMTP_PASS=Mussol22$$
IMAP_HOST=mx109.angoweb.net
IMAP_PORT=993
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=jogimil_secret_key_2026
EVOLUTION_INSTANCE_NAME=jogimil
```
