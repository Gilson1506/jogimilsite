# Arquitetura do Microserviço de Formulários e Notificações (JOGIMIL)

Este documento descreve detalhadamente a arquitetura interna do microserviço de formulários e notificações da **JOGIMIL - Tecnologias, Lda.**, concebido segundo os princípios de **Clean Architecture (Arquitetura Limpa)**, **Arquitetura Hexagonal (Ports & Adapters)** e **Domain-Driven Design (DDD)**.

---

## 🏛️ Visão Geral e Princípios Fundamentais

O microserviço é um serviço autónomo, desacoplado de qualquer tecnologia de frontend, responsável pela ingestão, persistência auditável e notificação assíncrona de todas as submissões de clientes provenientes do ecossistema digital da JOGIMIL.

### Princípios Chave:
1. **Regra de Dependência**: O código do domínio e dos casos de uso não depende de bibliotecas externas, bases de dados ou protocolos de transporte (HTTP/Express).
2. **Inversão de Dependências (Hexagonal Ports & Adapters)**: As operações externas (envio de email, persistência, filas) são contratos abstratos (*Ports*). O Express, o Nodemailer e o sistema de ficheiros são apenas adaptadores (*Adapters*).
3. **Processamento Assíncrono com Fila de Tarefas**: O cliente HTTP recebe confirmação imediata (com ID de rastreio e *Correlation ID*), enquanto a entrega de e-mails via SMTP é processada em segundo plano por um worker com *Exponential Backoff* e até 3 tentativas automáticas.
4. **Resiliência e Tolerância a Falhas**: Caso o servidor SMTP esteja inacessível ou ocorram quebras de conectividade, a submissão permanece garantida e auditada no registo local persistente.
5. **Observabilidade Total**: Cada requisição transporta um cabeçalho `X-Correlation-ID` que é propagado em todos os logs estruturados em formato JSON, facilitando auditoria e depuração em produção.

---

## 📐 Estrutura de Camadas (Layers)

```
src/
├── domain/                      # 1. CAMADA DE DOMÍNIO (Pure Business Rules)
│   ├── entities/                # Entidades com identidade e ciclo de vida (SubmissionEntity)
│   ├── value-objects/           # Objetos de Valor Imutáveis (EmailVO, PhoneVO, FormTypeVO)
│   ├── events/                  # Eventos de domínio (FormSubmittedEvent)
│   └── errors/                  # Erros semânticos (DomainError, ValidationError)
│
├── application/                 # 2. CAMADA DE APLICAÇÃO (Use Cases & Ports)
│   ├── dtos/                    # Data Transfer Objects (SubmitFormDTO)
│   ├── ports/                   # Contratos/Interfaces abstratas (IMailProvider, ISubmissionRepository, IQueuePort)
│   └── use-cases/               # Orquestração de negócio (SubmitFormUseCase, ListSubmissionsUseCase, GetHealthUseCase)
│
├── infrastructure/              # 3. CAMADA DE INFRAESTRUTURA (Adapters & External Tools)
│   ├── config/                  # Variáveis de ambiente e validação
│   ├── logging/                 # Logger estruturado JSON com níveis e correlation ID
│   ├── mail/                    # Adaptador Nodemailer + Templates corporativos da JOGIMIL
│   ├── persistence/             # Repositório de submissões em JSONL (Event Ledger)
│   ├── queue/                   # Fila de tarefas assíncrona em memória com retries e backoff
│   └── monitoring/              # Probes de Liveness e Readiness
│
└── interfaces/                  # 4. CAMADA DE INTERFACES / APRESENTAÇÃO
    └── http/
        ├── middlewares/         # Correlation ID, Rate Limiter, Request Logger, RFC 7807 Error Handler
        ├── controllers/         # Controladores HTTP desacoplados da lógica de negócio
        ├── routes/              # Roteamento versionado (/api/v1/...) e retrocompatibilidade
        ├── app.js               # Montagem da aplicação Express
        └── server.js            # Servidor HTTP com Graceful Shutdown (drenagem de fila)
```

---

## 🔄 Fluxo de Processamento de uma Submissão

```
[ Cliente / Website ]
       │
       │  POST /api/v1/forms/submit
       ▼
[ Correlation ID Middleware ] ── Atribui X-Correlation-ID (Trace ID)
       │
[ Rate Limiter Middleware ]   ── Proteção contra ataques e spam
       │
[ FormsController ]           ── Valida DTO de entrada
       │
       ▼
[ SubmitFormUseCase ]
       │
       ├─► 1. Cria Entidade de Domínio (SubmissionEntity + Value Objects)
       │
       ├─► 2. Persiste imediatamente no Repositório (JsonlSubmissionRepository)
       │
       ├─► 3. Enfileira Tarefa no Job Queue (InMemoryJobQueue)
       │
       ▼
[ Resposta HTTP 200 OK ] ───── Retorna ID único (ex: sub_...) e Correlation ID
       │
  (Em Segundo Plano)
       │
[ Worker Assíncrono ]
       │
       ├─► Executa envio via NodemailerAdapter
       ├─► Se falhar: Retenta após 2s, 4s, 8s (Exponential Backoff)
       └─► Atualiza estado da submissão para DISPATCHED no repositório
```

---

## 🛡️ Gestão de Erros Padronizada (RFC 7807)

Todos os erros retornados pela API seguem a especificação **RFC 7807 Problem Details for HTTP APIs**:

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Error",
  "status": 422,
  "detail": "Email inválido: \"teste@invalido\"",
  "correlationId": "req_1793888000_a1b2c3d4"
}
```

---

## 🩺 Health Checks e Monitorização (Probes)

O microserviço disponibiliza endpoints padronizados para orquestradores como Kubernetes ou Docker Swarm:

- **`GET /health`**: Diagnóstico detalhado de todos os subsistemas (SMTP, Fila, Uptime, Versão).
- **`GET /health/live`**: Probe de Liveness (determina se o processo está ativo e respondendo).
- **`GET /health/ready`**: Probe de Readiness (determina se as dependências operacionais estão prontas para tráfego).

---

## 🔒 Paragem Controlada (Graceful Shutdown)

Ao receber os sinais `SIGTERM` ou `SIGINT`:
1. O servidor interrompe a receção de novas conexões HTTP.
2. A fila de tarefas ativa é drenada (`await queueService.drain()`), assegurando que nenhum email ou submissão em processamento seja perdido.
3. O processo é finalizado de forma limpa com código de saída 0.
