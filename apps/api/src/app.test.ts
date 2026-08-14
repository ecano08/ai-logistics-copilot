import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const { queryMock } = vi.hoisted(() => ({
    queryMock: vi.fn(),
  }));
  
  vi.mock('./db', () => ({
    db: {
      query: queryMock,
    },
  }));

import { app } from './app';

describe('API', () => {
  it('GET /health returns API health status', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ '?column?': 1 }],
    });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'api',
      database: 'connected',
    });
  });

  it('GET /shipments returns shipments', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          tracking_number: 'SHP-1001',
          origin: 'Morelia, Michoacán',
          destination: 'Ciudad de México',
          status: 'in_transit',
          customer_id: 1,
          customer_name: 'Acme Corp',
        },
      ],
    });

    const response = await request(app).get('/shipments');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].tracking_number).toBe('SHP-1001');
  });

  it('GET /shipments/:id returns a shipment', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          tracking_number: 'SHP-1001',
          customer_name: 'Acme Corp',
        },
      ],
    });

    const response = await request(app).get('/shipments/1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  it('GET /shipments/:id returns 404 when shipment does not exist', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
    });

    const response = await request(app).get('/shipments/999');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Shipment not found');
  });

  it('GET /customers/:id returns a customer', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: 'Acme Corp',
          email: 'ops@acme.test',
        },
      ],
    });

    const response = await request(app).get('/customers/1');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Acme Corp');
  });

  it('GET /shipments/:id/events returns shipment events', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 1 }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            shipment_id: 1,
            status: 'created',
          },
        ],
      });

    const response = await request(app).get('/shipments/1/events');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe('created');
  });
});