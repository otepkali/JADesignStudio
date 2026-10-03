"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArchSceneCanvas } from "@/components/common/ArchSceneCanvas";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("Неверный email или пароль");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <ArchSceneCanvas />

      <main className={`login-main ${inter.className}`}>
        <form onSubmit={handleSubmit} className="login-card">
          <div className="login-logo">
            <span className="login-logo-jn">JANERKE ABAT</span>
            <span className="login-logo-ds">DESIGN</span>
          </div>
          <h1>Войдите, чтобы продолжить</h1>

          <label htmlFor="em">Email</label>
          <input
            id="em"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="pw">Пароль</label>
          <input
            id="pw"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </main>

      <style jsx global>{`
        :root {
          --login-bg1: #f8f3ef;
          --login-bg2: #e9dfd9;
          --login-card: rgba(255, 255, 255, 0.72);
          --login-ink: #1b1517;
          --login-muted: #756a6e;
          --login-line: #e3d9d5;
          --login-wine: #5b1a2c;
          --login-field: #ffffff;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --login-bg1: #2a1a21;
            --login-bg2: #120c0f;
            --login-card: rgba(32, 24, 28, 0.72);
            --login-ink: #f4eeee;
            --login-muted: #b0a4a8;
            --login-line: #43363b;
            --login-wine: #c0587a;
            --login-field: #1a1215;
          }
        }
        :root[data-theme="dark"] {
          --login-bg1: #2a1a21;
          --login-bg2: #120c0f;
          --login-card: rgba(32, 24, 28, 0.72);
          --login-ink: #f4eeee;
          --login-muted: #b0a4a8;
          --login-line: #43363b;
          --login-wine: #c0587a;
          --login-field: #1a1215;
        }
        body {
          background: radial-gradient(ellipse 80% 70% at 36% 42%, var(--login-bg1), var(--login-bg2));
          background-attachment: fixed;
        }
      `}</style>

      <style jsx>{`
        .login-main {
          position: relative;
          min-height: 100vh;
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 24px clamp(20px, 8vw, 120px);
        }
        .login-card {
          width: 100%;
          max-width: 380px;
          background: var(--login-card);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid var(--login-line);
          border-radius: 24px;
          padding: 32px 30px 30px;
        }
        .login-logo {
          text-align: center;
          margin-bottom: 26px;
          color: var(--login-wine);
        }
        .login-logo-jn {
          display: block;
          font-family: "Playfair Display", Georgia, serif;
          font-weight: 400;
          font-size: 27px;
          letter-spacing: 0.07em;
          line-height: 1;
        }
        .login-logo-ds {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 9px;
          font-size: 10px;
          letter-spacing: 0.3em;
          font-weight: 500;
        }
        .login-logo-ds:before,
        .login-logo-ds:after {
          content: "";
          flex: 1;
          height: 1px;
          background: currentColor;
          opacity: 0.6;
        }
        h1 {
          font-family: "Playfair Display", Georgia, serif;
          font-weight: 500;
          font-size: 22px;
          line-height: 1.25;
          margin: 0 0 20px;
          text-align: center;
          color: var(--login-ink);
        }
        label {
          display: block;
          font-size: 13px;
          color: var(--login-muted);
          margin: 0 0 6px;
        }
        input {
          width: 100%;
          height: 46px;
          border: 1px solid var(--login-line);
          background: var(--login-field);
          color: var(--login-ink);
          border-radius: 12px;
          padding: 0 14px;
          font: inherit;
          margin-bottom: 16px;
        }
        input:focus {
          outline: 2px solid var(--login-wine);
          outline-offset: 1px;
          border-color: transparent;
        }
        .login-error {
          margin: -8px 0 16px;
          font-size: 13px;
          color: #c0392b;
        }
        button {
          width: 100%;
          height: 48px;
          border: 0;
          border-radius: 12px;
          background: var(--login-wine);
          color: #fff;
          font: 500 15px Inter, system-ui, sans-serif;
          cursor: pointer;
          margin-top: 4px;
        }
        :global(:root[data-theme="dark"]) button {
          color: #1a0f13;
        }
        @media (prefers-color-scheme: dark) {
          :global(:root:not([data-theme="light"])) button {
            color: #1a0f13;
          }
        }
        button:hover {
          filter: brightness(1.08);
        }
        button:disabled {
          opacity: 0.6;
          cursor: default;
        }
        button:focus-visible {
          outline: 2px solid var(--login-ink);
          outline-offset: 2px;
        }

        @media (max-width: 820px) {
          .login-main {
            align-items: flex-end;
            justify-content: center;
            padding: 20px 16px 24px;
          }
          .login-card {
            max-width: 420px;
            padding: 24px 22px 22px;
          }
          .login-logo {
            margin-bottom: 16px;
          }
          h1 {
            font-size: 19px;
            margin-bottom: 14px;
          }
          input {
            height: 44px;
            margin-bottom: 12px;
          }
        }
      `}</style>
    </>
  );
}
