// src/pages/CustomerDashboard.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Bar, Pie, Line } from "react-chartjs-2";
import Chat from "../components/Chat";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ALL_STATUSES = ["pending", "completed", "delivered", "cancelled"];
const STATUS_COLORS = {
  pending: "#facc15",
  completed: "#22c55e",
  delivered: "#3b82f6",
  cancelled: "#ef4444"
};

function formatElapsedTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function CustomerDashboard({
  selectedPage,
  registerBell,
  setUnreadCount
}) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [onlineRiders, setOnlineRiders] = useState(0);
  const [form, setForm] = useState({
    pickup_address: "",
    delivery_address: "",
    items: [],
    payment: "Cash",
  });
  const [timers, setTimers] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRider, setChatRider] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);

  // ----------------------------
  // Bell registration
  // ----------------------------
  useEffect(() => {
    if (!registerBell) return;

    registerBell(() => {
      // Open chat modal with latest order's rider
      const latestOrderWithRider = orders.find(o => o.rider_id);
      if (latestOrderWithRider) {
        setChatRider({
          id: latestOrderWithRider.rider_id,
          name: "Rider"
        });
        setChatOpen(true);
        setUnreadCount?.(0);
      }
    });
  }, [registerBell, setUnreadCount, orders]);

  // ----------------------------
  // Fetch session user
  // ----------------------------
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setSessionUser(session.user);
    };
    fetchUser();
  }, []);

  // Only fetch live location to show hint, do NOT autofill delivery address
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();

          const detectedAddress = data?.display_name || "Unknown location";

          setLiveLocation({
            lat: latitude,
            lng: longitude,
            address: detectedAddress
          });

          // ❌ Remove auto-fill: do not set form.delivery_address here

        } catch (err) {
          console.warn("Reverse geocoding failed", err);
        }
      },
      (err) => {
        console.warn("Location permission denied", err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fill delivery address ONLY when user clicks the button
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();

          const detectedAddress = data?.display_name || "Unknown location";

          setLiveLocation({
            lat: latitude,
            lng: longitude,
            address: detectedAddress
          });

          // ✅ Autofill delivery address here
          setForm(f => ({ ...f, delivery_address: detectedAddress }));

        } catch (err) {
          console.warn("Reverse geocoding failed", err);
        }
      },
      (err) => {
        alert("Location access denied");
        console.error(err);
      },
      { enableHighAccuracy: true }
    );
  };


  // ----------------------------
  // Fetch online riders
  // ----------------------------
  const fetchOnlineRiders = async () => {
    const { data, error } = await supabase
      .from("ridercustomer_users")
      .select("*")
      .eq("is_online", true);
    if (!error) setOnlineRiders(data.length);
  };

  // ----------------------------
  // Fetch rider name helper
  // ----------------------------
  const fetchRiderName = async (riderId) => {
    const { data, error } = await supabase
      .from("ridercustomer_users")
      .select("full_name")
      .eq("id", riderId)
      .single();

    if (error) return "Rider";
    return data?.full_name || "Rider";
  };

  // ----------------------------
  // Fetch orders descending
  // ----------------------------
  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false }); // DESCENDING

    if (!error) setOrders(data || []);
    setLoadingOrders(false);
  };

  useEffect(() => {
    fetchOnlineRiders();
    fetchOrders();
  }, []);

  // ----------------------------
  // Timers for orders
  // ----------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};
      orders.forEach(o => {
        const start = new Date(o.created_at).getTime();
        const end = o.delivered_at ? new Date(o.delivered_at).getTime() : Date.now();
        newTimers[o.id] = formatElapsedTime(end - start);
      });
      setTimers(newTimers);
    }, 1000);
    return () => clearInterval(interval);
  }, [orders]);

  // ----------------------------
  // Form helpers
  // ----------------------------
  const addItem = () => setForm(f => ({
    ...f,
    items: [...f.items, { name: "", qty: 1, price: 0 }]
  }));

  const removeItem = idx => setForm(f => {
    const items = [...f.items];
    items.splice(idx, 1);
    return { ...f, items };
  });

  const handleItemChange = (idx, field, value) =>
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });

  const deliveryFee = (() => {
    if (!form.delivery_address) return 0;
    const now = new Date();
    const hour = now.getHours();
    const isNightTime = hour >= 23 || hour < 4;
    const isBalamban = form.delivery_address.toLowerCase().includes("balamban");
    if (isBalamban && isNightTime) return 120;
    return 100;
  })();

  const totalAmount = form.items.reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0),
    0
  ) + deliveryFee;

  // ----------------------------
  // Handle submit
  // ----------------------------
  const handleSubmit = async e => {
    e.preventDefault();

    if (onlineRiders === 0) {
      alert("No riders are online. Please wait until a rider becomes available.");
      return;
    }

    if (!liveLocation) {
      alert("Cannot place order. Please enable location and click 'Use my current location'.");
      return;
    }

    if (!form.pickup_address.trim() || !form.delivery_address.trim()) {
      alert("Please fill all required fields.");
      return;
    }

    if (form.items.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const finalDeliveryAddress = `${form.delivery_address} | Live location: ${liveLocation.address} (${liveLocation.lat}, ${liveLocation.lng})`;

      await supabase.from("orders").insert([{
        customer_id: userId,
        pickup_address: form.pickup_address,
        delivery_address: finalDeliveryAddress,
        items: form.items,
        total_amount: totalAmount,
        payment_method: form.payment,
        payment_status: "pending",
        status: "pending",
      }]);

      setForm({ pickup_address: "", delivery_address: "", items: [], payment: "Cash" });
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------
  // Confirm delivery
  // ----------------------------
  const confirmDelivery = async (orderId) => {
    await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);
    fetchOrders();
  };

  // ----------------------------
  // Auto-confirm delivered orders
  // ----------------------------
  useEffect(() => {
    const delivered = orders.filter(o => o.status === "delivered");
    delivered.forEach(o => {
      if (confirm(`Your order to ${o.delivery_address} has been delivered. Confirm?`)) {
        confirmDelivery(o.id);
      }
    });
  }, [orders]);

  if (loadingOrders) return <div>Loading…</div>;

  // ----------------------------
  // Charts
  // ----------------------------
  const dates = [...new Set(orders.map(o =>
    new Date(o.created_at).toLocaleDateString()
  ))].sort((a, b) => new Date(a) - new Date(b)); // oldest → latest


  const stackedDatasets = ALL_STATUSES.map(status => ({
    label: status.toUpperCase(),
    data: dates.map(date =>
      orders.filter(o =>
        new Date(o.created_at).toLocaleDateString() === date &&
        o.status === status
      ).length
    ),
    backgroundColor: STATUS_COLORS[status]
  }));

  const stackedChartData = { labels: dates, datasets: stackedDatasets };
  const stackedChartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" }, title: { display: true, text: "Orders by Status Over Time" } },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
  };

  const totalByStatus = ALL_STATUSES.map(
    s => orders.filter(o => o.status === s).length
  );

  const pieChartData = {
    labels: ALL_STATUSES.map(s => s.toUpperCase()),
    datasets: [{ data: totalByStatus, backgroundColor: Object.values(STATUS_COLORS) }]
  };

  const paymentMethods = ["Cash", "GCash"];
  const paymentCounts = paymentMethods.map(
    pm => orders.filter(o => o.payment_method === pm).length
  );

  const paymentChartData = {
    labels: paymentMethods,
    datasets: [{
      data: paymentCounts,
      backgroundColor: ["#3b82f6", "#f97316"]
    }]
  };

  const trendData = dates.map(
    d => orders.filter(o => new Date(o.created_at).toLocaleDateString() === d).length
  );

  const lineChartData = {
    labels: dates,
    datasets: [{
      label: "Total Orders",
      data: trendData,
      borderColor: "#22c55e",
      backgroundColor: "rgba(34,197,94,0.2)",
      fill: true,
      tension: 0.3
    }]
  };

  const glassClass = "bg-white/30 dark:bg-gray-800/40 backdrop-blur-md shadow-lg rounded-xl border border-white/20 dark:border-gray-700/30 p-4";

  // ----------------------------
  // JSX
  // ----------------------------
  return (
    <div className="space-y-6 px-2 md:px-6">
      {/* ONLINE RIDERS */}
      <div className={glassClass}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Riders Online: {onlineRiders}
        </h2>
        {onlineRiders === 0 && (
          <p className="text-red-500 mt-2 text-sm">
            ⚠ No riders are available to deliver orders right now.
          </p>
        )}
      </div>

      {/* DASHBOARD */}
      {selectedPage === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={glassClass + " p-6"}>
            <Bar data={stackedChartData} options={stackedChartOptions} />
          </div>
          <div className={glassClass + " p-6"}>
            <Pie data={pieChartData} options={{ plugins: { title: { display: true, text: "Total Orders by Status" } } }} />
          </div>
          <div className={glassClass + " p-6"}>
            <Pie data={paymentChartData} options={{ plugins: { title: { display: true, text: "Payment Method Distribution" } } }} />
          </div>
          <div className={glassClass + " p-6"}>
            <Line data={lineChartData} options={{ plugins: { title: { display: true, text: "Orders Trend Over Time" } } }} />
          </div>
        </div>
      )}

      {/* ORDER FORM */}
      {selectedPage === "orders" && (
        <>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Place a New Order</h2>
          <form onSubmit={handleSubmit} className={glassClass + " md:p-6 space-y-4"}>
            {onlineRiders === 0 && (
              <div className="bg-red-200 text-red-700 p-3 rounded text-sm">
                No riders are online. Order cannot be placed right now.
              </div>
            )}

            {/* ADDRESSES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pickup Address */}
              <input
                type="text"
                placeholder="Pickup address"
                value={form.pickup_address}
                onChange={e => setForm({ ...form, pickup_address: e.target.value })}
                className="w-full border border-white/30 dark:border-gray-600/50 p-2 rounded bg-white/20 dark:bg-gray-700/40 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                required
              />

              {/* Delivery Address */}
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="Delivery address"
                  value={form.delivery_address} // controlled by user input only
                  onChange={e => setForm({ ...form, delivery_address: e.target.value })}
                  className="w-full border border-white/30 dark:border-gray-600/50 p-2 rounded bg-white/20 dark:bg-gray-700/40 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />

                {/* Live location display hint */}
                {liveLocation && (
                  <p className="text-xs text-gray-500 mt-1">
                    📍 Live location detected: {liveLocation.address} ({liveLocation.lat.toFixed(5)}, {liveLocation.lng.toFixed(5)})
                  </p>
                )}

                {/* Detect location button */}
                {navigator.geolocation && (
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="text-blue-500 text-xs mt-1 underline"
                  >
                    📍 Use my current location
                  </button>
                )}
              </div>
            </div>



            {/* ITEMS */}
            {form.items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <input type="text" placeholder="Product name"
                  value={it.name}
                  onChange={e => handleItemChange(idx, "name", e.target.value)}
                  className="border border-white/30 dark:border-gray-600/50 p-2 rounded bg-white/20 dark:bg-gray-700/40 text-gray-800 dark:text-gray-100" required />
                <input type="number" min="1" value={it.qty} placeholder="Qty."
                  onChange={e => handleItemChange(idx, "qty", e.target.value)}
                  className="border border-white/30 dark:border-gray-600/50 p-2 rounded bg-white/20 dark:bg-gray-700/40 text-gray-800 dark:text-gray-100" required />
                <input type="number" min="0" placeholder="Price"
                  value={it.price || ""}
                  onChange={e => handleItemChange(idx, "price", e.target.value)}
                  className="border border-white/30 dark:border-gray-600/50 p-2 rounded bg-white/20 dark:bg-gray-700/40 text-gray-800 dark:text-gray-100" required />
                <button type="button" onClick={() => removeItem(idx)} className="text-red-500 font-semibold">
                  Remove
                </button>
              </div>
            ))}

            <div className="flex gap-4">
              <button type="button" onClick={addItem} className="text-blue-500 font-semibold">
                + Add Item
              </button>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    "https://www.google.com/search?q=Balamban+food+sales+menu+opening+hours+contact",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="text-green-500 font-semibold"
              >
                Search Online
              </button>
            </div>

            <div className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-100 space-y-1">
              <div>
                Delivery Fee: ₱{deliveryFee.toFixed(2)}{" "}
                {deliveryFee === 120 && <span className="text-red-500">(Night surcharge for Balamban)</span>}
              </div>
              <div>Total: ₱{totalAmount.toFixed(2)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ⚠ Delivery fees may vary depending on distance, time, and rider availability.
              </div>
            </div>


            <select value={form.payment}
              onChange={e => setForm({ ...form, payment: e.target.value })}
              className="border border-white/30 dark:border-gray-600/50 p-2 rounded bg-white/20 dark:bg-gray-700/40 text-gray-800 dark:text-gray-100">
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
            </select>

            <button
              type="submit"
              disabled={submitting || onlineRiders === 0 || !liveLocation}
              className={`px-4 py-2 rounded text-white w-full md:w-auto font-semibold
                  ${onlineRiders === 0 || !liveLocation
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-indigo-600 hover:to-blue-500"
                }`}
            >
              {onlineRiders === 0
                ? "No Riders Available"
                : !liveLocation
                  ? "Enable Location to Place Order"
                  : submitting
                    ? "Placing..."
                    : "Place Order"}
            </button>
          </form>

          {/* ORDER LIST */}
          <h2 className="text-2xl font-semibold mt-6 text-gray-800 dark:text-gray-100">Your Orders</h2>
          {orders.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">No orders yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders
                .slice() // copy so we don't mutate state
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // latest first
                .map(o => (
                  <div key={o.id} className={glassClass + " space-y-2"}>
                    <p><strong>Pickup:</strong> {o.pickup_address}</p>
                    <p><strong>Delivery:</strong> {o.delivery_address}</p>
                    <ul className="pl-4 list-disc text-sm text-gray-800 dark:text-gray-200">
                      {o.items.map((it, i) => (
                        <li key={i}>{it.name} × {it.qty} — ₱{(it.qty * it.price).toFixed(2)}</li>
                      ))}
                    </ul>
                    <p><strong>Total:</strong> ₱{o.total_amount.toFixed(2)}</p>

                    <div className="flex justify-between items-center">
                      <span
                        className="px-3 py-1 rounded-full text-white font-semibold text-xs md:text-sm"
                        style={{ backgroundColor: STATUS_COLORS[o.status] }}
                      >
                        {o.status.toUpperCase()}
                      </span>
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {timers[o.id]}
                      </span>
                    </div>

                    {o.status === "delivered" && (
                      <button
                        onClick={() => confirmDelivery(o.id)}
                        className="mt-2 bg-green-600 text-white px-4 py-1 rounded w-full hover:bg-green-700"
                      >
                        Confirm Delivery
                      </button>
                    )}

                    {o.rider_id && sessionUser && (
                      <button
                        onClick={async () => {
                          const riderName = await fetchRiderName(o.rider_id);
                          setChatRider({ id: o.rider_id, name: riderName });
                          setChatOpen(true);
                        }}
                        className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded w-full hover:bg-indigo-700"
                      >
                        Chat with Rider
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* CHAT MODAL */}
      {chatOpen && chatRider && sessionUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl h-[80vh] flex flex-col shadow-lg text-gray-800 dark:text-gray-100">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Chat with {chatRider.name}</h3>
              <button
                onClick={() => setChatOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Chat profile={sessionUser} patient={chatRider} onClose={() => setChatOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
