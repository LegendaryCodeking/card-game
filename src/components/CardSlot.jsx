import { useCallback } from "react";
import style from "./CardSlot.module.css";
import Icon from "./Icon";
import { CardType } from "../../core/Cards";

export default function CardSlot({ cardInstance, selected, enabled, highlighted, onClick, onInfo }) {
  const card = cardInstance?.getCard();

  const cardSlotEnabled = enabled ? style.CardSlotEnabled : style.CardSlotDisabled;
  const cardSelected = !highlighted && enabled && selected ? style.CardSelected : '';
  const cardHighlighted = highlighted ? style.CardHighlighted : '';
  const cardEnchant = card?.type === CardType.ENCHANT ? style.Enchant : '';

  const onCardClick = useCallback(() => {
    if (enabled) onClick();
  }, [ enabled, onClick ])

  let cost = undefined;
  if (card && card.getManaCost) {
    cost = (
      <div className={`${ style.Cost }`}>
        { card.getManaCost() ?? "?" } <Icon icon='hexagon-fill'/>
      </div>
    )
  }

  let innerCard = undefined;
  if (card) {
    innerCard = (
      <div className={`${ style.Card } ${ cardSelected } ${ cardHighlighted } ${ cardEnchant }`}>

        <div className={`${ style.TopOverlay }`}>
          <button className={ style.InfoButton } onClick={ onInfo }>
            <Icon icon="question-circle" />
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