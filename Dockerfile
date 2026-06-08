# Build stage for frontend
FROM node:20-alpine AS frontend

WORKDIR /app/web

# Copy web files
COPY web/package*.json ./
RUN npm install

COPY web/ ./
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend/ ./

# Copy built frontend
COPY --from=frontend /app/web/dist ./public

# Create data directories
RUN mkdir -p /app/data/packages && \
    mkdir -p /app/data/packages/_temp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start
CMD ["node", "server.js"]
