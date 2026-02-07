const mysql = require('mysql2/promise');

async function testDB() {
    try {
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'zuynch_db'
        });

        console.log("Checking DB connection...");
        const [showTables] = await pool.query('SHOW TABLES');
        console.log("Tables:", showTables.map(t => Object.values(t)[0]));

        console.log("Checking preguntas_reto...");
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM preguntas_reto');
        console.log("Preguntas count:", rows[0].count);

        const [q] = await pool.query('SELECT * FROM preguntas_reto LIMIT 1');
        console.log("Sample question:", q[0]);

        process.exit(0);
    } catch (e) {
        console.error("DB Error:", e);
        process.exit(1);
    }
}

testDB();
