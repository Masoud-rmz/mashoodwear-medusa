import { useEffect, useState } from "react";
import { adminGetSettings, adminUpdateSettings } from "../../api/adminClient";
import Toast from "../../components/Toast";

/**
 * Admin home content editor (hero + brand story).
 */
export default function HomeSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [heroImage1, setHeroImage1] = useState(null);
  const [heroImage2, setHeroImage2] = useState(null);

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
    formData.append("heroEyebrow", settings.heroEyebrow);
    formData.append("heroHeadline", settings.heroHeadline);
    formData.append("heroSubtitle", settings.heroSubtitle);
    formData.append("brandStoryTeaser", settings.brandStoryTeaser);
    formData.append("brandStoryBody", settings.brandStoryBody);
    if (heroImage1) formData.append("hero_image_1", heroImage1);
    if (heroImage2) formData.append("hero_image_2", heroImage2);

    try {
      const next = await adminUpdateSettings(formData);
      setSettings(next);
      setToast("Saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h1 className="admin-page-title">Home</h1>

      <label>
        Hero eyebrow
        <input
          value={settings.heroEyebrow}
          onChange={(event) => updateField("heroEyebrow", event.target.value)}
        />
      </label>
      <label>
        Hero headline
        <input
          value={settings.heroHeadline}
          onChange={(event) => updateField("heroHeadline", event.target.value)}
        />
      </label>
      <label>
        Hero subtitle
        <textarea
          value={settings.heroSubtitle}
          onChange={(event) => updateField("heroSubtitle", event.target.value)}
          rows={3}
        />
      </label>
      <label>
        Brand story teaser
        <input
          value={settings.brandStoryTeaser}
          onChange={(event) => updateField("brandStoryTeaser", event.target.value)}
        />
      </label>
      <label>
        Brand story body
        <textarea
          value={settings.brandStoryBody}
          onChange={(event) => updateField("brandStoryBody", event.target.value)}
          rows={4}
        />
      </label>
      <label>
        Hero image 1
        <input type="file" accept="image/*" onChange={(event) => setHeroImage1(event.target.files?.[0] || null)} />
      </label>
      <label>
        Hero image 2
        <input type="file" accept="image/*" onChange={(event) => setHeroImage2(event.target.files?.[0] || null)} />
      </label>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </form>
  );
}
