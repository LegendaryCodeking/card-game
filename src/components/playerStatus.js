import PlayerAvatar from "./playerAvatar"
import './playerStatus.css'

export default function PlayerStatus({ player }) {
  return (
  <div className='player-status'>
    <div className='player-status-cards'>{ player.cardsCount }</div>
    <PlayerAvatar player={player} />
    <div className='player-status-health'>{ player.health }</div>
  </div>
  )
}