import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./chart.css";

const data = [
  { month: "Jan", income: 3500 },
  { month: "Feb", income: 4200 },
  { month: "Mar", income: 4800 },
  { month: "Apr", income: 5000 },
  { month: "May", income: 5300 },
  { month: "Jun", income: 4700 },
  { month: "Jul", income: 5200 },
  { month: "Aug", income: 5500 },
  { month: "Sep", income: 6000 },
  { month: "Oct", income: 5800 },
  { month: "Nov", income: 6200 },
  { month: "Dec", income: 6500 },
];

export default function MonthlyIncomeChart() {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        padding: "1rem",
        borderRadius: "0.5rem",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ color: "#1e293b", marginBottom: "1rem" }}>Monthly Income</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid stroke="#f0f9ff" strokeDasharray="5 5" />
          <XAxis dataKey="month" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip formatter={(value) => `$${value}`} />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#0284c7"
            strokeWidth={3}
            dot={{ r: 5, fill: "#0284c7" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
