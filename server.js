const fastify = require('fastify')({ logger: true });
const io = require('socket.io')(fastify.server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

// Global state object to manage rooms
// Structure: { [pin]: { users: { [socketId]: { username, score, coins, isFrozen } } } }
const rooms = {};

io.on('connection', (socket) => {
  fastify.log.info(`User connected: ${socket.id}`);

  // 1. Join Room Event
  // Registers a user to a specific room identified by PIN
  socket.on('join-room', ({ username, pin }) => {
    // Basic validation
    if (!username || !pin) return;

    socket.join(pin);

    // Create room if it doesn't exist
    if (!rooms[pin]) {
      rooms[pin] = { users: {} };
      fastify.log.info(`Room created: ${pin}`);
    }

    // Add user to the room state
    rooms[pin].users[socket.id] = {
      id: socket.id,
      username,
      score: 0,
      coins: 0,
      isFrozen: false
    };

    fastify.log.info(`User ${username} joined room ${pin}`);

    // Broadcast updated room state to all clients in the room
    io.to(pin).emit('room-update', rooms[pin]);
  });

  // 2. Submit Answer Event
  // Validates answer and awards points/coins
  socket.on('submit-answer', ({ pin, answer }) => {
    const room = rooms[pin];
    if (!room || !room.users[socket.id]) return;

    const user = room.users[socket.id];

    // Prevent answering if frozen
    if (user.isFrozen) {
      socket.emit('error', { message: 'You are frozen and cannot answer!' });
      return;
    }

    // Simplified validation logic (In real app, compare with stored question data)
    // For this example, let's assume any answer containing "correct" is valid, 
    // or you can just accept everything for testing. 
    // Let's implement a dummy check.
    const isCorrect = true; // Placeholder for actual validation logic

    if (isCorrect) {
      user.score += 100;
      user.coins += 10;
      
      // Notify the specific user they were correct (optional)
      socket.emit('answer-result', { correct: true, addedScore: 100, addedCoins: 10 });
      
      // Broadcast new scores to the room
      io.to(pin).emit('room-update', rooms[pin]);
    }
  });

  // 3. Use Power Event
  // Costs 50 coins, freezes target for 5 seconds
  socket.on('use-power', ({ pin, targetSocketId }) => {
    const room = rooms[pin];
    if (!room) return;

    const attacker = room.users[socket.id];
    const victim = room.users[targetSocketId];

    if (!attacker || !victim) return;

    if (attacker.coins >= 50) {
      // Deduct cost
      attacker.coins -= 50;
      
      // Apply effect
      victim.isFrozen = true;

      // Broadcast the event so frontend can show animation/notification
      io.to(pin).emit('power-activated', {
        attacker: attacker.username,
        victim: victim.username,
        action: 'freeze'
      });

      // Send state update
      io.to(pin).emit('room-update', rooms[pin]);

      // Remove effect after 5 seconds
      setTimeout(() => {
        // Check if user is still in the room
        if (rooms[pin] && rooms[pin].users[targetSocketId]) {
          rooms[pin].users[targetSocketId].isFrozen = false;
          io.to(pin).emit('room-update', rooms[pin]); // Update state to unfreeze
          io.to(targetSocketId).emit('status-change', { isFrozen: false });
        }
      }, 5000);

    } else {
      socket.emit('error', { message: 'Not enough coins!' });
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    fastify.log.info(`User disconnected: ${socket.id}`);
    for (const pin in rooms) {
      if (rooms[pin].users[socket.id]) {
        delete rooms[pin].users[socket.id];
        
        // If room is empty, optionally delete it
        if (Object.keys(rooms[pin].users).length === 0) {
          delete rooms[pin];
        } else {
          io.to(pin).emit('room-update', rooms[pin]);
        }
      }
    }
  });
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`Server is running on http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
