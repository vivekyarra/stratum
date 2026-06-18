"use client";

import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

const DEMO_EMAIL = "demo@stratum.app";
const DEMO_PASSWORD = "stratum2026";

type DemoSignInFormProps = {
  callbackUrl: string;
  initialError?: string;
};

export function DemoSignInForm({ callbackUrl, initialError }: DemoSignInFormProps) {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState(initialError ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false
    });

    if (!result?.ok) {
      setError("Invalid credentials. Use the pre-filled STRATUM demo account.");
      setIsSubmitting(false);
      return;
    }

    window.location.assign(result.url ?? callbackUrl);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="mb-2 block text-left text-sm font-medium text-slate-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="focus-ring w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-left text-sm font-medium text-slate-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="focus-ring w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-violet px-5 py-3 font-semibold text-white hover:bg-violet/90 disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
        Demo login
        {!isSubmitting && <ArrowRight className="h-5 w-5" />}
      </button>
    </form>
  );
}
