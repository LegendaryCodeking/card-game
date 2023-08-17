
export default function PlayerHealthView({ player }) {
  return (
    <div className='player-health-bar'>
      <div><i class="bi bi-heart-fill"></i></div>
      <div>{ player.health }</div>
    </div>
  );
}