FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run init-db && npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache nginx

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY src/db/schema.js ./src/db/schema.js
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public/private_chef.db ./public/private_chef.db
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV DB_PATH=/app/public/private_chef.db
ENV NODE_ENV=production
ENV SERVE_STATIC=0

EXPOSE 80
VOLUME ["/app/public"]

CMD ["/docker-entrypoint.sh"]
