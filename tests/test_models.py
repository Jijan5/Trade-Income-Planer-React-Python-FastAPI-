import pytest
from decimal import Decimal
from datetime import datetime

from backend.app.models import (
    SimulationRequest,
    SimulationResponse,
    DailyResult,
    TradeResult,
    GoalPlannerRequest,
    GoalPlannerResponse,
    HealthAnalysisRequest,
    HealthAnalysisResponse,
    TradeItem,
    UserCreate,
    UserRead,
    PostCreate,
    PostResponse,
    CommentCreate,
    CommentResponse,
    CommunityCreate,
    ContactMessageCreate,
    FeedbackCreate,
    ManualTradeCreate,
    ReportCreate,
    BroadcastRequest
)


class TestSimulationRequest:
    """Test SimulationRequest model validation."""

    def test_valid_simulation_request(self):
        """Test creating a valid simulation request."""
        request = SimulationRequest(
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
        
        assert request.initial_balance == Decimal("10000.00")
        assert request.risk_type == "dynamic"

    def test_simulation_request_decimal_quantization(self):
        """Test that initial_balance is quantized to 2 decimal places."""
        request = SimulationRequest(
            initial_balance=Decimal("10000.001"),
            capital_utilization=Decimal("10.00"),
            risk_per_trade=Decimal("2.00"),
            risk_reward_ratio=Decimal("2.00"),
            win_rate=Decimal("50.00"),
            trades_per_day=5,
            simulation_days=30,
            fees_per_trade=Decimal("1.00"),
            risk_type="dynamic"
        )
        
        # Should be quantized to 10000.00
        assert request.initial_balance == Decimal("10000.00")

    def test_invalid_initial_balance_zero(self):
        """Test that initial_balance must be greater than 0."""
        with pytest.raises(ValueError):
            SimulationRequest(
                initial_balance=Decimal("0"),
                capital_utilization=Decimal("10.00"),
                risk_per_trade=Decimal("2.00"),
                risk_reward_ratio=Decimal("2.00"),
                win_rate=Decimal("50.00"),
                trades_per_day=5,
                simulation_days=30,
                fees_per_trade=Decimal("1.00"),
                risk_type="dynamic"
            )

    def test_invalid_initial_balance_negative(self):
        """Test that initial_balance cannot be negative."""
        with pytest.raises(ValueError):
            SimulationRequest(
                initial_balance=Decimal("-1000"),
                capital_utilization=Decimal("10.00"),
                risk_per_trade=Decimal("2.00"),
                risk_reward_ratio=Decimal("2.00"),
                win_rate=Decimal("50.00"),
                trades_per_day=5,
                simulation_days=30,
                fees_per_trade=Decimal("1.00"),
                risk_type="dynamic"
            )

    def test_invalid_simulation_days_exceeded(self):
        """Test that simulation_days cannot exceed 3650."""
        with pytest.raises(ValueError):
            SimulationRequest(
                initial_balance=Decimal("10000"),
                capital_utilization=Decimal("10.00"),
                risk_per_trade=Decimal("2.00"),
                risk_reward_ratio=Decimal("2.00"),
                win_rate=Decimal("50.00"),
                trades_per_day=5,
                simulation_days=4000,  # Exceeds max
                fees_per_trade=Decimal("1.00"),
                risk_type="dynamic"
            )

    def test_default_fees_per_trade(self):
        """Test default value for fees_per_trade."""
        request = SimulationRequest(
            initial_balance=Decimal("10000"),
            capital_utilization=Decimal("10.00"),
            risk_per_trade=Decimal("2.00"),
            risk_reward_ratio=Decimal("2.00"),
            win_rate=Decimal("50.00"),
            trades_per_day=5,
            simulation_days=30,
            risk_type="dynamic"
        )
        
        assert request.fees_per_trade == Decimal("0")

    def test_valid_risk_types(self):
        """Test both dynamic and fixed risk types."""
        for risk_type in ["dynamic", "fixed"]:
            request = SimulationRequest(
                initial_balance=Decimal("10000"),
                capital_utilization=Decimal("10.00"),
                risk_per_trade=Decimal("2.00"),
                risk_reward_ratio=Decimal("2.00"),
                win_rate=Decimal("50.00"),
                trades_per_day=5,
                simulation_days=30,
                risk_type=risk_type
            )
            assert request.risk_type == risk_type


class TestGoalPlannerRequest:
    """Test GoalPlannerRequest model validation."""

    def test_valid_goal_request(self):
        """Test creating a valid goal planner request."""
        request = GoalPlannerRequest(
            initial_balance=Decimal("10000.00"),
            target_balance=Decimal("50000.00"),
            deadline_months=12
        )
        
        assert request.initial_balance == Decimal("10000.00")
        assert request.target_balance == Decimal("50000.00")
        assert request.deadline_months == 12

    def test_invalid_initial_balance(self):
        """Test that initial_balance must be greater than 0."""
        with pytest.raises(ValueError):
            GoalPlannerRequest(
                initial_balance=Decimal("0"),
                target_balance=Decimal("50000.00"),
                deadline_months=12
            )

    def test_invalid_target_balance(self):
        """Test that target_balance must be greater than 0."""
        with pytest.raises(ValueError):
            GoalPlannerRequest(
                initial_balance=Decimal("10000.00"),
                target_balance=Decimal("0"),
                deadline_months=12
            )

    def test_invalid_deadline_months(self):
        """Test that deadline_months must be between 1 and 120."""
        with pytest.raises(ValueError):
            GoalPlannerRequest(
                initial_balance=Decimal("10000.00"),
                target_balance=Decimal("50000.00"),
                deadline_months=0
            )


class TestHealthAnalysisRequest:
    """Test HealthAnalysisRequest model."""

    def test_valid_health_request(self):
        """Test creating a valid health analysis request."""
        request = HealthAnalysisRequest(
            trades=[
                TradeItem(
                    pnl=Decimal("100.00"),
                    risk_amount=Decimal("50.00"),
                    balance=Decimal("10000.00"),
                    is_win=True
                )
            ]
        )
        
        assert len(request.trades) == 1
        assert request.trades[0].is_win is True

    def test_empty_trades(self):
        """Test health analysis with empty trades list."""
        request = HealthAnalysisRequest(trades=[])
        assert len(request.trades) == 0


class TestUserModels:
    """Test user-related models."""

    def test_valid_user_create(self):
        """Test creating a valid user."""
        user = UserCreate(
            username="testuser",
            email="test@example.com",
            password="password123",
            full_name="Test User",
            country_code="+1",
            phone_number="1234567890"
        )
        
        assert user.username == "testuser"
        assert user.email == "test@example.com"

    def test_user_read_model(self):
        """Test UserRead model."""
        user = UserRead(
            id=1,
            tenant_id=1,
            username="testuser",
            email="test@example.com",
            role="user",
            avatar_url=None,
            plan="Free",
            status="active"
        )
        
        assert user.id == 1
        assert user.role == "user"


class TestPostModels:
    """Test post-related models."""

    def test_valid_post_create(self):
        """Test creating a valid post."""
        post = PostCreate(
            content="This is a test post",
            image_url=None,
            link_url=None
        )
        
        assert post.content == "This is a test post"

    def test_post_with_image(self):
        """Test creating a post with an image."""
        post = PostCreate(
            content="Post with image",
            image_url="https://example.com/image.jpg"
        )
        
        assert post.image_url == "https://example.com/image.jpg"


class TestCommentModels:
    """Test comment-related models."""

    def test_valid_comment_create(self):
        """Test creating a valid comment."""
        comment = CommentCreate(
            content="This is a comment"
        )
        
        assert comment.content == "This is a comment"

    def test_comment_with_parent(self):
        """Test creating a reply to a comment."""
        comment = CommentCreate(
            content="This is a reply",
            parent_id=1
        )
        
        assert comment.parent_id == 1


class TestCommunityModels:
    """Test community-related models."""

    def test_valid_community_create(self):
        """Test creating a valid community."""
        community = CommunityCreate(
            name="Test Community",
            description="A test community"
        )
        
        assert community.name == "Test Community"
        assert community.description == "A test community"


class TestContactMessageModels:
    """Test contact message models."""

    def test_valid_contact_message(self):
        """Test creating a valid contact message."""
        message = ContactMessageCreate(
            name="John Doe",
            email="john@example.com",
            subject="Test Subject",
            message="Test message content"
        )
        
        assert message.name == "John Doe"
        assert message.email == "john@example.com"


class TestFeedbackModels:
    """Test feedback models."""

    def test_valid_feedback(self):
        """Test creating valid feedback."""
        feedback = FeedbackCreate(
            email="user@example.com",
            message="Great app!"
        )
        
        assert feedback.email == "user@example.com"
        assert feedback.message == "Great app!"


class TestManualTradeModels:
    """Test manual trade models."""

    def test_valid_manual_trade(self):
        """Test creating a valid manual trade."""
        trade = ManualTradeCreate(
            symbol="BTCUSD",
            entry_price=50000.0,
            exit_price=51000.0,
            pnl=1000.0,
            is_win=True,
            notes="Test trade"
        )
        
        assert trade.symbol == "BTCUSD"
        assert trade.is_win is True

    def test_manual_trade_without_notes(self):
        """Test creating a manual trade without notes."""
        trade = ManualTradeCreate(
            symbol="ETHUSD",
            entry_price=3000.0,
            exit_price=2900.0,
            pnl=-100.0,
            is_win=False
        )
        
        assert trade.notes is None


class TestReportModels:
    """Test report models."""

    def test_valid_report(self):
        """Test creating a valid report."""
        report = ReportCreate(
            post_id=1,
            reason="Spam"
        )
        
        assert report.post_id == 1
        assert report.reason == "Spam"


class TestBroadcastRequest:
    """Test broadcast request model."""

    def test_valid_broadcast(self):
        """Test creating a valid broadcast request."""
        broadcast = BroadcastRequest(
            message="Hello everyone!"
        )
        
        assert broadcast.message == "Hello everyone!"
