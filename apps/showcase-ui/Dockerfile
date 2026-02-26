FROM node:24-alpine AS build
WORKDIR /app
COPY apps/showcase-ui/package.json apps/showcase-ui/package-lock.json ./
RUN npm ci
COPY apps/showcase-ui ./
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY apps/showcase-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

