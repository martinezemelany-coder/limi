import React from "react";
import { Link } from "react-router-dom";

export default function Privacy() {
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
              Privacy Policy
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#81727a]">
              Effective Date: September 8, 2026
              <br />
              Last Updated: September 8, 2026
            </p>

            <p className="mt-5 leading-7 text-[#6f626b]">
              Limi ("Limi," "we," "us," or "our") provides a social
              networking platform designed to help adults discover, connect
              with, communicate with, and potentially meet other adults for
              friendship and social activities.
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              This Privacy Policy explains how we collect, use, disclose,
              retain, and otherwise process information when you access or use
              the Limi application, website, features, and related services
              (collectively, the "Services").
            </p>

            <p className="mt-3 leading-7 text-[#6f626b]">
              By using the Services, you acknowledge the practices described
              in this Privacy Policy.
            </p>
          </header>

          {/* 1 */}
          <PolicySection title="1. Limi Is an 18+ Service">
            <p>
              Limi is intended exclusively for individuals who are at least{" "}
              <strong>18 years old.</strong>
            </p>

            <p>
              Individuals under 18 are not permitted to create accounts or use
              the Services.
            </p>

            <p>
              We do not knowingly permit minors to maintain Limi accounts. If
              we become aware that an account belongs to an individual under
              18, we may restrict, suspend, or delete the account and associated
              information as appropriate and subject to applicable law.
            </p>

            <p>
              If you believe an individual under 18 is using Limi, please
              contact us at{" "}
              <SupportEmail />.
            </p>
          </PolicySection>

          {/* 2 */}
          <PolicySection title="2. Information We Collect">
            <p>
              The information we collect depends on how you use Limi and which
              features are available.
            </p>

            <Subheading>A. Information You Provide</Subheading>

            <p>You may provide information including:</p>

            <PolicyList
              items={[
                "Name or display name",
                "Email address",
                "Date of birth or age",
                "Profile photographs",
                "Biography or profile description",
                "City or general location",
                "Interests and hobbies",
                "Activities and friendship preferences",
                "Social-energy or personality preferences",
                "Vibes or other profile characteristics",
                "Search-radius and distance preferences",
                "Friendship or matching preferences",
                "Posts",
                "Comments",
                "Likes and reactions",
                "Saved content",
                "Messages or communications, if messaging functionality is provided",
                "Hangouts, activities, or social plans",
                "Reports and safety complaints",
                "Communications with Limi support",
                "Verification information",
                "Subscription or membership information",
                "Other information you voluntarily provide",
              ]}
            />

            <p>
              Certain information you provide is intended to be displayed to
              other users. You should not place information on your public
              profile that you do not want other Limi users to see.
            </p>

            <Subheading>B. Authentication Information</Subheading>

            <p>
              When you create or access an account, we may process information
              including:
            </p>

            <PolicyList
              items={[
                "Email address",
                "Account identifier",
                "Authentication credentials or tokens",
                "Login information",
                "Account creation and access information",
              ]}
            />

            <p>
              If you choose to sign in using Google or another third-party
              authentication provider, we may receive information authorized by
              you and provided by that service, which may include your name,
              email address, profile photograph, and unique account identifier.
            </p>

            <p>
              We use information received through third-party authentication
              services to authenticate users, maintain accounts, provide
              requested functionality, prevent abuse, and operate the Services.
            </p>

            <p>
              We do not use Google user data for purposes materially unrelated
              to providing or securing Limi without appropriate disclosure or
              authorization.
            </p>

            <Subheading>C. Location Information</Subheading>

            <p>
              Because Limi helps people discover friendships and activities
              nearby, we may collect or process location-related information
              such as:
            </p>

            <PolicyList
              items={[
                "City or location entered by you",
                "Approximate location",
                "Device location if you grant permission",
                "Search radius",
                "Distance preferences",
                "Approximate distance between users or activities",
                "Location associated with a hangout or other user-generated content",
              ]}
            />

            <p>
              Where required, device location is accessed only after obtaining
              applicable permission.
            </p>

            <p>
              You can change location permissions through your device settings.
              Disabling location access may limit certain Limi functionality.
            </p>

            <p>
              Users should exercise caution before sharing precise meeting
              locations, home addresses, or other sensitive location
              information.
            </p>
          </PolicySection>

          {/* 3 */}
          <PolicySection title="3. Identity, Age, and Account Verification">
            <p>
              Limi may provide verification features directly or through
              third-party verification providers.
            </p>

            <p>
              Depending on the system implemented, verification may involve
              information such as:
            </p>

            <PolicyList
              items={[
                "Name",
                "Date of birth or age",
                "Email address",
                "Phone number",
                "Photographs",
                "Selfies",
                "Video",
                "Government-issued identification",
                "Information extracted from identification documents",
                "Device or fraud-prevention information",
                "Other information necessary to perform the verification",
              ]}
            />

            <p>
              If biometric information is used or generated by a verification
              provider, Limi will provide any additional notice and obtain any
              consent required by applicable law before such processing.
            </p>

            <p>
              A third-party verification provider may process verification
              information according to its own privacy policy and contractual
              obligations.
            </p>

            <p>
              Where appropriate, Limi may receive only a verification result or
              status rather than all underlying verification information.
            </p>

            <p>
              We will update this Privacy Policy as necessary when specific
              verification technologies and providers are implemented.
            </p>

            <div className="mt-5 rounded-[20px] border border-[#f5c9dc] bg-[#fff7fa] p-5">
              <h3 className="font-bold text-[#3c2b35]">
                Verification Is Not a Guarantee
              </h3>

              <p className="mt-2 leading-7 text-[#6f626b]">
                Verification is intended to reduce certain forms of
                impersonation and fraudulent account activity. No verification
                system is perfect.
              </p>

              <p className="mt-2 leading-7 text-[#6f626b]">
                A verified status means only that an account successfully
                completed the verification procedure applicable at that time.
                It does not guarantee a user's character, intentions,
                background, criminal history, behavior, trustworthiness, or
                safety.
              </p>

              <p className="mt-2 leading-7 text-[#6f626b]">
                Verification should not replace appropriate personal judgment
                and safety precautions.
              </p>
            </div>
          </PolicySection>

          {/* 4 */}
          <PolicySection title="4. Device and Usage Information">
            <p>
              When you use Limi, we or our service providers may automatically
              process information such as:
            </p>

            <PolicyList
              items={[
                "IP address",
                "Device type",
                "Operating system",
                "Browser type",
                "Application version",
                "Device or application identifiers",
                "Login activity",
                "Usage information",
                "Feature interactions",
                "Dates and times of access",
                "Crash reports",
                "Diagnostic information",
                "Security events",
                "Fraud-prevention signals",
              ]}
            />
          </PolicySection>

          {/* 5 */}
          <PolicySection title="5. Payment and Subscription Information">
            <p>
              If Limi offers paid memberships, subscriptions, or other
              purchases, payments may be processed by Apple, Google, Stripe, or
              another payment provider.
            </p>

            <p>
              Depending on the payment method, Limi may receive information
              such as subscription status, product purchased, transaction
              identifier, purchase date, renewal status, and payment status.
            </p>

            <p>
              When a third-party payment processor handles payment credentials,
              Limi may not directly receive or store your complete credit or
              debit card information.
            </p>
          </PolicySection>

          {/* 6 */}
          <PolicySection title="6. How We Use Information">
            <p>We may use information to:</p>

            <PolicyList
              items={[
                "Create and maintain accounts",
                "Authenticate users",
                "Operate Limi",
                "Display user profiles",
                "Provide matching and discovery functionality",
                "Recommend potential connections, content, or activities",
                "Provide location-based functionality",
                "Enable posts, comments, likes, saves, hangouts, messages, and other social functionality",
                "Provide verification functionality",
                "Detect fraudulent or fake accounts",
                "Detect impersonation",
                "Detect spam, scams, abuse, and suspicious behavior",
                "Process reports",
                "Moderate content",
                "Enforce our Terms of Service",
                "Protect users and the Services",
                "Investigate safety incidents",
                "Prevent unauthorized account access",
                "Process subscriptions or transactions",
                "Provide customer support",
                "Diagnose technical problems",
                "Maintain and improve Limi",
                "Understand how features are used",
                "Develop new functionality",
                "Communicate account, security, service, and policy information",
                "Comply with applicable law and lawful legal processes",
                "Establish, exercise, or defend legal claims",
                "Protect the rights, safety, property, and security of Limi, our users, and others",
              ]}
            />
          </PolicySection>

          {/* 7 */}
          <PolicySection title="7. Information Other Users Can See">
            <p>
              Limi is a social networking platform. Depending on the
              functionality and your settings, other users may see information
              including your:
            </p>

            <PolicyList
              items={[
                "Name or display name",
                "Age",
                "Profile photographs",
                "Biography",
                "City or approximate location",
                "Interests",
                "Activities",
                "Friendship preferences",
                "Social preferences",
                "Posts",
                "Comments",
                "Likes or interactions",
                "Hangouts or activities you make visible",
                "Verification status",
              ]}
            />

            <p>
              Do not publicly disclose information you want to remain private.
            </p>

            <p>In particular, users should avoid publicly posting:</p>

            <PolicyList
              items={[
                "Home addresses",
                "Passwords",
                "Financial-account information",
                "Credit or debit card information",
                "Social Security numbers",
                "Government identification numbers",
                "Other highly sensitive information",
              ]}
            />
          </PolicySection>

          {/* 8 */}
          <PolicySection title="8. How We Disclose Information">
            <Subheading>Other Users</Subheading>

            <p>
              Information you choose to make available through your profile,
              posts, hangouts, comments, or other social features may be
              displayed to other users.
            </p>

            <Subheading>Service Providers</Subheading>

            <p>
              We may disclose information to vendors and service providers that
              help us operate Limi, including providers of:
            </p>

            <PolicyList
              items={[
                "Cloud hosting",
                "Databases",
                "Authentication",
                "Identity and age verification",
                "Content and image storage",
                "Security",
                "Fraud prevention",
                "Analytics",
                "Customer support",
                "Email delivery",
                "Payment processing",
                "Mapping or location functionality",
                "Application infrastructure",
              ]}
            />

            <p>
              Providers may process information as necessary to perform
              services for Limi and subject to applicable legal and contractual
              requirements.
            </p>

            <Subheading>Legal, Safety, and Security Purposes</Subheading>

            <p>
              We may preserve, access, or disclose information where we
              reasonably believe doing so is necessary or appropriate to:
            </p>

            <PolicyList
              items={[
                "Comply with applicable law",
                "Respond to valid legal process",
                "Respond to lawful governmental requests",
                "Investigate fraud or illegal activity",
                "Investigate threats, harassment, exploitation, or abuse",
                "Protect a person's safety",
                "Prevent or investigate security incidents",
                "Enforce our agreements",
                "Protect Limi's rights, users, property, or Services",
              ]}
            />

            <Subheading>Business Transactions</Subheading>

            <p>
              If Limi becomes involved in a merger, acquisition, financing,
              reorganization, sale of assets, bankruptcy, or similar
              transaction, information may be disclosed or transferred in
              connection with that transaction subject to applicable law.
            </p>
          </PolicySection>

          {/* 9 */}
          <PolicySection title="9. We Do Not Guarantee the Conduct of Other Users">
            <p>
              Limi provides technology that enables adults to discover and
              interact with other adults.
            </p>

            <p>
              Limi does not control everything users say or do online or
              offline.
            </p>

            <p>
              Information another user provides may be inaccurate, incomplete,
              misleading, outdated, or fraudulent despite reasonable safety and
              verification measures.
            </p>

            <p>
              Users should exercise independent judgment when communicating
              with or meeting another person.
            </p>
          </PolicySection>

          {/* 10 */}
          <PolicySection title="10. Data Security">
            <p>
              We use reasonable administrative, organizational, and technical
              measures designed to protect information.
            </p>

            <p>
              However, no internet service, database, transmission, device, or
              storage system can be guaranteed to be completely secure. We
              cannot guarantee absolute security.
            </p>

            <p>
              You are responsible for protecting your account credentials and
              should promptly notify Limi if you believe your account has been
              compromised.
            </p>
          </PolicySection>

          {/* 11 */}
          <PolicySection title="11. Data Retention">
            <p>
              We retain information for as long as reasonably necessary to:
            </p>

            <PolicyList
              items={[
                "Provide the Services",
                "Maintain accounts",
                "Fulfill the purposes described in this Privacy Policy",
                "Maintain safety and security",
                "Prevent fraud and abuse",
                "Resolve disputes",
                "Enforce agreements",
                "Comply with applicable law",
              ]}
            />

            <p>
              Retention periods may vary depending on the type of information
              and why it is processed.
            </p>

            <p>
              Information may be retained after account deletion when
              reasonably necessary or legally permitted for purposes including
              fraud prevention, safety, security, dispute resolution, legal
              compliance, and enforcement.
            </p>
          </PolicySection>

          {/* 12 */}
          <PolicySection title="12. Account and Data Deletion">
            <p>
              Users may request deletion of their Limi account and associated
              personal information through available account controls or by
              contacting <SupportEmail />.
            </p>

            <p>
              We may need to verify your identity before processing certain
              requests.
            </p>

            <p>
              Some information may be retained where permitted or required by
              applicable law.
            </p>

            <p>
              Deleting information from Limi does not necessarily delete copies
              independently created or retained by other users, such as
              screenshots, downloaded photographs, or messages another person
              has retained.
            </p>
          </PolicySection>

          {/* 13 */}
          <PolicySection title="13. Your Privacy Rights">
            <p>
              Depending on where you live, applicable law may provide rights
              regarding your personal information, including rights to:
            </p>

            <PolicyList
              items={[
                "Request access",
                "Request correction",
                "Request deletion",
                "Obtain a copy of certain information",
                "Restrict or object to certain processing",
                "Withdraw certain consent",
                "Appeal certain privacy decisions",
              ]}
            />

            <p>
              These rights may be subject to legal exceptions.
            </p>

            <p>
              Requests may be submitted to <SupportEmail />. We may take
              reasonable steps to verify your identity before completing a
              request.
            </p>
          </PolicySection>

          {/* 14 */}
          <PolicySection title="14. Third-Party Services">
            <p>
              Limi may use or link to third-party authentication, hosting,
              verification, payment, mapping, analytics, and other services.
            </p>

            <p>
              Those companies may process information under their own privacy
              policies and agreements.
            </p>

            <p>
              Limi is not responsible for the independent privacy practices of
              third-party services except as otherwise provided by applicable
              law.
            </p>
          </PolicySection>

          {/* 15 */}
          <PolicySection title="15. No Sale of Personal Information">
            <p>
              Limi does not sell personal information for money.
            </p>

            <p>
              If our practices change or applicable privacy law treats
              particular future advertising or data-sharing practices as a
              "sale," "sharing," or similar regulated activity, we will provide
              disclosures and choices required by applicable law.
            </p>
          </PolicySection>

          {/* 16 */}
          <PolicySection title="16. International Processing">
            <p>
              Limi and its service providers may process information in the
              United States and other countries where service providers
              operate.
            </p>

            <p>
              Where applicable law requires safeguards for international
              transfers, we will implement appropriate measures.
            </p>
          </PolicySection>

          {/* 17 */}
          <PolicySection title="17. Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy as Limi develops or as our
              legal, technical, and operational practices change.
            </p>

            <p>
              We will update the "Last Updated" date and provide additional
              notice when required by applicable law.
            </p>
          </PolicySection>

          {/* 18 */}
          <PolicySection title="18. Contact Us">
            <p>
              For privacy questions, account deletion requests, safety
              concerns, or other inquiries:
            </p>

            <div className="mt-4 rounded-[20px] bg-[#fff0f6] p-5">
              <p className="font-bold text-[#3c2b35]">Limi</p>
              <p className="mt-1">
                Email: <SupportEmail />
              </p>
            </div>
          </PolicySection>

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
                to="/terms"
                className="rounded-[16px] border border-[#edb8cf] bg-white px-5 py-3 text-center font-semibold text-[#c94c86] transition active:scale-[0.98]"
              >
                Terms of Service
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
   REUSABLE PRIVACY POLICY COMPONENTS
------------------------------------------------------- */

function PolicySection({ title, children }) {
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

function Subheading({ children }) {
  return (
    <h3 className="pt-2 text-lg font-bold text-[#3c2b35]">
      {children}
    </h3>
  );
}

function PolicyList({ items }) {
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