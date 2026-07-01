import { useState } from 'react';
import { User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { signIn } from '../../lib/auth';

interface LoginModalProps {
  onLogin: () => void;
}

export function LoginModal({ onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bgImage = localStorage.getItem('modty_bg_image');

  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      return;
    }
    onLogin();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 overflow-hidden select-none bg-[#09090b]"
      style={bgImage ? { backgroundImage: `url("${bgImage}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div
        className="w-full max-w-[370px] rounded-[32px] p-8 md:p-10 flex flex-col gap-6 relative z-10 transition-premium animate-fade-in"
        style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Header */}
        <div className="space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-extrabold text-lg shadow-inner">
            M
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">ModtyTasks</h1>
            <p className="text-slate-600 text-xs mt-1.5 leading-relaxed font-semibold">
              Intelligence in task syncing & briefing.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Email */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider pl-1">Email Address</span>
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-premium"
              style={{
                background: 'rgba(255, 255, 255, 0.65)',
                border: `1px solid ${error ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 0, 0, 0.08)'}`,
              }}
            >
              <input
                autoFocus
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder="name@company.com"
                className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none"
              />
              <User className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider pl-1">Password</span>
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-premium"
              style={{
                background: 'rgba(255, 255, 255, 0.65)',
                border: `1px solid ${error ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 0, 0, 0.08)'}`,
              }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="text-slate-500 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-rose-600 text-xs text-center font-bold bg-rose-50 border border-rose-200 py-2 rounded-xl -my-1">{error}</p>
        )}

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <div
            onClick={() => setRemember(v => !v)}
            className="w-4.5 h-4.5 rounded-lg flex items-center justify-center shrink-0 transition-premium cursor-pointer border border-slate-300"
            style={{
              background: remember ? '#0f172a' : 'rgba(255, 255, 255, 0.5)',
            }}
          >
            {remember && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-slate-700 text-xs font-bold group-hover:text-slate-900 transition-colors">Remember me</span>
        </label>

        {/* Login button */}
        <button
          onClick={submit}
          disabled={!email.trim() || !password || loading}
          className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-sm tracking-wide transition-premium cursor-pointer disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-black/5"
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-t border-slate-200/50 pt-5 mt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>Restricted to Authorized Team</span>
        </div>
      </div>
    </div>
  );
}
