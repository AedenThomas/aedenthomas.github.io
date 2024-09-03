import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const Privacy = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveredClickable, setIsHoveredClickable] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  
  useEffect(() => {
    document.body.classList.add("custom-cursor");
    return () => {
      document.body.classList.remove("custom-cursor");
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleClickableHover = useCallback((isHovered) => {
    setIsHoveredClickable(isHovered);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return !window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    setIsDarkMode(!prefersDarkMode);

    const timer = setTimeout(() => {
      setIsDarkMode(prefersDarkMode);

    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        {!isMobile && (
          <>
            <div
              className={`fixed w-5 h-5 rounded-full pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2`}
              style={{
                left: mousePosition.x,
                top: mousePosition.y,
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.5)"
                  : "rgba(0, 0, 0, 0.5)",
                boxShadow: isDarkMode
                  ? "0 0 10px rgba(255, 255, 255, 0.5)"
                  : "0 0 10px rgba(0, 0, 0, 0.5)",
              }}
            />
            <div
              className={`fixed w-7 h-7 rounded-full pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
                isHoveredClickable ? "opacity-100 scale-110" : "opacity-0 scale-100"
              }`}
              style={{
                left: mousePosition.x,
                top: mousePosition.y,
                backgroundColor: "rgba(74, 222, 128, 0.7)",
                boxShadow: "0 0 15px rgba(74, 222, 128, 0.7)",
                animation: isHoveredClickable ? "pulse 1.5s infinite" : "none",
              }}
            />
          </>
        )}

        <h1 className="text-4xl font-bold mb-8 text-center">
          Privacy Policy for Billify
        </h1>

        <section className="mb-8">
          <p className="mb-4">Last updated: September 03, 2024</p>
          <p className="mb-4">
            This Privacy Policy outlines how Billify collects, uses, and
            protects your information when you use our service. It explains your
            privacy rights and how the law safeguards you.
          </p>
          <p className="mb-4">
            We use your personal data to provide and enhance our service. By
            using Billify, you agree to the collection and use of information as
            described in this Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Interpretation and Definitions
          </h2>
          <h3 className="text-xl font-semibold mb-2">Interpretation</h3>
          <p className="mb-4">
            Capitalized terms have specific meanings as defined below. These
            definitions apply consistently whether used in singular or plural
            form.
          </p>
          <h3 className="text-xl font-semibold mb-2">Definitions</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>
              <strong>Account:</strong> Your unique account for accessing our
              Service.
            </li>
            <li>
              <strong>Affiliate:</strong> An entity controlling, controlled by,
              or under common control with a party (control meaning ownership of
              50% or more of voting securities).
            </li>
            <li>
              <strong>Application:</strong> Billify, the software we provide.
            </li>
            <li>
              <strong>Company:</strong> Billify (also referred to as "we," "us,"
              or "our").
            </li>
            <li>
              <strong>Country:</strong> United Kingdom
            </li>
            <li>
              <strong>Device:</strong> Any device capable of accessing the
              Service.
            </li>
            <li>
              <strong>Personal Data:</strong> Information relating to an
              identifiable individual.
            </li>
            <li>
              <strong>Service:</strong> The Application.
            </li>
            <li>
              <strong>Service Provider:</strong> Any person or entity processing
              data on behalf of the Company.
            </li>
            <li>
              <strong>Usage Data:</strong> Automatically collected data
              generated by the use of the Service.
            </li>
            <li>
              <strong>You:</strong> The individual or entity using the Service.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Collecting and Using Your Personal Data
          </h2>
          <h3 className="text-xl font-semibold mb-2">
            Types of Data Collected
          </h3>
          <h4 className="text-lg font-semibold mb-2">Personal Data</h4>
          <p className="mb-4">
            While using our Service, we may ask you to provide certain
            personally identifiable information, including but not limited to:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Email address</li>
            <li>Password</li>
            <li>Usage Data</li>
          </ul>
          <h4 className="text-lg font-semibold mb-2">Usage Data</h4>
          <p className="mb-4">
            Usage Data is automatically collected when using the Service. It may
            include information such as your Device's IP address, browser type
            and version, visited pages, time and date of visits, time spent on
            pages, unique device identifiers, and other diagnostic data.
          </p>
          <h4 className="text-lg font-semibold mb-2">
            Information Collected while Using the Application
          </h4>
          <p className="mb-4">
            While using our Application, we may collect, with your prior
            permission:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>
              Pictures and other information from your Device's camera and photo
              library
            </li>
          </ul>
          <p className="mb-4">
            This information is used to provide and improve our Service
            features. You can enable or disable access to this information at
            any time through your Device settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">In-App Purchases</h2>
          <p className="mb-4">
            Billify offers premium features through in-app purchases processed
            by Apple's App Store (iOS) and Google Play Store (Android). These
            transactions are subject to the respective platform's terms of
            service and privacy policies. We do not directly collect or store
            your payment information and receive only limited transaction data
            to provide access to purchased features.
          </p>
          <p className="mb-4">
            For iOS devices, please refer to Apple's App Store Terms of Service
            and Privacy Policy. For Android devices, please refer to Google Play
            Terms of Service and Privacy Policy.
          </p>
          <p className="mb-4">
            We recommend reviewing the privacy policies of Apple and Google for
            more information on how they handle your data during in-app
            purchases.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Use of Your Personal Data
          </h2>
          <p className="mb-4">
            Billify may use your Personal Data for purposes including:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Providing and maintaining our Service</li>
            <li>Managing your Account</li>
            <li>Performing contract obligations</li>
            <li>Contacting you</li>
            <li>Providing you with relevant offers and information</li>
            <li>Managing your requests</li>
            <li>Conducting business transfers</li>
            <li>
              Other purposes such as data analysis and service improvement
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Retention of Your Personal Data
          </h2>
          <p className="mb-4">
            Billify will retain your Personal Data only for as long as necessary
            for the purposes outlined in this Privacy Policy. We will retain and
            use your Personal Data to comply with legal obligations, resolve
            disputes, and enforce our legal agreements and policies.
          </p>
          <p className="mb-4">
            We will also retain Usage Data for internal analysis purposes. Usage
            Data is generally retained for a shorter period, except when used to
            strengthen security, improve functionality, or we are legally
            obligated to retain it for longer periods.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Transfer of Your Personal Data
          </h2>
          <p className="mb-4">
            Your information, including Personal Data, may be transferred to and
            maintained on computers located outside your governmental
            jurisdiction. Your consent to this Privacy Policy followed by your
            submission of such information represents your agreement to that
            transfer.
          </p>
          <p className="mb-4">
            Billify will take all necessary steps to ensure that your data is
            treated securely and in accordance with this Privacy Policy. No
            transfer of your Personal Data will occur to an organization or
            country unless there are adequate controls in place, including the
            security of your data and other personal information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Delete Your Personal Data
          </h2>
          <p className="mb-4">
            You have the right to delete or request that we assist in deleting
            the Personal Data we have collected about you. Our Service may give
            you the ability to delete certain information about you from within
            the Service.
          </p>
          <p className="mb-4">
            You may update, amend, or delete your information at any time by
            signing in to your Account and visiting the account settings
            section. You may also contact us to request access to, correct, or
            delete any personal information you have provided to us.
          </p>
          <p className="mb-4">
            Please note that we may need to retain certain information when we
            have a legal obligation or lawful basis to do so.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Disclosure of Your Personal Data
          </h2>
          <h3 className="text-xl font-semibold mb-2">Business Transactions</h3>
          <p className="mb-4">
            If Billify is involved in a merger, acquisition, or asset sale, your
            Personal Data may be transferred. We will provide notice before your
            Personal Data is transferred and becomes subject to a different
            Privacy Policy.
          </p>
          <h3 className="text-xl font-semibold mb-2">Law Enforcement</h3>
          <p className="mb-4">
            Under certain circumstances, Billify may be required to disclose
            your Personal Data if required to do so by law or in response to
            valid requests by public authorities.
          </p>
          <h3 className="text-xl font-semibold mb-2">
            Other Legal Requirements
          </h3>
          <p className="mb-4">
            Billify may disclose your Personal Data in the good faith belief
            that such action is necessary to:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Comply with a legal obligation</li>
            <li>Protect and defend the rights or property of Billify</li>
            <li>
              Prevent or investigate possible wrongdoing in connection with the
              Service
            </li>
            <li>
              Protect the personal safety of users of the Service or the public
            </li>
            <li>Protect against legal liability</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Security of Your Personal Data
          </h2>
          <p className="mb-4">
            The security of your Personal Data is important to us, but remember
            that no method of transmission over the Internet or method of
            electronic storage is 100% secure. While we strive to use
            commercially acceptable means to protect your Personal Data, we
            cannot guarantee its absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p className="mb-4">
            Our Service does not address anyone under the age of 13. We do not
            knowingly collect personally identifiable information from anyone
            under the age of 13. If you are a parent or guardian and you are
            aware that your child has provided us with Personal Data, please
            contact us. If we become aware that we have collected Personal Data
            from anyone under the age of 13 without verification of parental
            consent, we take steps to remove that information from our servers.
          </p>
          <p className="mb-4">
            If we need to rely on consent as a legal basis for processing your
            information and your country requires consent from a parent, we may
            require your parent's consent before we collect and use that
            information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Changes to this Privacy Policy
          </h2>
          <p className="mb-4">
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
          </p>
          <p className="mb-4">
            We will let you know via email and/or a prominent notice on our
            Service, prior to the change becoming effective and update the "Last
            updated" date at the top of this Privacy Policy.
          </p>
          <p className="mb-4">
            You are advised to review this Privacy Policy periodically for any
            changes. Changes to this Privacy Policy are effective when they are
            posted on this page.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;