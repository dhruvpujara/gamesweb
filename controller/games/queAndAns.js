const queAndAnsModel = require("../../model/gameModel/queAndAns");



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
        return res.status(500).json({ message: "Internal Server Error" });
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
        await game.save();
        console.log(game);

        res.cookie('player', player2, {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
            sameSite: 'lax' // Protects against CSRF
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