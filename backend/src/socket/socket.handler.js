const logger = require('../utils/logger');
const Room = require('./room.manager');
const gameService = require('../services/game.service');
const dictionaryService = require('../services/dictionary.service');

const rooms = new Map(); // roomId -> Room instance

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join room
    socket.on('join_room', async ({ roomId, userId, username, avatar }) => {
      try {
        logger.info(`User ${username} joining room ${roomId}`);

        // Get or create room
        let room = rooms.get(roomId);
        if (!room) {
          room = new Room(roomId, io);
          rooms.set(roomId, room);
        }

        // Add player to room
        const player = {
          id: userId,
          socketId: socket.id,
          username,
          avatar,
          isReady: false,
          isDisabled: false,
          wordsUsed: 0
        };

        room.addPlayer(player);
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.userId = userId;

        // Send room state to all players
        io.to(roomId).emit('room_updated', {
          room: room.getState(),
          players: room.players
        });

        logger.info(`User ${username} joined room ${roomId}`);
      } catch (error) {
        logger.error('Error joining room:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Leave room
    socket.on('leave_room', ({ roomId }) => {
      handleLeaveRoom(socket, roomId);
    });

    // Ready up
    socket.on('ready', async ({ roomId }) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        room.setPlayerReady(socket.data.userId, true);
        io.to(roomId).emit('room_updated', {
          room: room.getState(),
          players: room.players
        });
      } catch (error) {
        logger.error('Error ready:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Start game (chỉ host mới có thể start)
    socket.on('start_game', async ({ roomId }) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        // Kiểm tra xem người gọi có phải host không
        if (!room.isHost(socket.data.userId)) {
          throw new Error('Only host can start the game');
        }

        // Kiểm tra số lượng người chơi
        if (room.players.length < 2) {
          throw new Error('Need at least 2 players to start');
        }

        // Start game
        await startGame(room, io);
      } catch (error) {
        logger.error('Error starting game:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Submit word
    socket.on('submit_word', async ({ roomId, word }) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        if (!room.gameStarted) {
          throw new Error('Game not started');
        }

        const currentPlayer = room.getCurrentPlayer();
        if (currentPlayer.id !== socket.data.userId) {
          throw new Error('Not your turn');
        }

        // Clear turn timer
        room.clearTurnTimer();

        // Get previous word
        const previousWord = room.getCurrentWord();

        // Validate word
        const validation = await gameService.validateWordSubmission(
          word,
          previousWord,
          room.wordsChain
        );

        if (!validation.valid) {
          if (validation.needsVoting) {
            // Start voting
            await startVoting(room, io, socket.data.userId, word);
          } else {
            // Invalid word - disable player
            room.disablePlayer(socket.data.userId, validation.reason);
            
            io.to(roomId).emit('player_disabled', {
              playerId: socket.data.userId,
              reason: validation.reason
            });

            // Move to next player
            await nextTurn(room, io);
          }
          return;
        }

        // Valid word - add to chain
        room.addWordToChain({
          word,
          playerId: socket.data.userId,
          playerName: currentPlayer.username,
          timestamp: new Date().toISOString(),
          isNew: false,
          turnNumber: room.turnNumber
        });

        // Broadcast word submitted
        io.to(roomId).emit('word_submitted', {
          word,
          playerId: socket.data.userId,
          playerName: currentPlayer.username,
          wordsChain: room.wordsChain
        });

        // Move to next turn
        await nextTurn(room, io);

      } catch (error) {
        logger.error('Error submitting word:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Vote on new word
    socket.on('vote', async ({ roomId, vote }) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        if (!room.votingInProgress) {
          throw new Error('No voting in progress');
        }

        // Record vote
        room.addVote(socket.data.userId, vote);

        // Broadcast vote update
        io.to(roomId).emit('vote_update', {
          votesFor: room.votingData.votesFor,
          votesAgainst: room.votingData.votesAgainst
        });

        // Check if all players voted
        if (room.allPlayersVoted()) {
          await endVoting(room, io);
        }
      } catch (error) {
        logger.error('Error voting:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Chat message
    socket.on('chat_message', ({ roomId, message }) => {
      const room = rooms.get(roomId);
      if (room) {
        const player = room.getPlayer(socket.data.userId);
        io.to(roomId).emit('chat_message', {
          playerId: socket.data.userId,
          playerName: player?.username || 'Unknown',
          message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Search word in history
    socket.on('search_word', ({ roomId, searchTerm }) => {
      const room = rooms.get(roomId);
      if (room) {
        const results = room.wordsChain.filter(item =>
          item.word.toLowerCase().includes(searchTerm.toLowerCase())
        );
        socket.emit('search_results', { results });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      const roomId = socket.data.roomId;
      if (roomId) {
        handleLeaveRoom(socket, roomId);
      }
    });
  });
};

// Helper functions

function handleLeaveRoom(socket, roomId) {
  const room = rooms.get(roomId);
  if (room) {
    room.removePlayer(socket.data.userId);
    socket.leave(roomId);

    // If room is empty, delete it
    if (room.players.length === 0) {
      room.cleanup();
      rooms.delete(roomId);
      logger.info(`Room ${roomId} deleted`);
    } else {
      // Update room state
      socket.to(roomId).emit('room_updated', {
        room: room.getState(),
        players: room.players
      });
    }
  }
}

async function startGame(room, io) {
  try {
    // Randomize turn order
    room.randomizeTurnOrder();

    // Get random starting word
    const startingWord = await dictionaryService.getRandomStartingWord();
    
    // Initialize game
    room.startGame(startingWord.full_word);

    // Broadcast game started
    io.to(room.id).emit('game_started', {
      turnOrder: room.turnOrder,
      firstWord: startingWord.full_word,
      currentPlayer: room.getCurrentPlayer(),
      timeLeft: room.turnTimeSeconds
    });

    // Start first turn timer
    startTurnTimer(room, io);

    logger.info(`Game started in room ${room.id}`);
  } catch (error) {
    logger.error('Error starting game:', error);
    throw error;
  }
}

async function nextTurn(room, io) {
  // Check if game is over
  const activePlayers = gameService.getActivePlayers(room.players);
  
  if (activePlayers.length <= 1) {
    // Game over
    endGame(room, io, activePlayers[0]);
    return;
  }

  // Move to next player
  room.nextTurn();

  const currentPlayer = room.getCurrentPlayer();
  const currentWord = room.getCurrentWord();

  // Broadcast turn changed
  io.to(room.id).emit('turn_changed', {
    currentPlayer,
    wordToMatch: currentWord,
    timeLeft: room.turnTimeSeconds
  });

  // Start turn timer
  startTurnTimer(room, io);
}

function startTurnTimer(room, io) {
  room.startTurnTimer(async () => {
    // Time's up - disable current player
    const currentPlayer = room.getCurrentPlayer();
    room.disablePlayer(currentPlayer.id, 'Hết thời gian');

    io.to(room.id).emit('player_disabled', {
      playerId: currentPlayer.id,
      reason: 'Hết thời gian'
    });

    // Next turn
    await nextTurn(room, io);
  });

  // Send timer tick every second
  const timerInterval = setInterval(() => {
    if (!room.turnTimer) {
      clearInterval(timerInterval);
      return;
    }

    const timeLeft = Math.ceil(room.turnTimeLeft / 1000);
    io.to(room.id).emit('timer_tick', { timeLeft });
  }, 1000);

  room.timerInterval = timerInterval;
}

async function startVoting(room, io, playerId, word) {
  const { word1, word2 } = gameService.splitWord(word);
  
  room.startVoting({
    word,
    word1,
    word2,
    playerId,
    playerName: room.getPlayer(playerId).username
  });

  // Broadcast voting started
  io.to(room.id).emit('voting_started', {
    word,
    proposedBy: playerId,
    proposedByName: room.getPlayer(playerId).username,
    timeLeft: room.votingTimeSeconds
  });

  // Start voting timer
  const votingTimeout = setTimeout(async () => {
    if (room.votingInProgress) {
      logger.info(`Voting timeout reached for room ${room.id}`);
      await endVoting(room, io);
    }
  }, room.votingTimeSeconds * 1000);
  
  // Store timeout reference to clear if needed
  room.votingTimeout = votingTimeout;
}

async function endVoting(room, io) {
  // Clear voting timeout if it exists
  if (room.votingTimeout) {
    clearTimeout(room.votingTimeout);
    room.votingTimeout = null;
  }
  
  const result = gameService.processVotingResult(
    room.votingData.votesFor,
    room.votingData.votesAgainst
  );

  const votingData = room.endVoting();

  // Broadcast voting ended
  io.to(room.id).emit('voting_ended', {
    word: votingData.word,
    approved: result,
    votesFor: votingData.votesFor,
    votesAgainst: votingData.votesAgainst
  });

  if (result) {
    // Word approved - add to chain
    room.addWordToChain({
      word: votingData.word,
      playerId: votingData.playerId,
      playerName: votingData.playerName,
      timestamp: new Date().toISOString(),
      isNew: true,
      turnNumber: room.turnNumber
    });

    // Add to community dictionary (approved immediately)
    await dictionaryService.addCommunityWord(
      votingData.word,
      votingData.word1,
      votingData.word2,
      'Từ do cộng đồng đóng góp',
      votingData.playerId,
      true  // approved = true, add to main dictionary
    );

    io.to(room.id).emit('word_submitted', {
      word: votingData.word,
      playerId: votingData.playerId,
      playerName: votingData.playerName,
      wordsChain: room.wordsChain,
      isNew: true
    });

    // Next turn
    await nextTurn(room, io);
  } else {
    // Word rejected - disable player
    room.disablePlayer(votingData.playerId, 'Từ bị vote từ chối');

    io.to(room.id).emit('player_disabled', {
      playerId: votingData.playerId,
      reason: 'Từ bị vote từ chối'
    });

    // Next turn
    await nextTurn(room, io);
  }
}

function endGame(room, io, winner) {
  room.endGame(winner?.id || null);

  io.to(room.id).emit('game_ended', {
    winner: winner || null,
    wordsChain: room.wordsChain,
    stats: room.getGameStats()
  });

  logger.info(`Game ended in room ${room.id}, winner: ${winner?.username || 'No winner'}`);
}

