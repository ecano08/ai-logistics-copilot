import type { Shipment } from "../types/shipment";

type Props = {
  shipments: Shipment[];
  selectedShipmentId: number | null;
  onSelectShipment: (shipment: Shipment) => void;
};

export function ShipmentTable({
  shipments,
  selectedShipmentId,
  onSelectShipment,
}: Props) {
  return (
    <div className="table-section">
      <div className="table-header">
        <h2>Shipments</h2>
      </div>

      <div className="table-wrapper">
        <table className="shipments-table">
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Customer</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Status</th>
              <th>ETA</th>
            </tr>
          </thead>

          <tbody>
            {shipments.map((shipment) => (
              <tr
                key={shipment.id}
                onClick={() => onSelectShipment(shipment)}
                className={
                  shipment.id === selectedShipmentId
                    ? "shipment-row-selected"
                    : ""
                }
                style={{ cursor: "pointer" }}
              >
                <td>{shipment.tracking_number}</td>
                <td>{shipment.customer_name}</td>
                <td>{shipment.origin}</td>
                <td>{shipment.destination}</td>
                <td>
                  <span className={`status-badge status-${shipment.status}`}>
                    {shipment.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  {shipment.estimated_delivery
                    ? new Date(
                        shipment.estimated_delivery
                      ).toLocaleString()
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}