// Navigation bar with links; updates the Settings label when profile changes

import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navigation.css";

const Navigation = ({ onLogout }) => {
  const [userName, setUserName] = useState("Settings");

  // Sync the Settings label with localStorage and the settingsUpdated event
  useEffect(() => {
    // Read saved name from localStorage
    const loadUserName = () => {
      const saved = localStorage.getItem("budget-app-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUserName(parsed.name || "Settings");
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    };

    // Load name on mount
    loadUserName();

    // Handle custom event updates
    const handleSettingsUpdate = (event) => {
      if (event.detail && event.detail.name) {
        setUserName(event.detail.name);
      }
    };

    // Attach listeners
    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    window.addEventListener("storage", loadUserName);

    // Cleanup listeners
    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
      window.removeEventListener("storage", loadUserName);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg mb-3">
      <div className="container-fluid">
        {/* Brand link to Dashboard */}
        <Link className="navbar-brand" to="/">
          BudgetApp
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            {/* Dashboard */}
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Dashboard
              </NavLink>
            </li>

            {/* Exchange Rates */}
            <li className="nav-item">
              <NavLink className="nav-link" to="/rates">
                Exchange Rates
              </NavLink>
            </li>

            {/* User Settings */}
            <li className="nav-item">
              <NavLink className="nav-link user-nav-link" to="/settings">
                {userName}
              </NavLink>
            </li>

            {/* Logout */}
            <li className="nav-item">
              <button
                className="nav-link btn btn-link"
                onClick={onLogout}
                style={{
                  textDecoration: "none",
                  cursor: "pointer",
                  color: "inherit",
                  border: "none",
                  background: "none",
                  padding: "0.5rem 1rem",
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
