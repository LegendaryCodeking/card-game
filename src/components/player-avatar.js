import './player-avatar.css';

export default function PlayerAvatar({ player }) {
  return (
    <div className='player-avatar'>
      <div className='player-name'>{ player.name }</div>
    </div>
  );
}