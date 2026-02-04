# AGENTS.md - Halftone Studio

This file provides guidelines for AI agents working on the Halftone Studio codebase.

## Overview

Halftone Studio is a vanilla HTML/CSS/JS web application for creating halftone, ASCII art, and other image effects. The project uses CDN dependencies (Tailwind CSS, gif.js) and requires no build step for development.

## Build, Lint, and Test Commands

### Development

```bash
# Open in browser - simply open index.html directly
start index.html

# For Vercel deployment, ensure all files are committed:
git add .
git commit -m "Your commit message"
git push
```

### No Build Required

This project is a static site. Open `index.html` directly in any browser - no build step, no compilation, no bundling required.

### Testing in Browser

```bash
# 1. Open index.html in browser
# 2. Upload an image
# 3. Test all 5 modes: classic, rgb, led, squares, ascii
# 4. Test animation toggle
# 5. Test PNG and GIF export
# 6. Test reset functionality
# 7. Test language switching (RU/EN)
```

### Running Specific Feature Tests

To test a single feature, manually interact with the UI:
- **ASCII Art mode**: Click "ASCII Art" button, verify colored character rendering
- **Animation**: Toggle animation switch, verify smooth pulsing effect
- **GIF Export**: Click "Export GIF", verify download starts
- **Reset**: Change parameters, click Reset, verify only params reset (not mode/image)
- **Language**: Toggle RU/EN, verify all text translates correctly

## Code Style Guidelines

### General Principles

- Keep it simple - this is a vanilla JS project, avoid over-engineering
- No external build tools or bundlers required
- Use modern JavaScript (ES6+) features
- Single responsibility per function

### File Structure

- `index.html` - DOM structure only, minimal inline content
- `style.css` - All styling (Tailwind classes for layout, custom CSS for components)
- `script.js` - All application logic

### Naming Conventions

```javascript
// Variables: camelCase
let originalImage = null;
let currentMode = 'classic';

// Constants: UPPER_SNAKE_CASE or camelCase with k prefix
const MAX_DIM = 1000;
const asciiChars = ' @%#*+=-:. ';

// DOM elements: descriptive names with type hint
const canvas = document.getElementById('mainCanvas');
const resInput = document.getElementById('resolution');

// Functions: camelCase, descriptive verbs
function render(time = 0) { ... }
function setMode(mode) { ... }
function createGifWorkerBlob() { ... }
```

### HTML Structure

- Use semantic HTML5 elements
- Tailwind CSS classes for styling (utility-first approach)
- Custom CSS only for components not covered by Tailwind
- Inline SVGs for icons (no external icon libraries)

### CSS Guidelines

- Define CSS variables for colors (Material Design 3 palette)
- Use Tailwind for layout and spacing
- Custom CSS for:
  - Material Design component styles (buttons, cards)
  - Animation transitions
  - Canvas viewport styling
  - Language switcher active states

### JavaScript Guidelines

#### State Management

```javascript
// Use module-level variables for app state
let originalImage = null;
let currentMode = 'classic';
let isAnimating = false;
let currentLang = localStorage.getItem('lang') || 'ru';
```

#### Event Handling

```javascript
// Use addEventListener, not inline handlers (except setMode, setLang)
element.addEventListener('click', handler);
```

#### Canvas Rendering

```javascript
// Always set canvas dimensions before drawing
canvas.width = width;
canvas.height = height;

// Use willReadFrequently for better performance
const ctx = canvas.getContext('2d', { willReadFrequently: true });
```

#### Animation

```javascript
// Use requestAnimationFrame for smooth animations
function animate() {
    if (!isAnimating) return;
    animFrame += 0.05;
    render(animFrame);
    requestAnimationFrame(animate);
}
```

#### i18n (Internationalization)

```javascript
// Store translations as object keyed by language
const translations = {
    ru: { ... },
    en: { ... }
};

// Use localStorage to persist language choice
localStorage.setItem('lang', lang);
```

### Error Handling

- Wrap async operations in try/catch where appropriate
- Provide user feedback via UI (status messages)
- Gracefully handle missing images or cancelled uploads
- GIF export errors should show progress UI reset

### Performance Considerations

- Limit canvas maximum dimension (1000px) for large images
- Use `willReadFrequently: true` for canvas operations
- Debounce slider inputs if rendering is slow
- Use `copy: true` when adding frames to GIF

### Accessibility

- All interactive elements should have clear labels
- Status messages should be announced to screen readers
- Color contrast should meet WCAG guidelines
- Keyboard navigation for mode switching

### Git Workflow

```bash
# Create feature branch for new features
git checkout -b feature/ascii-art

# Commit frequently with clear messages
git commit -m "Add ASCII art mode with color support"

# Push and create PR when ready
git push -u origin feature/ascii-art
```

## Vercel Deployment

This project deploys automatically to Vercel:
1. Push to GitHub repository
2. Vercel detects static site
3. All 3 files (index.html, style.css, script.js) are served
4. CDN dependencies load from public URLs

No vercel.json configuration required for this simple setup.

## Notes for AI Agents

- Do not add build tools (Webpack, Vite, etc.) without explicit request
- Do not add TypeScript unless requested - this is vanilla JS
- Maintain Material Design 3 aesthetic if adding new components
- Test all features in browser before marking tasks complete
- Preserve backward compatibility when adding features

UQDcHHagd9JOjbzQXNBv8izXtHPK8DxGWfBG757Qu97-bv-Y этой мой кошелек TON
2PJSu4tERkb7oXonMpbTC5UyJXwHMxbu1TugV3td9Swy - это мой кошелек SOL
