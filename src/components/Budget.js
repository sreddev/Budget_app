// Budget input: edit total budget in the current currency with basic guards
import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";

const Budget = () => {
  // Pull state, dispatch, and currency helpers
  const {
    Budget: budgetEur,
    expenses,
    Currency,
    dispatch,
    convertFromEur,
    convertToEur,
  } = useContext(AppContext);
  // Local input mirrors budget in display currency
  const [inputValue, setInputValue] = useState(() => {
    return convertFromEur(budgetEur, Currency);
  });

  // Keep input synced when budget or currency changes
  useEffect(() => {
    setInputValue(convertFromEur(budgetEur, Currency));
  }, [budgetEur, Currency, convertFromEur]);

  // Validate and save budget changes
  const changeBudget = (valDisplay) => {
    const totalSpent = expenses.reduce((total, item) => {
      return (total += item.allocatedBudget);
    }, 0);

    const newBudgetEur = Math.round(
      convertToEur(parseFloat(valDisplay || 0), Currency),
    );

    if (newBudgetEur > 20000) {
      alert("The value can not be more than 20,000");
      setInputValue(convertFromEur(budgetEur, Currency));
      return;
    }
    if (newBudgetEur <= totalSpent) {
      alert(
        "The Budget value cannot be less than the spent value: " +
          totalSpent +
          " EUR",
      );
      setInputValue(convertFromEur(budgetEur, Currency));
      return;
    }
    dispatch({
      type: "CHG_BUDGET",
      payload: newBudgetEur,
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      changeBudget(inputValue);
    }
  };

  return (
    <div
      className="alert alert-secondary"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>Budget: </div>
      <input
        required="required"
        type="number"
        id="budget"
        value={inputValue}
        style={{ size: 10 }}
        step="10"
        max="20000"
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
      ></input>
      <div style={{ marginLeft: "0.5rem" }}>{Currency}</div>
    </div>
  );
};

export default Budget;
