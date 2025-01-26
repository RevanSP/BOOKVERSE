/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
];
export const theme = {
  extend: {
    colors: {
      background: "var(--background)",
      foreground: "var(--foreground)",
      green: "#01D861",
    },
  },
};
export const plugins = [
  require('daisyui') 
];
export const daisyui = {
  themes: ["lofi", "black"]
};
