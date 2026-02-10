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
        <div className="min-h-screen bg-gray-50 text-dark-gray flex flex-col items-center p-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-2 bg-oxxo-yellow"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-oxxo-red/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-oxxo-yellow/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>

            {/* Header / Logo */}
            <div className="mb-12 mt-8 flex flex-col items-center z-10">
                <img
                    src="/logo2.svg"
                    alt="OXXO Quiz Logo"
                    className="h-32 mb-4 logo-zuynch drop-shadow-[0_0_15px_rgba(255,242,0,0.5)]"
                />
                <div className="bg-oxxo-red text-white py-1 px-8 rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-lg">
                    SALA DE ESPERA
                </div>
            </div>

            {/* Room Info Card */}
            <div className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl border-8 border-oxxo-red relative z-10 mb-12 flex flex-col items-center">
                <span className="text-gray-400 font-black text-xs uppercase tracking-[0.3em] mb-4">PIN PARA UNIRSE</span>
                <h2 className="text-7xl font-black text-oxxo-red tracking-[0.2em] mb-2">{pin}</h2>
                <div className="h-1 w-32 bg-oxxo-yellow rounded-full mb-8"></div>

                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                    <span className="font-black text-dark-gray text-xl uppercase tracking-tighter">
                        {users.length} {users.length === 1 ? 'Participante' : 'Participantes'} Conectados
                    </span>
                </div>
            </div>

            {/* Players Grid */}
            <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-6 z-10 px-4 mb-20">
                {users.map((u, i) => (
                    <motion.div
                        key={u.id || i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.05 }}
                        className="bg-white border-4 border-gray-100 p-6 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-4 group hover:border-oxxo-red transition-all hover:scale-105 active:scale-95"
                    >
                        <div className="w-16 h-16 rounded-[1.2rem] bg-gray-50 flex items-center justify-center text-dark-gray text-2xl font-black border-2 border-gray-100 group-hover:bg-oxxo-yellow group-hover:text-black group-hover:border-oxxo-yellow transition-colors">
                            {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-black text-dark-gray text-lg truncate w-full text-center uppercase tracking-tighter">{u.username}</span>
                    </motion.div>
                ))}

                {users.length === 0 && (
                    <div className="col-span-full flex flex-col items-center py-10 opacity-30">
                        <p className="text-2xl font-black uppercase tracking-tighter">Esperando al primer jugador...</p>
                        <div className="flex gap-1 mt-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-2 h-2 bg-dark-gray rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Status */}
            <div className="mt-auto mb-10 text-center z-10 w-full max-w-sm">
                <div className="bg-dark-gray text-white p-6 rounded-[2rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-oxxo-yellow"></div>
                    <p className="text-xl font-black mb-1 animate-pulse tracking-tight">
                        SINCRONIZANDO ENERGÍA{dots}
                    </p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">OXXO Quiz • Conecta tu Energía</p>
                </div>
            </div>

        </div>
    );
}

export default Lobby;
