# Docker Setup Guide

This guide explains how to run Trade Income Planner using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose 2.0 or higher

## Quick Start

1. Clone the repository and navigate to the project directory:

```
bash
git clone https://github.com/Jijan5/Trade-Income-Planer-React-Python-FastAPI-.git
cd trade-income-planer
```

2. Create a `.env` file with your configuration (see [Environment Variables](environment.md))

3. Build and start the containers:

```
bash
docker-compose up --build
```

4. Access the application at `http://localhost:8080`

## Docker Compose Services

The `docker-compose.yaml` defines the following services:

### Backend Service

The main application service that runs FastAPI.

- **Image**: Built from Dockerfile
- **Port**: 8080
- **Environment Variables**: See configuration
- **Dependencies**: MySQL database (waits until healthy)

### MySQL Database

MySQL 8.0 database for persistent storage.

- **Image**: mysql:8.0
- **Port**: 3306
- **Volume**: mysql_data (persistent storage)
- **Health Check**: Enabled

### Test Service (Optional)

Run unit tests in Docker:

```
bash
docker-compose --profile test up
```

## Managing Docker Containers

### Start Services

```
bash
# Start in detached mode
docker-compose up -d

# Start with logs
docker-compose up
```

### Stop Services

```
bash
docker-compose down
```

### View Logs

```
bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f db
```

### Rebuild Services

```
bash
docker-compose build
docker-compose up -d
```

## Volume Management

The database data is persisted in a Docker volume:

```
bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect trade-income-planer_mysql_data

# Remove volume ( WARNING: deletes all data)
docker volume rm trade-income-planer_mysql_data
```

## Network Configuration

Services communicate on a bridge network named `app-network`.

## Production Considerations

For production deployment:

1. Use strong passwords in `.env`
2. Enable SSL/TLS
3. Configure proper CORS origins
4. Set up automated backups
5. Use production-grade MySQL
6. Consider using Docker Swarm or Kubernetes
