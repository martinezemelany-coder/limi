import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useFirebaseAuth } from "../lib/FirebaseAuthContext";
import { db } from "../lib/firebase";

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { currentUser, loading } = useFirebaseAuth();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [completedOnboarding, setCompletedOnboarding] = useState(false);

  useEffect(() => {
    async function checkUserProfile() {
      if (!currentUser) {
        setCompletedOnboarding(false);
        setCheckingProfile(false);
        return;
      }

      try {
        setCheckingProfile(true);

        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setCompletedOnboarding(snap.data().completedOnboarding === true);
        } else {
          setCompletedOnboarding(false);
        }
      } catch (error) {
        console.error("Error checking user profile:", error);
        setCompletedOnboarding(false);
      } finally {
        setCheckingProfile(false);
      }
    }

    if (!loading) {
      checkUserProfile();
    }
  }, [currentUser, loading]);

  if (loading || checkingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff6fa]">
        <p className="text-xl font-black text-[#ec64a8]">Loading Limi 💕</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && !completedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireOnboarding && completedOnboarding) {
    return <Navigate to="/" replace />;
  }

  return children;
}