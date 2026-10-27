FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
FROM python:3.12-slim
WORKDIR /app
COPY backend/ ./backend/
COPY data/ ./data/
COPY --from=frontend /app/frontend/dist ./frontend/dist
ENV PORT=8000
EXPOSE 8000
USER 10001
CMD ["python", "backend/server.py"]
