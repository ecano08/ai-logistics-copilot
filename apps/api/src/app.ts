import express from "express";
import cors from "cors";
import { db } from "./db";
import { getWeather } from "./services/weather";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";

export const app = express();

const knowledgeBasePath =
  process.env.KNOWLEDGE_BASE_PATH ??
  path.resolve("storage/knowledge-base");

fs.mkdirSync(knowledgeBasePath, { recursive: true });

const knowledgeUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, knowledgeBasePath);
    },

    filename: (_req, _file, callback) => {
      callback(null, `${randomUUID()}.pdf`);
    },
  }),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (_req, file, callback) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExtension =
      path.extname(file.originalname).toLowerCase() === ".pdf";

    if (!isPdfMime || !isPdfExtension) {
      return callback(new Error("Only PDF files are allowed"));
    }

    callback(null, true);
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.get("/knowledge-documents", async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        title,
        filename,
        content_type,
        category,
        status,
        source_path,
        error_message,
        created_at,
        updated_at
      FROM knowledge_documents
      ORDER BY created_at DESC, id DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Knowledge documents lookup failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to load knowledge documents",
    });
  }
});

app.post("/knowledge-documents", (req, res) => {
  knowledgeUpload.single("file")(req, res, async (uploadError) => {
    if (uploadError) {
      if (
        uploadError instanceof multer.MulterError &&
        uploadError.code === "LIMIT_FILE_SIZE"
      ) {
        return res.status(413).json({
          status: "error",
          message: "PDF must be 10 MB or smaller",
        });
      }

      return res.status(400).json({
        status: "error",
        message:
          uploadError instanceof Error
            ? uploadError.message
            : "Unable to upload document",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "PDF file is required",
      });
    }

    const title =
      typeof req.body.title === "string" && req.body.title.trim()
        ? req.body.title.trim()
        : path.parse(req.file.originalname).name;

    const category =
      typeof req.body.category === "string" && req.body.category.trim()
        ? req.body.category.trim()
        : null;

    try {
      const insertResult = await db.query(
        `
        INSERT INTO knowledge_documents (
          title,
          filename,
          content_type,
          category,
          status,
          source_path
        )
        VALUES ($1, $2, $3, $4, 'pending', $5)
        RETURNING id
        `,
        [
          title,
          req.file.originalname,
          req.file.mimetype,
          category,
          req.file.path,
        ],
      );

      const documentId = insertResult.rows[0].id;

      await db.query(
        `
        UPDATE knowledge_documents
        SET
          status = 'processing',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [documentId],
      );

      try {
        const aiServiceUrl =
          process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000";

        const extractionResponse = await fetch(
          `${aiServiceUrl}/documents/extract`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              source_path: req.file.path,
            }),
          },
        );

        if (!extractionResponse.ok) {
          const errorBody = await extractionResponse.text();

          throw new Error(
            `Document extraction failed (${extractionResponse.status}): ${errorBody}`,
          );
        }

        const extraction = (await extractionResponse.json()) as {
          text: string;
          characters: number;
        };

        const updateResult = await db.query(
          `
          UPDATE knowledge_documents
          SET
            extracted_text = $2,
            status = 'ready',
            error_message = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING
            id,
            title,
            filename,
            content_type,
            category,
            status,
            created_at,
            updated_at
          `,
          [documentId, extraction.text],
        );

        return res.status(201).json({
          ...updateResult.rows[0],
          characters: extraction.characters,
        });
      } catch (processingError) {
        const message =
          processingError instanceof Error
            ? processingError.message
            : "Unable to process document";

        await db.query(
          `
          UPDATE knowledge_documents
          SET
            status = 'failed',
            error_message = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          `,
          [documentId, message],
        );

        console.error("Knowledge document processing failed:", processingError);

        return res.status(201).json({
          id: documentId,
          title,
          filename: req.file.originalname,
          content_type: req.file.mimetype,
          category,
          status: "failed",
          error_message: message,
        });
      }
    } catch (error) {
      await fs.promises.unlink(req.file.path).catch(() => undefined);

      console.error("Knowledge document creation failed:", error);

      return res.status(500).json({
        status: "error",
        message: "Unable to create knowledge document",
      });
    }
  });
});

app.post("/knowledge-documents/:id/process", async (req, res) => {
  const documentId = Number(req.params.id);

  if (!Number.isInteger(documentId) || documentId <= 0) {
    return res.status(400).json({
      status: "error",
      message: "Invalid document id",
    });
  }

  try {
    const documentResult = await db.query(
      `
      SELECT
        id,
        title,
        filename,
        content_type,
        category,
        status,
        source_path
      FROM knowledge_documents
      WHERE id = $1
      `,
      [documentId],
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Knowledge document not found",
      });
    }

    const document = documentResult.rows[0];

    await db.query(
      `
      UPDATE knowledge_documents
      SET
        status = 'processing',
        error_message = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [documentId],
    );

    try {
      const aiServiceUrl =
        process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000";

      const extractionResponse = await fetch(
        `${aiServiceUrl}/documents/extract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_path: document.source_path,
          }),
        },
      );

      if (!extractionResponse.ok) {
        const errorBody = await extractionResponse.text();

        throw new Error(
          `Document extraction failed (${extractionResponse.status}): ${errorBody}`,
        );
      }

      const extraction = (await extractionResponse.json()) as {
        text: string;
        characters: number;
      };

      const updateResult = await db.query(
        `
        UPDATE knowledge_documents
        SET
          extracted_text = $2,
          status = 'ready',
          error_message = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING
          id,
          title,
          filename,
          content_type,
          category,
          status,
          created_at,
          updated_at
        `,
        [documentId, extraction.text],
      );

      return res.json({
        ...updateResult.rows[0],
        characters: extraction.characters,
      });
    } catch (processingError) {
      const message =
        processingError instanceof Error
          ? processingError.message
          : "Unable to process document";

      await db.query(
        `
        UPDATE knowledge_documents
        SET
          status = 'failed',
          error_message = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [documentId, message],
      );

      console.error(
        "Knowledge document reprocessing failed:",
        processingError,
      );

      return res.status(502).json({
        id: documentId,
        status: "failed",
        error_message: message,
      });
    }
  } catch (error) {
    console.error("Knowledge document lookup failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to process knowledge document",
    });
  }
});

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

app.get('/shipments', async (req, res) => {
    try {
      const { status, tracking } = req.query;
  
      const values: unknown[] = [];
  
      let query = `
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
      `;
  
      const conditions: string[] = [];
  
      if (status) {
        values.push(status);
        conditions.push(`shipments.status = $${values.length}`);
      }
  
      if (tracking) {
        values.push(`%${tracking}%`);
        conditions.push(`shipments.tracking_number ILIKE $${values.length}`);
      }
  
      if (conditions.length > 0) {
        query += `
          WHERE ${conditions.join(' AND ')}
        `;
      }
  
      query += `
        ORDER BY shipments.id
      `;
  
      const result = await db.query(query, values);
  
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

app.get("/shipments/:id/weather", async (req, res) => {
  try {
    const shipmentId = Number(req.params.id);

    const result = await db.query(
      `
      SELECT id, latitude, longitude
      FROM shipments
      WHERE id = $1
      `,
      [shipmentId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Shipment not found",
      });
    }

    const shipment = result.rows[0];

    if (
      shipment.latitude === null ||
      shipment.longitude === null
    ) {
      return res.status(422).json({
        error: "Shipment has no coordinates",
      });
    }

    const weather = await getWeather(
      Number(shipment.latitude),
      Number(shipment.longitude),
    );

    return res.json({
      shipmentId: shipment.id,
      location: {
        latitude: Number(shipment.latitude),
        longitude: Number(shipment.longitude),
      },
      weather,
    });
  } catch (error) {
    console.error("Weather lookup failed:", error);

    return res.status(502).json({
      error: "Unable to load weather data",
    });
  }
});