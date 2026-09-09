import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-[#fff6fa] px-5 py-8 text-[#2f2430]">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(106,63,88,0.10)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mb-3 text-4xl font-bold tracking-tight text-[#d84f91]">
              Limi
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Real people. Real friendships. Real plans.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6f626b]">
              Limi is an 18+ social networking platform designed to help
              adults, especially college students, young adults, and people
              starting somewhere new, build genuine friendships nearby.
            </p>

            <div className="mt-5 inline-flex rounded-full bg-[#ffe7f1] px-4 py-2 text-sm font-semibold text-[#c74983]">
              18+ only
            </div>
          </div>

          <section className="mb-10">
            <h2 className="text-2xl font-bold">Find your people</h2>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Whether you just started college, transferred schools, moved to a
              new city, want to expand your social circle, or simply want
              people to do things with, Limi helps you discover people who are
              looking for genuine friendship too.
            </p>
          </section>

          <section className="mb-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] bg-[#fff0f6] p-5">
              <h3 className="text-lg font-bold text-[#cf4f8a]">Discover</h3>
              <p className="mt-2 leading-6 text-[#6f626b]">
                Find potential friends nearby based on shared interests,
                activities, preferences, and other information users choose to
                share.
              </p>
            </div>

            <div className="rounded-[22px] bg-[#fff0f6] p-5">
              <h3 className="text-lg font-bold text-[#cf4f8a]">Match</h3>
              <p className="mt-2 leading-6 text-[#6f626b]">
                Discover people you may connect with based on common interests
                and compatible social preferences.
              </p>
            </div>

            <div className="rounded-[22px] bg-[#fff0f6] p-5">
              <h3 className="text-lg font-bold text-[#cf4f8a]">Hangouts</h3>
              <p className="mt-2 leading-6 text-[#6f626b]">
                Discover social opportunities and make plans to turn online
                connections into real-world friendships.
              </p>
            </div>

            <div className="rounded-[22px] bg-[#fff0f6] p-5">
              <h3 className="text-lg font-bold text-[#cf4f8a]">Feed</h3>
              <p className="mt-2 leading-6 text-[#6f626b]">
                Share moments, interact with your community, and stay connected
                with the people you meet through Limi.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold">
              Authenticity and verification
            </h2>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Limi is designed to encourage authentic profiles and genuine
              human connections.
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Limi may provide identity, age, photo, phone, selfie, document,
              or other account-verification features directly or through
              trusted third-party providers.
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Verification is intended to help reduce impersonation and
              fraudulent accounts.
            </p>

            <div className="mt-5 rounded-[20px] border border-[#f5c9dc] bg-[#fff7fa] p-5">
              <p className="font-semibold text-[#3c2b35]">
                A verification badge or status is not a guarantee of another
                user's identity, background, intentions, character, conduct, or
                safety.
              </p>
            </div>

            <p className="mt-4 leading-7 text-[#6f626b]">
              Verification does not constitute a comprehensive background check
              or endorsement by Limi. Users should always exercise independent
              judgment when communicating with or meeting someone they first
              encountered online.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold">Your safety matters</h2>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Limi provides tools that help adults discover and communicate
              with other adults. Users independently decide whom they interact
              with and whether they choose to meet another person offline.
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Meeting someone first encountered online involves inherent risks.
            </p>

            <ul className="mt-4 space-y-3 pl-5 text-[#6f626b]">
              <li className="list-disc">
                Meet in a populated public place.
              </li>
              <li className="list-disc">
                Tell someone you trust where you are going.
              </li>
              <li className="list-disc">
                Consider sharing your plans or location with a trusted person.
              </li>
              <li className="list-disc">
                Arrange your own transportation when appropriate.
              </li>
              <li className="list-disc">
                Protect your home address, financial information, passwords,
                and other sensitive information.
              </li>
              <li className="list-disc">
                Never send money merely because someone asks through an online
                relationship.
              </li>
              <li className="list-disc">
                Trust your judgment and leave if a situation feels unsafe.
              </li>
              <li className="list-disc">
                Contact local emergency services if you or another person is in
                immediate danger.
              </li>
            </ul>

            <p className="mt-4 leading-7 text-[#6f626b]">
              No verification system, recommendation, match, profile, or safety
              feature can eliminate every risk associated with interacting with
              another person.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold">Community standards</h2>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Limi is intended to be a welcoming platform for genuine adult
              friendships.
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Users must not use Limi to impersonate, deceive, scam, threaten,
              stalk, harass, exploit, discriminate against, or intentionally
              harm another person.
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Fraudulent profiles, intentionally false identity information,
              harassment, scams, exploitation, and other prohibited conduct may
              result in content removal, account restriction, suspension, or
              termination.
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Users may report inappropriate behavior through available Limi
              reporting features.
            </p>

            <div className="mt-5 rounded-[20px] bg-[#fff0f6] p-5">
              <p className="font-semibold">
                Limi is not an emergency service.
              </p>
              <p className="mt-2 text-[#6f626b]">
                If you or another person is in immediate danger, contact the
                appropriate local emergency service.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold">18+ only</h2>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Limi is intended exclusively for adults.
            </p>

            <p className="mt-3 font-semibold leading-7 text-[#3c2b35]">
              You must be 18 years of age or older to create an account or use
              Limi.
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Individuals under 18 may not create an account, access the
              Services through another person's account, or have another person
              create an account on their behalf.
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              Accounts reasonably believed to belong to individuals under 18
              may be restricted, suspended, or removed.
            </p>
          </section>

          <section className="border-t border-[#f2dce6] pt-8">
            <h2 className="text-2xl font-bold">Legal and support</h2>

            <p className="mt-3 leading-7 text-[#6f626b]">
              By creating an account or using Limi, you agree to Limi's Terms
              of Service and acknowledge Limi's Privacy Policy.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/privacy"
                className="rounded-[16px] bg-[#ef6aa5] px-5 py-3 text-center font-semibold text-white shadow-[0_8px_20px_rgba(223,94,156,0.20)] transition active:scale-[0.98]"
              >
                Privacy Policy
              </Link>

              <Link
                to="/terms"
                className="rounded-[16px] border border-[#edb8cf] bg-white px-5 py-3 text-center font-semibold text-[#c94c86] transition active:scale-[0.98]"
              >
                Terms of Service
              </Link>
            </div>

            <p className="mt-7 text-sm leading-6 text-[#7c6d75]">
              Questions, safety concerns, or support requests:
              <br />
              <a
                href="mailto:support.limi@gmail.com"
                className="font-semibold text-[#c94c86]"
              >
                support.limi@gmail.com
              </a>
            </p>

            <p className="mt-8 text-sm text-[#9a8c94]">
              © 2026 Limi. All rights reserved.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}