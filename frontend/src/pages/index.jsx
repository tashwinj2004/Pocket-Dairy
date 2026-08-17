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

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

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
            <input
              name="password"
              type="password"
              required
              minLength="8"
              placeholder="Password"
              onChange={change}
            />

            {error && <p className="error">{error}</p>}

            <button className="primary">
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            className="text-button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
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
