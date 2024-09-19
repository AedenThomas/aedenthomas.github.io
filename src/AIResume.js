import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const AIResume = () => {
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
                isHoveredClickable
                  ? "opacity-100 scale-110"
                  : "opacity-0 scale-100"
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

        <h1 className="text-4xl font-bold mb-8 text-center">PRIVACY POLICY</h1>

        <p className="mb-4">Last updated September 19, 2024</p>

        <p className="mb-4">
          This Privacy Notice for AIResume ("we," "us," or "our"), describes how
          and why we might access, collect, store, use, and/or share ("process")
          your personal information when you use our services ("Services"),
          including when you:
        </p>

        <ul className="list-disc list-inside mb-4 space-y-2">
          <li>
            Visit our website, or any website of ours that links to this Privacy
            Notice
          </li>
          <li>
            Use AI Resume. The extension's single purpose is to optimize resumes
            for specific job applications using AI technology. It allows users
            to import, edit, and generate tailored resumes and cover letters
            based on job descriptions.
          </li>
          <li>
            Engage with us in other related ways, including any sales,
            marketing, or events
          </li>
        </ul>

        <p className="mb-4">
          Questions or concerns? Reading this Privacy Notice will help you
          understand your privacy rights and choices. We are responsible for
          making decisions about how your personal information is processed. If
          you do not agree with our policies and practices, please do not use
          our Services.
        </p>

        <h2 className="text-2xl font-semibold mb-4">SUMMARY OF KEY POINTS</h2>

        <p className="mb-4">
          This summary provides key points from our Privacy Notice, but you can
          find out more details about any of these topics by clicking the link
          following each key point or by using our table of contents below to
          find the section you are looking for.
        </p>

        <h3 className="text-xl font-semibold mb-2">
          What personal information do we process?
        </h3>
        <p className="mb-4">
          When you visit, use, or navigate our Services, we may process personal
          information depending on how you interact with us and the Services,
          the choices you make, and the products and features you use. Learn
          more about personal information you disclose to us.
        </p>

        <h3 className="text-xl font-semibold mb-2">
          Do we process any sensitive personal information?
        </h3>
        <p className="mb-4">
          Some of the information may be considered "special" or "sensitive" in
          certain jurisdictions, for example your racial or ethnic origins,
          sexual orientation, and religious beliefs. We do not process sensitive
          personal information.
        </p>

        <h3 className="text-xl font-semibold mb-2">
          Do we collect any information from third parties?
        </h3>
        <p className="mb-4">
          We do not collect any information from third parties.
        </p>

        <h3 className="text-xl font-semibold mb-2">
          How do we process your information?
        </h3>
        <p className="mb-4">
          We process your information to provide, improve, and administer our
          Services, communicate with you, for security and fraud prevention, and
          to comply with law. We may also process your information for other
          purposes with your consent. We process your information only when we
          have a valid legal reason to do so. Learn more about how we process
          your information.
        </p>

        <h3 className="text-xl font-semibold mb-2">
          In what situations and with which types of parties do we share
          personal information?
        </h3>
        <p className="mb-4">
          We may share information in specific situations and with specific
          categories of third parties. Learn more about when and with whom we
          share your personal information.
        </p>

        <h3 className="text-xl font-semibold mb-2">What are your rights?</h3>
        <p className="mb-4">
          Depending on where you are located geographically, the applicable
          privacy law may mean you have certain rights regarding your personal
          information. Learn more about your privacy rights.
        </p>

        <h3 className="text-xl font-semibold mb-2">
          How do you exercise your rights?
        </h3>
        <p className="mb-4">
          The easiest way to exercise your rights is by visiting data@aeden.me,
          or by contacting us. We will consider and act upon any request in
          accordance with applicable data protection laws.
        </p>

        <p className="mb-4">
          Want to learn more about what we do with any information we collect?
          Review the Privacy Notice in full.
        </p>

        <h2 className="text-2xl font-semibold mb-4">TABLE OF CONTENTS</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>WHAT INFORMATION DO WE COLLECT?</li>
          <li>HOW DO WE PROCESS YOUR INFORMATION?</li>
          <li>
            WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?
          </li>
          <li>WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</li>
          <li>DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</li>
          <li>DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</li>
          <li>HOW DO WE HANDLE YOUR SOCIAL LOGINS?</li>
          <li>HOW LONG DO WE KEEP YOUR INFORMATION?</li>
          <li>DO WE COLLECT INFORMATION FROM MINORS?</li>
          <li>WHAT ARE YOUR PRIVACY RIGHTS?</li>
          <li>CONTROLS FOR DO-NOT-TRACK FEATURES</li>
          <li>DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</li>
          <li>DO WE MAKE UPDATES TO THIS NOTICE?</li>
          <li>HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</li>
          <li>
            HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?
          </li>
        </ol>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. WHAT INFORMATION DO WE COLLECT?
          </h2>
          <h3 className="text-xl font-semibold mb-2">
            Personal information you disclose to us
          </h3>
          <p className="mb-4">
            In Short: We collect personal information that you provide to us.
          </p>
          <p className="mb-4">
            We collect personal information that you voluntarily provide to us
            when you register on the Services, express an interest in obtaining
            information about us or our products and Services, when you
            participate in activities on the Services, or otherwise when you
            contact us.
          </p>
          <p className="mb-4">
            Personal Information Provided by You. The personal information that
            we collect depends on the context of your interactions with us and
            the Services, the choices you make, and the products and features
            you use. The personal information we collect may include the
            following:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>names</li>
            <li>email addresses</li>
            <li>debit/credit card numbers</li>
            <li>billing addresses</li>
          </ul>
          <p className="mb-4">
            Sensitive Information. We do not process sensitive information.
          </p>
          <p className="mb-4">
            Payment Data. We may collect data necessary to process your payment
            if you choose to make purchases, such as your payment instrument
            number, and the security code associated with your payment
            instrument. All payment data is handled and stored by Stripe. You
            may find their privacy notice link(s) here:
            https://stripe.com/gb/privacy.
          </p>
          <p className="mb-4">
            Social Media Login Data. We may provide you with the option to
            register with us using your existing social media account details,
            like your Facebook, X, or other social media account. If you choose
            to register in this way, we will collect certain profile information
            about you from the social media provider, as described in the
            section called "HOW DO WE HANDLE YOUR SOCIAL LOGINS?" below.
          </p>
          <p className="mb-4">
            All personal information that you provide to us must be true,
            complete, and accurate, and you must notify us of any changes to
            such personal information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. HOW DO WE PROCESS YOUR INFORMATION?
          </h2>
          <p className="mb-4">
            In Short: We process your information to provide, improve, and
            administer our Services, communicate with you, for security and
            fraud prevention, and to comply with law. We may also process your
            information for other purposes with your consent.
          </p>
          <p className="mb-4">
            We process your personal information for a variety of reasons,
            depending on how you interact with our Services, including:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>
              To facilitate account creation and authentication and otherwise
              manage user accounts. We may process your information so you can
              create and log in to your account, as well as keep your account in
              working order.
            </li>
            <li>
              To deliver and facilitate delivery of services to the user. We may
              process your information to provide you with the requested
              service.
            </li>
            <li>
              To save or protect an individual's vital interest. We may process
              your information when necessary to save or protect an individual's
              vital interest, such as to prevent harm.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?
          </h2>
          <p className="mb-4">
            In Short: We only process your personal information when we believe
            it is necessary and we have a valid legal reason (i.e., legal basis)
            to do so under applicable law, like with your consent, to comply
            with laws, to provide you with services to enter into or fulfill our
            contractual obligations, to protect your rights, or to fulfill our
            legitimate business interests.
          </p>
          <p className="mb-4">
            If you are located in the EU or UK, this section applies to you.
          </p>
          <p className="mb-4">
            The General Data Protection Regulation (GDPR) and UK GDPR require us
            to explain the valid legal bases we rely on in order to process your
            personal information. As such, we may rely on the following legal
            bases to process your personal information:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>
              Consent. We may process your information if you have given us
              permission (i.e., consent) to use your personal information for a
              specific purpose. You can withdraw your consent at any time. Learn
              more about withdrawing your consent.
            </li>
            <li>
              Performance of a Contract. We may process your personal
              information when we believe it is necessary to fulfill our
              contractual obligations to you, including providing our Services
              or at your request prior to entering into a contract with you.
            </li>
            <li>
              Legal Obligations. We may process your information where we
              believe it is necessary for compliance with our legal obligations,
              such as to cooperate with a law enforcement body or regulatory
              agency, exercise or defend our legal rights, or disclose your
              information as evidence in litigation in which we are involved.
            </li>
            <li>
              Vital Interests. We may process your information where we believe
              it is necessary to protect your vital interests or the vital
              interests of a third party, such as situations involving potential
              threats to the safety of any person.
            </li>
          </ul>
          <p className="mb-4">
            If you are located in Canada, this section applies to you.
          </p>
          <p className="mb-4">
            We may process your information if you have given us specific
            permission (i.e., express consent) to use your personal information
            for a specific purpose, or in situations where your permission can
            be inferred (i.e., implied consent). You can withdraw your consent
            at any time.
          </p>
          <p className="mb-4">
            In some exceptional cases, we may be legally permitted under
            applicable law to process your information without your consent,
            including, for example:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>
              If collection is clearly in the interests of an individual and
              consent cannot be obtained in a timely way
            </li>
            <li>For investigations and fraud detection and prevention</li>
            <li>
              For business transactions provided certain conditions are met
            </li>
            <li>
              If it is contained in a witness statement and the collection is
              necessary to assess, process, or settle an insurance claim
            </li>
            <li>
              For identifying injured, ill, or deceased persons and
              communicating with next of kin
            </li>
            <li>
              If we have reasonable grounds to believe an individual has been,
              is, or may be victim of financial abuse
            </li>
            <li>
              If it is reasonable to expect collection and use with consent
              would compromise the availability or the accuracy of the
              information and the collection is reasonable for purposes related
              to investigating a breach of an agreement or a contravention of
              the laws of Canada or a province
            </li>
            <li>
              If disclosure is required to comply with a subpoena, warrant,
              court order, or rules of the court relating to the production of
              records
            </li>
            <li>
              If it was produced by an individual in the course of their
              employment, business, or profession and the collection is
              consistent with the purposes for which the information was
              produced
            </li>
            <li>
              If the collection is solely for journalistic, artistic, or
              literary purposes
            </li>
            <li>
              If the information is publicly available and is specified by the
              regulations
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
          </h2>
          <p className="mb-4">
            In Short: We may share information in specific situations described
            in this section and/or with the following categories of third
            parties.
          </p>
          <p className="mb-4">
            Vendors, Consultants, and Other Third-Party Service Providers. We
            may share your data with third-party vendors, service providers,
            contractors, or agents ("third parties") who perform services for us
            or on our behalf and require access to such information to do that
            work. We have contracts in place with our third parties, which are
            designed to help safeguard your personal information. This means
            that they cannot do anything with your personal information unless
            we have instructed them to do it. They will also not share your
            personal information with any organization apart from us. They also
            commit to protect the data they hold on our behalf and to retain it
            for the period we instruct.
          </p>
          <p className="mb-4">
            The categories of third parties we may share personal information
            with are as follows:
          </p>
          <p className="mb-4">
            We also may need to share your personal information in the following
            situations:
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
          </h2>
          <p className="mb-4">
            In Short: We may use cookies and other tracking technologies to
            collect and store your information.
          </p>
          <p className="mb-4">
            We may use cookies and similar tracking technologies (like web
            beacons and pixels) to gather information when you interact with our
            Services. Some online tracking technologies help us maintain the
            security of our Services and your account, prevent crashes, fix
            bugs, save your preferences, and assist with basic site functions.
          </p>
          <p className="mb-4">
            We also permit third parties and service providers to use online
            tracking technologies on our Services for analytics and advertising,
            including to help manage and display advertisements, to tailor
            advertisements to your interests, or to send abandoned shopping cart
            reminders (depending on your communication preferences). The third
            parties and service providers use their technology to provide
            advertising about products and services tailored to your interests
            which may appear either on our Services or on other websites.
          </p>
          <p className="mb-4">
            To the extent these online tracking technologies are deemed to be a
            "sale"/"sharing" (which includes targeted advertising, as defined
            under the applicable laws) under applicable US state laws, you can
            opt out of these online tracking technologies by submitting a
            request as described below under section "DO UNITED STATES RESIDENTS
            HAVE SPECIFIC PRIVACY RIGHTS?"
          </p>
          <p className="mb-4">
            Specific information about how we use such technologies and how you
            can refuse certain cookies is set out in our Cookie Notice.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?
          </h2>
          <p className="mb-4">
            In Short: We offer products, features, or tools powered by
            artificial intelligence, machine learning, or similar technologies.
          </p>
          <p className="mb-4">
            As part of our Services, we offer products, features, or tools
            powered by artificial intelligence, machine learning, or similar
            technologies (collectively, "AI Products"). These tools are designed
            to enhance your experience and provide you with innovative
            solutions. The terms in this Privacy Notice govern your use of the
            AI Products within our Services.
          </p>
          <h3 className="text-xl font-semibold mb-2">Use of AI Technologies</h3>
          <p className="mb-4">
            We provide the AI Products through third-party service providers
            ("AI Service Providers"), including Google Cloud AI. As outlined in
            this Privacy Notice, your input, output, and personal information
            will be shared with and processed by these AI Service Providers to
            enable your use of our AI Products for purposes outlined in "WHAT
            LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?" You
            must not use the AI Products in any way that violates the terms or
            policies of any AI Service Provider.
          </p>
          <h3 className="text-xl font-semibold mb-2">Our AI Products</h3>
          <p className="mb-4">
            Our AI Products are designed for the following functions:
          </p>
          <h3 className="text-xl font-semibold mb-2">
            How We Process Your Data Using AI
          </h3>
          <p className="mb-4">
            All personal information processed using our AI Products is handled
            in line with our Privacy Notice and our agreement with third
            parties. This ensures high security and safeguards your personal
            information throughout the process, giving you peace of mind about
            your data's safety.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            7. HOW DO WE HANDLE YOUR SOCIAL LOGINS?
          </h2>
          <p className="mb-4">
            In Short: If you choose to register or log in to our Services using
            a social media account, we may have access to certain information
            about you.
          </p>
          <p className="mb-4">
            Our Services offer you the ability to register and log in using your
            third-party social media account details (like your Facebook or X
            logins). Where you choose to do this, we will receive certain
            profile information about you from your social media provider. The
            profile information we receive may vary depending on the social
            media provider concerned, but will often include your name, email
            address, friends list, and profile picture, as well as other
            information you choose to make public on such a social media
            platform.
          </p>
          <p className="mb-4">
            We will use the information we receive only for the purposes that
            are described in this Privacy Notice or that are otherwise made
            clear to you on the relevant Services. Please note that we do not
            control, and are not responsible for, other uses of your personal
            information by your third-party social media provider. We recommend
            that you review their privacy notice to understand how they collect,
            use, and share your personal information, and how you can set your
            privacy preferences on their sites and apps.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            8. HOW LONG DO WE KEEP YOUR INFORMATION?
          </h2>
          <p className="mb-4">
            In Short: We keep your information for as long as necessary to
            fulfill the purposes outlined in this Privacy Notice unless
            otherwise required by law.
          </p>
          <p className="mb-4">
            We will only keep your personal information for as long as it is
            necessary for the purposes set out in this Privacy Notice, unless a
            longer retention period is required or permitted by law (such as
            tax, accounting, or other legal requirements). No purpose in this
            notice will require us keeping your personal information for longer
            than three (3) months past the termination of the user's account.
          </p>
          <p className="mb-4">
            When we have no ongoing legitimate business need to process your
            personal information, we will either delete or anonymize such
            information, or, if this is not possible (for example, because your
            personal information has been stored in backup archives), then we
            will securely store your personal information and isolate it from
            any further processing until deletion is possible.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            9. DO WE COLLECT INFORMATION FROM MINORS?
          </h2>
          <p className="mb-4">
            In Short: We do not knowingly collect data from or market to
            children under 18 years of age.
          </p>
          <p className="mb-4">
            We do not knowingly collect, solicit data from, or market to
            children under 18 years of age, nor do we knowingly sell such
            personal information. By using the Services, you represent that you
            are at least 18 or that you are the parent or guardian of such a
            minor and consent to such minor dependent's use of the Services. If
            we learn that personal information from users less than 18 years of
            age has been collected, we will deactivate the account and take
            reasonable measures to promptly delete such data from our records.
            If you become aware of any data we may have collected from children
            under age 18, please contact us at privacy@aeden.me.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            10. WHAT ARE YOUR PRIVACY RIGHTS?
          </h2>
          <p className="mb-4">
            In Short: Depending on your state of residence in the US or in some
            regions, such as the European Economic Area (EEA), United Kingdom
            (UK), Switzerland, and Canada, you have rights that allow you
            greater access to and control over your personal information. You
            may review, change, or terminate your account at any time, depending
            on your country, province, or state of residence.
          </p>
          <p className="mb-4">
            In some regions (like the EEA, UK, Switzerland, and Canada), you
            have certain rights under applicable data protection laws. These may
            include the right (i) to request access and obtain a copy of your
            personal information, (ii) to request rectification or erasure;
            (iii) to restrict the processing of your personal information; (iv)
            if applicable, to data portability; and (v) not to be subject to
            automated decision-making. In certain circumstances, you may also
            have the right to object to the processing of your personal
            information. You can make such a request by contacting us by using
            the contact details provided in the section "HOW CAN YOU CONTACT US
            ABOUT THIS NOTICE?" below.
          </p>
          <p className="mb-4">
            We will consider and act upon any request in accordance with
            applicable data protection laws.
          </p>
          <p className="mb-4">
            If you are located in the EEA or UK and you believe we are
            unlawfully processing your personal information, you also have the
            right to complain to your Member State data protection authority or
            UK data protection authority.
          </p>
          <p className="mb-4">
            If you are located in Switzerland, you may contact the Federal Data
            Protection and Information Commissioner.
          </p>
          <h3 className="text-xl font-semibold mb-2">
            Withdrawing your consent:
          </h3>
          <p className="mb-4">
            If we are relying on your consent to process your personal
            information, which may be express and/or implied consent depending
            on the applicable law, you have the right to withdraw your consent
            at any time. You can withdraw your consent at any time by contacting
            us by using the contact details provided in the section "HOW CAN YOU
            CONTACT US ABOUT THIS NOTICE?" below.
          </p>
          <p className="mb-4">
            However, please note that this will not affect the lawfulness of the
            processing before its withdrawal nor, when applicable law allows,
            will it affect the processing of your personal information conducted
            in reliance on lawful processing grounds other than consent.
          </p>
          <h3 className="text-xl font-semibold mb-2">Account Information</h3>
          <p className="mb-4">
            If you would at any time like to review or change the information in
            your account or terminate your account, you can:
          </p>
          <p className="mb-4">
            Upon your request to terminate your account, we will deactivate or
            delete your account and information from our active databases.
            However, we may retain some information in our files to prevent
            fraud, troubleshoot problems, assist with any investigations,
            enforce our legal terms and/or comply with applicable legal
            requirements.
          </p>
          <h3 className="text-xl font-semibold mb-2">
            Cookies and similar technologies:
          </h3>
          <p className="mb-4">
            Most Web browsers are set to accept cookies by default. If you
            prefer, you can usually choose to set your browser to remove cookies
            and to reject cookies. If you choose to remove cookies or reject
            cookies, this could affect certain features or services of our
            Services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            11. CONTROLS FOR DO-NOT-TRACK FEATURES
          </h2>
          <p className="mb-4">
            Most web browsers and some mobile operating systems and mobile
            applications include a Do-Not-Track ("DNT") feature or setting you
            can activate to signal your privacy preference not to have data
            about your online browsing activities monitored and collected. At
            this stage, no uniform technology standard for recognizing and
            implementing DNT signals has been finalized. As such, we do not
            currently respond to DNT browser signals or any other mechanism that
            automatically communicates your choice not to be tracked online. If
            a standard for online tracking is adopted that we must follow in the
            future, we will inform you about that practice in a revised version
            of this Privacy Notice.
          </p>
          <p className="mb-4">
            California law requires us to let you know how we respond to web
            browser DNT signals. Because there currently is not an industry or
            legal standard for recognizing or honoring DNT signals, we do not
            respond to them at this time.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?
          </h2>
          <p className="mb-4">
            In Short: If you are a resident of California, Colorado,
            Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Montana,
            New Hampshire, New Jersey, Oregon, Tennessee, Texas, Utah, or
            Virginia, you may have the right to request access to and receive
            details about the personal information we maintain about you and how
            we have processed it, correct inaccuracies, get a copy of, or delete
            your personal information. You may also have the right to withdraw
            your consent to our processing of your personal information. These
            rights may be limited in some circumstances by applicable law. More
            information is provided below.
          </p>

          <h3 className="text-xl font-semibold mb-2">
            Categories of Personal Information We Collect
          </h3>
          <p className="mb-4">
            We have collected the following categories of personal information
            in the past twelve (12) months:
          </p>

          <table className="w-full mb-4">
            <thead>
              <tr>
                <th>Category</th>
                <th>Examples</th>
                <th>Collected</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>A. Identifiers</td>
                <td>
                  Contact details, such as real name, alias, postal address,
                  telephone or mobile contact number, unique personal
                  identifier, online identifier, Internet Protocol address,
                  email address, and account name
                </td>
                <td>NO</td>
              </tr>
              <tr>
                <td>
                  B. Personal information as defined in the California Customer
                  Records statute
                </td>
                <td>
                  Name, contact information, education, employment, employment
                  history, and financial information
                </td>
                <td>NO</td>
              </tr>
              <tr>
                <td>
                  C. Protected classification characteristics under state or
                  federal law
                </td>
                <td>
                  Gender, age, date of birth, race and ethnicity, national
                  origin, marital status, and other demographic data
                </td>
                <td>NO</td>
              </tr>
              <tr>
                <td>D. Commercial information</td>
                <td>
                  Transaction information, purchase history, financial details,
                  and payment information
                </td>
                <td>NO</td>
              </tr>
              <tr>
                <td>E. Biometric information</td>
                <td>Fingerprints and voiceprints</td>
                <td>NO</td>
              </tr>
              <tr>
                <td>F. Internet or other similar network activity</td>
                <td>
                  Browsing history, search history, online behavior, interest
                  data, and interactions with our and other websites,
                  applications, systems, and advertisements
                </td>
                <td>NO</td>
              </tr>
              <tr>
                <td>G. Geolocation data</td>
                <td>Device location</td>
                <td>NO</td>
              </tr>
              <tr>
                <td>
                  H. Audio, electronic, visual, thermal, olfactory, or similar
                  information
                </td>
                <td>
                  Images and audio, video or call recordings created in
                  connection with our business activities
                </td>
                <td>NO</td>
              </tr>
              <tr>
                <td>I. Professional or employment-related information</td>
                <td>
                  Business contact details in order to provide you our Services
                  at a business level or job title, work history, and
                  professional qualifications if you apply for a job with us
                </td>
                <td>NO</td>
              </tr>
              <tr>
                <td>J. Education Information</td>
                <td>Student records and directory information</td>
                <td>NO</td>
              </tr>
              <tr>
                <td>K. Inferences drawn from collected personal information</td>
                <td>
                  Inferences drawn from any of the collected personal
                  information listed above to create a profile or summary about,
                  for example, an individual's preferences and characteristics
                </td>
                <td>NO</td>
              </tr>
              <tr>
                <td>L. Sensitive personal Information</td>
                <td></td>
                <td>NO</td>
              </tr>
            </tbody>
          </table>

          <p className="mb-4">
            We may also collect other personal information outside of these
            categories through instances where you interact with us in person,
            online, or by phone or mail in the context of:
          </p>

          <h3 className="text-xl font-semibold mb-2">
            Sources of Personal Information
          </h3>
          <p className="mb-4">
            Learn more about the sources of personal information we collect in
            "WHAT INFORMATION DO WE COLLECT?"
          </p>

          <h3 className="text-xl font-semibold mb-2">
            How We Use and Share Personal Information
          </h3>
          <p className="mb-4">
            Learn about how we use your personal information in the section,
            "HOW DO WE PROCESS YOUR INFORMATION?"
          </p>

          <h3 className="text-xl font-semibold mb-2">
            Will your information be shared with anyone else?
          </h3>
          <p className="mb-4">
            We may disclose your personal information with our service providers
            pursuant to a written contract between us and each service provider.
            Learn more about how we disclose personal information to in the
            section, "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"
          </p>
          <p className="mb-4">
            We may use your personal information for our own business purposes,
            such as for undertaking internal research for technological
            development and demonstration. This is not considered to be
            "selling" of your personal information.
          </p>
          <p className="mb-4">
            We have not sold or shared any personal information to third parties
            for a business or commercial purpose in the preceding twelve (12)
            months. We have disclosed the following categories of personal
            information to third parties for a business or commercial purpose in
            the preceding twelve (12) months:
          </p>
          <p className="mb-4">
            The categories of third parties to whom we disclosed personal
            information for a business or commercial purpose can be found under
            "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"
          </p>

          <h3 className="text-xl font-semibold mb-2">Your Rights</h3>
          <p className="mb-4">
            You have rights under certain US state data protection laws.
            However, these rights are not absolute, and in certain cases, we may
            decline your request as permitted by law. These rights include:
          </p>

          <p className="mb-4">
            Depending upon the state where you live, you may also have the
            following rights:
          </p>

          <h3 className="text-xl font-semibold mb-2">
            How to Exercise Your Rights
          </h3>
          <p className="mb-4">
            To exercise these rights, you can contact us by emailing us at
            data@aeden.me, or by referring to the contact details at the bottom
            of this document.
          </p>
          <p className="mb-4">
            Under certain US state data protection laws, you can designate an
            authorized agent to make a request on your behalf. We may deny a
            request from an authorized agent that does not submit proof that
            they have been validly authorized to act on your behalf in
            accordance with applicable laws.
          </p>

          <h3 className="text-xl font-semibold mb-2">Request Verification</h3>
          <p className="mb-4">
            Upon receiving your request, we will need to verify your identity to
            determine you are the same person about whom we have the information
            in our system. We will only use personal information provided in
            your request to verify your identity or authority to make the
            request. However, if we cannot verify your identity from the
            information already maintained by us, we may request that you
            provide additional information for the purposes of verifying your
            identity and for security or fraud-prevention purposes.
          </p>
          <p className="mb-4">
            If you submit the request through an authorized agent, we may need
            to collect additional information to verify your identity before
            processing your request and the agent will need to provide a written
            and signed permission from you to submit such request on your
            behalf.
          </p>

          <h3 className="text-xl font-semibold mb-2">Appeals</h3>
          <p className="mb-4">
            Under certain US state data protection laws, if we decline to take
            action regarding your request, you may appeal our decision by
            emailing us at data@aeden.me. We will inform you in writing of any
            action taken or not taken in response to the appeal, including a
            written explanation of the reasons for the decisions. If your appeal
            is denied, you may submit a complaint to your state attorney
            general.
          </p>

          <h3 className="text-xl font-semibold mb-2">
            California "Shine The Light" Law
          </h3>
          <p className="mb-4">
            California Civil Code Section 1798.83, also known as the "Shine The
            Light" law, permits our users who are California residents to
            request and obtain from us, once a year and free of charge,
            information about categories of personal information (if any) we
            disclosed to third parties for direct marketing purposes and the
            names and addresses of all third parties with which we shared
            personal information in the immediately preceding calendar year. If
            you are a California resident and would like to make such a request,
            please submit your request in writing to us by using the contact
            details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS
            NOTICE?"
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            13. DO WE MAKE UPDATES TO THIS NOTICE?
          </h2>
          <p className="mb-4">
            In Short: Yes, we will update this notice as necessary to stay
            compliant with relevant laws.
          </p>
          <p className="mb-4">
            We may update this Privacy Notice from time to time. The updated
            version will be indicated by an updated "Revised" date at the top of
            this Privacy Notice. If we make material changes to this Privacy
            Notice, we may notify you either by prominently posting a notice of
            such changes or by directly sending you a notification. We encourage
            you to review this Privacy Notice frequently to be informed of how
            we are protecting your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            14. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM
            YOU?
          </h2>
          <p className="mb-4">
            Based on the applicable laws of your country or state of residence
            in the US, you may have the right to request access to the personal
            information we collect from you, details about how we have processed
            it, correct inaccuracies, or delete your personal information. You
            may also have the right to withdraw your consent to our processing
            of your personal information. These rights may be limited in some
            circumstances by applicable law. To request to review, update, or
            delete your personal information, please visit: data@aeden.me.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AIResume;
