import { useCallback, useEffect } from "react";

/**
 * Connects to the specific game by gameId using the existing connection
 * to the game server. Accepts list of callbacks which are called on appropriate
 * events.
 */
export function useGameSession(connection, player, gameId, callbacks) {

  useEffect(() => {
    connection.sendJoinGame(gameId, player);

    connection.onFullUpdate(response => {
      console.log("SC -> Full update")
      callbacks.onFullUpdate(response);
    });

    connection.onPartialUpdate(response => {
      console.log("SC -> Partial update");
      callbacks.onPartialUpdate(response);
    });

    connection.onError(response => {
      console.error(`SC -> ERROR: ${ response.data }`);
      callbacks.onError(response);
    });
  }, [ connection ]);

  return {
    completeTurn: useCallback(() => {
      connection.sendCompleteTurn();
    }, [ connection ]),

    pullCard: useCallback(() => {
      connection.sendPullCard();
    }, [ connection ]),

    moveCardFromHandToDesk: useCallback((handSlotId, deskSlotId) => {
      connection.sendMoveCardFromHandToDesk(handSlotId, deskSlotId);
    }, [ connection ]),

    moveCardFromDeskToDesk: useCallback((fromSlotId, toSlotId) => {
      connection.sendMoveCardFromDeskToDesk(fromSlotId, toSlotId);
    }, [ connection ]),

    moveCardFromDeskToHand: useCallback((deskSlotId, handSlotId) => {
      connection.sendMoveCardFromDeskToHand(deskSlotId, handSlotId);
    }, [ connection ]),

    moveCardFromHandToHand: useCallback((fromSlotId, toSlotId) => {
      connection.sendMoveCardFromHandToHand(fromSlotId, toSlotId);
    }, [ connection ])
  };
}