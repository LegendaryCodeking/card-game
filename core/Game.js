import { PlayerInstance } from "./Player.js";
import { Cards } from "./Cards.js";

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

  id = undefined;
  turn = new TurnState();
  state = GameState.WAITING_FOR_PLAYERS;
  desk = [ undefined, undefined, undefined, undefined, undefined, undefined ];
  players = [];
  cards = [
    Cards.ARROW.id,
    Cards.FIREBALL.id,
    Cards.REPEAT.id,
    Cards.SHIELD.id,
    Cards.REVERSE.id,
  ];

  /**
   * Constructs a game with provided data
   * @param {any} data 
   */
  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * Creates a new player for this particular game with a defined playerId
   * and some player properties (character, picked cards, etc.).
   * @returns PlayerInstance added to the game
   */
  addPlayer(playerId, properties) {
    console.log("GM -> Player added");
    const player = new PlayerInstance({ id: playerId, mana: 0, ...properties });
    this.players.push(player);
    player.enchants.push(Cards.PIN.createInstance({ owner: player.id }));

    // Add 6 card slots to the player hand
    for (let i = 0; i < 6; i++) {
      player.hand.push(undefined);
      this.pullCard(playerId, false);
    }

    if (this.players.length === 2) this.completeTurn();
    
    if (!this.turn.playerId) {
      this.turn.playerId = player.id;
    }

    return player;
  }

  hasPlayer(playerId) {
    return this.getPlayer(playerId) !== undefined;
  }

  isPlayerTurn(playerId) {
    return this.state === GameState.PLAYER_TURN && this.turn.playerId === playerId;
  }

  canMoveCardFromHandToDesk(playerId, fromSlotId, toSlotId) {
    if (!this.isPlayerTurn(playerId)) return false;

    const player = this.getPlayer(playerId);
    const cardInstance = player.hand[fromSlotId];
    const slotAvailable = !this.desk[toSlotId];
    const playerDeskCards = this.getPlayerDeskCardsCount(playerId);

    return cardInstance && slotAvailable && playerDeskCards < 3;
  }

  moveCardFromHandToDesk(playerId, fromSlotId, toSlotId) {
    if (!this.canMoveCardFromHandToDesk(playerId, fromSlotId, toSlotId)) {
      return;
    }
    const player = this.getPlayer(playerId);
    const cardInstance = player.hand[fromSlotId];
    player.hand[fromSlotId] = undefined; 
    this.desk[toSlotId] = cardInstance;
  }

  canMoveCardFromDeskToHand(playerId, fromSlotId, toSlotId) {
    if (!this.isPlayerTurn(playerId)) return false;

    const player = this.getPlayer(playerId);
    const cardInstance = this.desk[fromSlotId];

    if (cardInstance) {
      const slotAvailable = !player.hand[toSlotId];
      const ownsCard = cardInstance.owner === playerId;
      return slotAvailable && ownsCard;
    }
    return false;
  }

  moveCardFromDeskToHand(playerId, fromSlotId, toSlotId) {
    if (!this.canMoveCardFromDeskToHand(playerId, fromSlotId, toSlotId)) {
      return;
    }

    const player = this.getPlayer(playerId);
    const cardInstance = this.desk[fromSlotId];
    player.hand[toSlotId] = cardInstance;
    this.desk[fromSlotId] = undefined;
  }

  canMoveCardFromDeskToDesk(playerId, fromSlotId, toSlotId) {
    if (!this.isPlayerTurn(playerId)) return false;

    const cardInstance = this.desk[fromSlotId];
    if (cardInstance && !this.desk[toSlotId]) {
      
      if (cardInstance.owner === playerId) {
        // Player can move their own card anywhere they wants
        return true;
      } else {
        // Cards of opponents can be moved only
        // to a specific places (player should not be able to re-arrange the sequence of
        // opponents cards).
      
        const direction = toSlotId - fromSlotId > 0 ? 1 : -1;
        if (direction === 0) return false;
        
        for (let i = fromSlotId + direction; i >= 0 && i < this.desk.length; i += direction) {
          if (this.desk[i] && this.desk[i].owner !== playerId) break;
          if (i === toSlotId) return true;
        }
      }
    }

    return false;
  }

  moveCardFromDeskToDesk(playerId, fromSlotId, toSlotId) {
    if (!this.canMoveCardFromDeskToDesk(playerId, fromSlotId, toSlotId)) {
      return;
    }

    const cardInstance = this.desk[fromSlotId];
    this.desk[toSlotId] = cardInstance;
    this.desk[fromSlotId] = undefined;
  }

  canMoveCardFromHandToHand(playerId, fromSlotId, toSlotId) {
    const player = this.getPlayer(playerId);
    const cardInstance = player.hand[fromSlotId];
    return cardInstance && !player.hand[toSlotId];
  }

  moveCardFromHandToHand(playerId, fromSlotId, toSlotId) {
    if (!this.canMoveCardFromHandToHand(playerId, fromSlotId, toSlotId)) {
      return;
    }

    const player = this.getPlayer(playerId);
    player.hand[toSlotId] = player.hand[fromSlotId];
    player.hand[fromSlotId] = undefined;
  }

  // TODO(vadim): This should accept playerId
  isWinner(player) {
    let loser = this.players[0];
    for (let p of this.players) {
      if (p.health < loser.health)
        loser = p;
    }
    return loser.id !== player.id;
  }

  /**
   * Get the player by playerId
   * @param {number} playerId 
   * @returns 
   */
  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  /**
   * Get the only opponent by the current playerId
   * @param {number} playerId 
   * @returns 
   */
  getOpponent(playerId) {
    return this.players.find(p => p.id !== playerId);
  }

  canUseEnchant(playerId, slotId) {
    if (!this.isPlayerTurn(playerId)) return false;
    if (this.getPlayer(playerId).enchants[slotId] === undefined) return false;
    return true;
  }

  canUseEnchantOn(playerId, slotId, targetSlotId) {
    const player = this.getPlayer(playerId);
    const manaCost = this.getEnchantManaCostFor(playerId, slotId, targetSlotId);
    return player.mana >= manaCost;
  }

  getEnchantManaCostFor(playerId, slotId, targetSlotId) {
    const cardInstance = this.getPlayer(playerId).enchants[slotId];
    return cardInstance.getManaCost({ targetSlotId });
  }

  useEnchant(playerId, slotId, targetSlotId) {
    if (!this.canUseEnchant(playerId, slotId)) return;
    if (!this.canUseEnchantOn(playerId, slotId, targetSlotId)) return;

    const player = this.getPlayer(playerId);
    const cardInstance = player.enchants[slotId];
    player.mana -= this.getEnchantManaCostFor(playerId, slotId, targetSlotId);
    cardInstance.action({ game: this, player, targetSlotId });
  }

  getPlayerCardsCount(playerId) {
    const cardsOnDesk = this.desk.filter((ref) => ref?.owner === playerId).length;
    const cardsOnHand = this.getPlayer(playerId).hand
      .filter((ref) => ref !== undefined && ref !== null).length;
    return cardsOnDesk + cardsOnHand; 
  }

  getPlayerDeskCardsCount(playerId) {
    return this.desk.filter((ref) => ref?.owner === playerId).length;
  }

  getPlayerHandCardsCount(playerId) {
    return this.getPlayer(playerId).hand.filter((ref) => ref !== undefined).length;
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

  getLastDeskCard() {
    for (let i = this.desk.length - 1; i >= 0; i--) {
      if (this.desk[i] !== undefined) return [ this.desk[i], i];
    }
    return [ undefined, undefined ];
  }

  // TODO(vadim): Rename to "isCardSlotIsExecuting"
  isSlotExecuted(slotId) {
    return this.state === GameState.EXECUTION_TURN && this.turn.slotId === slotId;
  }

  canPullCard(playerId) {
    const player = this.getPlayer(playerId);
    if (player) {
      const playersTurn = this.state === GameState.PLAYER_TURN;
      const notEnoughCards = this.getPlayerCardsCount(playerId) < 6;
      return playersTurn && notEnoughCards;
    }
    return false;
  }

  /**
   * Pulls the card for a specific player from his deck
   */
  pullCard(playerId, performValidation = true) {
    if (!this.canPullCard(playerId) && performValidation) return;

    const player = this.getPlayer(playerId);
    // The card will be a random one
    // TODO(vadim): Do randomness better
    const cardId = Math.round(Math.random() * this.cards.length) % this.cards.length;
    const availableSlot = player.hand.findIndex(ref => !ref);
    if (availableSlot >= 0) {
      const card = Cards[this.cards[cardId]];
      player.hand[availableSlot] = card.createInstance({ owner: player.id });
    }
  }

  /**
   * Give mana to the player
   * @param {number} playerId 
   */
  giveMana(playerId) {
    const player = this.getPlayer(playerId);
    player.mana = Math.min(player.mana + 1, 3);
  }

  /**
   * Completes the current turn. Can be done by a certain player
   * or without any player at all.
   * @param {number} playerId - id of the current player
   * @returns 
   */
  completeTurn(playerId) {
    // TODO(vadim): this code will probably fail if "playerId == 0"
    if (playerId && !this.isPlayerTurn(playerId)) return;

    // We can't do anything until all players are in the game
    if (this.players.length < 2) return;

    if (this.state === GameState.WAITING_FOR_PLAYERS) {
      // If the game has started:
      // Select the first player for the first turn
      this.turn.playerId = this.players[0].id;
      this.giveMana(this.turn.playerId);
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
        this.giveMana(this.turn.playerId);
      }
    }

    console.log(`GM -> next turn: ${ this.state }`);
  }

  completeGame() {
    console.log("GM -> game complete");
    this.state = GameState.COMPLETE;
  }

  performExecutionTurn() {
    this.actions = [];
    const actions = this.actions;

    if (this.state === GameState.EXECUTION_TURN) {
      console.log(`GM -> perform execution turn`);

      if (this.turn.slotId >= this.desk.length) {
        this.completeTurn();
        return;
      }

      // Perform action for the current card
      const cardInstance = this.desk[this.turn.slotId];
      if (cardInstance) {
        const player = this.getPlayer(cardInstance.owner);
        const opponent = this.getOpponent(cardInstance.owner);
        const slotId = this.turn.slotId;
        
        // Perform "pre-action" for the effects on the player
        this.players.forEach(p => {
          p.effects
            .map(e => e.preAction)
            .filter(a => a !== undefined)
            .forEach(a => a(actions, this, slotId, player, opponent));
        })

        const context = { actions, game: this, slotId, player, opponent };
        Cards.getCardByInstance(cardInstance).action(context);

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