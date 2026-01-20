// Settings page: edit your profile and manage users (admin only)
// Demo warning: passwords stay plaintext here

import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
} from "firebase/firestore";

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [userDocId, setUserDocId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasAdminRights, setHasAdminRights] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add-user form state
  const [newUsername, setNewUsername] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState("");
  const [newUserAdminRights, setNewUserAdminRights] = useState(false);
  const [newUserStatus, setNewUserStatus] = useState(null);

  // Edit-user form state
  const [editUsername, setEditUsername] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserConfirmPassword, setEditUserConfirmPassword] = useState("");
  const [editUserAdminRights, setEditUserAdminRights] = useState(false);
  const [editUserStatus, setEditUserStatus] = useState(null);
  const [showRemoveAdminDialog, setShowRemoveAdminDialog] = useState(false);
  const [usersList, setUsersList] = useState([]);

  // On mount: load current user data and build the users dropdown
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const loggedUserData = localStorage.getItem("loggedUser");
        if (!loggedUserData) {
          setStatus({ type: "error", message: "No logged-in user found." });
          setLoading(false);
          return;
        }

        const loggedUser = JSON.parse(loggedUserData);
        const loggedUsername = loggedUser.username;

        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = [];
        let foundUser = null;
        let foundDocId = null;

        usersSnapshot.forEach((docItem) => {
          const userData = docItem.data();
          allUsers.push({ id: docItem.id, ...userData });
          if (userData.username === loggedUsername) {
            foundUser = userData;
            foundDocId = docItem.id;
          }
        });

        if (foundUser && foundDocId) {
          const loadedSettings = {
            loggedUser: foundUser.username || foundUser.Username || "user",
            name: foundUser.Name || foundUser.name || "",
            email: foundUser.Email || foundUser.email || "",
            password: foundUser.password || "",
            isAdmin: foundUser.admin_rights || false,
          };

          setSettings(loadedSettings);
          setUserDocId(foundDocId);
          setName(loadedSettings.name);
          setEmail(loadedSettings.email);
          setHasAdminRights(loadedSettings.isAdmin);
          setUsersList(allUsers);

          localStorage.setItem(
            "budget-app-settings",
            JSON.stringify({
              name: loadedSettings.name,
              email: loadedSettings.email,
            }),
          );
        } else {
          setUsersList(allUsers);
          setStatus({ type: "error", message: "User not found in database." });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setStatus({ type: "error", message: "Failed to load user data" });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Persist settings to Firestore and notify the app
  const persistSettings = async (updated) => {
    try {
      if (userDocId) {
        await updateDoc(doc(db, "users", userDocId), {
          Name: updated.name,
          Email: updated.email,
          password: updated.password,
          admin_rights: updated.isAdmin,
        });
      }

      setSettings(updated);
      setName(updated.name);
      setEmail(updated.email);

      localStorage.setItem(
        "budget-app-settings",
        JSON.stringify({ name: updated.name, email: updated.email }),
      );

      window.dispatchEvent(
        new CustomEvent("settingsUpdated", { detail: updated }),
      );
      return true;
    } catch (error) {
      console.error("Error saving user data:", error);
      setStatus({ type: "error", message: "Failed to save to database" });
      return false;
    }
  };

  // Save current user profile (checks passwords, then saves)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword && newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "New passwords do not match." });
      return;
    }

    if (settings.password && newPassword && oldPassword !== settings.password) {
      setStatus({ type: "error", message: "Actual password is incorrect." });
      return;
    }

    const nextSettings = {
      ...settings,
      name,
      email,
      password: newPassword ? newPassword : settings.password,
      isAdmin: hasAdminRights,
    };

    const success = await persistSettings(nextSettings);
    if (success) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus({ type: "success", message: "Settings saved." });
    }
  };

  // Add a new user (admin only) with basic validation
  const handleAddNewUser = async (e) => {
    e.preventDefault();
    setNewUserStatus(null);

    const adminAllowed =
      settings?.loggedUser === "administrator" || settings?.isAdmin === true;
    if (!adminAllowed) {
      setNewUserStatus({
        type: "error",
        message: "Only administrators can add new users.",
      });
      return;
    }

    if (!newUsername.trim()) {
      setNewUserStatus({ type: "error", message: "New username is required." });
      return;
    }

    if (!newUserName.trim()) {
      setNewUserStatus({ type: "error", message: "Name is required." });
      return;
    }

    if (!newUserPassword || newUserPassword !== newUserConfirmPassword) {
      setNewUserStatus({
        type: "error",
        message: "Passwords do not match or are empty.",
      });
      return;
    }

    try {
      const newDocRef = await addDoc(collection(db, "users"), {
        username: newUsername,
        Name: newUserName,
        Email: newUserEmail,
        password: newUserPassword,
        admin_rights: Boolean(newUserAdminRights),
      });

      window.alert(`The user "${newUsername}" has been created.`);
      setNewUserStatus(null);
      setNewUsername("");
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserConfirmPassword("");
      setNewUserAdminRights(false);

      setUsersList((prev) => [
        ...prev,
        {
          id: newDocRef.id,
          username: newUsername,
          Name: newUserName,
          Email: newUserEmail,
          password: newUserPassword,
          admin_rights: Boolean(newUserAdminRights),
        },
      ]);
    } catch (error) {
      console.error("Error creating new user:", error);
      setNewUserStatus({
        type: "error",
        message: "Failed to create new user.",
      });
    }
  };

  // When a user is selected in the dropdown, preload their fields
  const handleSelectEditUser = (selectedUsername) => {
    setEditUsername(selectedUsername);
    if (!selectedUsername) {
      setEditUserName("");
      setEditUserEmail("");
      setEditUserAdminRights(false);
      setEditUserPassword("");
      setEditUserConfirmPassword("");
      setEditUserStatus(null);
      return;
    }

    const selected = usersList.find((u) => u.username === selectedUsername);
    if (selected) {
      setEditUserName(selected.Name || selected.name || "");
      setEditUserEmail(selected.Email || selected.email || "");
      setEditUserAdminRights(Boolean(selected.admin_rights));
      setEditUserPassword("");
      setEditUserConfirmPassword("");
      setEditUserStatus(null);
    }
  };

  // Save edits for a selected user (admin only)
  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditUserStatus(null);

    const adminAllowed =
      settings?.loggedUser === "administrator" || settings?.isAdmin === true;
    if (!adminAllowed) {
      setEditUserStatus({
        type: "error",
        message: "Only administrators can edit users.",
      });
      return;
    }

    if (!editUsername.trim()) {
      setEditUserStatus({ type: "error", message: "Username is required." });
      return;
    }

    if (!editUserName.trim()) {
      setEditUserStatus({ type: "error", message: "Name is required." });
      return;
    }

    if (editUserPassword || editUserConfirmPassword) {
      if (editUserPassword !== editUserConfirmPassword) {
        setEditUserStatus({
          type: "error",
          message: "Passwords do not match.",
        });
        return;
      }
    }

    try {
      let targetDocId = null;
      let targetUserData = null;

      const targetFromList = usersList.find((u) => u.username === editUsername);
      if (targetFromList) {
        targetDocId = targetFromList.id;
        targetUserData = targetFromList;
      }

      if (!targetDocId) {
        const usersSnapshot = await getDocs(collection(db, "users"));
        usersSnapshot.forEach((docItem) => {
          const data = docItem.data();
          if (data.username === editUsername) {
            targetDocId = docItem.id;
            targetUserData = { id: docItem.id, ...data };
          }
        });
      }

      if (!targetDocId || !targetUserData) {
        setEditUserStatus({
          type: "error",
          message: "User not found in database.",
        });
        return;
      }

      const passwordToSave = editUserPassword
        ? editUserPassword
        : targetUserData.password || "";

      await updateDoc(doc(db, "users", targetDocId), {
        Name: editUserName,
        Email: editUserEmail,
        password: passwordToSave,
        admin_rights: Boolean(editUserAdminRights),
      });

      setUsersList((prev) =>
        prev.map((u) =>
          u.username === editUsername
            ? {
                ...u,
                Name: editUserName,
                Email: editUserEmail,
                admin_rights: Boolean(editUserAdminRights),
                password: passwordToSave,
              }
            : u,
        ),
      );

      setEditUserStatus({
        type: "success",
        message: "User updated successfully.",
      });
      setEditUsername("");
      setEditUserName("");
      setEditUserEmail("");
      setEditUserPassword("");
      setEditUserConfirmPassword("");
      setEditUserAdminRights(false);
    } catch (error) {
      console.error("Error updating user:", error);
      setEditUserStatus({ type: "error", message: "Failed to update user." });
    }
  };

  if (loading) {
    return <div className="card-like">Loading user settings...</div>;
  }

  if (!settings) {
    return (
      <div className="card-like">
        <div className="alert alert-danger">
          No user data found. Please check your Firestore configuration.
        </div>
      </div>
    );
  }

  const isAdminUser =
    settings?.loggedUser === "administrator" || settings?.isAdmin === true;

  return (
    <div className="card-like">
      <h1 className="mt-0 mb-3">User Settings</h1>
      <div className="row g-4 align-items-start">
        <div className={isAdminUser ? "col-12 col-lg-4" : "col-12"}>
          <div className="p-4 border rounded-3 shadow-sm h-100 bg-white settings-card">
            <h3 className="mb-4">Settings for:</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: "bold" }}>
                  Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.loggedUser}
                  readOnly
                  disabled
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: "bold" }}>
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: "bold" }}>
                  Email address
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: "bold" }}>
                  Actual password
                </label>
                <input
                  type="password"
                  className="form-control"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: "bold" }}>
                  New password
                </label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="mb-4">
                <label className="form-label" style={{ fontWeight: "bold" }}>
                  Confirm new password
                </label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="mb-4 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="adminRights"
                  checked={hasAdminRights}
                  onChange={(e) => {
                    if (hasAdminRights && !e.target.checked) {
                      setShowRemoveAdminDialog(true);
                    } else {
                      setHasAdminRights(e.target.checked);
                    }
                  }}
                  disabled={settings.loggedUser !== "administrator"}
                  style={{
                    opacity: settings.loggedUser !== "administrator" ? 0.5 : 1,
                    cursor:
                      settings.loggedUser !== "administrator"
                        ? "not-allowed"
                        : "pointer",
                  }}
                />
                <label
                  className="form-check-label"
                  htmlFor="adminRights"
                  style={{
                    fontWeight: "bold",
                    opacity: settings.loggedUser !== "administrator" ? 0.6 : 1,
                    cursor:
                      settings.loggedUser !== "administrator"
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Administrative rights
                </label>
              </div>

              {status && (
                <div
                  className={`alert alert-${status.type === "error" ? "danger" : "success"}`}
                  role="alert"
                >
                  {status.message}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>

        {isAdminUser && (
          <div className="col-12 col-lg-4">
            <div className="p-4 border rounded-3 shadow-sm h-100 bg-white settings-card">
              <h3 className="mb-4">Add new user</h3>
              <form onSubmit={handleAddNewUser}>
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={settings.loggedUser !== "administrator"}
                    style={{
                      backgroundColor:
                        settings.loggedUser !== "administrator"
                          ? "#e9ecef"
                          : "white",
                      cursor:
                        settings.loggedUser !== "administrator"
                          ? "not-allowed"
                          : "text",
                      opacity:
                        settings.loggedUser !== "administrator" ? 0.6 : 1,
                    }}
                    placeholder="Enter new username"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    disabled={settings.loggedUser !== "administrator"}
                    style={{
                      backgroundColor:
                        settings.loggedUser !== "administrator"
                          ? "#e9ecef"
                          : "white",
                      cursor:
                        settings.loggedUser !== "administrator"
                          ? "not-allowed"
                          : "text",
                      opacity:
                        settings.loggedUser !== "administrator" ? 0.6 : 1,
                    }}
                    placeholder="Enter name"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    disabled={settings.loggedUser !== "administrator"}
                    style={{
                      backgroundColor:
                        settings.loggedUser !== "administrator"
                          ? "#e9ecef"
                          : "white",
                      cursor:
                        settings.loggedUser !== "administrator"
                          ? "not-allowed"
                          : "text",
                      opacity:
                        settings.loggedUser !== "administrator" ? 0.6 : 1,
                    }}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    New password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    disabled={settings.loggedUser !== "administrator"}
                    style={{
                      backgroundColor:
                        settings.loggedUser !== "administrator"
                          ? "#e9ecef"
                          : "white",
                      cursor:
                        settings.loggedUser !== "administrator"
                          ? "not-allowed"
                          : "text",
                      opacity:
                        settings.loggedUser !== "administrator" ? 0.6 : 1,
                    }}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Confirm New password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={newUserConfirmPassword}
                    onChange={(e) => setNewUserConfirmPassword(e.target.value)}
                    disabled={settings.loggedUser !== "administrator"}
                    style={{
                      backgroundColor:
                        settings.loggedUser !== "administrator"
                          ? "#e9ecef"
                          : "white",
                      cursor:
                        settings.loggedUser !== "administrator"
                          ? "not-allowed"
                          : "text",
                      opacity:
                        settings.loggedUser !== "administrator" ? 0.6 : 1,
                    }}
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="mb-4 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="newUserAdminRights"
                    checked={newUserAdminRights}
                    onChange={(e) => setNewUserAdminRights(e.target.checked)}
                    disabled={settings.loggedUser !== "administrator"}
                    style={{
                      opacity:
                        settings.loggedUser !== "administrator" ? 0.5 : 1,
                      cursor:
                        settings.loggedUser !== "administrator"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="newUserAdminRights"
                    style={{
                      fontWeight: "bold",
                      opacity:
                        settings.loggedUser !== "administrator" ? 0.6 : 1,
                      cursor:
                        settings.loggedUser !== "administrator"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Administrative rights
                  </label>
                </div>

                {newUserStatus && (
                  <div
                    className={`alert alert-${newUserStatus.type === "error" ? "danger" : "success"}`}
                    role="alert"
                  >
                    {newUserStatus.message}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={settings.loggedUser !== "administrator"}
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isAdminUser && (
          <div className="col-12 col-lg-4">
            <div className="p-4 border rounded-3 shadow-sm h-100 bg-white settings-card">
              <h3 className="mb-4">Edit users</h3>
              <form onSubmit={handleEditUser}>
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Username
                  </label>
                  <select
                    className="form-select"
                    value={editUsername}
                    onChange={(e) => handleSelectEditUser(e.target.value)}
                    disabled={!isAdminUser}
                    style={{
                      backgroundColor: !isAdminUser ? "#e9ecef" : "white",
                      cursor: !isAdminUser ? "not-allowed" : "pointer",
                      opacity: !isAdminUser ? 0.6 : 1,
                    }}
                  >
                    <option value="">Select a user</option>
                    {usersList.map((user) => (
                      <option key={user.id} value={user.username}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    disabled={!isAdminUser}
                    style={{
                      backgroundColor: !isAdminUser ? "#e9ecef" : "white",
                      cursor: !isAdminUser ? "not-allowed" : "text",
                      opacity: !isAdminUser ? 0.6 : 1,
                    }}
                    placeholder="Enter name"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    disabled={!isAdminUser}
                    style={{
                      backgroundColor: !isAdminUser ? "#e9ecef" : "white",
                      cursor: !isAdminUser ? "not-allowed" : "text",
                      opacity: !isAdminUser ? 0.6 : 1,
                    }}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    New password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    disabled={!isAdminUser}
                    style={{
                      backgroundColor: !isAdminUser ? "#e9ecef" : "white",
                      cursor: !isAdminUser ? "not-allowed" : "text",
                      opacity: !isAdminUser ? 0.6 : 1,
                    }}
                    placeholder="Enter new password (or leave blank to keep)"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Confirm New password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={editUserConfirmPassword}
                    onChange={(e) => setEditUserConfirmPassword(e.target.value)}
                    disabled={!isAdminUser}
                    style={{
                      backgroundColor: !isAdminUser ? "#e9ecef" : "white",
                      cursor: !isAdminUser ? "not-allowed" : "text",
                      opacity: !isAdminUser ? 0.6 : 1,
                    }}
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="mb-4 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="editUserAdminRights"
                    checked={editUserAdminRights}
                    onChange={(e) => setEditUserAdminRights(e.target.checked)}
                    disabled={!isAdminUser}
                    style={{
                      opacity: !isAdminUser ? 0.5 : 1,
                      cursor: !isAdminUser ? "not-allowed" : "pointer",
                    }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="editUserAdminRights"
                    style={{
                      fontWeight: "bold",
                      opacity: !isAdminUser ? 0.6 : 1,
                      cursor: !isAdminUser ? "not-allowed" : "pointer",
                    }}
                  >
                    Administrative rights
                  </label>
                </div>

                {editUserStatus && (
                  <div
                    className={`alert alert-${editUserStatus.type === "error" ? "danger" : "success"}`}
                    role="alert"
                  >
                    {editUserStatus.message}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!isAdminUser}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {showRemoveAdminDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
          onClick={() => setShowRemoveAdminDialog(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              maxWidth: "450px",
              width: "90%",
              padding: "32px",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#fff3cd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                  fontSize: "24px",
                }}
              >
                ⚠️
              </div>
              <h5
                style={{
                  margin: 0,
                  color: "#333",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                Remove Administrative Rights?
              </h5>
            </div>

            <p
              style={{
                margin: "16px 0",
                color: "#666",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Are you sure you want to remove administrative rights? Once
              removed, you'll lose access to administrative features and won't
              be able to manage users or modify critical settings. This action
              can only be reversed by another administrator.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                onClick={() => {
                  setHasAdminRights(false);
                  setShowRemoveAdminDialog(false);
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#c82333")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#dc3545")}
              >
                Yes, Remove Rights
              </button>
              <button
                onClick={() => setShowRemoveAdminDialog(false)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#5a6268")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#6c757d")}
              >
                Cancel
              </button>
            </div>
          </div>

          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Settings;
