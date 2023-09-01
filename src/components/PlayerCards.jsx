import './PlayerCards.css'

export default function PlayerCards({ player }) {
  return (
    <div className='player-cards-bar'>
      <div><i className="bi bi-collection-fill"></i></div>
      <div>{ player.pullSize }</div>
    </div>
  );
}