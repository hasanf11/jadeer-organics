"use client";

import { useActionState, useState } from "react";
import { login } from "@/app/login/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, {
    error: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="field">
        <label htmlFor="email">Email address</label>

        <input className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          maxLength={254}
          required
          readOnly={pending}
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>

        <div className="relative">
          <input className="input"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            maxLength={1024}
            required
            readOnly={pending}
          />

          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-sm font-bold text-leaf hover:bg-cream"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-controls="password"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="rounded-xl bg-tomato/10 px-3 py-2 text-sm font-bold text-tomato" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}