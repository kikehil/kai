const mysql = require('mysql2/promise');

async function updateSchema() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'zuynch_db'
    });

    try {
        console.log("Checking schema...");
        // Add tiempo_limite if missing
        try {
            await pool.query("ALTER TABLE retos_preguntas ADD COLUMN tiempo_limite INT DEFAULT 45");
            console.log("Column 'tiempo_limite' added successfully.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'tiempo_limite' already exists.");
            } else {
                console.error("Error adding column:", e.message);
            }
        }

    } catch (error) {
        console.error("Schema update failed:", error);
    } finally {
        await pool.end();
    }
}

updateSchema();
