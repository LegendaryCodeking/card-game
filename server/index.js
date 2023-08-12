import { WebSocketServer } from "ws";
import Game, { GameState } from "../shared/game.js";
import ClientConnection from "./client-connection.js";
import { Error } from "../shared/error.js";

const server = new WebSocketServer({ port: 8080 });

console.log("Server has started");

// All games that are currently going on
const games = new Map();
games.set(0, new Game());

// All players connections
const connections = new Map();

function getPlayerConnection(player) {
  return connections.get(player.id);
}

function getPlayersConnections(players) {
  return players.map(p => connections.get(p.id));
}

server.on('connection', socket => {
  socket.on('error', console.log);

  const connection = new ClientConnection(socket);
  connection.onJoin(request => {
    // Player wants to join a new game
    const game = games.get(request.gameId);

    if (!game) {
      connection.sendError(Error.GAME_IS_NOT_FOUND);
      return;
    }

    if (!game.state === GameState.WAITING_FOR_PLAYERS) {
      connection.sendError(Error.GAME_IS_FULL);
      return;
    }

    let player = game.getPlayer(request.player.id);
    if (player) {
      // Reconnect the existing one
      console.log(`-> '${ request.player.name }' re-joins the game `);
    } else {
      // Add a new player
      console.log(`-> '${ request.player.name }' joins the game `);
      player = game.addPlayer(request.player);
    }

    // Close previous connection
    if (connections.has(request.player.id)) {
      connections.get(request.player.id).close();
      connections.delete(request.player.id);
    }

    // Set new connection for this player
    connections.set(request.player.id, connection);

    // Need to remember which player and which game
    connection.playerId = request.player.id;
    connection.game = game;

    // Send the entire state of the game
    connection.sendFullUpdate(game);
  });

  // TODO: In listeners below we should verify if it possible for the player to do so

  connection.onMoveCardFromHandToDesk((handSlotId, deskSlotId) => {
    const game = connection.game;
    const player = game.getPlayer(connection.playerId);

    // Move the card
    const cardRef = player.hand[handSlotId];
    player.hand = player.hand.map((ref, id) => id === handSlotId ? undefined : ref)
    game.desk = game.desk.map((ref, id) => id === deskSlotId ? cardRef : ref);

    // Send update of the desk to everyone except for the player itself
    getPlayersConnections(game.players.filter(p => p.id !== player.id))
      .forEach(con => con.sendPartialUpdate(game, ['desk']));
  });

  connection.onMoveCardFromDeskToHand((deskSlotId, handSlotId) => {
    const game = connection.game;
    const player = game.getPlayer(connection.playerId);

    // Move the card
    const cardRef = game.desk[deskSlotId];
    game.desk = game.desk.map((ref, id) => id === deskSlotId ? undefined : ref);
    player.hand = player.hand.map((ref, id) => id === handSlotId ? cardRef : ref);

    // Send update of the desk to everyone except the player itself
    getPlayersConnections(game.players.filter(p => p.id !== player.id))
      .forEach(con => con.sendPartialUpdate(game, ['desk']));
  });

  connection.onMoveCardFromDeskToDesk((fromSlotId, toSlotId) => {
    const game = connection.game;
    const player = game.getPlayer(connection.playerId);
    
    // Move the card
    const cardRef = game.desk[fromSlotId];
    game.desk = game.desk
      .map((ref, id) => id === fromSlotId ? undefined : ref)
      .map((ref, id) => id === toSlotId ? cardRef : ref)

    // Send update of the desk to everyone except the player itself
    getPlayersConnections(game.players.filter(p => p.id !== player.id))
      .forEach(con => con.sendPartialUpdate(game, ['desk']));
  }); 

  connection.onMoveCardFromHandToHand((fromSlotId, toSlotId) => {
    const game = connection.game;
    const player = game.getPlayer(connection.playerId);

    // Move the card
    const cardRef = player.hand[fromSlotId];
    player.hand = player.hand
      .map((ref, id) => id === fromSlotId ? undefined : ref)
      .map((ref, id) => id === toSlotId ? cardRef : ref);

    // no need to send any updates because hands are not visible to other players
    // and the player itself knows what's going on with its hand
  });

})