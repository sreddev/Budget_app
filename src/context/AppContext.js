// AppContext: keeps budget, expenses, currency, and rates in one place
// Flow: component dispatches -> reducer updates -> state re-renders

import React, { createContext, useReducer, useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

// Grab currency code from a string like "Dollar (USD)"
const codeFromName = (name) => {
  if (!name) return null;
  const m = name.match(/\(([^)]+)\)/);
  return m ? m[1] : null;
};

// Prefer rate.code, otherwise parse it from name
const getCodeFromRate = (rate) => {
  if (rate.code) return rate.code;
  return codeFromName(rate.name);
};

export const AppReducer = (state, action) => {
  switch (action.type) {
    case "ADD_EXPENSE": {
      // Add a new department allocation
      const { name, quantity } = action.payload;
      const newExpense = {
        id: name,
        name: name,
        allocatedBudget: quantity,
      };
      return { ...state, expenses: [newExpense, ...state.expenses] };
    }

    case "ADD_QUANTITY": {
      // Bump allocation for an existing department
      const { name, quantity } = action.payload;
      const newExpenses = state.expenses.map((expense) =>
        expense.name === name
          ? { ...expense, allocatedBudget: expense.allocatedBudget + quantity }
          : expense,
      );
      return { ...state, expenses: newExpenses };
    }

    case "RED_QUANTITY": {
      // Reduce allocation but never go below 0
      const { name, quantity } = action.payload;
      const newExpenses = state.expenses.map((expense) => {
        if (expense.name === name) {
          const newVal = expense.allocatedBudget - quantity;
          return { ...expense, allocatedBudget: newVal < 0 ? 0 : newVal };
        }
        return expense;
      });
      return { ...state, expenses: newExpenses };
    }

    case "CHG_BUDGET": {
      // Set budget; clamp negatives to 0
      const newBudget = action.payload < 0 ? 0 : action.payload;
      return { ...state, Budget: newBudget };
    }

    case "DELETE_ITEM": {
      // Drop a department from the list
      const { name } = action.payload;
      const newExpenses = state.expenses.filter(
        (expense) => expense.name !== name,
      );
      return { ...state, expenses: newExpenses };
    }

    case "CHG_CURRENCY": {
      // Switch active currency
      return { ...state, Currency: action.payload };
    }

    case "CHG_EXCHANGE_RATE": {
      // Replace exchange rates; keep currency if it still exists
      const newRates = action.payload || [];
      const currentCurrency = state.Currency || "EUR";
      const hasCurrency =
        currentCurrency === "EUR" ||
        newRates.some((r) => getCodeFromRate(r) === currentCurrency);
      return {
        ...state,
        exchangeRates: newRates,
        Currency: hasCurrency ? currentCurrency : "EUR",
      };
    }

    default:
      return state;
  }
};

const initialState = {
  Budget: 2000,
  expenses: [
    { id: "Marketing", name: "Marketing", allocatedBudget: 50 },
    { id: "Finance", name: "Finance", allocatedBudget: 300 },
    { id: "Sales", name: "Sales", allocatedBudget: 70 },
    { id: "HR", name: "HR", allocatedBudget: 40 },
    { id: "IT", name: "IT", allocatedBudget: 500 },
  ],
  Currency: "EUR",
  exchangeRates: [
    { symbol: "USD", name: "Dollar", code: "USD", rate: 1.1 },
    { symbol: "GBP", name: "Pound", code: "GBP", rate: 0.86 },
    { symbol: "RON", name: "Lei", code: "RON", rate: 4.97 },
  ],
};

// Global context handle
export const AppContext = createContext();

export const AppProvider = (props) => {
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  // Initialize reducer; merge saved state if found
  const [state, dispatch] = useReducer(AppReducer, initialState, (initial) => {
    const localData = localStorage.getItem("budget-app-state");
    if (localData) {
      const savedState = JSON.parse(localData);
      return {
        ...initial,
        Budget:
          savedState.Budget !== undefined ? savedState.Budget : initial.Budget,
        expenses: savedState.expenses || initial.expenses,
        Currency: savedState.Currency || initial.Currency,
      };
    }
    return initial;
  });

  // On mount: load rates from Firestore
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const ratesSnapshot = await getDocs(collection(db, "exchange_rates"));
        const rates = ratesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            symbol: data["Currency symbol"] || data.symbol,
            name: data["Currency name"] || data.name,
            code: data["Currency code"] || data.code,
            rate: data["Exchange rate (per 1 EUR)"] || data.rate,
          };
        });

        if (rates.length > 0) {
          dispatch({ type: "CHG_EXCHANGE_RATE", payload: rates });
        }
      } catch (error) {
        console.error("Error loading exchange rates from Firestore:", error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    loadExchangeRates();
  }, []);

  // Persist budget, expenses, and currency to localStorage
  useEffect(() => {
    const budgetData = {
      Budget: state.Budget,
      expenses: state.expenses,
      Currency: state.Currency,
    };
    localStorage.setItem("budget-app-state", JSON.stringify(budgetData));
  }, [state.Budget, state.expenses, state.Currency]);

  // Total expenses in EUR
  const totalExpenses = state.expenses.reduce((total, item) => {
    return (total = total + item.allocatedBudget);
  }, 0);

  const spent = totalExpenses;

  // Get rate for a code (EUR defaults to 1)
  const getRateForCode = (code) => {
    if (!code || code === "EUR") return 1;
    const found = state.exchangeRates.find((r) => getCodeFromRate(r) === code);
    return found ? found.rate : null;
  };

  // Get symbol for a code
  const getSymbolForCode = (code) => {
    if (!code) return "";
    const found = state.exchangeRates.find((r) => getCodeFromRate(r) === code);
    return found ? found.symbol : code;
  };

  // Convert from EUR to display currency
  const convertFromEur = (amountEur, toCode) => {
    const rate = getRateForCode(toCode);
    if (rate == null) return amountEur;
    return amountEur * rate;
  };

  // Convert from display currency to EUR
  const convertToEur = (amountDisplay, fromCode) => {
    const rate = getRateForCode(fromCode);
    if (rate == null || rate === 0) return amountDisplay;
    return amountDisplay / rate;
  };

  // Format number with two decimals
  const formatNumber = (num) => {
    return Number(num).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <AppContext.Provider
      value={{
        // State principal
        Budget: state.Budget,
        expenses: state.expenses,
        spent,
        Currency: state.Currency,
        exchangeRates: state.exchangeRates,

        // Dispatch for reducer actions
        dispatch,

        // Flag for exchange rate loading
        isLoadingRates,

        // Helper functions for currency ops
        getRateForCode,
        getSymbolForCode,
        convertFromEur,
        convertToEur,
        formatNumber,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};
