# Infrastructure & Docker Setup: chaibookLM

> Docker Compose configuration and container orchestration for local development and vector database services.

**Created:** 2026-07-25  
**Phase:** 3 — Infrastructure Specs  
**Architect:** Mimir / Architect Lead  

---

## 1. `docker-compose.yml` Specification

```yaml
version: '3.8'

services:
  # Qdrant Vector Database Service
  qdrant:
    image: qdrant/qdrant:v1.9.2
    container_name: chaibooklm-qdrant
    restart: unless-stopped
    ports:
      - "6333:6333" # REST API & Web Dashboard
      - "6334:6334" # gRPC API
    volumes:
      - qdrant_storage:/qdrant/storage
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/healthz"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Web Application Service (Optional Local Containerization)
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: chaibooklm-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - QDRANT_URL=http://qdrant:6333
      - MAIN_MODEL_BASE_URL=${MAIN_MODEL_BASE_URL}
      - MAIN_MODEL_NAME=${MAIN_MODEL_NAME}
      - MAIN_MODEL_API_KEY=${MAIN_MODEL_API_KEY}
      - LITE_MODEL_BASE_URL=${LITE_MODEL_BASE_URL}
      - LITE_MODEL_NAME=${LITE_MODEL_NAME}
      - LITE_MODEL_API_KEY=${LITE_MODEL_API_KEY}
      - EMBEDDING_MODEL_BASE_URL=${EMBEDDING_MODEL_BASE_URL}
      - EMBEDDING_MODEL_NAME=${EMBEDDING_MODEL_NAME}
      - EMBEDDING_MODEL_API_KEY=${EMBEDDING_MODEL_API_KEY}
    depends_on:
      qdrant:
        condition: service_healthy

volumes:
  qdrant_storage:
    driver: local
```

---

## 2. Infrastructure Operations

### Start Infrastructure
```bash
docker-compose up -d qdrant
```

### Access Qdrant Web Dashboard
* Web UI URL: `http://localhost:6333/dashboard`
* Health Check Endpoint: `http://localhost:6333/healthz`
