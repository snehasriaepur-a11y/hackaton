FROM node:20-alpine AS web-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS web
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=web-build /app/node_modules ./node_modules
COPY --from=web-build /app/.next ./.next
COPY --from=web-build /app/public ./public
COPY --from=web-build /app/package.json ./package.json
COPY --from=web-build /app/next.config.js ./next.config.js
EXPOSE 3000
CMD ["npm", "run", "start"]

FROM node:20-alpine AS engine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
EXPOSE 5000
CMD ["node", "src/index.js"]
