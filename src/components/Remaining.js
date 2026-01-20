// Remaining widget: shows leftover budget in current currency
import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const Remaining = () => {
  const { expenses, Budget, Currency, convertFromEur, formatNumber } =
    useContext(AppContext);
  const totalExpenses = expenses.reduce((total, item) => {
    return (total += item.allocatedBudget);
  }, 0);

  // Compute remaining budget in EUR then convert to display currency
  const remainingEur = parseInt(Budget) - totalExpenses;
  const remainingDisplay = convertFromEur(remainingEur, Currency);

  return (
    <div className="alert alert-success">
      <span>
        Remaining: {formatNumber(remainingDisplay)} {Currency}
      </span>
    </div>
  );
};

export default Remaining;
