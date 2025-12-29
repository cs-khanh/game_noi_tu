const logger = require('../utils/logger');

class Room {
  constructor(id, io) {
    this.id = id;
    this.io = io;
    this.players = [];
    this.hostId = null;  // Host của phòng (người đầu tiên)
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.gameStarted = false;
    this.wordsChain = [];
    this.turnNumber = 0;
    this.turnTimer = null;
    this.timerInterval = null;
    this.votingInProgress = false;
    this.votingData = null;
    this.turnTimeSeconds = parseInt(process.env.TURN_TIME_SECONDS) || 10;
    this.votingTimeSeconds = parseInt(process.env.VOTING_TIME_SECONDS) || 30;
    this.turnTimeLeft = this.turnTimeSeconds * 1000;
    this.timerPaused = false;
    this.timerPausedAt = null;
    this.timerPausedTimeLeft = null;
    this.createdAt = new Date();
  }

  // Player management
  addPlayer(player) {
    const existingPlayer = this.players.find(p => p.id === player.id);
    if (existingPlayer) {
      // Update socket ID if player reconnects
      existingPlayer.socketId = player.socketId;
      return existingPlayer;
    }

    if (this.players.length >= 8) {
      throw new Error('Room is full');
    }

    // Người đầu tiên vào là host
    if (this.players.length === 0) {
      this.hostId = player.id;
      player.isHost = true;
      logger.info(`Player ${player.username} is now HOST of room ${this.id}`);
    } else {
      player.isHost = false;
    }

    // Nếu game đang chạy, đánh dấu là spectator (người xem)
    if (this.gameStarted) {
      player.isSpectator = true;
      logger.info(`Player ${player.username} joined as SPECTATOR (game in progress)`);
    } else {
      player.isSpectator = false;
    }

    // Initialize change word used flag
    player.changeWordUsed = false;
    
    // Initialize ready status (default: false)
    player.isReady = false;

    this.players.push(player);
    logger.info(`Player ${player.username} added to room ${this.id}`);
    return player;
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      const player = this.players[index];
      const wasHost = player.id === this.hostId;
      
      this.players.splice(index, 1);
      logger.info(`Player ${player.username} removed from room ${this.id}`);
      
      // Nếu host rời phòng, chuyển host cho người tiếp theo
      if (wasHost && this.players.length > 0) {
        this.hostId = this.players[0].id;
        this.players[0].isHost = true;
        logger.info(`Player ${this.players[0].username} is now HOST of room ${this.id}`);
      }
    }
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  setPlayerReady(playerId, ready) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.isReady = ready;
    }
  }

  allPlayersReady() {
    // Kiểm tra số lượng người chơi
    if (this.players.length < 2) {
      return false;
    }
    
    // Kiểm tra tất cả players (trừ host) phải ready
    // Host không cần ready vì host là người start game
    const nonHostPlayers = this.players.filter(p => !p.isHost);
    return nonHostPlayers.every(p => p.isReady === true);
  }
  
  isHost(playerId) {
    return this.hostId === playerId;
  }
  
  getHost() {
    return this.players.find(p => p.id === this.hostId);
  }

  disablePlayer(playerId, reason) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.isDisabled = true;
      player.disabledReason = reason;
      logger.info(`Player ${player.username} disabled: ${reason}`);
    }
  }

  getActivePlayers() {
    return this.players.filter(p => !p.isDisabled);
  }

  // Game management
  randomizeTurnOrder() {
    this.turnOrder = [...this.players].sort(() => Math.random() - 0.5);
    logger.info(`Turn order randomized for room ${this.id}`);
  }

  startGame(firstWord) {
    this.gameStarted = true;
    this.wordsChain = [{
      word: firstWord,
      playerId: 'system',
      playerName: 'System',
      timestamp: new Date().toISOString(),
      isNew: false,
      turnNumber: 0
    }];
    this.turnNumber = 1;
    this.currentTurnIndex = 0;
    logger.info(`Game started in room ${this.id}`);
  }

  endGame(_winnerId) {
    this.gameStarted = false;
    this.clearTurnTimer();
    logger.info(`Game ended in room ${this.id}`);
  }

  getCurrentPlayer() {
    return this.turnOrder[this.currentTurnIndex];
  }

  getCurrentWord() {
    return this.wordsChain[this.wordsChain.length - 1]?.word || '';
  }

  addWordToChain(wordData) {
    this.wordsChain.push(wordData);
    const player = this.getPlayer(wordData.playerId);
    if (player) {
      player.wordsUsed++;
    }
  }

  // Change the last word in chain (used when player can't continue)
  changeWord(newWord, playerId) {
    if (this.wordsChain.length === 0) {
      throw new Error('No words in chain to change');
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (player.changeWordUsed) {
      throw new Error('Change word already used');
    }

    // Update the last word in chain
    const lastWordIndex = this.wordsChain.length - 1;
    this.wordsChain[lastWordIndex] = {
      ...this.wordsChain[lastWordIndex],
      word: newWord,
      changedBy: playerId,
      changedByPlayer: player.username,
      changedAt: new Date().toISOString()
    };

    // Mark player as used change word
    player.changeWordUsed = true;

    logger.info(`Word changed in room ${this.id} by ${player.username}: ${newWord}`);
    return this.wordsChain[lastWordIndex];
  }

  nextTurn() {
    this.clearTurnTimer();
    this.turnNumber++;
    
    // Find next active player
    let nextIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
    let iterations = 0;
    
    while (this.turnOrder[nextIndex].isDisabled && iterations < this.turnOrder.length) {
      nextIndex = (nextIndex + 1) % this.turnOrder.length;
      iterations++;
    }
    
    this.currentTurnIndex = nextIndex;
    this.turnTimeLeft = this.turnTimeSeconds * 1000;
  }

  // Timer management
  startTurnTimer(callback) {
    this.clearTurnTimer();
    
    const startTime = Date.now();
    this.turnTimer = setTimeout(() => {
      callback();
    }, this.turnTimeSeconds * 1000);

    // Update time left periodically
    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      this.turnTimeLeft = Math.max(0, (this.turnTimeSeconds * 1000) - elapsed);
      
      if (this.turnTimeLeft === 0) {
        clearInterval(updateInterval);
      }
    }, 100);

    this.timerUpdateInterval = updateInterval;
  }

  pauseTurnTimer() {
    if (this.turnTimer && !this.timerPaused) {
      // Clear interval first to stop updating turnTimeLeft
      if (this.timerUpdateInterval) {
        clearInterval(this.timerUpdateInterval);
        this.timerUpdateInterval = null;
      }
      
      // Save current time left (after stopping interval updates)
      this.timerPausedTimeLeft = this.turnTimeLeft;
      this.timerPausedAt = Date.now();
      this.timerPaused = true;
      
      // Clear timeout
      if (this.turnTimer) {
        clearTimeout(this.turnTimer);
        this.turnTimer = null;
      }
      
      logger.info(`Timer paused in room ${this.id}, time left: ${this.timerPausedTimeLeft}ms`);
    }
  }

  resumeTurnTimer(callback) {
    if (this.timerPaused && this.timerPausedTimeLeft > 0) {
      this.timerPaused = false;
      const timeLeft = this.timerPausedTimeLeft;
      this.timerPausedTimeLeft = null;
      this.timerPausedAt = null;
      
      // Restart timer with remaining time
      const startTime = Date.now();
      this.turnTimer = setTimeout(() => {
        callback();
      }, timeLeft);

      // Update time left periodically
      const updateInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        this.turnTimeLeft = Math.max(0, timeLeft - elapsed);
        
        if (this.turnTimeLeft === 0) {
          clearInterval(updateInterval);
        }
      }, 100);

      this.timerUpdateInterval = updateInterval;
      
      logger.info(`Timer resumed in room ${this.id}, time left: ${timeLeft}ms`);
    }
  }

  clearTurnTimer() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.timerUpdateInterval) {
      clearInterval(this.timerUpdateInterval);
      this.timerUpdateInterval = null;
    }
    this.timerPaused = false;
    this.timerPausedAt = null;
    this.timerPausedTimeLeft = null;
  }

  // Voting management
  startVoting(data) {
    this.votingInProgress = true;
    this.votingData = {
      ...data,
      votesFor: 0,
      votesAgainst: 0,
      voters: new Set(),
      votedPlayers: new Set()
    };
    logger.info(`Voting started in room ${this.id} for word: ${data.word}`);
  }

  addVote(playerId, vote) {
    if (!this.votingInProgress || !this.votingData) {
      logger.error(`Vote failed: votingInProgress=${this.votingInProgress}, votingData=${!!this.votingData}`);
      throw new Error('No voting in progress');
    }

    if (this.votingData.votedPlayers.has(playerId)) {
      throw new Error('Already voted');
    }

    if (playerId === this.votingData.playerId) {
      throw new Error('Cannot vote on your own word');
    }

    this.votingData.votedPlayers.add(playerId);

    if (vote === 'accept') {
      this.votingData.votesFor++;
    } else {
      this.votingData.votesAgainst++;
    }
    
    logger.info(`Vote recorded: ${playerId} voted ${vote} in room ${this.id}`);
  }

  allPlayersVoted() {
    if (!this.votingInProgress) return false;
    
    // Count active players excluding the proposer
    const eligibleVoters = this.getActivePlayers().filter(
      p => p.id !== this.votingData.playerId
    ).length;
    
    return this.votingData.votedPlayers.size >= eligibleVoters;
  }

  endVoting() {
    const data = { ...this.votingData };
    this.votingInProgress = false;
    this.votingData = null;
    return data;
  }

  // State and stats
  getState() {
    return {
      id: this.id,
      playerCount: this.players.length,
      gameStarted: this.gameStarted,
      currentTurn: this.turnNumber,
      wordsCount: this.wordsChain.length,
      hostId: this.hostId,
      createdAt: this.createdAt
    };
  }

  getGameStats() {
    return {
      totalTurns: this.turnNumber,
      totalWords: this.wordsChain.length,
      newWordsAdded: this.wordsChain.filter(w => w.isNew).length,
      playerStats: this.players.map(p => ({
        id: p.id,
        username: p.username,
        wordsUsed: p.wordsUsed,
        isDisabled: p.isDisabled,
        disabledReason: p.disabledReason || null
      }))
    };
  }

  cleanup() {
    this.clearTurnTimer();
    logger.info(`Room ${this.id} cleaned up`);
  }
}

module.exports = Room;

