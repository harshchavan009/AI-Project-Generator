import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User, Building, LogIn, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiService, UserAccount } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.login(demoEmail, demoPass);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        const res = await ApiService.login(email, password);
        onAuthSuccess(res.user);
      } else {
        const res = await ApiService.register({
          email,
          password,
          name,
          role,
          department
        });
        onAuthSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSso = async () => {
    setLoading(true);
    setError(null);
    const demoGoogleEmail = 'priya.sharma@eng.univ.edu';
    try {
      const res = await ApiService.loginWithGoogle(demoGoogleEmail, 'Priya Sharma');
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google SSO failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-[#fbf9f5] border border-[#d6cfc4] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#ede8df] border-b border-[#d6cfc4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1d6e5c] text-white flex items-center justify-center font-bold text-sm">
              CF
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-base font-bold text-[#1c1917] font-serif-heading">
                {mode === 'login' ? 'Sign In to CapstoneForge' : 'Create an Account'}
              </h2>
              <p className="text-xs text-[#78716c]">Role-Based Access & Scoped Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-[#78716c] hover:text-[#1c1917] hover:bg-[#e2dcd2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Quick Demo Logins Banner */}
          <div className="bg-[#1d6e5c]/5 border border-[#1d6e5c]/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-[#1d6e5c] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Quick 1-Click Role Login:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('priya.sharma@eng.univ.edu', 'Student@Capstone2026')}
                disabled={loading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#1d6e5c]/30 text-[#1d6e5c] text-xs font-semibold hover:bg-[#1d6e5c] hover:text-white transition-all text-center shadow-xs"
              >
                Student (Priya)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('faculty@college.edu', 'Faculty@Capstone2026')}
                disabled={loading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#1d6e5c]/30 text-[#1d6e5c] text-xs font-semibold hover:bg-[#1d6e5c] hover:text-white transition-all text-center shadow-xs"
              >
                Faculty (HOD)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@college.edu', 'Admin@Capstone2026')}
                disabled={loading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#1d6e5c]/30 text-[#1d6e5c] text-xs font-semibold hover:bg-[#1d6e5c] hover:text-white transition-all text-center shadow-xs"
              >
                Admin (Dean)
              </button>
            </div>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleSso}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-[#d6cfc4] bg-white hover:bg-[#f3eee5] text-[#1c1917] text-xs font-semibold transition-all shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with College Email (Google SSO)
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#e2dcd2]"></div>
            <span className="flex-shrink mx-3 text-[11px] font-mono uppercase text-[#a8a29e]">or with email</span>
            <div className="flex-grow border-t border-[#e2dcd2]"></div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#57534e] mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-[#a8a29e]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#d6cfc4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-[#d6cfc4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty Advisor</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-[#d6cfc4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-[#57534e] mb-1">College Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#a8a29e]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@univ.edu"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#d6cfc4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#57534e] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#a8a29e]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#d6cfc4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1d6e5c] text-white font-semibold text-xs hover:bg-[#165849] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-xs text-[#1d6e5c] font-medium hover:underline"
            >
              {mode === 'login'
                ? "Don't have an account? Register as Student or Faculty"
                : 'Already have an account? Sign In'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
