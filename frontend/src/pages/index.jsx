import { useRouter } from "next/router";
import { useState } from "react";

import { api, saveSession } from "../lib/api";

const EMPTY_FORM = {
  email: "",
  password: "",
  full_name: "",
  employee_id: "",
  role: "employee",
};

// Password strength rules
const RULES = [
  { id: "min",     label: "At least 8 characters",    test: (p) => p.length >= 8 },
  { id: "upper",   label: "One uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "lower",   label: "One lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { id: "number",  label: "One number (0–9)",           test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "One special character (!@#…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordInput({ name, placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-wrapper">
      <input
        name={name}
        type={show ? "text" : "password"}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={name === "password" ? "current-password" : "new-password"}
      />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

function StrengthRules({ password }) {
  if (!password) return null;
  return (
    <ul className="strength-rules">
      {RULES.map((r) => (
        <li key={r.id} className={`strength-rule${r.test(password) ? " pass" : ""}`}>
          <span className="rule-icon">{r.test(password) ? "✓" : "✗"}</span>
          {r.label}
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function passwordStrong(pw) {
    return RULES.every((r) => r.test(pw));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    // Enforce strength on register
    if (mode === "register" && !passwordStrong(form.password)) {
      setError("Password does not meet the requirements below.");
      return;
    }

    try {
      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : form;

      const data = await api(
        mode === "login" ? "/auth/login" : "/auth/register",
        { method: "POST", body: JSON.stringify(body) }
      );

      saveSession(data);
      router.push(
        data.user.role === "leader" ? "/leader/dashboard" : "/employee/dashboard"
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        {/* Left brand panel */}
        <div className="auth-brand">
          <div className="logo">P</div>
          <p>POCKET DAIRY</p>
          <span>Make every day count.</span>
        </div>

        {/* Right form panel */}
        <div className="auth-form">
          <span className="eyebrow">WELCOME</span>
          <h1>
            {mode === "login" ? "Sign in to your diary" : "Create your workspace"}
          </h1>

          <form onSubmit={submit}>
            {mode === "register" && (
              <>
                <input
                  name="full_name"
                  required
                  placeholder="Full name"
                  onChange={change}
                />
                <input
                  name="employee_id"
                  required
                  placeholder="Employee ID"
                  onChange={change}
                />
                <select name="role" onChange={change}>
                  <option value="employee">Employee account</option>
                  <option value="leader">Leader account</option>
                </select>
              </>
            )}

            <input
              name="email"
              type="email"
              required
              placeholder="Work email"
              onChange={change}
            />

            <PasswordInput
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={change}
            />

            {/* Show strength rules only on register */}
            {mode === "register" && <StrengthRules password={form.password} />}

            {error && <p className="error">{error}</p>}

            <button className="primary">
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            className="text-button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setForm(EMPTY_FORM);
            }}
          >
            {mode === "login"
              ? "Need an account? Create one"
              : "Already registered? Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}
