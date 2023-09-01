import { useCallback, useEffect, useRef, useState } from "react";
import Game from "../../core/Game";
import { PlayerInstance } from "../../core/Player";

/**
 * Connects to the specific game by gameId using the existing connection
 * to the game server. Accepts list of callbacks which are called on appropriate
 * events.
 */
export function useGameSession(connection, playerInfo, gameId, callbacks) {

  const game = useRef(new Game());

  const [ player, setPlayer ] = useState(new PlayerInstance());
  const [ opponent, setOpponent ] = useState(new PlayerInstance());
  const [ hand, setHand ] = useState([]);
  const [ desk, setDesk ] = useState([]);
  const [ actions, setActions ] = useState([]);

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
    }

    if (updatedGame.actions !== currentGame.actions) {
      setActions(updatedGame.actions);
    }

    game.current = updatedGame;
  }

  useEffect(() => {
    connection.sendJoinGame(gameId, playerInfo);

    connection.onFullUpdate(response => {
      console.log("SC -> Full update")
      if (callbacks.onFullUpdate)
        callbacks.onFullUpdate(response);
      updateGame(response);
    });

    connection.onPartialUpdate(response => {
      console.log("SC -> Partial update");
      if (callbacks.onPartialUpdate)
        callbacks.onPartialUpdate(response);
      updateGame(response);
    });

    connection.onError(response => {
      console.error(`SC -> ERROR: ${ response.data }`);
      callbacks.onError(response);
    });
  }, [ connection ]);

  return {
    game: game.current,
    player,
    opponent,
    hand,
    desk,
    actions,

    completeTurn: useCallback(() => {
      connection.sendCompleteTurn();
    }, [ connection ]),

    pullCard: useCallback(() => {
      connection.sendPullCard();
    }, [ connection ]),

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
    }, [ connection ])
  };
}