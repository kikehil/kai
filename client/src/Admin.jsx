import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const socket = io('http://localhost:3000');

function Admin() {
    const [pin, setPin] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [roomData, setRoomData] = useState({ users: [] });
    const [conectaQuestions, setConectaQuestions] = useState([]);
    const [activityFeed, setActivityFeed] = useState([]);
    const [branding, setBranding] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3000/api/config')
            .then(res => res.json())
            .then(setBranding);

        socket.on('update-room', (data) => {
            setRoomData(data);
        });

        socket.on('conecta-questions-update', setConectaQuestions);

        socket.on('power-effect', (data) => {
            addFeed(`⚡ ${data.attackerName} usó ${data.type} contra ${data.targetName}`);
        });

        // Request initial data
        socket.emit('get-conecta-questions');

        return () => {
            socket.off('update-room');
            socket.off('conecta-questions-update');
            socket.off('power-effect');
        };
    }, []);

    const addFeed = (msg) => {
        setActivityFeed(prev => [msg, ...prev].slice(0, 10));
    };

    const connectToRoom = () => {
        if (pin) {
            // Admin joins as a special user or just listens? 
            // For simplicity, joining as 'ADMIN'
            socket.emit('join-game', { username: 'ADMIN', pin });
            setIsConnected(true);
        }
    };

    const sendAction = (action) => {
        socket.emit('admin-action', { pin, action });
    };

    const approveQuestion = (id) => {
        socket.emit('approve-conecta-question', id);
    };

    // Chart Data Preparation
    const scores = roomData.users.filter(u => u.username !== 'ADMIN').map(u => u.score);
    const names = roomData.users.filter(u => u.username !== 'ADMIN').map(u => u.username);

    const chartData = {
        labels: names,
        datasets: [
            {
                label: 'Puntaje en Vivo',
                data: scores,
                backgroundColor: '#E51A22', // OXXO Red
                borderColor: '#FFF200', // Yellow Border
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: 'white' } },
            title: { display: true, text: 'Rendimiento de Jugadores', color: 'white' },
        },
        scales: {
            y: { ticks: { color: 'gray' }, grid: { color: '#333' } },
            x: { ticks: { color: 'gray' }, grid: { color: '#333' } }
        }
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-dark-gray text-white flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-8">Panel de Moderador</h1>
                <input
                    value={pin} onChange={e => setPin(e.target.value)}
                    placeholder="Ingresar PIN de Sala"
                    className="p-4 rounded text-black text-center text-xl mb-4"
                />
                <button onClick={connectToRoom} className="bg-oxxo-red px-8 py-3 rounded font-bold text-xl">
                    CONECTAR
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-dark-gray text-white font-sans p-6">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 bg-black/40 p-4 rounded-xl border border-gray-700">
                <div className="flex items-center gap-4">
                    <img src="http://localhost:3000/logo.svg" className="h-12" alt="Logo" />
                    <h1 className="text-2xl font-bold text-gray-300">MODERATOR PANEL | Sala: <span className="text-oxxo-yellow">{pin}</span></h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => sendAction('launch-question')} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-bold transition">Lanzar Pregunta</button>
                    <button onClick={() => sendAction('show-podium')} className="bg-oxxo-yellow text-black hover:bg-yellow-300 px-6 py-2 rounded font-bold transition">Mostrar Podio</button>
                    <button onClick={() => sendAction('end-game')} className="bg-oxxo-red hover:bg-red-600 px-6 py-2 rounded font-bold transition">Finalizar Juego</button>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6">

                {/* Main Stats / Chart */}
                <div className="col-span-12 lg:col-span-8 bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">📊 Métricas en Vivo</h2>
                    <div className="h-[400px] flex items-center justify-center">
                        {names.length > 0 ? <Bar options={chartOptions} data={chartData} /> : <p className="text-gray-500">Esperando jugadores...</p>}
                    </div>
                </div>

                {/* Sidebar: Activity + Top 3 */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                    {/* Top 3 Highlighters */}
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-oxxo-yellow">🏆 Líderes</h2>
                        <div className="space-y-3">
                            {roomData.users
                                .filter(u => u.username !== 'ADMIN')
                                .sort((a, b) => b.score - a.score)
                                .slice(0, 3)
                                .map((u, i) => (
                                    <div key={u.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg border-l-4 border-oxxo-red">
                                        <span className="font-bold flex gap-2">
                                            {i === 0 && '👑'} {u.username}
                                        </span>
                                        <span className="font-bold text-oxxo-yellow">{u.score} pts</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex-1">
                        <h2 className="text-xl font-bold mb-4">🔔 Actividad Reciente</h2>
                        <ul className="space-y-2 text-sm text-gray-300 overflow-y-auto max-h-[300px]">
                            {activityFeed.map((msg, idx) => (
                                <li key={idx} className="border-b border-gray-700 pb-1">{msg}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Q&A Management */}
                <div className="col-span-12 bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        💬 Gestión Conecta Zuynch
                        <span className="text-xs bg-gray-600 px-2 py-1 rounded text-white">{conectaQuestions.length} preguntas</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {conectaQuestions.map(q => (
                            <div key={q.id} className={`p-4 rounded-xl border ${q.aprobada ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-700'}`}>
                                <p className="font-medium text-white mb-2">"{q.pregunta_texto}"</p>
                                <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                                    <span>{q.usuario}</span>
                                    <span className="flex items-center gap-1 text-oxxo-yellow">▲ {q.upvotes}</span>
                                </div>
                                {!q.aprobada ? (
                                    <button
                                        onClick={() => approveQuestion(q.id)}
                                        className="w-full py-2 bg-oxxo-yellow text-black font-bold rounded hover:brightness-110"
                                    >
                                        APROBAR
                                    </button>
                                ) : (
                                    <div className="text-green-400 text-center font-bold text-sm">✅ APROBADA</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Admin;
