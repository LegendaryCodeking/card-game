import { Events } from "../../shared/events";

export default class ServerConnection {

  constructor(socket) {
    this.socket = socket;

    socket.addEventListener('message', event => {
      const response = JSON.parse(event.data.toString());
      // TODO: We probably need only one type of UPDATE
      // the client can determine itself if the update should be full or partial
      // depending on the data
      if (response.event === Events.FULL_UPDATE) this.onFullUpdateCallback(response);
      else if (response.event === Events.PARTIAL_UPDATE) this.onPartialUpdateCallback(response);
      else if (response.event === Events.ERROR) this.onErrorCallback(response);
      else console.error(`Unknown type of the event: ${ response.event }`);
    })
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

  /**
   * Tries to join the game
   */
  join(gameId, player) {
    this.send({
      event: Events.JOIN_GAME,
      gameId: gameId,
      player: player
    });
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

  onError(callback) {
    this.onErrorCallback = callback;
  }

  onFullUpdate(callback) {
    this.onFullUpdateCallback = callback;
  }

  onPartialUpdate(callback) {
    this.onPartialUpdateCallback = callback;
  }

  close() {
    console.log("SC -> Closing connection")
    this.socket.close();
  }

  send(object) {
    this.socket.send(JSON.stringify(object));
  }

}