import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo-sigma.png'; 
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SystemType } from '../types';

export default function AuthPage() {
  const { signIn, signUp, resetPassword, updatePassword, passwordRecovery } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [systemType] = useState<SystemType>('portable');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  function getResetPasswordMessage(message: string) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('security purposes')) {
      return 'Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.';
    }
    if (lowerMessage.includes('redirect')) {
      return 'URL reset belum diizinkan di Supabase. Tambahkan alamat aplikasi ini di Auth Redirect URLs.';
    }
    return message || 'Gagal mengirim tautan reset kata sandi. Silakan coba lagi.';
  }

  function openEmailApp() {
    if (typeof window !== 'undefined') window.location.href = 'mailto:';
  }

  async function handleForgotPassword() {
    setError('');
    setSuccess('');

    if (!validateEmail(resetEmail)) {
      setError('Masukkan email yang valid untuk reset kata sandi.');
      return;
    }

    setLoading(true);
    const { error: err } = await resetPassword(resetEmail.trim());
    if (err) setError(getResetPasswordMessage(err));
    else {
      setSuccess('Tautan reset kata sandi sudah dikirim. Silakan cek email Anda.');
      setShowForgotPassword(false);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordRecovery) {
      if (password.length < 6) {
        setError('Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }

      setLoading(true);
      const { error: err } = await updatePassword(password);
      if (err) setError('Gagal memperbarui kata sandi. Link reset mungkin sudah kedaluwarsa.');
      else {
        setSuccess('Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.');
        setPassword('');
        setConfirmPassword('');
        setMode('login');
      }
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Format email tidak valid.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('Kata sandi tidak cocok.');
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }

    setLoading(true);
    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) setError('Email atau kata sandi salah. Silakan coba lagi.');
    } else {
      const { error: err } = await signUp(email, password, fullName, systemType);
      if (err) {
        if (err.toLowerCase().includes('already registered') || err.toLowerCase().includes('sudah terdaftar')) {
          setError('Akun sudah terdaftar. Silakan buat akun baru dengan email yang berbeda.');
        } else {
          setError('Pendaftaran gagal. Silakan coba lagi.');
        }
      } else {
        setSuccess('Akun berhasil dibuat. Silakan cek email untuk verifikasi sebelum masuk.');
        setShowVerificationPrompt(true);
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent-texture to-[#061D18]" />
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: 'translate(-50%, -50%)',
              opacity: Math.random() * 0.3 + 0.05,
              filter: 'blur(60px)',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="p-10">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-white/5 border-2 border-accent-melrose/30 rounded-3xl flex items-center justify-center mb-5 shadow-2xl shadow-black/20">
                <img src={logo} alt="SIGMA" className="w-10 h-10 object-contain drop-shadow-md" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">SIGMA</h1>
              <p className="text-white/80 text-sm mt-1 text-center">Smart IoT for Growth Monitoring in Agriculture</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 mb-6 shadow-lg shadow-red-500/5"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-red-100 text-[11px] font-black uppercase italic leading-none">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4 mb-6 shadow-lg shadow-primary/5"
                >
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-neutral-surface text-[11px] font-black uppercase italic leading-none">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {showVerificationPrompt && mode === 'login' && (
              <div className="mb-6 rounded-2xl border border-primary/20 bg-white/5 p-4">
                <p className="text-white text-sm font-semibold">Verifikasi email diperlukan</p>
                <p className="text-white/70 text-xs mt-1">Buka email Anda, klik tautan verifikasi, lalu kembali ke halaman ini untuk masuk.</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={openEmailApp}
                    className="flex-1 rounded-lg bg-primary text-white text-xs font-semibold py-2.5 hover:opacity-90 transition-all"
                  >
                    Buka Aplikasi Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVerificationPrompt(false)}
                    className="rounded-lg border border-white/20 text-white/80 text-xs font-semibold px-4 py-2.5 hover:bg-white/10 transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {passwordRecovery && (
                  <>
                    <div className="rounded-xl border border-primary/25 bg-primary/10 p-4">
                      <p className="text-white text-sm font-semibold">Buat Kata Sandi Baru</p>
                      <p className="text-white/70 text-xs mt-1">Masukkan kata sandi baru untuk akun Anda.</p>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-1.5">Kata Sandi Baru</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-accent-melrose/80 focus:bg-white/15 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-1.5">Konfirmasi Kata Sandi Baru</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi baru"
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-accent-melrose/80 focus:bg-white/15 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary hover:opacity-90 disabled:bg-primary/40 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-primary/30 mt-2 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Simpan Kata Sandi'
                      )}
                    </button>
                  </>
                )}

                {!passwordRecovery && (
                  <>
                {mode === 'register' && (
                  <div>
                    <label className="block text-white/70 text-sm mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-white/70 text-sm mb-1.5">Alamat Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-accent-melrose/80 focus:bg-white/15 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1.5">Kata Sandi</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-accent-melrose/80 focus:bg-white/15 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === 'login' && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(!showForgotPassword);
                          setResetEmail(email);
                          setError('');
                          setSuccess('');
                        }}
                        className="text-xs text-white/80 hover:text-primary transition-colors"
                      >
                        Lupa Kata Sandi?
                      </button>
                    </div>
                  )}
                </div>

                {mode === 'login' && showForgotPassword && (
                  <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                    <p className="text-white text-sm font-semibold">Reset Kata Sandi</p>
                    <p className="text-white/70 text-xs mt-1">Masukkan email akun Anda. Kami akan kirim tautan untuk mengganti kata sandi.</p>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleForgotPassword();
                        }
                      }}
                      placeholder="nama@email.com"
                      className="w-full mt-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-accent-melrose/80 focus:bg-white/15 transition-all text-sm"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="flex-1 rounded-xl bg-primary text-white text-sm font-semibold py-2.5 hover:opacity-90 disabled:bg-primary/40 transition-all"
                      >
                        Kirim Tautan Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="rounded-xl border border-white/20 text-white/80 text-sm font-semibold px-4 py-2.5 hover:bg-white/10 transition-all"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <label className="block text-white/70 text-sm mb-1.5">Konfirmasi Kata Sandi</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-accent-melrose/80 focus:bg-white/15 transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:opacity-90 disabled:bg-primary/40 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-primary/30 mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    mode === 'login' ? 'Masuk' : 'Buat Akun'
                  )}
                </button>

                <div className="text-center mt-6">
                  {mode === 'login' ? (
                    <p className="text-white/70 text-sm">
                      Belum mempunyai akun?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('register'); setShowForgotPassword(false); setError(''); setSuccess(''); }}
                        className="text-primary hover:underline font-semibold"
                      >
                        Daftar Sekarang
                      </button>
                    </p>
                  ) : (
                    <p className="text-white/70 text-sm">
                      Sudah punya akun?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setShowForgotPassword(false); setError(''); setSuccess(''); }}
                        className="text-primary hover:underline font-semibold"
                      >
                        Masuk
                      </button>
                    </p>
                  )}
                </div>
                  </>
                )}
              </motion.form>
            </AnimatePresence>
          </div>

          <div className="px-8 pb-6 text-center">
            <p className="text-white/40 text-xs">© 2026 — SIGMA PLATFORM</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
