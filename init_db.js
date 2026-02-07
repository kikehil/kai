const mysql = require('mysql2/promise');

async function initDB() {
    try {
        console.log('Connecting to MySQL (XAMPP)...');
        // Initial connection without specialized DB
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });

        // 1. Create DB
        await conn.query('CREATE DATABASE IF NOT EXISTS zuynch_db');
        console.log('Database zuynch_db checked/created.');

        await conn.changeUser({ database: 'zuynch_db' });

        // 2. Create Table: preguntas_reto
        // Note: Storing options as JSON for flexibility as requested
        await conn.query(`
            CREATE TABLE IF NOT EXISTS preguntas_reto (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pregunta TEXT NOT NULL,
                opciones JSON NOT NULL,
                correcta VARCHAR(10) NOT NULL, -- e.g. 'a', 'b', 'c', 'd'
                tiempo_limite INT DEFAULT 30
            )
        `);
        console.log('Table preguntas_reto checked/created.');

        // 3. Create Table: ranking_historico
        await conn.query(`
            CREATE TABLE IF NOT EXISTS ranking_historico (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                puntaje INT DEFAULT 0,
                evento_fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table ranking_historico checked/created.');

        // 4. Seed Data (5 preguntas de Cultura OXXO)
        const [rows] = await conn.query('SELECT COUNT(*) as count FROM preguntas_reto');
        if (rows[0].count === 0) {
            const seedQuestions = [
                {
                    pregunta: "¿En qué año se fundó la primera tienda OXXO?",
                    opciones: JSON.stringify({ a: "1978", b: "1985", c: "1990", d: "1970" }),
                    correcta: "a",
                    tiempo: 30
                },
                {
                    pregunta: "¿De qué empresa es subsidiaria OXXO?",
                    opciones: JSON.stringify({ a: "Grupo Modelo", b: "FEMSA", c: "Bimbo", d: "Soriana" }),
                    correcta: "b",
                    tiempo: 30
                },
                {
                    pregunta: "¿Qué producto es famoso por su variedad de preparaciones en OXXO?",
                    opciones: JSON.stringify({ a: "Gansito", b: "Vikingo", c: "Andatti", d: "Sabritas" }),
                    correcta: "b",
                    tiempo: 20
                },
                {
                    pregunta: "¿Cuál es el color principal del logo de OXXO?",
                    opciones: JSON.stringify({ a: "Azul", b: "Verde", c: "Rojo", d: "Amarillo" }),
                    correcta: "c",
                    tiempo: 15
                },
                {
                    pregunta: "¿Cómo se llama el programa de lealtad de OXXO?",
                    opciones: JSON.stringify({ a: "Puntos OXXO", b: "OXXO Premia", c: "Cliente Frecuente", d: "Mi OXXO" }),
                    correcta: "b",
                    tiempo: 30
                }
            ];

            for (const q of seedQuestions) {
                await conn.query(
                    'INSERT INTO preguntas_reto (pregunta, opciones, correcta, tiempo_limite) VALUES (?, ?, ?, ?)',
                    [q.pregunta, q.opciones, q.correcta, q.tiempo]
                );
            }
            console.log('Inserted 5 seed questions about OXXO culture.');
        } else {
            console.log('Questions table already populated.');
        }

        console.log('Initialization Complete!');
        process.exit(0);

    } catch (err) {
        console.error('Error in DB Init:', err);
        process.exit(1);
    }
}

initDB();
