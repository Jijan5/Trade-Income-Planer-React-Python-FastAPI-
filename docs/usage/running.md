# Running the Application

This guide explains how to run the Trade Income Planner application.

## Running Locally

### Prerequisites

- Python 3.13+
- Node.js 25.5.0+
- MySQL 8.0+

### Backend

1. Navigate to the project directory
2. Activate the virtual environment:

```
   # Windows
   venv\Scripts\activate

   # Linux/Mac
   source venv/bin/activate

```

3. Run the backend server:

```
   uvicorn backend.app.main:app --reload

```

4. The API will be available at `http://localhost:8080`

### Frontend (Development)

1. Install dependencies:

```
   npm install

```

2. Start the development server:

```
   npm run dev

```

3. The frontend will be available at `http://localhost:5173`

### Running with Docker

The easiest way to run the full application:

```
bash
# Build and start all services
docker-compose up --build

# Or in detached mode
docker-compose up -d
```

Access the application at `http://localhost:8080`

## Running Tests

### Local Tests

```
bash
# Run all tests
python -m pytest tests/

# Run with coverage
python -m pytest tests/ --cov=backend.app --cov-report=html
```

### Docker Tests

```
bash
# Run tests in Docker
docker-compose --profile test up
```

## Common Commands

### Backend

```
bash
# Run with specific port
uvicorn backend.app.main:app --port 8000

# Run with debug mode
uvicorn backend.app.main:app --reload --log-level debug

# Run with custom host
uvicorn backend.app.main:app --host 0.0.0.0 --port 8080
```

### Frontend

```
bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Docker

```
bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Environment-Specific Running

### Development

```
bash
# Backend
uvicorn backend.app.main:app --reload

# Frontend
npm run dev
```

### Production

```
bash
# Build frontend
npm run build

# Run with production settings
uvicorn backend.app.main:app --host 0.0.0.0 --port 8080 --workers 4
```

### Testing

```
bash
# Run tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_engine.py -v

# Run with coverage
python -m pytest tests/ --cov=backend.app --cov-report=term-missing
```

## Port Configuration

| Service      | Default Port |
| ------------ | ------------ |
| Backend API  | 8080         |
| Frontend Dev | 5173         |
| MySQL        | 3306         |

To change ports, see the respective configuration files.
