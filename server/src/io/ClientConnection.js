import { Events } from "../../../core/Events.js";
import { Errors } from "../../../core/Errors.js";
import Connection from "../../../core/io/Connection.js";

export default class ClientConnection extends Connection {

  player = undefined;
  game = undefined;

  constructor(socket) {
    super(socket);

    socket.on('message', data => {
      this.handleIncomingEvent(data)
        .catch(console.error);
    });

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

  async handleIncomingEvent(data) {
    // Parse the event
    const request = JSON.parse(data.toString());

    // Find appropriate event listener to call
    const listener = this.listeners.get(request.event);
    if (listener) {
      console.log(`CC -> Event from ${ this.player?.name }: ${ request.event }`)

      // ClientConnection should have the information about the player
      // that has this connection. So we can handle game events from this player.
      if (!this.player) {
        // getPlayer(request) will be set by the server to correctly
        // get player information from the DB (using playerId from the request)
        if (this.getPlayer) this.player = await this.getPlayer(request);
      }

      // Only after we got all required context, we can handle the event
      listener(request, this.player, this.game);
    } else {
      console.error(`CC -> Unknown event ${ request.event } from ${ this.player?.name }`)
      this.sendError(Errors.UNKNOWN_EVENT);
    }

    this.onEventCompletedListener(request, this.player, this.game);
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

  onPlayerRequest(callback) {
    this.getPlayer = callback;
  }

  onEventCompleted(callback) {
    this.onEventCompletedListener = callback;
  }

}