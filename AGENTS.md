# Development Log

## 2025-01-28 - Mobile Font Size Optimization

### Problem

Fonts were too large on mobile devices, making the site difficult to read on smaller screens.

### Solution

Added responsive font sizing using Tailwind CSS breakpoint prefixes (`md:`) to all text elements across the application.

**Key Changes:**

- Main headings: `text-2xl md:text-4xl` (smaller on mobile, larger on desktop)
- Section headings: `text-base md:text-xl`
- Paragraphs: `text-sm md:text-lg`
- Smaller text: `text-xs md:text-sm` or `text-[10px] md:text-xs`
- Blog content: `prose-sm md:prose-lg`

**Files Modified:**

- `src/Home.js` - Main page with experience, education, projects, etc.
  - Experience section: position, dates, description, and highlights now use `text-xs md:text-sm`
  - Professional development section: company period and description use `text-xs md:text-sm`
- `src/Project.js` - Project cards and modals
- `src/Blog.js` - Blog listing page
- `src/BlogPost.js` - Individual blog post pages
- `src/ContactLinks.js` - Contact links and email (LinkedIn, GitHub now consistent with email)

### Implementation Details

- Used mobile-first approach: base classes are for mobile, `md:` prefix for larger screens
- Ensured all headings, paragraphs, badges, and UI elements scale appropriately
- Maintained visual hierarchy while improving readability on mobile
- All contact links (email, LinkedIn, GitHub) now consistently use `text-xs md:text-sm`
- Experience and professional development sections match side projects with `text-xs md:text-sm` for descriptions

### Dead Ends

- None encountered - straightforward responsive design implementation

### Dependencies

- Tailwind CSS for responsive utilities
- No new dependencies required

---

# Tech Stack

## Frontend

- React 18.2+
- Framer Motion - Animation library
- Tailwind CSS - Utility-first CSS framework
- React Router - Hash routing for GitHub Pages
- React Markdown - Markdown rendering

## Deployment

- GitHub Pages
- React static site

---

# Architecture Overview

## Directory Structure

```
src/
  - App.js - Main app component with routing
  - Home.js - Portfolio homepage
  - Project.js - Project card component
  - Blog.js - Blog listing page
  - BlogPost.js - Individual blog post component
  - ContactLinks.js - Contact information and links
  - AIResume.js - AI resume page
  - AIPage.js - AI chat interface
  - AnimatedGreeting.js - Animated greeting component
  - data.js - Static data (projects, experience, etc.)
  - App.css - Global styles
  - index.css - Tailwind imports and cursor styles
```

## Configuration

- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `package.json` - Dependencies and scripts

---

# Module Dependencies

## Component Relationships

- `App.js` → Main entry point, manages routing and state
  - Routes to `Home.js`, `Blog.js`, `BlogPost.js`, `AIPage.js`, etc.
- `Home.js` → Uses `Project.js`, `ContactLinks.js`, `AnimatedGreeting.js`
- `Project.js` → Self-contained project card with modal
- `Blog.js` → Displays list of blog posts
- `BlogPost.js` → Individual blog post with markdown rendering

## Data Flow

- Static data loaded from `data.js`
- Props passed down from App to child components
- State managed locally in components
- Context or props for theme (dark/light mode)

## External Integrations

- Cal.com for scheduling
- GitHub API for contribution stats (via ContactLinks)
- Markdown rendering for blog posts
