import type { Shipment } from "../types/shipment";

type Props = {
  shipments: Shipment[];
};

export function ShipmentStats({ shipments }: Props) {
  const total = shipments.length;

  const inTransit = shipments.filter(
    (shipment) => shipment.status === "in_transit"
  ).length;

  const delayed = shipments.filter(
    (shipment) => shipment.status === "delayed"
  ).length;

  const delivered = shipments.filter(
    (shipment) => shipment.status === "delivered"
  ).length;

  return (
    <section className="stats-section">
      <h2>Operations Overview</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total shipments</span>
          <strong className="stat-value">{total}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">In transit</span>
          <strong className="stat-value">{inTransit}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Delayed</span>
          <strong className="stat-value">{delayed}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Delivered</span>
          <strong className="stat-value">{delivered}</strong>
        </div>
      </div>
    </section>
  );
}