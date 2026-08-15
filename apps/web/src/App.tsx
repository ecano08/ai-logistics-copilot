import "./App.css";
import { useEffect, useState } from "react";
import { ShipmentTable } from "./components/ShipmentTable";
import {
  getShipments,
  getShipmentEvents,
  getShipmentWeather,
} from "./services/shipments";
import type {
  Shipment,
  ShipmentEvent,
  ShipmentWeather,
} from "./types/shipment";
import { ShipmentStats } from "./components/ShipmentStats";

function App() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trackingSearch, setTrackingSearch] = useState("");

  const [selectedShipment, setSelectedShipment] =
    useState<Shipment | null>(null);

  const [shipmentEvents, setShipmentEvents] =
    useState<ShipmentEvent[]>([]);

  const [eventsLoading, setEventsLoading] = useState(false);

  const [shipmentWeather, setShipmentWeather] =
    useState<ShipmentWeather | null>(null);

  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    getShipments()
      .then(setShipments)
      .catch(() => {
        setError("Unable to load shipments");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedShipment) {
      return;
    }

    getShipmentEvents(selectedShipment.id)
      .then(setShipmentEvents)
      .catch(() => {
        setShipmentEvents([]);
      })
      .finally(() => {
        setEventsLoading(false);
      });
  }, [selectedShipment]);

  useEffect(() => {
    if (!selectedShipment) {
      return;
    }

    getShipmentWeather(selectedShipment.id)
      .then(setShipmentWeather)
      .catch(() => {
        setShipmentWeather(null);
      })
      .finally(() => {
        setWeatherLoading(false);
      });
  }, [selectedShipment]);

  const handleSelectShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);

    setShipmentEvents([]);
    setEventsLoading(true);

    setShipmentWeather(null);
    setWeatherLoading(true);
  };

  if (loading) {
    return <p>Loading shipments...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  const filteredShipments = shipments.filter((shipment) => {
    const matchesStatus =
      statusFilter === "all" ||
      shipment.status === statusFilter;

    const matchesTracking = shipment.tracking_number
      .toLowerCase()
      .includes(trackingSearch.toLowerCase());

    return matchesStatus && matchesTracking;
  });

  return (
    <main className="app-shell">
      <h1>AI Logistics Copilot</h1>

      <ShipmentStats shipments={shipments} />

      <div className="filters-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Search tracking..."
          value={trackingSearch}
          onChange={(event) =>
            setTrackingSearch(event.target.value)
          }
        />

        <div className="status-filter">
          <label htmlFor="status-filter">Status</label>

          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">All</option>
            <option value="in_transit">In transit</option>
            <option value="delayed">Delayed</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {(statusFilter !== "all" || trackingSearch !== "") && (
          <button
            className="clear-filters"
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setTrackingSearch("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <p>
        Showing {filteredShipments.length} of{" "}
        {shipments.length} shipments
      </p>

      {filteredShipments.length === 0 ? (
        <div className="empty-state">
          <h2>No shipments found</h2>
          <p>Try changing or clearing your filters.</p>
        </div>
      ) : (
        <ShipmentTable
          shipments={filteredShipments}
          selectedShipmentId={selectedShipment?.id ?? null}
          onSelectShipment={handleSelectShipment}
        />
      )}

      {selectedShipment && (
        <section className="shipment-detail">
          <div className="detail-header">
            <div>
              <span className="detail-eyebrow">
                Shipment Detail
              </span>

              <h2>{selectedShipment.tracking_number}</h2>
            </div>
          </div>

          <p>
            <strong>Customer:</strong>{" "}
            {selectedShipment.customer_name}
          </p>

          <p>
            <strong>Origin:</strong>{" "}
            {selectedShipment.origin}
          </p>

          <p>
            <strong>Destination:</strong>{" "}
            {selectedShipment.destination}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`status-badge status-${selectedShipment.status}`}
            >
              {selectedShipment.status.replace("_", " ")}
            </span>
          </p>

          <h3>Weather</h3>

          {weatherLoading ? (
            <p>Loading weather...</p>
          ) : shipmentWeather ? (
            <div className="weather-grid">
              <div className="weather-item">
                <span>Temperature</span>
                <strong>{shipmentWeather.weather.temperature} °C</strong>
              </div>

              <div className="weather-item">
                <span>Precipitation</span>
                <strong>{shipmentWeather.weather.precipitation} mm</strong>
              </div>

              <div className="weather-item">
                <span>Wind speed</span>
                <strong>{shipmentWeather.weather.windSpeed} km/h</strong>
              </div>

              <div className="weather-item">
                <span>Weather code</span>
                <strong>{shipmentWeather.weather.weatherCode}</strong>
              </div>
            </div>
          ) : (
            <p>Weather unavailable.</p>
          )}

          <h3>Events</h3>

          {eventsLoading ? (
            <p>Loading events...</p>
          ) : shipmentEvents.length === 0 ? (
            <p>No events found.</p>
          ) : (
            <div className="events-list">
              {shipmentEvents.map((event) => (
                <div
                  className="event-item"
                  key={event.id}
                >
                  <div className="event-dot" />

                  <div>
                    <strong className="event-status">
                      {event.status.replace("_", " ")}
                    </strong>

                    <p className="event-description">
                      {event.description ??
                        "No description"}
                    </p>

                    <span className="event-date">
                      {new Date(
                        event.occurred_at
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default App;