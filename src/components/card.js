import "./card.css"

export default function Card({ card, selected, onClick }) {

  let cardPicture = undefined;
  if (card) {
    cardPicture = <div className='card-picture'>
      <i className={`bi-${card.icon}`}></i>
    </div>
  }

  return (
    <div className={`card ${ card ? '' : 'empty' } ${ selected ? 'selected' : '' }`} onClick={ onClick }>
      { cardPicture }
    </div>
  );
}