const mysql = require('mysql2/promise');

async function fixSchema() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'Netbios85*', // Use the VPS password directly here
        database: 'zuynch_db'
    });

    try {
        console.log('Validating connection...');
        await pool.query('SELECT 1');
        console.log('Connection successful.');

        // 1. Create salas table
        console.log('Checking/Creating table: salas');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS salas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pin VARCHAR(10) NOT NULL UNIQUE,
                nombre VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table salas is ready.');

        // 2. Add sala_id to reto_preguntas if not exists
        console.log('Checking column: sala_id on retos_preguntas');
        try {
            await pool.query(`
                ALTER TABLE retos_preguntas 
                ADD COLUMN sala_id INT NULL,
                ADD CONSTRAINT fk_sala_id FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE
            `);
            console.log("Column 'sala_id' added successfully.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'sala_id' already exists.");
            } else {
                console.error("Error adding column sala_id:", e.message);
            }
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fixSchema();
