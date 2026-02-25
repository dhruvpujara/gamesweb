// imports 
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const userRoutes = require("./routes/userRoutes/userRoutes");
const queAndAnsRoutes = require("./routes/games/queAndAnsRoutes");
const mongoose = require("mongoose");

// middlewares
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// config
dotenv.config();

// routes
app.use(userRoutes);
app.use(queAndAnsRoutes);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));


app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
});
