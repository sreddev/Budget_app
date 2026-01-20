import React, { useContext } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppContext } from "../context/AppContext";

const ExpenseChart = () => {
  const { expenses, spent } = useContext(AppContext);

  // Build pie data; skip empty allocations
  const chartData = expenses
    .filter((expense) => expense.allocatedBudget > 0)
    .map((expense) => ({
      name: expense.name,
      value: expense.allocatedBudget,
      percentage:
        spent > 0 ? ((expense.allocatedBudget / spent) * 100).toFixed(1) : 0,
    }));

  // Palette for the pie slices
  const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <p>No expenses allocated yet</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => `${props.payload.percentage}%`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseChart;
