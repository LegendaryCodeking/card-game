import { CardReference, Cards } from "./card.js";

export const GameState = {
  PLAYER_TURN: "PLAYER_TURN",
  EXECUTION_TURN: "EXECUTION_TURN",
  WAITING_FOR_PLAYERS: "WAITING_FOR_PLAYERS",
  COMPLETE: "COMPLETE",
}

export class TurnState {
  playerId = undefined;
  turns = 0;
  slotId = 0;
}

/**
 * Describes the state of the game.
 */
export default class Game {

  // State of the current turn
  turn = new TurnState();

  // State of the game 
  state = GameState.WAITING_FOR_PLAYERS;

  // Game desk contains slots for cards (each indexed by slotId)
  desk = [ undefined, undefined, undefined, undefined, undefined, undefined ];

  // List of players participating in the game
  players = [];

  // All cards which are allowed in this game
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
    
    if (this.turn.playerId === undefined) {
      this.turn.playerId = player.id;
    }

    return player;
  }

  isPlayerTurn(player) {
    return this.state === GameState.PLAYER_TURN && this.turn.playerId === player.id;
  }

  isWinner(player) {
    let loser = this.players[0];
    for (let p of this.players) {
      if (p.health < loser.health)
        loser = p;
    }
    return loser.id !== player.id;
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  getOpponent(playerId) {
    return this.players.find(p => p.id !== playerId);
  }

  getTotalPlayerCards(player) {
    const cardsOnDesk = this.desk.filter((ref) => ref?.owner === player.id).length;
    const cardsOnHand = player.hand.filter((ref) => ref !== undefined).length;
    return cardsOnDesk + cardsOnHand; 
  }

  getTotalDeskPlayerCards(player) {
    console.log(this.desk);
    return this.desk.filter((ref) => ref?.owner === player.id).length;
  }

  getTotalHandPlayerCards(player) {
    return player.hand.filter((ref) => ref !== undefined).length;
  }

  getNextDeskCard(slotId) {
    for (let i = slotId + 1; i < this.desk.length; i++) {
      if (this.desk[i] !== undefined) return [ this.desk[i], i ];
    }
    return [ undefined, undefined ];
  }

  getPrevDeskCard(slotId) {
    for (let i = slotId - 1; i >= 0; i--) {
      if (this.desk[i] !== undefined) return [ this.desk[i], i ];
    }
    return [ undefined, undefined ];
  }

  getCard(cardRef) {
    return this.cards.find(c => c.id === cardRef.id);
  }

  isSlotExecuted(slotId) {
    return this.state === GameState.EXECUTION_TURN && this.turn.slotId === slotId;
  }

  /**
   * Pulls the card for a specific player from his deck
   */
  pullCard(player) {
    if (this.getTotalPlayerCards(player) == 6) return;

    // The card will be a random one
    // TODO(vadim): Do randomness better
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
      this.turn.playerId = this.players[0].id;
      this.state = GameState.PLAYER_TURN;
      this.turn.turns += 1;

    } else if (this.state === GameState.PLAYER_TURN) {

      if (this.turn.turns >= 2) {
        // If it has beed 2 turns, meaning both players made their turns
        // At this point, we should start the "execution turn".
        this.state = GameState.EXECUTION_TURN;
        // Select the first card for execution
        const [ card, slotId ] = this.getNextDeskCard(-1);
        this.turn.slotId = slotId ?? this.desk.length;
        this.turn.turns = 0;

      } else {
        // If one player has made their turn, we should select the opponent
        // fot the next turn.
        this.turn.playerId = this.getOpponent(this.turn.playerId).id;
        this.turn.turns += 1;
      }

    } else if (this.state === GameState.EXECUTION_TURN) {

      const deadPlayer = this.players.find(p => p.health <= 0);
      if (deadPlayer) {
        this.completeGame();
      } else {
        // if the "execution turn" is complete
        // we will use the same player for the first turn (the last value of this.turn.playerId)
        this.state = GameState.PLAYER_TURN;
        this.desk = [undefined, undefined, undefined, undefined, undefined, undefined];
        this.players.forEach(p => p.effects = []);
        this.turn.turns += 1;
      }
    }

    console.log(`GM -> next turn: ${ this.state }`);
  }

  completeGame() {
    console.log("GM -> game complete");
    this.state = GameState.COMPLETE;
  }

  performExecutionTurn(actions) {
    if (this.state === GameState.EXECUTION_TURN) {
      console.log(`GM -> perform execution turn`);


      // Perform action for the current card
      const cardRef = this.desk[this.turn.slotId];
      if (cardRef) {
        const player = this.getPlayer(cardRef.owner);
        const opponent = this.getOpponent(cardRef.owner);
        const slotId = this.turn.slotId;
        
        // Perform "pre-action" for the effects on the player
        this.players.forEach(p => {
          p.effects
            .map(e => e.preAction)
            .filter(a => a !== undefined)
            .forEach(a => a(actions, this, slotId, player, opponent));
        })

        this.getCard(cardRef)
          .action(actions, this, slotId, player, opponent);


        // Perform "post-action" for the effects on the player
        this.players.forEach(p => {
          p.effects
            .map(e => e.postAction)
            .filter(a => a !== undefined)
            .forEach(a => a(actions, this, slotId, player, opponent));
        })
      }

      // Select the next card for the next execution
      const [ card, slotId ] = this.getNextDeskCard(this.turn.slotId);
      this.turn.slotId = slotId ?? this.desk.length;

      // If all cards are executed, then we need to switch to the next turn
      if (this.turn.slotId >= this.desk.length) {
        this.nextTurn();
        return;
      }
    }
  }

  /**
   * Creates a new game object with the same data, and then updates
   * it with a new data provided in the arguments.

   * @returns new game object
   */
  update(data) {
    let game = new Game(this);
    Object.assign(game, data);
    return game;
  }
  
}