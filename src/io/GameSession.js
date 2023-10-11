import { useCallback, useEffect, useRef, useState } from "react";
import Game from "../../core/Game";
import { PlayerInstance } from "../../core/Player";
import { CardType, Cards } from "../../core/Cards";

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

function useSlotSelection() {
  const [ selectedCardSlot, setSelectedCardSlot ] = useState(undefined);

  return {
    place: selectedCardSlot?.place,
    slotId: selectedCardSlot?.slotId,

    selectDeskSlot: function(slotId) { setSelectedCardSlot({ place: 'desk', slotId }) },
    selectHandSlot: function(slotId) { setSelectedCardSlot({ place: 'hand', slotId }) },
    unselectSlot: function() { setSelectedCardSlot(undefined) },
    isSlotSelected: function(place, slotId) { 
      return selectedCardSlot?.place === place && selectedCardSlot?.slotId === slotId;
    }
  }
}

export const GameViewMode = {
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

  // const { hand, desk, setHand, setDesk, isEnabled } = useSlots();
  // const { cost, costFor } = useMana();

  const slotSelection = useSlotSelection();

  const [ mode, setMode ] = useState(GameViewMode.CARD_MOVE);

  const [ player, setPlayer ] = useState(new PlayerInstance());
  const [ opponent, setOpponent ] = useState(new PlayerInstance());

  const [ hand, setHand ] = useState([]);
  const [ desk, setDesk ] = useState([]);
  const [ turn, setTurn ] = useState([]);

  const [ canPullCard, setCanPullCard ] = useState(false);

  const [ manaCost, setManaCost ] = useState(0);
  const [ enchantCost, setEnchantCost ] = useState([0,0,0,0,0,0]);
  const [ actions, setActions ] = useState([]);

  // Initialize game state and define updaters for the view of the game
  const [ game, onGameStateUpdate ] = useGameState({
    onPlayersUpdate: () => {
      setPlayer(game.current.getPlayer(playerInfo.id) ?? new PlayerInstance());
      setOpponent(game.current.getOpponent(playerInfo.id) ?? new PlayerInstance());
      setHand(game.current.getPlayer(playerInfo.id).hand);
      setCanPullCard(game.current.canPullCard(playerInfo.id));
    },
    onDeskUpdate: () => {
      setDesk(game.current.desk);
    },
    onTurnUpdate: () => {
      setTurn(game.current.turn);
      setCanPullCard(game.current.canPullCard(playerInfo.id));
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

  const enabledDeskSlots = desk.map((slot, slotId) => {
    if (slotSelection.place === 'desk') {
      return game.current.canMoveCardFromDeskToDesk(playerInfo.id, slotSelection.slotId, slotId);
    } else if (slotSelection.place === 'hand') {
      return game.current.canMoveCardFromHandToDesk(playerInfo.id, slotSelection.slotId, slotId);
    } else {
      return true;
    }
  }).map((canMove, slotId) => {
    return desk[slotId].hasCard() || canMove;
  }).map((canSelect, slotId) => {
    return canSelect && game.current.isPlayerTurn(playerInfo.id);
  })

  const enabledHandSlots = hand.map((slot, slotId) => {
    if (slotSelection.place === 'desk') {
      return game.current.canMoveCardFromDeskToHand(playerInfo.id, slotSelection.slotId, slotId);
    } else if (slotSelection.place === 'hand') {
      return game.current.canMoveCardFromHandToHand(playerInfo.id, slotSelection.slotId, slotId);
    } else {
      return true;
    }
  }).map((canMove, slotId) => {
    return hand[slotId].hasCard() || canMove;
  }).map((canSelect, slotId) => {
    return canSelect && game.current.isPlayerTurn(playerInfo.id);
  })


  // Establish connection with the server and update game state on events
  useGameConnection(gameId, playerInfo, connection, onGameStateUpdate);

  // ==== Functions to update the game state and the game state view ====

  function moveCardFromHandToDesk(handSlotId, deskSlotId) {
    if (game.current.canMoveCardFromHandToDesk(playerInfo.id, handSlotId, deskSlotId)) {
      game.current.moveCardFromHandToDesk(playerInfo.id, handSlotId, deskSlotId);

      setDesk([...game.current.desk]);
      setHand([...game.current.getPlayer(playerInfo.id).hand]);

      connection.sendMoveCardFromHandToDesk(handSlotId, deskSlotId);
    }
  };

  function moveCardFromDeskToDesk(fromSlotId, toSlotId) {
    if (game.current.canMoveCardFromDeskToDesk(playerInfo.id, fromSlotId, toSlotId)) {
      game.current.moveCardFromDeskToDesk(playerInfo.id, fromSlotId, toSlotId);

      setDesk([...game.current.desk]);

      connection.sendMoveCardFromDeskToDesk(fromSlotId, toSlotId);
    }
  };

  function moveCardFromDeskToHand(deskSlotId, handSlotId) {
    if (game.current.canMoveCardFromDeskToHand(playerInfo.id, deskSlotId, handSlotId)) {
      game.current.moveCardFromDeskToHand(playerInfo.id, deskSlotId, handSlotId);

      setHand([...game.current.getPlayer(playerInfo.id).hand]);
      setDesk([...game.current.desk]);

      connection.sendMoveCardFromDeskToHand(deskSlotId, handSlotId);
    }
  };

  function moveCardFromHandToHand(fromSlotId, toSlotId) {
    if (game.current.canMoveCardFromHandToHand(playerInfo.id, fromSlotId, toSlotId)) {
      game.current.moveCardFromHandToHand(playerInfo.id, fromSlotId, toSlotId);

      setHand([ ...game.current.getPlayer(playerInfo.id).hand ]);

      connection.sendMoveCardFromHandToHand(fromSlotId, toSlotId);
    }
  };

  function useCardOn(slotId, targetSlotId) {
    if (game.current.canUseEnchantOn(playerInfo.id, slotId, targetSlotId)) {
      game.current.useEnchant(playerInfo.id, slotId, targetSlotId);

      setDesk([ ...game.current.desk ]);
      setHand([ ...game.current.getPlayer(playerInfo.id).hand ])
      setPlayer(game.current.getPlayer(playerInfo.id));

      connection.sendUseCard(slotId, targetSlotId);
    }
  }

  function showManaCostFor(cardInstance) {
    const card = Cards.getCardByInstance(cardInstance);
    if (card.getManaCost) setManaCost(card.getManaCost());
    else setManaCost(0);
  };

  function hideManaCost() { setManaCost(0); }

  function showEnchantCost(cardInstance) {
    setEnchantCost(game.current.desk.map((slot, slotId) => {
      return cardInstance.getCard().getManaCost({ targetSlotId: slotId }) ?? 0;
    }))
  }

  function hideEnchantCost() {
    setEnchantCost(game.current.desk.map(() => { return 0; }));
  }

  return {
    game: game.current,
    player,
    opponent,
    hand,
    desk,
    actions,
    manaCost,
    slotSelection,
    canPullCard,
    enchantCost,
    mode,
    enabledHandSlots,
    enabledDeskSlots,

    completeTurn: useCallback(() => {
      connection.sendCompleteTurn();
    }, [ connection ]),

    pullCard: useCallback(() => {
      if (game.current.canPullCard(playerInfo.id))
        connection.sendPullCard();
    }, [ connection ]),

    selectDeskSlot: useCallback(function (deskSlotId) {
      if (mode === GameViewMode.SELECT_DESK_TARGET) {
        // Use enchant on the selected card
        useCardOn(slotSelection.slotId, deskSlotId);
        slotSelection.unselectSlot();
        setMode(GameViewMode.CARD_MOVE);
        hideEnchantCost();

      } else if (slotSelection.isSlotSelected('desk', deskSlotId)) {
        // Unselect the curent card
        slotSelection.unselectSlot();

      } else if (desk[deskSlotId].hasCard()) {
        // Select another card
        slotSelection.selectDeskSlot(deskSlotId);
        hideManaCost();

      } else {
        if (slotSelection.place === 'hand') {
          // Move card from hand to desk
          moveCardFromHandToDesk(slotSelection.slotId, deskSlotId);
        } else {
          // Move card from desk to desk
          moveCardFromDeskToDesk(slotSelection.slotId, deskSlotId);
        }
        slotSelection.unselectSlot();
        hideManaCost();
      }
    }, [ mode, hand, desk, slotSelection ]),

    selectHandSlot: useCallback(function (handSlotId) {
      if (mode === GameViewMode.SELECT_DESK_TARGET) {
        setMode(GameViewMode.CARD_MOVE);
        hideEnchantCost();
      }

      if (slotSelection.isSlotSelected('hand', handSlotId)) {
        // Unselect the current card on the hand
        slotSelection.unselectSlot();
        hideManaCost();

      } else if (hand[handSlotId].hasCard()) {

        const card = hand[handSlotId].getCard().getCard();
        if (card.type === CardType.ENCHANT) {
          setMode(GameViewMode.SELECT_DESK_TARGET);
          showEnchantCost(hand[handSlotId].getCard());
        }

        // Select a certain card
        slotSelection.selectHandSlot(handSlotId);
        showManaCostFor(hand[handSlotId].getCard());

      } else {
        if (slotSelection.place === 'desk') {
          // Move from desk to hand
          moveCardFromDeskToHand(slotSelection.slotId, handSlotId);
        } else {
          // Move from hand to hand
          moveCardFromHandToHand(slotSelection.slotId, handSlotId);
        }
        slotSelection.unselectSlot();
        hideManaCost();
      }
    }, [ mode , hand, desk, slotSelection ]),
  };
}