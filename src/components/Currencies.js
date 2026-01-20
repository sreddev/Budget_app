// Currencies selector: switch active currency from context rates
import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import "./Currencies.css";

const Currencies = () => {
  const { Currency, dispatch, exchangeRates } = useContext(AppContext);

  // Try to pull currency code from a label like "Dollar (USD)"
  const codeFromName = (name) => {
    if (!name) return null;
    const m = name.match(/\(([^)]+)\)/);
    return m ? m[1] : null;
  };

  // Prefer explicit code; else parse it from name
  const getCodeFromRate = (rate) => {
    if (rate.code) return rate.code;
    return codeFromName(rate.name);
  };

  // Dispatch currency change to context
  const changeCurrency = (val) => {
    dispatch({
      type: "CHG_CURRENCY",
      payload: val,
    });
  };

  return (
    <div className="alert alert-secondary dropdownContainer">
      Currency:{" "}
      <select
        name="currency"
        id="currency"
        value={Currency}
        onChange={(event) => changeCurrency(event.target.value)}
        className="dropdown"
      >
        <option className="dropdown-options" value="EUR">
          Euro (EUR)
        </option>
        {exchangeRates &&
          exchangeRates.map((r, i) => {
            const code = getCodeFromRate(r);
            return (
              <option key={i} className="dropdown-options" value={code}>
                {r.name} ({code})
              </option>
            );
          })}
      </select>
    </div>
  );
};

export default Currencies;
