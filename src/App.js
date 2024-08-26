import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import './App.css';
import Layout from './components/Layout';
import Hero from './components/Hero';
import ProjectShowcase from './components/ProjectShowcase';
import ProjectDetails from './components/ProjectDetails';

function App() {
  const [mode, setMode] = useState('day'); // 'day' or 'night'
  const [key, setKey] = useState(0); // New state to manage re-rendering more distinctly
  const [selectedProject, setSelectedProject] = useState(null);
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: '-100px 0px',
  });

  const toggleMode = () => {
    setMode(mode === 'day' ? 'night' : 'day');
    setKey(prev => prev + 1); // Increase key to force re-render
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
  };

  const projects = [
    {
      id: 1,
      title: "MECHEAL BEAUREGARD",
      description: "NextJs, Tailwind CSS",
      imageUrl: "https://mockupcloud-themety.imgix.net/uploads/images/2024/03/12/Image0008_copy.jpg?auto=compress,format&fit=clip,max&w=1170",
      detailsText: "Your text for project 1 here",
    },
    {
      id: 2,
      title: "BILLIFY",
      description: "JS, Flutter",
      imageUrl: "https://mockupcloud-themety.imgix.net/uploads/images/2024/03/12/Image0008_copy.jpg?auto=compress,format&fit=clip,max&w=1170",
      detailsText: "Your text for project 2 here",
    },
    {
      id: 3,
      title: "BILLIFY",
      description: "JS, Flutter",
      imageUrl: "https://mockupcloud-themety.imgix.net/uploads/images/2024/03/12/Image0008_copy.jpg?auto=compress,format&fit=clip,max&w=1170",
      detailsText: "Your text for project 1 here",
    },
  ];

  const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } }
  };

  return (
    <Layout mode={mode} toggleMode={toggleMode}>
      <AnimatePresence mode="wait">
        <motion.div
          key={key} // Using the new state to ensure key changes
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeVariants}
        >
          <Hero key={key} />
          <motion.div
            id="projects"
            className="flex flex-wrap justify-center items-start mx-auto my-12 gap-x-5"
            key={key}
          >
            {projects.map((project, i) => (
              <ProjectShowcase
                key={project.id}
                title={project.title}
                description={project.description}
                imageUrl={project.imageUrl}
                onViewClick={() => handleProjectClick(project)}
              />
            ))}
          </motion.div>
          {selectedProject && (
            <ProjectDetails
              key={key}
              project={selectedProject}
              onClose={handleCloseProject}
              detailsText={selectedProject.detailsText}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default App;