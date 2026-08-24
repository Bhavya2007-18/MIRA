import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sage: {
          50: '#EBF0E8',
          100: '#DCE6D7',
          200: '#C2D4BB',
          500: '#8FA382',
          600: '#738865',
          700: '#556B48',
          800: '#3D4F33',
          900: '#283622'
        },
        'pastel-blue': {
          50: '#EEF3F8',
          100: '#DDE6F0',
          200: '#BFD0E2',
          400: '#A0B2C6',
          500: '#859EBA',
          700: '#4B6584',
          800: '#364B63',
          900: '#243447'
        },
        cream: {
          50: '#FBF9F3',
          100: '#F3EFE6',
          200: '#E4DEC8',
          300: '#D3CBB3',
          400: '#B8AD91'
        },
        'gentle-pink': {
          50: '#FDF2F4',
          100: '#FAE4E7',
          200: '#F5C8CE',
          400: '#E8B4B8',
          500: '#D79398',
          700: '#A85D65',
          800: '#7A3D44'
        },
        charcoal: {
          900: '#2D3748',
          800: '#3A475A',
          700: '#4A5568',
          600: '#718096',
          500: '#A0AEC0',
          400: '#CBD5E1'
        }
      },
    },
  },
  plugins: [],
};
export default config;
