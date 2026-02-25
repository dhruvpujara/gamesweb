const Router = require("express").Router();
const queAndAnsController = require("../../controller/games/queAndAns");


Router.get("/queAndAns/create", queAndAnsController.createGame);
Router.get("/queAndAns/join", queAndAnsController.board);
Router.get("/queAndAns/:code/join", queAndAnsController.joinGame);


module.exports = Router;