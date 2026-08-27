import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  googleProvider,
  db,
} from "./firebase";

const FirebaseAuthContext =
  createContext();

export function FirebaseAuthProvider({
  children,
}) {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  /* -------------------------------------------------------
     SIGN UP

     ALL users begin as free.

     Choosing Limi+ NEVER grants Plus here.
     Only a verified purchase will do that later.
  ------------------------------------------------------- */

  const signup = async (
    email,
    password
  ) => {
    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    try {
      const userRef = doc(
        db,
        "users",
        result.user.uid
      );

      await setDoc(
        userRef,
        {
          uid: result.user.uid,

          email:
            result.user.email || "",

          membership: "free",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );
    } catch (err) {
      console.error(
        "Failed to create user doc:",
        err
      );
    }

    localStorage.setItem(
      "isLoggedIn",
      "true"
    );

    return result;
  };

  /* -------------------------------------------------------
     LOGIN
  ------------------------------------------------------- */

  const login = async (
    email,
    password
  ) => {
    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    localStorage.setItem(
      "isLoggedIn",
      "true"
    );

    return result;
  };

  /* -------------------------------------------------------
     GOOGLE
  ------------------------------------------------------- */

  const loginWithGoogle =
    async () => {
      const result =
        await signInWithPopup(
          auth,
          googleProvider
        );

      try {
        const userRef = doc(
          db,
          "users",
          result.user.uid
        );

        const snap =
          await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: result.user.uid,

            email:
              result.user.email || "",

            membership: "free",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          });
        }
      } catch (err) {
        console.error(
          "Failed to ensure user doc for Google user:",
          err
        );
      }

      localStorage.setItem(
        "isLoggedIn",
        "true"
      );

      return result;
    };

  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  const logout = async () => {
    await signOut(auth);

    localStorage.removeItem(
      "isLoggedIn"
    );
  };

  /* -------------------------------------------------------
     PASSWORD RESET
  ------------------------------------------------------- */

  const resetPassword = async (
    email
  ) => {
    return await sendPasswordResetEmail(
      auth,
      email
    );
  };

  /* -------------------------------------------------------
     EMAIL METHODS
  ------------------------------------------------------- */

  const checkEmailMethods =
    async (email) => {
      return await fetchSignInMethodsForEmail(
        auth,
        email
      );
    };

  /* -------------------------------------------------------
     AUTH LISTENER
  ------------------------------------------------------- */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);

          if (user) {
            localStorage.setItem(
              "isLoggedIn",
              "true"
            );
          } else {
            localStorage.removeItem(
              "isLoggedIn"
            );
          }

          setLoading(false);
        }
      );

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
  return useContext(
    FirebaseAuthContext
  );
}