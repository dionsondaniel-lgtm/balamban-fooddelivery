import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
    const subscription = supabase
      .from("orders")
      .on("*", () => fetchOrders())
      .subscribe();

    return () => supabase.removeSubscription(subscription);
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from("orders").select("*");
    if (error) return console.log(error);
    setOrders(data);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Orders</h2>
      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
            <p>Order ID: {order.id}</p>
            <p>Status: {order.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
