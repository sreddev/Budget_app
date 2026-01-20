// Spent widget: shows total allocated amount in current currency
import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const Spent = () => {
  const { expenses, Currency, convertFromEur, formatNumber } =
    useContext(AppContext);
  const totalSpent = expenses.reduce((total, item) => {
    return (total += item.allocatedBudget);
  }, 0);

  // Convert to display currency
  const spentDisplay = convertFromEur(totalSpent, Currency);

  return (
    <div className="alert alert-primary">
      <span>
        Spent so far: {formatNumber(spentDisplay)} {Currency}
      </span>
    </div>
  );
};

export default Spent;
