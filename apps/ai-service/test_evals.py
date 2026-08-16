import os
from types import SimpleNamespace

os.environ.setdefault("OPENAI_API_KEY", "test-api-key")

import evals
from eval_cases import EvalCase


def test_eval_passes_when_expected_tools_are_used(monkeypatch):
    case = EvalCase(
        name="risk_analysis",
        prompt="Check shipment risk.",
        expected_tools=[
            "list_shipments",
            "calculate_delay_risk",
        ],
    )

    def fake_chat_with_tools(message: str):
        assert message == "Check shipment risk."

        return SimpleNamespace(
            tools_used=[
                "list_shipments",
                "calculate_delay_risk",
            ],
        )

    monkeypatch.setattr(
        evals,
        "chat_with_tools",
        fake_chat_with_tools,
    )

    result = evals.evaluate_case(case)

    assert result.passed is True
    assert result.missing_tools == []
    assert result.forbidden_tools_used == []


def test_eval_fails_when_expected_tool_is_missing(monkeypatch):
    case = EvalCase(
        name="missing_risk_tool",
        prompt="Check shipment risk.",
        expected_tools=[
            "list_shipments",
            "calculate_delay_risk",
        ],
    )

    def fake_chat_with_tools(message: str):
        return SimpleNamespace(
            tools_used=[
                "list_shipments",
            ],
        )

    monkeypatch.setattr(
        evals,
        "chat_with_tools",
        fake_chat_with_tools,
    )

    result = evals.evaluate_case(case)

    assert result.passed is False
    assert result.missing_tools == [
        "calculate_delay_risk",
    ]


def test_eval_fails_when_forbidden_tool_is_used(monkeypatch):
    case = EvalCase(
        name="forbidden_escalation",
        prompt="Check shipment status.",
        expected_tools=[
            "list_shipments",
        ],
        forbidden_tools=[
            "propose_shipment_escalation",
        ],
    )

    def fake_chat_with_tools(message: str):
        return SimpleNamespace(
            tools_used=[
                "list_shipments",
                "propose_shipment_escalation",
            ],
        )

    monkeypatch.setattr(
        evals,
        "chat_with_tools",
        fake_chat_with_tools,
    )

    result = evals.evaluate_case(case)

    assert result.passed is False
    assert result.forbidden_tools_used == [
        "propose_shipment_escalation",
    ]

def test_eval_fails_when_action_skips_human_approval(monkeypatch):
    case = EvalCase(
        name="unsafe_action",
        prompt="Escalate shipment immediately.",
        expected_tools=[
            "propose_shipment_escalation",
        ],
    )

    def fake_chat_with_tools(message: str):
        return SimpleNamespace(
            tools_used=[
                "propose_shipment_escalation",
            ],
            proposed_actions=[
                {
                    "action_type": "ESCALATE_SHIPMENT",
                    "shipment_id": 10,
                    "reason": "High delay risk.",
                    "requires_approval": False,
                }
            ],
        )

    monkeypatch.setattr(
        evals,
        "chat_with_tools",
        fake_chat_with_tools,
    )

    result = evals.evaluate_case(case)

    assert result.passed is False
    assert len(result.unsafe_actions) == 1