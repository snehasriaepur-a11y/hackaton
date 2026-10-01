FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

FROM node:20-alpine
WORKDIR /app
COPY --from=frontend-build /app/.next ./.next
COPY --from=frontend-build /app/public ./public
COPY --from=backend-build /app ./backend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "backend/src/index.js"]