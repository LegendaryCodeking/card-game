import { useCallback, useEffect, useRef, useState } from "react";
import Game, { TurnState } from "../../core/Game";
import { PlayerInstance } from "../../core/Player";
import { Cards } from "../../core/Cards";

/**
 * Establish connection with the game server
 * and calls appropriate callback for every received event.

 * @param {number} gameId - id of the game session that should be joined
 * @param {ServerConnection} connection - connection to the server
 * @param {(data: any) => void} onGameStateUpdate - callbacks to call on game state update
 */
function useGameConnection(gameId, playerInfo, connection, onGameStateUpdate) {
  useEffect(() => {
    connection.sendJoinGame(gameId, playerInfo);

    connection.onFullUpdate(onGameStateUpdate);
    connection.onPartialUpdate(onGameStateUpdate);

    connection.onError(response => {
      console.error(`SC -> ERROR: ${ response.data }`);
    });
  }, [ connection ]);
}

/**
 * Syncs game state with the server and calls
 * appropriate callbacks for every change in the state 
 */
function useGameState({ onDeskUpdate, onPlayersUpdate, onTurnUpdate, onActionsUpdate }) {
  const game = useRef(new Game());

  function onGameStateUpdate(response) {
    const currentGame = game.current;
    const updatedGame = game.current.update(response.data);

    // We want to update view of the game state only if there were any changes
    if (updatedGame.players !== currentGame.players)
      onPlayersUpdate(updatedGame);

    if (updatedGame.desk !== currentGame.desk)
      onDeskUpdate(updatedGame);

    if (updatedGame.actions !== currentGame.actions)
      onActionsUpdate(updatedGame);

    if (updatedGame.turn !== currentGame.turn)
      onTurnUpdate(updatedGame);

    game.current = updatedGame;
  }
  // TODO(vadim): Return game.current
  return [ game, onGameStateUpdate ];
}

const GameViewState = {
  // Player can move desk and hand cards
  CARD_MOVE: "CARD_MOVE",
  // Player can only select the desk card for the current use of the card from the hand
  SELECT_DESK_TARGET: "SELECT_DESK_TARGET",
  // Player can't selected cards from desk or hand
  ALL_DISABLED: "ALL_DISABLED",
}

/**
 * Establish a game session and manages the state of the game view
 */
export function useGameView(connection, playerInfo, gameId) {

  // TODO(vadim): Remove those below
  const [ selectedDeskSlot, setSelectedDeskSlot ] = useState(undefined);
  const [ selectedHandSlot, setSelectedHandSlot ] = useState(undefined);

  const [ player, setPlayer ] = useState(new PlayerInstance());
  const [ opponent, setOpponent ] = useState(new PlayerInstance());

  const [ hand, setHand ] = useState([]);
  const [ desk, setDesk ] = useState([]);
  const [ turn, setTurn ] = useState([]);

  const [ selectedCardSlot, setSelectedCardSlot ] = useState({ place: 'desk', slotId: 0 });
  const [ canPullCard, setCanPullCard ] = useState(false);

  // Shows the current mana cost of the card to use
  const [ manaCost, setManaCost ] = useState(0);
  const [ enchantCost, setEnchantCost ] = useState([0,0,0,0,0,0]);
  
  // History of everything which happend in the current turn (displayed on the left)
  const [ actions, setActions ] = useState([]);

  // Current view mode (player is moving cards? selecting a target for the card? etc.)
  const [ mode, setMode ] = useState(GameViewState.CARD_MOVE);

  // Stores boolean values which define whether the player can do something with certain hand/desk cards
  const [ availableHandSlots, setAvailableHandSlots ] = useState([]);
  const [ availableDeskSlots, setAvailableDeskSlots ] = useState([]);

  // Initialize game state and define updaters for the view of the game
  const [ game, onGameStateUpdate ] = useGameState({
    onPlayersUpdate: (updatedGame) => {
      setPlayer(updatedGame.getPlayer(playerInfo.id) ?? new PlayerInstance());
      setOpponent(updatedGame.getOpponent(playerInfo.id) ?? new PlayerInstance());
      setHand(updatedGame.getPlayer(playerInfo.id).hand.map(v => v === null ? undefined : v));
      setCanPullCard(updatedGame.canPullCard(playerInfo.id));
    },
    onDeskUpdate: (updatedGame) => {
      setDesk(updatedGame.desk.map(v => v === null ? undefined : v));
    },
    onTurnUpdate: (updatedGame) => {
      // WARNING: This setTurn() is called only to trigger the render
      setTurn(updatedGame.turn);
      setCanPullCard(updatedGame.canPullCard(playerInfo.id));
    },
    onActionsUpdate: (updatedGame) => {
      setActions(actions => {
        const newActions = actions.concat(updatedGame.actions ?? []);
        // Keep only 5 latest actions
        newActions.splice(0, Math.max(newActions.length - 5, 0));
        return newActions;
      });
    }
  });

  // Establish connection with the server and update game state on events
  useGameConnection(gameId, playerInfo, connection, onGameStateUpdate);

  // ==== Functions to update the game state and the game state view ====

  function moveCardFromHandToDesk(handSlotId, deskSlotId) {
    if (game.current.canMoveCardFromHandToDesk(playerInfo.id, handSlotId, deskSlotId)) {
      // Update our local game state
      game.current.moveCardFromHandToDesk(playerInfo.id, handSlotId, deskSlotId);

      // Update views
      setDesk([...game.current.desk]);
      setHand([...game.current.getPlayer(playerInfo.id).hand]);

      // Commit our changes to the game server
      connection.sendMoveCardFromHandToDesk(handSlotId, deskSlotId);
    }
  };

  function moveCardFromDeskToDesk(fromSlotId, toSlotId) {
    if (game.current.canMoveCardFromDeskToDesk(playerInfo.id, fromSlotId, toSlotId)) {
      // Update our local game state
      game.current.moveCardFromDeskToDesk(playerInfo.id, fromSlotId, toSlotId);

      // Update views
      setDesk([...game.current.desk]);

      // Commit our changes to the game server
      connection.sendMoveCardFromDeskToDesk(fromSlotId, toSlotId);
    }
  };

  function moveCardFromDeskToHand(deskSlotId, handSlotId) {
    if (game.current.canMoveCardFromDeskToHand(playerInfo.id, deskSlotId, handSlotId)) {
      // Update our local game state
      game.current.moveCardFromDeskToHand(playerInfo.id, deskSlotId, handSlotId);

      // Update views
      setHand([...game.current.getPlayer(playerInfo.id).hand]);
      setDesk([...game.current.desk]);

      // Commit our changes to the game server
      connection.sendMoveCardFromDeskToHand(deskSlotId, handSlotId);
    }
  };

  function moveCardFromHandToHand(fromSlotId, toSlotId) {
    if (game.current.canMoveCardFromHandToHand(playerInfo.id, fromSlotId, toSlotId)) {
      // Update our local game state
      game.current.moveCardFromHandToHand(playerInfo.id, fromSlotId, toSlotId);

      // Update view of the hand
      setHand([...game.current.getPlayer(playerInfo.id).hand]);

      // Commit our changes to the game server
      connection.sendMoveCardFromHandToHand(fromSlotId, toSlotId);
    }
  };

  function useCardOn(slotId, targetSlotId) {
    if (game.current.canUseEnchantOn(playerInfo.id, slotId, targetSlotId)) {
      // Update our local game state
      game.current.useEnchant(playerInfo.id, slotId, targetSlotId);

      // Update view of desk cards and the player (because usage of the card costs mana)
      setDesk([ ...game.current.desk ]);
      setPlayer(game.current.getPlayer(playerInfo.id));

      // Commit changes to the server
      connection.sendUseCard(slotId, targetSlotId);
    }
  }

  // TODO(vadim): EVERTYHING BELOW SHOULD BE REFACTORED
  // TODO: Move this functions into the object below
  function showAvailableDeskSlotsForDeskCard(selectedDeskSlot) {
    setAvailableDeskSlots(game.current.desk.map((ref, deskSlot) => {
      if (ref) return true;
      return game.current.canMoveCardFromDeskToDesk(playerInfo.id, selectedDeskSlot, deskSlot);
    }));
  }

  function showAvailableDeskSlotsForHandCard(selectedHandSlot) {
    setAvailableDeskSlots(game.current.desk.map((ref, deskSlot) => {
      if (ref) return true;
      return game.current.canMoveCardFromHandToDesk(playerInfo.id, selectedHandSlot, deskSlot);
    }));
  }

  function resetAvailableDeskSlots() {
    setAvailableDeskSlots(game.current.desk.map(() => true));
  }

  return {
    game: game.current,
    player,
    opponent,
    hand,
    desk,
    actions,
    manaCost,
    availableDeskSlots,
    selectedDeskSlot,
    selectedHandSlot,
    canPullCard,
    enchantCost,

    completeTurn: useCallback(() => {
      connection.sendCompleteTurn();
    }, [ connection ]),

    pullCard: useCallback(() => {
      if (game.current.canPullCard(playerInfo.id)) {
        connection.sendPullCard();
      }
    }, [ connection ]),

    selectEnchant: useCallback(function (slotId) {
      if (mode === GameViewState.SELECT_DESK_TARGET) {
        setMode(GameViewState.CARD_MOVE);
        resetAvailableDeskSlots();
        setEnchantCost(game.current.desk.map(() => 0));
      } else {
        setSelectedHandSlot(undefined);
        setSelectedDeskSlot(undefined);
        setMode(GameViewState.SELECT_DESK_TARGET);
        setEnchantCost(game.current.desk.map((c, id) => game.current.getEnchantManaCostFor(playerInfo.id, 0, id)));
        setAvailableDeskSlots(a => a.map((v, slotId) => game.current.canUseEnchantOn(playerInfo.id, 0, slotId)));
      }
    }, [ mode, desk ]),

    // TODO(vadim): Move out of this object
    showManaCostFor: useCallback(function (cardInstance) {
      const card = Cards.getCardByInstance(cardInstance);
      if (card.getManaCost) setManaCost(card.getManaCost());
      else setManaCost(0);
    }),

    // TODO(vadim): Move out of this object
    hideManaCost: useCallback(function () {
      setManaCost(0);
    }),

    // TODO(vadim): Code for card selection should be refactored
    selectDeskSlot: useCallback(function (slotId) {
      if (mode === GameViewState.SELECT_DESK_TARGET) {
        resetAvailableDeskSlots();
        useCardOn(0, slotId);
        setMode(GameViewState.CARD_MOVE);
        setEnchantCost(game.current.desk.map(() => 0));
        return;
      }

      if (slotId === selectedDeskSlot) {
        // Unselect the current card on the desk
        setSelectedDeskSlot(undefined);
        resetAvailableDeskSlots();

      } else if (desk[slotId]) {
        // If a certain card is selected
        setSelectedDeskSlot(slotId);
        setSelectedHandSlot(undefined);
        showAvailableDeskSlotsForDeskCard(slotId);
        this.hideManaCost();

      } else {
        // Player moves card to the free card slot
        if (selectedHandSlot !== undefined) {
          // TODO(vadim): If a spell costs any mana, we should update
          // mana of the player locally
          moveCardFromHandToDesk(selectedHandSlot, slotId);
          setSelectedHandSlot(undefined);
        } else if (selectedDeskSlot !== undefined) {
          moveCardFromDeskToDesk(selectedDeskSlot, slotId);
          setSelectedDeskSlot(undefined);
        }
        resetAvailableDeskSlots();
        this.hideManaCost();
      }
    }, [ mode, hand, desk, selectedHandSlot, selectedDeskSlot ]),

    selectHandSlot: useCallback(function (handSlot) {
      if (handSlot === selectedHandSlot) {
        // Unselect the current card on the hand
        setSelectedHandSlot(undefined);
        resetAvailableDeskSlots();
        this.hideManaCost();

      } else if (hand[handSlot]) {
        // Select a certain card
        setSelectedHandSlot(handSlot);
        setSelectedDeskSlot(undefined);
        showAvailableDeskSlotsForHandCard(handSlot);
        this.showManaCostFor(hand[handSlot]);

      } else {
        // Move card to the free slot
        if (selectedDeskSlot !== undefined) {
          moveCardFromDeskToHand(selectedDeskSlot, handSlot);
          setSelectedDeskSlot(undefined);
        } else if (selectedHandSlot !== undefined) {
          moveCardFromHandToHand(selectedHandSlot, handSlot);
          setSelectedHandSlot(undefined);
        }
        resetAvailableDeskSlots();
        this.hideManaCost();
      }
    }, [ hand, desk, selectedDeskSlot, selectedHandSlot ]),
  };
}