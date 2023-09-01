import { WebSocketServer } from "ws";
import Game, { GameState } from "../../core/Game.js";
import ClientConnection from "./io/ClientConnection.js";
import { Errors } from "../../core/Errors.js";
import { v4 as uuid } from "uuid";

const server = new WebSocketServer({ port: 8080 });

// GameId <-> Game
const games = new Map();

// PlayerId <-> Connection
const connections = new Map();

function closePlayerConnection(playerId) {
  if (connections.has(playerId)) {
    connections.get(playerId).close();
    connections.delete(playerId);
  }
}

function addPlayerConnection(playerId, connection) {
  closePlayerConnection(playerId);
  connections.set(playerId, connection);
}

function getPlayersConnections(playersIds) {
  return playersIds 
    .filter(id => id !== undefined)
    .map(id => connections.get(id))
    .filter(con => con !== undefined);
}

server.on('connection', socket => {
  socket.on('error', console.log);

  const connection = new ClientConnection(socket);

  connection.onClose(() => {
    if (connection.player === undefined) return;
    closePlayerConnection(connection.player.id);
  });

  /**
   * Event handler needs to get player information
   */
  connection.onPlayerRequest(async (request) => {
    // TODO(vadim): read player info from database
    // return db.get(request.playerId);
    // throw if player is not found
    return request.player;
  })

  /**
   * Player asks the game server to find available game
   */
  connection.onFindGame((request, player) => {
    addPlayerConnection(player.id, connection);

    // Find available game for this player
    // TODO(vadim): O(N)! Should be O(1)
    // TODO(vadim): Verify that player is not in some other game
    // TODO(vadim): We should prioritize the oldest available game
    let availableGame = undefined;
    for (const [id, game] of games) {
      if (game.players.length < 2) availableGame = game;
    }

    if (availableGame) {
      if (!availableGame.hasPlayer(player.id)) { 
        availableGame.addPlayer(player.id, {});
      }
    } else {
      console.log("MN -> Creating new game")
      availableGame = new Game({ id: uuid() });
      availableGame.addPlayer(player.id, {});
      games.set(availableGame.id, availableGame);
    }
    connection.sendGameIsFound({ gameId: availableGame.id });
  });
  
  /**
   * Player joins the existing game using gameId.
   */
  connection.onJoinGame((request, player) => {

    // Player wants to join a new game
    const game = games.get(request.gameId);
    connection.game = game;

    if (!game) {
      connection.sendError(Errors.GAME_IS_NOT_FOUND);
      return;
    }

    if (!game.hasPlayer(player.id)) {
      game.addPlayer(player.id, {});
    }
    console.log(`MN -> ${ player.name } joins the game`);

    // Send the entire state of the game
    connection.sendFullUpdate(game);

    getPlayersConnections([ game.getOpponent(player.id)?.id ])
      .forEach(con => con.sendPartialUpdate(game, ['players', 'state', 'turn']));
  });

  /**
   * When event handling is completed by other event listeners,
   * we call this function to make sure that game will proceed to the next state.
   */
  connection.onEventCompleted(() => {
    if (!connection.game) return;
    const game = connection.game;

    function scheduleNewTurn() {
      if (game.state === GameState.EXECUTION_TURN) {
        const actions = [];
        game.performExecutionTurn(actions);
        game.actions = actions;
        getPlayersConnections(game.players.map(p => p.id))
          .forEach(con => con.sendPartialUpdate(game, ['actions', 'players', 'desk', 'turn', 'state']));

        setTimeout(() => scheduleNewTurn(), 3000);
      } else {
        game.executionInProcess = false;
      }
    }

    if (game.state === GameState.EXECUTION_TURN && !game.executionInProgress) {
      game.executionInProgress = true;
      setTimeout(() => scheduleNewTurn(), 3000);
    }
  })

  connection.onPullCard((request, player, game) => {
    game.pullCard(player.id);

    connection.sendPartialUpdate(game, [ 'players' ]);
  });

  connection.onCompleteTurn((request, player, game) => {
    game.nextTurn();

    getPlayersConnections(game.players.map(p => p.id))
      .forEach(con => con.sendPartialUpdate(game, [ 'state', 'turn']))
  });

  connection.onMoveCardFromHandToDesk((request, player, game) => {
    game.moveCardFromHandToDesk(player.id, request.handSlotId, request.deskSlotId);

    getPlayersConnections([ game.getOpponent(player.id)?.id ])
      .forEach(con => con.sendPartialUpdate(game, ['desk']));
  });

  connection.onMoveCardFromDeskToHand((request, player, game)=> {
    game.moveCardFromDeskToHand(player.id, request.deskSlotId, request.handSlotId);

    getPlayersConnections([ game.getOpponent(player.id)?.id ])
      .forEach(con => con.sendPartialUpdate(game, ['desk']));
  });

  connection.onMoveCardFromDeskToDesk((request, player, game) => {
    game.moveCardFromDeskToDesk(player.id, request.fromSlotId, request.toSlotId);

    getPlayersConnections([ game.getOpponent(player.id)?.id ])
      .forEach(con => con.sendPartialUpdate(game, ['desk']));
  }); 

  connection.onMoveCardFromHandToHand((request, player, game) => {
    game.moveCardFromHandToHand(player.id, request.fromSlotId, request.toSlotId);
  });

})