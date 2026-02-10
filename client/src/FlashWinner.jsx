import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function FlashWinner({ winner, onComplete }) {
    if (!winner) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/95 backdrop-blur-sm"
            >
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-oxxo-yellow/20 to-transparent pointer-events-none"></div>

                {/* Lightning Bolt Background Effect */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                    className="absolute inset-0 flex items-center justify-center text-[40rem] text-oxxo-yellow opacity-20 pointer-events-none select-none"
                >
                    ⚡
                </motion.div>

                <div className="relative z-10 text-center flex flex-col items-center max-w-2xl w-full">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                        className="bg-white p-12 rounded-[4rem] border-[12px] border-oxxo-red shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-4 bg-oxxo-yellow"></div>

                        <img src="/logo2.svg" alt="OXXO Quiz Logo" className="h-32 mb-10 logo-zuynch drop-shadow-md mx-auto" />

                        <motion.h2
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-oxxo-red text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4"
                        >
                            ¡VELOCIDAD OXXO!
                        </motion.h2>

                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-col items-center"
                        >
                            <p className="text-gray-400 font-black text-xl mb-4 tracking-widest uppercase">EL GANADOR ES:</p>
                            <div className="bg-dark-gray text-white text-5xl md:text-7xl font-black p-10 rounded-[2.5rem] shadow-2xl border-b-8 border-oxxo-yellow min-w-[300px] mb-8 uppercase tracking-tighter">
                                {winner.username}
                            </div>

                            <div className="text-oxxo-red font-black text-3xl flex items-center gap-3">
                                <span className="text-4xl">⚡</span>
                                🔌 ENERGÍA AL 100%
                                <span className="text-4xl">⚡</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        onClick={onComplete}
                        className="mt-12 bg-oxxo-red text-white py-5 px-16 rounded-full font-black text-2xl shadow-xl hover:scale-110 active:scale-95 transition-all uppercase tracking-tight"
                    >
                        CONTINUAR
                    </motion.button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default FlashWinner;
