// src/pages/RiderDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import Chat from "../components/Chat";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const STATUS_COLORS = {
  pending: "#fbbf24",
  assigned: "#3b82f6",
  delivered: "#10b981",
};

function formatElapsedTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function RiderDashboard({ selectedPage, onHeaderLogout = () => { }, registerBell, setUnreadCount }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({});
  const [rider, setRider] = useState(null);
  const [filterToday, setFilterToday] = useState(false);
  const [onlineRiders, setOnlineRiders] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatCustomer, setChatCustomer] = useState(null);
  const [weather, setWeather] = useState(null);

  // ---------------- WEATHER ----------------
  const fetchWeather = async () => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current_weather=true`);
      const data = await res.json();
      const temp = data?.current_weather?.temperature;
      const wCode = data?.current_weather?.weathercode;
      const condition =
        wCode === 0 ? "Clear" : wCode < 3 ? "Partly Cloudy" : "Cloudy";
      setWeather({ temp, condition, rain: wCode >= 61 && wCode <= 67 });
    } catch (e) {
      console.error("Weather error:", e);
    }
  };

  // ---------------- ONLINE RIDERS ----------------
  const fetchOnlineRiders = async () => {
    const { data } = await supabase
      .from("ridercustomer_users")
      .select("id, name")
      .eq("is_online", true);
    setOnlineRiders(data || []);
    setOnlineCount(data?.length || 0);
  };

  // ---------------- RIDER PROFILE ----------------
  const fetchRiderProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from("ridercustomer_users")
      .select("*")
      .eq("id", userId)
      .single();
    setRider(data);
  };

  // ---------------- ORDERS ----------------
  const fetchOrders = async () => {
    if (!rider) return;
    setLoading(true);

    const todayStr = new Date().toLocaleDateString();
    const isToday = (o) => new Date(o.created_at).toLocaleDateString() === todayStr;
    const riderId = rider.id;

    const { data: myOrders } = await supabase
      .from("orders")
      .select(`*, customer:ridercustomer_users!orders_customer_id_fkey(id,name,email,phone)`)
      .eq("rider_id", riderId)
      .order("created_at", { ascending: true }); // ascending for chart trend

    const { data: avail } = await supabase
      .from("orders")
      .select(`*, customer:ridercustomer_users!orders_customer_id_fkey(id,name,email,phone)`)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const filteredMyOrders = filterToday ? myOrders.filter(isToday) : myOrders;
    const filteredAvail = filterToday ? avail.filter(isToday) : avail;

    // Orders cards descending
    setOrders(filteredMyOrders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setAvailableOrders(filteredAvail.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setLoading(false);
  };

  // ---------------- EFFECTS ----------------
  useEffect(() => { fetchWeather(); fetchRiderProfile(); fetchOnlineRiders(); }, []);
  useEffect(() => { if (rider) fetchOrders(); }, [rider, filterToday]);

  // ---------------- TIMERS ----------------
  useEffect(() => {
    const interval = setInterval(() => {
      const t = {};
      [...orders, ...availableOrders].forEach((o) => {
        const start = new Date(o.created_at).getTime();
        const end = o.delivered_at ? new Date(o.delivered_at).getTime() : Date.now();
        t[o.id] = formatElapsedTime(end - start);
      });
      setTimers(t);
    }, 1000);
    return () => clearInterval(interval);
  }, [orders, availableOrders]);

  // ---------------- HEADER BELL ----------------
  useEffect(() => {
    if (!registerBell) return;
    registerBell(() => {
      if (!chatCustomer) setChatCustomer({ name: "Customer" });
      setChatOpen(true);
      setUnreadCount?.(0);
    });
  }, [registerBell, setUnreadCount, chatCustomer]);

  // ---------------- CLAIM / DELIVER ----------------
  const claimOrder = async (orderId) => {
    await supabase
      .from("orders")
      .update({ rider_id: rider.id, status: "assigned", assigned_at: new Date().toISOString() })
      .eq("id", orderId);
    fetchOrders();
  };
  const markDelivered = async (orderId) => {
    await supabase
      .from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", orderId);
    fetchOrders();
  };

  // ---------------- LOGOUT ----------------
  const logoutHandler = async (option) => {
    if (option === "offline") {
      await supabase.from("ridercustomer_users").update({ is_online: false }).eq("id", rider.id);
    }
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  useEffect(() => { if (typeof onHeaderLogout === "function") onHeaderLogout(() => logoutHandler); }, [rider]);

  // ---------------- CHART DATA ----------------
  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const chartDates = [...new Set(deliveredOrders.map(o => new Date(o.created_at).toLocaleDateString()))]
    .sort((a, b) => new Date(a) - new Date(b)); // ascending

  const lineChartData = {
    labels: chartDates,
    datasets: [{
      label: "Delivered Orders",
      data: chartDates.map(date => deliveredOrders.filter(o => new Date(o.created_at).toLocaleDateString() === date).length),
      borderColor: "#22c55e",
      backgroundColor: "rgba(34,197,94,0.2)",
      fill: true,
      tension: 0.3,
    }],
  };

  const statusCounts = {
    pending: availableOrders.length,
    assigned: orders.filter(o => o.status === "assigned").length,
    delivered: deliveredOrders.length,
  };

  const doughnutData = {
    labels: ["Pending", "Assigned", "Delivered"],
    datasets: [{
      data: [statusCounts.pending, statusCounts.assigned, statusCounts.delivered],
      backgroundColor: [STATUS_COLORS.pending, STATUS_COLORS.assigned, STATUS_COLORS.delivered],
    }],
  };

  const barData = { labels: ["Delivered Today"], datasets: [{ label: "Count", data: [deliveredOrders.length], backgroundColor: "#10b981" }] };

  if (loading || !rider) return <div className="text-gray-800 dark:text-gray-100">Loading…</div>;

  // ---------------- ORDER CARD ----------------
  const renderOrderCard = (o, isAssigned = false) => (
    <div
      key={o.id}
      className="bg-white dark:bg-gray-800 p-4 shadow rounded space-y-2 text-gray-800 dark:text-gray-100"
    >
      <p><strong>Customer:</strong> <span className="dark:text-gray-200">{o.customer?.name}</span></p>
      <p><strong>Email:</strong> <span className="dark:text-gray-200">{o.customer?.email}</span></p>
      <p><strong>Phone:</strong> <span className="dark:text-gray-200">{o.customer?.phone}</span></p>
      <p><strong>Pickup:</strong> <span className="dark:text-gray-200">{o.pickup_address}</span></p>
      <p><strong>Delivery:</strong> <span className="dark:text-gray-200">{o.delivery_address}</span></p>
      <ul className="pl-4 list-disc text-sm text-gray-700 dark:text-gray-300">
        {o.items?.map((it, i) => (
          <li key={i}>
            {it.name} × {it.qty} — ₱{(it.qty * Number(it.price)).toFixed(2)}
          </li>
        ))}
      </ul>
      <p className="font-semibold dark:text-gray-100">Total: ₱{o.total_amount?.toFixed(2)}</p>
      <div className="flex justify-between items-center mt-2">
        <span
          className="px-2 py-1 rounded font-semibold"
          style={{
            backgroundColor: STATUS_COLORS[o.status?.toLowerCase()] || "#10b981",
            color: ["delivered", "completed"].includes(o.status?.toLowerCase()) ? "black" : "white",
          }}
        >
          {o.status.toUpperCase()}
        </span>
        <span className="font-mono text-sm dark:text-gray-200">{timers[o.id]}</span>
      </div>
      {isAssigned && o.status?.toLowerCase() === "assigned" && (
        <button
          onClick={() => markDelivered(o.id)}
          className="mt-3 w-full px-4 py-1 rounded bg-green-600 dark:bg-green-700 text-white font-semibold hover:bg-green-500 dark:hover:bg-green-600 transition"
        >
          Mark Delivered
        </button>
      )}
      {!isAssigned && o.status?.toLowerCase() === "pending" && (
        <button
          onClick={() => claimOrder(o.id)}
          className="mt-2 w-full px-3 py-1 rounded bg-blue-600 dark:bg-blue-700 text-white font-semibold hover:bg-blue-500 dark:hover:bg-blue-600 transition"
        >
          Claim Order
        </button>
      )}
      <button
        onClick={() => { setChatCustomer(o.customer); setChatOpen(true); }}
        className="mt-2 w-full px-3 py-1 rounded bg-indigo-600 dark:bg-indigo-700 text-white font-semibold hover:bg-indigo-500 dark:hover:bg-indigo-600 transition"
      >
        Chat with Customer
      </button>
      <button
        onClick={() => {
          // Force full page reload to ensure fresh data
          window.location.href = `/rider/map/${o.id}`;
        }}
        className="mt-2 w-full px-3 py-1 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition"
      >
        View Map
      </button>
    </div>
  );

  // ---------------- JSX ----------------
  return (
    <div className="space-y-6 px-2 md:px-6 text-gray-800 dark:text-gray-100">
      {/* WEATHER */}
      {weather && (
        <div className="backdrop-blur-md bg-white/70 dark:bg-gray-700/60 p-4 shadow rounded flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Weather</h2>
            <p>Condition: <strong>{weather.condition}</strong></p>
            <p>Temperature: <strong>{weather.temp}°C</strong></p>
          </div>
          <div className="text-4xl">{weather.rain ? "🌧️" : weather.condition === "Clear" ? "☀️" : "⛅"}</div>
        </div>
      )}

      {/* ONLINE STATUS */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow rounded flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          Status:
          <span className={`ml-2 font-bold ${rider.is_online ? "text-green-500" : "text-red-500"}`}>
            {rider.is_online ? "ONLINE" : "OFFLINE"}
          </span>
        </h2>
        <button
          className={`px-4 py-2 rounded text-white ${rider.is_online ? "bg-red-600" : "bg-green-600"}`}
          onClick={async () => {
            await supabase.from("ridercustomer_users").update({ is_online: !rider.is_online }).eq("id", rider.id);
            setRider({ ...rider, is_online: !rider.is_online });
            fetchOnlineRiders();
          }}
        >{rider.is_online ? "Go Offline" : "Go Online"}</button>
      </div>

      {/* ONLINE RIDERS */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow rounded">
        <p className="font-semibold mb-2">Online Riders ({onlineCount}):</p>
        <ul className="pl-5 list-disc text-gray-700 dark:text-gray-200">{onlineRiders.map(r => <li key={r.id}>{r.name}</li>)}</ul>
      </div>

      {/* CHARTS */}
      {selectedPage === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow"><Line data={lineChartData} /></div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow"><Doughnut data={doughnutData} /></div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow"><Bar data={barData} /></div>
        </div>
      )}

      {/* DELIVERIES */}
      {selectedPage === "deliveries" && (
        <>
          <button onClick={() => setFilterToday(!filterToday)} className="bg-blue-600 text-white px-4 py-2 rounded">{filterToday ? "Show All Orders" : "Show Today's Orders"}</button>

          <h2 className="text-2xl font-semibold mt-4">Available Orders</h2>
          {availableOrders.length === 0 ? <p>No available orders.</p> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{availableOrders.map(o => renderOrderCard(o))}</div>
          }

          <h2 className="text-2xl font-semibold mt-6">My Deliveries</h2>
          {orders.length === 0 ? <p>No assigned deliveries.</p> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{orders.map(o => renderOrderCard(o, true))}</div>
          }
        </>
      )}

      {/* CHAT MODAL */}
      {chatOpen && chatCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl h-[80vh] flex flex-col shadow-lg">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Chat with {chatCustomer.name}</h3>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Chat profile={rider} patient={chatCustomer} onClose={() => setChatOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
