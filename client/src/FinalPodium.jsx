import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

function FinalPodium({ ranking, onRestart }) {
    useEffect(() => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#ED1C24', '#FFF200', '#FFFFFF']
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#ED1C24', '#FFF200', '#FFFFFF']
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    // Show top 3 or all if less than 3
    const topWinners = ranking.slice(0, 3);

    return (
        <div className="fixed inset-0 bg-gray-50 z-[100] flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-oxxo-yellow"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-oxxo-red/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-oxxo-yellow/10 rounded-full blur-[120px]"></div>

            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-12 text-center"
            >
                <img src="/logo2.svg" alt="OXXO Quiz Logo" className="h-24 mx-auto mb-6 drop-shadow-md logo-zuynch" />
                <h1 className="text-6xl font-black text-oxxo-red tracking-tight uppercase">
                    ¡TOP GANADORES!
                </h1>
                <div className="h-2 w-48 bg-oxxo-yellow mx-auto rounded-full mt-2"></div>
            </motion.div>

            <div className="w-full max-w-4xl flex flex-col items-center gap-6 pb-24">
                {topWinners.length > 0 ? (
                    topWinners.map((user, index) => (
                        <motion.div
                            key={user.id || index}
                            initial={{ scale: 0, x: -50 }}
                            animate={{ scale: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.2 }}
                            className={`bg-white border-4 p-8 rounded-[3rem] flex items-center gap-10 shadow-2xl w-full max-w-2xl group transition-all ${index === 0 ? 'border-oxxo-red' : 'border-gray-100 hover:border-oxxo-red/50'}`}
                        >
                            <div className={`w-24 h-24 rounded-[1.5rem] flex items-center justify-center text-5xl font-black shadow-lg ${index === 0 ? 'bg-oxxo-yellow text-black border-4 border-white' : 'bg-gray-50 text-dark-gray'}`}>
                                {index + 1}°
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="text-3xl font-black text-dark-gray uppercase tracking-tighter truncate">{user.username}</span>
                                <span className="text-oxxo-red font-black text-4xl leading-none">
                                    {user.score} <span className="text-sm uppercase text-gray-400 font-bold ml-1 tracking-widest">Puntos</span>
                                </span>
                            </div>
                            {index === 0 && <span className="text-6xl animate-bounce">👑</span>}
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center p-20 opacity-20 italic font-black text-4xl uppercase tracking-tighter">
                        No hay resultados registrados todavía
                    </div>
                )}
            </div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                onClick={onRestart}
                className="absolute bottom-10 bg-dark-gray text-white font-black py-5 px-16 rounded-full shadow-2xl border-b-8 border-oxxo-red hover:scale-110 active:scale-95 transition-all uppercase tracking-widest text-lg"
            >
                SALIR DE OXXO QUIZ
            </motion.button>
        </div>
    );
}

export default FinalPodium;
