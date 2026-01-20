// AllocationForm: add a department allocation without blowing the budget

import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";

const AllocationForm = (props) => {
  const {
    Currency,
    Budget,
    expenses,
    dispatch,
    convertToEur,
    convertFromEur,
    getSymbolForCode,
    formatNumber,
  } = useContext(AppContext);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  // On submit: validate, respect remaining funds, convert to EUR, dispatch
  const submitEvent = () => {
    // Require a department name
    if (!name) {
      alert("Please enter a department name.");
      return;
    }

    // Block duplicate departments
    if (expenses.find((exp) => exp.name === name)) {
      alert(`The department "${name}" already exists.`);
      return;
    }

    // Require a positive amount
    const numeric = parseFloat(quantity);
    if (!isNaN(numeric) && numeric > 0) {
      // Current total expenses
      const totalExpenses = expenses.reduce((total, item) => {
        return (total += item.allocatedBudget);
      }, 0);

      // Remaining funds (EUR)
      const remaining = parseInt(Budget) - totalExpenses;

      // Remaining in display currency
      const remainingDisplay = convertFromEur(remaining, Currency);

      // Do not exceed remaining funds
      if (numeric <= remainingDisplay) {
        // Store in EUR
        const quantityEur = Math.round(convertToEur(numeric, Currency));
        const item = {
          name: name,
          quantity: quantityEur,
        };

        // Send to reducer
        dispatch({
          type: "ADD_EXPENSE",
          payload: item,
        });

        // Reset form
        setName("");
        setQuantity("");
      } else {
        // Not enough funds
        alert(
          `The value cannot exceed remaining funds ${getSymbolForCode(
            Currency,
          )}${formatNumber(remainingDisplay)}!`,
        );
      }
    } else {
      // Invalid number
      alert("The field must be a positive number!");
    }
  };

  return (
    <div>
      <div className="row">
        <div className="col-sm">
          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <label className="input-group-text" htmlFor="department">
                Department
              </label>
            </div>
            <input
              required="required"
              type="text"
              className="form-control"
              id="department"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <div className="input-group-prepend" style={{ marginLeft: "2rem" }}>
              <label className="input-group-text" htmlFor="quantity">
                Allocation
              </label>
            </div>
            <span
              className="eco"
              style={{ marginLeft: "2rem", marginRight: "8px" }}
            ></span>
            <span style={{ marginRight: "8px" }}>
              {getSymbolForCode(Currency)}
            </span>
            <input
              required="required"
              type="number"
              className="form-control"
              id="quantity"
              min="0"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />

            <button
              className="btn btn-primary"
              onClick={submitEvent}
              style={{ marginLeft: "2rem" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationForm;
