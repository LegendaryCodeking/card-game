import { Events } from "../../../shared/Events.js";
import { Error } from "../../../shared/error.js";
import Connection from "../../../shared/io/Connection.js";

export default class ClientConnection extends Connection {

  player = undefined;
  game = undefined;

  constructor(socket) {
    super(socket);

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
      if (this.onCloseListener)
        this.onCloseListener()
    });

    socket.on('error', () => {
      console.log(`CC -> Error from ${ this.player?.name }`);
      if (this.onErrorListener)
        this.onErrorListener();
    })

    socket.on('open', () => {
      if (this.onOpenListener)
        this.onOpenListener();
    });
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

  onEvent(callback) {
    this.onEvent = callback;
  }

}