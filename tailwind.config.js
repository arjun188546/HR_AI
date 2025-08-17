/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...existing code...
  plugins: [
    require("tailwindcss-animate"),
    require("tailwind-scrollbar"), // <-- ADD THIS LINE
  ],
}