import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../../api/adminClient";
import { setAdminToken } from "../../utils/adminAuth";

/**
 * Admin login form.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await adminLogin(username, password);
      setAdminToken(response.token);
      navigate("/admin");
    } catch {
      setError("Wrong username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        {error && <p className="admin-error">{error}</p>}
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Checking…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
