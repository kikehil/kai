import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const FinalPodium = ({ ranking, onRestart }) => {
    useEffect(() => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#E51A22', '#FFF200', '#FFFFFF']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#E51A22', '#FFF200', '#FFFFFF']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }, []);

    // Reorder ranking for visual podium: [2nd, 1st, 3rd]
    // Assuming ranking is sorted [1st, 2nd, 3rd]
    const podiumOrder = [ranking[1], ranking[0], ranking[2]].filter(u => u);

    const getBarHeight = (index) => {
        // Based on visual position (0=Left/2nd, 1=Center/1st, 2=Right/3rd)
        if (index === 1) return 'h-96'; // 1st Place (Center)
        if (index === 0) return 'h-72'; // 2nd Place (Left)
        return 'h-60'; // 3rd Place (Right)
    };

    const getBarColor = (index) => {
        if (index === 1) return 'bg-gradient-to-t from-yellow-500 to-oxxo-yellow border-oxxo-yellow'; // 1st
        if (index === 0) return 'bg-gradient-to-t from-red-700 to-oxxo-red border-oxxo-red'; // 2nd
        return 'bg-gradient-to-t from-gray-700 to-gray-500 border-gray-400'; // 3rd
    };

    return (
        <div className="fixed inset-0 min-h-screen bg-dark-gray flex flex-col items-center justify-center text-white overflow-hidden z-[100]">

            {/* Logo Header */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-10 flex flex-col items-center"
            >
                <img src={`http://${window.location.hostname}:3000/logo2.svg`} alt="Kai Logo" className="h-24 drop-shadow-[0_0_20px_rgba(255,242,0,0.6)] animate-pulse" />
                <h1 className="text-4xl font-black mt-4 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-oxxo-red via-white to-oxxo-yellow">
                    RESULTADOS FINALES
                </h1>
            </motion.div>

            {/* Podium Container */}
            <div className="flex items-end justify-center gap-4 md:gap-8 mb-20 px-4 w-full max-w-4xl">
                {podiumOrder.map((player, index) => {
                    // Start hidden below
                    return (
                        <motion.div
                            key={player.username}
                            initial={{ y: 500, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                                type: 'spring',
                                damping: 15,
                                delay: index === 1 ? 1 : index === 0 ? 0.5 : 0 // Delay logic: 3rd(idx2) -> 2nd(idx0) -> 1st(idx1)
                            }}
                            className="flex flex-col items-center group relative"
                        >
                            {/* Player Info (Floating above) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: (index === 1 ? 1 : index === 0 ? 0.5 : 0) + 0.5 }}
                                className="mb-4 text-center"
                            >
                                <div className="text-xl md:text-3xl font-black font-montserrat tracking-wide mb-1 flex items-center gap-2 justify-center">
                                    {player.username}
                                    {player.streak >= 5 && <span title="Racha de Energía">☕</span>}
                                </div>
                                <div className="text-lg md:text-2xl font-bold text-gray-300 bg-black/50 px-4 py-1 rounded-full">
                                    {player.score} pts
                                </div>
                            </motion.div>

                            {/* The Bar / Pedestal */}
                            <div className={`${getBarHeight(index)} w-24 md:w-40 rounded-t-lg border-t-4 border-x-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${getBarColor(index)} relative overflow-hidden flex items-end justify-center pb-4`}>
                                {/* Rank Number */}
                                <span className="text-6xl font-black text-black/20 select-none">
                                    {index === 1 ? '1' : index === 0 ? '2' : '3'}
                                </span>

                                {/* OXXO Stripes Effect */}
                                <div className="absolute top-0 left-0 w-full h-2 bg-white/30"></div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {onRestart && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    onClick={onRestart}
                    className="absolute bottom-10 bg-oxxo-red hover:bg-red-600 text-white font-bold py-4 px-12 rounded-full shadow-lg border-2 border-white/20 transition-all active:scale-95"
                >
                    FINALIZAR SINCRONIZACIÓN
                </motion.button>
            )}
        </div>
    );
};

export default FinalPodium;
