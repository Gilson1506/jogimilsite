FROM node:20-alpine AS base

WORKDIR /app

# Instalar dependências de produção
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copiar código fonte
COPY src ./src

# Criar pasta de dados com permissões adequadas
RUN mkdir -p data && chown -R node:node /app

USER node

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
