const mongoose = require("mongoose");
const { options } = require("../../routes/userRoutes/userRoutes");
const socketConfig = require("../../config/socketConfig");

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
    },
    turnOf: {
        type: String,
        default: ""
    },
    turnToAnswer: {
        type: String,
        default: ""
    },
    socketConfig: [{
        type: String,
        default: ""
    }],
    points: [{
        type: Object,
        default: { Player: "", points: 0 }
    }]
});

const queAndAnsModel = mongoose.model("queAndAns", queAndAnsSchema);
module.exports = queAndAnsModel;