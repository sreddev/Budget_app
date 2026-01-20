// TotalSpent: quick total of allocations (EUR-based but displayed with symbol)
import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const TotalSpent = () => {
  const { expenses, Currency, formatNumber } = useContext(AppContext);
  // Sum allocations (stored in EUR)
  const totalExpenses = expenses.reduce((total, item) => {
    return (total += item.allocatedBudget);
  }, 0);

  return (
    <div className="alert alert-primary">
      <span>
        Total Spent: {formatNumber(totalExpenses)} {Currency}
      </span>
    </div>
  );
};

export default TotalSpent;
