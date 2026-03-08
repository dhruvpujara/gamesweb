const queAndAnsModel = require("../../model/gameModel/queAndAns");
const { getIO } = require("../../config/socketConfig");


// functions 
module.exports.createGame = async (req, res) => {
    try {
        const code = Math.floor(Math.random() * 100000);
        const player1 = Math.floor(Math.random() * 100000);

        const newGame = new queAndAnsModel({
            code: code,
            question: [],
            options: [],
            players: [player1],
            noOfPlayers: 1
        });
        await newGame.save();

        // Set cookie for player1
        res.cookie('player', player1, {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
            sameSite: 'lax' // Protects against CSRF
        });

        res.render("games/queAndAnsBoard", { gameCode: code, isStarted: false });

    } catch (err) {
        console.log(err);
        return res.send(err);
    }
};

module.exports.joinGame = async (req, res) => {
    try {
        const { code } = req.params;
        const player2 = Math.floor(Math.random() * 100000);

        const game = await queAndAnsModel.findOne({ code: code });

        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }

        if (game.players.length >= 2) {
            return res.status(400).json({ message: "Game is full" });
        }

        game.players.push(player2);
        game.isStarted = true;
        game.noOfPlayers = game.noOfPlayers + 1;
        game.turnOf = game.socketConfig[0]; // Assuming the first player to join starts the game
        await game.save();

        res.cookie('player', player2, {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
            sameSite: 'lax' // Protects against CSRF
        });

        // ✅ Emit socket event to notify player 1 that player 2 has joined
        const roomName = `game_${code}`;
        const io = getIO();
        io.to(roomName).emit('playerJoinedGame', {
            message: 'Opponent has joined the game',
            gameCode: code,
            isStarted: true,
            player2Id: player2,
            totalPlayers: game.noOfPlayers
        });

        res.render("games/queAndAnsBoard", { gameCode: code, isStarted: game.isStarted });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports.board = async (req, res) => {
    res.render("games/queAndAnsBoard");
};


// receiving updates from client side 