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
      const updatedPlayer = new Player({ ...player, id: playerName, name: playerName });
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
        <div className='server-status'>{ connection ? 
          (<><i class="bi bi-cloud-check"></i><div>Подключен к серверу</div></>) : 
          (<><i class="bi bi-x-circle"></i><div>Нет подключения</div></>)}</div>
        <input className='player-name-input' ref={ playerNameInput } placeholder="Имя игрока" />
        <button className='find-game-button' onClick={ onFindGameRequest }>Найти игру</button>
      </div>
    </div>
  );
}