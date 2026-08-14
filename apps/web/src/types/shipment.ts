export type Shipment = {
    id: number;
    tracking_number: string;
    origin: string;
    destination: string;
    status: string;
    estimated_delivery: string | null;
    latitude: string | null;
    longitude: string | null;
    customer_id: number;
    customer_name: string;
  };

  export type ShipmentEvent = {
    id: number;
    shipment_id: number;
    status: string;
    description: string | null;
    location: string | null;
    occurred_at: string;
    created_at: string;
  };