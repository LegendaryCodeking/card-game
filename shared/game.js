import { CardReference, Cards } from "./card.js";

export const GameState = {

  // Players are doing their turns
  PLAYER_TURN: "PLAYER_TURN",

  // Players are waiting for game to execute the current turn
  EXECUTION_TURN: "EXECUTION_TURN",

  // Game is waiting for the players
  WAITING_FOR_PLAYERS: "WAITING_FOR_PLAYERS",
}

export class ExecutionTurnState {
  // Card which is currently executing
  currentSlotId = 0;
}

/**
 * Describes the state of the game.
 */
export default class Game {

  // TODO: Move to the separate structure "Turn"
  turnPlayerId = undefined;
  turns = 0;
  executionTurnState = new ExecutionTurnState();

  state = GameState.WAITING_FOR_PLAYERS;

  // Cards on the desk
  desk = [ undefined, undefined, undefined, undefined, undefined, undefined ];

  // Players participating in the game
  players = [];

  // All cards which are allowed in the game
  cards = Cards;

  constructor(data) {
    Object.assign(this, data);
  }

  addPlayer(player) {
    console.log("GM -> Player added");
    player.hand = [];
    player.health = 30;
    for (let i = 0; i < 6; i++) {
      player.hand.push(undefined);
      this.pullCard(player);
    }
    this.players.push(player);
    if (this.players.length === 2) this.nextTurn();
    
    if (this.turnPlayerId === undefined) {
      this.turnPlayerId = player.id;
    }

    return player;
  }

  isPlayerTurn(player) {
    return this.turnPlayerId === player.id;
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  getOpponent(playerId) {
    return this.players.find(p => p.id !== playerId);
  }

  /**
   * Pulls the card for a specific player from his deck
   */
  pullCard(player) {
    // The card will be a random one
    const cardId = Math.round(Math.random() * this.cards.length) % this.cards.length;
    const availableSlot = player.hand.findIndex(cid => cid === undefined);
    if (availableSlot >= 0) {
      player.hand[availableSlot] = new CardReference(this.cards[cardId].id, player.id);
    }
  }

  /**
   * Completes the current turn and moves to the next one.
   */
  nextTurn() {
    // We can't do anything until all players are in the game
    if (this.players.length < 2) return;

    if (this.state === GameState.WAITING_FOR_PLAYERS) {
      // If the game has started:
      // Select the first player for the first turn
      this.turnPlayerId = this.players[0].id;
      this.state = GameState.PLAYER_TURN;
      this.turns += 1;

    } else if (this.state === GameState.PLAYER_TURN) {

      if (this.turns >= 2) {
        // If it has beed 2 turns, meaning both players made their turns
        // At this point, we should start the "execution turn".
        this.state = GameState.EXECUTION_TURN;
        this.executionTurnState = new ExecutionTurnState();
        this.turns = 0;

      } else {
        // If one player has made their turn, we should select the opponent
        // fot the next turn.
        this.turnPlayerId = this.players.find(p => p.id !== this.turnPlayerId).id;
        this.turns += 1;
      }

    } else if (this.state === GameState.EXECUTION_TURN) {
    
      // if the "execution turn" is complete
      // we will use the same player for the first turn (the last value of turnPlayerId)
      this.state = GameState.PLAYER_TURN;
      this.desk = [undefined, undefined, undefined, undefined, undefined, undefined];
      this.turns += 1;
    }

    console.log(`GM -> next turn: ${ this.state }`);
  }

  performExecutionTurn(actions) {
    if (this.state === GameState.EXECUTION_TURN) {
      console.log(`GM -> perform execution turn`);

      const executionState = this.executionTurnState;
      const slotId = executionState.currentSlotId;

      // Perform action for the current card
      const cardRef = this.desk[slotId];
      if (cardRef) {
        this.cards.find(c => c.id === cardRef.id)
          .action(actions, this, slotId, this.getPlayer(cardRef.owner), this.getOpponent(cardRef.owner));
      }

      // Select the next card for the next execution
      executionState.currentSlotId += 1;

      // If all cards are executed, then we need to switch to the next turn
      if (executionState.currentSlotId >= this.desk.length) {
        this.nextTurn();
        return;
      }
    }
  }

  update(data) {
    let game = new Game(this);
    Object.assign(game, data);
    return game;
  }
  
}