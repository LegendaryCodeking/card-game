import { useCallback, useEffect, useRef, useState } from "react";
import Game, { TurnState } from "../../core/Game";
import { PlayerInstance } from "../../core/Player";
import { Cards } from "../../core/Cards";

/**
 * Connects to the specific game by gameId using the existing connection
 * to the game server. Accepts list of callbacks which are called on appropriate
 * events.
 */
export function useGameSession(connection, playerInfo, gameId) {

  const game = useRef(new Game());

  // All information extracted from the current game state ('game' variable)
  // Basically a view of that game state. Do not modify without modifying the game state.
  const [ player, setPlayer ] = useState(new PlayerInstance());
  const [ opponent, setOpponent ] = useState(new PlayerInstance());
  const [ hand, setHand ] = useState([]);
  const [ desk, setDesk ] = useState([]);
  const [ actions, setActions ] = useState([]);
  const [ turn, setTurn ] = useState(new TurnState());

  // Selected hand and desk slots

  // FREE_MOVE - When player can move freely cards from one place to another
  // ENCHANT_TARGET - WHen player has selected enchantment to use
  // LOCKED - When it's another player turn
  // TODO(vadim): Write a enum for that
  const [ mode, setMode ] = useState('FREE_MOVE');

  const [ manaCost, setManaCost ] = useState(0);
  const [ enchantCost, setEnchantCost ] = useState([0,0,0,0,0,0]);

  const [ selectedDeskSlot, setSelectedDeskSlot ] = useState(undefined);
  const [ selectedHandSlot, setSelectedHandSlot ] = useState(undefined);
  const [ availableDeskSlots, setAvailableDeskSlots ] = useState([]);

  const [ canPullCard, setCanPullCard ] = useState(false);

  /**
   * Updates the local state of the game based on the response from the game server.
   * Calls appropriate setters for every view of the game state (players, hand, desk, etc.).
   */
  function updateGame(response) {
    const currentGame = game.current;
    const updatedGame = game.current.update(response.data);

    if (updatedGame.players !== currentGame.players) {
      const updatedPlayer = updatedGame.getPlayer(playerInfo.id);
      const updatedOpponent = updatedGame.getOpponent(playerInfo.id);

      if (updatedPlayer) setPlayer(updatedPlayer);
      if (updatedOpponent) setOpponent(updatedOpponent);

      setHand(updatedGame.getPlayer(playerInfo.id).hand
        .map(ref => ref === null ? undefined : ref));
    }

    if (updatedGame.desk !== currentGame.desk) {
      setDesk(updatedGame.desk);
      setAvailableDeskSlots(updatedGame.desk.map(() => true));
    }

    if (updatedGame.actions !== currentGame.actions) {
      // We only want to display the last 5 actions
      if (!updatedGame.totalActionsCount)
        updatedGame.totalActionsCount = 0;
      
      setActions(actions => {
        const newActions = actions.concat(updatedGame.actions
          .map((action, id) => { return { 
            id: id + updatedGame.totalActionsCount, 
            ...action
          }}));
        updatedGame.totalActionsCount += updatedGame.actions.length;
        newActions.splice(0, Math.max(newActions.length - 5, 0));
        return newActions;
      });
    }

    if (updatedGame.turn !== currentGame.turn) {
      setTurn(updatedGame.turn);
    }

    game.current = updatedGame;
  }

  useEffect(() => {
    connection.sendJoinGame(gameId, playerInfo);

    connection.onFullUpdate(response => {
      console.log("SC -> Full update")
      updateGame(response);
    });

    connection.onPartialUpdate(response => {
      console.log("SC -> Partial update");
      updateGame(response);
    });

    connection.onError(response => {
      console.error(`SC -> ERROR: ${ response.data }`);
    });
  }, [ connection ]);

  useEffect(() => {
    setCanPullCard(game.current.canPullCard(playerInfo.id));
  }, [ hand, desk, turn ]);

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
    turn,
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
      if (mode === "ENCHANT_TARGET") {
        setMode('FREE_MOVE');
        resetAvailableDeskSlots();
        setEnchantCost(game.current.desk.map(() => 0));
      } else {
        setSelectedHandSlot(undefined);
        setSelectedDeskSlot(undefined);
        setMode("ENCHANT_TARGET");
        setEnchantCost(game.current.desk
          .map((c, id) => game.current.getEnchantManaCostFor(playerInfo.id, 0, id)));
        setAvailableDeskSlots(a => 
          a.map((v, slotId) => game.current.canUseEnchantOn(playerInfo.id, 0, slotId)));
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
      if (mode === 'ENCHANT_TARGET') {
        console.log("USE ENCHANT!");
        resetAvailableDeskSlots();
        this.useCard(0, slotId);
        setMode('FREE_MOVE');
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
          this.moveCardFromHandToDesk(selectedHandSlot, slotId);
          setSelectedHandSlot(undefined);
        } else if (selectedDeskSlot !== undefined) {
          this.moveCardFromDeskToDesk(selectedDeskSlot, slotId);
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
          this.moveCardFromDeskToHand(selectedDeskSlot, handSlot);
          setSelectedDeskSlot(undefined);
        } else if (selectedHandSlot !== undefined) {
          this.moveCardFromHandToHand(selectedHandSlot, handSlot);
          setSelectedHandSlot(undefined);
        }
        resetAvailableDeskSlots();
        this.hideManaCost();
      }
    }, [ hand, desk, selectedDeskSlot, selectedHandSlot ]),

    // CODE BELOWS CHANGES THE LOCAL GAME STATE

    moveCardFromHandToDesk: useCallback((handSlotId, deskSlotId) => {
      const valid = game.current.canMoveCardFromHandToDesk(playerInfo.id, handSlotId, deskSlotId);

      if (valid) {
        // Update our local game state
        game.current.moveCardFromHandToDesk(playerInfo.id, handSlotId, deskSlotId);

        // Update views
        setDesk([...game.current.desk]);
        setHand([...game.current.getPlayer(playerInfo.id).hand]);

        // Commit our changes to the game server
        connection.sendMoveCardFromHandToDesk(handSlotId, deskSlotId);
      }
    }, [ connection ]),

    moveCardFromDeskToDesk: useCallback((fromSlotId, toSlotId) => {
      const valid = game.current.canMoveCardFromDeskToDesk(playerInfo.id, fromSlotId, toSlotId);

      if (valid) {
        // Update our local game state
        game.current.moveCardFromDeskToDesk(playerInfo.id, fromSlotId, toSlotId);

        // Update views
        setDesk([...game.current.desk]);

        // Commit our changes to the game server
        connection.sendMoveCardFromDeskToDesk(fromSlotId, toSlotId);
      }
    }, [ connection ]),

    moveCardFromDeskToHand: useCallback((deskSlotId, handSlotId) => {
      const valid = game.current.canMoveCardFromDeskToHand(playerInfo.id, deskSlotId, handSlotId);

      if (valid) {
        // Update our local game state
        game.current.moveCardFromDeskToHand(playerInfo.id, deskSlotId, handSlotId);

        // Update views
        setHand([...game.current.getPlayer(playerInfo.id).hand]);
        setDesk([...game.current.desk]);

        // Commit our changes to the game server
        connection.sendMoveCardFromDeskToHand(deskSlotId, handSlotId);
      }
    }, [ connection ]),

    moveCardFromHandToHand: useCallback((fromSlotId, toSlotId) => {
      const valid = game.current.canMoveCardFromHandToHand(playerInfo.id, fromSlotId, toSlotId);

      if (valid) {
        // Update our local game state
        game.current.moveCardFromHandToHand(playerInfo.id, fromSlotId, toSlotId);

        // Update view of the hand
        setHand([...game.current.getPlayer(playerInfo.id).hand]);

        // Commit our changes to the game server
        connection.sendMoveCardFromHandToHand(fromSlotId, toSlotId);
      }
    }, [ connection ]),

    useCard: useCallback(function (slotId, targetSlotId) {
      const valid = game.current.canUseEnchantOn(playerInfo.id, slotId, targetSlotId);

      if (valid) {
        console.log('VALID USE');
        // Update our local game state
        game.current.useEnchant(playerInfo.id, slotId, targetSlotId);

        // Update view of desk cards and the player (because usage of the card costs mana)
        setDesk([ ...game.current.desk ]);
        setPlayer(game.current.getPlayer(playerInfo.id));

        // Commit changes to the server
        connection.sendUseCard(slotId, targetSlotId);
      }
    }, [ connection ]),
  };
}