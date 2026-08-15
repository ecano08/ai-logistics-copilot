import type {
  Shipment,
  ShipmentEvent,
  ShipmentWeather,
} from "../types/shipment";

const API_URL = 'http://localhost:3000';

export async function getShipments(): Promise<Shipment[]> {
  const response = await fetch(`${API_URL}/shipments`);

  if (!response.ok) {
    throw new Error('Unable to load shipments');
  }

  return response.json();
}

export async function getShipmentEvents(
  shipmentId: number
): Promise<ShipmentEvent[]> {
  const response = await fetch(
    `${API_URL}/shipments/${shipmentId}/events`
  );

  if (!response.ok) {
    throw new Error('Unable to load shipment events');
  }

  return response.json();
}

export async function getShipmentWeather(
  shipmentId: number
): Promise<ShipmentWeather> {
  const response = await fetch(
    `${API_URL}/shipments/${shipmentId}/weather`
  );

  if (!response.ok) {
    throw new Error("Unable to load shipment weather");
  }

  return response.json();
}