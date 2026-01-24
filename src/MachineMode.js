import React, { useMemo } from 'react';
import { copyToClipboard } from './utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  education,
  projects,
  skills,
  research,
  coursework,
  experience,
} from './data';

const renderDescription = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

function MachineMode({ email, linkedinUrl, githubUrl, isDarkMode }) {
  const [isCopied, setIsCopied] = React.useState(false);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    },
  };

  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const dimColor = isDarkMode ? 'text-gray-500' : 'text-gray-500';

  // Re-implement markdown generation for the copy button
  const markdownContent = useMemo(() => {
    const lines = [];
    lines.push('# Aeden Geo Thomas');
    lines.push('Software Engineer | Full-Stack Developer\n');
    lines.push('## Contact');
    lines.push(`- Email: ${email}`);
    lines.push(`- LinkedIn: ${linkedinUrl}`);
    lines.push(`- GitHub: ${githubUrl}`);
    lines.push(`- Website: https://aeden.me\n`);
    lines.push('## Experience');
    experience.forEach(exp => {
      lines.push(`### ${exp.company}`);
      lines.push(`**${exp.position}** | ${exp.period}`);
      lines.push(`${exp.location}`);
      lines.push(`${exp.description}`);
      exp.highlights.forEach(h => lines.push(`- ${h}`));
      lines.push('');
    });
    lines.push('## Projects');
    projects.forEach(p => {
      lines.push(`### ${p.title} ${p.status === 'Live' ? '🟢' : '🔧'}`);
      lines.push(`${p.description}`);
      if (p.url) lines.push(`[View Project](${p.url})`);
      lines.push(`Technologies: ${p.technologies.join(', ')}\n`);
    });
    lines.push('## Skills\n' + skills.join(' • ') + '\n');
    lines.push('## Education');
    education.forEach(e => {
      lines.push(`### ${e.university}\n${e.degree} in ${e.branch}\n*${e.period}*\n`);
    });
    return lines.join('\n');
  }, [email, linkedinUrl, githubUrl]);

  return (
    <motion.div
      className={`min-h-screen md:p-8 pt-24 pb-24 font-mono ${textColor} break-words w-full`}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <section>
          <div className="flex items-baseline gap-2">
            <span className={dimColor}>#</span>
            <motion.h1 layoutId="hero-name" className="text-xl md:text-2xl font-bold inline-block">
              Aeden Geo Thomas
            </motion.h1>
          </div>
          <motion.p variants={itemVariants} className="mt-2">Software Engineer | Full-Stack Developer</motion.p>
        </section>

        {/* Contact */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${dimColor}`}>## Contact</h2>
          <motion.div variants={itemVariants} className="space-y-1 text-sm break-all">
            <div>- Email: {email}</div>
            <div>- LinkedIn: {linkedinUrl}</div>
            <div>- GitHub: {githubUrl}</div>
            <div>- Website: https://aeden.me</div>
          </motion.div>
        </section>

        {/* Experience */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${dimColor}`}>## Experience</h2>
          <div className="space-y-6">
            {experience.map((exp, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className={dimColor}>###</span>
                  <motion.h3 
                    layoutId={`exp-company-${index}`} 
                    className="font-bold text-lg inline-block"
                  >
                    {exp.company}
                  </motion.h3>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className={dimColor}>**</span>
                    <motion.span layoutId={`exp-pos-${index}`} className="font-semibold">
                      {exp.position}
                    </motion.span>
                    <span className={dimColor}>**</span>
                  </div>
                  <span className={dimColor}>| </span>
                  <motion.span layoutId={`exp-period-${index}`} className="inline-block">{exp.period}</motion.span>
                </div>
                
                <div className={`text-sm italic ${dimColor}`}>
                  <motion.span layoutId={`exp-location-${index}`} className="inline-block">{exp.location}</motion.span>
                </div>
                
                <motion.p 
                  layoutId={`exp-desc-${index}`}
                  className={`text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                   {exp.description}
                </motion.p>
                
                <ul className="list-none pl-4 mt-2 space-y-1">
                  {exp.highlights.map((highlight, i) => (
                    <motion.li 
                      key={i} 
                      layoutId={`exp-point-${index}-${i}`}
                      className="text-sm flex gap-2"
                    >
                      <span className={dimColor}>-</span>
                      <span>{highlight}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${dimColor}`}>## Projects</h2>
          <div className="space-y-6">
            {projects.map((project, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className={dimColor}>###</span>
                  <span>{project.icon}</span>
                  <motion.h3 
                    layoutId={`proj-title-${index}`} 
                    className="font-bold text-lg inline-block"
                  >
                    {project.title}
                  </motion.h3>
                  <span className={`text-xs border px-1 rounded ${dimColor}`}>
                    {project.status === 'Live' ? '🟢' : project.status === 'Public' ? '📂' : '🔧'}
                  </span>
                </div>
                
                <motion.p 
                  layoutId={`proj-desc-${index}`}
                  className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {renderDescription(project.description)}
                </motion.p>
                
                {project.url && (
                   <motion.div variants={itemVariants} className="text-sm break-all">
                     <span className={dimColor}>[</span>
                     <span className="underline">View Project</span>
                     <span className={dimColor}>]({project.url})</span>
                   </motion.div>
                )}
                
                <motion.div variants={itemVariants} className={`text-sm ${dimColor}`}>
                   Technologies: {project.technologies.join(', ')}
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${dimColor}`}>## Skills</h2>
          <motion.div variants={itemVariants} className="text-sm leading-relaxed">
            {skills.join(' • ')}
          </motion.div>
        </section>

        {/* Education */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${dimColor}`}>## Education</h2>
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className={dimColor}>###</span>
                  <h3 className="font-bold">{edu.university}</h3>
                </div>
                <div className="text-sm">
                  {edu.degree} in {edu.branch}
                </div>
                <div className={`text-sm italic ${dimColor}`}>*{edu.period}*</div>
              </div>
            ))}
          </div>
        </section>

        {/* Research */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${dimColor}`}>## Research & Publications</h2>
          <div className="space-y-4">
            {research.map((pub, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className={dimColor}>###</span>
                  <h3 className="font-bold">{pub.title}</h3>
                </div>
                <div className="text-sm">{pub.authors}</div>
                <div className={`text-sm italic ${dimColor}`}>{pub.journal}, {pub.year}</div>
                {pub.doi && (
                  <div className={`text-sm ${dimColor}`}>DOI: {pub.doi}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Coursework */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${dimColor}`}>## Relevant Coursework</h2>
          <motion.div variants={itemVariants} className="text-sm leading-relaxed">
            {coursework.join(' • ')}
          </motion.div>
        </section>

      </div>

      {/* Copy Button */}
      <motion.button
          className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg backdrop-blur-md border transition-all z-50 ${
            isCopied
              ? 'bg-green-500 border-green-600 text-white'
              : isDarkMode 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-black text-white hover:bg-gray-800'
          }`}
          onClick={async () => {
            await copyToClipboard(markdownContent);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          title={isCopied ? "Copied!" : "Copy Markdown"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isCopied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 45, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0, rotate: 45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: -45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

export default MachineMode;
