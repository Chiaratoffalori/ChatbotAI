"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginPage from "@/components/LoginPage";
import ChatLayout from "@/components/ChatLayout";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // wait for Firebase to check auth state

  useEffect(() => {
    // Firebase tells us if a user is already logged in (e.g. page refresh)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });
    return () => unsubscribe(); // cleanup listener on unmount
  }, []);

  // Show nothing while Firebase is checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#eef2ff" }}>
        <div style={{
          width: "32px", height: "32px",
          border: "3px solid #e2e8f0",
          borderTopColor: "#3a5fc8",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return isLoggedIn ? (
    <ChatLayout />
  ) : (
    <LoginPage onLogin={() => { }} /> // onLogin is now a no-op — Firebase state drives navigation
  );
}
