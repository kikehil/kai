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
            socket.off('answer-result');
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
        <div className="min-h-screen bg-[#F0F2F5] text-dark-gray font-sans overflow-hidden flex flex-col relative">
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-oxxo-red/20 p-4 backdrop-blur-md">
                    <div className="bg-white text-dark-gray max-w-lg w-full p-8 rounded-[40px] text-center border-8 border-oxxo-red relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-4 bg-oxxo-yellow"></div>
                        <div className="mb-6 flex justify-center mt-6">
                            <img src="/logo2.svg" alt="OXXO Quiz Logo" className="h-32 logo-zuynch drop-shadow-[0_0_15px_rgba(255,242,0,0.5)]" />
                        </div>
                        <h2 className="text-4xl font-black text-oxxo-red mb-4 tracking-tight uppercase">¡Bienvenidos a OXXO Quiz!</h2>
                        <p className="text-xl font-medium mb-8 text-gray-600">Sincronizando la energía de OXXO.<br />Ingresa el PIN del evento para conectar.</p>
                        <button onClick={() => setShowWelcome(false)} className="bg-oxxo-red text-white text-2xl font-black py-5 px-14 rounded-full hover:scale-105 transition-all shadow-lg hover:shadow-oxxo-red/40">COMENZAR JUEGO</button>
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
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F0F2F5]">
                    {/* Header Decoration */}
                    <div className="fixed top-0 left-0 w-full h-3 bg-oxxo-red z-10"></div>

                    <div className="w-full max-w-sm bg-white text-dark-gray p-8 rounded-[3rem] shadow-2xl border-x-2 border-b-8 border-oxxo-red relative overflow-hidden transition-all hover:shadow-oxxo-red/10">
                        <div className="mb-8 flex justify-center">
                            <img src="/logo2.svg" className="h-24 logo-zuynch" />
                        </div>
                        <h2 className="text-2xl font-black mb-8 text-center text-dark-gray tracking-tighter uppercase">¡Conecta tu Energía!</h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black mb-2 ml-1 text-gray-400 uppercase tracking-[0.2em]">PIN DE SALA</label>
                                <input className="w-full p-4 bg-gray-50 rounded-2xl text-center text-4xl font-black border-2 border-gray-100 focus:border-oxxo-yellow focus:ring-4 focus:ring-oxxo-yellow/10 focus:outline-none transition-all placeholder-gray-200 text-oxxo-red" placeholder="0000" value={user.pin} onChange={e => setUser({ ...user, pin: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black mb-2 ml-1 text-gray-400 uppercase tracking-[0.2em]">TU NOMBRE</label>
                                <input className="w-full p-4 bg-gray-50 rounded-2xl text-center text-xl font-black border-2 border-gray-100 focus:border-oxxo-red focus:ring-4 focus:ring-oxxo-red/10 focus:outline-none transition-all placeholder-gray-200" placeholder="Ej: OXXO Fan" value={user.username} onChange={e => setUser({ ...user, username: e.target.value })} />
                            </div>
                            <button onClick={joinGame} className="w-full py-5 mt-4 bg-oxxo-red text-white rounded-2xl font-black text-xl active:scale-95 transition-all shadow-xl hover:shadow-oxxo-red/20 uppercase tracking-widest">ENTRAR</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'waiting' && <Lobby socket={socket} pin={user.pin} users={roomData.users} />}

            {gameState === 'game' && (
                <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex gap-4 mb-6">
                            <button onClick={() => setActiveTab('reto')} className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${activeTab === 'reto' ? 'bg-oxxo-red text-white shadow-lg scale-105' : 'bg-white text-gray-400 border-2 border-gray-100 hover:bg-gray-50'}`}>Reto OXXO</button>
                            <button onClick={() => setActiveTab('conecta')} className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${activeTab === 'conecta' ? 'bg-oxxo-red text-white shadow-lg scale-105' : 'bg-white text-gray-400 border-2 border-gray-100 hover:bg-gray-50'}`}>Conecta OXXO</button>
                        </div>

                        {activeTab === 'reto' ? (
                            <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border-x-2 border-b-4 border-oxxo-red shadow-md">
                                    <div className="px-4 font-black text-dark-gray uppercase tracking-tighter">SALA: <span className="text-oxxo-red text-2xl ml-2">{user.pin}</span></div>
                                    <div className="flex items-center gap-3 bg-oxxo-yellow px-6 py-2 rounded-xl border-l-4 border-oxxo-red shadow-inner">
                                        <span className="text-2xl">⚡</span>
                                        <span className="text-2xl font-black text-dark-gray">{myData.coins}</span>
                                    </div>
                                </div>
                                {question ? (
                                    <div className={`bg-white text-dark-gray p-8 rounded-[40px] shadow-2xl flex-1 flex flex-col justify-center transition-all duration-500 border-x-4 border-b-[12px] border-oxxo-red relative overflow-hidden ${flashCorrect ? 'ring-8 ring-oxxo-yellow scale-[1.02]' : ''}`}>
                                        <div className="absolute top-0 left-0 w-full h-3 bg-oxxo-yellow"></div>

                                        <div className="flex justify-between items-center mb-10">
                                            <h2 className="text-2xl md:text-4xl font-black text-left leading-tight flex-1 text-dark-gray tracking-tight">{question.question_text}</h2>
                                            <div className="ml-6 flex-shrink-0 bg-gray-50 p-4 rounded-full border-2 border-gray-100 shadow-inner">
                                                <CircularTimer key={question.id} duration={10} onComplete={handleTimeout} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                                            {[{ label: question.option_a, val: 'a' }, { label: question.option_b, val: 'b' }, { label: question.option_c, val: 'c' }, { label: question.option_d, val: 'd' }].map((opt, idx) => (
                                                <button key={opt.val} disabled={isFrozen} onClick={() => submitAnswer(opt.val === question.correct_option)} className={`group relative p-6 rounded-[2rem] text-xl font-black text-left transition-all border-4 border-gray-50 hover:border-oxxo-yellow hover:bg-white ${isFrozen ? 'opacity-50 cursor-not-allowed grayscale' : 'active:scale-95 shadow-lg hover:shadow-2xl'}`}>
                                                    <div className="flex items-center">
                                                        <span className="inline-block w-12 h-12 rounded-2xl bg-oxxo-red text-white text-center leading-[3rem] mr-5 font-black text-2xl shadow-lg group-hover:bg-oxxo-yellow group-hover:text-black transition-colors">
                                                            {['A', 'B', 'C', 'D'][idx]}
                                                        </span>
                                                        <span className="flex-1 uppercase tracking-tighter leading-tight">{opt.label}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center flex-1 h-64 bg-white/50 rounded-[3rem] border-4 border-dashed border-gray-200">
                                        <div className="animate-spin rounded-full h-16 w-16 border-t-8 border-oxxo-red border-r-8 border-r-oxxo-yellow mb-6"></div>
                                        <p className="font-black text-gray-400 uppercase tracking-widest animate-pulse text-xl">Sincronizando energía...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 bg-white rounded-[3rem] p-8 border-x-2 border-b-8 border-oxxo-red shadow-2xl flex flex-col h-[650px]">
                                <h2 className="text-2xl font-black text-dark-gray mb-6 flex items-center gap-3">
                                    <span className="bg-oxxo-yellow p-2 rounded-xl">💬</span>
                                    PREGUNTAS EN VIVO
                                    <span className="text-[10px] bg-oxxo-red text-white px-3 py-1 rounded-full ml-auto animate-pulse">LIVE</span>
                                </h2>
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-6 custom-scrollbar">
                                    {conectaQuestions.map(q => (
                                        <div key={q.id} className="bg-gray-50 p-5 rounded-3xl border-l-8 border-oxxo-yellow flex gap-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex-1">
                                                <p className="text-xl font-black text-dark-gray mb-2 uppercase tracking-tight leading-tight">{q.pregunta_texto}</p>
                                                <div className="text-[10px] text-gray-400 flex items-center gap-2 font-black">
                                                    <span className="bg-white px-2 py-0.5 rounded border border-gray-100">👤 {q.usuario}</span>
                                                    <span>•</span>
                                                    <span>{new Date(q.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center gap-2 min-w-[60px]">
                                                <button onClick={() => likeConectaQuestion(q.id)} className="w-12 h-12 rounded-2xl bg-white border-2 border-gray-100 hover:border-oxxo-yellow hover:bg-oxxo-yellow hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-sm">▲</button>
                                                <span className="font-black text-dark-gray text-lg">{q.upvotes}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {conectaQuestions.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full opacity-30 text-gray-400">
                                            <div className="text-6xl mb-4">✍️</div>
                                            <p className="font-black uppercase tracking-widest text-xl">Sé el primero en preguntar</p>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-6 border-t-2 border-gray-100">
                                    <div className="flex gap-3">
                                        <input value={newConectaQuestion} onChange={e => setNewConectaQuestion(e.target.value)} placeholder="Escribe tu pregunta para el host..." className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-dark-gray font-bold focus:ring-4 focus:ring-oxxo-red/10 focus:border-oxxo-red outline-none transition-all" onKeyDown={e => e.key === 'Enter' && submitConectaQuestion()} />
                                        <button onClick={submitConectaQuestion} className="bg-oxxo-red text-white px-8 rounded-2xl font-black text-lg hover:brightness-110 transition-all shadow-lg active:scale-95">ENVIAR</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-80 flex flex-col gap-6">
                        <div className="bg-white rounded-[2.5rem] p-6 border-x-2 border-b-8 border-oxxo-red shadow-xl flex-1 max-h-[500px] flex flex-col">
                            <h3 className="text-xl font-black text-dark-gray mb-6 flex items-center gap-3">
                                <span className="bg-oxxo-yellow p-2 rounded-xl text-sm">🏆</span>
                                RANKING
                            </h3>
                            <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">
                                {roomData.users.map((u, i) => (
                                    <div key={u.id} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${u.id === socket.id ? 'bg-oxxo-red text-white shadow-lg scale-105' : 'bg-gray-50 text-dark-gray border border-gray-100 hover:border-oxxo-red/20'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black shadow-sm ${u.id === socket.id ? 'bg-white text-oxxo-red' : rankColor(i)}`}>{i + 1}</span>
                                            <span className="font-black text-sm uppercase tracking-tighter truncate max-w-[100px]">{u.username}</span>
                                            {u.streak >= 5 && <span title="Racha">🔥</span>}
                                            {u.isFrozen && <span>❄️</span>}
                                        </div>
                                        <span className="font-black text-xl">{u.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-[2.5rem] p-6 border-x-2 border-b-8 border-oxxo-red shadow-xl">
                            <h3 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.3em]">Tienda de Poderes</h3>
                            <button onClick={() => socket.emit('use-power', { pin: user.pin, type: 'freeze-leader' })} disabled={myData.coins < 50} className={`w-full p-5 rounded-2xl flex items-center justify-between group transition-all relative overflow-hidden ${myData.coins < 50 ? 'bg-gray-100 opacity-50 cursor-not-allowed grayscale' : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 active:scale-95 shadow-lg'}`}>
                                <div className="text-left relative z-10">
                                    <div className="font-black text-white text-base leading-none mb-1">CONGELAR LÍDER</div>
                                    <div className="text-[10px] text-blue-100 font-black tracking-widest uppercase">Puntos: 50</div>
                                </div>
                                <div className="text-4xl filter drop-shadow-md relative z-10">❄️</div>
                                <div className="absolute top-0 right-0 w-32 h-full bg-white/10 skew-x-[30deg] -mr-10"></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function rankColor(index) {
    if (index === 0) return "bg-oxxo-yellow text-black border-2 border-white";
    if (index === 1) return "bg-gray-200 text-dark-gray border border-gray-300";
    if (index === 2) return "bg-orange-100 text-orange-800 border border-orange-200";
    return "bg-white text-gray-400 border border-gray-100";
}

export default App;
