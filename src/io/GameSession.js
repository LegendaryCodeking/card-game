import { useCallback, useEffect, useRef, useState } from "react";
import Game, { TurnState } from "../../core/Game";
import { PlayerInstance } from "../../core/Player";

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
  const [ enchants, setEnchants ] = useState([]);
  const [ desk, setDesk ] = useState([]);
  const [ actions, setActions ] = useState([]);
  const [ turn, setTurn ] = useState(new TurnState());

  // Selected hand and desk slots
  const [ selectedDeskSlot, setSelectedDeskSlot ] = useState(undefined);
  const [ selectedHandSlot, setSelectedHandSlot ] = useState(undefined);
  const [ canPullCard, setCanPullCard ] = useState(false);

  // Available card slots for desk
  const [ availableDeskSlots, setAvailableDeskSlots ] = useState([]);

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
      setEnchants(updatedGame.getPlayer(playerInfo.id).enchants
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
    availableDeskSlots,
    selectedDeskSlot,
    selectedHandSlot,
    canPullCard,

    completeTurn: useCallback(() => {
      connection.sendCompleteTurn();
    }, [ connection ]),

    pullCard: useCallback(() => {
      if (game.current.canPullCard(playerInfo.id)) {
        connection.sendPullCard();
      }
    }, [ connection ]),

    // TODO(vadim): Code for card selection should be refactored
    selectDeskSlot: useCallback(function (deskSlot) {
      if (deskSlot === selectedDeskSlot) {
        // Unselect the current card on the desk
        setSelectedDeskSlot(undefined);
        resetAvailableDeskSlots();

      } else if (desk[deskSlot]) {
        // If a certain card is selected
        setSelectedDeskSlot(deskSlot);
        setSelectedHandSlot(undefined);
        showAvailableDeskSlotsForDeskCard(deskSlot);

      } else {
        // Player moves card to the free card slot
        if (selectedHandSlot !== undefined) {
          this.moveCardFromHandToDesk(selectedHandSlot, deskSlot);
          setSelectedHandSlot(undefined);
        } else if (selectedDeskSlot !== undefined) {
          this.moveCardFromDeskToDesk(selectedDeskSlot, deskSlot);
          setSelectedDeskSlot(undefined);
        }
        resetAvailableDeskSlots();
      }
    }, [ hand, desk, selectedHandSlot, selectedDeskSlot ]),

    selectHandSlot: useCallback(function (handSlot) {
      if (handSlot === selectedHandSlot) {
        // Unselect the current card on the hand
        setSelectedHandSlot(undefined);
        resetAvailableDeskSlots();

      } else if (hand[handSlot]) {
        // Select a certain card
        setSelectedHandSlot(handSlot);
        setSelectedDeskSlot(undefined);
        showAvailableDeskSlotsForHandCard(handSlot);

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
      }
    }, [ hand, desk, selectedDeskSlot, selectedHandSlot ]),

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
      console.log('from desk to desk');

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
    }, [ connection ])
  };
}