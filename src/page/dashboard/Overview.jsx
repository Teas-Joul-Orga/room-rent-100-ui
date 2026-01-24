import {
  HiUsers,
  HiHome,
  HiCurrencyDollar,
  HiCheckCircle,
} from "react-icons/hi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Overview() {
  // Sample cards
  const cards = [
    {
      title: "Total Tenants",
      value: 128,
      icon: <HiUsers className="text-sky-600 text-3xl" />,
    },
    {
      title: "Total Rooms",
      value: 56,
      icon: <HiHome className="text-sky-600 text-3xl" />,
    },
    {
      title: "Monthly Income",
      value: "$8,450",
      icon: <HiCurrencyDollar className="text-sky-600 text-3xl" />,
    },
    {
      title: "Available Rooms",
      value: 12,
      icon: <HiCheckCircle className="text-sky-600 text-3xl" />,
    },
  ];

  // Income data (bar chart)
  const incomeData = [
    { month: "Jan", income: 5000 },
    { month: "Feb", income: 6200 },
    { month: "Mar", income: 7500 },
    { month: "Apr", income: 8000 },
    { month: "May", income: 9000 },
    { month: "Jun", income: 8500 },
    { month: "Jul", income: 1500 },
    { month: "Aug", income: 900 },
    { month: "Sep", income: 2100 },
    { month: "Oct", income: 8100 },
    { month: "Nov", income: 6800 },
    { month: "Dec", income: 9500 },
  ];

  // Recent activity
  const recentActivity = [
    { text: "New tenant added", time: "2m ago" },
    { text: "Room #12 leased", time: "10m ago" },
    { text: "Payment received", time: "1h ago" },
    { text: "Furniture updated", time: "3h ago" },
  ];

  return (
    <div className="space-y-6">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{c.title}</p>
                <h2 className="text-2xl font-bold text-gray-700 mt-1">
                  {c.value}
                </h2>
              </div>
              <div className="p-3 rounded-xl bg-sky-50">{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CHART + ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INCOME CHART */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-sky-100">
          <h3 className="font-semibold text-gray-700 mb-4">Income Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={incomeData}
              margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="income" fill="#0ea5e9" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-100">
          <h3 className="font-semibold text-gray-700 mb-4">Recent Activity</h3>

          <ul className="space-y-4">
            {recentActivity.map((item, idx) => {
              // Determine color based on activity type (optional)
              let color = "bg-sky-500"; // default
              if (item.text.toLowerCase().includes("payment"))
                color = "bg-green-500";
              if (item.text.toLowerCase().includes("deleted"))
                color = "bg-red-500";

              return (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-sky-50 p-3 rounded-lg shadow-sm hover:shadow-md transition"
                >
                  {/* Status Dot */}
                  <span className={`w-3 h-3 mt-2 rounded-full ${color}`} />

                  {/* Activity Text */}
                  <div className="flex-1">
                    <p className="text-gray-700 font-medium">{item.text}</p>
                    <span className="text-gray-400 text-xs">{item.time}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
