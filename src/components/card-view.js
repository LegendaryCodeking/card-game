import { useCallback } from "react";
import "./card-view.css"

export default function CardView({ card, selected, enabled, highlighted, onClick }) {

  let cardPicture = undefined;
  if (card) {
    cardPicture = (
      <div className='card-picture'>
        <i className={`bi-${card.icon}`}></i>
      </div>
    )
  }

  // Here we choose what kind of card it will be
  const cardEnabledClass = enabled ? 'card-enabled' : 'card-disabled';
  const cardEmptyClass = card ? 'card-displayed' : 'card-empty';
  const cardSelectedClass = !highlighted && enabled && selected ? 'card-selected' : '';
  const cardHighlightedClass = highlighted ? 'card-highlighted' : '';

  const onCardClick = useCallback(() => {
    if (enabled) onClick();
  }, [ enabled, onClick ])

  return (
    <div className={`card ${ cardEnabledClass } ${ cardEmptyClass } ${ cardSelectedClass} ${ cardHighlightedClass } `} onClick={ onCardClick }>
      { cardPicture }
    </div>
  );
}