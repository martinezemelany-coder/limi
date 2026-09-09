import React from "react";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#fff6fa] px-5 py-8 text-[#2f2430]">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(106,63,88,0.10)] backdrop-blur-xl sm:p-10">
          {/* HEADER */}

          <header className="mb-10">
            <Link
              to="/about"
              className="mb-6 inline-block text-sm font-semibold text-[#cf4f8a]"
            >
              ← Back to Limi
            </Link>

            <div className="mb-3 text-3xl font-bold tracking-tight text-[#d84f91]">
              Limi
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Terms of Service
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#81727a]">
              Effective Date: September 8, 2026
              <br />
              Last Updated: September 8, 2026
            </p>

            <p className="mt-5 leading-7 text-[#6f626b]">
              These Terms of Service ("Terms") govern your access to and use of
              the Limi application, website, features, and related services
              (collectively, the "Services").
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              By creating an account, accessing, or using Limi, you agree to
              these Terms and acknowledge Limi's Privacy Policy.
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              If you do not agree to these Terms, do not use the Services.
            </p>
          </header>

          {/* 1 */}

          <TermsSection title="1. You Must Be 18 or Older">
            <p>
              Limi is intended exclusively for adults who are at least{" "}
              <strong>18 years old.</strong>
            </p>

            <p>
              By creating an account or using Limi, you represent and warrant
              that:
            </p>

            <TermsList
              items={[
                "You are at least 18 years old.",
                "You have the legal capacity to agree to these Terms.",
                "You are not prohibited by applicable law from using the Services.",
                "The age and identity information you provide is truthful and accurate.",
              ]}
            />

            <p>
              Individuals under 18 may not create or use a Limi account,
              access the Services through another person's account, ask another
              person to create an account for them, or misrepresent their age
              in order to gain access.
            </p>

            <p>
              Users may not knowingly permit an individual under 18 to use
              their account.
            </p>

            <p>
              Limi may request age or identity verification. Accounts
              reasonably believed to belong to individuals under 18 may be
              restricted, suspended, or terminated.
            </p>
          </TermsSection>

          {/* 2 */}

          <TermsSection title="2. What Limi Provides">
            <p>
              Limi is a social networking platform designed to help adults
              discover, connect with, communicate with, and potentially meet
              other adults for friendship and social activities.
            </p>

            <p>
              Limi provides technology that facilitates connections between
              users.
            </p>

            <p>
              Unless expressly stated otherwise, Limi does not organize,
              supervise, monitor, control, guarantee, or participate in private
              conversations, friendships, hangouts, meetings, or other
              interactions between users.
            </p>

            <p>
              Users independently decide whom they communicate with, whether
              they meet another person, where they meet, when they meet, and
              how they interact.
            </p>
          </TermsSection>

          {/* 3 */}

          <TermsSection title="3. Truthful and Authentic Accounts">
            <p>
              You agree to provide accurate information and to use Limi
              honestly.
            </p>

            <p>You may not:</p>

            <TermsList
              items={[
                "Impersonate another person.",
                "Create a false identity.",
                "Misrepresent your age.",
                "Use another person's account without authorization.",
                "Use deceptive or misleading photographs.",
                "Create fraudulent or fake profiles.",
                "Falsify verification information.",
                "Attempt to circumvent Limi verification systems.",
                "Transfer, sell, rent, or give control of a verified account to another person.",
                "Create multiple accounts to evade moderation, suspension, or enforcement.",
                "Use Limi to intentionally deceive, exploit, defraud, or harm another person.",
              ]}
            />
          </TermsSection>

          {/* 4 */}

          <TermsSection title="4. Verification">
            <p>
              Limi may provide identity, age, photo, phone, selfie, document,
              or other account-verification features directly or through
              third-party verification providers.
            </p>

            <p>
              Verification is intended to help reduce certain types of fraud,
              impersonation, and fake accounts.
            </p>

            <div className="mt-5 rounded-[20px] border border-[#f5c9dc] bg-[#fff7fa] p-5">
              <h3 className="font-bold text-[#3c2b35]">
                Verification is not a guarantee.
              </h3>

              <p className="mt-2 leading-7 text-[#6f626b]">
                A verification badge or status does not mean Limi personally
                knows the user or guarantees that every piece of information on
                the account is accurate.
              </p>
            </div>

            <p>A verified status does not guarantee:</p>

            <TermsList
              items={[
                "A person's intentions",
                "A person's character",
                "A person's conduct",
                "A person's trustworthiness",
                "A person's criminal history",
                "The absence of harmful or unlawful behavior",
                "That the account has never been compromised or transferred",
                "That meeting the person is safe",
              ]}
            />

            <p>
              Verification is not an endorsement of a user by Limi.
            </p>

            <p>
              Unless Limi specifically states otherwise, verification does not
              constitute a comprehensive criminal or background check.
            </p>

            <p>
              Verification technologies can fail, be circumvented, or become
              outdated. Users must continue to exercise independent judgment
              and reasonable safety precautions.
            </p>
          </TermsSection>

          {/* 5 */}

          <TermsSection title="5. Offline Meetings and Assumption of Risk">
            <p>
              Limi may help you discover people nearby and make plans to meet
              them offline.
            </p>

            <p>
              Meeting someone you first encountered online involves inherent
              risks.
            </p>

            <p>Those risks may include, among other things:</p>

            <TermsList
              items={[
                "Deception",
                "Impersonation",
                "Fraud",
                "Theft",
                "Harassment",
                "Stalking",
                "Sexual misconduct",
                "Assault",
                "Physical injury",
                "Property damage",
                "Other harmful or unlawful behavior",
              ]}
            />

            <p>
              You are responsible for deciding whether to communicate with or
              meet another user.
            </p>

            <p>
              To the maximum extent permitted by applicable law, you
              acknowledge and voluntarily assume the inherent risks associated
              with communicating with and meeting individuals you first
              encounter through an online platform.
            </p>

            <p>
              Limi does not guarantee the behavior, intentions, identity,
              reliability, or safety of any user.
            </p>
          </TermsSection>

          {/* 6 */}

          <TermsSection title="6. Safety Precautions">
            <p>
              Users are strongly encouraged to take reasonable precautions
              before and during offline meetings.
            </p>

            <TermsList
              items={[
                "Meet in a populated public place.",
                "Tell someone you trust where you are going.",
                "Consider sharing your plans or location with a trusted person.",
                "Arrange your own transportation when appropriate.",
                "Protect your home address, financial information, passwords, and other sensitive information.",
                "Do not send money merely because someone requests it through an online relationship.",
                "Trust your judgment and leave if you feel unsafe.",
                "Contact local emergency services if you or another person is in immediate danger.",
              ]}
            />

            <p>
              No safety feature, verification process, profile, recommendation,
              match, or moderation system can eliminate every risk associated
              with interacting with another person.
            </p>
          </TermsSection>

          {/* 7 */}

          <TermsSection title="7. Limi Does Not Guarantee Other Users">
            <p>
              Information provided by other users may be inaccurate,
              incomplete, misleading, outdated, or fraudulent.
            </p>

            <p>
              Limi does not guarantee that another user is who they claim to
              be, that information on a profile is true, or that a person will
              behave in a particular manner.
            </p>

            <p>
              You are responsible for evaluating another user's statements,
              profile, behavior, and suitability for interaction.
            </p>
          </TermsSection>

          {/* 8 */}

          <TermsSection title="8. Prohibited Conduct">
            <p>You may not use Limi to:</p>

            <TermsList
              items={[
                "Threaten another person.",
                "Stalk another person.",
                "Harass, intimidate, or abuse another person.",
                "Promote hatred or unlawful discrimination.",
                "Sexually exploit another person.",
                "Engage in or facilitate nonconsensual sexual conduct.",
                "Endanger, target, or exploit minors.",
                "Commit fraud or scams.",
                "Engage in deceptive solicitation.",
                "Impersonate another person.",
                "Share nonconsensual intimate imagery.",
                "Dox or disclose another person's sensitive personal information without permission.",
                "Facilitate trafficking or exploitation.",
                "Threaten or encourage violence.",
                "Sell, distribute, or facilitate illegal goods or services.",
                "Distribute malware or malicious code.",
                "Attempt unauthorized access to accounts, devices, systems, or data.",
                "Scrape or collect information from Limi through unauthorized automated means.",
                "Send spam.",
                "Circumvent safety, security, verification, or moderation systems.",
                "Evade account restrictions, suspensions, or bans.",
                "Interfere with or disrupt the Services.",
                "Use Limi for any unlawful purpose.",
              ]}
            />
          </TermsSection>

          {/* 9 */}

          <TermsSection title="9. Reporting, Blocking, and Enforcement">
            <p>
              Limi may provide tools that allow users to report or block other
              users.
            </p>

            <p>
              If Limi reasonably believes a user has violated these Terms or
              created a safety, security, fraud, or legal risk, Limi may take
              action including:
            </p>

            <TermsList
              items={[
                "Issuing a warning",
                "Removing content",
                "Restricting functionality",
                "Removing verification status",
                "Temporarily suspending an account",
                "Permanently terminating an account",
                "Preserving information when legally permitted or required",
                "Cooperating with lawful requests from authorities",
              ]}
            />

            <p>
              Limi does not guarantee a specific outcome or response time for
              every report.
            </p>

            <div className="mt-5 rounded-[20px] bg-[#fff0f6] p-5">
              <p className="font-bold text-[#3c2b35]">
                Limi is not an emergency service.
              </p>

              <p className="mt-2 leading-7 text-[#6f626b]">
                If you or another person is in immediate danger, contact the
                appropriate local emergency service.
              </p>
            </div>
          </TermsSection>

          {/* 10 */}

          <TermsSection title="10. User-Generated Content">
            <p>
              Limi may allow users to upload, post, send, display, or otherwise
              provide photographs, videos, messages, comments, profile
              information, hangouts, and other content ("User Content").
            </p>

            <p>
              You retain ownership of User Content you own.
            </p>

            <p>
              By providing User Content through Limi, you grant Limi a
              non-exclusive, worldwide, royalty-free license to host, store,
              reproduce, display, distribute, transmit, process, and adapt that
              User Content as reasonably necessary to operate, provide,
              secure, moderate, and improve the Services.
            </p>

            <p>
              You represent and warrant that you have the rights and
              permissions necessary to provide your User Content and grant this
              license.
            </p>

            <p>
              You remain responsible for User Content you submit.
            </p>
          </TermsSection>

          {/* 11 */}

          <TermsSection title="11. Content Moderation">
            <p>
              Limi may use human review, automated systems, or a combination of
              methods to detect prohibited content, fraud, abuse, scams, and
              other harmful activity.
            </p>

            <p>
              Moderation systems are imperfect.
            </p>

            <p>
              Limi does not guarantee that every harmful user, fraudulent
              account, inappropriate message, or prohibited piece of content
              will be identified or removed.
            </p>
          </TermsSection>

          {/* 12 */}

          <TermsSection title="12. No Background-Check Guarantee">
            <p>
              Unless Limi expressly states that a specific background-check
              product is being provided, Limi does not conduct a comprehensive
              criminal, civil, employment, financial, or personal-background
              investigation of every user.
            </p>

            <p>
              Users should not treat account creation, matching, verification,
              or continued access to Limi as evidence that another person has
              been fully screened or is safe.
            </p>
          </TermsSection>

          {/* 13 */}

          <TermsSection title="13. Scams and Financial Safety">
            <p>
              You should use caution if another user asks for money, financial
              information, gift cards, cryptocurrency, account credentials, or
              other items of value.
            </p>

            <p>
              Limi does not guarantee repayment or recovery of money or
              property voluntarily transferred to another user.
            </p>

            <p>
              Suspected scams or fraudulent activity should be reported through
              available Limi reporting tools or to <SupportEmail />.
            </p>
          </TermsSection>

          {/* 14 */}

          <TermsSection title="14. Third-Party Services">
            <p>
              Limi may rely on or integrate services provided by third parties,
              including authentication providers, hosting providers,
              verification services, payment processors, mapping services,
              analytics providers, and other technology providers.
            </p>

            <p>
              Third-party services may be governed by separate terms and
              privacy policies.
            </p>

            <p>
              Limi is not responsible for independent third-party services
              except to the extent required by applicable law.
            </p>
          </TermsSection>

          {/* 15 */}

          <TermsSection title="15. Paid Features and Subscriptions">
            <p>
              Limi may offer optional paid memberships, subscriptions, or
              features.
            </p>

            <p>
              Prices, billing periods, included benefits, renewal terms, and
              cancellation methods will be disclosed at the time of purchase.
            </p>

            <p>
              Purchases made through Apple, Google, or another third-party
              platform may also be governed by that platform's payment,
              cancellation, and refund rules.
            </p>

            <p>
              Limi may change, add, or remove paid features in accordance with
              applicable law.
            </p>
          </TermsSection>

          {/* 16 */}

          <TermsSection title="16. Limi Intellectual Property">
            <p>
              Limi and its associated software, designs, branding, logos,
              graphics, interfaces, features, and other materials are owned by
              Limi or its licensors and are protected by applicable
              intellectual-property laws.
            </p>

            <p>
              Except as permitted by applicable law or expressly authorized by
              Limi, you may not copy, reproduce, modify, distribute, sell,
              license, reverse engineer, or commercially exploit protected Limi
              materials.
            </p>
          </TermsSection>

          {/* 17 */}

          <TermsSection title="17. Suspension and Termination">
            <p>
              Limi may restrict, suspend, or terminate access to the Services
              where reasonably necessary to protect users, enforce these Terms,
              prevent fraud or abuse, comply with law, protect the Services, or
              address harmful or unlawful conduct.
            </p>

            <p>
              You may stop using Limi at any time and may request account
              deletion through available account controls or by contacting
              <SupportEmail />.
            </p>

            <p>
              Certain provisions of these Terms may continue to apply after
              account termination where their nature requires survival.
            </p>
          </TermsSection>

          {/* 18 */}

          <TermsSection title="18. Service Changes and Availability">
            <p>
              Limi is continuously developing and may add, change, suspend, or
              discontinue features.
            </p>

            <p>
              We do not guarantee that every feature will always be available,
              uninterrupted, error-free, secure, or compatible with every
              device.
            </p>

            <p>
              Maintenance, technical failures, security issues, internet
              outages, third-party failures, or other circumstances may affect
              availability.
            </p>
          </TermsSection>

          {/* 19 */}

          <TermsSection title="19. Disclaimer of Warranties">
            <p>
              To the maximum extent permitted by applicable law, the Services
              are provided on an <strong>"AS IS"</strong> and{" "}
              <strong>"AS AVAILABLE"</strong> basis.
            </p>

            <p>
              Limi does not guarantee that the Services will be uninterrupted,
              error-free, completely secure, or free from harmful content or
              conduct.
            </p>

            <p>
              Limi does not guarantee that matches, recommendations,
              friendships, hangouts, conversations, or other interactions will
              meet your expectations or result in successful or safe
              relationships.
            </p>

            <p>
              Nothing in these Terms excludes warranties or protections that
              cannot legally be excluded.
            </p>
          </TermsSection>

          {/* 20 */}

          <TermsSection title="20. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, Limi will not
              be liable for indirect, incidental, special, consequential,
              exemplary, or punitive damages arising from or related to the
              Services.
            </p>

            <p>
              This includes, to the extent permitted by law, losses arising
              from:
            </p>

            <TermsList
              items={[
                "User-generated content",
                "Statements or representations made by other users",
                "Conduct of another user",
                "Online interactions",
                "Offline meetings or hangouts",
                "Unauthorized access to an account",
                "Reliance on profile information",
                "Service interruptions",
                "Loss of data",
                "Third-party services",
              ]}
            />

            <p>
              Nothing in these Terms excludes or limits liability that cannot
              lawfully be excluded or limited.
            </p>
          </TermsSection>

          {/* 21 */}

          <TermsSection title="21. Indemnification">
            <p>
              To the extent permitted by applicable law, you agree to
              indemnify, defend, and hold Limi harmless from third-party claims,
              liabilities, damages, losses, and reasonable expenses arising
              from your:
            </p>

            <TermsList
              items={[
                "Unlawful conduct",
                "User Content",
                "Material violation of these Terms",
                "Fraud",
                "Intentional misconduct",
                "Violation of another person's rights",
              ]}
            />

            <p>
              This section applies only to the extent enforceable under
              applicable law.
            </p>
          </TermsSection>

          {/* 22 */}

          <TermsSection title="22. Emergency Situations">
            <p>
              Limi is not designed or operated as an emergency response
              service.
            </p>

            <p>
              Do not rely on Limi, its reporting system, messaging features,
              support email, or other functionality to obtain immediate
              emergency assistance.
            </p>

            <p>
              If you or another person faces an immediate threat of harm,
              contact the appropriate local emergency service.
            </p>
          </TermsSection>

          {/* 23 */}

          <TermsSection title="23. Privacy">
            <p>
              Limi's collection and use of personal information is described in
              our Privacy Policy.
            </p>

            <Link
              to="/privacy"
              className="inline-block font-semibold text-[#c94c86] underline decoration-[#efb4ce] underline-offset-2"
            >
              Read the Limi Privacy Policy
            </Link>
          </TermsSection>

          {/* 24 */}

          <TermsSection title="24. Changes to These Terms">
            <p>
              We may update these Terms as Limi develops or as legal,
              technical, and operational requirements change.
            </p>

            <p>
              When we update these Terms, we will update the "Last Updated"
              date.
            </p>

            <p>
              Where applicable law requires additional notice or consent, we
              will provide it.
            </p>

            <p>
              Continued use of the Services after updated Terms become
              effective may constitute acceptance where permitted by applicable
              law.
            </p>
          </TermsSection>

          {/* 25 */}

          <TermsSection title="25. Governing Law and Dispute Resolution">
            <p>
              The governing law, jurisdiction, venue, arbitration,
              class-action waiver, and other dispute-resolution provisions
              applicable to Limi will be established consistent with applicable
              law and the legal entity operating Limi.
            </p>

            <p>
              Nothing in these Terms waives any right or legal protection that
              cannot lawfully be waived.
            </p>
          </TermsSection>

          {/* 26 */}

          <TermsSection title="26. Severability">
            <p>
              If any provision of these Terms is determined to be unlawful,
              invalid, or unenforceable, that provision will be enforced to the
              maximum extent permitted by law, and the remaining provisions
              will remain in effect.
            </p>
          </TermsSection>

          {/* 27 */}

          <TermsSection title="27. No Waiver">
            <p>
              If Limi does not immediately enforce a provision of these Terms,
              that does not mean Limi permanently waives the right to enforce
              that provision later.
            </p>
          </TermsSection>

          {/* 28 */}

          <TermsSection title="28. Entire Agreement">
            <p>
              These Terms, together with the Privacy Policy and any additional
              terms presented for specific Limi features, constitute the
              agreement between you and Limi regarding your use of the
              Services.
            </p>
          </TermsSection>

          {/* 29 */}

          <TermsSection title="29. Contact Us">
            <p>
              Questions about these Terms, account issues, reports, or support
              requests may be sent to:
            </p>

            <div className="mt-4 rounded-[20px] bg-[#fff0f6] p-5">
              <p className="font-bold text-[#3c2b35]">Limi</p>

              <p className="mt-1">
                Email: <SupportEmail />
              </p>
            </div>
          </TermsSection>

          {/* FOOTER */}

          <footer className="border-t border-[#f2dce6] pt-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/about"
                className="rounded-[16px] bg-[#ef6aa5] px-5 py-3 text-center font-semibold text-white shadow-[0_8px_20px_rgba(223,94,156,0.20)] transition active:scale-[0.98]"
              >
                Back to Limi
              </Link>

              <Link
                to="/privacy"
                className="rounded-[16px] border border-[#edb8cf] bg-white px-5 py-3 text-center font-semibold text-[#c94c86] transition active:scale-[0.98]"
              >
                Privacy Policy
              </Link>
            </div>

            <p className="mt-8 text-sm text-[#9a8c94]">
              © 2026 Limi. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   REUSABLE TERMS COMPONENTS
------------------------------------------------------- */

function TermsSection({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold leading-7 sm:text-2xl">
        {title}
      </h2>

      <div className="mt-4 space-y-4 leading-7 text-[#6f626b]">
        {children}
      </div>
    </section>
  );
}

function TermsList({ items }) {
  return (
    <ul className="space-y-2 pl-5">
      {items.map((item) => (
        <li
          key={item}
          className="list-disc"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function SupportEmail() {
  return (
    <a
      href="mailto:support.limi@gmail.com"
      className="font-semibold text-[#c94c86] underline decoration-[#efb4ce] underline-offset-2"
    >
      support.limi@gmail.com
    </a>
  );
}