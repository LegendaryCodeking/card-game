import CardSlot from "./CardSlot";
import './CardInfo.css';

// TODO(vadim): Use CSS modules
export default function CardInfo({ card, onClose }) {
  return (
    <div className='card-info'>
      <CardSlot card={card} />
      <div className='card-description'>{ card.description }</div>
      <div className='card-info-close'>
        <button className='close-button' onClick={ onClose }><i className="bi bi-x-circle"></i></button>
      </div>
    </div>
  )
}