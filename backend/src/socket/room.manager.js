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
    // Chỉ kiểm tra số lượng người chơi, không cần tất cả ready
    // Host sẽ quyết định khi nào start
    return this.players.length >= 2;
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

