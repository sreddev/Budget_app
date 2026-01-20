// Main app wrapper: login gate + routes for dashboard, rates, and settings

import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import { AppProvider } from "./context/AppContext";
import Navigation from "./components/Navigation";
import Login from "./components/Login";
import Budget from "./components/Budget";
import Remaining from "./components/Remaining";
import TotalSpent from "./components/TotalSpent";
import ExpenseList from "./components/ExpenseList";
import AllocationForm from "./components/AllocationForm";
import Currencies from "./components/Currencies";
import ExchangeRates from "./components/ExchangeRates";
import Settings from "./components/Settings";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // On mount: auto-login if stored user exists
  useEffect(() => {
    const loggedUser = localStorage.getItem("loggedUser");
    if (loggedUser) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    setIsLoggedIn(false);
  };

  if (loading) {
    return <div className="container mt-5 text-center">Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  return (
    <AppProvider onLogout={handleLogout}>
      <Navigation onLogout={handleLogout} />
      <div className="container">
        <Routes>
          {/* Dashboard route */}
          <Route
            path="/"
            element={
              <>
                <h3 className="mt-3">Financial Budget Overview</h3>
                <div className="row mt-3">
                  <div className="col-sm">
                    <Budget />
                  </div>
                  <div className="col-sm">
                    <Remaining />
                  </div>
                  <div className="col-sm">
                    <TotalSpent />
                  </div>
                  <div className="col-sm">
                    <Currencies />
                  </div>
                </div>
                <h3 className="mt-3">Allocation by department</h3>
                <div className="row ">
                  <div className="col-sm">
                    <ExpenseList />
                  </div>
                </div>
                <h3 className="mt-3">Add Allocation</h3>
                <div className="row mt-3">
                  <div className="col-sm">
                    <AllocationForm />
                  </div>
                </div>
              </>
            }
          />

          {/* Exchange rates route */}
          <Route
            path="/rates"
            element={
              <>
                <h1 className="mt-3">Exchange Rates</h1>
                <div className="row mt-3">
                  <div className="col-sm">
                    <ExchangeRates />
                  </div>
                </div>
              </>
            }
          />

          {/* User settings route */}
          <Route
            path="/settings"
            element={
              <div className="row mt-3">
                <div className="col-lg-8 col-md-10">
                  <Settings />
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </AppProvider>
  );
};
export default App;
