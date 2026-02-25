FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build:gateway && npm run build:user-service && npm run build:tournament-service

FROM node:24-alpine AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

# Default command is overridden per service in docker-compose.yml.
CMD ["node", "dist/apps/gateway/gateway/src/main.js"]
