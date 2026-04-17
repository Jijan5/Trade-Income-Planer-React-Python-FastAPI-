#!/bin/bash

# Entry point script for running unit tests AND app
# Supports both testing and server start

set -e

echo "========================================"
echo "Entry point script"
echo "Usage: $0 [test|start]"
echo "========================================"

case "$1" in
  "test")
    echo "Installing test dependencies..."
    pip install pytest pytest-asyncio pytest-cov --quiet
    
    echo "Running unit tests with coverage..."
    export PYTHONPATH="${PYTHONPATH}:$(pwd)"
    pytest tests/ \
        --cov=backend.app \
        --cov-report=term-missing \
        --cov-report=html:coverage_html \
        --cov-fail-under=67 \
        -v
    
    echo "Tests completed!"
    if [ -f "coverage_html/index.html" ]; then
        echo "Coverage report: coverage_html/index.html"
    fi
    ;;
  "start")
    echo "Starting scalable production server..."
    # Dynamic workers based on cores
    WEB_CONCURRENCY=$(( $(nproc) * 2 ))
    echo "Using WEB_CONCURRENCY=$WEB_CONCURRENCY"
    exec gunicorn backend.app.main:app \
        --bind 0.0.0.0:${PORT:-8080} \
        --workers $WEB_CONCURRENCY \
        --worker-class uvicorn.workers.UvicornWorker \
        --worker-connections 1000 \
        --timeout 120
    ;;
  *)
    echo "Error: Unknown command. Use 'test' or 'start'"
    exit 1
    ;;
esac
