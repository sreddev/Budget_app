import React, { useContext } from "react";
import ExpenseItem from "./ExpenseItem";
import ExpenseChart from "./ExpenseChart";
import { AppContext } from "../context/AppContext";

// ExpenseList: table of departments plus a chart sidebar
const ExpenseList = () => {
  // Pull expenses from context
  const { expenses } = useContext(AppContext);

  return (
    <div className="row" style={{ alignItems: "stretch" }}>
      <div
        className="col-md-7"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <table className="table" style={{ flex: "1" }}>
          <thead className="thead-light">
            <tr>
              <th scope="col" style={{ textAlign: "center" }}>
                Department
              </th>
              <th scope="col" style={{ textAlign: "center" }}>
                Allocation Budget
              </th>
              <th scope="col" style={{ textAlign: "center" }}>
                Increase by 10
              </th>
              <th scope="col" style={{ textAlign: "center" }}>
                Decrease by 10
              </th>
              <th scope="col" style={{ textAlign: "center" }}>
                Remove
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Render each department row */}
            {expenses.map((expense) => (
              <ExpenseItem
                id={expense.id}
                key={expense.id}
                name={expense.name}
                budget={expense.allocatedBudget}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="col-md-5">
        <ExpenseChart />
      </div>
    </div>
  );
};

export default ExpenseList;
