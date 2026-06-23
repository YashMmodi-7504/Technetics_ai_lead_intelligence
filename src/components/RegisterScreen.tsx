import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Sparkles, Mail, Lock, RefreshCw } from "lucide-react";

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export default function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
  const { register, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password.trim()) {
      setLocalError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    await register(email, password);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      {/* Decorative gradient blur backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            CREATE ACCOUNT
          </h2>
          <p className="text-xs text-[#64748B] font-medium">
            Join the Technetics B2B Intelligence Network
          </p>
        </div>

        {displayError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-4 py-3 rounded-xl font-medium">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-sm shadow-blue-500/10 flex items-center justify-center gap-2 hover:cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="text-center text-xs">
          <span className="text-[#64748B]">Already have an account? </span>
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:underline font-bold"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
