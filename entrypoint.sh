#!/bin/bash

# Entry point script for running unit tests
# This script installs dependencies and runs tests with coverage

set -e

echo "========================================"
echo "Installing test dependencies..."
echo "========================================"

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov --quiet

echo "========================================"
echo "Running unit tests with coverage..."
echo "========================================"

# Set PYTHONPATH to include the project root
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Run pytest with coverage
# Target: 67-80% code coverage
pytest tests/ \
    --cov=backend.app \
    --cov-report=term-missing \
    --cov-report=html:coverage_html \
    --cov-fail-under=67 \
    -v

echo "========================================"
echo "Tests completed!"
echo "========================================"

# Display coverage summary if available
if [ -f "coverage_html/index.html" ]; then
    echo "Coverage report generated at: coverage_html/index.html"
fi
