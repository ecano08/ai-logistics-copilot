import express from "express";
import cors from "cors";
import { db } from "./db";

export const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.get("/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      status: "ok",
      service: "api",
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "error",
      service: "api",
      database: "disconnected",
    });
  }
});

app.get('/shipments', async (_req, res) => {
    try {
      const result = await db.query(`
        SELECT
          shipments.id,
          shipments.tracking_number,
          shipments.origin,
          shipments.destination,
          shipments.status,
          shipments.estimated_delivery,
          shipments.latitude,
          shipments.longitude,
          customers.id AS customer_id,
          customers.name AS customer_name
        FROM shipments
        INNER JOIN customers
          ON customers.id = shipments.customer_id
        ORDER BY shipments.id
      `);
  
      res.json(result.rows);
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Unable to load shipments',
      });
    }
  });

  app.get('/shipments/:id', async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        shipments.id,
        shipments.tracking_number,
        shipments.origin,
        shipments.destination,
        shipments.status,
        shipments.estimated_delivery,
        shipments.latitude,
        shipments.longitude,
        customers.id AS customer_id,
        customers.name AS customer_name,
        customers.email AS customer_email,
        customers.phone AS customer_phone
      FROM shipments
      INNER JOIN customers
        ON customers.id = shipments.customer_id
      WHERE shipments.id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Shipment not found',
      });
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Unable to load shipment',
    });
  }
});

app.get('/customers/:id', async (req, res) => {
    try {
      const result = await db.query(
        `
        SELECT
          id,
          name,
          email,
          phone,
          created_at,
          updated_at
        FROM customers
        WHERE id = $1
        `,
        [req.params.id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found',
        });
      }
  
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Unable to load customer',
      });
    }
  });

  app.get('/shipments/:id/events', async (req, res) => {
    try {
      const shipment = await db.query(
        `
        SELECT id
        FROM shipments
        WHERE id = $1
        `,
        [req.params.id]
      );
  
      if (shipment.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Shipment not found',
        });
      }
  
      const result = await db.query(
        `
        SELECT
          id,
          shipment_id,
          status,
          description,
          location,
          occurred_at,
          created_at
        FROM shipment_events
        WHERE shipment_id = $1
        ORDER BY occurred_at ASC
        `,
        [req.params.id]
      );
  
      res.json(result.rows);
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Unable to load shipment events',
      });
    }
  });

app.get("/health/ai", async (_req, res) => {
  try {
    const response = await fetch(
      `${process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000"}/health`,
    );

    const data = await response.json();

    res.json({
      status: "ok",
      ai_service: "connected",
      details: data,
    });
  } catch {
    res.status(503).json({
      status: "error",
      ai_service: "disconnected",
    });
  }
});
