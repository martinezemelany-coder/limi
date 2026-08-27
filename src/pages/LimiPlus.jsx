import React, {
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Check,
  Crown,
  Heart,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function LimiPlus() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    purchasing,
    setPurchasing,
  ] = useState(false);

  const [
    restoring,
    setRestoring,
  ] = useState(false);

  const fromSignup =
    location.state?.fromSignup ===
    true;

  /* -------------------------------------------------------
     PURCHASE

     IMPORTANT:

     Do NOT set membership = "plus" here.

     This button will later call the actual
     Apple / Google subscription purchase.

     Once the native store confirms an
     active subscription, THEN the app can
     update/verify the entitlement.
  ------------------------------------------------------- */

  const handlePurchase =
    async () => {
      try {
        setPurchasing(true);

        /*
          When Limi is packaged with
          Capacitor, this becomes the
          real App Store / Google Play
          subscription request.

          For now the browser must NOT
          pretend payment succeeded.
        */

        window.alert(
          "Limi+ checkout is ready for the native purchase connection. When we package Limi for iPhone, this button will open Apple's secure subscription payment sheet."
        );
      } finally {
        setPurchasing(false);
      }
    };

  /* -------------------------------------------------------
     CONTINUE FREE
  ------------------------------------------------------- */

  const handleContinueFree =
    () => {
      if (fromSignup) {
        navigate(
          "/onboarding",
          {
            replace: true,
          }
        );

        return;
      }

      navigate(-1);
    };

  /* -------------------------------------------------------
     RESTORE PURCHASE
  ------------------------------------------------------- */

  const handleRestorePurchase =
    async () => {
      try {
        setRestoring(true);

        /*
          Later this calls Apple's
          restore / current entitlement
          API through Capacitor.
        */

        window.alert(
          "Restore Purchase will connect to your Apple or Google subscription once native purchases are enabled."
        );
      } finally {
        setRestoring(false);
      }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdeef4] via-[#f8dce6] to-[#f4b7c8] px-4 py-8">

      <div className="mx-auto w-full max-w-md">

        <button
          type="button"
          onClick={
            handleContinueFree
          }
          className="mb-5 flex items-center gap-2 rounded-full bg-white/70 px-4 py-2.5 text-sm font-black text-[#d94b93] shadow-sm backdrop-blur"
        >
          <ArrowLeft
            size={17}
          />

          Back
        </button>

        <div className="relative overflow-hidden rounded-[38px] border border-white/70 bg-white/95 p-7 shadow-[0_20px_55px_rgba(217,75,147,0.20)]">

          {/* DECORATIVE GLOW */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#ffcfe1]/60 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[#f6b5d0]/40 blur-3xl" />

          <div className="relative">

            {/* ICON */}

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-[#f5a2bc] via-[#ef87ad] to-[#d94b93] text-white shadow-[0_12px_30px_rgba(217,75,147,0.28)]">

              <Sparkles
                size={35}
                strokeWidth={2.4}
              />

            </div>

            {/* TITLE */}

            <div className="mt-5 text-center">

              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0f7] px-3 py-1.5 text-xs font-black text-[#d94b93]">

                <Crown
                  size={14}
                />

                LIMI+

              </div>

              <h1
                className="mt-3 text-[40px] leading-none tracking-[-0.05em] text-[#d94b93]"
                style={{
                  fontWeight:
                    1000,
                }}
              >
                Find your people,
                faster.
              </h1>

              <p className="mx-auto mt-3 max-w-[310px] text-sm font-semibold leading-6 text-[#80636f]">
                Get more control over
                who you discover and
                see the people already
                interested in meeting
                you.
              </p>

            </div>

            {/* PRICE */}

            <div className="mt-6 rounded-[28px] border border-[#f4d9e5] bg-gradient-to-br from-[#fff8fc] to-[#ffedf5] p-5 text-center">

              <div className="flex items-end justify-center gap-1">

                <span className="text-[38px] font-black tracking-[-0.04em] text-[#2b1d28]">
                  $7.99
                </span>

                <span className="mb-1.5 text-sm font-bold text-[#80636f]">
                  / month
                </span>

              </div>

              <p className="mt-1 text-xs font-semibold text-[#9a7b87]">
                Cancel anytime.
              </p>

            </div>

            {/* FEATURES */}

            <div className="mt-6 space-y-3">

              <Feature
                icon={
                  <Heart
                    size={18}
                  />
                }
                title="See who likes you"
                description="Know who's already interested instead of guessing."
              />

              <Feature
                icon={
                  <MapPin
                    size={18}
                  />
                }
                title="Advanced discovery"
                description="Get more control over the people Limi shows you."
              />

              <Feature
                icon={
                  <Sparkles
                    size={18}
                  />
                }
                title="Premium matching"
                description="Unlock additional ways to find your kind of people."
              />

              <Feature
                icon={
                  <Crown
                    size={18}
                  />
                }
                title="Limi+ badge"
                description="A subtle premium badge on your Limi profile."
              />

              <Feature
                icon={
                  <Check
                    size={18}
                  />
                }
                title="Everything in Limi Free"
                description="You keep the full core Limi experience."
              />

            </div>

            {/* PURCHASE */}

            <button
              type="button"
              onClick={
                handlePurchase
              }
              disabled={
                purchasing
              }
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#ee79a5] to-[#e65b99] py-4 text-base font-black text-white shadow-[0_12px_28px_rgba(217,75,147,0.28)] transition active:scale-[0.98] disabled:opacity-60"
            >
              {purchasing
                ? "Opening checkout..."
                : "Continue with Limi+"}

              {!purchasing && (
                <Sparkles
                  size={18}
                />
              )}
            </button>

            {/* SECURITY */}

            <div className="mt-4 flex items-start justify-center gap-2 px-3 text-center text-[11px] font-semibold leading-4 text-[#9a7b87]">

              <ShieldCheck
                size={15}
                className="mt-0.5 shrink-0"
              />

              Payment will be handled
              securely through the App
              Store or Google Play.

            </div>

            {/* KEEP FREE */}

            <button
              type="button"
              onClick={
                handleContinueFree
              }
              className="mt-4 w-full rounded-full border border-[#f1d8e3] bg-white py-3.5 text-sm font-black text-[#d94b93]"
            >
              Keep Limi Free
            </button>

            {/* RESTORE */}

            <button
              type="button"
              onClick={
                handleRestorePurchase
              }
              disabled={
                restoring
              }
              className="mt-2 flex w-full items-center justify-center gap-2 py-3 text-xs font-black text-[#80636f] disabled:opacity-60"
            >
              <RefreshCw
                size={14}
              />

              {restoring
                ? "Checking..."
                : "Restore Purchase"}
            </button>

            <p className="mt-2 px-4 text-center text-[10px] font-semibold leading-4 text-[#ab8d99]">
              Subscription renews
              automatically unless
              cancelled through your
              store account before the
              renewal date.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   FEATURE ROW
------------------------------------------------------- */

function Feature({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex gap-3 rounded-[20px] bg-[#fff8fc] p-4">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#ffe8f1] text-[#d94b93]">
        {icon}
      </div>

      <div>

        <p className="text-sm font-black text-[#3f2b35]">
          {title}
        </p>

        <p className="mt-0.5 text-xs font-semibold leading-5 text-[#8b6e7a]">
          {description}
        </p>

      </div>

    </div>
  );
}