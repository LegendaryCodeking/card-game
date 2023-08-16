import { Events } from "../../shared/events.js";
import { Error } from "../../shared/error.js";

export default class ClientConnection {

  listeners = new Map();

  player = undefined;
  game = undefined;

  constructor(socket) {
    this.socket = socket;

    socket.on('message', data => {
      const request = JSON.parse(data.toString());
      this.onEvent(request);

      const listener = this.listeners.get(request.event);

      if (listener) {
        console.log(`CC -> Event from ${ this.player?.name }: ${ request.event }`)
        listener(request);
      } else {
        console.error(`CC -> Unknown event ${ request.event } from ${ this.player?.name }`)
        this.sendError(Error.UNKNOWN_EVENT);
      }
    });

    socket.on('close', () => {
      console.log(`CC -> Close connection for ${ this.player?.name }`)
      this.onClose()
    });
  }

  close() {
    this.socket.close();
  }

  sendPartialUpdate(game, properties) {
    let data = {};
    for (let p of properties) {
      data[p] = game[p];
    }

    this.send({
      event: Events.PARTIAL_UPDATE,
      data
    });
  }

  sendFullUpdate(game) {
    this.send({
      event: Events.FULL_UPDATE,
      data: game
    });
  }

  sendGameIsFound(data) {
    this.send({
      event: Events.GAME_IS_FOUND,
      data
    });
  }

  sendError(error) {
    this.send({
      event: Events.ERROR,
      data: error
    });
  }

  onJoin(callback) {
    this.listeners.set(Events.JOIN_GAME, callback);
  }

  onFindGame(callback) {
    this.listeners.set(Events.FIND_GAME, callback);
  }

  onMoveCardFromHandToDesk(callback) {
    this.listeners.set(Events.MOVE_CARD_FROM_HAND_TO_DESK, (request) => {
      callback(request.handSlotId, request.deskSlotId);
    });
  }

  onMoveCardFromDeskToHand(callback) {
    this.listeners.set(Events.MOVE_CARD_FROM_DESK_TO_HAND, (request) => {
      callback(request.deskSlotId, request.handSlotId);
    });
  }

  onMoveCardFromDeskToDesk(callback) {
    this.listeners.set(Events.MOVE_CARD_FROM_DESK_TO_DESK, (request) => {
      callback(request.fromSlotId, request.toSlotId);
    });
  }

  onMoveCardFromHandToHand(callback) {
    this.listeners.set(Events.MOVE_CARD_FROM_HAND_TO_HAND, (request) => {
      callback(request.fromSlotId, request.toSlotId);
    });
  }

  onClose(callback) {
    this.onClose = callback;
  } 

  onCompleteTurn(callback) {
    this.listeners.set(Events.COMPLETE_TURN, () => callback());
  }

  onEvent(callback) {
    this.onEvent = callback;
  }

  send(object) {
    this.socket.send(JSON.stringify(object));
  }

}