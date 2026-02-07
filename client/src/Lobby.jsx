import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

// Assumption: socket prop is passed or we reuse the connection
// Since App.jsx manages socket, we should receive it as a prop or context.
// For now, I'll assume we pass it from App.jsx or use the same instance if I could export it.
// In App.jsx, socket is created outside component. We should export it or pass it.
// I will expect it as a prop.

function Lobby({ socket, pin, roomData }) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length < 3 ? prev + '.' : '');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-dark-gray text-white flex flex-col items-center p-8 relative overflow-hidden">

            {/* Background Energy */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 to-black -z-10"></div>

            {/* Header */}
            <div className="mt-10 mb-8 flex flex-col items-center">
                <img
                    src="http://localhost:3000/logo2.svg"
                    className="h-24 mb-4 logo-zuynch"
                    alt="Kai Logo"
                    style={{ filter: "drop-shadow(0 0 5px #FFF200)" }} // Base style, animation in CSS
                />
                <div className="bg-gray-800 border-2 border-oxxo-red px-8 py-3 rounded-full shadow-[0_0_20px_rgba(229,26,34,0.3)]">
                    <span className="text-gray-400 font-bold mr-2 text-xl">PIN DE SALA:</span>
                    <span className="text-4xl font-black text-white tracking-widest">{pin}</span>
                </div>
            </div>

            {/* Player Grid */}
            <div className="flex-1 w-full max-w-5xl">
                <h2 className="text-center text-oxxo-yellow font-bold text-xl mb-8 flex items-center justify-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {roomData.users.length} JUGADORES CONECTADOS
                </h2>

                <div className="flex flex-wrap justify-center gap-4 align-content-start">
                    <AnimatePresence>
                        {roomData.users.map((u) => (
                            <motion.div
                                key={u.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="bg-gray-800 border-2 border-oxxo-red px-6 py-3 rounded-full shadow-lg flex items-center gap-2 group hover:scale-105 cursor-default"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-oxxo-red to-orange-600 flex items-center justify-center text-xs font-bold">
                                    {u.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-lg">{u.username}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer Status */}
            <div className="mt-auto mb-10 text-center">
                <p className="text-2xl font-bold text-gray-400 animate-pulse">
                    Sincronizando energía{dots}
                </p>
                <p className="text-sm text-gray-600 mt-2 font-bold uppercase tracking-widest">Esperando al moderador</p>
            </div>

        </div>
    );
}

export default Lobby;
