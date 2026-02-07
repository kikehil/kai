const mysql = require('mysql2/promise');

async function updateDB() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'zuynch_db' });
    try {
        await pool.query("ALTER TABLE conecta_preguntas ADD COLUMN estado ENUM('pendiente', 'aprobada', 'archivada') DEFAULT 'pendiente'");
        console.log("Column 'estado' added successfully.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'estado' already exists.");
        } else {
            console.error(e);
        }
    }
    process.exit(0);
}
updateDB();
