import { useState } from "react"
import GamePage from "./Game"
import HomePage from "./Home"
import Player from "../../core/Player";
import { useServerConnection } from "../io/ServerConnection";
import { v4 } from "uuid";

export default function App() {
  const [ player, setPlayer ] = useState(new Player({ id: v4() }));
  const [ gameId, setGameId ] = useState(undefined);

  const connection = useServerConnection({ 
    onGameIsFound: response => setGameId(response.data.gameId),
    onError: () => setGameId(undefined),
    onClose: () => setGameId(undefined)
  });

  const homePage = (
    <HomePage 
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