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
    status: "Coming Soon",
    // url: "https://apps.apple.com/us/app/google-family-link/id1150085200",
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
  {
    icon: "🏢",
    title: "Nedea",
    description:
      "Comprehensive ERP (Enterprise Resource Planning) React application with ASP.NET Core backend and SQL Server database, handling thousands of records efficiently.",
    popupDescription:
      "Nedea is a robust ERP system built with React for the frontend and ASP.NET Core for the backend, connected to a SQL Server database. It provides a centralized platform for managing various business processes and handles large datasets with efficient pagination and data management.",
    status: "In Development",
    url: "https://insightx.example.com",
    technologies: ["React", "ASP.NET Core", "C#", "SQL Server"],
    image: "/Nedea.webp",
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
