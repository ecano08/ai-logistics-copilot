TRUNCATE TABLE shipment_events, shipments, customers
RESTART IDENTITY CASCADE;

INSERT INTO customers (name, email, phone) VALUES
('Acme Corp', 'ops@acme.test', '+52 443 100 0001'),
('Globex', 'logistics@globex.test', '+52 443 100 0002'),
('Contoso', 'shipping@contoso.test', '+52 443 100 0003');

INSERT INTO shipments (
    tracking_number,
    customer_id,
    origin,
    destination,
    status,
    estimated_delivery,
    latitude,
    longitude
)
SELECT
    'SHP-' || (1000 + gs),
    ((gs - 1) % 3) + 1,
    CASE ((gs - 1) % 4)
        WHEN 0 THEN 'Morelia, Michoacán'
        WHEN 1 THEN 'Guadalajara, Jalisco'
        WHEN 2 THEN 'Querétaro, Querétaro'
        ELSE 'Ciudad de México'
    END,
    CASE ((gs - 1) % 4)
        WHEN 0 THEN 'Ciudad de México'
        WHEN 1 THEN 'Monterrey, Nuevo León'
        WHEN 2 THEN 'Puebla, Puebla'
        ELSE 'León, Guanajuato'
    END,
    CASE
        WHEN gs % 10 = 0 THEN 'delayed'
        WHEN gs % 7 = 0 THEN 'delivered'
        ELSE 'in_transit'
    END,
    NOW() + ((gs % 5) - 2) * INTERVAL '1 day',
    19.432608 + (gs * 0.01),
    -99.133209 - (gs * 0.01)
FROM generate_series(1, 50) AS gs;

INSERT INTO shipment_events (
    shipment_id,
    status,
    description,
    location,
    occurred_at
)
SELECT
    id,
    'created',
    'Shipment created',
    origin,
    created_at
FROM shipments;

INSERT INTO shipment_events (
    shipment_id,
    status,
    description,
    location,
    occurred_at
)
SELECT
    id,
    status,
    CASE
        WHEN status = 'delayed'
            THEN 'Shipment delayed in transit'
        WHEN status = 'delivered'
            THEN 'Shipment delivered successfully'
        ELSE 'Shipment is moving toward destination'
    END,
    destination,
    NOW() - INTERVAL '6 hours'
FROM shipments;