/**
 * Font configuration for offline deployment.
 *
 * Fonts are loaded via CSS @font-face in globals.css to avoid the
 * Turbopack / next/font/local persistent cache compatibility issue.
 * Variable TTF files are served from /fonts/ directory.
 *
 * @font-face declarations are in src/app/globals.css (see "Local font faces" section).
 * This file exports an empty class name so layout.tsx doesn't inject next/font CSS vars.
 */

export const appFontVariableClassName = "";
