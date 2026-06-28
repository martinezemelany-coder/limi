import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useFirebaseAuth } from "../lib/FirebaseAuthContext";
import { db } from "../lib/firebase";

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { currentUser, loading } = useFirebaseAuth();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    async function checkUserProfile() {
      if (!currentUser) {
        setHasProfile(false);
        setCheckingProfile(false);
        return;
      }

      try {
        setCheckingProfile(true);

        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        setHasProfile(snap.exists());
      } catch (error) {
        console.error("Error checking user profile:", error);
        setHasProfile(false);
      } finally {
        setCheckingProfile(false);
      }
    }

    if (!loading) {
      checkUserProfile();
    }
  }, [currentUser, loading]);

  if (loading || checkingProfile) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && !hasProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireOnboarding && hasProfile) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}