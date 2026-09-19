import {
  education,
  projects,
  skills,
  research,
  coursework,
  experience,
  notableInteractions,
  hackathons,
} from './data';

const plain = (text) =>
  (text || '')
    .replace(/\*\*/g, '')
    .replace(/\\n/g, '\n')
    .trim();

// Single source of truth for the plain-text ("machine mode") rendering of the
// site. Used by MachineMode's copy button and by scripts/generate-llms-txt.js
// to produce public/llms.txt at build time.
export function buildLlmsText({ email, linkedinUrl, githubUrl }) {
  const lines = [];

  lines.push('# Aeden Geo Thomas');
  lines.push('Software Engineer | Full-Stack Developer\n');

  lines.push('## Contact');
  lines.push(`- Email: ${email}`);
  lines.push(`- LinkedIn: ${linkedinUrl}`);
  lines.push(`- GitHub: ${githubUrl}`);
  lines.push('- Website: https://aeden.me\n');

  lines.push('## Experience');
  experience.forEach((exp) => {
    lines.push(`### ${exp.company}`);
    lines.push(`**${exp.position}** | ${exp.period}`);
    if (exp.location) lines.push(`${exp.location}`);
    if (exp.description) lines.push(`${exp.description}`);
    exp.highlights.forEach((h) => lines.push(`- ${h}`));
    lines.push('');
  });

  lines.push('## Professional Development');
  notableInteractions.forEach((interaction) => {
    lines.push(`### ${interaction.company}`);
    lines.push(`*${interaction.period}*`);
    lines.push(`${plain(interaction.description)}\n`);
  });

  lines.push('## Hackathons');
  hackathons.forEach((h) => {
    lines.push(`### ${h.title}`);
    if (h.period) lines.push(`*${h.period}*`);
    lines.push(`Won ${(h.awards || []).join(' and ')} at ${h.event} for ${h.description}`);
    if (h.url) lines.push(`[View Submission](${h.url})`);
    lines.push('');
  });

  lines.push('## Projects');
  projects.forEach((p) => {
    lines.push(`### ${p.title} ${p.status === 'Live' ? '🟢' : p.status === 'Public' ? '📂' : '🔧'}`);
    lines.push(`${plain(p.description)}`);
    if (p.url) lines.push(`[View Project](${p.url})`);
    lines.push(`Technologies: ${p.technologies.join(', ')}\n`);
  });

  lines.push('## Skills\n' + skills.join(' • ') + '\n');

  lines.push('## Education');
  education.forEach((e) => {
    lines.push(`### ${e.university}\n${e.degree} in ${e.branch}\n*${e.period}*\n`);
  });

  lines.push('## Research & Publications');
  research.forEach((pub) => {
    lines.push(`### ${pub.title}`);
    lines.push(`${pub.authors}`);
    lines.push(`*${pub.journal}, ${pub.year}*`);
    if (pub.doi) lines.push(`DOI: ${pub.doi}`);
    lines.push('');
  });

  lines.push('## Relevant Coursework\n' + coursework.join(' • ') + '\n');

  return lines.join('\n');
}

export const contact = {
  email: 'hey@aeden.me',
  linkedinUrl: 'https://www.linkedin.com/in/aedenthomas/',
  githubUrl: 'https://github.com/AedenThomas/',
};
