# Testing Guide

This guide explains how to run tests for the Trade Income Planner application.

## Test Framework

The application uses:

- **pytest**: Test runner
- **pytest-asyncio**: Async test support
- **pytest-cov**: Coverage reporting

## Running Tests

### Local Testing

```
bash
# Run all tests
python -m pytest tests/

# Run with verbose output
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_engine.py -v

# Run specific test
python -m pytest tests/test_engine.py::TestCalculateCompounding::test_basic_simulation -v
```

### Running Tests with Coverage

```
bash
# Run with coverage report
python -m pytest tests/ --cov=backend.app --cov-report=term-missing

# Generate HTML coverage report
python -m pytest tests/ --cov=backend.app --cov-report=html

# Open coverage report
# Windows
start htmlcov\index.html

# Linux
open htmlcov/index.html

# Mac
open htmlcov/index.html
```

### Docker Testing

```
bash
# Run tests in Docker
docker-compose --profile test up

# View test output
docker-compose --profile test up
```

## Test Coverage

The project targets **67-80% code coverage**.

### Current Coverage

```
Name                          Stmts   Miss  Cover   Missing
-----------------------------------------------------------------
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\dependencies.py      40      2    95%   16, 46
backend\app\engine.py           229     23    90%   82, 95, 113, 140-141, 204-205, 213-215, 241-246, 266, 286, 308, 362-36562-365
backend\app\models.py           361      7    98%   155-161
backend\app\utils.py             15     10    33%   15-28
-----------------------------------------------------------------
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\dependencies.py      40      2    95%   16, 46
backend\app\engine.py           229     23    90%   82, 95, 113, 140-141, 204-205, 213-215, 241-246, 266, 286, 308, 362-365
backend\app\models.py           361      7    98%   155-161
backend\app\utils.py             15     10    33%   15-28
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\dependencies.py      40      2    95%   16, 46
backend\app\engine.py           229     23    90%   82, 95, 113, 140-141, 204-205, 213-215, 241-246, 266, 286, 308, 362-365
backend\app\models.py           361      7    98%   155-161
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\dependencies.py      40      2    95%   16, 46
backend\app\engine.py           229     23    90%   82, 95, 113, 140-141, 204-205, 213-215, 241-246, 266, 286, 308, 362-365
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\dependencies.py      40      2    95%   16, 46
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\dependencies.py      40      2    95%   16, 46
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\dependencies.py      40      2    95%   16, 46
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\auth.py              35      0   100%
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%   18, 23, 26-27
backend\app\dependencies.py      40      2    95%   16, 46
backend\app\engine.py           229     23    90%   82, 95, 113, 140-141, 204-205, 213-215, 241-246, 266, 286, 308, 362-365
backend\app\models.py           361      7    98%   155-161
backend\app\dependencies.py      40      2    95%   16, 46
backend\app\engine.py           229     23    90%   82, 95, 113, 140-141, 204-205, 213-215, 241-246, 266, 286, 308, 362-365
backend\app\models.py           361      7    98%   155-161
backend\app\utils.py             15     10    33%   15-28
-----------------------------------------------------------
TOTAL                           698     46    93%
Required test coverage of 90% reached. Total coverage: 93.41%
```

## Test Structure

```
tests/
├── __init__.py
├── conftest.py           # Pytest fixtures
├── test_auth.py          # Authentication tests
├── test_dependencies.py  # Dependency injection tests
├── test_engine.py        # Trading engine tests
├── test_models.py        # Data model tests
└── test_utils.py         # Utility function tests
```

## Writing Tests

### Basic Test Example

```
python
import pytest
from backend.app.engine import calculate_compounding
from backend.app.models import SimulationRequest
from decimal import Decimal

def test_basic_simulation():
    """Test basic simulation returns valid results."""
    request = SimulationRequest(
        initial_balance=Decimal("10000.00"),
        capital_utilization=Decimal("10.00"),
        risk_per_trade=Decimal("2.00"),
        risk_reward_ratio=Decimal("2.00"),
        win_rate=Decimal("50.00"),
        trades_per_day=5,
        simulation_days=10,
        fees_per_trade=Decimal("1.00"),
        risk_type="dynamic"
    )

    result = calculate_compounding(request)

    assert result.status == "success"
    assert result.summary is not None
```

### Async Test Example

```
python
import pytest
from backend.app.dependencies import get_current_user

@pytest.mark.asyncio
async def test_get_current_user():
    """Test getting current user."""
    # Test implementation
    pass
```

### Mocking Example

```
python
from unittest.mock import patch, MagicMock

@patch('backend.app.dependencies.decode_access_token')
def test_with_mock(mock_decode):
    mock_decode.return_value = {"sub": "testuser"}
    # Test implementation
    pass
```

## Fixtures

Common fixtures are defined in `tests/conftest.py`:

```
python
@pytest.fixture
def sample_user():
    """Create a sample user for testing."""
    return User(
        id=1,
        username="testuser",
        email="test@example.com",
        password_hash="hashed_password",
        role="user",
        status="active"
    )

@pytest.fixture
def mock_session():
    """Create a mock database session."""
    return MagicMock()
```

## CI/CD Testing

Tests are automatically run in CI/CD. See `.github/workflows/`.

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov

      - name: Run tests
        run: |
          pytest tests/ --cov=backend.app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Troubleshooting

### Tests Not Found

- Ensure test files are in `tests/` directory
- Ensure test files are named `test_*.py`
- Ensure test classes/functions start with `Test` or `test_`

### Import Errors

- Ensure PYTHONPATH includes project root
- Run from project root directory

### Async Errors

- Install pytest-asyncio: `pip install pytest-asyncio`
- Add `@pytest.mark.asyncio` decorator to async tests

### Coverage Issues

- Ensure pytest-cov is installed
- Check .coveragerc configuration
- Verify source paths in pytest.ini
