import { Events } from "../../shared/events.js";
import { Error } from "../../shared/error.js";

export default class ClientConnection {

  listeners = new Map();

  player = undefined;
  game = undefined;

  constructor(socket) {
    this.socket = socket;

    // Add listeners setters for all type of events
    Events.getEventListenerNames().forEach(([listenerName, event]) => {
      this[listenerName] = (callback) => this.listeners.set(Events[event], callback);
    });

    // Set listener for all incoming messages
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

    // Define behavour on close
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

  onClose(callback) {
    this.onClose = callback;
  } 

  onEvent(callback) {
    this.onEvent = callback;
  }

  send(object) {
    this.socket.send(JSON.stringify(object));
  }

}