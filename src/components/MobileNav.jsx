import { FiHome, FiList, FiTruck } from "react-icons/fi";

export default function MobileNav({ role, selectedPage, onSelectPage }) {
  const menuItems =
    role === "Rider"
      ? [
          { key: "dashboard", label: "Dashboard", icon: FiHome },
          { key: "deliveries", label: "Deliveries", icon: FiTruck },
        ]
      : [
          { key: "dashboard", label: "Dashboard", icon: FiHome },
          { key: "orders", label: "Orders", icon: FiList },
        ];

  return (
    <div className="md:hidden sticky top-0 z-40 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
      <div className="flex justify-around px-2 py-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          const active = selectedPage === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onSelectPage(item.key)}
              className={`flex flex-col items-center text-xs px-3 py-1 rounded transition
                ${active
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-gray-500 dark:text-gray-400"}
              `}
            >
              <Icon className="text-xl mb-1" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
