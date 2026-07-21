# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- API runtime stage ----
FROM node:22-alpine AS api
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY gateway ./gateway
COPY queues ./queues
COPY --from=build /app/dist ./dist
EXPOSE 4000
RUN chown -R node /usr/src/app
USER node
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "server/index.js"]
