import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { Capacitor } from "@capacitor/core";

import {
  FirebaseAuthentication,
} from "@capacitor-firebase/authentication";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
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

/* -------------------------------------------------------
   CONTEXT
------------------------------------------------------- */

const FirebaseAuthContext =
  createContext();

/* -------------------------------------------------------
   SAFE LOCAL STORAGE

   Keeps localStorage from ever blocking
   Limi startup inside Capacitor.
------------------------------------------------------- */

function safeSetLoggedIn(
  value
) {
  try {
    if (value) {
      window.localStorage.setItem(
        "isLoggedIn",
        "true"
      );
    } else {
      window.localStorage.removeItem(
        "isLoggedIn"
      );
    }
  } catch (error) {
    console.warn(
      "Local storage unavailable:",
      error
    );
  }
}

/* -------------------------------------------------------
   PROVIDER
------------------------------------------------------- */

export function FirebaseAuthProvider({
  children,
}) {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  /* -------------------------------------------------------
     SIGN UP

     Every Limi account starts free.

     Limi+ is NEVER granted here.
     A real verified subscription will
     change membership later.
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
      const userRef =
        doc(
          db,
          "users",
          result.user.uid
        );

      await setDoc(
        userRef,
        {
          uid:
            result.user.uid,

          email:
            result.user.email ||
            "",

          membership:
            "free",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );
    } catch (error) {
      console.error(
        "Failed to create user doc:",
        error
      );
    }

    safeSetLoggedIn(
      true
    );

    return result;
  };

  /* -------------------------------------------------------
     EMAIL LOGIN
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

    safeSetLoggedIn(
      true
    );

    return result;
  };

  /* -------------------------------------------------------
     GOOGLE LOGIN

     WEB:
     Uses normal Firebase popup.

     CAPACITOR / IOS:
     Uses native Google login first,
     then hands the Google credential
     to Firebase JS Auth.

     This means the SAME currentUser
     system continues powering Limi.
  ------------------------------------------------------- */

  const loginWithGoogle =
    async () => {
      let result;

      /* ---------------------------------------------------
         NATIVE IOS / CAPACITOR
      --------------------------------------------------- */

      if (
        Capacitor.isNativePlatform()
      ) {
        const nativeResult =
          await FirebaseAuthentication.signInWithGoogle({});

        const idToken =
          nativeResult
            .credential
            ?.idToken;

        const accessToken =
          nativeResult
            .credential
            ?.accessToken;

        if (!idToken) {
          throw new Error(
            "Google Sign-In did not return an ID token."
          );
        }

        const credential =
          GoogleAuthProvider.credential(
            idToken,
            accessToken ||
              undefined
          );

        /*
          This signs the native Google
          account into the Firebase JS
          auth instance Limi already uses.
        */

        result =
          await signInWithCredential(
            auth,
            credential
          );
      }

      /* ---------------------------------------------------
         NORMAL WEB / VERCEL
      --------------------------------------------------- */

      else {
        result =
          await signInWithPopup(
            auth,
            googleProvider
          );
      }

      /* ---------------------------------------------------
         ENSURE FIRESTORE USER DOCUMENT

         users/{uid} remains the shared
         Limi profile source of truth.
      --------------------------------------------------- */

      try {
        const userRef =
          doc(
            db,
            "users",
            result.user.uid
          );

        const snap =
          await getDoc(
            userRef
          );

        if (!snap.exists()) {
          await setDoc(
            userRef,
            {
              uid:
                result.user.uid,

              email:
                result.user.email ||
                "",

              membership:
                "free",

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          );
        }
      } catch (error) {
        console.error(
          "Failed to ensure user doc for Google user:",
          error
        );
      }

      safeSetLoggedIn(
        true
      );

      return result;
    };

  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  const logout =
    async () => {
      /*
        Sign out native Google session
        too when running in Capacitor.
      */

      if (
        Capacitor.isNativePlatform()
      ) {
        try {
          await FirebaseAuthentication.signOut();
        } catch (error) {
          console.warn(
            "Native Firebase sign out warning:",
            error
          );
        }
      }

      await signOut(
        auth
      );

      safeSetLoggedIn(
        false
      );
    };

  /* -------------------------------------------------------
     PASSWORD RESET
  ------------------------------------------------------- */

  const resetPassword =
    async (email) => {
      return await sendPasswordResetEmail(
        auth,
        email
      );
    };

  /* -------------------------------------------------------
     CHECK EMAIL METHODS
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

     This is still the main source
     of truth for signed-in state.
  ------------------------------------------------------- */

  useEffect(() => {
    console.log(
      "🔥 Starting Firebase auth listener..."
    );

    const unsubscribe =
      onAuthStateChanged(
        auth,

        (user) => {
          console.log(
            "🔥 Firebase auth resolved:",
            user
              ? user.uid
              : "No user"
          );

          setCurrentUser(
            user || null
          );

          safeSetLoggedIn(
            Boolean(user)
          );

          setLoading(
            false
          );
        },

        (error) => {
          /*
            Never leave Limi permanently
            stuck on its loading screen.
          */

          console.error(
            "🔥 Firebase auth listener failed:",
            error
          );

          setCurrentUser(
            null
          );

          setLoading(
            false
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  /* -------------------------------------------------------
     LOADING SCREEN
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff6fa]">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-[#f4a1bd] via-[#ee79a5] to-[#e25a97]" />

          <p className="mt-4 text-lg font-black text-[#d94b93]">
            Opening Limi...
          </p>

        </div>

      </div>
    );
  }

  /* -------------------------------------------------------
     PROVIDER
  ------------------------------------------------------- */

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
      {children}
    </FirebaseAuthContext.Provider>
  );
}

/* -------------------------------------------------------
   HOOK
------------------------------------------------------- */

export function useFirebaseAuth() {
  return useContext(
    FirebaseAuthContext
  );
}