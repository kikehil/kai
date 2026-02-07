const mysql = require('mysql2/promise');

async function updateSchema() {
    try {
        console.log('Conectando a MySQL...');
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'zuynch_db'
        });

        console.log('Actualizando esquema de base de datos...');

        // 1. Crear tabla de salas
        await conn.query(`
            CREATE TABLE IF NOT EXISTS salas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pin VARCHAR(10) UNIQUE NOT NULL,
                nombre VARCHAR(100),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activa BOOLEAN DEFAULT TRUE
            )
        `);
        console.log('✅ Tabla salas creada/verificada');

        // 2. Modificar tabla retos_preguntas para asociarla con salas
        // Primero verificar si la columna sala_id ya existe
        const [columns] = await conn.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'zuynch_db' 
            AND TABLE_NAME = 'retos_preguntas' 
            AND COLUMN_NAME = 'sala_id'
        `);

        if (columns.length === 0) {
            await conn.query(`
                ALTER TABLE retos_preguntas 
                ADD COLUMN sala_id INT NULL,
                ADD FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE
            `);
            console.log('✅ Columna sala_id agregada a retos_preguntas');
        } else {
            console.log('✅ Columna sala_id ya existe en retos_preguntas');
        }

        // 3. Crear tabla de respuestas de usuarios (para evitar respuestas duplicadas)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS respuestas_usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sala_pin VARCHAR(10) NOT NULL,
                socket_id VARCHAR(100) NOT NULL,
                pregunta_id INT NOT NULL,
                respuesta VARCHAR(1) NOT NULL,
                es_correcta BOOLEAN NOT NULL,
                tiempo_respuesta INT NOT NULL,
                fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_respuesta (sala_pin, socket_id, pregunta_id)
            )
        `);
        console.log('✅ Tabla respuestas_usuarios creada/verificada');

        // 4. Actualizar tabla ranking_historico para incluir sala
        const [rankingColumns] = await conn.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'zuynch_db' 
            AND TABLE_NAME = 'ranking_historico' 
            AND COLUMN_NAME = 'sala_pin'
        `);

        if (rankingColumns.length === 0) {
            await conn.query(`
                ALTER TABLE ranking_historico 
                ADD COLUMN sala_pin VARCHAR(10) NULL
            `);
            console.log('✅ Columna sala_pin agregada a ranking_historico');
        } else {
            console.log('✅ Columna sala_pin ya existe en ranking_historico');
        }

        console.log('\n🎉 Actualización de esquema completada!');
        await conn.end();
        process.exit(0);

    } catch (err) {
        console.error('❌ Error actualizando esquema:', err);
        process.exit(1);
    }
}

updateSchema();
