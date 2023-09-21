import { useCallback } from "react";
import style from "./CardSlot.module.css";
import Icon from "./Icon";

export default function CardSlot({ card, selected, enabled, highlighted, onClick, onInfo }) {
  const cardSlotEnabled = enabled ? style.CardSlotEnabled : style.CardSlotDisabled;
  const cardSelected = !highlighted && enabled && selected ? style.CardSelected : '';
  const cardHighlighted = highlighted ? style.CardHighlighted : '';

  const onCardClick = useCallback(() => {
    if (enabled) onClick();
  }, [ enabled, onClick ])

  let cost = undefined;
  if (card && card.getManaCost) {
    cost = (
      <div className={`${ style.Cost }`}>
        { card.getManaCost() } <Icon icon='hexagon-fill'/>
      </div>
    )
  }

  let innerCard = undefined;
  if (card) {
    innerCard = (
      <div className={`${ style.Card } ${ cardSelected } ${ cardHighlighted }`}>

        <div className={`${ style.TopOverlay }`}>
          <button className={ style.InfoButton } onClick={ onInfo }>
            <Icon icon="info-circle" />
          </button>
          { cost }
        </div>

        <div className={ style.Picture }>
          <Icon icon={ card.icon }/>
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