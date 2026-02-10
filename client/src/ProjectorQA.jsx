import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const socket = io();

function ProjectorQA() {
    const [questions, setQuestions] = useState([]);
    const [branding, setBranding] = useState(null);
    const [focusedId, setFocusedId] = useState(null);
    const [pin, setPin] = useState('0000');

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setBranding(data))
            .catch(err => console.error(err));

        socket.emit('get-conecta-questions');

        socket.on('conecta-questions-update', (data) => {
            const approved = data.filter(q => q.estado === 'aprobada' || !q.estado);
            setQuestions(approved);
        });

        socket.on('focus-question', (id) => {
            setFocusedId(id);
        });

        socket.on('unfocus-question', () => {
            setFocusedId(null);
        });

        socket.on('room-pin', (p) => {
            setPin(p);
        });

        return () => {
            socket.off('conecta-questions-update');
            socket.off('focus-question');
            socket.off('unfocus-question');
            socket.off('room-pin');
        };
    }, []);

    const focusedQuestion = questions.find(q => q.id === focusedId);

    return (
        <div className="min-h-screen bg-gray-50 text-dark-gray font-sans p-8 relative overflow-hidden flex flex-col items-center">
            {/* Background Energy */}
            <div className="absolute top-0 left-0 w-full h-2 bg-oxxo-yellow"></div>

            {/* Header */}
            <div className="flex justify-between items-center w-full max-w-7xl mb-12 border-b-4 border-oxxo-red pb-6 z-10">
                <div className="flex items-center gap-6">
                    <img src="/logo2.svg" className="h-16 drop-shadow-sm" />
                    <h1 className="text-5xl font-black text-dark-gray uppercase tracking-tighter">
                        OXXO <span className="text-oxxo-red">QUIZ</span>
                    </h1>
                </div>

                {branding ? (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 tracking-[0.3em] mb-1 uppercase">EVENTO EN VIVO</span>
                        <div className="bg-oxxo-red text-white px-6 py-2 rounded-xl font-black text-xl shadow-lg border-2 border-white/20">
                            {branding.eventName || 'OXXO QUIZ EVENT'}
                        </div>
                    </div>
                ) : (
                    <div className="h-16 w-48 bg-gray-200 rounded-2xl animate-pulse"></div>
                )}
            </div>

            {/* Questions Grid / Spotlight */}
            <div className="flex-1 w-full max-w-7xl relative">
                <AnimatePresence mode='wait'>
                    {focusedId && focusedQuestion ? (
                        <motion.div
                            key="spotlight"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", duration: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center z-20"
                        >
                            <div className="bg-white text-dark-gray p-16 rounded-[4rem] shadow-2xl border-[12px] border-oxxo-red max-w-5xl w-full text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-oxxo-yellow/5 pointer-events-none"></div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-3 bg-oxxo-yellow rounded-b-full"></div>

                                <h2 className="text-6xl font-black mb-12 leading-tight tracking-tight">
                                    {focusedQuestion.pregunta_texto}
                                </h2>

                                <div className="flex flex-col items-center gap-8">
                                    <div className="bg-gray-100 px-10 py-3 rounded-full text-2xl font-black uppercase tracking-widest text-oxxo-red border-2 border-gray-200">
                                        {focusedQuestion.usuario || 'Anónimo'}
                                    </div>

                                    <div className="bg-oxxo-red text-white py-6 px-12 rounded-[2rem] font-black text-5xl shadow-2xl flex items-center gap-6 border-4 border-white/30">
                                        <span className="text-oxxo-yellow block -mt-1 scale-125">▲</span>
                                        <span>{focusedQuestion.upvotes} VOTOS</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 content-start pb-32 h-full overflow-y-auto custom-scrollbar pr-4"
                        >
                            <AnimatePresence mode='popLayout'>
                                {questions.map((q) => (
                                    <motion.div
                                        layout
                                        key={q.id}
                                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="bg-white text-dark-gray p-10 rounded-[3rem] card-pregunta-proyector h-fit flex flex-col justify-between border-b-[12px] border-oxxo-red shadow-xl"
                                    >
                                        <div>
                                            <h3 className="text-3xl font-black mb-8 leading-tight tracking-tight">
                                                {q.pregunta_texto}
                                            </h3>
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-1 bg-oxxo-yellow h-8 rounded-full"></div>
                                                <span className="text-gray-400 font-black text-sm uppercase tracking-widest">
                                                    {q.usuario || 'Anónimo'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="bg-oxxo-red text-white px-6 py-2 rounded-2xl shadow-lg border-2 border-white/20 flex items-center gap-3 scale-110 origin-left">
                                                <span className="text-oxxo-yellow text-xl">▲</span>
                                                <span className="text-3xl font-black">{q.upvotes}</span>
                                            </div>
                                            <span className="text-xs text-gray-300 font-black uppercase">
                                                {new Date(q.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {questions.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center text-gray-300 h-[60vh]">
                                    <div className="text-8xl mb-6 opacity-20">💬</div>
                                    <p className="text-4xl font-black mb-2 uppercase tracking-tighter">Esperando preguntas...</p>
                                    <p className="text-xl font-bold opacity-50 uppercase tracking-widest">Sincroniza tu energía con OXXO</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Footer Info */}
            <div className="fixed bottom-10 left-10 flex items-center gap-4 z-50">
                <div className="bg-white border-8 border-oxxo-red px-10 py-6 rounded-[3rem] shadow-2xl flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase mb-1 pl-1">PIN DE SALA</span>
                        <span className="text-6xl font-black text-oxxo-red tracking-[0.2em] leading-none">{pin}</span>
                    </div>
                </div>

                <div className="bg-oxxo-yellow border-8 border-oxxo-red px-8 py-6 rounded-[3rem] shadow-2xl flex flex-col">
                    <span className="text-[10px] font-black text-oxxo-red tracking-[0.2em] uppercase mb-1">PARTICIPANTES</span>
                    <span className="text-4xl font-black text-dark-gray leading-none">EN VIVO</span>
                </div>
            </div>

            <div className="fixed bottom-10 right-10 bg-dark-gray text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.3em] shadow-2xl animate-pulse">
                Sincronizando con OXXO
            </div>
        </div>
    );
}

export default ProjectorQA;
