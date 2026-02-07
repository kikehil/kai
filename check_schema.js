const mysql = require('mysql2/promise');

async function checkSchema() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'zuynch_db' });
    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM conecta_preguntas');
        console.log(columns.map(c => c.Field));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
