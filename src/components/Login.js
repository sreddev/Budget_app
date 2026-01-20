// Simple login: check username/password from Firestore and continue

import React, { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Login.css";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Pull all users from Firestore
      const usersSnapshot = await getDocs(collection(db, "users"));

      // Find a user matching the credentials
      let foundUser = null;
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.username === username && userData.password === password) {
          foundUser = userData;
        }
      });

      if (foundUser) {
        // Successful login: store user and move on
        localStorage.setItem(
          "loggedUser",
          JSON.stringify({
            username: foundUser.username,
            name: foundUser.Name || foundUser.name || foundUser.username,
            email: foundUser.Email || foundUser.email || "",
          }),
        );
        onLoginSuccess();
      } else {
        setError("Invalid username or password.");
      }
    } catch (err) {
      console.error("Error during login:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>BudgetApp</h1>
          <p className="login-subtitle">Financial Management System</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-control form-control-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-control form-control-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-100"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
