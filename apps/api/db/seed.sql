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
) VALUES
('SHP-1001', 1, 'Morelia, Michoacán', 'Ciudad de México', 'in_transit', NOW() + INTERVAL '1 day', 19.432608, -99.133209),
('SHP-1002', 2, 'Guadalajara, Jalisco', 'Monterrey, Nuevo León', 'delayed', NOW() - INTERVAL '1 day', 25.686614, -100.316113),
('SHP-1003', 3, 'Querétaro, Querétaro', 'Puebla, Puebla', 'in_transit', NOW() + INTERVAL '2 days', 19.041440, -98.206273);

INSERT INTO shipment_events (
    shipment_id,
    status,
    description,
    location,
    occurred_at
) VALUES
(1, 'created', 'Shipment created', 'Morelia, Michoacán', NOW() - INTERVAL '2 days'),
(1, 'in_transit', 'Shipment departed origin facility', 'Morelia, Michoacán', NOW() - INTERVAL '1 day'),

(2, 'created', 'Shipment created', 'Guadalajara, Jalisco', NOW() - INTERVAL '3 days'),
(2, 'delayed', 'Shipment delayed in transit', 'San Luis Potosí', NOW() - INTERVAL '12 hours'),

(3, 'created', 'Shipment created', 'Querétaro, Querétaro', NOW() - INTERVAL '1 day'),
(3, 'in_transit', 'Shipment is moving toward destination', 'Querétaro, Querétaro', NOW() - INTERVAL '6 hours');