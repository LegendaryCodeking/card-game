import PlayerAvatar from "./player-avatar"
import './player-status.css'

export default function PlayerStatus({ player }) {
  return (
  <div className='player-status-inner-container'>
    <div className='player-status'>
      <div className='player-status-circle'>{ player.pullSize }</div>
      <PlayerAvatar player={player} />
      <div className='player-status-circle'>{ player.health }</div>
    </div>
    <div className='player-status-name'>{ player.name }</div>
  </div>
  )
}