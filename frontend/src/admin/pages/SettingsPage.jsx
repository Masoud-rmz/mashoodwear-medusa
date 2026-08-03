import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminChangePassword, adminGetSettings, adminUpdateSettings } from "../../api/adminClient";
import { clearAdminToken } from "../../utils/adminAuth";
import Toast from "../../components/Toast";

/**
 * Site settings: social links, hero video, logo, change password.
 */
export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    adminGetSettings().then(setSettings);
  }, []);

  if (!settings) {
    return <p>Loading…</p>;
  }

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append("instagramDirectUrl", settings.instagramDirectUrl);
    formData.append("telegramUsername", settings.telegramUsername);
    formData.append("bankCardNumber", settings.bankCardNumber || "");
    formData.append("bankCardHolder", settings.bankCardHolder || "");
    formData.append("bankName", settings.bankName || "");
    formData.append("heroVideoEnabled", String(settings.heroVideoEnabled));
    formData.append("heroVideoUrl", settings.heroVideoUrl);
    if (logoFile) {
      formData.append("logo", logoFile);
    }

    try {
      const next = await adminUpdateSettings(formData);
      setSettings(next);
      setToast("Saved");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      await adminChangePassword(currentPassword, newPassword);
      clearAdminToken();
      navigate("/cms/login");
    } catch {
      setPasswordError("Could not change password");
    }
  };

  return (
    <div className="admin-settings-page">
      <form className="admin-form" onSubmit={handleSubmit}>
        <h1 className="admin-page-title">Settings</h1>

        <h2 className="admin-section-title">Card-to-card payment</h2>
        <label>
          Bank card number
          <input
            value={settings.bankCardNumber || ""}
            onChange={(event) => updateField("bankCardNumber", event.target.value)}
            placeholder="6037-...."
            inputMode="numeric"
          />
        </label>
        <label>
          Card holder name
          <input
            value={settings.bankCardHolder || ""}
            onChange={(event) => updateField("bankCardHolder", event.target.value)}
          />
        </label>
        <label>
          Bank name (optional)
          <input
            value={settings.bankName || ""}
            onChange={(event) => updateField("bankName", event.target.value)}
          />
        </label>

        <h2 className="admin-section-title">Receipt / social links</h2>
        <label>
          Instagram Direct URL
          <input
            value={settings.instagramDirectUrl}
            onChange={(event) => updateField("instagramDirectUrl", event.target.value)}
          />
        </label>
        <label>
          Telegram username
          <input
            value={settings.telegramUsername}
            onChange={(event) => updateField("telegramUsername", event.target.value)}
          />
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={settings.heroVideoEnabled}
            onChange={(event) => updateField("heroVideoEnabled", event.target.checked)}
          />
          Enable hero video
        </label>
        <label>
          Hero video URL
          <input
            value={settings.heroVideoUrl}
            onChange={(event) => updateField("heroVideoUrl", event.target.value)}
          />
        </label>
        <label>
          Logo upload
          <input type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] || null)} />
        </label>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      <form className="admin-form admin-password-form" onSubmit={handlePasswordChange}>
        <h2 className="admin-section-title">Change password</h2>
        {passwordError && <p className="admin-error">{passwordError}</p>}
        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label>
          New password
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-secondary">
          Change password
        </button>
      </form>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
