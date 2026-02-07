# Sistema de Preguntas por Sala - Kai Game

## 🎯 Nuevas Funcionalidades Implementadas

### 1. **Preguntas Independientes por Sala**
Cada sala tiene su propio conjunto de preguntas que se importan mediante Excel.

### 2. **Respuesta Única por Pregunta**
Los jugadores solo pueden responder una vez por pregunta. Si intentan responder de nuevo, reciben un mensaje de error.

### 3. **Notificaciones de Respuesta**
- ✅ **Correcta:** Muestra puntos ganados y bonus
- ❌ **Incorrecta:** Muestra mensaje de error

### 4. **Validación de Respuesta Correcta**
La respuesta correcta es la que viene marcada en el archivo Excel importado.

---

## 📋 Pasos para Configurar

### 1. Actualizar Base de Datos

**IMPORTANTE:** Antes de usar el sistema, debes actualizar el esquema de la base de datos.

#### En Local (XAMPP):
```bash
# 1. Asegúrate de que XAMPP esté corriendo (MySQL debe estar activo)

# 2. Ejecuta el script de actualización
cd d:\WEB\zuynch
node update_sala_schema.js
```

#### En VPS:
```bash
# 1. Conecta por SSH
ssh root@85.31.224.248

# 2. Ve al directorio del proyecto
cd /var/www/kai/kai

# 3. Ejecuta el script de actualización
node update_sala_schema.js
```

**El script creará:**
- ✅ Tabla `salas` (para gestionar salas)
- ✅ Columna `sala_id` en `retos_preguntas` (asociar preguntas con salas)
- ✅ Tabla `respuestas_usuarios` (prevenir respuestas duplicadas)
- ✅ Columna `sala_pin` en `ranking_historico` (rankings por sala)

---

## 📊 Formato del Archivo Excel

El archivo Excel debe tener las siguientes columnas (en este orden):

| pregunta | opcion_a | opcion_b | opcion_c | opcion_d | respuesta_correcta |
|----------|----------|----------|----------|----------|--------------------|
| ¿En qué año y consola debutó la secuela real (Lost Levels) en Japón? | 1988 - NES | 1986 - Famicom Disk System | 1985 - Arcade | 1987 - GameBoy | b |
| ¿Quién es el compositor de la música original de Mario Bros (1985)? | Nobuo Uematsu | Shigeru Miyamoto | Koji Kondo | Junichi Masuda | c |

### Campos:
- **pregunta**: Texto de la pregunta
- **opcion_a**: Primera opción
- **opcion_b**: Segunda opción
- **opcion_c**: Tercera opción
- **opcion_d**: Cuarta opción
- **respuesta_correcta**: Letra de la respuesta correcta (a, b, c, o d)

### Opcional:
- **tiempo_limite**: Tiempo en segundos (por defecto: 45)

---

## 🎮 Cómo Usar el Sistema

### Paso 1: Crear una Sala

1. Los jugadores se unen con un PIN (ej: 1234)
2. El sistema crea automáticamente la sala en la base de datos
3. **IMPORTANTE:** La sala inicia SIN preguntas

### Paso 2: Importar Preguntas

1. **Abrir el Panel de Admin:**
   ```
   http://localhost:3000/admin
   # o
   http://kai.cerebnodigital.com.mx/admin
   ```

2. **Conectarse a la sala:**
   - Ingresar el mismo PIN que los jugadores (ej: 1234)
   - Click en "CONECTAR"

3. **Importar Excel:**
   - Ir a la sección "IMPORTAR PREGUNTAS"
   - Click en "Seleccionar archivo"
   - Elegir el archivo Excel con las preguntas
   - Revisar la vista previa
   - Click en "CONFIRMAR IMPORTACIÓN"

4. **Confirmación:**
   - Verás un mensaje: "¡Energía cargada con éxito! Se importaron X preguntas para la sala 1234."

### Paso 3: Iniciar el Juego

1. **Lanzar Pregunta:**
   - Click en "SIGUIENTE PREGUNTA"
   - La pregunta se envía a TODOS los jugadores

2. **Los Jugadores Responden:**
   - Cada jugador puede responder **solo UNA vez**
   - Si intenta responder de nuevo, verá: "Ya respondiste esta pregunta. Espera la siguiente."

3. **Notificaciones:**
   - ✅ **Si acierta:** "¡Correcto! +XXX puntos"
   - ❌ **Si falla:** "Respuesta incorrecta. ¡Sigue intentando!"

4. **Siguiente Pregunta:**
   - El admin hace click en "SIGUIENTE PREGUNTA" de nuevo
   - Se muestra la siguiente pregunta de la lista importada

5. **Ciclo de Preguntas:**
   - Las preguntas se muestran en orden
   - Cuando se acaban, vuelven a empezar desde el principio

---

## 🔒 Validaciones Implementadas

### 1. **Respuesta Única**
```javascript
// El servidor verifica si ya respondió
if (room.currentRound.answers[socket.id]) {
    socket.emit('error', 'Ya respondiste esta pregunta. Espera la siguiente.');
    return;
}
```

### 2. **Preguntas por Sala**
```javascript
// Cada sala tiene sus propias preguntas
games[pin] = {
    questions: [...], // Preguntas específicas de esta sala
    currentQuestionIndex: 0
};
```

### 3. **Respuesta Correcta del Excel**
```javascript
// La respuesta correcta viene del Excel importado
correct_option: q.respuesta_correcta.toLowerCase() // 'a', 'b', 'c', o 'd'
```

### 4. **Sala Sin Preguntas**
```javascript
// Si no hay preguntas, no se puede jugar
if (!room.questions || room.questions.length === 0) {
    io.to(pin).emit('error-admin', { 
        message: 'Esta sala no tiene preguntas. Por favor, importa preguntas.' 
    });
    return;
}
```

---

## 🧪 Cómo Probar

### Test Completo:

1. **Iniciar XAMPP** (MySQL debe estar corriendo)

2. **Actualizar BD:**
   ```bash
   cd d:\WEB\zuynch
   node update_sala_schema.js
   ```

3. **Iniciar Servidor:**
   ```bash
   node index.js
   ```

4. **Abrir 3 Pestañas de Jugadores:**
   - `http://localhost:3000`
   - Ingresar nombres: Usuario1, Usuario2, Usuario3
   - Usar el mismo PIN: 1234

5. **Abrir Panel Admin:**
   - `http://localhost:3000/admin`
   - Ingresar PIN: 1234
   - Click en "CONECTAR"

6. **Importar Preguntas:**
   - Seleccionar archivo Excel
   - Confirmar importación
   - Verificar mensaje de éxito

7. **Iniciar Juego:**
   - Click en "SIGUIENTE PREGUNTA"
   - Verificar que TODOS los jugadores ven la pregunta

8. **Probar Respuesta Única:**
   - Usuario1 responde (correcta o incorrecta)
   - Usuario1 intenta responder de nuevo
   - Debe ver: "Ya respondiste esta pregunta. Espera la siguiente."

9. **Verificar Notificaciones:**
   - Si acertó: Ver modal verde con puntos
   - Si falló: Ver modal rojo con mensaje de error

10. **Siguiente Pregunta:**
    - Admin click en "SIGUIENTE PREGUNTA"
    - Verificar que aparece la siguiente pregunta del Excel

---

## 📁 Archivos Modificados

### Backend (index.js):
- ✅ Estructura de `games` actualizada con `questions` y `currentQuestionIndex`
- ✅ Endpoint `/api/import-questions-sala` para importar por sala
- ✅ Evento `join-game` carga preguntas de la sala
- ✅ Evento `send-answer` valida respuesta única y notifica
- ✅ Evento `admin-action` (launch-question) usa preguntas de la sala

### Frontend (AdminPanel.jsx):
- ✅ `handleConfirmImport` usa nuevo endpoint con PIN
- ✅ Validación de conexión antes de importar

### Frontend (App.jsx):
- ✅ Listener `answer-result` para mostrar notificaciones

### Base de Datos:
- ✅ Script `update_sala_schema.js` para actualizar esquema

---

## 🚀 Despliegue a VPS

```bash
# 1. Conectar por SSH
ssh root@85.31.224.248

# 2. Ir al directorio
cd /var/www/kai/kai

# 3. Hacer pull de los cambios
git pull origin main

# 4. Actualizar base de datos
node update_sala_schema.js

# 5. Reiniciar servidor
pm2 restart all
# o
pkill -f "node index.js"
nohup node index.js > server.log 2>&1 &
```

---

## 📝 Logs para Debugging

### Servidor:
```
[ROOM CREATED] Room 1234 created with 5 questions
[IMPORT] 5 preguntas importadas para sala 1234
[LAUNCH QUESTION] Question 1/5: "¿En qué año..."
[SEND-ANSWER] ✅ CORRECT! User Usuario1 earned 150 points
[SEND-ANSWER] ❌ INCORRECT! User Usuario2 failed
[SEND-ANSWER] User Usuario1 already answered this question
```

### Cliente (Consola del Navegador):
```
[CLIENT] Joining game: {username: "Usuario1", pin: "1234"}
[CLIENT] Received update-room: {users: Array(3), pin: "1234"}
[CLIENT] Received new-question: {id: 1, question_text: "...", ...}
```

---

## ✅ Checklist de Funcionalidades

- [x] Preguntas independientes por sala
- [x] Importación de preguntas desde Excel
- [x] Respuesta única por pregunta
- [x] Notificación de respuesta correcta/incorrecta
- [x] Validación de respuesta correcta del Excel
- [x] Sala vacía hasta importar preguntas
- [x] Preguntas en orden (no aleatorias)
- [x] Ciclo de preguntas (reinicia al terminar)
- [x] Logging detallado para debugging

---

## 🎉 ¡Listo!

El sistema ahora está completamente funcional con:
- ✅ Salas independientes
- ✅ Preguntas por sala
- ✅ Respuesta única
- ✅ Notificaciones
- ✅ Validación de respuestas

¡Disfruta tu juego Kai! ⚡
