
import { useEffect, useState } from "react";
import "./FightLabAuth.css";
import FightLabProfile from "./FightLabProfile.jsx";
import FightLabCalendar from "./FightLabCalendar.jsx";

const TOKEN_KEY = "fightlab_demo_token";

export default function FightLabAuth() {
  const [mode, setMode] = useState("login");
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY) || ""
  );
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const controller = new AbortController();

    fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Your session has expired.");
        }
        return response.json();
      })
      .then((data) => setUser(data.user))
      .catch((error) => {
        if (error.name === "AbortError") return;

        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setMessage(error.message);
      });

    return () => controller.abort();
  }, [token]);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint =
        mode === "register"
          ? "/api/auth/register"
          : "/api/auth/login";

      const payload =
        mode === "register"
          ? form
          : {
              email: form.email,
              password: form.password
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Authentication failed."
        );
      }

      sessionStorage.setItem(TOKEN_KEY, data.token);

      setUser(data.user);
      setToken(data.token);

      setForm({
        username: "",
        email: "",
        password: ""
      });

      setMessage(data.message || "Login successful.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setMessage("You have signed out.");
  };

  const avatarUrl = user?.avatar
    ? user.avatar
    : "";

  if (user) {
    return (
      <section className="fightlab-auth">
        <div className="fightlab-auth-header">
          <span className="fightlab-auth-label">
            FIGHTLAB ACCOUNT
          </span>
          <span className="fightlab-online">
            ● ONLINE
          </span>
        </div>

        <div className="fightlab-profile-summary">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${user.username}'s avatar`}
              className="fightlab-avatar"
            />
          ) : (
            <div className="fightlab-avatar-placeholder">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h3>{user.username}</h3>
            <p>{user.email}</p>
          </div>
        </div>
        <p className="fightlab-auth-success">
          Account authenticated successfully.
        </p>

        {/* Profile picture upload and management */}
        <FightLabProfile
          onProfileUpdated={(updatedUser) => {
            setUser(updatedUser);
          }}
        />
<FightLabCalendar />
        <button
          type="button"
          className="fightlab-auth-button secondary"
          onClick={handleLogout}
        >
          SIGN OUT
        </button>
      </section>
    );
  }

  return (
    <section className="fightlab-auth">
      <div className="fightlab-auth-header">
        <span className="fightlab-auth-label">
          FIGHTLAB ACCOUNT
        </span>
      </div>

      <h2>
        {mode === "login"
          ? "PLAYER LOGIN"
          : "CREATE PLAYER ACCOUNT"}
      </h2>

      <p className="fightlab-auth-description">
        Sign in to manage your training profile
        and saved training sessions.
      </p>

      <form onSubmit={handleSubmit}>
        {mode === "register" && (
          <label>
            Username
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              minLength={3}
              maxLength={30}
              required
              autoComplete="username"
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
            autoComplete={
              mode === "register"
                ? "new-password"
                : "current-password"
            }
          />
        </label>

        {message && (
          <p className="fightlab-auth-message" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="fightlab-auth-button"
          disabled={loading}
        >
          {loading
            ? "PLEASE WAIT..."
            : mode === "login"
              ? "SIGN IN"
              : "REGISTER"}
        </button>
      </form>

      <button
        type="button"
        className="fightlab-switch-mode"
        onClick={() => {
          setMode(
            mode === "login" ? "register" : "login"
          );
          setMessage("");
        }}
      >
        {mode === "login"
          ? "Don't have an account? Register"
          : "Already have an account? Sign in"}
      </button>
    </section>
  );
}
