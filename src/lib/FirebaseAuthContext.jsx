import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const FirebaseAuthContext = createContext();

export function FirebaseAuthProvider({ children }) {
  
  const [currentUser, setCurrentUser] = useState(null);
  
  const [loading, setLoading] = useState(true);

  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    localStorage.setItem("isLoggedIn", "true");
    return result;
  };

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem("isLoggedIn", "true");
    return result;
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    localStorage.setItem("isLoggedIn", "true");
    return result;
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("isLoggedIn");
  };

  const resetPassword = async (email) => {
    return await sendPasswordResetEmail(auth, email);
  };

  const checkEmailMethods = async (email) => {
  return await fetchSignInMethodsForEmail(auth, email);
   }; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        localStorage.setItem("isLoggedIn", "true");
      } else {
        localStorage.removeItem("isLoggedIn");
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <FirebaseAuthContext.Provider
      value={{
        currentUser,
        loading,
        signup,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
        checkEmailMethods, 
      }}
    >
      {!loading && children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext);
}