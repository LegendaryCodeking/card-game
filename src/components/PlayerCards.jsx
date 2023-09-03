import './PlayerCards.css'

// TODO(vadim): Use CSS modules
export default function PlayerCards({ player }) {
  return (
    <div className='player-cards-bar'>
      <div><i className="bi bi-collection-fill"></i></div>
      <div>{ player.pullSize }</div>
    </div>
  );
}