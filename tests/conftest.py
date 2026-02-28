import os
import sys
import pytest
from unittest.mock import MagicMock, patch
from decimal import Decimal

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Set test environment variables before importing modules
os.environ["SECRET_KEY"] = "test-secret-key-for-testing"
os.environ["MYSQL_USER"] = "test_user"
os.environ["MYSQL_PASSWORD"] = "test_password"
os.environ["MYSQL_SERVER"] = "localhost"
os.environ["MYSQL_PORT"] = "3306"
os.environ["MYSQL_DB"] = "test_db"

# Mock the database before importing app modules
@pytest.fixture(scope="session", autouse=True)
def mock_sqlmodel():
    """Mock SQLModel to avoid database connection during tests."""
    with patch('sqlmodel.SQLModel.metadata.create_all'):
        yield


@pytest.fixture
def mock_session():
    """Create a mock database session."""
    session = MagicMock()
    return session


@pytest.fixture
def sample_simulation_request():
    """Sample simulation request data."""
    from backend.app.models import SimulationRequest
    return SimulationRequest(
        initial_balance=Decimal("10000.00"),
        capital_utilization=Decimal("10.00"),
        risk_per_trade=Decimal("2.00"),
        risk_reward_ratio=Decimal("2.00"),
        win_rate=Decimal("50.00"),
        trades_per_day=5,
        simulation_days=30,
        fees_per_trade=Decimal("1.00"),
        risk_type="dynamic"
    )


@pytest.fixture
def sample_goal_planner_request():
    """Sample goal planner request data."""
    from backend.app.models import GoalPlannerRequest
    return GoalPlannerRequest(
        initial_balance=Decimal("10000.00"),
        target_balance=Decimal("50000.00"),
        deadline_months=12
    )


@pytest.fixture
def sample_health_analysis_request():
    """Sample health analysis request data."""
    from backend.app.models import HealthAnalysisRequest, TradeItem
    return HealthAnalysisRequest(
        trades=[
            TradeItem(pnl=Decimal("100.00"), risk_amount=Decimal("50.00"), balance=Decimal("10000.00"), is_win=True),
            TradeItem(pnl=-Decimal("50.00"), risk_amount=Decimal("50.00"), balance=Decimal("10100.00"), is_win=False),
            TradeItem(pnl=Decimal("150.00"), risk_amount=Decimal("50.00"), balance=Decimal("10050.00"), is_win=True),
        ]
    )


@pytest.fixture
def sample_user():
    """Sample user data."""
    from backend.app.models import User
    user = User(
        id=1,
        tenant_id=1,
        username="testuser",
        email="test@example.com",
        country_code="+1",
        phone_number="1234567890",
        full_name="Test User",
        hashed_password="hashed_password",
        role="user",
        status="active"
    )
    return user


@pytest.fixture
def sample_tenant():
    """Sample tenant data."""
    from backend.app.models import Tenant
    return Tenant(
        id=1,
        name="Test Tenant",
        domain="test.example.com",
        is_active=True
    )


@pytest.fixture
def mock_decode_token():
    """Mock token decode function."""
    with patch('backend.app.dependencies.decode_access_token') as mock:
        mock.return_value = {"sub": "testuser", "tenant_id": 1}
        yield mock
