# Prompt Instructions: DOT Placard Scanner Web App

## Project Overview
Create a mobile-first Progressive Web App (PWA) called "Placard Scanner" that allows users to photograph DOT hazmat placards or manually enter UN/NA numbers to retrieve hazardous material information, safety pictograms, and Safety Data Sheet links.

## Repository Setup
- **Repo Name:** `Placard_Scanner`
- **Hosting:** GitHub Pages (deploy from `/docs` folder or root)
- **No build tools required** - pure HTML, CSS, and vanilla JavaScript

## File Structure
```
Placard_Scanner/
├── index.html
├── styles.css
├── app.js
├── placard-data.js
├── favicon.png
└── README.md
```

## Core Features

### 1. Camera Capture & OCR
- Access device camera (prefer rear/environment camera)
- Display live camera feed with alignment guide overlay
- Capture photo and extract 4-digit UN/NA numbers using Tesseract.js OCR
- Show processing spinner with progress percentage during OCR

### 2. Manual UN Number Entry
- Text input field for 4-digit UN/NA numbers (numeric only)
- "Look Up" button to search
- Accept any valid 4-digit number

### 3. UN Number Lookup (3-tier approach)
- **Local database first:** Check `UN_NUMBERS` object for instant results
- **External API fallback:** Try Canada ERG API (`https://wwwapps.tc.gc.ca/Saf-Sec-Sur/3/erg-gmu/api/un/{number}`)
- **PubChem fallback:** Try NIH PubChem API (`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/UN{number}/property/Title,MolecularFormula/JSON`)
- **Final fallback:** Show UN number with lookup links if APIs fail

### 4. Results Display
- **Substance Card:** Name, UN number badge, hazard class with color-coded badge
- **ERG Guide number** if available
- **Secondary hazards** if applicable
- **API source indicator** (green badge) when data comes from external API
- **Warning banner** for unknown substances with lookup links

### 5. GHS Pictograms Section
- Display relevant hazard pictograms with SVG icons
- Show pictogram name, meaning, and precautions for each

### 6. Safety Data Sheet Links
- Fisher Scientific SDS search
- Sigma-Aldrich SDS search
- CAMEO Chemicals (NOAA) search
- ERG Guide link
- NIOSH Pocket Guide search
- For unknown UN numbers: Use UN-number-specific search URLs

### 7. Share/Export Features
- Email details via `mailto:` link with formatted body
- Copy to clipboard functionality
- "Scan Another" button to reset

### 8. Theme Toggle
- Dark mode (default) and light mode
- Persist preference in localStorage
- CSS custom properties for theming

## Technical Requirements

### Dependencies (CDN)
```html
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js" defer></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
```

### CSS Features
- Mobile-first responsive design (max-width: 600px container)
- CSS custom properties for theming (dark/light)
- Smooth transitions and hover effects
- Color-coded hazard class badges
- Toast notifications
- Centered camera placeholder with absolute positioning

### JavaScript Requirements
- Use `var` and ES5 syntax for maximum compatibility
- Wrap in `DOMContentLoaded` event with `'use strict'`
- No module imports - use global variables across script files

## Data Structures

### HAZARD_CLASSES Object
Map hazard class codes (1, 2.1, 2.2, 2.3, 3, 4.1, etc.) to:
- `name`: Full class name
- `color`: Hex color for badges
- `icon`: Pictogram key reference

### GHS_PICTOGRAMS Object
Map pictogram keys to:
- `name`: Display name
- `meaning`: What the pictogram indicates
- `precautions`: Array of safety precautions

### UN_NUMBERS Object
Map 4-digit UN numbers to:
- `name`: Substance name
- `class`: Primary hazard class
- `sds`: SDS search key
- `guide`: ERG guide number (optional)
- `secondaryHazard`: Array of additional hazard classes (optional)

Include at minimum these common UN numbers:
- 1001 (Acetylene), 1005 (Ammonia), 1017 (Chlorine)
- 1075 (LPG), 1090 (Acetone), 1170 (Ethanol)
- 1202 (Diesel), 1203 (Gasoline), 1210 (Printing ink)
- 1230 (Methanol), 1267 (Crude oil), 1789 (Hydrochloric acid)
- 1830 (Sulfuric acid), 1978 (Propane), 1993 (Flammable liquid n.o.s.)
- 2794/2795/2796 (Batteries), 3480/3481 (Lithium batteries)
- Plus ~80 more common hazmat substances

## UI Components

### Views (toggle visibility)
1. **Scanner View:** Camera + manual entry
2. **Processing View:** Spinner + progress text
3. **Results View:** All result cards
4. **Not Found View:** Error message + retry button

### Color Scheme (Dark Theme)
```css
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--bg-card: #1e293b;
--text-primary: #f1f5f9;
--text-secondary: #94a3b8;
--accent: #f59e0b;
--danger: #ef4444;
--success: #22c55e;
--info: #3b82f6;
```

## Mobile Optimizations
- `user-scalable=no` viewport meta
- `inputmode="numeric"` for UN input
- Touch-friendly button sizes (min 44px)
- `playsinline` attribute on video element
- Prefer `facingMode: 'environment'` for camera

## Cache Busting
Add version query strings to CSS/JS references:
```html
<link rel="stylesheet" href="styles.css?v=1">
<script src="app.js?v=1"></script>
```

## README Content
Include:
- App description and purpose
- How to use (camera vs manual entry)
- Supported UN number sources
- Link to live demo on GitHub Pages
- License (MIT or similar)

---

This prompt will generate a fully functional, standalone placard scanner app ready for GitHub Pages deployment.
