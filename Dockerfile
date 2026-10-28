FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY server ./server
COPY src/organization.js ./src/organization.js
COPY src/hub-model.js ./src/hub-model.js
USER node
EXPOSE 3001
CMD ["node","server/index.js"]
