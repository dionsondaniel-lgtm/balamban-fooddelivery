import { FiHome, FiList, FiTruck } from "react-icons/fi";

export default function Sidebar({ role, onSelectPage, selectedPage }) {
  const menuItems =
    role === "Rider"
      ? [
          { key: "dashboard", label: "Dashboard", icon: <FiHome /> },
          { key: "deliveries", label: "Deliveries", icon: <FiTruck /> },
        ]
      : [
          { key: "dashboard", label: "Dashboard", icon: <FiHome /> },
          { key: "orders", label: "Orders", icon: <FiList /> },
        ];

  return (
    <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 min-h-screen border-r dark:border-gray-700">
      <div className="w-full">
        <div className="p-6 text-2xl font-bold border-b dark:border-gray-700">
          Delivery App
        </div>

        <nav className="p-6 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.key}
              onClick={() => onSelectPage(item.key)}
              className={`flex items-center gap-3 p-2 w-full rounded ${
                selectedPage === item.key
                  ? "bg-gray-200 dark:bg-gray-700"
                  : ""
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

