import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Lobby from './Lobby.jsx';
import FlashWinner from './FlashWinner.jsx';
import FinalPodium from './FinalPodium.jsx';
import Modal from './Modal.jsx';
import CircularTimer from './CircularTimer.jsx'; // Import at top

// Use dynamic hostname to allow mobile connection via IP
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
const socket = io(API_BASE);

function App() {
    const [gameState, setGameState] = useState('lobby'); // lobby, waiting, game, podium
    const [activeTab, setActiveTab] = useState('reto'); // reto, conecta
    const [user, setUser] = useState({ username: '', pin: '' });
    const [roomData, setRoomData] = useState({ users: [], pin: '' });
    const [question, setQuestion] = useState(null);
    const [conectaQuestions, setConectaQuestions] = useState([]);
    const [newConectaQuestion, setNewConectaQuestion] = useState('');
    const [isFrozen, setIsFrozen] = useState(false);
    const [flashCorrect, setFlashCorrect] = useState(false);
    const [flashPower, setFlashPower] = useState(false);
    const [notification, setNotification] = useState('');
    const [showWelcome, setShowWelcome] = useState(true);
    const [branding, setBranding] = useState(null);
    const [flashWinner, setFlashWinner] = useState(null);
    const [podiumData, setPodiumData] = useState([]);
    const [bgMusic, setBgMusic] = useState(null);

    // Modal State
    const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });

    const showModal = (title, message, type = 'info') => {
        setModal({ show: true, title, message, type });
    };

    const closeModal = () => setModal({ ...modal, show: false });

    useEffect(() => {
        // Effect for Background Music
        if (gameState === 'game') {
            const audio = new Audio('/bg-music.mp3'); // Create your music file in public/
            audio.loop = true;
            audio.volume = 0.3;
            audio.play().catch(e => console.log("Auto-play prevented:", e));
            setBgMusic(audio);
        } else {
            if (bgMusic) {
                bgMusic.pause();
                bgMusic.currentTime = 0;
            }
        }
        return () => {
            if (bgMusic) bgMusic.pause();
        };
    }, [gameState]);

    useEffect(() => {
        fetch(`${API_BASE}/api/config`)
            .then(res => res.json())
            .then(data => setBranding(data))
            .catch(err => console.error(err));

        socket.on('update-room', (data) => {
            console.log('[CLIENT] Received update-room:', data);
            setRoomData(data);
        });

        socket.on('game-state-change', (data) => {
            console.log('[CLIENT] Received game-state-change:', data);
            if (data.action === 'playing') setGameState('game');
            if (data.action === 'podium') {
                setPodiumData(data.ranking);
                setGameState('podium');
            }
        });

        socket.on('new-question', (q) => {
            console.log('[CLIENT] Received new-question:', q);
            setQuestion(q);
        });

        socket.on('power-effect', (data) => {
            if (data.targetId === socket.id) {
                setIsFrozen(true);
                setNotification(`❄️ ¡Congelado por ${data.attackerName}!`);
                setTimeout(() => { setIsFrozen(false); setNotification(''); }, 5000);
            } else {
                setFlashPower(true);
                setTimeout(() => setFlashPower(false), 800);
                setNotification(`⚡ ${data.attackerName} usó ${data.type} en ${data.targetName}!`);
                setTimeout(() => setNotification(''), 3000);
            }
        });

        socket.on('the-flash-is', (data) => setFlashWinner(data));
        socket.on('conecta-questions-update', (data) => setConectaQuestions(data));

        // Replaced alert with modal
        socket.on('error', (msg) => showModal('¡Ups!', msg, 'error'));

        // Resultado de respuesta
        socket.on('answer-result', (data) => {
            if (data.correct) {
                showModal('¡Correcto!', data.message, 'success');
            } else {
                showModal('Incorrecto', data.message, 'error');
            }
        });

        return () => {
            socket.off('update-room');
            socket.off('game-state-change');
            socket.off('new-question');
            socket.off('power-effect');
            socket.off('the-flash-is');
            socket.off('conecta-questions-update');
            socket.off('error');
        };
    }, []);

    useEffect(() => {
        if (gameState === 'game' && !question) {
            socket.emit('get-conecta-questions');
        }
    }, [gameState]);

    const joinGame = () => {
        if (user.username && user.pin) {
            console.log('[CLIENT] Joining game:', user);
            socket.emit('join-game', user);
            setGameState('waiting');
        }
    };

    const submitAnswer = (correct) => {
        if (isFrozen) return;
        if (correct) {
            setFlashCorrect(true);
            setTimeout(() => setFlashCorrect(false), 800);
            socket.emit('send-answer', { pin: user.pin, isCorrect: true });
        } else {
            socket.emit('send-answer', { pin: user.pin, isCorrect: false });
            // Replaced alert with modal
            showModal('¡Incorrecto!', 'Has fallado esta pregunta. ¡Sigue intentando!', 'error');
        }
    };

    const handleTimeout = () => {
        if (question && !modal.show) { // Only if not already answered or modal shown
            submitAnswer(false);
            showModal('⏰ ¡Tiempo Agotado!', 'Se acabó el tiempo para esta pregunta.', 'error');
        }
    };

    const submitConectaQuestion = () => {
        if (!newConectaQuestion.trim()) return;
        socket.emit('post-conecta-question', { text: newConectaQuestion, user: user.username });
        setNewConectaQuestion('');
    };

    const likeConectaQuestion = (id) => socket.emit('upvote-conecta-question', id);
    const myData = roomData.users.find(u => u.id === socket.id) || { score: 0, coins: 0 };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-gray via-dark-gray-800 to-dark-gray text-white font-sans overflow-hidden flex flex-col relative">
            <FlashWinner winner={flashWinner} onComplete={() => setFlashWinner(null)} />

            <Modal
                show={modal.show}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onClose={closeModal}
            />

            {/* Podium Overlay */}
            {gameState === 'podium' && <FinalPodium ranking={podiumData} onRestart={() => window.location.reload()} />}

            {showWelcome && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
                    <div className="bg-white text-dark-gray max-w-lg w-full p-8 rounded-3xl text-center border-4 border-oxxo-red relative overflow-hidden">
                        <div className="mb-6 flex justify-center">
                            <img src="/logo2.svg" alt="OXXO Quiz Logo" className="h-24 logo-zuynch" />
                        </div>
                        <h2 className="text-3xl font-black text-oxxo-red mb-4">¡Bienvenido a OXXO Quiz!</h2>
                        <p className="text-xl font-medium mb-8">Sincronizando la energía de OXXO.<br />Ingresa el PIN del evento para conectar.</p>
                        <button onClick={() => setShowWelcome(false)} className="bg-oxxo-red text-white text-xl font-bold py-4 px-10 rounded-full hover:scale-105 transition-transform">COMENZAR</button>
                    </div>
                </div>
            )}

            {isFrozen && (
                <div className="fixed inset-0 bg-blue-500/30 z-50 flex items-center justify-center backdrop-blur-sm pointer-events-none">
                    <div className="text-6xl font-black animate-bounce tracking-widest text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">❄️ CONGELADO ❄️</div>
                </div>
            )}

            {flashPower && (
                <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
                    <svg className="w-full h-full text-oxxo-yellow opacity-80 animate-ping" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M40 0 L30 45 L60 45 L50 100 L80 35 L55 35 L65 0 Z" fill="currentColor" />
                    </svg>
                </div>
            )}

            {notification && (
                <div className="fixed top-28 left-1/2 -translate-x-1/2 bg-oxxo-yellow text-black px-6 py-3 rounded-full font-bold z-50 animate-pulse shadow-xl border-2 border-white">
                    {notification}
                </div>
            )}

            {gameState !== 'waiting' && gameState !== 'podium' && (
                <header className="py-8 flex justify-center items-center relative z-10 transition-all">
                    <div className="relative group cursor-pointer">
                        {branding ? (
                            <img src={branding.logoUrl} alt="Zuynch Logo" className="h-20 logo-zuynch drop-shadow-[0_0_15px_rgba(255,242,0,0.8)]" />
                        ) : (
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">zuynch</h1>
                        )}
                    </div>
                </header>
            )}

            {gameState === 'lobby' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-dark-gray-700 via-dark-gray-800 to-dark-gray">
                    <div className="w-full max-w-md bg-white text-dark-gray p-8 rounded-3xl shadow-2xl border-4 border-oxxo-red">
                        <h2 className="text-2xl font-bold mb-6 text-center text-oxxo-red">INGRESA AL JUEGO</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 ml-1">PIN DE SALA</label>
                                <input className="w-full p-4 bg-gray-100 rounded-xl text-center text-2xl font-bold border-2 border-transparent focus:border-oxxo-yellow focus:ring-0 focus:outline-none transition-all placeholder-gray-400" placeholder="0000" value={user.pin} onChange={e => setUser({ ...user, pin: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 ml-1">TU NOMBRE</label>
                                <input className="w-full p-4 bg-gray-100 rounded-xl text-center text-xl font-bold border-2 border-transparent focus:border-oxxo-yellow focus:ring-0 focus:outline-none transition-all placeholder-gray-400" placeholder="Jugador 1" value={user.username} onChange={e => setUser({ ...user, username: e.target.value })} />
                            </div>
                            <button onClick={joinGame} className="w-full py-4 mt-4 bg-oxxo-red text-white rounded-xl font-bold text-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_0_rgb(150,0,0)] active:shadow-none translate-y-0 active:translate-y-1 hover:shadow-[0_0_20px_rgba(237,28,36,0.6)]">ENTRAR</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'waiting' && <Lobby socket={socket} pin={user.pin} roomData={roomData} />}

            {gameState === 'game' && (
                <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex gap-4 mb-6">
                            <button onClick={() => setActiveTab('reto')} className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${activeTab === 'reto' ? 'bg-oxxo-red text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Reto zuynch</button>
                            <button onClick={() => setActiveTab('conecta')} className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${activeTab === 'conecta' ? 'bg-oxxo-red text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Conecta zuynch</button>
                        </div>

                        {activeTab === 'reto' ? (
                            <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-6 bg-gray-800/80 p-3 rounded-2xl border border-gray-700">
                                    <div className="px-4 font-bold text-gray-300">Sala: <span className="text-white">{user.pin}</span></div>
                                    <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-oxxo-yellow/50">
                                        <span className="text-2xl">⚡</span>
                                        <span className="text-2xl font-bold text-oxxo-yellow">{myData.coins}</span>
                                    </div>
                                </div>
                                {question ? (
                                    <div className={`bg-white text-dark-gray p-8 rounded-3xl shadow-xl flex-1 flex flex-col justify-center transition-all duration-500 ${flashCorrect ? 'ring-8 ring-oxxo-yellow scale-[1.02]' : ''}`}>

                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl md:text-3xl font-bold text-center leading-tight flex-1">{question.question_text}</h2>
                                            <div className="ml-4 flex-shrink-0">
                                                {/* Force 10 seconds as requested. Key ensures reset on new question */}
                                                <CircularTimer key={question.id} duration={10} onComplete={handleTimeout} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                            {[{ label: question.option_a, val: 'a' }, { label: question.option_b, val: 'b' }, { label: question.option_c, val: 'c' }, { label: question.option_d, val: 'd' }].map((opt, idx) => (
                                                <button key={opt.val} disabled={isFrozen} onClick={() => submitAnswer(opt.val === question.correct_option)} className={`group relative p-6 rounded-2xl text-lg font-bold text-left transition-all border-2 border-gray-100 hover:border-oxxo-red hover:bg-red-50 ${isFrozen ? 'opacity-50 cursor-not-allowed grayscale' : 'active:scale-95'}`}>
                                                    <span className="inline-block w-8 h-8 rounded-full bg-gray-200 text-center leading-8 mr-3 group-hover:bg-oxxo-red group-hover:text-white transition-colors">{['A', 'B', 'C', 'D'][idx]}</span>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center flex-1 h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oxxo-red"></div></div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 bg-gray-900 rounded-3xl p-6 border border-gray-800 flex flex-col h-[600px]">
                                <h2 className="text-xl font-bold text-oxxo-yellow mb-4 flex items-center gap-2"> PREGUNTAS EN VIVO <span className="text-xs bg-oxxo-red text-white px-2 py-0.5 rounded-full ml-auto">EN VIVO</span></h2>
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
                                    {conectaQuestions.map(q => (
                                        <div key={q.id} className="bg-gray-800 p-4 rounded-xl border-l-4 border-oxxo-red flex gap-4">
                                            <div className="flex-1">
                                                <p className="text-lg font-medium text-white mb-1">{q.pregunta_texto}</p>
                                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                                    <span>👤 {q.usuario}</span><span>•</span><span>{new Date(q.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center gap-1 min-w-[50px]">
                                                <button onClick={() => likeConectaQuestion(q.id)} className="w-10 h-10 rounded-full bg-gray-700 hover:bg-oxxo-yellow hover:text-black transition-colors flex items-center justify-center">▲</button>
                                                <span className="font-bold text-white">{q.upvotes}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {conectaQuestions.length === 0 && <div className="text-center text-gray-500 py-10">Sé el primero en preguntar...</div>}
                                </div>
                                <div className="pt-4 border-t border-gray-700">
                                    <div className="flex gap-2">
                                        <input value={newConectaQuestion} onChange={e => setNewConectaQuestion(e.target.value)} placeholder="Escribe tu pregunta para el host..." className="flex-1 bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-oxxo-yellow outline-none" onKeyDown={e => e.key === 'Enter' && submitConectaQuestion()} />
                                        <button onClick={submitConectaQuestion} className="bg-white text-dark-gray px-6 rounded-xl font-bold hover:bg-oxxo-yellow transition-colors">Enviar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-80 flex flex-col gap-4">
                        <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-xl flex-1 max-h-[500px] flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">🏆 RANKING</h3>
                            <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                                {roomData.users.map((u, i) => (
                                    <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl ${u.id === socket.id ? 'bg-oxxo-red text-white' : 'bg-gray-700/50 text-gray-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${rankColor(i)}`}>{i + 1}</span>
                                            <span className="font-medium truncate max-w-[100px]">{u.username}</span>
                                            {u.streak >= 5 && <span title="Racha">🔥</span>}
                                            {u.isFrozen && <span>❄️</span>}
                                        </div>
                                        <span className="font-bold">{u.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-xl">
                            <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Tienda de Poderes</h3>
                            <button onClick={() => socket.emit('use-power', { pin: user.pin, type: 'freeze-leader' })} disabled={myData.coins < 50} className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all ${myData.coins < 50 ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-600 to-blue-500 hover:brightness-110 active:scale-95'}`}>
                                <div className="text-left"><div className="font-bold text-white text-sm">Congelar al Líder</div><div className="text-xs text-blue-100">Costo: 50</div></div>
                                <div className="text-2xl">❄️</div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function rankColor(index) {
    if (index === 0) return "bg-oxxo-yellow text-black";
    if (index === 1) return "bg-gray-300 text-black";
    if (index === 2) return "bg-orange-400 text-black";
    return "bg-gray-600 text-white";
}

export default App;
