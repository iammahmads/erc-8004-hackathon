import pytest
from core.performance import PerformanceTracker
import os
import json

def test_log_and_metrics(tmp_path):
    # Use a temp file for isolation
    perf_file = tmp_path / "perf.json"
    tracker = PerformanceTracker(str(perf_file))
    tracker.log_trade(1.0, 100.0)
    tracker.log_trade(-0.5, 99.5)
    tracker.log_trade(0.2, 99.7)
    metrics = tracker.get_metrics()
    assert isinstance(metrics, dict)
    assert "sharpe_ratio" in metrics and isinstance(metrics["sharpe_ratio"], float)
    assert "max_drawdown" in metrics and isinstance(metrics["max_drawdown"], float)
    assert "total_return" in metrics and abs(metrics["total_return"] - 0.7) < 1e-6

def test_type_safety():
    tracker = PerformanceTracker("test_perf.json")
    try:
        tracker.log_trade("bad", 100.0)
        assert False, "Should raise TypeError for pnl"
    except TypeError:
        pass
    try:
        tracker.log_trade(1.0, "bad")
        assert False, "Should raise TypeError for equity"
    except TypeError:
        pass
    os.remove("test_perf.json")
