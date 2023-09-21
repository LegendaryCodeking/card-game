import { PlayerInstance } from "./Player.js";
import { CardSlot, Cards } from "./Cards.js";
import { v4 as uuid } from "uuid";
import RandomDistributor from "./utils/RandomDistributor.js";

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
  desk = [ new CardSlot(), new CardSlot(), new CardSlot(), new CardSlot(), new CardSlot(), new CardSlot() ];
  players = [];

  cards = new RandomDistributor({ nodes: [
    { w: 0.84, group: [
      { w: 1, v: Cards.ARROW.id },
      { w: 1, v: Cards.FIREBALL.id },
      { w: 1, v: Cards.REPEAT.id },
      { w: 1, v: Cards.SHIELD.id },
      { w: 1, v: Cards.REVERSE.id },
    ]},
    { w: 0.16, group: [
      { w: 1, v: Cards.HEAL.id }
    ]},
  ]});

  /**
   * Constructs a game with provided data
   * @param {any} data 
   */
  constructor(data) {
    Object.assign(this, data);
    this.cards = new RandomDistributor(this.cards);
    this.desk = this.desk.map(d => new CardSlot(d));
    this.players = this.players.map(d => new PlayerInstance(d));
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
      player.hand.push(new CardSlot());
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
    const cardInstance = player.hand[fromSlotId].getCard();
    const slotAvailable = !this.desk[toSlotId].hasCard();
    const playerDeskCards = this.getPlayerDeskCardsCount(playerId);

    const canPlaceCard = cardInstance && slotAvailable && playerDeskCards < 3;

    // If the card has a mana cost, verify that the player has
    // enough mana to pay for it
    const card = Cards.getCardByInstance(cardInstance);
    if (canPlaceCard && card.getManaCost) {
      const manaCost = card.getManaCost();
      return player.mana >= manaCost;
    }

    return canPlaceCard;
  }

  moveCardFromHandToDesk(playerId, fromSlotId, toSlotId) {
    if (!this.canMoveCardFromHandToDesk(playerId, fromSlotId, toSlotId)) {
      return;
    }

    const player = this.getPlayer(playerId);

    // Move card
    const cardInstance = player.hand[fromSlotId].takeCard();
    this.desk[toSlotId].setCard(cardInstance);

    // Pay the cost if it has it
    const card = Cards.getCardByInstance(cardInstance);
    if (card.getManaCost) {
      const manaCost = card.getManaCost();
      player.mana -= manaCost;
    }
  }

  canMoveCardFromDeskToHand(playerId, fromSlotId, toSlotId) {
    if (!this.isPlayerTurn(playerId)) return false;

    const player = this.getPlayer(playerId);
    const cardInstance = this.desk[fromSlotId].getCard();

    if (cardInstance) {
      const slotAvailable = !player.hand[toSlotId].hasCard();
      const ownsCard = cardInstance.owner === playerId;

      // We can't bring back the pinned card from the desk
      if (cardInstance.pinned) return false;

      return slotAvailable && ownsCard;
    }
    return false;
  }

  moveCardFromDeskToHand(playerId, fromSlotId, toSlotId) {
    if (!this.canMoveCardFromDeskToHand(playerId, fromSlotId, toSlotId)) {
      return;
    }

    const player = this.getPlayer(playerId);

    // Move the card
    const cardInstance = this.desk[fromSlotId].takeCard();
    player.hand[toSlotId].setCard(cardInstance);

    // Spent mana should be returned back to the player
    const card = Cards.getCardByInstance(cardInstance);
    if (card.getManaCost) {
      const manaCost = card.getManaCost();
      player.mana += manaCost;
    }
  }

  canMoveCardFromDeskToDesk(playerId, fromSlotId, toSlotId) {
    if (!this.isPlayerTurn(playerId)) return false;

    const cardInstance = this.desk[fromSlotId].getCard();
    if (cardInstance && !this.desk[toSlotId].hasCard()) {

      // There is no way to move the pinned card
      if (cardInstance.pinned) return false;

      if (cardInstance.owner === playerId) {
        // Players can move their cards anywhere they want
        return true;
      } else {
        // Cards of opponents can be moved only
        // to a specific places (player should not be able to re-arrange the sequence of
        // opponents cards).
      
        const direction = toSlotId - fromSlotId > 0 ? 1 : -1;
        if (direction === 0) return false;
        
        for (let i = fromSlotId + direction; i >= 0 && i < this.desk.length; i += direction) {
          if (this.desk[i].hasCard() && this.desk[i].getCard().owner !== playerId) break;
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
    this.desk[toSlotId].setCard(this.desk[fromSlotId].takeCard());
  }

  canMoveCardFromHandToHand(playerId, fromSlotId, toSlotId) {
    const player = this.getPlayer(playerId);
    return player.hand[fromSlotId].hasCard() && !player.hand[toSlotId].hasCard();
  }

  moveCardFromHandToHand(playerId, fromSlotId, toSlotId) {
    if (!this.canMoveCardFromHandToHand(playerId, fromSlotId, toSlotId)) {
      return;
    }

    const player = this.getPlayer(playerId);
    player.hand[toSlotId].setCard(player.hand[fromSlotId].takeCard());
  }

  // TODO(vadim): This should accept playerId
  // TODO(vadim): Tie is also an option
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

  // TODO(vadim): Rename to "canUseCard"
  canUseEnchant(playerId, slotId) {
    if (!this.isPlayerTurn(playerId)) return false;
    if (this.getPlayer(playerId).enchants[slotId] === undefined) return false;
    return true;
  }

  // TODO(vadim): Rename to "canUseCardOn"
  canUseEnchantOn(playerId, slotId, targetSlotId) {
    if (!this.canUseEnchant(playerId, slotId)) return false;

    const player = this.getPlayer(playerId);
    if (this.desk[targetSlotId].hasCard()) {
      const manaCost = this.getEnchantManaCostFor(playerId, slotId, targetSlotId);
      return player.mana >= manaCost;
    }
    return false;
  }

  // TODO(vadim): Rename to "canUseCardManaCost"
  getEnchantManaCostFor(playerId, slotId, targetSlotId) {
    const cardInstance = this.getPlayer(playerId).enchants[slotId];
    const card = Cards.getCardByInstance(cardInstance);
    return card.getManaCost({ targetSlotId });
  }

  // TODO(vadim): This is temporary
  // TODO(vadim): Rename to "useCard"
  useEnchant(playerId, slotId, targetSlotId) {
    if (!this.canUseEnchantOn(playerId, slotId, targetSlotId)) return;

    const player = this.getPlayer(playerId);
    const cardInstance = player.enchants[slotId];
    const card = Cards.getCardByInstance(cardInstance);
    const manaCost = this.getEnchantManaCostFor(playerId, slotId, targetSlotId);
    player.mana -= manaCost;
    card.action({ game: this, player, targetSlotId });
  }

  getPlayerCardsCount(playerId) {
    const cardsOnDesk = this.desk.filter(cardSlot => cardSlot.getCard()?.owner === playerId).length;
    const cardsOnHand = this.getPlayer(playerId).hand.filter(cardSlot => cardSlot.hasCard()).length;
    return cardsOnDesk + cardsOnHand; 
  }

  getPlayerDeskCardsCount(playerId) {
    return this.desk.filter(cardSlot => cardSlot.getCard()?.owner === playerId).length;
  }

  // TOOD(vadim): Move to the player class
  getPlayerHandCardsCount(playerId) {
    return this.getPlayer(playerId).hand.filter(cardSlot => cardSlot.hasCard()).length;
  }

  getNextDeskCard(slotId) {
    for (let i = slotId + 1; i < this.desk.length; i++) {
      if (this.desk[i].hasCard()) return [ this.desk[i].getCard(), i ];
    }
    return [ undefined, undefined ];
  }

  getPrevDeskCard(slotId) {
    for (let i = slotId - 1; i >= 0; i--) {
      if (this.desk[i].hasCard()) return [ this.desk[i].getCard(), i ];
    }
    return [ undefined, undefined ];
  }

  getLastDeskCard() {
    for (let i = this.desk.length - 1; i >= 0; i--) {
      if (this.desk[i].hasCard()) return [ this.desk[i].getCard(), i];
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
    const availableSlotId = player.hand.findIndex(cardSlot => !cardSlot.hasCard());
    if (availableSlotId >= 0) {
      const card = Cards.getCardById(this.cards.pick());
      player.hand[availableSlotId].setCard(card.createInstance({ owner: player.id }));
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

  clearDesk() {
    this.desk = this.desk.map(s => new CardSlot());
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
      // If the game has started
      // Select the first player for the first turn

      // TODO(vadim): Pick a random one for that
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
        this.clearDesk();
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
        const card = Cards.getCardByInstance(cardInstance);
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

        const context = { actions, game: this, slotId, player, opponent, cardInstance };
        card.action(context);

        // Perform "post-action" for the effects on the player
        this.players.forEach(p => {
          p.effects
            .map(e => e.postAction)
            .filter(a => a !== undefined)
            .forEach(a => a(actions, this, slotId, player, opponent));
        })
      }

      // Every action that we send to the player
      // should have unique identifier
      actions.forEach(action => action.id = uuid());

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
    return new Game({ ...this, ...data });
  }
  
}