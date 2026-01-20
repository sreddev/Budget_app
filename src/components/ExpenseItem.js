// ExpenseItem: one row with actions to add/remove budget or delete
import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { FaPlusCircle, FaTimesCircle } from "react-icons/fa";
import { MdDoNotDisturbOn } from "react-icons/md";

const ExpenseItem = (props) => {
  const {
    dispatch,
    Currency,
    convertFromEur,
    convertToEur,
    getSymbolForCode,
    formatNumber,
  } = useContext(AppContext);
  const symbol = getSymbolForCode(Currency);

  // Remove the department entirely
  const handleDeleteItem = () => {
    const item = {
      name: props.name,
    };

    dispatch({
      type: "DELETE_ITEM",
      payload: item,
    });
  };

  // Add 10 (converted to EUR) to this department
  const handleIncreaseBudget = () => {
    const qtyEur = Math.round(convertToEur(10, Currency));
    const item = {
      name: props.name,
      quantity: qtyEur,
    };

    dispatch({
      type: "ADD_QUANTITY",
      payload: item,
    });
  };

  // Remove 10 (converted to EUR) from this department
  const handleDecreaseBudget = () => {
    const qtyEur = Math.round(convertToEur(10, Currency));
    const item = {
      name: props.name,
      quantity: qtyEur,
    };

    dispatch({
      type: "RED_QUANTITY",
      payload: item,
    });
  };

  // Show allocation in active currency
  const displayBudget = convertFromEur(props.budget, Currency);

  return (
    <tr>
      <td style={{ verticalAlign: "middle" }}>{props.name}</td>
      <td
        style={{
          verticalAlign: "middle",
          textAlign: "right",
          fontFamily: "monospace",
        }}
      >
        <span style={{ float: "left" }}>{symbol}</span>
        {formatNumber(displayBudget)}
      </td>
      <td style={{ verticalAlign: "middle", textAlign: "center" }}>
        <FaPlusCircle
          size="2.2em"
          color="#4ead5c"
          onClick={handleIncreaseBudget}
        ></FaPlusCircle>
      </td>
      <td style={{ verticalAlign: "middle", textAlign: "center" }}>
        <MdDoNotDisturbOn
          size="2.2em"
          color="#b43434"
          onClick={handleDecreaseBudget}
        ></MdDoNotDisturbOn>
      </td>
      <td style={{ verticalAlign: "middle", textAlign: "center" }}>
        <FaTimesCircle
          size="2.2em"
          color="#9a9a9a"
          onClick={handleDeleteItem}
        ></FaTimesCircle>
      </td>
    </tr>
  );
};

export default ExpenseItem;
