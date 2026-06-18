import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DemoSignInForm } from "@/components/DemoSignInForm";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: {
    callbackUrl?: string;
    error?: string;
  };
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  const callbackUrl =
    searchParams.callbackUrl?.startsWith("/") && !searchParams.callbackUrl.startsWith("//")
      ? searchParams.callbackUrl
      : "/dashboard";
  const initialError = searchParams.error ? "Sign-in failed. Use the STRATUM demo account below." : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-night px-5 py-10 text-slate-50">
      <section className="w-full max-w-md rounded-lg border border-slate-800 bg-panel p-6 shadow-2xl sm:p-8">
        <Link href="/" className="font-display text-xl tracking-wide text-slate-50">
          STRATUM
        </Link>
        <ShieldCheck className="mt-8 h-10 w-10 text-violet-300" />
        <h1 className="mt-5 font-display text-3xl">Sign in to the dashboard</h1>
        <p className="mt-3 leading-7 text-slate-400">
          The judge-ready demo account is pre-filled. Select Demo login to continue.
        </p>
        <DemoSignInForm callbackUrl={callbackUrl} initialError={initialError} />
      </section>
    </main>
  );
}
