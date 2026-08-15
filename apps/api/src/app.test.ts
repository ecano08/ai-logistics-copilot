import request from "supertest";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { queryMock, getWeatherMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  getWeatherMock: vi.fn(),
}));

vi.mock("./db", () => ({
  db: {
    query: queryMock,
  },
}));

vi.mock("./services/weather", () => ({
  getWeather: getWeatherMock,
}));

import { app } from "./app";

describe("API", () => {
  beforeEach(() => {
    queryMock.mockReset();
    getWeatherMock.mockReset();
  });

  it("GET /health returns API health status", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ "?column?": 1 }],
    });

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "api",
      database: "connected",
    });
  });

  it("GET /shipments returns shipments", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          tracking_number: "SHP-1001",
          origin: "Morelia, Michoacán",
          destination: "Ciudad de México",
          status: "in_transit",
          customer_id: 1,
          customer_name: "Acme Corp",
        },
      ],
    });

    const response = await request(app).get("/shipments");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].tracking_number).toBe("SHP-1001");
  });

  it("GET /shipments/:id returns a shipment", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          tracking_number: "SHP-1001",
          customer_name: "Acme Corp",
        },
      ],
    });

    const response = await request(app).get("/shipments/1");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  it("GET /shipments/:id returns 404 when shipment does not exist", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
    });

    const response = await request(app).get("/shipments/999");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Shipment not found");
  });

  it("GET /customers/:id returns a customer", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: "Acme Corp",
          email: "ops@acme.test",
        },
      ],
    });

    const response = await request(app).get("/customers/1");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Acme Corp");
  });

  it("GET /shipments/:id/events returns shipment events", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 1 }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            shipment_id: 1,
            status: "created",
          },
        ],
      });

    const response = await request(app).get(
      "/shipments/1/events",
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe("created");
  });

  it("GET /shipments filters by status", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          tracking_number: "SHP-1010",
          status: "delayed",
        },
      ],
    });

    const response = await request(app).get(
      "/shipments?status=delayed",
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe("delayed");

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("shipments.status = $1"),
      ["delayed"],
    );
  });

  it("GET /shipments searches by tracking number", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          tracking_number: "SHP-1001",
        },
      ],
    });

    const response = await request(app).get(
      "/shipments?tracking=SHP-1001",
    );

    expect(response.status).toBe(200);
    expect(response.body[0].tracking_number).toBe("SHP-1001");

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "shipments.tracking_number ILIKE $1",
      ),
      ["%SHP-1001%"],
    );
  });

  it("returns weather for a shipment", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          latitude: "19.442608",
          longitude: "-99.143209",
        },
      ],
    });

    getWeatherMock.mockResolvedValueOnce({
      temperature: 18.6,
      precipitation: 0.5,
      windSpeed: 8.6,
      weatherCode: 95,
    });

    const response = await request(app)
      .get("/shipments/1/weather")
      .expect(200);

    expect(response.body).toEqual({
      shipmentId: 1,
      location: {
        latitude: 19.442608,
        longitude: -99.143209,
      },
      weather: {
        temperature: 18.6,
        precipitation: 0.5,
        windSpeed: 8.6,
        weatherCode: 95,
      },
    });

    expect(getWeatherMock).toHaveBeenCalledWith(
      19.442608,
      -99.143209,
    );
  });

  it("returns 404 when shipment does not exist for weather lookup", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
    });

    const response = await request(app)
      .get("/shipments/999/weather")
      .expect(404);

    expect(response.body).toEqual({
      error: "Shipment not found",
    });

    expect(getWeatherMock).not.toHaveBeenCalled();
  });

  it("returns 422 when shipment has no coordinates for weather lookup", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          latitude: null,
          longitude: null,
        },
      ],
    });

    const response = await request(app)
      .get("/shipments/1/weather")
      .expect(422);

    expect(response.body).toEqual({
      error: "Shipment has no coordinates",
    });

    expect(getWeatherMock).not.toHaveBeenCalled();
  });

  it("returns 502 when weather provider fails", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          latitude: "19.442608",
          longitude: "-99.143209",
        },
      ],
    });

    getWeatherMock.mockRejectedValueOnce(
      new Error("Weather provider unavailable"),
    );

    const response = await request(app)
      .get("/shipments/1/weather")
      .expect(502);

    expect(response.body).toEqual({
      error: "Unable to load weather data",
    });
  });
});