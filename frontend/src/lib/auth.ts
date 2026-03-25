import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";
import { callProtected } from "./api";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ── Forgot password ──────────────────────────────────────────
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}


// ── Email & Password login ──────────────────────────────────────────
export async function loginWithEmail(email: string, password: string): Promise<void> {
  const credential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await credential.user.getIdToken();
  localStorage.setItem("token", token);
  // Verify token with FastAPI backend
  await callProtected();
}

// ── Sign up with email ──────────────────────────────────────────────
export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const token = await credential.user.getIdToken();
  localStorage.setItem("token", token);
}

// ── Google login ────────────────────────────────────────────────────
export async function loginWithGoogle(): Promise<void> {
  const credential: UserCredential = await signInWithPopup(auth, googleProvider);
  const token = await credential.user.getIdToken();
  localStorage.setItem("token", token);
  // Verify token with FastAPI backend
  await callProtected();
}

// ── Logout ──────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await signOut(auth);
  localStorage.removeItem("token");
}

// ── Helper: map Firebase error codes to readable messages ───────────
export function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    case "auth/email-already-in-use":
      return "This email is already registered. Please try logging in.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    default:
      return "Login failed. Please try again.";
  }
}
