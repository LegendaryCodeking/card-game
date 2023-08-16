import { useCallback, useRef } from "react";
import Player from "../../shared/player";
import "./home.css"

export default function HomePage({ player, setPlayer, connection, onFindGame }) {

  const playerNameInput = useRef(undefined);

  // TODO: Naming here is horrible

  const onFindGameRequest = useCallback(() => {
    // Check if the player is valid
    const playerName = playerNameInput.current.value;
    if (playerName.length > 0) {
      
      // Update our player data
      const updatedPlayer = new Player({ ...player, name: playerName });
      setPlayer(updatedPlayer);

      // Request server to find a game
      connection.sendFindGame(updatedPlayer);

      // Notify parent element about this
      onFindGame();
    }
  }, [ connection, player ])

  return (
    <div className="home-page-container">
      <div className='home-control-container'>
        <div>{ connection ? (<>Подключен к серверу</>) : (<>Не подключен</>)}</div>
        <input ref={ playerNameInput } placeholder="Имя игрока" />
        <button onClick={ onFindGameRequest }>Найти игру</button>
      </div>
    </div>
  );
}