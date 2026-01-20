// ExchangeRates page: CRUD on Firestore and push updates into context
// Keeps edit buffers per row and a modal for adding new currencies

import React, { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { FaTimesCircle, FaPlusCircle, FaCheckCircle } from "react-icons/fa";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

const ExchangeRates = () => {
  const { exchangeRates, dispatch } = useContext(AppContext);

  // Edit buffers per row
  const [inputValues, setInputValues] = useState({});
  const [nameValues, setNameValues] = useState({});
  const [symbolValues, setSymbolValues] = useState({});

  // Modal form state
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newRate, setNewRate] = useState("");
  const [modalError, setModalError] = useState("");

  // Admin gate for editing
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  // Firestore IDs for each rate row
  const [rateDocIds, setRateDocIds] = useState([]);
  const nameInputRef = useRef(null);

  // On mount: load document IDs used for updates/deletes
  useEffect(() => {
    const loadDocIds = async () => {
      try {
        const snapshot = await getDocs(collection(db, "exchange_rates"));
        const ids = snapshot.docs.map((doc) => doc.id);
        setRateDocIds(ids);
      } catch (error) {
        console.error("Error loading doc IDs:", error);
      }
    };
    loadDocIds();
  }, [exchangeRates]);

  // Check if current user has admin rights
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const loggedUserRaw = localStorage.getItem("loggedUser");
        if (!loggedUserRaw) {
          setIsAdmin(false);
          return;
        }

        const loggedUser = JSON.parse(loggedUserRaw);
        const username = loggedUser.username;

        // Shortcut: username "administrator" is admin
        let hasRights = username === "administrator";

        // Otherwise check Firestore flag
        const usersSnapshot = await getDocs(collection(db, "users"));
        usersSnapshot.forEach((docItem) => {
          const data = docItem.data();
          if (data.username === username) {
            hasRights = hasRights || !!data.admin_rights;
          }
        });

        setIsAdmin(hasRights);
      } catch (error) {
        console.error("Error checking admin rights:", error);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdmin();
  }, []);

  // Preload inputs with existing rates
  useEffect(() => {
    if (exchangeRates) {
      const initialValues = {};
      const initialNames = {};
      const initialSymbols = {};
      exchangeRates.forEach((rate, index) => {
        initialValues[index] = rate.rate;
        initialNames[index] = rate.name;
        initialSymbols[index] = rate.symbol;
      });
      setInputValues(initialValues);
      setNameValues(initialNames);
      setSymbolValues(initialSymbols);
    }
  }, [exchangeRates]);

  // Validate rate: empty or non-negative number with max 2 decimals
  const handleRateChange = (index, value) => {
    if (
      value === "" ||
      (/^\d*\.?\d{0,2}$/.test(value) && parseFloat(value) >= 0)
    ) {
      setInputValues((s) => ({ ...s, [index]: value }));
    }
  };

  // Enter on rate input saves the row
  const handleRateKeyDown = (index, e) => {
    if (e.key === "Enter") {
      handleSaveRow(index);
    }
  };

  // Update text buffers while typing
  const handleTextChange = (index, field, value) => {
    if (field === "name") {
      setNameValues((s) => ({ ...s, [index]: value }));
    } else if (field === "symbol") {
      setSymbolValues((s) => ({ ...s, [index]: value }));
    }
  };

  // Enter on text inputs also saves the row
  const handleTextKeyDown = (index, field, e) => {
    if (e.key === "Enter") {
      handleSaveRow(index);
    }
  };

  // Build the updated rate object; return null if data is bad
  const buildRowUpdate = (index) => {
    const current = exchangeRates[index];
    const nextName = nameValues[index]?.trim();
    const nextSymbol = symbolValues[index]?.trim();
    const rawRate = inputValues[index];
    const parsedRate =
      rawRate === "" || rawRate === undefined ? NaN : parseFloat(rawRate);
    const finalRate = Number.isNaN(parsedRate) ? current.rate : parsedRate;

    if (!nextName || !nextSymbol || finalRate < 0 || Number.isNaN(finalRate)) {
      return null;
    }
    return { ...current, name: nextName, symbol: nextSymbol, rate: finalRate };
  };

  // Save a row: update Firestore then dispatch new list
  const handleSaveRow = async (index) => {
    if (editingDisabled) return;
    const updated = buildRowUpdate(index);
    if (!updated) {
      // Revert invalid edits
      setNameValues((s) => ({ ...s, [index]: exchangeRates[index].name }));
      setSymbolValues((s) => ({ ...s, [index]: exchangeRates[index].symbol }));
      setInputValues((s) => ({ ...s, [index]: exchangeRates[index].rate }));
      return;
    }

    try {
      // Update Firestore
      const docId = rateDocIds[index];
      if (docId) {
        await updateDoc(doc(db, "exchange_rates", docId), {
          "Currency name": updated.name,
          "Currency symbol": updated.symbol,
          "Currency code": updated.code,
          "Exchange rate (per 1 EUR)": updated.rate,
        });
      }

      // Update local list for instant feedback
      const updatedRates = exchangeRates.map((r, i) =>
        i === index ? updated : r,
      );
      dispatch({ type: "CHG_EXCHANGE_RATE", payload: updatedRates });
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      alert("Failed to save changes to database");
    }
  };

  // On blur: restore name/symbol if left empty
  const handleTextBlur = (index, field) => {
    if (field === "name" && !nameValues[index]?.trim()) {
      setNameValues((s) => ({ ...s, [index]: exchangeRates[index].name }));
    }
    if (field === "symbol" && !symbolValues[index]?.trim()) {
      setSymbolValues((s) => ({ ...s, [index]: exchangeRates[index].symbol }));
    }
  };

  // On blur: reset invalid rate inputs
  const handleRateBlur = (index) => {
    const raw = inputValues[index];
    if (raw === "" || isNaN(parseFloat(raw)) || parseFloat(raw) < 0) {
      setInputValues((s) => ({ ...s, [index]: exchangeRates[index].rate }));
    }
  };

  // Delete a rate row
  const handleRemove = async (index) => {
    if (editingDisabled) return;
    try {
      // Delete from Firestore
      const docId = rateDocIds[index];
      if (docId) {
        await deleteDoc(doc(db, "exchange_rates", docId));
      }

      // Update local list
      const updatedRates = exchangeRates.filter((_, i) => i !== index);
      dispatch({ type: "CHG_EXCHANGE_RATE", payload: updatedRates });
    } catch (error) {
      console.error("Error deleting exchange rate:", error);
      alert("Failed to delete from database");
    }
  };

  // Open modal for a new currency
  const handleAddNew = () => {
    if (editingDisabled) return;
    setNewName("");
    setNewSymbol("");
    setNewCode("");
    setNewRate("");
    setModalError("");
    setShowModal(true);
  };

  // Autofocus first input when modal opens
  useEffect(() => {
    if (showModal && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showModal]);

  // Add a new currency after basic validation
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    // basic validation
    if (!newName.trim()) {
      setModalError("Currency name is required");
      return;
    }
    if (!newSymbol.trim()) {
      setModalError("Currency symbol is required");
      return;
    }
    if (!newCode.trim() || newCode.trim().length !== 3) {
      setModalError("Currency code must be 3 letters (e.g., PLN, USD)");
      return;
    }
    const parsed = parseFloat(newRate);
    if (isNaN(parsed) || parsed < 0) {
      setModalError("Exchange rate must be a non-negative number");
      return;
    }

    const newRateObj = {
      symbol: newSymbol.trim(),
      name: newName.trim(),
      code: newCode.trim().toUpperCase(),
      rate: parsed,
    };

    try {
      // Add to Firestore
      await addDoc(collection(db, "exchange_rates"), {
        "Currency name": newRateObj.name,
        "Currency symbol": newRateObj.symbol,
        "Currency code": newRateObj.code,
        "Exchange rate (per 1 EUR)": newRateObj.rate,
      });

      // Update local state
      const updatedRates = [...(exchangeRates || []), newRateObj];
      dispatch({ type: "CHG_EXCHANGE_RATE", payload: updatedRates });

      // Preload edit buffer for the new row
      setInputValues((s) => ({
        ...s,
        [updatedRates.length - 1]: newRateObj.rate,
      }));
      setShowModal(false);
    } catch (error) {
      console.error("Error adding exchange rate:", error);
      setModalError("Failed to add currency to database");
    }
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setModalError("");
  };

  const editingDisabled = adminLoading || !isAdmin;

  if (!exchangeRates) return <div>Loading exchange rates...</div>;

  return (
    <div>
      <div
        style={{ display: "flex", alignItems: "center", gap: 12 }}
        className="mt-3"
      >
        <button
          className="btn btn-outline-primary"
          onClick={handleAddNew}
          disabled={editingDisabled}
          style={{
            borderRadius: 8,
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: 6,
            opacity: editingDisabled ? 0.5 : 1,
            cursor: editingDisabled ? "not-allowed" : "pointer",
          }}
        >
          <FaPlusCircle
            style={{
              backgroundColor: editingDisabled ? "#ced4da" : "#0d6efd",
              color: editingDisabled ? "#6c757d" : "#fff",
              borderRadius: "50%",
              padding: 3,
              width: 20,
              height: 20,
            }}
          />
          <span style={{ fontSize: "0.95rem" }}>Add new</span>
        </button>
      </div>

      <table className="table" style={{ width: "auto", marginTop: 8 }}>
        <thead className="thead-light">
          <tr>
            <th scope="col">Currency</th>
            <th scope="col">Symbol</th>
            <th scope="col">Exchange rate</th>
            <th scope="col">Save</th>
            <th scope="col">Remove</th>
          </tr>
        </thead>
        <tbody>
          {exchangeRates.map((rate, index) => (
            <tr key={index}>
              <td style={{ verticalAlign: "middle" }}>
                <input
                  type="text"
                  value={nameValues[index] ?? rate.name}
                  onChange={(e) =>
                    handleTextChange(index, "name", e.target.value)
                  }
                  onKeyDown={(e) => handleTextKeyDown(index, "name", e)}
                  onBlur={() => handleTextBlur(index, "name")}
                  className="form-control"
                  disabled={editingDisabled}
                  style={{
                    maxWidth: 180,
                    backgroundColor: editingDisabled ? "#f1f3f5" : "white",
                    color: editingDisabled ? "#6c757d" : "#212529",
                  }}
                  aria-label="Currency name"
                />
              </td>
              <td style={{ verticalAlign: "middle" }}>
                <input
                  type="text"
                  value={symbolValues[index] ?? rate.symbol}
                  onChange={(e) =>
                    handleTextChange(index, "symbol", e.target.value)
                  }
                  onKeyDown={(e) => handleTextKeyDown(index, "symbol", e)}
                  onBlur={() => handleTextBlur(index, "symbol")}
                  className="form-control"
                  disabled={editingDisabled}
                  style={{
                    maxWidth: 120,
                    backgroundColor: editingDisabled ? "#f1f3f5" : "white",
                    color: editingDisabled ? "#6c757d" : "#212529",
                  }}
                  aria-label="Currency symbol"
                />
              </td>
              <td style={{ verticalAlign: "middle" }}>
                1 EUR =
                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    inputValues[index] !== undefined
                      ? inputValues[index]
                      : rate.rate
                  }
                  onChange={(e) => handleRateChange(index, e.target.value)}
                  onKeyDown={(e) => handleRateKeyDown(index, e)}
                  onBlur={() => handleRateBlur(index)}
                  min="0"
                  step="0.01"
                  style={{
                    width: 80,
                    marginLeft: 8,
                    padding: 4,
                    borderRadius: 4,
                    backgroundColor: editingDisabled ? "#f1f3f5" : "white",
                    color: editingDisabled ? "#6c757d" : "#212529",
                  }}
                  disabled={editingDisabled}
                />
              </td>
              <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                <FaCheckCircle
                  size={20}
                  color={editingDisabled ? "#adb5bd" : "#198754"}
                  className="save-icon"
                  style={{
                    cursor: editingDisabled ? "not-allowed" : "pointer",
                    opacity: editingDisabled ? 0.5 : 1,
                    pointerEvents: editingDisabled ? "none" : "auto",
                  }}
                  onClick={() => !editingDisabled && handleSaveRow(index)}
                  title="Save changes"
                />
              </td>
              <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                <FaTimesCircle
                  size={20}
                  color={editingDisabled ? "#adb5bd" : "black"}
                  style={{
                    cursor: editingDisabled ? "not-allowed" : "pointer",
                    opacity: editingDisabled ? 0.5 : 1,
                    pointerEvents: editingDisabled ? "none" : "auto",
                  }}
                  onClick={() => !editingDisabled && handleRemove(index)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1050,
            }}
            aria-modal="true"
          >
            <form
              onSubmit={handleModalSubmit}
              style={{
                background: "#fff",
                padding: 20,
                borderRadius: 8,
                minWidth: 320,
                boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
              }}
              role="dialog"
            >
              <h4 style={{ marginTop: 0 }}>Add new currency</h4>
              <div className="mb-2">
                <label className="form-label">Currency name</label>
                <input
                  type="text"
                  className="form-control"
                  ref={nameInputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  aria-label="Currency name"
                />
              </div>
              <div className="mb-2">
                <label className="form-label">Currency symbol</label>
                <input
                  type="text"
                  className="form-control"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  aria-label="Currency symbol"
                />
              </div>
              <div className="mb-2">
                <label className="form-label">Currency code</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g., PLN, USD, GBP"
                  maxLength="3"
                  aria-label="Currency code"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Exchange rate (per 1 EUR)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  step="0.01"
                  min="0"
                  aria-label="Exchange rate"
                />
              </div>
              {modalError && (
                <div style={{ color: "#b00020" }}>{modalError}</div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleModalCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ExchangeRates;
