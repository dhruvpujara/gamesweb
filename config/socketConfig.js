const { Server } = require("socket.io");
const http = require('http');

let io = null;

module.exports = {
    initializeSocket: (server) => {
        io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.IO not initialized. Call initializeSocket first.');
        }
        return io;
    }
};
