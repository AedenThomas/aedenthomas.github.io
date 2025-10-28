# Development Log

## 2025-10-28 - Project Card UI Enhancement for Mobile & Dark Mode

### Problem

Project cards appeared flat and non-interactive, especially on mobile devices where there is no cursor to indicate clickability. Dark mode styling looked muddy with gray-900 backgrounds that didn't match the site's clean, minimalist aesthetic using pure black backgrounds.

### Solution

Redesigned project cards with a modern, tactile feel inspired by Jony Ive's design philosophy - subtle depth, clear affordances, and minimalist elegance.

**Key Changes:**

1. **Added Visual Depth & Interactivity**:

   - Semi-transparent backgrounds with subtle borders that respond to hover/tap
   - Smooth transitions (300ms) for all interactive states
   - Cards lift slightly on hover (`whileHover={{ y: -2 }}`)
   - Tap feedback with scale animation (`whileTap={{ scale: 0.98 }}`)
   - Active state for mobile tap (`active:scale-[0.98]`)

2. **Dark Mode Refinement**:

   - Changed from muddy `bg-gray-900/40` to clean `bg-white/[0.02]` (2% white tint)
   - Hover state: `bg-white/[0.04]` (4% white tint)
   - Borders: `border-white/[0.08]` (8% white opacity)
   - Hover borders: `border-white/[0.15]` (15% white opacity)
   - Chevron icon: `text-white/30` for subtle but visible affordance
   - Matches the site's pure black (`#000000`) background aesthetic

3. **Light Mode Styling**:

   - Mirrored dark mode approach with subtle dark overlays (`bg-gray-900/[0.02]`)
   - Hover state: `bg-gray-900/[0.04]` for subtle feedback
   - Borders: `border-gray-900/[0.08]` matching the flat aesthetic
   - Removed all shadows to maintain flat, minimal design consistent with rest of site
   - Chevron icon: `text-gray-900/30` for subtle affordance

4. **Mobile-Specific Improvements**:
   - Added chevron arrow (`FaChevronRight`) on right side as clear "tap to view" indicator
   - Increased padding from `p-2` to `p-4` for easier touch targets
   - Increased spacing between cards (`mb-3`) for distinct, tappable objects
   - Changed layout from `items-start` to `items-center` for better visual balance

**Files Modified:**

- `src/Project.js` - Complete card styling overhaul

### Implementation Details

- Cards now feel like physical objects with depth and tactile feedback
- Dark mode uses additive white overlays instead of gray backgrounds
- All animations use Framer Motion for smooth, native-feeling interactions
- Design works seamlessly on both desktop and mobile
- Active states provide immediate feedback on touch devices

### Why This Works

- **Depth Perception**: Subtle backgrounds and borders create layering against the page background
- **Affordance**: Chevron arrow is universally understood as "tap/click here"
- **Feedback**: Immediate visual response to hover/tap confirms interactivity
- **Minimalism**: Very subtle effects (2-4% opacity) maintain clean aesthetic while adding necessary depth
- **Mobile First**: Touch targets are large, feedback is immediate, visual cues don't rely on cursor

### Dead Ends

- Initial attempt used `bg-gray-900/40` in dark mode - looked muddy and didn't match the site's pure black aesthetic
- Tried `shadow-md hover:shadow-lg` with `bg-white/60` backgrounds in light mode - looked too skeuomorphic and didn't match the flat, minimal aesthetic of the rest of the site
- Removed all shadow effects for consistency - shadows in dark mode don't show well, and shadows in light mode broke the flat design language

### Dependencies

- Framer Motion - whileHover, whileTap animations
- React Icons - FaChevronRight for visual affordance
- Tailwind CSS - opacity utilities and transition classes

---

## 2025-10-27 - Class-Based Dark Mode Fix for Mobile Overscroll

### Problem

On mobile devices (especially iOS Safari), when users scrolled beyond the page boundaries (overscroll/rubber-band effect), white space would appear at the top and bottom of the page, even in dark mode. This occurred because:

1. Background colors were set on component-level `<div>` elements using `bg-black` and `bg-[#F2F0E9]` Tailwind classes
2. The browser's rendering canvas (the `<html>` element) had no background color set
3. During overscroll, the browser would reveal the default white background of the `<html>` element
4. Component-level background colors couldn't extend beyond their containers to cover the overscroll area

This is a fundamental mobile web development issue where the background needs to be set at the document level, not the component level.

### Solution

Implemented a comprehensive class-based dark mode system that applies background colors at the `<html>` element level, ensuring the entire browser canvas (including overscroll areas) matches the current theme.

**Key Changes:**

1. **Updated `tailwind.config.js`** (already correct):

   - Confirmed `darkMode: 'class'` is set, enabling Tailwind to look for `.dark` class on HTML

2. **Set Global Styles in `src/index.css`**:

   - Applied `background-color: #F2F0E9` to the `<html>` element for light mode
   - Applied `background-color: #000000` to `html.dark` for dark mode
   - Added smooth transitions: `transition-duration: 500ms` with cubic-bezier easing
   - Set `body` and `#root` to `background-color: transparent` so they inherit from `<html>`
   - Added `height: 100%` to `body` and `#root` for proper layout

3. **Managed Dark Mode Class in `src/App.js`** (already correct):

   - Existing `useEffect` (lines 124-125) already toggles `.dark` class on `<html>` element
   - This serves as the single source of truth for dark mode state

4. **Removed Background Styles from `src/AIPage.js`** (line 390):

   - Removed `bg-black` and `bg-[#F2F0E9]` classes from main container
   - Removed `theme-transition` class
   - Removed inline `transition` styles for background-color
   - Kept only text color classes: `text-white` and `text-gray-900`
   - Container is now transparent, showing the global `<html>` background

5. **Removed Background Styles from `src/Home.js`** (line 600):
   - Removed `bg-black` and `bg-[#F2F0E9]` classes from main container
   - Removed `theme-transition` class
   - Removed inline `transition` styles for background-color
   - Kept only text color classes: `text-white` and `text-gray-900`
   - Container is now transparent, showing the global `<html>` background

### Implementation Details

- The `<html>` element now controls the entire page background color, including overscroll areas
- Smooth 500ms transitions prevent jarring theme switches
- All components are transparent by default, allowing the global background to show through
- Text colors are still managed at the component level for flexibility
- The `.dark` class on `<html>` is the single source of truth for theme state
- Desktop and mobile behavior is now consistent

### Why This Works

- The browser's rendering canvas is the `<html>` element
- During mobile overscroll, the browser reveals the `<html>` background, not component backgrounds
- By setting the background at the `<html>` level, we ensure complete coverage
- This is the standard, accepted solution for mobile overscroll background issues

### Dead Ends

- None - This is a well-established web development pattern for handling mobile overscroll

### Dependencies

- Tailwind CSS class-based dark mode support
- No new package dependencies required

---

## 2025-10-27 - Safari Mobile Scrolling Fix

### Problem

On iOS Safari, the navigation bar and tab bar would not collapse when scrolling through the chat interface. This was a classic mobile web development issue caused by having two separate scrollbars:

1. The outer container was fixed at `100vh` with `overflow: hidden`
2. The inner chat history had its own scrollable area with `flex-1 overflow-y-auto`

Since the main document never registered a scroll (because its height was fixed and scrolling was blocked), Safari saw no reason to collapse its navigation bar, reducing the available screen real estate.

### Solution

Transitioned from a "scrollable inner chat box" layout to a "full page scroll" layout by consolidating scrolling at the document level.

**Key Changes:**

1. **Removed height constraints from outer container** (`src/AIPage.js` line ~390):

   - Removed `height: "100vh"` and `overflow: "hidden"` from the main `motion.div`
   - Kept `min-h-screen` to ensure the container spans at least the viewport height

2. **Removed fixed height from chat wrapper** (`src/AIPage.js` line ~686):

   - Changed from `h-[calc(100vh-2rem)]` to no fixed height
   - Removed `overflow-hidden` class
   - Kept `flex flex-col` for layout

3. **Allowed chat history to expand page height** (`src/AIPage.js` line ~695):

   - Removed `flex-1` and `overflow-y-auto` from chat history div
   - Chat messages now push the height of the entire page instead of scrolling internally

4. **Added safe area inset padding** (`src/AIPage.js` line ~771):
   - Added `style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}` to the fixed input form
   - Ensures input sits above native browser bar when it collapses
   - Respects iOS home indicator and system UI space

### Implementation Details

- The entire page content (including chat history) now scrolls at the document level
- When users scroll, the document scroll triggers Safari's native behavior to collapse the navigation bar
- The input bar remains fixed at the bottom with safe area padding
- Desktop behavior unchanged (uses `md:relative` positioning for input)

### Dead Ends

- None - This is a well-understood mobile web development pattern

### Dependencies

- CSS environment variables (`env(safe-area-inset-bottom)`) for iOS safe area support
- No new package dependencies required

---

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
