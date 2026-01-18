export const research = [
  {
    title:
      "Military Split: A Flutter Mobile Application for Efficient Bill Splitting Based on Individual Consumption",
    authors: "Aeden Geo Thomas, Kavana N. Murthy, Anitha H M, Jayarekha P",
    journal: "ICT for Intelligent Systems.",
    year: 2024,
    doi: "10.1007/978-981-97-6681-9",
  },
];

export const notableInteractions = [
  {
    company: "Y Combinator",
    description:
      "•  Selected as one of 2,000 top CS and AI students globally (out of 30,000 applicants) for this exclusive, **fully-sponsored** AI conference in San Francisco.\n\n• Engaged directly with AI's most influential leaders including **Elon Musk**, **Sam Altman**, **Satya Nadella**, and **Fei-Fei Li** through keynotes.",
    period: "Mar 2024",
    logo: {
      light:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Y_Combinator_logo.svg/1200px-Y_Combinator_logo.svg.png",
      dark: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Y_Combinator_logo.svg/1200px-Y_Combinator_logo.svg.png",
    },
    url: "https://www.ycombinator.com",
  },
  // {
  //   company: "Invisibility Inc.",
  //   description:
  //     "• Collaborated with **Sulaiman Khan Ghori** (CEO) and the engineering team to diagnose and resolve critical performance issues in their SwiftUI-based messaging application\n\n• Identified key bottlenecks through advanced profiling using Instruments, including SwiftUI update cycles, memory allocation issues, and UI thread stalls\n\n• Led to a major codebase refactor that significantly improved the app's chat history panel and message sending functionality",
  //   period: "Jun 2024",
  //   logo: "https://framerusercontent.com/images/tYGb5cME2Fsep50igI5HcnEw.png",
  //   url: "https://i.inc",
  //   image: "/invisibility-interaction.webp",
  // },
  // {
  //   company: "GitHub",
  //   description:
  //     "• Engaged in direct communication with **Thomas Dohmke** (CEO) to provide strategic feedback on GitHub Copilot's development\n\n• Successfully advocated for multimodal capabilities and proposed an enhanced branch-based code analysis feature for detecting potential bugs before merging\n\n• Influenced GitHub Copilot's product roadmap, particularly around improving code review capabilities and making AI tools more accessible to developers globally",
  //   period: "Oct 2024 - Dec 2024",
  //   logo: {
  //     light:
  //       "https://cdn.brandfetch.io/idZAyF9rlg/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  //     dark: "https://cdn.brandfetch.io/idZAyF9rlg/theme/light/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  //   },
  //   url: "https://github.com",
  //   image: "/github-interaction.png",
  // },
  // {
  //   company: "The Browser Company",
  //   description:
  //     "• Collaborated with **Josh Miller** (CEO) and the engineering team to diagnose and resolve critical video playback issues in the Arc browser\n\n• Identified hardware acceleration as the root cause affecting multiple users\n\n• Influenced the development roadmap for enhanced video player features, including Picture-in-Picture functionality improvements",
  //   period: "Apr 2024",
  //   logo: "https://cdn.brandfetch.io/idwAFJ6S5L/theme/dark/logo.svg?c=1bfwsmEH20zzEfSNTed",
  //   url: "https://thebrowser.company",
  //   image: "/tbc-interaction.png",
  // },
  // {
  //   company: "Texts.com (Automattic)",
  //   description:
  //     "• Collaborated with **Kishan Bagaria** (Founder) and the engineering team to resolve a critical 6-month-long WhatsApp integration issue\n\n• Implemented an innovative solution involving system directory cleanup, which was subsequently incorporated into the app's troubleshooting documentation\n\n• Significantly enhanced Texts.com's WhatsApp integration reliability and installation process",
  //   period: "Dec 2023 - Apr 2024",
  //   logo: "https://texts.com/_next/image?url=%2Ficon.png&w=128&q=75",
  //   url: "https://texts.com",
  // },
  // {
  //   company: "Apple",
  //   description:
  //     "• Engaged with **Craig Federighi** (SVP of Software Engineering) to propose innovative iOS features, including a less intrusive call UI, enhanced Face ID functionality, RAW photo capture, and split-screen multitasking\n\n• Several proposed features were later implemented in iOS releases, significantly improving the user experience for millions of iPhone users",
  //   period: "Oct 2019",
  //   logo: {
  //     light:
  //       "https://cdn.brandfetch.io/idnrCPuv87/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  //     dark: "https://cdn.brandfetch.io/idnrCPuv87/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  //   },
  //   url: "https://www.apple.com",
  // },
];

export const experience = [
  {
    company: "SJ Telford",
    position: "Backend .NET Cloud Developer",
    period: "August 2025 - Present",
    location: "London, United Kingdom",
    highlights: [
      "built a new serverless .net 8 API from the ground up on azure functions, designed to handle over 12,000 concurrent players for 20+ games.",
      "wrote a ton of tests (using xunit and moq) to take the project from 0% to over 95% test coverage, which let us finally build a stable CI/CD pipeline.",
      "was obsessed with performance, so i wrote a complete load testing strategy with k6 to make sure the API stayed fast (under 500ms) and didn't crash, even under real-world, production-scale traffic.",
      "fixed a nasty cold-start problem in azure functions by building a hybrid L1/L2 cache, which cut initial response times by over 85%.",
      "wrote custom middleware to handle API key auth, securing 100% of the data endpoints and stopping bad requests right at the start.",
      "figured out a novel way to test .NET 8 middleware when the framework itself had a limitation, allowing us to unit test 100% of our critical authentication logic (which was impossible before).",
    ],
    logo: "/telford.jpg",
    // url: "https://www.sj.com",
  },
  {
    company: "Intryc (YC W24)",
    position: "Software Engineer Intern",
    period: "Nov 2024 - Jan 2025",
    location: "London, United Kingdom",
    highlights: [
      // "Collaborated with senior developers on architectural decisions and reviews as employee #4 at an early-stage startup, establishing best practices for component development and state management in a high-impact, resource-constrained environment",

      // "Led migration from legacy components to a standardized TypeScript component library across a 50K+ LOC codebase, improving type safety and reducing technical debt",

      // "Optimized component rendering through implementation of React's useMemo and useCallback hooks, reducing unnecessary re-renders by 30%",

      // "Built workload management system featuring dynamic filtering and real-time data visualization, handling complex state updates while maintaining consistent UI/UX",

      // "Architected reusable component library using TypeScript and Remix's form handling, improving development efficiency and type safety across a 50K+ LOC codebase",

      // "Implemented advanced state management and error handling in a Remix application, utilizing React hooks and custom form stores to prevent race conditions and improve user experience",

      // "Architected debouncing mechanisms for error handling using vanilla JavaScript, demonstrating deep understanding of browser event handling and async operations",

      // "Developed reusable form components with complex state management patterns, implementing custom validation logic and error handling across multiple routes",

      // "Enhanced application routing and navigation controls using Remix's built-in features, implementing debouncing mechanisms to prevent edge-case navigation issues",

      // "Contributed to modernizing the codebase through TypeScript adoption and implementation of shared component patterns, improving maintainability across multiple applications",
      "jumped in as employee #4 at an early-stage YC startup, helping shape the architecture and coding standards from the beginning.",
      "led the migration of a 50k+ line javascript codebase to typescript, ripping out old components and cutting down on our technical debt.",
      "dug into our remix app and used useMemo and useCallback to slash unnecessary re-renders by 30%.",
      "built the entire workload management system from scratch, handling complex state updates and real-time data visualization.",
      "architected a reusable component library using typescript and remix's form handling, improving development efficiency and type safety across a 50k+ line codebase.",
    ],
    logo: "/intryc.jpg",
    url: "https://www.intryc.com",
  },
  {
    company: "Hertel",
    position: "Software Engineer Intern (Contract)",
    period: "June 2024 - Sept 2024",
    location: "Abu Dhabi, U.A.E.",
    highlights: [
      // "Led the development of migrating a large-scale ERP system from Visual Basic to ASP.NET Core and React, integrating 10+ business modules including HR, Payroll, Recruitment, CRM, and Procurement, while reducing development time by 15% through reusable component architecture",
      // "Engineered a modular full-stack React application using Styled Components and Material-UI, implementing responsive UI design ensuring seamless user experience across desktop and mobile devices during the modernization process",
      // "Optimized application performance through React Context API and custom hooks implementation, improving component render times by 20%, reducing memory usage across high-traffic modules, and decreasing component coupling by 60%",
      // "Developed an enterprise-grade data management system supporting 500+ users with real-time updates, reducing data processing time by 25% and achieving 30% reduction in data redundancy through flexible data model design",
      // "Architected a dynamic form generation system with JSON configurations and Material-UI components, standardizing data input workflows, reducing form development time by 25%, and accelerating new feature development by 40%",
      // "Architected and implemented a scalable RESTful API suite using ASP.NET Core MVC, serving 30+ business domains with comprehensive logging, monitoring, and error handling that reduced system downtime by 15% and debugging time by 35%",
      // "Designed and implemented an enterprise-wide dynamic filtering system using LINQ expression trees and optimized database queries, resulting in 25% faster load times for large datasets",
      // "Architected and implemented advanced server-side pagination system with Entity Framework Core, optimizing performance for datasets exceeding 100,000 records with response times under 500ms, reducing database load by 30%, and supporting complex sorting and filtering operations",
      // "Designed and implemented a scalable repository pattern architecture with LINQ, enabling advanced filtering capabilities and dynamic query building, resulting in 20% reduced code duplication and improved application maintainability",
      "led the development of migrating a massive, old-school ERP system from Visual Basic to a modern stack using ASP.NET Core and React.",
      "the new system i helped build brought 10+ business modules (like hr, payroll, and crm) together and handled data for over 500 users, making queries 25% faster.",
      "architected a server-side pagination system that could zip through 100,000+ records in under 500ms and cut database load by 30%.",
      "designed a dynamic filtering system that could handle complex quexries and cut load times by 25%.",
      "built a dynamic JSON-based form generator that made building new features 40% faster and standardized all our data inputs.",
    ],
    logo: "/hertel.png",
    url: "https://www.intryc.com",
  },
];
export const coursework = [
  "Engineering Mathematics",
  "Statistics and Discrete Mathematics",
  "Operating System",
  "Data Structures with C",
  "Object Oriented Programming using C++",
  "Digital Logic Design",
  "Computer Organization and Architecture",
  "Web Application Development",
  "Linear Algebra",
  "Database Management System",
  "Analysis and Design of Algorithms",
  "Java Programming",
  "Theoretical Foundations of Computations",
  "Unix System Programming",
  "Machine Learning",
  "Cloud Computing",
  "Computer Networks",
  "Advanced Python Programming",
  "Advanced Data Structures and Algorithms",
  "Cryptography and Network Security",
  "Software Testing",
  "Software Project Management and Finance",
  "Social Networking and Analysis",
  "Mobile Computing and 5G Technologies",
  "DevOps",
  "Information Security and Digital Forensics",
];

export const education = [
  {
    university: "University of Bath",
    degree: "Master of Science",
    branch: "Computer Science",
    period: "2024–2025",
    logo: "/bath.svg",
  },
  {
    university: "B.M.S. College of Engineering",
    degree: "Bachelors of Engineering",
    branch: "Information Science and Engineering",
    period: "2020–2024",
    logo: "/bms.svg",
  },
];

export const projects = [
  {
    icon: "💰",
    title: "Bill Split",
    description:
      "Cross-platform bill splitting app using Flutter, Azure Functions, and Azure Form Recognizer for accurate expense distribution and receipt scanning.",
    popupDescription:
      "Bill Split simplifies splitting expenses. It utilizes a sophisticated algorithm for fair distribution, supports multiple currencies and payment methods, and integrates Azure Functions for secure API communication. Azure Form Recognizer enables seamless receipt scanning and data extraction.",
    status: "Live",
    url: "https://apps.apple.com/gb/app/billify-smart-bill-split/id6747454007",
    technologies: [
      "Flutter",
      "Dart",
      "Azure Functions",
      "Azure Form Recognizer",
      "Node.js",
    ],
    image: "/BillSplit.webp",
  },
  {
    icon: "📄",
    title: "AIResume",
    description:
      "Chrome extension that uses AI to tailor resumes and generate cover letters with a single click, powered by a C# and .NET API backend.",
    popupDescription:
      "AIResume is a Chrome extension that leverages AI to help users quickly and easily modify their resumes to match specific job descriptions. It also generates compelling cover letters. The backend is built using C# and .NET APIs.",
    status: "Live",
    url: "https://chromewebstore.google.com/detail/ai-resume-tailor/gckmlapghemhhedhmcigalmiilifkbpb",
    technologies: ["Chrome Extension", "JavaScript", "C#", ".NET API"],
    image: "/AIResume.webp",
  },
  {
    icon: "🎬",
    title: "Ixie",
    description:
      "AI-powered movie recommendation platform using Next.js, TypeScript, and multiple AI services (Mistral, ElevenLabs, fal.ai) for personalized film discovery.",
    popupDescription:
      "Ixie is your personal movie matchmaker that curates films based on genre preferences. It uses Mistral and ElevenLabs to create narrative connections between recommended movies, making discovery feel like an adventure. Built with Next.js, TypeScript, and Tailwind, it features Clerk authentication and fal.ai for image/video generation.",
    status: "Live",
    url: "https://ixie.vercel.app",
    technologies: [
      "Next.js",
      "TypeScript",
      "Tailwind",
      "Mistral",
      "ElevenLabs",
      "fal.ai",
      "Clerk",
    ],
    image: "/ixie.png",
  },
  {
    icon: "🧠",
    title: "InsightX",
    description:
      "Video analysis web app using Large Language Models (LLMs) to extract insights from video content like lectures, interviews, and presentations.",
    popupDescription:
      "InsightX leverages the power of LLMs to analyze video content and provide users with key takeaways, summaries, and related questions. It's a valuable tool for researchers, students, and content creators seeking efficient video comprehension.",
    status: "Public",
    url: null,
    technologies: ["React", "Node.js", "LLM API"],
    image: "/InsightX.webp",
  },
  {
    icon: "🎙️",
    title: "AI Interviewer",
    description:
      "AI-powered system that conducts fair, efficient, and personalized job interviews, enhancing productivity and access at scale.",
    popupDescription:
      "AI Interviewer is an end-to-end automated interviewing system. It generates customized interview questions, conducts voice-based conversations, analyzes candidate responses, provides feedback, and produces standardized evaluation scores for recruiters.",
    status: "Live",
    url: "https://ai-interviewer-beige.vercel.app/",
    technologies: ["TypeScript", "React"],
    image: "/InterviewPal.webp",
  },
  {
    icon: "📧",
    title: "Email Asterisk Decoder",
    description:
      "Python script to predict and decode emails hidden behind asterisks for OSINT purposes.",
    popupDescription:
      "This Python script utilizes Natural Language Processing (NLP) techniques to predict and decode email addresses that have been partially obfuscated with asterisks, assisting in Open Source Intelligence (OSINT) gathering.",
    status: "Public",
    url: "https://github.com/AedenThomas/generateEmailAddress",
    technologies: ["Python", "NLP"],
    image: "/EmailDecoder.webp",
  },
  // {
  //   icon: "🏢",
  //   title: "Nedea",
  //   description:
  //     "Comprehensive ERP (Enterprise Resource Planning) React application with ASP.NET Core backend and SQL Server database, handling thousands of records efficiently.",
  //   popupDescription:
  //     "Nedea is a robust ERP system built with React for the frontend and ASP.NET Core for the backend, connected to a SQL Server database. It provides a centralized platform for managing various business processes and handles large datasets with efficient pagination and data management.",
  //   status: "In Development",
  //   url: "https://insightx.example.com",
  //   technologies: ["React", "ASP.NET Core", "C#", "SQL Server"],
  //   image: "/Nedea.webp",
  // },

  {
    icon: "📝",
    title: "Textara",
    description:
      "Text analysis and processing tool with a JavaScript frontend and a C# backend, offering features like sentiment analysis and keyword extraction.",
    popupDescription:
      "Textara provides a powerful platform for text analysis and processing. Its JavaScript frontend offers a user-friendly interface, while the C# backend handles complex NLP tasks, including sentiment analysis, keyword extraction, and text summarization.",
    status: "Live",
    url: null,
    relativePath: "textara",
    technologies: ["JavaScript", "C#", "NLP"],
    image: "/Textara.webp",
  },
  {
    icon: "📚",
    title: "StudyHub",
    description:
      "React Native app that allows users to upload syllabi and notes, providing personalized notes and animations to enhance learning.",
    popupDescription:
      "StudyHub is a mobile application built with React Native that helps students learn more effectively. Users can upload their syllabi and notes, and the app generates personalized notes and animations to make learning more engaging and interactive.",
    status: "In Development",
    url: null,
    technologies: ["React Native", "JavaScript"],
    image: "/StudyHub.png",
  },
  {
    icon: "💭",
    title: "Dream",
    description:
      "Flutter app allowing users to record, interpret, and visualize their dreams, providing a personal dream journal with insightful interpretations.",
    popupDescription:
      "Dream is a mobile application built with Flutter that enables users to log their dreams, explore potential interpretations, and create visual representations of their dream experiences. It serves as a personalized dream journal with insightful analysis.",
    status: "In Development",
    url: null,
    technologies: ["Flutter", "Dart"],
    image: "/Dream.png",
  },
  {
    icon: "🍳",
    title: "Cookify",
    description:
      "Flutter app that suggests recipes based on available ingredients, captured through image recognition, and provides detailed cooking instructions.",
    popupDescription:
      "Cookify simplifies meal planning by using image recognition to identify available ingredients and suggesting recipes accordingly. It provides step-by-step cooking instructions, making it easy to create delicious dishes with readily available ingredients.",
    status: "In Development",
    url: null,
    technologies: ["Flutter", "Dart", "Image Recognition API"],
    image: "/Cookify.png",
  },
  {
    icon: "💼",
    title: "CryptoVault",
    description:
      "JavaScript React app with a Django backend for secure text storage on the blockchain.",
    popupDescription:
      "CryptoVault provides a secure platform for storing text content on the blockchain. The frontend is built with JavaScript and React, while the backend utilizes Django and Pinata Cloud for blockchain interaction and data management.",
    status: "Public",
    url: "https://github.com/yourusername/cryptovault", // Assuming the frontend repo
    technologies: ["JavaScript", "React", "Python", "Django", "Blockchain"],
    image: "/CryptoVault.png",
  },
];

export const skills = [
  // Languages
  "Python",
  "C++",
  "C",
  "Java",
  "Dart",
  "SQL",
  "Bash",
  "CSS",
  "JavaScript",
  "C#",

  // Frameworks
  "Flutter",
  "React",
  "React Native",
  "Node.js",
  "ASP.NET Core",

  // Database
  "MySQL",
  "MongoDB",
  "SQL Server",

  // Cloud
  "Oracle Cloud",
  "Google Cloud",
  "Google Firebase",
  "Microsoft Azure",
  "Azure Functions",
  "Azure Form Recognizer",
  "Git",
  "Unix",
  "Data Structures and Algorithms",
  "Blockchain",
];
