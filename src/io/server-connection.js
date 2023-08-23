import { Events } from "../../shared/events";

export default class ServerConnection {

  listeners = new Map();

  constructor(socket) {
    this.socket = socket;

    // Define all event listeners for this connection 
    Events.getEventListenerNames().forEach(([listenerName, event]) => {
      this[listenerName] = (callback) => this.listeners.set(Events[event], callback);
    });

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

  }

  static connect() {
    const promise = new Promise((resolve, reject) => {
      const socket = new WebSocket("ws://localhost:8080");
      socket.addEventListener('open', event => {
        console.log("SC -> Connected to the game server");
        resolve(new ServerConnection(socket));
      });

      socket.addEventListener('error', event => {
        console.error("SC -> An error occuried")
        console.error(event);
      })
    });

    return promise;
  }

  moveCardFromHandToDesk(handSlotId, deskSlotId) {
    this.send({
      event: Events.MOVE_CARD_FROM_HAND_TO_DESK,
      handSlotId,
      deskSlotId
    });
  }

  moveCardFromDeskToHand(deskSlotId, handSlotId) {
    this.send({
      event: Events.MOVE_CARD_FROM_DESK_TO_HAND,
      handSlotId,
      deskSlotId
    });
  }

  moveCardFromDeskToDesk(fromSlotId, toSlotId) {
    this.send({
      event: Events.MOVE_CARD_FROM_DESK_TO_DESK,
      fromSlotId,
      toSlotId
    });
  }

  moveCardFromHandToHand(fromSlotId, toSlotId) {
    this.send({
      event: Events.MOVE_CARD_FROM_HAND_TO_HAND,
      fromSlotId,
      toSlotId
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

  onError(callback) {
    this.listeners.set(Events.ERROR, callback);
  }

  close() {
    console.log("SC -> Closing connection")
    this.socket.close();
  }

  clearListeners() {
    this.listeners.clear();
  }

  send(object) {
    this.socket.send(JSON.stringify(object));
  }

}