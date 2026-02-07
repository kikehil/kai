import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ show, title, message, type = 'info', onClose }) => {
    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-white rounded-3xl p-8 max-w-md w-full text-center border-4 border-oxxo-red shadow-[0_0_50px_rgba(229,26,34,0.4)] relative overflow-hidden"
                    >
                        {/* Decorative Circle */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-10 w-32 h-32 bg-oxxo-yellow rounded-full z-0 opacity-20"></div>

                        <div className="relative z-10">
                            <div className="mb-4 text-6xl">
                                {type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}
                            </div>

                            <h2 className="text-3xl font-black text-oxxo-red mb-4 uppercase tracking-tighter">
                                {title}
                            </h2>

                            <p className="text-dark-gray text-xl font-medium mb-8 leading-relaxed">
                                {message}
                            </p>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-oxxo-red text-white font-black text-xl rounded-2xl shadow-[0_4px_0_rgb(150,0,0)] hover:bg-red-600 active:shadow-none active:translate-y-1 transition-all"
                            >
                                ENTENDIDO
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
