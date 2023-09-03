import { useCallback, useRef } from "react";
import Player from "../../core/Player";
import "./Home.css"
// TODO(vadim): Use CSS modules

export default function HomePage({ player, setPlayer, connection }) {

  const playerNameInput = useRef(undefined);

  const onFindGameRequest = useCallback(() => {
    // Check if the player is valid
    const playerName = playerNameInput.current.value;
    if (playerName.length > 0) {
      
      // Update our player data
      const updatedPlayer = new Player({ ...player, id: playerName, name: playerName });
      setPlayer(updatedPlayer);

      // Request server to find a game
      connection.sendFindGame(updatedPlayer);
    }
  }, [ connection, player ])

  return (
    <div className="home-page">

      <div className='main-menu'>
        <div className='server-status'>{ connection ? 
          (<><i className="bi bi-cloud-check"></i><div>Подключен к серверу</div></>) : 
          (<><i className="bi bi-x-circle"></i><div>Нет подключения</div></>)}</div>
        <input className='player-name-input' ref={ playerNameInput } placeholder="Имя игрока" />
        <button className='find-game-button' onClick={ onFindGameRequest }>Найти игру</button>
      </div>

    </div>
  );
}