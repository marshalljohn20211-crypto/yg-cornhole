import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { isAdminAuthenticated, isAdminConfigured } from "../../lib/admin-auth";

export const metadata: Metadata = { title: "Admin sign in | YG Cornhole", robots: { index: false, follow: false } };

const messages: Record<string, string> = {
  invalid: "That username or password is not correct.",
  locked: "Too many attempts. Try again in 15 minutes.",
  config: "Admin access has not been configured yet.",
};

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const { error } = await searchParams;
  const configured = isAdminConfigured();

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-mark" aria-hidden="true">YG</div>
        <span>Private access</span>
        <h1 id="admin-login-title">Order desk</h1>
        <p>Sign in to view customer, delivery, payment, and item details.</p>
        <form action="/api/admin/login" method="post">
          <label htmlFor="admin-username">Username</label>
          <div><input id="admin-username" name="username" type="text" autoComplete="username" maxLength={80} required autoFocus /></div>
          <label htmlFor="admin-password">Admin password</label>
          <div><LockKeyhole size={18} /><input id="admin-password" name="password" type="password" autoComplete="current-password" required /></div>
          {error && messages[error] ? <p className="admin-form-error" role="alert">{messages[error]}</p> : null}
          <button type="submit" disabled={!configured}>Sign in</button>
        </form>
        {!configured ? <small>Add DATABASE_URL and ADMIN_SESSION_SECRET to the server environment.</small> : <small>Session expires after 8 hours.</small>}
      </section>
    </main>
  );
}
