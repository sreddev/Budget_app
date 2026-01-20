// CartValue: shows total cart price in the active currency
import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const CartValue = () => {
  // Pull expenses and helpers from context
  const { expenses, Currency, formatNumber } = useContext(AppContext);

  // Sum each item's unit price * quantity
  const totalExpenses = expenses.reduce((total, item) => {
    return (total += item.unitprice * item.quantity);
  }, 0);

  return (
    <div className="alert alert-primary">
      <span>
        Cart Value: {formatNumber(totalExpenses)} {Currency}
      </span>
    </div>
  );
};

export default CartValue;
