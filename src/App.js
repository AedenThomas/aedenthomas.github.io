import React, { useState } from 'react';
import { motion } from 'framer-motion';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const projects = [
    {
      icon: "?",
      title: "the web starter kit",
      description: "coming soon.",
      status: "Soon"
    },
    {
      icon: "👾",
      title: "uilabs",
      description: "I share UI experiments and components I code.",
      status: "Live"
    },
    {
      icon: "■",
      title: "ui engineering 101 for designers",
      description: "I teach designers how to build polished components.",
      status: "Live"
    }
  ];

  const collaborators = [
    "@emilkowalski_", "@shadcn", "@fat", "@mdo", "@shuding_", "@alexanton",
    "@jaredpalmer", "@jjcrosby", "@pixeljanitor", "@almonk", "@sklcrn",
    "@sambecker", "@max_leiter", "@welirabbit_", "@joeungraceyun", "@nandafyi"
  ];

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <span className="text-4xl mb-4">🕹️</span>
          <h1 className="text-4xl font-bold mb-4">
            I'm a software designer building things for the web.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Currently Staff Product Designer designing and coding Pierre, the new way to build software.
            Prior Senior Product Designer at Vercel, leading product design for AI and Marketplace. I'm
            passionate about UI engineering, so I spend a lot of time coding and crafting my own work,
            creating tools that empower people to express themselves in the world.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-gray-400">~/side projects</h2>
          {projects.map((project, index) => (
            <motion.div
              key={index}
              className="flex items-center mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="text-2xl mr-4">{project.icon}</span>
              <div className="flex-grow">
                <h3 className="font-semibold">{project.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
              </div>
              <span className={`text-sm ${project.status === 'Live' ? 'text-green-500' : 'text-gray-500'}`}>
                • {project.status}
              </span>
            </motion.div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-gray-400">~/some amazing people I have collaborated with</h2>
          <div className="flex flex-wrap gap-2">
            {collaborators.map((collaborator, index) => (
              <motion.span
                key={index}
                className="bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {collaborator}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
