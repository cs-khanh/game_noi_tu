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
          throw new Error('Chỉ có chủ phòng mới có thể bắt đầu game');
        }

        // Kiểm tra số lượng người chơi
        if (room.players.length < 2) {
          throw new Error('Cần ít nhất 2 người chơi để bắt đầu');
        }

        // Kiểm tra tất cả players (trừ host) phải ready
        if (!room.allPlayersReady()) {
          const notReadyPlayers = room.players
            .filter(p => !p.isHost && !p.isReady)
            .map(p => p.username);
          throw new Error(`Các người chơi sau chưa sẵn sàng: ${notReadyPlayers.join(', ')}`);
        }

        // Kiểm tra game chưa bắt đầu
        if (room.gameStarted) {
          throw new Error('Game đã bắt đầu rồi');
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

    // Pause timer when opening change word modal
    socket.on('change_word_started', ({ roomId }) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        if (!room.gameStarted) {
          return;
        }

        const currentPlayer = room.getCurrentPlayer();
        if (currentPlayer.id !== socket.data.userId) {
          return;
        }

        // Pause timer when user starts changing word
        room.pauseTurnTimer();
        logger.info(`Timer paused for change word in room ${roomId}`);
      } catch (error) {
        logger.error('Error pausing timer for change word:', error);
      }
    });

    // Resume timer when cancelling change word modal
    socket.on('change_word_cancelled', ({ roomId }) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        if (!room.gameStarted) {
          return;
        }

        const currentPlayer = room.getCurrentPlayer();
        if (currentPlayer.id !== socket.data.userId) {
          return;
        }

        // Resume timer if it was paused
        if (room.timerPaused) {
          room.resumeTurnTimer(async () => {
            // Time's up - disable current player
            const cp = room.getCurrentPlayer();
            room.disablePlayer(cp.id, 'Hết thời gian');

            io.to(roomId).emit('player_disabled', {
              playerId: cp.id,
              reason: 'Hết thời gian'
            });

            // Move to next turn
            await nextTurn(room, io);
          });
          logger.info(`Timer resumed after cancelling change word in room ${roomId}`);
        }
      } catch (error) {
        logger.error('Error resuming timer after cancelling change word:', error);
      }
    });

    // Change word (đổi từ cuối của chain)
    socket.on('change_word', async ({ roomId, newWord }) => {
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

        // Timer should already be paused by change_word_started event

        const player = room.getPlayer(socket.data.userId);
        if (!player) {
          throw new Error('Player not found');
        }

        if (player.changeWordUsed) {
          throw new Error('Bạn đã sử dụng quyền đổi từ rồi');
        }

        if (room.wordsChain.length === 0) {
          throw new Error('Không có từ nào để đổi');
        }

        // Validate new word format
        const words = newWord.trim().split(' ');
        if (words.length !== 2) {
          throw new Error('Từ phải có đúng 2 chữ');
        }

        // Get the word before the last one (to check connection)
        let previousWord = '';
        if (room.wordsChain.length > 1) {
          previousWord = room.wordsChain[room.wordsChain.length - 2].word;
        }

        // Validate new word can connect with previous word (if exists)
        if (previousWord) {
          const canConnect = gameService.canConnect(newWord.trim(), previousWord);
          if (!canConnect) {
            throw new Error('Từ mới phải nối được với từ trước đó');
          }
        }

        // Check if new word was already used
        const isUsed = gameService.isWordUsed(newWord.trim(), room.wordsChain);
        if (isUsed) {
          throw new Error('Từ này đã được sử dụng rồi');
        }

        // Check if new word exists in dictionary
        const existsInDictionary = await dictionaryService.validateWord(newWord.trim());
        
        if (!existsInDictionary) {
          // Word not in dictionary - start voting for change word
          await startVotingForChangeWord(room, io, socket.data.userId, newWord.trim());
          return;
        }

        // Word exists in dictionary - change word immediately
        // Get old word before changing
        const oldWord = room.getCurrentWord();

        // Change the word
        const changedWordData = room.changeWord(newWord.trim(), socket.data.userId);

        // Broadcast word changed
        io.to(roomId).emit('word_changed', {
          oldWord: oldWord,
          newWord: newWord.trim(),
          playerId: socket.data.userId,
          playerName: player.username,
          wordsChain: room.wordsChain,
          changeWordUsed: player.changeWordUsed
        });

        // Also update room to sync player states
        io.to(roomId).emit('room_updated', {
          players: room.players.map(p => ({
            id: p.id,
            username: p.username,
            avatar: p.avatar,
            isReady: p.isReady,
            isHost: p.isHost,
            isDisabled: p.isDisabled,
            disabledReason: p.disabledReason,
            isSpectator: p.isSpectator,
            changeWordUsed: p.changeWordUsed,
            wordsUsed: p.wordsUsed || 0
          }))
        });

        // Move to next turn after successful word change
        await nextTurn(room, io);

        logger.info(`Word changed in room ${roomId} by ${player.username}`);

      } catch (error) {
        logger.error('Error changing word:', error);
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
    playerName: room.getPlayer(playerId).username,
    isChangeWord: false
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

async function startVotingForChangeWord(room, io, playerId, word) {
  const { word1, word2 } = gameService.splitWord(word);
  
  room.startVoting({
    word,
    word1,
    word2,
    playerId,
    playerName: room.getPlayer(playerId).username,
    isChangeWord: true  // Mark as change word voting
  });

  // Broadcast voting started for change word
  io.to(room.id).emit('voting_started', {
    word,
    proposedBy: playerId,
    proposedByName: room.getPlayer(playerId).username,
    timeLeft: room.votingTimeSeconds,
    isChangeWord: true
  });

  // Start voting timer
  const votingTimeout = setTimeout(async () => {
    if (room.votingInProgress) {
      logger.info(`Change word voting timeout reached for room ${room.id}`);
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
  const isChangeWord = votingData.isChangeWord || false;

  // Broadcast voting ended
  io.to(room.id).emit('voting_ended', {
    word: votingData.word,
    approved: result,
    votesFor: votingData.votesFor,
    votesAgainst: votingData.votesAgainst,
    isChangeWord: isChangeWord
  });

  if (isChangeWord) {
    // Handle change word voting
    const player = room.getPlayer(votingData.playerId);
    
    if (result) {
      // Word approved - change the word
      const oldWord = room.getCurrentWord();
      room.changeWord(votingData.word, votingData.playerId);

      // Add to community dictionary (approved immediately)
      await dictionaryService.addCommunityWord(
        votingData.word,
        votingData.word1,
        votingData.word2,
        'Từ do cộng đồng đóng góp',
        votingData.playerId,
        true  // approved = true, add to main dictionary
      );

      // Broadcast word changed
      io.to(room.id).emit('word_changed', {
        oldWord: oldWord,
        newWord: votingData.word,
        playerId: votingData.playerId,
        playerName: votingData.playerName,
        wordsChain: room.wordsChain,
        changeWordUsed: player.changeWordUsed
      });

      // Update room to sync player states
      io.to(room.id).emit('room_updated', {
        players: room.players.map(p => ({
          id: p.id,
          username: p.username,
          avatar: p.avatar,
          isReady: p.isReady,
          isHost: p.isHost,
          isDisabled: p.isDisabled,
          disabledReason: p.disabledReason,
          isSpectator: p.isSpectator,
          changeWordUsed: p.changeWordUsed,
          wordsUsed: p.wordsUsed || 0
        }))
      });

      // Move to next turn after successful word change
      await nextTurn(room, io);
    } else {
      // Word rejected - move to next turn (player already used change word attempt)
      await nextTurn(room, io);
    }
  } else {
    // Handle normal word submission voting
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

