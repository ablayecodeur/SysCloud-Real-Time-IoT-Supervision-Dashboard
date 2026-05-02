FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache tini

FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
