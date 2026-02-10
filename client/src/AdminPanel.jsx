import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

import Modal from './Modal.jsx';

import { API_URL } from './config.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Use dynamic hostname to allow mobile connection via IP
const socket = io(API_URL);

function AdminPanel() {
    const [pin, setPin] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [roomUsers, setRoomUsers] = useState([]);

    // Modal State
    const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });

    const showModal = (title, message, type = 'info') => {
        setModal({ show: true, title, message, type });
    };

    const closeModal = () => setModal({ ...modal, show: false });

    // Stats for "Next Question" phase
    // In a real scenario, you'd listen for 'answer-submitted' events to build a live histogram
    // For this mock "God Mode", we'll simulate data or use what we have.
    const [answerStats, setAnswerStats] = useState({ a: 0, b: 0, c: 0, d: 0 });

    // Moderation State
    const [pendingQuestions, setPendingQuestions] = useState([]);
    const [approvedQuestions, setApprovedQuestions] = useState([]);

    // Questions Management
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    useEffect(() => {
        socket.on('update-room', (data) => {
            setRoomUsers(data.users.filter(u => u.username !== 'ADMIN'));
        });

        socket.on('moderator-update', ({ pending, approved }) => {
            setPendingQuestions(pending);
            setApprovedQuestions(approved);
        });

        socket.on('admin-init', (data) => {
            setQuestions(data.questions || []);
            setCurrentQuestionIndex(data.currentQuestionIndex || 0);
        });

        socket.on('admin-questions-update', (data) => {
            setQuestions(data.questions || []);
            setCurrentQuestionIndex(data.currentQuestionIndex || 0);
        });

        socket.on('admin-index-update', (data) => {
            setCurrentQuestionIndex(data.currentQuestionIndex || 0);
        });

        // Listen for events if needed to update live bar graph of choices
        // socket.on('live-answer-update', ...)

        return () => {
            socket.off('update-room');
            socket.off('update-room');
            socket.off('moderator-update');
            socket.off('admin-init');
            socket.off('admin-questions-update');
            socket.off('admin-index-update');
        };
    }, []);

    const connectToRoom = () => {
        if (pin) {
            socket.emit('join-game', { username: 'ADMIN', pin });
            setIsConnected(true);
        }
    };

    const triggerNextQuestion = () => {
        // Logic to trigger next question
        // This would tell the server to broadcast 'next-question'
        socket.emit('admin-action', { pin, action: 'launch-question' });

        // Reset local view stats if needed
        setAnswerStats({ a: 0, b: 0, c: 0, d: 0 });
    };

    const showWinners = () => {
        // Trigger confetti
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#E51A22', '#FFF200', '#FFFFFF']
        });

        // Broadcast 'show-podium' to all screens
        socket.emit('admin-action', { pin, action: 'show-podium' });
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-[40px] border-8 border-oxxo-red text-center shadow-2xl max-w-sm w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-4 bg-oxxo-yellow"></div>
                    <img src="/logo2.svg" className="h-24 mx-auto mb-8 drop-shadow-md logo-zuynch mt-4" />
                    <h2 className="text-3xl font-black text-oxxo-red mb-6 tracking-tight uppercase">QUIZ ADMIN</h2>
                    <input
                        value={pin} onChange={e => setPin(e.target.value)}
                        className="w-full mb-6 p-4 rounded-2xl bg-gray-50 text-oxxo-red text-center font-black text-3xl border-2 border-gray-200 focus:border-oxxo-yellow focus:outline-none"
                        placeholder="PIN"
                    />
                    <button onClick={connectToRoom} className="w-full bg-oxxo-red py-4 rounded-2xl font-black text-white text-xl hover:scale-105 shadow-xl active:translate-y-1 transition-all">
                        ENTRAR MODO DIOS
                    </button>
                </div>
            </div>
        );
    }

    // Calculate live stats (mocked for visualization based on prompt, or real if backend sends it)
    // Since we don't have individual answer tracking in the simple backend yet, we'll visualize Score distribution roughly
    // Or just mock the "Answer distribution" visual the user asked for.
    const chartData = {
        labels: ['A', 'B', 'C', 'D'],
        datasets: [
            {
                label: 'Respuestas en Tiempo Real',
                data: [12, 19, 3, 5], // Mock data as requested for the visual
                backgroundColor: ['#E51A22', '#E51A22', '#E51A22', '#E51A22'],
            }
        ]
    };

    return (
        <div className="min-h-screen bg-gray-50 text-dark-gray font-sans flex flex-col">
            <Modal
                show={modal.show}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onClose={closeModal}
            />

            {/* Header */}
            <header className="bg-white p-4 border-b-4 border-oxxo-red flex justify-between items-center sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-4">
                    <img src="/logo2.svg" className="h-10 drop-shadow-sm" />
                    <span className="font-black text-oxxo-red border-l-2 border-gray-200 pl-4 ml-4 tracking-widest text-sm uppercase">QUIZ MODERADOR</span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Total de Jugadores (sin ADMIN) */}
                    <div className="flex items-center gap-3 bg-gray-100 px-5 py-2 rounded-full border border-gray-200">
                        <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                        <div className="flex flex-col">
                            <span className="font-black text-xl text-dark-gray">{roomUsers.length}</span>
                            <span className="text-[10px] text-gray-500 font-bold -mt-1 uppercase tracking-tighter">Jugadores Conectados</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Control Maestro */}
                <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-2 bg-oxxo-yellow"></div>

                    <div>
                        <h2 className="text-3xl font-black mb-2 text-dark-gray uppercase tracking-tighter">Panel de Control</h2>
                        <p className="text-gray-500 font-medium mb-8">Administra el flujo del evento en vivo.</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={triggerNextQuestion}
                            className="w-full py-6 bg-oxxo-red hover:bg-red-600 text-white text-2xl font-black rounded-2xl shadow-[0_6px_0_rgb(150,0,0)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-4"
                        >
                            <span>🚀</span> SIGUIENTE PREGUNTA
                        </button>

                        <button
                            onClick={() => socket.emit('admin-action', { pin, action: 'reveal-round-winner' })}
                            className="w-full py-4 bg-oxxo-yellow text-black hover:bg-yellow-400 text-xl font-bold rounded-2xl shadow-[0_4px_0_rgb(180,140,0)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            <span>⚡</span> REVELAR FLASH DE LA RONDA
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            <button className="py-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-black text-gray-600 transition-colors uppercase text-sm">
                                ⏳ 10s Timer
                            </button>
                            <button
                                onClick={() => socket.emit('admin-action', { pin, action: 'show-podium' })}
                                className="py-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-black text-gray-600 transition-colors uppercase text-sm"
                            >
                                🏆 Ver Ganadores
                            </button>
                        </div>

                        {/* Question List / Timeline */}
                        <div className="mt-8 bg-gray-50 rounded-2xl p-6 border-2 border-gray-100 max-h-60 overflow-y-auto custom-scrollbar">
                            <h3 className="text-gray-400 font-black mb-4 text-xs uppercase tracking-widest pl-1">Rutas de Preguntas ({currentQuestionIndex}/{questions.length})</h3>
                            {questions.length === 0 ? (
                                <p className="text-gray-500 italic text-sm">No hay preguntas cargadas.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {questions.map((q, i) => {
                                        const isNext = i === currentQuestionIndex;
                                        const isPast = i < currentQuestionIndex;
                                        return (
                                            <li key={i} className={`p-4 rounded-xl text-sm font-bold flex gap-3 transition-colors ${isNext ? 'bg-oxxo-red/5 border-l-8 border-oxxo-red text-dark-gray' : isPast ? 'bg-gray-100 text-gray-300' : 'bg-white border border-gray-100 text-gray-400'}`}>
                                                <span className="font-mono text-oxxo-red opacity-40">#{i + 1}</span>
                                                <div className="flex-1 truncate">
                                                    {q.pregunta || q.question}
                                                </div>
                                                {isNext && <span className="text-[10px] bg-oxxo-red text-white px-2 py-1 rounded-md font-black tracking-tighter">ACTUAL</span>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Visualizador & Podio */}
                <div className="flex flex-col gap-8">
                    {/* Chart Area */}
                    <div className="bg-white p-8 rounded-[40px] border-2 border-gray-100 flex-1 shadow-xl">
                        <h3 className="font-black text-gray-400 mb-8 uppercase tracking-widest text-xs pl-2">Distribución de Respuestas</h3>
                        <div className="h-64 flex items-end justify-between px-8 gap-4">
                            {/* Custom Bar Implementation with Tailwind for nicer look than ChartJS sometimes */}
                            {[45, 80, 20, 60].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                                    <div className="font-bold mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
                                    <div
                                        className="w-full bg-gradient-to-t from-oxxo-red to-red-500 rounded-t-xl transition-all duration-1000 relative"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20"></div>
                                    </div>
                                    <div className="mt-4 font-bold text-xl text-gray-500">{['A', 'B', 'C', 'D'][i]}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Podio Button */}
                    <button
                        onClick={showWinners}
                        className="w-full py-6 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black text-2xl font-black rounded-2xl shadow-[0_6px_0_rgb(180,140,0)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
                    >
                        <span>🏆</span> MOSTRAR GANADORES
                    </button>
                </div>
            </main>

            {/* Moderation Section */}
            <section className="p-8 border-t border-gray-800">
                <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
                    <span className="text-oxxo-yellow">🛡️</span> Moderación Conecta
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pending Column */}
                    <div className="bg-white rounded-[40px] p-8 border-2 border-gray-100 shadow-xl">
                        <h3 className="text-xl font-black text-dark-gray mb-6 flex justify-between items-center uppercase tracking-tighter">
                            POR APROBAR <span className="bg-gray-100 px-4 py-1 rounded-full text-xs text-gray-500 font-black">{pendingQuestions.length}</span>
                        </h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {pendingQuestions.map(q => (
                                <div key={q.id} className="bg-white text-black p-4 rounded-xl shadow-lg border-l-8 border-gray-400">
                                    <p className="font-bold text-lg mb-2">{q.pregunta_texto}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 font-bold uppercase">{q.usuario}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => socket.emit('moderator-approve', q.id)}
                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-md active:scale-95 transition-transform"
                                            >
                                                ✅ Aprobar
                                            </button>
                                            <button
                                                onClick={() => socket.emit('moderator-reject', q.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-md active:scale-95 transition-transform"
                                            >
                                                🗑️ Descartar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {pendingQuestions.length === 0 && (
                                <div className="text-center text-gray-500 py-10 italic">No hay preguntas pendientes</div>
                            )}
                        </div>
                    </div>

                    {/* Approved Column */}
                    <div className="bg-white rounded-[40px] p-8 border-2 border-gray-100 shadow-xl">
                        <h3 className="text-xl font-black text-oxxo-red mb-6 flex justify-between items-center uppercase tracking-tighter">
                            <span>PREGUNTAS EN VIVO <span className="bg-oxxo-yellow text-black px-4 py-1 rounded-full text-xs font-black ml-2 shadow-sm">{approvedQuestions.length}</span></span>
                            <button
                                onClick={() => socket.emit('moderator-unfocus')}
                                className="text-[10px] bg-gray-50 hover:bg-gray-100 text-gray-500 px-3 py-2 rounded-xl transition-all border border-gray-200 font-black shadow-sm"
                            >
                                👁️ QUITAR FOCO
                            </button>
                        </h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {approvedQuestions.map(q => (
                                <div key={q.id} className="bg-white text-black p-4 rounded-xl shadow-lg border-l-8 border-oxxo-red">
                                    <p className="font-bold text-lg mb-2">{q.pregunta_texto}</p>
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-gray-500 font-bold uppercase">{q.usuario}</span>
                                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                                ▲ {q.upvotes}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => socket.emit('moderator-focus', q.id)}
                                                className="bg-oxxo-yellow hover:bg-yellow-400 text-black px-3 py-1 rounded-lg font-bold shadow-sm text-sm"
                                            >
                                                ★ Destacar
                                            </button>
                                            <button
                                                onClick={() => socket.emit('moderator-archive', q.id)}
                                                className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg font-bold shadow-md active:scale-95 transition-transform text-sm"
                                            >
                                                📦 Archivar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {approvedQuestions.length === 0 && (
                                <div className="text-center text-gray-500 py-10 italic">La pantalla está limpia</div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Management Section */}
            <section className="p-8 border-t-2 border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50">
                {/* New Question Form */}
                <div className="bg-white rounded-[40px] p-8 border-2 border-gray-100 shadow-lg">
                    <h2 className="text-xl font-black text-dark-gray mb-6 uppercase tracking-tighter">📝 Nueva Pregunta de Reto</h2>
                    <NewQuestionForm showModal={showModal} pin={pin} />
                </div>
                {/* Excel Import */}
                <div className="bg-white rounded-[40px] p-8 border-2 border-gray-100 shadow-lg">
                    <h2 className="text-xl font-black text-dark-gray mb-6 uppercase tracking-tighter">📂 Importar desde Excel (Sala {pin})</h2>
                    <ExcelImport showModal={showModal} pin={pin} />
                </div>
            </section>
        </div >
    );
}

function ExcelImport({ showModal, pin }) {
    const [previewData, setPreviewData] = useState([]);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const bstr = event.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                if (data.length === 0) {
                    showModal('Archivo Vacío', 'El archivo Excel no parece contener datos válidos.', 'error');
                    return;
                }
                setPreviewData(data);
            } catch (e) {
                showModal('Error de Lectura', 'No se pudo leer el archivo Excel. Verifica el formato.', 'error');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmImport = async () => {
        if (!pin) {
            showModal('Error', 'Debes estar conectado a una sala para importar preguntas.', 'error');
            return;
        }

        setUploading(true);
        try {
            const res = await fetch(`${API_URL}/api/import-questions-sala`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin: pin,
                    questions: previewData
                })
            });
            const result = await res.json();
            if (result.success) {
                showModal('¡Éxito!', `¡Energía cargada con éxito! Se importaron ${result.count} preguntas para la sala ${pin}.`, 'success');
                setPreviewData([]);
            } else {
                showModal('Error', result.error || 'Error desconocido al importar.', 'error');
            }
        } catch (error) {
            console.error(error);
            showModal('Error de Conexión', 'No se pudo conectar con el servidor.', 'error');
        }
        setUploading(false);
    };

    return (
        <div>
            {!previewData.length ? (
                <div className="flex flex-col gap-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                const ws = XLSX.utils.json_to_sheet([
                                    { pregunta: 'Ej: ¿Capital de Francia?', opcion_a: 'Roma', opcion_b: 'París', opcion_c: 'Madrid', opcion_d: 'Berlín', respuesta_correcta: 'b' }
                                ]);
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
                                XLSX.writeFile(wb, "plantilla_preguntas.xlsx");
                            }}
                            className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            ⬇️ Descargar Plantilla
                        </button>
                    </div>

                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-xl hover:border-oxxo-red transition-colors relative cursor-pointer group">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📄</div>
                        <p className="font-bold text-gray-400 group-hover:text-white">Arrastra o haz clic para subir Excel</p>
                        <p className="text-xs text-gray-600 mt-2">Columnas: pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar border border-gray-700 rounded-lg">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-gray-700 text-white sticky top-0">
                                <tr>
                                    <th className="p-2">Pregunta</th>
                                    <th className="p-2">Correcta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, i) => (
                                    <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="p-2 truncate max-w-[200px]">{row.pregunta || row.question}</td>
                                        <td className="p-2 font-bold text-oxxo-yellow">{row.respuesta_correcta || row.correctOption}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleConfirmImport}
                            disabled={uploading}
                            className="flex-1 bg-oxxo-red hover:bg-red-600 text-white font-bold py-3 rounded-lg shadow-[0_4px_0_rgb(150,0,0)] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Cargando...' : `Confirmar Carga (${previewData.length})`}
                        </button>
                        <button
                            onClick={() => setPreviewData([])}
                            disabled={uploading}
                            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function NewQuestionForm({ showModal, pin }) {
    const [formData, setFormData] = useState({
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'a',
        timeLimit: 45
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/api/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, pin })
            });
            showModal('¡Guardado!', 'Pregunta guardada con éxito.', 'success');
            setFormData({
                question: '',
                optionA: '',
                optionB: '',
                optionC: '',
                optionD: '',
                correctOption: 'a',
                timeLimit: 45
            });
        } catch (error) {
            showModal('Error', 'Error al guardar la pregunta.', 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input name="question" value={formData.question} onChange={handleChange} placeholder="Texto de la pregunta" className="w-full p-3 bg-gray-700 rounded-lg text-white" required />
            <div className="grid grid-cols-2 gap-2">
                <input name="optionA" value={formData.optionA} onChange={handleChange} placeholder="Opción A" className="w-full p-2 bg-gray-700 rounded-lg text-white" required />
                <input name="optionB" value={formData.optionB} onChange={handleChange} placeholder="Opción B" className="w-full p-2 bg-gray-700 rounded-lg text-white" required />
                <input name="optionC" value={formData.optionC} onChange={handleChange} placeholder="Opción C" className="w-full p-2 bg-gray-700 rounded-lg text-white" required />
                <input name="optionD" value={formData.optionD} onChange={handleChange} placeholder="Opción D" className="w-full p-2 bg-gray-700 rounded-lg text-white" required />
            </div>
            <div className="flex gap-4">
                <select name="correctOption" value={formData.correctOption} onChange={handleChange} className="p-3 bg-gray-700 rounded-lg text-white font-bold">
                    <option value="a">Correcta: A</option>
                    <option value="b">Correcta: B</option>
                    <option value="c">Correcta: C</option>
                    <option value="d">Correcta: D</option>
                </select>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg">Guardar Pregunta</button>
            </div>
        </form>
    );
}

export default AdminPanel;
