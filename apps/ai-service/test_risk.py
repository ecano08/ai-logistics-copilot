from risk import calculate_delay_risk


def test_delayed_shipment_has_medium_risk():
    result = calculate_delay_risk(
        shipment={
            "status": "delayed",
        },
        events=[],
    )

    assert result.risk == "MEDIUM"
    assert result.score == 50
    assert "Shipment is already marked as delayed." in result.reasons
    assert result.recommended_action == (
        "Monitor the shipment closely and review recent operational events."
    )


def test_expired_eta_increases_risk():
    result = calculate_delay_risk(
        shipment={
            "status": "in_transit",
            "estimated_delivery": "2000-01-01T00:00:00Z",
        },
        events=[],
    )

    assert result.score == 25
    assert result.risk == "LOW"
    assert "Estimated delivery date has already passed." in result.reasons
    assert result.recommended_action == (
        "Continue normal monitoring."
    )


def test_stale_event_increases_risk():
    result = calculate_delay_risk(
        shipment={
            "status": "in_transit",
        },
        events=[
            {
                "occurred_at": "2000-01-01T00:00:00Z",
            }
        ],
    )

    assert result.score == 15
    assert result.risk == "LOW"
    assert (
        "Shipment has had no new events for at least 24 hours."
        in result.reasons
    )
    assert result.recommended_action == (
        "Continue normal monitoring."
    )


def test_bad_weather_increases_risk():
    result = calculate_delay_risk(
        shipment={
            "status": "in_transit",
        },
        events=[],
        weather={
            "precipitation": 25,
            "windSpeed": 60,
        },
    )

    assert result.score == 20
    assert result.risk == "LOW"
    assert "Heavy precipitation may affect the route." in result.reasons
    assert "Strong winds may affect transportation." in result.reasons
    assert result.recommended_action == (
        "Continue normal monitoring."
    )


def test_combined_conditions_produce_high_risk():
    result = calculate_delay_risk(
        shipment={
            "status": "delayed",
            "estimated_delivery": "2000-01-01T00:00:00Z",
        },
        events=[
            {
                "occurred_at": "2000-01-01T00:00:00Z",
            }
        ],
    )

    assert result.score == 90
    assert result.risk == "HIGH"
    assert len(result.reasons) == 3
    assert result.recommended_action == (
        "Escalate the shipment for immediate operational review."
    )


def test_risk_score_is_capped_at_100():
    result = calculate_delay_risk(
        shipment={
            "status": "delayed",
            "estimated_delivery": "2000-01-01T00:00:00Z",
        },
        events=[
            {
                "occurred_at": "2000-01-01T00:00:00Z",
            }
        ],
        weather={
            "precipitation": 25,
            "windSpeed": 60,
        },
    )

    assert result.score == 100
    assert result.risk == "HIGH"
    assert result.recommended_action == (
        "Escalate the shipment for immediate operational review."
    )