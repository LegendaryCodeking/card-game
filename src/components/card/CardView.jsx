import { useCallback } from "react";
import style from "./CardView.module.css";

export default function CardView({ card, selected, enabled, highlighted, onClick, onInfo }) {

  const cardSlotEnabled = enabled ? style.CardSlotEnabled : style.CardSlotDisabled;
  const cardSelected = !highlighted && enabled && selected ? style.CardSelected : '';
  const cardHighlighted = highlighted ? style.CardHighlighted : '';

  const onCardClick = useCallback(() => {
    if (enabled) onClick();
  }, [ enabled, onClick ])

  let innerCard = undefined;
  if (card) {
    innerCard = (
      <div className={`${ style.Card } ${ cardSelected } ${ cardHighlighted }`}>
        <button className={ style.InfoButton } onClick={ onInfo }>
          <i className="bi bi-info-circle"></i>
        </button>
        <div className={ style.Picture }>
          <i className={`bi-${card.icon}`}></i>
        </div>
        <div className={ style.Title }>{ card.name }</div>
      </div>
    )
  }

  return (
    <div 
      className={`${ style.CardSlot } ${ cardSlotEnabled }`} 
      onClick={ onCardClick } >
      { innerCard }
    </div>
  );
}