import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock

from backend.app.engine import (
    calculate_compounding,
    calculate_goal_plan,
    get_market_price,
    analyze_trade_health
)
from backend.app.models import (
    SimulationRequest,
    GoalPlannerRequest,
    HealthAnalysisRequest,
    TradeItem
)


class TestCalculateCompounding:
    """Test the trading simulation engine."""

    def test_basic_simulation(self, sample_simulation_request):
        """Test basic simulation returns valid results."""
        result = calculate_compounding(sample_simulation_request)
        
        assert result.status == "success"
        assert result.summary is not None
        assert result.daily_breakdown is not None
        assert result.monte_carlo is not None

    def test_simulation_summary_fields(self, sample_simulation_request):
        """Test that simulation summary contains required fields."""
        result = calculate_compounding(sample_simulation_request)
        summary = result.summary
        
        assert "initial_balance" in summary
        assert "final_balance" in summary
        assert "total_profit" in summary
        assert "total_roi" in summary
        assert "max_drawdown" in summary
        assert "profit_factor" in summary
        assert "expectancy" in summary
        assert "risk_of_ruin" in summary

    def test_simulation_daily_breakdown(self, sample_simulation_request):
        """Test that daily breakdown is generated correctly."""
        result = calculate_compounding(sample_simulation_request)
        
        # Should have at least one day of results
        assert len(result.daily_breakdown) > 0
        
        # Check first day's structure
        first_day = result.daily_breakdown[0]
        assert hasattr(first_day, 'day')
        assert hasattr(first_day, 'start_balance')
        assert hasattr(first_day, 'profit_loss')
        assert hasattr(first_day, 'end_balance')
        assert hasattr(first_day, 'roi')

    def test_simulation_monte_carlo(self, sample_simulation_request):
        """Test Monte Carlo simulation results."""
        result = calculate_compounding(sample_simulation_request)
        
        assert result.monte_carlo is not None
        mc = result.monte_carlo
        assert "iterations" in mc
        assert "worst_case" in mc
        assert "median" in mc
        assert "best_case" in mc
        assert "ruin_probability" in mc

    def test_simulation_trade_log(self, sample_simulation_request):
        """Test trade log generation."""
        result = calculate_compounding(sample_simulation_request)
        
        # Trade log should be limited to 100 entries
        assert len(result.trade_log) <= 100
        
        if len(result.trade_log) > 0:
            trade = result.trade_log[0]
            assert hasattr(trade, 'trade_no')
            assert hasattr(trade, 'day')
            assert hasattr(trade, 'result')
            assert trade.result in ["WIN", "LOSS"]

    def test_simulation_fixed_risk_type(self):
        """Test simulation with fixed risk type."""
        request = SimulationRequest(
            initial_balance=Decimal("10000.00"),
            capital_utilization=Decimal("10.00"),
            risk_per_trade=Decimal("2.00"),
            risk_reward_ratio=Decimal("2.00"),
            win_rate=Decimal("50.00"),
            trades_per_day=5,
            simulation_days=10,
            fees_per_trade=Decimal("1.00"),
            risk_type="fixed"
        )
        
        result = calculate_compounding(request)
        assert result.status == "success"

    def test_simulation_zero_win_rate(self):
        """Test simulation with 0% win rate."""
        request = SimulationRequest(
            initial_balance=Decimal("10000.00"),
            capital_utilization=Decimal("10.00"),
            risk_per_trade=Decimal("2.00"),
            risk_reward_ratio=Decimal("2.00"),
            win_rate=Decimal("0.00"),
            trades_per_day=5,
            simulation_days=10,
            fees_per_trade=Decimal("1.00"),
            risk_type="dynamic"
        )
        
        result = calculate_compounding(request)
        assert result.status == "success"
        # With 0% win rate, final balance should be less than initial
        final_balance = float(result.summary["final_balance"])
        assert final_balance < 10000.00

    def test_simulation_100_win_rate(self):
        """Test simulation with 100% win rate."""
        request = SimulationRequest(
            initial_balance=Decimal("10000.00"),
            capital_utilization=Decimal("10.00"),
            risk_per_trade=Decimal("2.00"),
            risk_reward_ratio=Decimal("2.00"),
            win_rate=Decimal("100.00"),
            trades_per_day=5,
            simulation_days=10,
            fees_per_trade=Decimal("1.00"),
            risk_type="dynamic"
        )
        
        result = calculate_compounding(request)
        assert result.status == "success"
        # With 100% win rate and positive RR, should be profitable
        final_balance = float(result.summary["final_balance"])
        assert final_balance > 10000.00


class TestCalculateGoalPlan:
    """Test goal planning functionality."""

    def test_basic_goal_plan(self, sample_goal_planner_request):
        """Test basic goal planning."""
        result = calculate_goal_plan(sample_goal_planner_request)
        
        assert result.status == "success"
        assert hasattr(result, 'required_monthly_return')
        assert hasattr(result, 'feasibility')
        assert hasattr(result, 'message')

    def test_goal_already_achieved(self):
        """Test when initial balance exceeds target."""
        request = GoalPlannerRequest(
            initial_balance=Decimal("50000.00"),
            target_balance=Decimal("10000.00"),
            deadline_months=12
        )
        
        result = calculate_goal_plan(request)
        
        assert result.status == "success"
        assert result.required_monthly_return == "0.00%"
        assert result.feasibility == "Achieved"

    def test_goal_very_unlikely(self):
        """Test very ambitious goal (>50% monthly)."""
        request = GoalPlannerRequest(
            initial_balance=Decimal("1000.00"),
            target_balance=Decimal("1000000.00"),  # 100x in 12 months
            deadline_months=12
        )
        
        result = calculate_goal_plan(request)
        
        assert result.status == "success"
        assert result.feasibility == "Very Unlikely"

    def test_goal_ambitious(self):
        """Test ambitious goal (20-50% monthly)."""
        request = GoalPlannerRequest(
            initial_balance=Decimal("10000.00"),
            target_balance=Decimal("1000000.00"),
            deadline_months=12
        )
        
        result = calculate_goal_plan(request)
        
        assert result.status == "success"
        assert result.feasibility in ["Very Unlikely", "Ambitious"]

    def test_goal_challenging(self):
        """Test challenging goal (10-20% monthly)."""
        request = GoalPlannerRequest(
            initial_balance=Decimal("10000.00"),
            target_balance=Decimal("30000.00"),
            deadline_months=6
        )
        
        result = calculate_goal_plan(request)
        
        assert result.status == "success"
        # Should be challenging or higher
        assert result.feasibility in ["Realistic", "Challenging", "Ambitious", "Very Unlikely"]


class TestGetMarketPrice:
    """Test market price fetching."""

    @patch('requests.get')
    def test_binance_price_success(self, mock_get):
        """Test successful price fetch from Binance."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"price": "50000.00"}
        mock_get.return_value = mock_response
        
        result = get_market_price("BTC-USD")
        
        assert result["status"] == "success"
        assert result["price"] == 50000.00

    @patch('requests.get')
    def test_binance_price_failure(self, mock_get):
        """Test price fetch failure from Binance."""
        mock_get.side_effect = Exception("Network error")
        
        result = get_market_price("BTC-USD")
        
        assert result["status"] == "error"
        assert result["price"] == 0


class TestAnalyzeTradeHealth:
    """Test trade health analysis."""

    def test_empty_trades(self):
        """Test health analysis with no trades."""
        request = HealthAnalysisRequest(trades=[])
        
        result = analyze_trade_health(request)
        
        assert result.overall_score == 0
        assert result.summary == "Not enough data."
        assert result.trading_identity == "Newcomer"

    def test_basic_health_analysis(self, sample_health_analysis_request):
        """Test basic health analysis."""
        result = analyze_trade_health(sample_health_analysis_request)
        
        assert hasattr(result, 'overall_score')
        assert hasattr(result, 'risk_score')
        assert hasattr(result, 'emotional_score')
        assert hasattr(result, 'system_score')
        assert hasattr(result, 'summary')
        assert hasattr(result, 'warnings')
        assert hasattr(result, 'recommended_risk')
        assert hasattr(result, 'trading_identity')

    def test_perfect_trading_score(self):
        """Test health analysis with perfect trading."""
        request = HealthAnalysisRequest(
            trades=[
                TradeItem(pnl=Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("10000.00"), is_win=True),
                TradeItem(pnl=Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("10100.00"), is_win=True),
                TradeItem(pnl=Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("10200.00"), is_win=True),
                TradeItem(pnl=Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("10300.00"), is_win=True),
                TradeItem(pnl=Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("10400.00"), is_win=True),
            ]
        )
        
        result = analyze_trade_health(request)
        
        # Should have high scores
        assert result.overall_score >= 80
        assert result.risk_score >= 80
        assert result.emotional_score == 100

    def test_revenge_trading_detection(self):
        """Test detection of revenge trading."""
        request = HealthAnalysisRequest(
            trades=[
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("10000.00"), is_win=False),
                TradeItem(pnl=-Decimal("150.00"), risk_amount=Decimal("150.00"), balance=Decimal("9900.00"), is_win=False),  # Increased risk by 50%
            ]
        )
        
        result = analyze_trade_health(request)
        
        # With 50% increase in risk after loss, should detect revenge trading
        assert result.trading_identity in ["Revenge Trader", "Emotional Trader"]

    def test_tilting_trader_detection(self):
        """Test detection of tilting trader."""
        request = HealthAnalysisRequest(
            trades=[
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("10000.00"), is_win=False),
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("9900.00"), is_win=False),
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("9800.00"), is_win=False),
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("9700.00"), is_win=False),
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("9600.00"), is_win=False),
            ]
        )
        
        result = analyze_trade_health(request)
        
        # Should detect consecutive losses
        assert result.emotional_score < 80

    def test_high_risk_trading(self):
        """Test detection of high risk trading."""
        request = HealthAnalysisRequest(
            trades=[
                TradeItem(pnl=-Decimal("500.00"), risk_amount=Decimal("500.00"), balance=Decimal("10000.00"), is_win=False),  # 5% risk
                TradeItem(pnl=-Decimal("500.00"), risk_amount=Decimal("500.00"), balance=Decimal("9500.00"), is_win=False),  # 5% risk
            ]
        )
        
        result = analyze_trade_health(request)
        
        assert result.risk_score < 80

    def test_losing_trader_cap(self):
        """Test that losing traders get capped score."""
        request = HealthAnalysisRequest(
            trades=[
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("10000.00"), is_win=False),
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("9900.00"), is_win=False),
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("9800.00"), is_win=False),
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("9700.00"), is_win=False),
                TradeItem(pnl=-Decimal("100.00"), risk_amount=Decimal("100.00"), balance=Decimal("9600.00"), is_win=False),
            ]
        )
        
        result = analyze_trade_health(request)
        
        # Should be capped at 45 since profit factor < 1
        assert result.overall_score <= 45
