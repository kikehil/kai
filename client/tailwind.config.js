/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'oxxo-red': '#ED1C24',        // OXXO Official Red
                'oxxo-red-dark': '#C41119',   // Darker red for depth
                'oxxo-yellow': '#FFF200',     // OXXO Official Yellow
                'oxxo-yellow-glow': '#FFFF66', // Lighter for neon effects
                'dark-gray': '#0A0A0A',       // Deep black background
                'dark-gray-800': '#1A1A1A',   // Card backgrounds
                'dark-gray-700': '#2A2A2A',   // Lighter panels
                'neon-red': '#FF3B47',        // Red glow
                'neon-yellow': '#FFE600',     // Yellow glow
            },
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
            },
            animation: {
                'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
