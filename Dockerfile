# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/server.cjs ./server.cjs
EXPOSE 3000
USER node
CMD ["node", "server.cjs"]
