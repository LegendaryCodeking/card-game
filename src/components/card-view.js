import { useCallback } from "react";
import "./card-view.css"

export default function CardView({ card, selected, enabled, onClick }) {

  let cardPicture = undefined;
  if (card) {
    cardPicture = (
      <div className='card-picture'>
        <i className={`bi-${card.icon}`}></i>
      </div>
    )
  }

  // Here we choose what kind of card it will be
  let cardEnabledClass = enabled ? 'card-enabled' : 'card-disabled';
  let cardEmptyClass = card ? 'card-displayed' : 'card-empty';
  let cardSelectedClass = enabled && selected ? 'card-selected' : '';

  const onCardClick = useCallback(() => {
    if (enabled) onClick();
  }, [ enabled, onClick ])

  return (
    <div className={`card ${ cardEnabledClass } ${ cardEmptyClass } ${ cardSelectedClass} `} onClick={ onCardClick }>
      { cardPicture }
    </div>
  );
}