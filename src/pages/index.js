import { useCallback, useState, useEffect } from "react"
import GamePage from "../components/game"
import HomePage from "../components/home"
import Player from "../../shared/player";
import ServerConnection from "@/io/server-connection";
import { v4 } from "uuid";

export default function Index() {

  const [ player, setPlayer ] = useState(new Player({ id: v4() }));
  const [ connection, setConnection ] = useState(undefined);
  const [ gameId, setGameId ] = useState(undefined);

  useEffect(() => {

    // Connect to the game server
    ServerConnection.connect().then(connection => {
      setConnection(connection);
      // When the game server has found a game for us, we should join it
      connection.onGameIsFound(response => {
        setGameId(response.data.gameId);
      });
    });

    return () => connection?.close();
  }, []);

  const onFindGame = useCallback(() => {
    console.log("Waiting for connection to the server")
  }, [ connection ]);

  const homePage = (
    <HomePage 
      onFindGame={ onFindGame } 
      connection={ connection } 
      player={ player }
      setPlayer={ setPlayer } />
  );

  const gamePage = (
    <GamePage 
      gameId={ gameId }
      connection={ connection }
      player={ player }
      setPlayer={ setPlayer }
    />
  )

  if (gameId) return gamePage;
  return homePage;
}