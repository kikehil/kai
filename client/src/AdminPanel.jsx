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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Use dynamic hostname to allow mobile connection via IP
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
const socket = io(API_BASE);

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

    useEffect(() => {
        socket.on('update-room', (data) => {
            setRoomUsers(data.users.filter(u => u.username !== 'ADMIN'));
        });

        socket.on('moderator-update', ({ pending, approved }) => {
            setPendingQuestions(pending);
            setApprovedQuestions(approved);
        });

        // Listen for events if needed to update live bar graph of choices
        // socket.on('live-answer-update', ...)

        return () => {
            socket.off('update-room');
            socket.off('moderator-update');
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
            <div className="min-h-screen bg-dark-gray flex items-center justify-center">
                <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center">
                    <img src={`http://${window.location.hostname}:3000/logo.svg`} className="h-16 mx-auto mb-6 drop-shadow-[0_0_10px_rgba(255,242,0,0.5)]" />
                    <h2 className="text-2xl font-bold text-white mb-4">God Mode Login</h2>
                    <input
                        value={pin} onChange={e => setPin(e.target.value)}
                        className="w-full mb-4 p-3 rounded bg-gray-700 text-white text-center font-bold text-xl"
                        placeholder="PIN"
                    />
                    <button onClick={connectToRoom} className="w-full bg-oxxo-red py-3 rounded font-bold text-white hover:bg-red-600 transition">
                        ENTRAR
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
        <div className="min-h-screen bg-dark-gray text-white font-sans flex flex-col">
            <Modal
                show={modal.show}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onClose={closeModal}
            />

            {/* Header */}
            <header className="bg-black/50 p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <img src={`http://${window.location.hostname}:3000/logo.svg`} className="h-10 drop-shadow-[0_0_8px_rgba(255,242,0,0.6)]" />
                    <span className="font-bold text-gray-400 border-l border-gray-600 pl-4 ml-4">GOD MODE</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
                    <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-bold">{roomUsers.length} Conectados</span>
                </div>
            </header>

            <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Control Maestro */}
                <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-oxxo-red/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    <div>
                        <h2 className="text-3xl font-bold mb-2">Control Maestro</h2>
                        <p className="text-gray-400 mb-8">Administra el flujo del evento en tiempo real.</p>
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
                            <button className="py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-gray-300">
                                Reiniciar Temporizador
                            </button>
                            <button className="py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-gray-300">
                                Pausar Música
                            </button>
                        </div>
                    </div>
                </div>

                {/* Visualizador & Podio */}
                <div className="flex flex-col gap-8">
                    {/* Chart Area */}
                    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 flex-1">
                        <h3 className="font-bold text-gray-400 mb-4 uppercase tracking-wider text-sm">Distribución de Respuestas</h3>
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
                    <div className="bg-gray-800/50 rounded-3xl p-6 border border-gray-700">
                        <h3 className="text-xl font-bold text-gray-400 mb-4 flex justify-between items-center">
                            PENDIENTES <span className="bg-gray-700 px-3 py-1 rounded-full text-sm text-white">{pendingQuestions.length}</span>
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
                    <div className="bg-gray-800/50 rounded-3xl p-6 border border-gray-700">
                        <h3 className="text-xl font-bold text-oxxo-yellow mb-4 flex justify-between items-center">
                            <span>EN VIVO (PÚBLICAS) <span className="bg-oxxo-yellow text-black px-3 py-1 rounded-full text-sm font-bold ml-2">{approvedQuestions.length}</span></span>
                            <button
                                onClick={() => socket.emit('moderator-unfocus')}
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors border border-gray-600"
                            >
                                👁️ Quitar Foco
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
            <section className="p-8 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* New Question Form */}
                <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">📝 Agregar Nueva Pregunta (Reto)</h2>
                    <NewQuestionForm showModal={showModal} />
                </div>
                {/* Excel Import */}
                <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">📂 Importar Excel</h2>
                    <ExcelImport showModal={showModal} />
                </div>
            </section>
        </div >
    );
}

function ExcelImport({ showModal }) {
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
        setUploading(true);
        try {
            const res = await fetch(`${API_BASE}/api/import-questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(previewData)
            });
            const result = await res.json();
            if (result.success) {
                showModal('¡Éxito!', `¡Energía cargada con éxito! Se importaron ${result.count} preguntas.`, 'success');
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

function NewQuestionForm({ showModal }) {
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
            await fetch(`${API_BASE}/api/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
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
