const mysql = require('mysql2/promise');

async function setup() {
    try {
        // Connect to MySQL server 
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });

        console.log('Connected to MySQL connecting...');

        // 1. Create Database
        await connection.query(`CREATE DATABASE IF NOT EXISTS zuynch_db`);
        console.log('Database "zuynch_db" checked/created.');

        // Switch to database
        await connection.changeUser({ database: 'zuynch_db' });

        // 2. Create Table: retos_preguntas
        const createRetosQuery = `
            CREATE TABLE IF NOT EXISTS retos_preguntas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pregunta TEXT NOT NULL,
                opcion_a VARCHAR(255) NOT NULL,
                opcion_b VARCHAR(255) NOT NULL,
                opcion_c VARCHAR(255) NOT NULL,
                opcion_d VARCHAR(255) NOT NULL,
                respuesta_correcta CHAR(1) NOT NULL, -- 'A', 'B', 'C' o 'D'
                puntos INT DEFAULT 100
            )
        `;
        await connection.query(createRetosQuery);
        console.log('Table "retos_preguntas" checked/created.');

        // 3. Create Table: conecta_preguntas
        const createConectaQuery = `
            CREATE TABLE IF NOT EXISTS conecta_preguntas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario VARCHAR(100) DEFAULT 'Anónimo',
                pregunta_texto TEXT NOT NULL,
                upvotes INT DEFAULT 0,
                aprobada BOOLEAN DEFAULT FALSE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(createConectaQuery);
        console.log('Table "conecta_preguntas" checked/created.');

        // 4. Seed Data
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM retos_preguntas');
        if (rows[0].count === 0) {
            const seedQuery = `
                INSERT INTO retos_preguntas (pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta) VALUES
                ('¿Cuál es el mensaje clave de zuynch?', 'Energía pura', 'Sincronizando la energía de OXXO', 'Conexión total', 'OXXO en vivo', 'B'),
                ('¿Qué tecnología usa el backend?', 'Python', 'Node.js', 'PHP', 'Java', 'B'),
                ('¿Cuál es la capital de Francia?', 'Paris', 'Roma', 'Berlin', 'Madrid', 'A')
            `;
            await connection.query(seedQuery);
            console.log('Seeded sample questions into "retos_preguntas".');
        }

        console.log('Database setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
}

setup();
