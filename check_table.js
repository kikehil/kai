const mysql = require('mysql2/promise');

async function checkTable() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'zuynch_db' });
    try {
        const [rows] = await pool.query('SELECT * FROM retos_preguntas LIMIT 1');
        console.log("Sample row:", rows[0]);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkTable();
