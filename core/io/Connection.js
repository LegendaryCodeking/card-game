import { Events } from "../Events.js";

export default class Connection {

  listeners = new Map();

  constructor(socket) {
    this.socket = socket;

    // Define all event listeners for this connection 
    Events.getEventListenerNames().forEach(([methodName, event]) => {
      this[methodName] = (callback) => this.listeners.set(Events[event], callback);
    });
  }

  onOpen(callback) {
    this.onOpenListener = callback;
  }

  onClose(callback) {
    this.onCloseListener = callback;
  }

  onError(callback) {
    this.onErrorListener = callback;
  }

  clearListeners() {
    this.listeners.clear();
  }

  close() {
    this.socket.close();
  }

  send(object) {
    this.socket.send(JSON.stringify(object));
  }

}