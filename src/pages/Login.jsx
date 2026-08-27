import { getFriendlyFirebaseErrorMessage } from "../lib/firebaseError";

import React, { useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getAdditionalUserInfo,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  Eye,
  EyeOff,
  Heart,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

import {
  useFirebaseAuth,
} from "../lib/FirebaseAuthContext";

import {
  db,
} from "../lib/firebase";

/* -------------------------------------------------------
   LOGIN / SIGNUP
------------------------------------------------------- */

export default function Login() {
  const {
    login,
    signup,
    loginWithGoogle,
    resetPassword,
    checkEmailMethods,
  } = useFirebaseAuth();

  const navigate =
    useNavigate();

  /* -------------------------------------------------------
     SCREEN STATE

     email      = enter email
     login      = existing email/password account
     signup     = create password
     plan       = choose Limi Free or Limi+
     google     = existing Google account
     existing   = email already exists
  ------------------------------------------------------- */

  const [
    emailOpen,
    setEmailOpen,
  ] = useState(false);

  const [
    mode,
    setMode,
  ] = useState("email");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    legalAccepted,
    setLegalAccepted,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  /* -------------------------------------------------------
     ERROR HELPER
  ------------------------------------------------------- */

  const prettyError = (
    err
  ) => {
    const friendlyMessage =
      getFriendlyFirebaseErrorMessage?.(
        err
      );

    if (friendlyMessage) {
      return friendlyMessage;
    }

    if (
      err?.code ===
      "auth/email-already-in-use"
    ) {
      return "This email already has a Limi account.";
    }

    if (
      err?.code ===
      "auth/invalid-credential"
    ) {
      return "That email or password is wrong.";
    }

    if (
      err?.code ===
      "auth/weak-password"
    ) {
      return "Password should be at least 6 characters.";
    }

    if (
      err?.code ===
      "auth/invalid-email"
    ) {
      return "Please enter a valid email.";
    }

    return (
      err?.message ||
      "Something went wrong."
    );
  };

  /* -------------------------------------------------------
     LEGAL CONSENT

     Saved only for brand-new accounts.

     These fields stay in:
     users/{uid}

     Settings later only gives access
     to the documents again.
  ------------------------------------------------------- */

  const saveLegalConsent =
    async (uid) => {
      if (!uid) return;

      await setDoc(
        doc(
          db,
          "users",
          uid
        ),
        {
          termsAccepted:
            true,

          termsAcceptedAt:
            serverTimestamp(),

          communityGuidelinesAccepted:
            true,

          communityGuidelinesAcceptedAt:
            serverTimestamp(),

          privacyPolicyAcknowledged:
            true,

          privacyPolicyAcknowledgedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );
    };

  /* -------------------------------------------------------
     LEGAL LINKS
  ------------------------------------------------------- */

  const openTerms = () => {
    navigate(
      "/terms"
    );
  };

  const openPrivacy = () => {
    navigate(
      "/privacy"
    );
  };

  const openGuidelines = () => {
    navigate(
      "/community-guidelines"
    );
  };

  /* -------------------------------------------------------
     GOOGLE
  ------------------------------------------------------- */

  const handleGoogle =
    async () => {
      try {
        setLoading(true);

        setError("");

        setSuccess("");

        const result =
          await loginWithGoogle();

        /*
          Firebase tells us whether
          this is a brand-new Google
          account.
        */

        const additionalInfo =
          getAdditionalUserInfo(
            result
          );

        const isNewUser =
          additionalInfo
            ?.isNewUser ===
          true;

        if (isNewUser) {
          /*
            The legal notice is displayed
            underneath the Google button
            before the user clicks it.

            Clicking Continue with Google
            therefore acts as the consent
            action for a new Google signup.
          */

          await saveLegalConsent(
            result.user.uid
          );

          /*
            Brand-new Google user now
            chooses Free or Limi+.
          */

          setMode(
            "plan"
          );

          setEmailOpen(
            true
          );

          return;
        }

        /*
          Existing users simply log in.

          ProtectedRoute decides whether
          onboarding is complete.
        */

        navigate(
          "/",
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(
          "Google login error:",
          err
        );

        setError(
          prettyError(
            err
          )
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* -------------------------------------------------------
     EMAIL CONTINUE
  ------------------------------------------------------- */

  const handleEmailContinue =
    async (
      event
    ) => {
      event.preventDefault();

      setError("");

      setSuccess("");

      const cleanEmail =
        email.trim();

      if (!cleanEmail) {
        setError(
          "Enter your email first."
        );

        return;
      }

      try {
        setLoading(
          true
        );

        const methods =
          checkEmailMethods
            ? await checkEmailMethods(
                cleanEmail
              )
            : [];

        if (
          methods.includes(
            "password"
          )
        ) {
          setMode(
            "login"
          );

          return;
        }

        if (
          methods.includes(
            "google.com"
          )
        ) {
          setMode(
            "google"
          );

          return;
        }

        /*
          No existing sign-in
          method = new account.
        */

        setLegalAccepted(
          false
        );

        setMode(
          "signup"
        );
      } catch (err) {
        console.error(
          "Email lookup error:",
          err
        );

        /*
          If lookup fails,
          continue to signup rather
          than crashing the page.
        */

        setLegalAccepted(
          false
        );

        setMode(
          "signup"
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* -------------------------------------------------------
     PASSWORD LOGIN / SIGNUP
  ------------------------------------------------------- */

  const handlePasswordSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      setError("");

      setSuccess("");

      const cleanEmail =
        email.trim();

      const cleanPassword =
        password.trim();

      if (!cleanPassword) {
        setError(
          "Enter your password."
        );

        return;
      }

      /* ---------------------------------------------------
         LEGAL CHECK

         Only required when creating
         a brand-new email account.
      --------------------------------------------------- */

      if (
        mode ===
          "signup" &&
        !legalAccepted
      ) {
        setError(
          "Please agree to Limi’s Terms of Service and Community Guidelines and acknowledge the Privacy Policy first."
        );

        return;
      }

      try {
        setLoading(
          true
        );

        /* ---------------------------------------------------
           NEW ACCOUNT
        --------------------------------------------------- */

        if (
          mode ===
          "signup"
        ) {
          /*
            FirebaseAuthContext should
            create the user with:

            membership: "free"

            We never pass Plus here.
          */

          const result =
            await signup(
              cleanEmail,
              cleanPassword
            );

          /*
            Store legal consent in the
            same users/{uid} document.
          */

          await saveLegalConsent(
            result.user.uid
          );

          /*
            Do NOT go straight to
            onboarding.

            Show Free vs Limi+ first.
          */

          setPassword(
            ""
          );

          setMode(
            "plan"
          );

          return;
        }

        /* ---------------------------------------------------
           EXISTING ACCOUNT
        --------------------------------------------------- */

        await login(
          cleanEmail,
          cleanPassword
        );

        navigate(
          "/",
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(
          "Password auth error:",
          err
        );

        if (
          err?.code ===
          "auth/email-already-in-use"
        ) {
          setMode(
            "existing"
          );

          setPassword(
            ""
          );

          setError(
            ""
          );

          return;
        }

        setError(
          prettyError(
            err
          )
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* -------------------------------------------------------
     FREE PLAN
  ------------------------------------------------------- */

  const continueWithFree =
    () => {
      /*
        Account already has:

        membership: "free"

        Now build the profile.
      */

      navigate(
        "/onboarding",
        {
          replace: true,
        }
      );
    };

  /* -------------------------------------------------------
     LIMI+
  ------------------------------------------------------- */

  const continueWithPlus =
    () => {
      /*
        IMPORTANT:

        This does NOT set:

        membership: "plus"

        The real purchase must be
        successfully verified first.
      */

      navigate(
        "/limi-plus",
        {
          replace: true,

          state: {
            fromSignup:
              true,
          },
        }
      );
    };

  /* -------------------------------------------------------
     FORGOT PASSWORD
  ------------------------------------------------------- */

  const handleForgotPassword =
    async () => {
      const cleanEmail =
        email.trim();

      if (!cleanEmail) {
        setError(
          "Enter your email first."
        );

        return;
      }

      try {
        setLoading(
          true
        );

        setError("");

        setSuccess("");

        await resetPassword(
          cleanEmail
        );

        setSuccess(
          "Password reset email sent 💕 Check your inbox."
        );
      } catch (err) {
        console.error(
          "Password reset error:",
          err
        );

        setError(
          prettyError(
            err
          )
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* -------------------------------------------------------
     RESET EMAIL FLOW
  ------------------------------------------------------- */

  const resetEmailFlow =
    () => {
      setMode(
        "email"
      );

      setPassword(
        ""
      );

      setShowPassword(
        false
      );

      setLegalAccepted(
        false
      );

      setError("");

      setSuccess("");
    };

  /* -------------------------------------------------------
     RETURN TO WELCOME
  ------------------------------------------------------- */

  const returnToWelcome =
    () => {
      setEmailOpen(
        false
      );

      setMode(
        "email"
      );

      setEmail(
        ""
      );

      setPassword(
        ""
      );

      setShowPassword(
        false
      );

      setLegalAccepted(
        false
      );

      setError("");

      setSuccess("");
    };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdeef4] via-[#f8dce6] to-[#f4b7c8] px-4 py-8">

      <div className="w-full max-w-md rounded-[38px] border border-white/70 bg-white/95 p-8 shadow-[0_18px_45px_rgba(231,91,150,0.18)]">

        {/* ------------------------------------------------
            LIMI LOGO
        ------------------------------------------------ */}

        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-[#f5a2bc] via-[#ef87ad] to-[#f78e9b] text-5xl font-black text-white shadow-[0_12px_28px_rgba(231,91,150,0.25)]">
          L
        </div>

        <h1
          className="text-center text-[48px] leading-none tracking-[-0.06em] text-[#ec64a8]"
          style={{
            fontWeight:
              1000,
          }}
        >
          Limi
        </h1>

        <p className="mt-3 text-center text-lg font-black text-[#80636f]">
          Meet your people 💕
        </p>

        {/* ------------------------------------------------
            ERROR
        ------------------------------------------------ */}

        {error && (
          <p className="mt-5 rounded-2xl bg-red-100 p-3 text-center text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        {/* ------------------------------------------------
            SUCCESS
        ------------------------------------------------ */}

        {success && (
          <p className="mt-5 rounded-2xl bg-green-100 p-3 text-center text-sm font-bold text-green-700">
            {success}
          </p>
        )}

        {/* ------------------------------------------------
            FIRST SCREEN
        ------------------------------------------------ */}

        {!emailOpen ? (
          <div className="mt-8 space-y-4">

            {/* GOOGLE */}

            <button
              type="button"
              onClick={
                handleGoogle
              }
              disabled={
                loading
              }
              className="w-full rounded-full border border-[#f0d8e2] bg-white py-4 text-base font-black text-[#263142] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : "Continue with Google"}
            </button>

            {/* EMAIL */}

            <button
              type="button"
              onClick={() =>
                setEmailOpen(
                  true
                )
              }
              disabled={
                loading
              }
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-base font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_13px_28px_rgba(231,91,150,0.28)] active:scale-[0.98] disabled:opacity-60"
            >
              <Mail
                size={19}
              />

              Continue with Email
            </button>

            {/* ------------------------------------------------
                LEGAL NOTICE

                This is especially important
                for Google signup because
                Google may create the Firebase
                account immediately.
            ------------------------------------------------ */}

            <p className="px-2 pt-2 text-center text-[11px] font-semibold leading-5 text-[#9a7b87]">

              By continuing, you agree to
              Limi’s{" "}

              <button
                type="button"
                onClick={
                  openTerms
                }
                className="font-black text-[#d94b93] underline underline-offset-2"
              >
                Terms of Service
              </button>

              {" "}and{" "}

              <button
                type="button"
                onClick={
                  openGuidelines
                }
                className="font-black text-[#d94b93] underline underline-offset-2"
              >
                Community Guidelines
              </button>

              . Learn how we process your
              data in our{" "}

              <button
                type="button"
                onClick={
                  openPrivacy
                }
                className="font-black text-[#d94b93] underline underline-offset-2"
              >
                Privacy Policy
              </button>

              .

            </p>

          </div>
        ) : (
          <div className="mt-8">

            {/* ------------------------------------------------
                NORMAL BACK BUTTON

                Plan screen has no Back
                because an account already
                exists.
            ------------------------------------------------ */}

            {mode !==
              "plan" && (
              <button
                type="button"
                onClick={
                  returnToWelcome
                }
                className="mb-5 flex items-center gap-2 text-sm font-black text-[#d94b93]"
              >
                <ArrowLeft
                  size={
                    17
                  }
                />

                Back
              </button>
            )}

            {/* ------------------------------------------------
                EMAIL SCREEN
            ------------------------------------------------ */}

            {mode ===
              "email" && (
              <form
                onSubmit={
                  handleEmailContinue
                }
                className="space-y-4"
              >

                <label className="mb-2 block text-sm font-black text-[#80636f]">
                  What’s your email?
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={
                    email
                  }
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event
                        .target
                        .value
                    )
                  }
                  className="w-full rounded-2xl border border-[#f0d8e2] bg-white px-4 py-4 font-semibold text-[#2b1d28] outline-none transition focus:border-[#ef87ad] focus:ring-2 focus:ring-[#ef87ad]/10"
                />

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-base font-black text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  {loading
                    ? "Checking..."
                    : "Continue"}
                </button>

              </form>
            )}

            {/* ------------------------------------------------
                GOOGLE / EXISTING ACCOUNT
            ------------------------------------------------ */}

            {(mode ===
              "google" ||
              mode ===
                "existing") && (
              <div className="space-y-4">

                <div className="rounded-[26px] bg-[#fff6fa] p-5 text-center">

                  <Sparkles
                    className="mx-auto mb-3 text-[#ec64a8]"
                    size={30}
                  />

                  <h2 className="text-xl font-black text-[#2b1d28]">
                    This email already has
                    a Limi account.
                  </h2>

                  <p className="mt-2 text-sm font-semibold text-[#80636f]">
                    Continue with Google,
                    or sign in with your
                    password 💕
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    handleGoogle
                  }
                  disabled={
                    loading
                  }
                  className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-base font-black text-white disabled:opacity-60"
                >
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode(
                      "login"
                    );

                    setError(
                      ""
                    );

                    setPassword(
                      ""
                    );
                  }}
                  className="w-full rounded-full border border-[#f1d8e3] bg-white py-4 text-sm font-black text-[#d94b93]"
                >
                  Sign in with password
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail(
                      ""
                    );

                    resetEmailFlow();
                  }}
                  className="w-full rounded-full bg-white py-4 text-sm font-black text-[#d94b93]"
                >
                  Use a different email
                </button>

              </div>
            )}

            {/* ------------------------------------------------
                LOGIN OR CREATE PASSWORD
            ------------------------------------------------ */}

            {(mode ===
              "login" ||
              mode ===
                "signup") && (
              <form
                onSubmit={
                  handlePasswordSubmit
                }
                className="space-y-4"
              >

                <div className="rounded-[22px] bg-[#fff6fa] p-4">

                  <p className="text-xs font-black uppercase tracking-wide text-[#d94b93]">
                    {mode ===
                    "signup"
                      ? "Create account"
                      : "Welcome back"}
                  </p>

                  <p className="mt-1 break-all text-sm font-bold text-[#80636f]">
                    {email}
                  </p>

                </div>

                <label className="mb-2 block text-sm font-black text-[#80636f]">
                  {mode ===
                  "signup"
                    ? "Create password"
                    : "Password"}
                </label>

                <div className="relative">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder={
                      mode ===
                      "signup"
                        ? "Create a password"
                        : "Enter your password"
                    }
                    value={
                      password
                    }
                    onChange={(
                      event
                    ) =>
                      setPassword(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full rounded-2xl border border-[#f0d8e2] bg-white px-4 py-4 pr-12 font-semibold text-[#2b1d28] outline-none transition focus:border-[#ef87ad] focus:ring-2 focus:ring-[#ef87ad]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#d94b93]"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={
                          20
                        }
                      />
                    ) : (
                      <Eye
                        size={
                          20
                        }
                      />
                    )}
                  </button>

                </div>

                {/* ------------------------------------------------
                    SIGNUP LEGAL AGREEMENT
                ------------------------------------------------ */}

                {mode ===
                  "signup" && (
                  <div className="rounded-[22px] border border-[#f3dbe4] bg-[#fff8fb] p-4">

                    <label className="flex cursor-pointer items-start gap-3">

                      <input
                        type="checkbox"
                        checked={
                          legalAccepted
                        }
                        onChange={(
                          event
                        ) =>
                          setLegalAccepted(
                            event
                              .target
                              .checked
                          )
                        }
                        className="mt-1 h-4 w-4 shrink-0 accent-[#ec64a8]"
                      />

                      <span className="text-xs font-semibold leading-5 text-[#80636f]">

                        I agree to Limi’s{" "}

                        <button
                          type="button"
                          onClick={
                            openTerms
                          }
                          className="font-black text-[#d94b93] underline underline-offset-2"
                        >
                          Terms of Service
                        </button>

                        {" "}and{" "}

                        <button
                          type="button"
                          onClick={
                            openGuidelines
                          }
                          className="font-black text-[#d94b93] underline underline-offset-2"
                        >
                          Community Guidelines
                        </button>

                        . I understand how
                        my data is handled
                        in the{" "}

                        <button
                          type="button"
                          onClick={
                            openPrivacy
                          }
                          className="font-black text-[#d94b93] underline underline-offset-2"
                        >
                          Privacy Policy
                        </button>

                        .

                      </span>

                    </label>

                  </div>
                )}

                {/* FORGOT PASSWORD */}

                {mode ===
                  "login" && (
                  <button
                    type="button"
                    onClick={
                      handleForgotPassword
                    }
                    disabled={
                      loading
                    }
                    className="text-sm font-black text-[#d94b93] disabled:opacity-60"
                  >
                    Forgot password?
                  </button>
                )}

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    (mode ===
                      "signup" &&
                      !legalAccepted)
                  }
                  className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-base font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.20)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Please wait..."
                    : mode ===
                      "signup"
                    ? "Create Limi Account"
                    : "Sign In"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail(
                      ""
                    );

                    resetEmailFlow();
                  }}
                  className="w-full rounded-full bg-white py-4 text-sm font-black text-[#d94b93]"
                >
                  Use a different email
                </button>

              </form>
            )}

            {/* ------------------------------------------------
                PLAN SCREEN

                Appears automatically
                after account creation.
            ------------------------------------------------ */}

            {mode ===
              "plan" && (
              <div>

                {/* HEADER */}

                <div className="text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#fff0f7] text-[#d94b93]">

                    <Sparkles
                      size={
                        27
                      }
                    />

                  </div>

                  <h2
                    className="mt-4 text-[28px] leading-tight tracking-[-0.04em] text-[#2b1d28]"
                    style={{
                      fontWeight:
                        1000,
                    }}
                  >
                    You're in 💕
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-5 text-[#80636f]">
                    Choose how you want
                    to start Limi.
                  </p>

                </div>

                {/* ------------------------------------------------
                    FREE CARD
                ------------------------------------------------ */}

                <div className="mt-6 rounded-[28px] border border-[#f0d8e2] bg-white p-5 shadow-[0_10px_28px_rgba(74,45,59,0.06)]">

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <p className="text-xl font-black text-[#2b1d28]">
                        Limi Free
                      </p>

                      <p className="mt-1 text-lg font-black text-[#d94b93]">
                        $0
                      </p>

                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0f7] text-[#d94b93]">

                      <Heart
                        size={
                          18
                        }
                      />

                    </div>

                  </div>

                  <div className="mt-4 space-y-2.5">

                    <PlanFeature>
                      Discover local friends
                    </PlanFeature>

                    <PlanFeature>
                      Match & message
                    </PlanFeature>

                    <PlanFeature>
                      Join hangouts
                    </PlanFeature>

                    <PlanFeature>
                      Feed & reels
                    </PlanFeature>

                  </div>

                  <button
                    type="button"
                    onClick={
                      continueWithFree
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-[#f0d8e2] bg-[#fff8fc] py-3.5 text-sm font-black text-[#d94b93] transition active:scale-[0.98]"
                  >
                    Continue Free

                    <ArrowRight
                      size={
                        17
                      }
                    />
                  </button>

                </div>

                {/* ------------------------------------------------
                    LIMI+ CARD
                ------------------------------------------------ */}

                <div className="relative mt-4 overflow-hidden rounded-[30px] border border-[#ef87ad] bg-gradient-to-br from-[#fff5fa] via-[#ffe9f3] to-[#ffdce9] p-5 shadow-[0_16px_35px_rgba(217,75,147,0.18)]">

                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/55 blur-2xl" />

                  <div className="relative">

                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ef87ad] to-[#d94b93] px-3 py-1.5 text-[11px] font-black tracking-wide text-white">

                      <Sparkles
                        size={
                          13
                        }
                      />

                      LIMI+

                    </div>

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-[23px] font-black text-[#d94b93]">
                          Limi+
                        </p>

                        <div className="mt-1 flex items-end gap-1">

                          <span className="text-xl font-black text-[#402a35]">
                            $7.99
                          </span>

                          <span className="pb-0.5 text-xs font-bold text-[#80636f]">
                            / month
                          </span>

                        </div>

                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/70 text-[#d94b93] shadow-sm">

                        <Crown
                          size={
                            20
                          }
                        />

                      </div>

                    </div>

                    <div className="mt-4 space-y-2.5">

                      <PlusFeature
                        icon={
                          <Heart
                            size={
                              15
                            }
                          />
                        }
                      >
                        See who likes you
                      </PlusFeature>

                      <PlusFeature
                        icon={
                          <MapPin
                            size={
                              15
                            }
                          />
                        }
                      >
                        Advanced discovery
                      </PlusFeature>

                      <PlusFeature
                        icon={
                          <Sparkles
                            size={
                              15
                            }
                          />
                        }
                      >
                        Premium matching
                      </PlusFeature>

                      <PlusFeature
                        icon={
                          <Crown
                            size={
                              15
                            }
                          />
                        }
                      >
                        Limi+ profile badge
                      </PlusFeature>

                    </div>

                    <button
                      type="button"
                      onClick={
                        continueWithPlus
                      }
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#ee79a5] to-[#e25a97] py-3.5 text-sm font-black text-white shadow-[0_10px_25px_rgba(217,75,147,0.25)] transition active:scale-[0.98]"
                    >
                      Get Limi+

                      <ArrowRight
                        size={
                          17
                        }
                      />
                    </button>

                    <p className="mt-3 text-center text-[10px] font-semibold leading-4 text-[#9b7a89]">
                      You'll review and
                      confirm payment before
                      your subscription
                      begins.
                    </p>

                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

/* -------------------------------------------------------
   FREE FEATURE ROW
------------------------------------------------------- */

function PlanFeature({
  children,
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-[#80636f]">

      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff0f7] text-[#d94b93]">

        <Check
          size={
            12
          }
        />

      </div>

      <span>
        {children}
      </span>

    </div>
  );
}

/* -------------------------------------------------------
   LIMI+ FEATURE ROW
------------------------------------------------------- */

function PlusFeature({
  icon,
  children,
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-[#6f5360]">

      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[9px] bg-white/70 text-[#d94b93]">

        {icon}

      </div>

      <span>
        {children}
      </span>

    </div>
  );
}