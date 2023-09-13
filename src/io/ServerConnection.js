import { useCallback, useEffect, useState } from "react";
import { Events } from "../../core/Events";
import Connection from "../../core/io/Connection";

export default class ServerConnection extends Connection {

  constructor(socket) {
    super(socket);

    // Call appropriate event listener on incoming message from the server
    socket.addEventListener('message', event => {
      const response = JSON.parse(event.data.toString());
      const listener = this.listeners.get(response.event);
      if (listener) {
        listener(response);
      } else {
        console.error(`Unknown type of the event: ${ response.event }`);
      }
    });

    socket.addEventListener('error', event => { 
      if (this.onErrorListener)
        this.onErrorListener(event) 
    });

    socket.addEventListener('close', event => { 
      if (this.onCloseListener)
        this.onCloseListener(event) 
    });
    
    socket.addEventListener('open', event => {
      if (this.onOpenListener)
        this.onOpenListener(event);
    });
  }

  static connect() {
    const promise = new Promise((resolve, reject) => {
      const socket = new WebSocket(`ws://${ import.meta.env.VITE_MAIN_GAME_SERVER_ADDRESS}:8080`);
      socket.addEventListener('open', event => {
        console.log("SC -> Connected to the game server");
        resolve(new ServerConnection(socket));
      });
      socket.addEventListener('error', reject);
    });

    return promise;
  }

  sendMoveCardFromHandToDesk(handSlotId, deskSlotId) {
    this.send({
      event: Events.MOVE_CARD_FROM_HAND_TO_DESK,
      handSlotId,
      deskSlotId
    });
  }

  sendMoveCardFromDeskToHand(deskSlotId, handSlotId) {
    this.send({
      event: Events.MOVE_CARD_FROM_DESK_TO_HAND,
      handSlotId,
      deskSlotId
    });
  }

  sendMoveCardFromDeskToDesk(fromSlotId, toSlotId) {
    this.send({
      event: Events.MOVE_CARD_FROM_DESK_TO_DESK,
      fromSlotId,
      toSlotId
    });
  }

  sendMoveCardFromHandToHand(fromSlotId, toSlotId) {
    this.send({
      event: Events.MOVE_CARD_FROM_HAND_TO_HAND,
      fromSlotId,
      toSlotId
    });
  }

  sendUseCard(slotId, targetSlotId) {
    this.send({
      event: Events.USE_CARD,
      slotId, 
      targetSlotId
    });
  }

  sendCompleteTurn() {
    this.send({
      event: Events.COMPLETE_TURN,
    });
  }

  sendFindGame(player) {
    this.send({
      event: Events.FIND_GAME,
      player 
    })
  }

  sendJoinGame(gameId, player) {
    this.send({
      event: Events.JOIN_GAME,
      gameId,
      player
    });
  }

  sendPullCard() {
    this.send({
      event: Events.PULL_CARD,
    })
  }

}

/**
 * Will establish a connection with the game server. Accepts
 * callback that will be called on certain events.

 * @returns connection with the game server. Will be undefined
 * if it is not connected.
 */
export function useServerConnection(callbacks) {
  const [ connection, setConnection ] = useState();

  useEffect(() => {

    function connect() {
      ServerConnection.connect().then(serverConnection => {
        setConnection(serverConnection);
      
        serverConnection.onGameIsFound(callbacks.onGameIsFound)
        serverConnection.onOpen(callbacks.onOpen);

        serverConnection.onError(event => {
          console.error(event);
          console.error(`SC -> Connection failed. Retrying in 1 second.`);
          setTimeout(() => connect(), 1000);
          callbacks.onError(event);
        });

        serverConnection.onClose(event => {
          console.error(event);
          console.log("SC -> Connection was closed. Reconnecting in 1 second.");
          setConnection(undefined);
          setTimeout(() => connect(), 1000);
          callbacks.onClose(event);
        });

      }).catch(event => {
        console.error(event);
        console.error("SC -> Connection failed. Retrying in 1 second.");
        setTimeout(() => connect(), 1000);
      });
    }
    connect();

    return () => connection?.close();
  }, []);

  return connection;
}
