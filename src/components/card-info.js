import CardView from "./card-view";
import './card-info.css';

export default function CardInfo({ card, onClose }) {
  return (
    <div className='card-info'>
      <CardView card={card} />
      <div className='card-description'>{ card.description }</div>
      <div className='card-info-close'>
        <button className='close-button' onClick={ onClose }><i className="bi bi-x-circle"></i></button>
      </div>
    </div>
  )
}