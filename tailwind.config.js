/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './components-hub/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Critical layout classes that must always be generated
    'hidden', 'flex', 'block',
    { pattern: /^md:(flex|hidden|block|ml-|pt-|flex-)/ },
    { pattern: /^lg:(flex|hidden|block|ml-)/ },
  ],
  theme: {
    extend: {
      spacing: {
        '70': '17.5rem',  // 280px — sidebar width
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
