import React, { useState, FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';

type Props = {
  onLoggedIn: (user: string) => void;
};

export default function LoginScreen({ onLoggedIn }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.success) {
        setError('Wrong username or password.');
        return;
      }
      onLoggedIn(data.user);
    } catch {
      setError('Could not reach the laboratory server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-slate-800 rounded-xl bg-slate-900 p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">
            IF
          </div>
          <div>
            <p className="font-semibold text-white">InsightFlow AI</p>
            <p className="text-xs text-slate-400">AI Cybersecurity Risk Lab</p>
          </div>
        </div>

        <h1 className="text-lg font-medium text-white flex items-center gap-2 mb-6">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          Sign in
        </h1>

        <form onSubmit={submit} className="space-y-3">
          <label className="block text-xs text-slate-400">
            Username
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </label>
          <label className="block text-xs text-slate-400">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </label>
          {error && (
            <p className="text-xs text-rose-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
