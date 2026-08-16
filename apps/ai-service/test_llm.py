import os
from types import SimpleNamespace

import pytest

os.environ.setdefault("OPENAI_API_KEY", "test-api-key")

import llm


def test_chat_with_tools_executes_tool_and_returns_final_answer(monkeypatch):
    first_response = SimpleNamespace(
        id="resp_1",
        output=[
            SimpleNamespace(
                type="function_call",
                name="get_shipment",
                arguments='{"shipment_id": 10}',
                call_id="call_1",
            )
        ],
        output_text="",
    )

    second_response = SimpleNamespace(
        id="resp_2",
        output=[],
        output_text="Shipment SHP-1010 is delayed.",
    )

    responses = iter([
        first_response,
        second_response,
    ])

    def fake_create(**kwargs):
        return next(responses)

    monkeypatch.setattr(
        llm.client.responses,
        "create",
        fake_create,
    )

    executed_tools = []

    def fake_execute_tool(name, arguments):
        executed_tools.append((name, arguments))

        return (
            '{"id":10,'
            '"tracking_number":"SHP-1010",'
            '"status":"delayed"}'
        )

    monkeypatch.setattr(
        llm,
        "execute_tool",
        fake_execute_tool,
    )

    result = llm.chat_with_tools(
        "What is happening with shipment 10?"
    )

    assert result.answer == "Shipment SHP-1010 is delayed."
    assert result.tools_used == ["get_shipment"]

    assert executed_tools == [
        (
            "get_shipment",
            {"shipment_id": 10},
        )
    ]


def test_chat_with_tools_supports_sequential_tool_calls(monkeypatch):
    first_response = SimpleNamespace(
        id="resp_1",
        output=[
            SimpleNamespace(
                type="function_call",
                name="list_shipments",
                arguments="{}",
                call_id="call_1",
            )
        ],
        output_text="",
    )

    second_response = SimpleNamespace(
        id="resp_2",
        output=[
            SimpleNamespace(
                type="function_call",
                name="get_customer",
                arguments='{"customer_id": 1}',
                call_id="call_2",
            )
        ],
        output_text="",
    )

    third_response = SimpleNamespace(
        id="resp_3",
        output=[],
        output_text=(
            "The customer for SHP-1010 is Acme Corp. "
            "Email: ops@acme.test."
        ),
    )

    responses = iter([
        first_response,
        second_response,
        third_response,
    ])

    def fake_create(**kwargs):
        return next(responses)

    monkeypatch.setattr(
        llm.client.responses,
        "create",
        fake_create,
    )

    executed_tools = []

    def fake_execute_tool(name, arguments):
        executed_tools.append((name, arguments))

        if name == "list_shipments":
            return (
                '[{"id":10,'
                '"tracking_number":"SHP-1010",'
                '"customer_id":1}]'
            )

        if name == "get_customer":
            return (
                '{"id":1,'
                '"name":"Acme Corp",'
                '"email":"ops@acme.test"}'
            )

        raise AssertionError(f"Unexpected tool: {name}")

    monkeypatch.setattr(
        llm,
        "execute_tool",
        fake_execute_tool,
    )

    result = llm.chat_with_tools(
        "What is the customer email for SHP-1010?"
    )

    assert result.answer == (
        "The customer for SHP-1010 is Acme Corp. "
        "Email: ops@acme.test."
    )

    assert result.tools_used == [
        "list_shipments",
        "get_customer",
    ]

    assert executed_tools == [
        ("list_shipments", {}),
        ("get_customer", {"customer_id": 1}),
    ]

def test_chat_with_tools_handles_unknown_tool_safely(monkeypatch):
    first_response = SimpleNamespace(
        id="resp_1",
        output=[
            SimpleNamespace(
                type="function_call",
                name="delete_everything",
                arguments="{}",
                call_id="call_1",
            )
        ],
        output_text="",
    )

    second_response = SimpleNamespace(
        id="resp_2",
        output=[],
        output_text="I cannot perform that operation.",
    )

    responses = iter([
        first_response,
        second_response,
    ])

    def fake_create(**kwargs):
        return next(responses)

    monkeypatch.setattr(
        llm.client.responses,
        "create",
        fake_create,
    )

    result = llm.chat_with_tools(
        "Delete all shipments."
    )

    assert result.answer == "I cannot perform that operation."
    assert result.tools_used == ["delete_everything"]

def test_chat_with_tools_handles_api_failure_safely(monkeypatch):
    first_response = SimpleNamespace(
        id="resp_1",
        output=[
            SimpleNamespace(
                type="function_call",
                name="get_shipment",
                arguments='{"shipment_id": 10}',
                call_id="call_1",
            )
        ],
        output_text="",
    )

    second_response = SimpleNamespace(
        id="resp_2",
        output=[],
        output_text="Shipment data is currently unavailable.",
    )

    responses = iter([
        first_response,
        second_response,
    ])

    def fake_create(**kwargs):
        return next(responses)

    monkeypatch.setattr(
        llm.client.responses,
        "create",
        fake_create,
    )

    def fake_execute_tool(name, arguments):
        assert name == "get_shipment"
        assert arguments == {"shipment_id": 10}

        return '{"ok": false, "error": "api_unavailable"}'

    monkeypatch.setattr(
        llm,
        "execute_tool",
        fake_execute_tool,
    )

    result = llm.chat_with_tools(
        "What is happening with shipment 10?"
    )

    assert result.answer == "Shipment data is currently unavailable."
    assert result.tools_used == ["get_shipment"]


def test_chat_with_tools_enforces_max_tool_rounds(monkeypatch):
    def fake_create(**kwargs):
        return SimpleNamespace(
            id="resp_loop",
            output=[
                SimpleNamespace(
                    type="function_call",
                    name="list_shipments",
                    arguments="{}",
                    call_id="call_loop",
                )
            ],
            output_text="",
        )

    monkeypatch.setattr(
        llm.client.responses,
        "create",
        fake_create,
    )

    monkeypatch.setattr(
        llm,
        "execute_tool",
        lambda name, arguments: "[]",
    )

    with pytest.raises(
        RuntimeError,
        match="Maximum tool calling rounds exceeded",
    ):
        llm.chat_with_tools(
            "Keep checking shipments forever."
        )