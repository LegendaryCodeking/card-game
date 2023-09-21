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
    const oldGame = game.current;
    game.current = game.current.update(response.data);

    // We want to update view of the game state only if there were any changes
    if (oldGame.players !== game.current.players)
      onPlayersUpdate();

    if (oldGame.desk !== game.current.desk)
      onDeskUpdate();

    if (oldGame.actions !== game.current.actions)
      onActionsUpdate();

    if (oldGame.turn !== game.current.turn)
      onTurnUpdate();
  }
  // TODO(vadim): Return game.current
  return [ game, onGameStateUpdate ];
}

export const GameViewState = {
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
  // TODO(vadim): Replace above with the thing below
  const [ selectedCardSlot, setSelectedCardSlot ] = useState({ place: 'desk', slotId: 0 });

  const [ player, setPlayer ] = useState(new PlayerInstance());
  const [ opponent, setOpponent ] = useState(new PlayerInstance());

  const [ hand, setHand ] = useState([]);
  const [ desk, setDesk ] = useState([]);
  const [ turn, setTurn ] = useState([]);

  const [ canPullCard, setCanPullCard ] = useState(false);

  // Shows the current mana cost of the card to use
  const [ manaCost, setManaCost ] = useState(0);
  const [ enchantCost, setEnchantCost ] = useState([0,0,0,0,0,0]);
  
  // History of everything which happend in the current turn (displayed on the left)
  const [ actions, setActions ] = useState([]);

  // Current view mode (player is moving cards? selecting a target for the card? etc.)
  const [ mode, setMode ] = useState(GameViewState.CARD_MOVE);

  // Stores boolean values which define whether the player can do something with certain hand/desk cards
  // TODO(vadim): DEDUCE: value of this variable can be deduced during rendering
  const [ availableHandSlots, setAvailableHandSlots ] = useState([]);
  // TODO(vadim): DEDUCE: value of this variable can be deduced during rendering
  const [ availableDeskSlots, setAvailableDeskSlots ] = useState([]);

  // Initialize game state and define updaters for the view of the game
  const [ game, onGameStateUpdate ] = useGameState({
    onPlayersUpdate: () => {
      setPlayer(game.current.getPlayer(playerInfo.id) ?? new PlayerInstance());
      setOpponent(game.current.getOpponent(playerInfo.id) ?? new PlayerInstance());
      setHand(game.current.getPlayer(playerInfo.id).hand);
      console.log(game.current.getPlayer(playerInfo.id).hand);
      setCanPullCard(game.current.canPullCard(playerInfo.id));
    },
    onDeskUpdate: () => {
      setDesk(game.current.desk);
    },
    onTurnUpdate: () => {
      // WARNING: This setTurn() is called only to trigger the render
      setTurn(game.current.turn);
      setCanPullCard(game.current.canPullCard(playerInfo.id));
      updateAvailableDeskSlots();
    },
    onActionsUpdate: () => {
      setActions(actions => {
        const newActions = actions.concat(game.current.actions ?? []);
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

  function updateAvailableDeskSlots(params) {
    // TODO(vadim): This should show available targets for the enchant
    // if 'place === 'hand and card[slotId].type === enchant'

    // If it the player turn, than all card slots are available to use for the player
    // otherwise, there is no way player should select those slots or card in them
    if (!params) {
      // TODO(vadim): WTF did I wrote?
      setAvailableDeskSlots(game.current.desk.map(() => game.current.isPlayerTurn(playerInfo.id)));
      return;
    }

    // By default only show where currently selected card (passed in "params") can be moved.
    const { place, slotId } = params;
    setAvailableDeskSlots(game.current.desk.map((cardSlot, deskSlotId) => {
      if (cardSlot.hasCard()) return true;
      if (place === 'desk')
        return game.current.canMoveCardFromDeskToDesk(playerInfo.id, slotId, deskSlotId);
      else if (place === 'hand')
        return game.current.canMoveCardFromHandToDesk(playerInfo.id, slotId, deskSlotId);
      return false;
    }));
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
    mode,

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
        updateAvailableDeskSlots();
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
    selectDeskSlot: useCallback(function (deskSlotId) {
      if (mode === GameViewState.SELECT_DESK_TARGET) {
        updateAvailableDeskSlots();
        useCardOn(0, deskSlotId);
        setMode(GameViewState.CARD_MOVE);
        setEnchantCost(game.current.desk.map(() => 0));
        return;
      }

      if (deskSlotId === selectedDeskSlot) {
        // Unselect the current card on the desk
        setSelectedDeskSlot(undefined);
        updateAvailableDeskSlots();

      } else if (desk[deskSlotId].hasCard()) {
        // If a certain card is selected
        setSelectedDeskSlot(deskSlotId);
        setSelectedHandSlot(undefined);
        updateAvailableDeskSlots({ place: 'desk', slotId: deskSlotId });
        this.hideManaCost();

      } else {
        // Player moves card to the free card slot
        if (selectedHandSlot !== undefined) {
          // TODO(vadim): If a spell costs any mana, we should update
          // mana of the player locally
          moveCardFromHandToDesk(selectedHandSlot, deskSlotId);
          setSelectedHandSlot(undefined);
        } else if (selectedDeskSlot !== undefined) {
          moveCardFromDeskToDesk(selectedDeskSlot, deskSlotId);
          setSelectedDeskSlot(undefined);
        }
        updateAvailableDeskSlots();
        this.hideManaCost();
      }
    }, [ mode, hand, desk, selectedHandSlot, selectedDeskSlot ]),

    selectHandSlot: useCallback(function (handSlotId) {
      if (handSlotId === selectedHandSlot) {
        // Unselect the current card on the hand
        setSelectedHandSlot(undefined);
        updateAvailableDeskSlots();
        this.hideManaCost();

      } else if (hand[handSlotId].hasCard()) {
        // Select a certain card
        setSelectedHandSlot(handSlotId);
        setSelectedDeskSlot(undefined);
        updateAvailableDeskSlots({ place: 'hand', slotId: handSlotId })
        this.showManaCostFor(hand[handSlotId].getCard());

      } else {
        // Move card to the free slot
        if (selectedDeskSlot !== undefined) {
          moveCardFromDeskToHand(selectedDeskSlot, handSlotId);
          setSelectedDeskSlot(undefined);
        } else if (selectedHandSlot !== undefined) {
          moveCardFromHandToHand(selectedHandSlot, handSlotId);
          setSelectedHandSlot(undefined);
        }
        updateAvailableDeskSlots();
        this.hideManaCost();
      }
    }, [ hand, desk, selectedDeskSlot, selectedHandSlot ]),
  };
}