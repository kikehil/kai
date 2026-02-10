import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const socket = io();

function ProjectorQA() {
    const [questions, setQuestions] = useState([]);
    const [branding, setBranding] = useState(null);
    const [focusedId, setFocusedId] = useState(null);

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setBranding(data))
            .catch(err => console.error(err));

        socket.emit('get-conecta-questions');

        socket.on('conecta-questions-update', (data) => {
            // Only show approved questions
            const approved = data.filter(q => q.estado === 'aprobada' || !q.estado); // Fallback for old questions without state if applied
            setQuestions(approved);
        });

        socket.on('focus-question', (id) => {
            setFocusedId(id);
        });

        socket.on('unfocus-question', () => {
            setFocusedId(null);
        });

        return () => {
            socket.off('conecta-questions-update');
            socket.off('focus-question');
            socket.off('unfocus-question');
        };
    }, []);

    const focusedQuestion = questions.find(q => q.id === focusedId);

    return (
        <div className="min-h-screen bg-[#1A1A1A] text-white font-sans p-8 relative overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4 z-10">
                <h1 className="text-4xl font-black text-white uppercase tracking-tight">
                    OXXO <span className="text-oxxo-red">Quiz</span>
                </h1>

                {branding ? (
                    <img
                        src={branding.logoUrl}
                        alt="Logo"
                        className="h-20 drop-shadow-[0_0_15px_rgba(255,242,0,0.6)] animate-pulse"
                    />
                ) : (
                    <div className="h-16 w-16 bg-oxxo-red rounded-full animate-pulse"></div>
                )}
            </div>

            {/* Questions Grid / Spotlight */}
            <div className="flex-1 overflow-hidden relative p-4">
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
                            <div className="bg-white text-black p-12 rounded-[3rem] shadow-[0_0_100px_rgba(255,242,0,0.3)] border-8 border-oxxo-yellow max-w-4xl w-full text-center">
                                <h2 className="text-5xl font-black font-sans mb-8 leading-tight">
                                    {focusedQuestion.pregunta_texto}
                                </h2>
                                <div className="flex justify-center items-center gap-6 mb-8">
                                    <span className="bg-gray-200 px-6 py-2 rounded-full text-xl font-bold uppercase tracking-wider text-gray-700">
                                        {focusedQuestion.usuario || 'Anónimo'}
                                    </span>
                                </div>
                                <div className="flex justify-center">
                                    <div className="bg-oxxo-red text-white py-4 px-8 rounded-full font-black text-3xl shadow-lg flex items-center gap-3">
                                        <span>▲</span> {focusedQuestion.upvotes} VOTOS
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
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min content-start h-full"
                        >
                            <AnimatePresence mode='popLayout'>
                                {questions.map((q) => (
                                    <motion.div
                                        layout
                                        key={q.id}
                                        initial={{ x: 100, opacity: 0, scale: 0.8 }}
                                        animate={{ x: 0, opacity: 1, scale: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        className="bg-white text-black p-6 rounded-3xl card-pregunta-proyector h-fit flex flex-col justify-between"
                                    >
                                        <div>
                                            <h3 className="text-2xl font-bold font-sans mb-4 leading-tight">
                                                {q.pregunta_texto}
                                            </h3>
                                            <div className="text-gray-500 font-medium text-sm flex items-center gap-2 mb-4">
                                                <span className="bg-gray-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                    {q.usuario || 'Anónimo'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mt-auto">
                                            <div className="votos-badge shadow-md flex items-center gap-2">
                                                <span className="text-xl">▲</span>
                                                <span className="text-2xl">{q.upvotes}</span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-bold">
                                                {new Date(q.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {questions.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center text-gray-500 h-96">
                                    <p className="text-2xl font-bold mb-2">Esperando preguntas...</p>
                                    <p>Las preguntas aprobadas aparecerán aquí.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-8 bg-black/50 backdrop-blur px-6 py-3 rounded-xl border border-gray-700 flex items-center gap-3 z-10">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-bold text-gray-300">
                    PREGUNTAS EN VIVO: <span className="text-white text-xl">{questions.length}</span>
                </span>
            </div>
        </div>
    );
}

export default ProjectorQA;
