import './playerAvatar.css';

export default function PlayerAvatar({ player }) {
  return <div className='player-avatar'>
    <i className={`bi-${player.icon}`}></i>
  </div>
}