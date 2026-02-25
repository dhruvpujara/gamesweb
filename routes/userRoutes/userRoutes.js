const Router = require("express").Router();
const userController = require("../../controller/userController/userController");



Router.get("/", userController.gethome);
Router.get("/games", userController.getgames);


module.exports = Router;