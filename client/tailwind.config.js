/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'oxxo-red': '#E51A22',
                'oxxo-yellow': '#FFF200',
                'dark-gray': '#1A1A1A',
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
