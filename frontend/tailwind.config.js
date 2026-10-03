/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // A warm-Mediterranean palette grounded in real local color, not a
        // generic "cream + one accent" formula -- each hue has a specific
        // job (see constants/categories.js for how categories map onto
        // these) rather than being decorative.
        ink: {
          // Deep sea-at-dusk teal -- replaces near-black for dark
          // surfaces (nav text, the organizer sidebar, body text).
          DEFAULT: '#1B3A3E',
          50: '#EEF3F3', 100: '#D7E3E3', 200: '#AFC7C7', 300: '#87AAAA',
          400: '#5F8E8E', 500: '#3C6F6F', 600: '#2A5355', 700: '#1B3A3E',
          800: '#132B2E', 900: '#0C1C1E',
        },
        clay: {
          // Terracotta -- the primary brand/CTA color, also Food & Dining.
          DEFAULT: '#C1552C',
          50: '#FBEEE7', 100: '#F5D5C2', 200: '#EBAE8B', 300: '#DF8757',
          400: '#D16F3C', 500: '#C1552C', 600: '#A4451F', 700: '#7F3518',
          800: '#5B2611', 900: '#3B180A',
        },
        citrus: {
          // Amber-gold -- Music & Concerts, stars/highlights.
          DEFAULT: '#E3A33D',
          50: '#FDF5E8', 100: '#FAE6C3', 200: '#F4CD87', 300: '#EDB45A',
          400: '#E3A33D', 500: '#CB8A26', 600: '#A66E1D', 700: '#7E5316',
          800: '#573A0F', 900: '#332209',
        },
        olive: {
          // Muted olive-green -- Outdoor & Hiking.
          DEFAULT: '#74793E',
          50: '#F2F3EA', 100: '#DFE1C9', 200: '#C0C495', 300: '#A3A86C',
          400: '#898F4F', 500: '#74793E', 600: '#5C6031', 700: '#444724',
          800: '#2D2F17', 900: '#17180B',
        },
        sea: {
          // Teal-blue -- Sports & Fitness, informational accents/links.
          DEFAULT: '#2E7A86',
          50: '#EAF4F5', 100: '#C7E2E6', 200: '#92C4CB', 300: '#5FA6B0',
          400: '#3D8C98', 500: '#2E7A86', 600: '#24626B', 700: '#1B4A51',
          800: '#123237', 900: '#09191C',
        },
        wine: {
          // Deep plum-wine -- Arts & Culture (deep tint) and Beauty &
          // Wellness (light tint) share this family, distinguished by
          // shade + icon rather than by an arbitrary unrelated hue.
          DEFAULT: '#7C3B4C',
          50: '#F3E9EB', 100: '#E1C3CA', 200: '#C48C9B', 300: '#A6586F',
          400: '#8E4759', 500: '#7C3B4C', 600: '#622F3D', 700: '#49232D',
          800: '#31171E', 900: '#180B0F',
        },
        coral: {
          // Vivid warm coral -- Nightlife & Parties.
          DEFAULT: '#E8604A',
          50: '#FDEEEB', 100: '#FAD1C7', 200: '#F4A592', 300: '#EE795E',
          400: '#EA6E51', 500: '#E8604A', 600: '#C8472F', 700: '#983624',
          800: '#682518', 900: '#38140D',
        },
        sand: '#F6EEE0',
      },
      fontFamily: {
        // Fraunces carries the "warm, editorial, boutique Mediterranean"
        // personality for headlines; Figtree is a rounder, friendlier
        // humanist sans for body/UI text. Both load via Google Fonts in
        // index.html, no extra npm package.
        display: ['"Fraunces"', 'serif'],
        sans: ['"Figtree"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
