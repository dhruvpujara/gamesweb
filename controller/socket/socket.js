const { getIO } = require("../../config/socketConfig");
const queAndAnsModel = require("../../model/gameModel/queAndAns");



// this is the controller for the events sent by the client to the server using socket.io 

// Socket.IO connection listener
const io = getIO();
io.on('connection', (socket) => {


    // When a player joins a game
    socket.on('joinGame', async (gameCode) => {
        const roomName = `game_${gameCode}`;
        socket.join(roomName);

        // Notify the other player in the room that someone joined
        socket.to(roomName).emit('playerJoined', {
            message: 'Opponent has joined the game',
            socketId: socket.id
        });

        // finding the game 
        const game = await queAndAnsModel.findOne({ code: gameCode });

        if (!game) {
            console.log(`Game with code ${gameCode} not found`);
            return;
        }

        await game.socketConfig.push(socket.id);
        await game.points.push({ Player: socket.id, points: 0 });
        await game.save();

        if (game.players.length >= 2) {
            askQuestions(gameCode);
        }

    });




    // Emit 'your' signal to notify the player whose turn it is to answer
    async function askQuestions(gameCode) {
        try {
            const game = await queAndAnsModel.findOne({ code: gameCode });

            if (!game) {
                console.log(`Game with code ${gameCode} not found`);
                return;
            }

            const currentTurnPlayer = game.turnOf;
            console.log('Current turn (player to answer):', currentTurnPlayer);

            // Emit 'your' event to the player whose turn it is
            io.to(currentTurnPlayer).emit('your', {
                yourTurn: true,
            });
        } catch (error) {
            console.error('Error in askQuestions:', error);
        }
    }

    // ✅ When a player submits a question
    socket.on('questionSubmitted', async (data) => {
        const roomName = `game_${data.gameCode}`;

        try {
            const game = await queAndAnsModel.findOne({ code: data.gameCode });
            if (!game) {
                console.log(`Game with code ${data.gameCode} not found`);
                return;
            }

            game.question.push(data.question);
            game.options.push(data.correctAns);
            await game.save();

            // Emit question to opponent with options
            socket.to(roomName).emit('opponentAskedQuestion', {
                question: data.question,
                options: data.options,
                askedBy: socket.id,
                questionId: data.questionId || null
            });

            console.log(`question is `, data);

        } catch (error) {
            console.error('Error handling question submission:', error);
        }
    });


    // ✅ When a player answers a question
    socket.on('queAnswered', async (data) => {
        try {
            const game = await queAndAnsModel.findOne({ code: data.gameCode });

            console.log('Answer received:', data);

            if (!game) {
                console.log(`Game with code ${data.gameCode} not found`);
                return;
            }


            const index = game.options.length - 1;
            const correctAnswer = game.options[index];
            const isCorrect = data.selectedOptionLabel === correctAnswer;

            if (isCorrect) {
                console.log('Answer is correct');

                // Update points for the player who answered correctly
                const playerPoints = game.points.find(p => p.Player === socket.id);

                if (playerPoints) {
                    playerPoints.points += 1;
                    game.markModified('points');

                    if (playerPoints.points >= 3) {
                        await endGame(data.gameCode, socket.id);
                        return;
                    }

                } else {
                    game.points.push({ Player: socket.id, points: 1 });
                }

                await game.save();

            }

            // The player who answered becomes the next to ask a question
            if (data.answeredBy) {
                game.turnOf = data.answeredBy;
                console.log('Switched turn to answerer:', game.turnOf);
                await game.save();
            }

            // Trigger the next question asking round
            setTimeout(async () => {
                await askQuestions(data.gameCode);
            }, 4000);

        } catch (error) {
            console.error('Error handling not answered:', error);
        }
    });

    socket.on('notAnswered', async (data) => {
        try {
            const game = await queAndAnsModel.findOne({ code: data.gameCode });
            const roomName = `game_${data.gameCode}`;
            console.log('Not answered received:', data);

            if (!game) {
                console.log(`Game with code ${data.gameCode} not found`);
                return;
            }

            if (data.userId) {
                game.turnOf = data.userId;
                console.log('Switched turn to answerer:', game.turnOf);
                await game.save();
            }

            // Notify the new player it's their turn to ask a question
            await askQuestions(data.gameCode);
        } catch (error) {
            console.error('Error handling not answered:', error);
        }
    });



    async function endGame(gameCode, winnerId) {
        try {
            const game = await queAndAnsModel.findOne({ code: gameCode });
            if (!game) {
                console.log(`Game with code ${gameCode} not found`);
                return;
            }
            io.to(`game_${gameCode}`).emit('gameOver', { winner: winnerId });
            await queAndAnsModel.deleteOne({ code: gameCode });
        } catch (error) {
            console.error('Error ending game:', error);
        }
    };










    // function not in use 



    // When a player makes a move/updatel
    socket.on('gameUpdate', (data) => {
        const roomName = `game_${data.gameCode}`;
        // Send update only to the opponent (not to sender)
        socket.to(roomName).emit('opponentUpdate', data);
        console.log(`Update sent to room ${roomName}:`, data);
        console.log('in function two');
    });

    // When player leaves game
    socket.on('leaveGame', (gameCode) => {
        const roomName = `game_${gameCode}`;
        socket.leave(roomName);
        socket.to(roomName).emit('playerLeft', {
            message: 'Opponent has left the game'
        });
    });

    // When a player disconnects
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });




}); // socket  is closed here, all events are inside this connection listener


