const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    // Parámetros de estabilidad para alta concurrencia
    pingTimeout: 60000,  // 60 segundos para considerar una conexión perdida
    pingInterval: 25000  // Envía un latido cada 25 segundos para mantener el túnel vivo
});

app.use(cors());
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'zuynch_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function checkDb() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL via XAMPP (zuynch_db)');
        connection.release();
    } catch (error) {
        console.error('Error connecting to MySQL:', error.message);
    }
}
checkDb();

// Structure: { [pin]: { 
//    users: { [socketId]: { id, username, score, coins, isFrozen, powerUnlocked } }, 
//    status: 'waiting'|'playing',
//    currentRound: { startTime: timestamp, active: boolean, answers: { [socketId]: { username, correct, time } } } 
// } }
const games = {};

app.get('/api/config', (req, res) => {
    res.json({
        eventName: 'Kai Event',
        colors: { background: '#1A1A1A', primary: '#E51A22', accent: '#FFF200' },
        logoUrl: '/logo2.svg'
    });
});

app.get('/api/questions', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM retos_preguntas ORDER BY RAND() LIMIT 10');
        res.json(rows.map(r => {
            return {
                id: r.id,
                question_text: r.pregunta,
                option_a: r.opcion_a,
                option_b: r.opcion_b,
                option_c: r.opcion_c,
                option_d: r.opcion_d,
                correct_option: r.respuesta_correcta ? r.respuesta_correcta.toLowerCase() : 'a'
            };
        }));
    } catch (error) {
        res.status(500).json({ error: 'Error fetching questions.' });
    }
});

app.post('/api/questions', async (req, res) => {
    const { question, optionA, optionB, optionC, optionD, correctOption, timeLimit } = req.body;
    try {
        await pool.query(
            'INSERT INTO retos_preguntas (pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, tiempo_limite) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [question, optionA, optionB, optionC, optionD, correctOption, timeLimit || 45]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error saving question.' });
    }
});

app.post('/api/import-questions', async (req, res) => {
    const questions = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Invalid data format or empty array.' });
    }

    try {
        const values = questions.map(q => [
            q.pregunta || q.question,
            q.opcion_a || q.optionA,
            q.opcion_b || q.optionB,
            q.opcion_c || q.optionC,
            q.opcion_d || q.optionD,
            (q.respuesta_correcta || q.correctOption || 'a').toLowerCase(),
            q.tiempo_limite || q.timeLimit || 45
        ]);

        if (values.some(row => row.slice(0, 5).some(field => !field))) {
            return res.status(400).json({ error: 'Missing required fields in one or more questions.' });
        }

        await pool.query(
            'INSERT INTO retos_preguntas (pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, tiempo_limite) VALUES ?',
            [values]
        );

        res.json({ success: true, count: values.length });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: error.sqlMessage || error.message || 'Error importing questions.' });
    }
});

io.on('connection', (socket) => {
    console.log(`Colaborador conectado: ${socket.id}`);

    socket.on('join-game', async ({ pin, username }) => {
        if (!pin || !username) return;

        console.log(`[JOIN] ${username} (${socket.id}) joining room ${pin}`);

        socket.join(pin);

        if (username === 'ADMIN') {
            socket.join('moderators');
            // Send initial moderation data
            try {
                const [pending] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='pendiente' ORDER BY fecha_creacion DESC");
                const [approved] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='aprobada' ORDER BY upvotes DESC, fecha_creacion DESC");
                socket.emit('moderator-update', { pending, approved });
            } catch (e) { console.error(e); }
        }

        if (!games[pin]) {
            games[pin] = { users: {}, status: 'waiting' };
            console.log(`[ROOM CREATED] Room ${pin} created`);
        }

        games[pin].users[socket.id] = {
            id: socket.id,
            username,
            score: 0,
            coins: 0,
            isFrozen: false,
            powerUnlocked: false,
            streak: 0
        };

        // Ordenar usuarios por score antes de enviar
        const sortedUsers = Object.values(games[pin].users).sort((a, b) => b.score - a.score);

        console.log(`[ROOM UPDATE] Room ${pin} now has ${sortedUsers.length} users:`, sortedUsers.map(u => u.username));

        // Emitir a TODA la sala incluyendo el usuario que acaba de unirse
        io.to(pin).emit('update-room', {
            users: sortedUsers,
            pin
        });
    });

    socket.on('send-answer', ({ pin, isCorrect }) => {
        const room = games[pin];
        if (!room || !room.users[socket.id]) return;

        const user = room.users[socket.id];
        user.streak = user.streak || 0; // Ensure streak init

        // Prevent answer if round not active
        if (!room.currentRound || !room.currentRound.active) {
            socket.emit('error', 'La ronda no está activa.');
            return;
        }

        if (user.isFrozen) {
            socket.emit('error', 'You are frozen!');
            return;
        }

        if (room.currentRound.answers[socket.id]) {
            socket.emit('error', 'Ya respondiste esta pregunta.');
            return;
        }

        const responseTime = Date.now() - room.currentRound.startTime;

        room.currentRound.answers[socket.id] = {
            username: user.username,
            correct: isCorrect,
            time: responseTime
        };

        if (isCorrect) {
            user.streak += 1;
            // Formula: 100 + (15000 - responseTime) / 100
            const bonus = Math.max(0, Math.floor((15000 - responseTime) / 100));
            const points = 100 + bonus;

            user.score += points;
            user.coins += 10;

            if (user.score >= 500 && !user.powerUnlocked) {
                user.powerUnlocked = true;
                socket.emit('notification', '¡Poder desbloqueado!');
            }
        } else {
            user.streak = 0;
        }

        io.to(pin).emit('update-room', {
            users: Object.values(room.users).sort((a, b) => b.score - a.score),
            pin
        });
    });

    socket.on('use-power', ({ pin, type }) => {
        const room = games[pin];
        if (!room) return;
        const attacker = room.users[socket.id];

        if (!attacker || attacker.coins < 50) {
            socket.emit('error', 'Monedas insuficientes (Costo: 50)');
            return;
        }

        if (type === 'freeze-leader') {
            const sorted = Object.values(room.users).sort((a, b) => b.score - a.score);
            const leader = sorted.find(u => u.id !== socket.id);

            if (leader) {
                attacker.coins -= 50;
                room.users[leader.id].isFrozen = true;

                io.to(pin).emit('power-effect', {
                    type: 'congelado',
                    targetId: leader.id,
                    attackerName: attacker.username,
                    targetName: leader.username
                });

                io.to(pin).emit('update-room', {
                    users: Object.values(room.users).sort((a, b) => b.score - a.score),
                    pin
                });

                setTimeout(() => {
                    if (room.users[leader.id]) room.users[leader.id].isFrozen = false;
                }, 5000);
            } else {
                socket.emit('error', 'No hay líder a quien atacar.');
            }
        }
    });

    socket.on('disconnect', () => {
        for (const pin in games) {
            if (games[pin].users[socket.id]) {
                delete games[pin].users[socket.id];
                io.to(pin).emit('update-room', {
                    users: Object.values(games[pin].users),
                    pin
                });
                if (Object.keys(games[pin].users).length === 0) delete games[pin];
            }
        }
    });

    // Q&A
    socket.on('get-conecta-questions', async () => {
        const [rows] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='aprobada' ORDER BY upvotes DESC, fecha_creacion DESC");
        socket.emit('conecta-questions-update', rows);
    });

    socket.on('post-conecta-question', async ({ text, user }) => {
        // Save as pending
        await pool.query("INSERT INTO conecta_preguntas (pregunta_texto, usuario, estado) VALUES (?, ?, 'pendiente')", [text, user]);

        // Notify moderators only for new pending
        const [pending] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='pendiente' ORDER BY fecha_creacion DESC");
        const [approved] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='aprobada' ORDER BY upvotes DESC, fecha_creacion DESC");
        io.to('moderators').emit('moderator-update', { pending, approved });
    });

    socket.on('upvote-conecta-question', async (id) => {
        await pool.query('UPDATE conecta_preguntas SET upvotes = upvotes + 1 WHERE id = ?', [id]);
        const [rows] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='aprobada' ORDER BY upvotes DESC, fecha_creacion DESC");
        io.emit('conecta-questions-update', rows);

        // Update moderators too so they see updated upvotes on approved list
        const [pending] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='pendiente' ORDER BY fecha_creacion DESC");
        io.to('moderators').emit('moderator-update', { pending, approved: rows });
    });

    // Moderation Actions
    socket.on('moderator-approve', async (id) => {
        await pool.query("UPDATE conecta_preguntas SET estado='aprobada' WHERE id = ?", [id]);

        // Update All (Public sees new approved Q)
        const [approved] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='aprobada' ORDER BY upvotes DESC, fecha_creacion DESC");
        io.emit('conecta-questions-update', approved);

        // Update Mods
        const [pending] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='pendiente' ORDER BY fecha_creacion DESC");
        io.to('moderators').emit('moderator-update', { pending, approved });
    });

    socket.on('moderator-reject', async (id) => {
        await pool.query("UPDATE conecta_preguntas SET estado='archivada' WHERE id = ?", [id]);

        // Update Mods only (removed from pending)
        const [pending] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='pendiente' ORDER BY fecha_creacion DESC");
        const [approved] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='aprobada' ORDER BY upvotes DESC, fecha_creacion DESC");
        io.to('moderators').emit('moderator-update', { pending, approved });
    });

    socket.on('moderator-archive', async (id) => {
        await pool.query("UPDATE conecta_preguntas SET estado='archivada' WHERE id = ?", [id]);

        // Update All (removed from public)
        const [approved] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='aprobada' ORDER BY upvotes DESC, fecha_creacion DESC");
        io.emit('conecta-questions-update', approved);

        // Update Mods
        const [pending] = await pool.query("SELECT * FROM conecta_preguntas WHERE estado='pendiente' ORDER BY fecha_creacion DESC");
        io.to('moderators').emit('moderator-update', { pending, approved });
    });

    // Spotlight Features
    socket.on('moderator-focus', (id) => {
        io.emit('focus-question', id);
    });

    socket.on('moderator-unfocus', () => {
        io.emit('unfocus-question');
    });

    // Admin
    socket.on('admin-action', async ({ pin, action, payload }) => {
        io.to(pin).emit('game-state-change', { action, payload });

        if (action === 'launch-question') {
            if (games[pin]) {
                games[pin].currentRound = { startTime: Date.now(), active: true, answers: {} };
                console.log(`[LAUNCH QUESTION] Initializing round for room ${pin}`);
            } else {
                console.log(`[ERROR] Room ${pin} does not exist`);
                return;
            }
            try {
                // Fixed table name from preguntas_reto to retos_preguntas
                const [rows] = await pool.query('SELECT * FROM retos_preguntas ORDER BY RAND() LIMIT 1');
                if (rows.length > 0) {
                    const q = rows[0];
                    // Options are columns now, not JSON

                    // Get all sockets in the room for debugging
                    const socketsInRoom = await io.in(pin).fetchSockets();
                    console.log(`[LAUNCH QUESTION] Sending question ${q.id} to room ${pin}`);
                    console.log(`[LAUNCH QUESTION] Sockets in room:`, socketsInRoom.map(s => s.id));

                    io.to(pin).emit('game-state-change', { action: 'playing' });
                    io.to(pin).emit('new-question', {
                        id: q.id,
                        question_text: q.pregunta,
                        option_a: q.opcion_a,
                        option_b: q.opcion_b,
                        option_c: q.opcion_c,
                        option_d: q.opcion_d,
                        correct_option: q.respuesta_correcta ? q.respuesta_correcta.toLowerCase() : 'a',
                        time_limit: q.tiempo_limite || 45
                    });

                    console.log(`[LAUNCH QUESTION] Question sent successfully to ${socketsInRoom.length} sockets`);

                    setTimeout(() => {
                        if (games[pin] && games[pin].currentRound) {
                            games[pin].currentRound.active = false;
                            console.log(`[TIMEOUT] Question timeout for room ${pin}`);
                        }
                        io.to(pin).emit('question-timeout', { message: 'Tiempo agotado' });
                    }, (q.tiempo_limite || 45) * 1000);
                }
            } catch (e) { console.error(e); }
        }

        if (action === 'reveal-round-winner') {
            console.log(`Action: reveal-round-winner for room ${pin}`);
            if (games[pin] && games[pin].currentRound) {
                const answers = Object.values(games[pin].currentRound.answers);
                const correctAnswers = answers.filter(a => a.correct);

                if (correctAnswers.length > 0) {
                    // Sort by time (ascending, smallest time is fastest)
                    correctAnswers.sort((a, b) => a.time - b.time);
                    const winner = correctAnswers[0];

                    console.log(`Flash winner found: ${winner.username} with time ${winner.time}ms`);

                    io.to(pin).emit('the-flash-is', {
                        username: winner.username,
                        time: (winner.time / 1000).toFixed(2)
                    });
                } else {
                    console.log('No correct answers found for this round.');
                    io.to(pin).emit('notification', 'Nadie acertó en esta ronda.');
                }
            } else {
                console.log('No active round found to reveal winner.');
            }
        }

        if (action === 'show-podium') {
            if (games[pin]) {
                const sortedUsers = Object.values(games[pin].users).sort((a, b) => b.score - a.score);
                const top3 = sortedUsers.slice(0, 3);

                io.to(pin).emit('game-state-change', { action: 'podium', ranking: top3 });

                // Save to DB
                try {
                    const values = top3.map(u => [u.username, u.score, new Date()]);
                    if (values.length > 0) {
                        await pool.query('INSERT INTO ranking_historico (usuario, puntaje, fecha) VALUES ?', [values]);
                        console.log("Saved rankings to DB");
                    }
                } catch (e) {
                    console.error("Error saving rankings", e);
                }
            }
        }
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Servidor Kai corriendo en puerto 3000');
    console.log('Listo para la energía de OXXO');
});
