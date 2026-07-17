const ticTacToe = (function () {
    let playerOne = {
        marker: 'X',
        name: ''
    };

    let playerTwo = {
        marker: 'O',
        name: ''
    };

    let game = {
        currentGame: false,
        currentPlayer: null,
        gameWon: false,
        options: ['', '', '', '', '', '', '', '', ''],
        possibleWins: [
            [0, 1, 2],
            [0, 3, 6],
            [0, 4, 8],
            [1, 4, 7],
            [2, 4, 6],
            [2, 5, 8],
            [3, 4, 5],
            [6, 7, 8]
        ]
    };

    function playWoodThud() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle'; 
            osc.frequency.setValueAtTime(120, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
            
            gain.gain.setValueAtTime(0.6, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {
            console.warn("Audio context blocked or unsupported:", e);
        }
    }

    function playVictoryBell() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const frequencies = [880, 1200]; 
            
            frequencies.forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
                
                osc.start();
                osc.stop(ctx.currentTime + 1.5);
            });
        } catch (e) {
            console.warn("Victory bell audio failed:", e);
        }
    }

    // Synthesizes a low-pitched, harsh double-buzzing "error" sound for draws
    function playDrawSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            
            // Generate a quick double pulse (buzz-buzz)
            [0, 0.15].forEach(delay => {
                // Mix two harsh saw-tooth waves slightly out of tune for a buzzy texture
                [150, 153].forEach(freq => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
                    
                    gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
                    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
                    
                    osc.start(ctx.currentTime + delay);
                    osc.stop(ctx.currentTime + delay + 0.12);
                });
            });
        } catch (e) {
            console.warn("Draw sound audio failed:", e);
        }
    }

    function speakWinner(message) {
        try {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(message);
                const voices = window.speechSynthesis.getVoices();
                
                const preferredVoice = voices.find(voice => 
                    voice.name === 'Google UK English Male'
                );
                
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }
                
                utterance.rate = 0.9;  
                utterance.pitch = 1.0; 
                utterance.volume = 1.0; 
                
                window.speechSynthesis.speak(utterance);
            }
        } catch (e) {
            console.warn("Text-to-speech engine failed:", e);
        }
    }

    function generateGameboard() {
        const spaceBoiler = document.createElement('div');
        spaceBoiler.className = 'player-space';
        let gameboard = document.createElement('div');
        gameboard.id = 'gameboard';
        
        for (let i = 0; i < game.options.length; i++) {
            let currentSpace = spaceBoiler.cloneNode();
            currentSpace.id = i;
            currentSpace.textContent = game.options[i];
            currentSpace.addEventListener('click', () => markSpace(currentSpace.id));
            gameboard.appendChild(currentSpace);
        }

        return gameboard;
    }
    
    function generateMenu() {
        let menu = document.createElement('div');
        menu.className = 'menu';
        const startButton = document.createElement('button');
        startButton.addEventListener('click', startGame);
        startButton.id = 'start-button';
        startButton.textContent = 'Start Game';
        menu.appendChild(startButton);

        return menu;
    }

    function markSpace(id) {
        if (game.currentGame) {
            if (game.options[id] !== '') {
                return;
            }
            
            playWoodThud();
            
            game.options[id] = game.currentPlayer.marker;
            const spaceElement = document.getElementById(id);
            spaceElement.textContent = game.currentPlayer.marker;
            spaceElement.classList.add(game.currentPlayer.marker);
            
            winCheck();
            if (!game.gameWon && game.currentGame) {
                togglePlayer();
            }
        }
    }

    function initializePlayers() {
        if (Math.floor(Math.random() * 2) === 0) {
            game.currentPlayer = playerOne;
        } else {
            game.currentPlayer = playerTwo;
        }
    }
    
    function startGame() {
        game.currentGame = true;
        initializePlayers();
        playerOne.name = prompt('What is your name, player one?');
        playerTwo.name = prompt('What is your name, player two?');
        
        if (playerOne.name === null || playerOne.name.trim() === '') {
            playerOne.name = 'Player 1';
        }
        if (playerTwo.name === null || playerTwo.name.trim() === '') {
            playerTwo.name = 'Player 2';
        }
        
        updateMenu();
    }
    
    function togglePlayer() {
        game.currentPlayer = game.currentPlayer === playerOne ? playerTwo : playerOne;
        document.querySelector('#now-playing').textContent = `${game.currentPlayer.name}'s turn (${game.currentPlayer.marker})`;
    }

    function updateMenu() {
        const nowPlaying = document.createElement('h1');
        nowPlaying.id = 'now-playing';
        document.querySelector('#start-button').replaceWith(nowPlaying);
        nowPlaying.textContent = `${game.currentPlayer.name}'s turn (${game.currentPlayer.marker})`;
    }

    function renderResetButton(message, isDraw = false) {
        const menuContainer = document.querySelector('.menu');
        menuContainer.innerHTML = '';
        
        const winNotice = document.createElement('h1');
        winNotice.id = 'win-notice';
        winNotice.textContent = message;
        winNotice.style.marginBottom = '15px';
        
        if (isDraw) {
            winNotice.style.color = '#f59e0b';
            winNotice.style.textShadow = '0 2px 10px rgba(245, 158, 11, 0.3)';
        }
        
        const resetBtn = document.createElement('button');
        resetBtn.id = 'reset-button';
        resetBtn.textContent = 'Play Again';
        
        resetBtn.addEventListener('click', () => {
            game.options = ['', '', '', '', '', '', '', '', ''];
            game.gameWon = false;
            game.currentGame = false;
            game.currentPlayer = null;
            document.getElementById('container').innerHTML = '';
            document.getElementById('container').append(generateMenu(), generateGameboard());
        });
        
        menuContainer.append(winNotice, resetBtn);
    }

    function winCheck() {
        for (let i = 0; i < game.possibleWins.length; i++) {
            const currWinPoss = game.possibleWins[i];
            const firstChoice = game.options[currWinPoss[0]];
            const secondChoice = game.options[currWinPoss[1]];
            const thirdChoice = game.options[currWinPoss[2]];

            if (firstChoice === '' || secondChoice === '' || thirdChoice === '') {
                continue;
            }
            if (firstChoice === secondChoice && secondChoice === thirdChoice) {
                game.gameWon = true;
                break;
            }
        }

        if (game.gameWon) {
            game.currentGame = false;
            playVictoryBell();
            speakWinner(`${game.currentPlayer.name} wins the game!`);
            renderResetButton(`${game.currentPlayer.name} (${game.currentPlayer.marker}) Wins!`, false);
        }
        else if (!game.options.includes('')) {
            game.currentGame = false;
            
            // Play the synchronized error buzz and the voice track together!
            playDrawSound();
            speakWinner("The match has concluded in a stalemate.");
            
            renderResetButton(`It's a Stalemate!`, true);
        }
    }

    return {
        generateGameboard: generateGameboard,
        generateMenu: generateMenu
    };
})();

const container = document.querySelector('#container');
container.append(ticTacToe.generateMenu(), ticTacToe.generateGameboard());