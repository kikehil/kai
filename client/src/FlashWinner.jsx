import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FlashWinner = ({ winner, onComplete }) => {
    useEffect(() => {
        if (winner) {
            const timer = setTimeout(() => {
                onComplete();
            }, 6000); // Display for 6 seconds
            return () => clearTimeout(timer);
        }
    }, [winner, onComplete]);

    if (!winner) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center overflow-hidden"
            >
                {/* Background Lightning Flash */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0, 1, 0.5] }}
                    transition={{ duration: 0.5, times: [0, 0.2, 0.4, 0.6, 1] }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                    <svg className="h-[120vh] text-oxxo-yellow drop-shadow-[0_0_50px_rgba(255,242,0,0.8)]" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M40 0 L30 45 L60 45 L50 100 L80 35 L55 35 L65 0 Z" fill="currentColor" />
                    </svg>
                </motion.div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center p-6">
                    <img src="/logo2.svg" className="h-24 mb-8 logo-zuynch drop-shadow-[0_0_20px_rgba(255,242,0,0.8)]" alt="OXXO Quiz Logo" />

                    <motion.h2
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-white text-3xl md:text-4xl font-bold uppercase tracking-widest mb-2"
                    >
                        ¡Conectado a la velocidad del rayo!
                    </motion.h2>

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.6 }}
                        className="bg-oxxo-red/20 border-4 border-oxxo-yellow px-12 py-8 rounded-3xl backdrop-blur-md shadow-[0_0_40px_rgba(229,26,34,0.6)] my-8 animate-vibrate"
                    >
                        <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] font-montserrat">
                            {winner.username}
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-oxxo-yellow text-2xl md:text-3xl font-bold bg-black/50 px-6 py-2 rounded-full border border-oxxo-yellow"
                    >
                        ⚡ ¡Respondió en solo {winner.time}s!
                    </motion.p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FlashWinner;
