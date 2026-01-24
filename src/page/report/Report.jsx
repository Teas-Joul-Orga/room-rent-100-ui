// import "./report.css";

const revenueData = [
  { month: "May", revenue: 38200, expenses: 11200, profit: 27000 },
  { month: "Jun", revenue: 39500, expenses: 10800, profit: 28700 },
  { month: "Jul", revenue: 40100, expenses: 12100, profit: 28000 },
  { month: "Aug", revenue: 41300, expenses: 11900, profit: 29400 },
  { month: "Sep", revenue: 40800, expenses: 12300, profit: 28500 },
  { month: "Oct", revenue: 41500, expenses: 11700, profit: 30200 },
  { month: "Nov", revenue: 42600, expenses: 12400, profit: 30100 },
];

const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));

export default function Report() {
  return (
    <div className="reports-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Reports & Analytics</h2>
          <p>View financial and operational reports</p>
        </div>
        <button className="btn-primary">Export All</button>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <Kpi title="Total Revenue" value="$282,380" trend="+8.5%" />
        <Kpi title="Total Expenses" value="$82,450" sub="29.2% of revenue" />
        <Kpi title="Net Profit" value="$199,930" trend="+12.3%" />
        <Kpi title="Avg Occupancy" value="86.8%" trend="+3.2%" />
      </div>

      {/* BAR CHART */}
      <div className="card">
        <h4>Revenue vs Expenses (Last 7 Months)</h4>

        <div className="bar-chart">
          {revenueData.map((item) => (
            <div className="bar-row" key={item.month}>
              <span className="month">{item.month}</span>

              <div className="bars">
                <div
                  className="bar revenue"
                  style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                >
                  ${item.revenue / 1000}k
                </div>

                <div
                  className="bar expense"
                  style={{ width: `${(item.expenses / maxRevenue) * 100}%` }}
                >
                  ${item.expenses / 1000}k
                </div>
              </div>

              <span className="profit">${item.profit / 1000}k</span>
            </div>
          ))}
        </div>

        <div className="legend">
          <span className="dot blue" /> Revenue
          <span className="dot red" /> Expenses
        </div>
      </div>

      {/* REPORT CARDS */}
      <div className="report-grid">
        <ReportCard
          title="Monthly Revenue Report"
          date="November 2025"
          items={[
            { label: "Revenue", value: "$42,580", green: true },
            { label: "Expenses", value: "$12,450", red: true },
            { label: "Profit", value: "$30,130", green: true },
          ]}
        />

        <ReportCard
          title="Occupancy Report"
          date="Q4 2025"
          items={[
            { label: "Occupancy Rate", value: "87.5%" },
            { label: "Occupied", value: "42 / 48" },
          ]}
        />

        <ReportCard
          title="Payment Analysis"
          date="November 2025"
          items={[
            { label: "Collected", value: "$38,200", green: true },
            { label: "Pending", value: "$4,380", orange: true },
            { label: "Overdue", value: "$8,400", red: true },
          ]}
        />
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Kpi({ title, value, trend, sub }) {
  return (
    <div className="kpi-card">
      <span className="kpi-title">{title}</span>
      <h3>{value}</h3>
      {trend && <p className="green">↑ {trend} from last period</p>}
      {sub && <p className="muted">{sub}</p>}
    </div>
  );
}

function ReportCard({ title, date, items }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <span className="muted">{date}</span>

      <div className="report-list">
        {items.map((i) => (
          <div key={i.label} className="report-row">
            <span>{i.label}</span>
            <span
              className={
                i.green ? "green" : i.red ? "red" : i.orange ? "orange" : ""
              }
            >
              {i.value}
            </span>
          </div>
        ))}
      </div>

      <button className="btn-outline">Download Report</button>
    </div>
  );
}
