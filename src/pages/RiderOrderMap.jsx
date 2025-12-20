import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function RiderOrderMap() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [riderLocation, setRiderLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [error, setError] = useState(null);
  const [startLocation, setStartLocation] = useState("");

  const [useDropdown, setUseDropdown] = useState(true);

  // Known Balamban places
  const BALAMBAN_LOCATIONS = [
    "Jollibee Balamban, Sta. Cruz, Balamban",        // fast food restaurant :contentReference[oaicite:1]{index=1}
    "Balamban Public Market, Balamban",               // local market :contentReference[oaicite:2]{index=2}
    "Old Balamban Municipal Hall, Balamban",          // historic building :contentReference[oaicite:3]{index=3}
    "Lokal ng Balamban, Iglesia ni Cristo, Balamban", // local church :contentReference[oaicite:4]{index=4}
    "St. Francis of Assisi Parish Church, Balamban"    // common local parish (community info) :contentReference[oaicite:5]{index=5}
  ];

  /* -------- FETCH ORDER -------- */
  useEffect(() => {
    setCustomerLocation(null);
    setError(null);

    supabase
      .from("orders")
      .select("delivery_address")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        if (!data) {
          setError("Order not found");
          return;
        }
        const match = data.delivery_address?.match(
          /\(([-\d.]+),\s*([-\d.]+)\)/
        );
        if (!match) {
          setError("Customer location missing");
          return;
        }
        setCustomerLocation({
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2]),
        });
      });
  }, [orderId, location.state?.key]);

  /* -------- GET RIDER LOCATION -------- */
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setRiderLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => setError("Unable to get rider location"),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (error) {
    return (
      <div className="p-6 text-red-500 font-semibold bg-gray-900 text-center rounded">
        {error}
      </div>
    );
  }
  if (!customerLocation) {
    return (
      <div className="p-6 text-gray-300 bg-gray-900 text-center font-medium animate-pulse">
        📡 Loading order…
      </div>
    );
  }

  /* -------- DETERMINE ORIGIN -------- */
  const origin =
    startLocation || (riderLocation ? `${riderLocation.lat},${riderLocation.lng}` : "");

  /* -------- GOOGLE MAPS LINK -------- */
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    origin
  )}&destination=${customerLocation.lat},${customerLocation.lng}&travelmode=driving`;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5 bg-gray-900 text-white rounded shadow-lg">
      <h2 className="text-2xl font-bold text-center">🛵 Delivery Navigation</h2>
      <p className="text-sm text-gray-300 text-center">
        Select or enter a starting point below, or leave blank to use your current location.
      </p>

      {/* Input Mode Toggle */}
      <div className="flex justify-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={useDropdown}
            onChange={() => setUseDropdown(true)}
            className="accent-green-400"
          />
          Known Places
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={!useDropdown}
            onChange={() => setUseDropdown(false)}
            className="accent-green-400"
          />
          Custom
        </label>
      </div>

      {/* Dropdown for Known Places */}
      {useDropdown ? (
        <select
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        >
          <option value="">-- Select Starting Point --</option>
          {BALAMBAN_LOCATIONS.map((loc, i) => (
            <option key={i} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          placeholder="Enter starting point..."
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        />
      )}

      {/* Navigate Button */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noreferrer"
        className="block w-full text-center px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition"
      >
        🛵 Navigate
      </a>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition"
      >
        Back
      </button>
    </div>
  );
}
