import CardSlot from "../CardSlot";
import style from './CardInfoOverlay.module.css';

export default function CardInfoOverlay({ card, onClose }) {
  return (
    <div className={`${ style.CardInfoOverlay }`}>
      <CardSlot card={card} />
      <div className={`${ style.CardInfoDescription }`}>{ card.description }</div>
      <div className={`${ style.CardInfoClose }`}>
        <button className={`${ style.CloseButton }`} onClick={ onClose }><i className="bi bi-x-circle"></i></button>
      </div>
    </div>
  )
}