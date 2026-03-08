// Create socket connection - ONLY declare once here
const socket = io();

// Function to initialize socket connection when DOM is ready
function initializeSocket() {
    // Get game code from the hidden input field
    const gameCodeInput = document.getElementById('gameCode');
    if (!gameCodeInput) {
        console.warn('Game code input not found');
        return;
    }

    const gameCode = gameCodeInput.value;

    // Connect to the game room when page loads
    socket.on('connect', () => {
        console.log('Connected to server, joining game with code:', gameCode);
        socket.emit('joinGame', gameCode); // Tell server to join this game room
    });

    // Listen for opponent joining
    socket.on('playerJoined', (data) => {
        console.log('Opponent joined!', data);
        // Update UI to show opponent is ready
    });

    // Listen when player joins through HTTP route (from backend controller)
    socket.on('playerJoinedGame', (data) => {
        console.log('Player 2 joined the game!', data);

        // ✅ Hide the game code flag
        const gameCodeFlag = document.querySelector('.game-code-flag');
        if (gameCodeFlag) {
            gameCodeFlag.style.display = 'none';
        }

        // ✅ Update player 2 status
        const player2Name = document.querySelector('.player2-name');
        if (player2Name) {
            player2Name.textContent = 'Player 2';
            player2Name.style.color = '#667eea';
        }

        // ✅ Show message that game has started
        const gameMessage = document.createElement('div');
        gameMessage.textContent = '✅ Opponent joined! Game started!';
        gameMessage.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: green; color: white; padding: 10px 20px; border-radius: 5px; z-index: 1000;';
        document.body.appendChild(gameMessage);

        // Remove message after 3 seconds
        setTimeout(() => {
            gameMessage.remove();
        }, 3000);
    });

    // Listen for opponent's moves/updates
    socket.on('opponentUpdate', (data) => {
        console.log('Opponent made an update:', data);
        // Update your game state with opponent's move
    });

    // Listen if opponent leaves
    socket.on('playerLeft', (data) => {
        console.log('Opponent left the game');
        // Show message to player
    });

    // ✅ Listen for your turn to ask a question
    socket.on('your', (data) => {
        console.log('Your turn to ask a question:', data);
        if (data.yourTurn === true) {
            showQuestionModal();
        }
    });

    // ✅ Listen for opponent's question
    socket.on('opponentAskedQuestion', (data) => {
        console.log('Opponent asked a question:', data);
        // Hide typing animation and display opponent's question with options
        hideTypingAnimation();
        displayOpponentQuestion(data);
    });

    // ✅ Listen when opponent starts typing (asking question)
    socket.on('opponentStartedAsking', (data) => {
        console.log('Opponent started asking a question');
        showTypingAnimation();
    });

    // Send your move to opponent
    window.sendMove = function (moveData) {
        socket.emit('gameUpdate', {
            gameCode: gameCode,
            move: moveData,
            timestamp: new Date().getTime()
        });
    };

    // Handle page unload/close
    window.addEventListener('beforeunload', () => {
        socket.emit('leaveGame', gameCode);
    });
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSocket);
} else {
    initializeSocket();
}

// Update game function
window.updateGame = async function () {
    const gameCodeInput = document.getElementById('gameCode');
    if (gameCodeInput) {
        const gameCode = gameCodeInput.value;
        // Uncomment when queAndAnsModel is available
        // const game = await queAndAnsModel.findOne({ code: gameCode });
        // console.log(game);
    }
};

// ✅ Function to show the question modal
function showQuestionModal() {
    const modalOverlay = document.getElementById('questionModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('show');
        // Focus on the input field
        const questionInput = document.getElementById('questionInput');
        if (questionInput) {
            setTimeout(() => questionInput.focus(), 100);
        }
    }
}

// ✅ Function to hide the question modal
function hideQuestionModal() {
    const modalOverlay = document.getElementById('questionModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('show');
        // Clear the input
        const questionInput = document.getElementById('questionInput');
        if (questionInput) {
            questionInput.value = '';
        }
        // Clear all option inputs and checkboxes
        const optionInputs = [
            document.getElementById('optionA'),
            document.getElementById('optionB'),
            document.getElementById('optionC'),
            document.getElementById('optionD')
        ];
        const optionCheckboxes = [
            document.getElementById('checkboxA'),
            document.getElementById('checkboxB'),
            document.getElementById('checkboxC'),
            document.getElementById('checkboxD')
        ];
        optionInputs.forEach(input => {
            if (input) {
                input.value = '';
            }
        });
        optionCheckboxes.forEach(checkbox => {
            if (checkbox) {
                checkbox.checked = false;
            }
        });
    }
}

// ✅ Handle question submission
function submitQuestion() {
    const questionInput = document.getElementById('questionInput');
    const question = questionInput.value.trim();

    if (!question) {
        alert('Please enter a question');
        return;
    }

    // Get all option inputs
    const optionAnswers = {
        A: document.getElementById('optionA').value.trim(),
        B: document.getElementById('optionB').value.trim(),
        C: document.getElementById('optionC').value.trim(),
        D: document.getElementById('optionD').value.trim()
    };

    // Validate all options are filled
    if (!optionAnswers.A || !optionAnswers.B || !optionAnswers.C || !optionAnswers.D) {
        alert('Please fill in all four options (A, B, C, D)');
        return;
    }

    // Get the correct answer (the checked checkbox)
    const optionCheckboxes = [
        { id: 'checkboxA', label: 'A' },
        { id: 'checkboxB', label: 'B' },
        { id: 'checkboxC', label: 'C' },
        { id: 'checkboxD', label: 'D' }
    ];

    let correctAns = null;
    for (let checkbox of optionCheckboxes) {
        if (document.getElementById(checkbox.id).checked) {
            correctAns = checkbox.label;
            break;
        }
    }

    const gameCodeInput = document.getElementById('gameCode');
    const gameCode = gameCodeInput.value;

    // Emit question with options and correct answer to server
    socket.emit('questionSubmitted', {
        gameCode: gameCode,
        question: question,
        options: optionAnswers,
        correctAns: correctAns
    });

    console.log('Question submitted:', question, optionAnswers, 'Correct Answer:', correctAns);
    hideQuestionModal();
}

// ✅ Function to display opponent's question
function displayOpponentQuestion(data) {
    // Remove any existing question display
    const existingDisplay = document.querySelector('.opponent-question-display');
    if (existingDisplay) {
        existingDisplay.remove();
    }

    // Create a notification or display area for opponent's question
    const questionDisplay = document.createElement('div');
    questionDisplay.className = 'opponent-question-display';
    questionDisplay.id = 'currentQuestionDisplay';

    // Build options buttons
    const optionsHTML = `
        <div class="options-buttons-group">
            <button class="option-btn option-a" data-option="A" data-correct="${data.correctAns === 'A' ? 'true' : 'false'}">${data.options.A}</button>
            <button class="option-btn option-b" data-option="B" data-correct="${data.correctAns === 'B' ? 'true' : 'false'}">${data.options.B}</button>
            <button class="option-btn option-c" data-option="C" data-correct="${data.correctAns === 'C' ? 'true' : 'false'}">${data.options.C}</button>
            <button class="option-btn option-d" data-option="D" data-correct="${data.correctAns === 'D' ? 'true' : 'false'}">${data.options.D}</button>
        </div>
    `;

    questionDisplay.innerHTML = `
        <div class="opponent-question-content">
            <div class="answer-timer" id="answerTimer">15</div>
            <div class="question-heading">📋 Answer the Question:</div>
            <div class="question-text">${data.question}</div>
            ${optionsHTML}
        </div>
    `;

    document.body.appendChild(questionDisplay);

    // Timer logic
    let timeLeft = 15;
    let timerInterval = setInterval(() => {
        timeLeft--;
        const timerElement = document.getElementById('answerTimer');
        if (timerElement) {
            timerElement.textContent = timeLeft;
            if (timeLeft <= 5) {
                timerElement.classList.add('warning');
            }
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Emit notAnswered event
            const gameCodeInput = document.getElementById('gameCode');
            const gameCode = gameCodeInput.value;
            const roomName = `game_${gameCode}`;

            socket.emit('notAnswered', {
                gameCode: gameCode,
                userId: socket.id
            });

            console.log('User did not answer the question in time');
            if (questionDisplay.parentElement) {
                questionDisplay.remove();
            }
        }
    }, 1000);

    // Add event listeners to option buttons
    questionDisplay.querySelectorAll('.option-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            clearInterval(timerInterval); // Clear timer when answered
            const selectedOption = e.target.getAttribute('data-option');
            const isCorrect = e.target.getAttribute('data-correct') === 'true';
            handleAnswerSelection(selectedOption, data, isCorrect, e.target);
        });
    });

    // Store the timer interval for cleanup
    questionDisplay.timerInterval = timerInterval;

    console.log('Opponent question displayed:', data.question);
}

// ✅ Function to handle answer selection
function handleAnswerSelection(selectedOption, questionData, isCorrect, buttonElement) {
    const gameCodeInput = document.getElementById('gameCode');
    const gameCode = gameCodeInput.value;

    // Highlight the selected button
    if (isCorrect) {
        buttonElement.classList.add('correct');
    } else {
        buttonElement.classList.add('selected', 'wrong');
    }

    // Show the correct answer highlighted in all buttons
    const questionDisplay = document.querySelector('.opponent-question-display');
    if (questionDisplay) {
        questionDisplay.querySelectorAll('.option-btn').forEach(btn => {
            if (btn.getAttribute('data-correct') === 'true') {
                btn.classList.add('correct');
            }
            btn.classList.add('disabled'); // Disable all buttons after selection
        });
    }

    // Emit the selected answer to server with socket ID
    socket.emit('queAnswered', {
        gameCode: gameCode,
        selectedOption: selectedOption,
        questionId: questionData.questionId || null,
        answeredBy: socket.id,  // Send the socket ID of who answered
        isCorrect: isCorrect
    });

    console.log('Answer submitted:', selectedOption, '| Correct:', isCorrect);

    // Remove the question display after a short delay to show the result
    setTimeout(() => {
        if (questionDisplay && questionDisplay.parentElement) {
            questionDisplay.remove();
        }
    }, 2000);
}

// ✅ Function to show typing animation when opponent is typing
function showTypingAnimation() {
    // Remove any existing typing animation
    const existingAnimation = document.querySelector('.typing-animation-container');
    if (existingAnimation) {
        existingAnimation.remove();
    }

    const typingContainer = document.createElement('div');
    typingContainer.className = 'typing-animation-container';
    typingContainer.id = 'typingAnimationContainer';

    typingContainer.innerHTML = `
        <div class="typing-animation-content">
            <div class="typing-animation-text">Opponent is typing...</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;

    document.body.appendChild(typingContainer);
}

// ✅ Function to hide typing animation
function hideTypingAnimation() {
    const typingContainer = document.querySelector('.typing-animation-container');
    if (typingContainer) {
        typingContainer.remove();
    }
}

