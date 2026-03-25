"use client";

import { useState } from "react";
import { loginWithEmail, loginWithGoogle, signUpWithEmail, resetPassword, getFirebaseErrorMessage } from "@/lib/auth";

interface LoginPageProps {
    onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);

    const switchMode = (next: "login" | "signup") => {
        setMode(next);
        setError(null);
        setPassword("");
        setConfirmPassword("");
    };

    const handleSubmit = async () => {
        setError(null);

        if (!email || !password) { setError("Please enter email and password."); return; }

        if (mode === "signup") {
            if (password !== confirmPassword) { setError("The passwords do not match."); return; }
            if (password.length < 6) { setError("The password must be at least 6 characters long."); return; }
        }

        setLoading(true);
        try {
            if (mode === "login") {
                await loginWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
            }
            // Firebase onAuthStateChanged in page.tsx handles redirect
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setGoogleLoading(true);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err.code));
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setError(null);
        setResetSent(false);
        setLoading(true);
        try {
            await resetPassword(resetEmail);
            setResetSent(true);
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden">
            <style>{`
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          0%   { opacity: 0; transform: translateX(-40px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .slide-in-left { opacity: 0; animation: slideInLeft 0.8s cubic-bezier(0.22,1,0.36,1) forwards; }
        .float-up      { opacity: 0; animation: floatUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        .floating-text { animation: gentleFloat 4s ease-in-out infinite; }
        .fade-in       { animation: fadeIn 0.25s ease forwards; }

        .btn-primary { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(26,26,26,0.25); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }

        .btn-google { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .btn-google:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.10); }

        .input-field { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .input-field:focus { border-color: #3a5fc8 !important; box-shadow: 0 0 0 3px rgba(58,95,200,0.13); }

        .spinner       { width:15px;height:15px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block; }
        .spinner-dark  { width:15px;height:15px;border:2px solid rgba(0,0,0,0.15);border-top-color:#333;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block; }

        .blue-panel { background:#3a5fc8;position:relative;overflow:hidden; }
        .blue-panel::before { content:'';position:absolute;top:-50%;left:-20%;width:70%;height:70%;background:radial-gradient(circle,rgba(255,255,255,0.10) 0%,transparent 70%);animation:gentleFloat 6s ease-in-out infinite;pointer-events:none; }
        .blue-panel::after  { content:'';position:absolute;bottom:-40%;right:-20%;width:65%;height:65%;background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 70%);animation:gentleFloat 5s ease-in-out infinite reverse;pointer-events:none; }

        .mode-tab { transition: all 0.2s ease; }
      `}</style>

            {/* ── Left Panel ── */}
            <div className="hidden lg:flex flex-col items-center justify-center w-1/2" style={{ background: "#eef2ff" }}>
                <div className="blue-panel slide-in-left flex flex-col items-center justify-center text-center px-12 py-24 w-full h-full">
                    <div className="relative z-10 floating-text">
                        <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>
                            FIND YOUR PATH
                        </h1>
                        <p className="text-white text-sm leading-relaxed" style={{ opacity: 0.88, maxWidth: "400px", margin: "0 auto", fontSize: "18px" }}>
                            Welcome! I&apos;m your personal assistant to help you find a job, improve your skills, and grow your career.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="flex-1 flex items-center justify-center p-8" style={{ background: "white" }}>
                <div className="w-full max-w-sm">
                    {mode === "forgot" ? (
                        <div className="fade-in space-y-4">
                            <h2 className="text-2xl font-bold text-center" style={{ fontFamily: "Syne, sans-serif", color: "#0f172a" }}>
                                Forgot password
                            </h2>
                            <p className="text-center text-sm text-gray-600 mt-2">
                                Enter your email address and we will send you a link to reset your password.
                            </p>
                            <div>
                                <label className="block text-sm mb-1" style={{ color: "#64748b", fontSize: "18px" }}>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className="input-field w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }}
                                />
                            </div>
                            {resetSent && (
                                <p className="text-sm text-green-600">Email sent! Check your inbox.</p>
                            )}
                            {error && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                                    {error}
                                </div>
                            )}
                            <button
                                onClick={handleResetPassword}
                                disabled={loading}
                                className="btn-primary w-full py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                                style={{ background: "#1a1a1a", color: "white" }}
                            >
                                {loading && <span className="spinner" />}
                                {loading ? "Sending..." : "Send reset link"}
                            </button>
                            <a onClick={() => setMode("login")} className="text-xs text-center block cursor-pointer hover:underline" style={{ color: "#1E1E1E" }}>
                                Back to login
                            </a>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: "Syne, sans-serif", color: "#0f172a" }}>
                                {mode === "login" ? "Welcome Back" : "Get Started"}
                            </h2>

                            {/* Toggle tabs */}
                            <div className="float-up flex rounded-xl p-1 mb-6" style={{ background: "#f1f5f9", animationDelay: "100ms" }}>
                                <button
                                    onClick={() => switchMode("login")}
                                    className="mode-tab flex-1 py-2 text-sm font-semibold rounded-lg"
                                    style={{
                                        background: mode === "login" ? "white" : "transparent",
                                        color: mode === "login" ? "#1a1a1a" : "#94a3b8",
                                        boxShadow: mode === "login" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                                    }}
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => switchMode("signup")}
                                    className="mode-tab flex-1 py-2 text-sm font-semibold rounded-lg"
                                    style={{
                                        background: mode === "signup" ? "white" : "transparent",
                                        color: mode === "signup" ? "#1a1a1a" : "#94a3b8",
                                        boxShadow: mode === "signup" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                                    }}
                                >
                                    Sign Up
                                </button>
                            </div>

                            <div className="fade-in space-y-4" key={mode}>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm mb-1" style={{ color: "#64748b" }}>Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                        placeholder="you@example.com"
                                        className="input-field w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }}
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm mb-1" style={{ color: "#64748b" }}>Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                        placeholder="••••••••"
                                        className="input-field w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }}
                                    />
                                </div>

                                {/* Confirm Password — only in signup mode */}
                                {mode === "signup" && (
                                    <div>
                                        <label className="block text-sm mb-1" style={{ color: "#64748b" }}>Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                            placeholder="••••••••"
                                            className="input-field w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                                            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }}
                                        />
                                    </div>
                                )}

                                {/* Error banner */}
                                {error && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="flex-shrink-0">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                {/* Main button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || googleLoading}
                                    className="btn-primary w-full py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                                    style={{ background: "#1a1a1a", color: "white", opacity: loading ? 0.75 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                                >
                                    {loading && <span className="spinner" />}
                                    {loading ? "Caricamento..." : mode === "login" ? "Sign In" : "Sign Up"}
                                </button>

                                {/* Divider */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
                                    <span className="text-xs" style={{ color: "#94a3b8" }}>or</span>
                                    <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
                                </div>

                                {/* Google */}
                                <button
                                    onClick={handleGoogleSignIn}
                                    disabled={loading || googleLoading}
                                    className="btn-google w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm"
                                    style={{ border: "1px solid #e2e8f0", background: "white", color: "#0f172a", opacity: googleLoading ? 0.75 : 1, cursor: googleLoading ? "not-allowed" : "pointer" }}
                                >
                                    {googleLoading ? <span className="spinner-dark" /> : (
                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    )}
                                    {googleLoading ? "Loading..." : "Continue with Google"}
                                </button>
                                <a onClick={() => setMode("forgot")} className="text-xs block cursor-pointer hover:underline" style={{ color: "#1E1E1E" }}>
                                    Forgot Password?
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
