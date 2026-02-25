const mongoose = require("mongoose");
const { options } = require("../../routes/userRoutes/userRoutes");

const queAndAnsSchema = new mongoose.Schema({
    code: {
        type: Number,
        required: true,
        unique: true
    },
    question: [{
        type: String,
        required: true
    }],
    options: [{
        type: String,
        required: true
    }],
    players: [{
        type: Number,
        required: true
    }],
    isStarted: {
        type: Boolean,
        default: false
    },
    noOfPlayers: {
        type: Number,
        required: true,
        default: 0
    }
});

const queAndAnsModel = mongoose.model("queAndAns", queAndAnsSchema);
module.exports = queAndAnsModel;