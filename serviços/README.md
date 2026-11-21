# Arquitetura de Microserviços · JOGIMIL (`serviços/`)

Todos os microserviços independentes da JOGIMIL estão organizados como subpastas autónomas dentro de `serviços/`:

| Microserviço | Diretório | Porta Padrão | Responsabilidade |
| :--- | :--- | :---: | :--- |
| **Core Omnichannel Service** | `serviços/core-omnichannel-service/` | `3101` | API Gateway, CRM, Atendimento Omnicanal, WhatsApp (Evolution API), Email (SMTP/IMAP), Portal Público, RBAC & Auditoria |
| **Meta Social Service** | `serviços/meta-social-service/` | `3102` | Integração oficial Meta Graph API v21.0: OAuth (Facebook Login Unificado, Instagram Login Direto, Threads), Publicação Multiplataforma (Posts, Reels, Stories, Carrossel) e Mensagens Diretas (Messenger + Instagram Direct com tag `HUMAN_AGENT`) |

## Comandos (a partir da raiz do projeto)
- **Core Omnichannel Service:** `npm run backend:dev` (porta `3101`)
- **Meta Social Service:** `npm run meta:dev` (porta `3102`)
- Quando o `meta-social-service` não está num processo separado, o `core-omnichannel-service` ativa automaticamente a ponte local (*in-process fallback*) sem downtime.

## Como adicionar novos microserviços
1. Crie uma nova subpasta independente em `serviços/<nome-do-servico>/` com o seu próprio `package.json` e `src/server.js` (ex.: porta `3103+`).
2. Adicione um cliente HTTP dedicado no Core Gateway caso precise de integração com o painel Admin.
