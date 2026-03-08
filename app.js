// imports 
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const userRoutes = require("./routes/userRoutes/userRoutes");
const queAndAnsRoutes = require("./routes/games/queAndAnsRoutes");
const mongoose = require("mongoose");
const http = require('http')
const path = require("path");
const { initializeSocket } = require("./config/socketConfig");

// converting app to http server for socket.io
const server = http.createServer(app);
const io = initializeSocket(server);

module.exports = {
    io: io
};



// middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// config
dotenv.config();

// routes
app.use(userRoutes);
app.use(queAndAnsRoutes);

// Import socket controller to register event listeners
require("./controller/socket/socket");

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));


server.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
});
