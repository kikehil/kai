import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function Lobby({ pin, users = [] }) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#F0F2F5] text-dark-gray flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-3 bg-oxxo-red shadow-md"></div>
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-oxxo-yellow/20 rounded-full blur-[80px]"></div>

            {/* Header / Logo */}
            <div className="mt-12 mb-8 flex flex-col items-center z-10 scale-90 md:scale-100">
                <img
                    src="/logo2.svg"
                    alt="OXXO Quiz Logo"
                    className="h-28 md:h-36 mb-4 logo-zuynch drop-shadow-lg"
                />
                <div className="bg-oxxo-red text-white py-2 px-10 rounded-full font-black text-sm uppercase tracking-[0.3em] shadow-xl border-2 border-white/20">
                    SALA DE ESPERA
                </div>
            </div>

            {/* Room Info Card */}
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl border-x-4 border-b-8 border-oxxo-red relative z-10 mb-10 flex flex-col items-center">
                <span className="text-gray-400 font-black text-xs uppercase tracking-[0.3em] mb-2">PIN DEL EVENTO</span>
                <h2 className="text-6xl md:text-8xl font-black text-oxxo-red tracking-widest leading-none py-2">{pin}</h2>
                <div className="h-2 w-24 bg-oxxo-yellow rounded-full my-4"></div>

                <div className="flex items-center gap-3 bg-gray-50 px-6 py-2 rounded-full border border-gray-100 shadow-inner">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    <span className="font-black text-dark-gray text-base md:text-lg uppercase tracking-tight">
                        {users.length} {users.length === 1 ? 'Participante' : 'Participantes'}
                    </span>
                </div>
            </div>

            {/* Players Grid */}
            <div className="w-full max-w-5xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 z-10 px-2 mb-32 overflow-y-auto custom-scrollbar max-h-[40vh] py-4">
                {users.map((u, i) => (
                    <motion.div
                        key={u.id || i}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border-b-4 border-oxxo-yellow p-4 md:p-6 rounded-3xl shadow-xl flex flex-col items-center gap-3 group hover:-translate-y-1 transition-all"
                    >
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-oxxo-red text-white flex items-center justify-center text-xl md:text-2xl font-black shadow-lg group-hover:bg-oxxo-yellow group-hover:text-black transition-colors">
                            {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-black text-dark-gray text-sm md:text-base truncate w-full text-center uppercase tracking-tighter">{u.username}</span>
                    </motion.div>
                ))}

                {users.length === 0 && (
                    <div className="col-span-full flex flex-col items-center py-12 bg-white/50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <p className="text-xl font-black text-gray-300 uppercase tracking-widest italic">Conectando participantes...</p>
                        <div className="flex gap-2 mt-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-3 h-3 bg-oxxo-red rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Bottom Status */}
            <div className="fixed bottom-0 left-0 w-full flex justify-center p-6 z-20 pointer-events-none">
                <div className="bg-dark-gray text-white px-10 py-5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] border-b-4 border-oxxo-red flex flex-col items-center min-w-[300px] pointer-events-auto">
                    <p className="text-lg md:text-xl font-black tracking-widest animate-pulse leading-none mb-1">
                        SINCRONIZANDO{dots}
                    </p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">ENERGÍA OXXO QUIZ</p>
                </div>
            </div>

        </div>
    );
}

export default Lobby;
