import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  loginCustomerWithOtp,
  loginCustomerWithPassword,
  registerCustomerWithOtp,
  resetCustomerPassword,
  sendCustomerOtp,
} from "../api/medusa/auth";
import { useAuth } from "../context/AuthContext";

/**
 * Safe in-app redirect after login (path only).
 * @param {string | null} redirect
 * @returns {string}
 */
function safeRedirectPath(redirect) {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/account";
  }
  return redirect;
}

/**
 * Customer login / register / password reset — phone OTP + password.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, onAuthSuccess } = useAuth();
  const redirectAfterAuth = safeRedirectPath(searchParams.get("redirect"));

  const initialMode =
    searchParams.get("mode") === "register"
      ? "register"
      : searchParams.get("mode") === "reset"
        ? "reset"
        : "login";
  const [mode, setMode] = useState(initialMode);
  const [loginMethod, setLoginMethod] = useState("password");
  const [registerMethod, setRegisterMethod] = useState("password");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (isLoggedIn && mode !== "reset") {
      navigate(redirectAfterAuth, { replace: true });
    }
  }, [isLoggedIn, navigate, mode, redirectAfterAuth]);

  async function finishAuth() {
    await onAuthSuccess();
    navigate(redirectAfterAuth, { replace: true });
  }

  async function handleSendOtp(purpose) {
    setBusy(true);
    setError(null);
    setInfo(null);
    const result = await sendCustomerOtp(phone, purpose);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setOtpSent(true);
    if (typeof result.data.debug_otp === "string") {
      setDebugOtp(result.data.debug_otp);
      setOtp(result.data.debug_otp);
      setInfo("حالت stub: کد تأیید در همین صفحه پر شد (بدون پیامک واقعی).");
    } else {
      setDebugOtp("");
      setInfo("کد تأیید ارسال شد.");
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    if (registerMethod === "otp" && (!otpSent || !otp.trim())) {
      setError("ابتدا کد تأیید را دریافت و وارد کنید.");
      return;
    }
    if (password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await registerCustomerWithOtp({
      phone,
      password,
      first_name: firstName,
      last_name: lastName,
      ...(registerMethod === "otp" && otp.trim() ? { otp: otp.trim() } : {}),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await finishAuth();
  }

  async function handleLoginPassword(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await loginCustomerWithPassword(phone, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await finishAuth();
  }

  async function handleLoginOtp(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await loginCustomerWithOtp(phone, otp);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await finishAuth();
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const result = await resetCustomerPassword({ phone, otp, password });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setInfo("رمز عبور به‌روز شد. حالا وارد شوید.");
    setMode("login");
    setLoginMethod("password");
    setOtpSent(false);
    setOtp("");
    setPassword("");
  }

  const title =
    mode === "register"
      ? "ساخت حساب"
      : mode === "reset"
        ? "بازیابی رمز"
        : "ورود";

  const lead =
    mode === "register"
      ? "با شماره موبایل و رمز عبور حساب بسازید. تأیید با کد پیامک اختیاری است."
      : mode === "reset"
        ? "با کد تأیید، رمز عبور جدید تنظیم کنید."
        : "با شماره موبایل و رمز عبور (یا کد یک‌بارمصرف) وارد شوید.";

  return (
    <div className="auth-page" dir="rtl">
      <div className="auth-card">
        <h1 className="auth-title">{title}</h1>
        <p className="auth-lead">{lead}</p>
        {redirectAfterAuth !== "/account" && mode !== "reset" && (
          <p className="auth-hint">
            برای ادامه خرید ابتدا وارد شوید یا حساب بسازید.
          </p>
        )}

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("login");
              setError(null);
              setInfo(null);
            }}
          >
            ورود
          </button>
          <button
            type="button"
            className={mode === "register" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("register");
              setError(null);
              setInfo(null);
              setOtpSent(false);
              setRegisterMethod("password");
            }}
          >
            ثبت‌نام
          </button>
          <button
            type="button"
            className={mode === "reset" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("reset");
              setError(null);
              setInfo(null);
              setOtpSent(false);
            }}
          >
            فراموشی رمز
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {info && <p className="auth-info">{info}</p>}
        {debugOtp && <p className="auth-hint">کد stub: {debugOtp}</p>}

        {mode === "register" ? (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-method-tabs">
              <button
                type="button"
                className={
                  registerMethod === "password" ? "auth-chip active" : "auth-chip"
                }
                onClick={() => {
                  setRegisterMethod("password");
                  setError(null);
                }}
              >
                با رمز عبور
              </button>
              <button
                type="button"
                className={
                  registerMethod === "otp" ? "auth-chip active" : "auth-chip"
                }
                onClick={() => {
                  setRegisterMethod("otp");
                  setOtpSent(false);
                  setError(null);
                }}
              >
                با کد تأیید
              </button>
            </div>

            <label className="auth-label">
              شماره موبایل
              <input
                className="auth-input"
                type="tel"
                inputMode="numeric"
                placeholder="09121234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>

            {registerMethod === "otp" && (
              <div className="auth-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy || !phone}
                  onClick={() => handleSendOtp("register")}
                >
                  ارسال کد
                </button>
                <input
                  className="auth-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="کد تأیید"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            )}

            <label className="auth-label">
              نام
              <input
                className="auth-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>
            <label className="auth-label">
              نام خانوادگی
              <input
                className="auth-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
            <label className="auth-label">
              رمز عبور (حداقل ۶ کاراکتر)
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || (registerMethod === "otp" && !otpSent)}
            >
              {busy ? "در حال ثبت…" : "ثبت‌نام و ادامه"}
            </button>
          </form>
        ) : mode === "reset" ? (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <label className="auth-label">
              شماره موبایل
              <input
                className="auth-input"
                type="tel"
                inputMode="numeric"
                placeholder="09121234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
            <div className="auth-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy || !phone}
                onClick={() => handleSendOtp("reset")}
              >
                ارسال کد
              </button>
              <input
                className="auth-input"
                type="text"
                inputMode="numeric"
                placeholder="کد تأیید"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <label className="auth-label">
              رمز عبور جدید (حداقل ۶ کاراکتر)
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "در حال ذخیره…" : "تنظیم رمز جدید"}
            </button>
          </form>
        ) : (
          <>
            <div className="auth-method-tabs">
              <button
                type="button"
                className={
                  loginMethod === "password" ? "auth-chip active" : "auth-chip"
                }
                onClick={() => setLoginMethod("password")}
              >
                رمز عبور
              </button>
              <button
                type="button"
                className={
                  loginMethod === "otp" ? "auth-chip active" : "auth-chip"
                }
                onClick={() => {
                  setLoginMethod("otp");
                  setOtpSent(false);
                }}
              >
                کد یک‌بارمصرف
              </button>
            </div>

            {loginMethod === "password" ? (
              <form className="auth-form" onSubmit={handleLoginPassword}>
                <label className="auth-label">
                  شماره موبایل
                  <input
                    className="auth-input"
                    type="tel"
                    inputMode="numeric"
                    placeholder="09121234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </label>
                <label className="auth-label">
                  رمز عبور
                  <input
                    className="auth-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? "در حال ورود…" : "ورود"}
                </button>
                <button
                  type="button"
                  className="auth-footer-link"
                  onClick={() => {
                    setMode("reset");
                    setOtpSent(false);
                    setError(null);
                  }}
                >
                  فراموشی رمز عبور؟
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleLoginOtp}>
                <label className="auth-label">
                  شماره موبایل
                  <input
                    className="auth-input"
                    type="tel"
                    inputMode="numeric"
                    placeholder="09121234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </label>
                <div className="auth-row">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy || !phone}
                    onClick={() => handleSendOtp("login")}
                  >
                    ارسال کد
                  </button>
                  <input
                    className="auth-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="کد تأیید"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? "در حال ورود…" : "ورود با کد"}
                </button>
              </form>
            )}
          </>
        )}

        <p className="auth-footer">
          <Link to="/">بازگشت به فروشگاه</Link>
        </p>
      </div>
    </div>
  );
}
