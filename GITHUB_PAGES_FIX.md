# GitHub Pages subfolder fix

These are relative-path fixes. They work at both:
- https://hartjeremy.github.io/ACC-behind-the-scene/
- https://hartjeremy.github.io/acc-bts/

Replace these four files on GitHub, preserving their locations:
- `index.html` at the repository root
- `manifest.webmanifest` at the repository root
- `sw.js` at the repository root
- `src/app.js` inside the `src` folder

The rest of the package is unchanged from version 3.

**Important:** The PWA can show local-demo data without Supabase. It will not sync between devices until cloud configuration and database setup are complete.
