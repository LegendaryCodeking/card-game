import style from "./DeskSlot.module.css";
import Mana from "./Mana";

export default function DeskSlot({ children, owner, enchantCost = 0 }) {

  const ownerBadge = owner ? (
    <div className={`${ style.Owner } ${ owner.opponent ? style.Opponent : style.Player }`}>
      { owner.name }
    </div>
  ) : undefined;

  return (
    <div className={ style.CardDeskSlot }>
      <div className={ style.Effects }>
        { enchantCost > 0 ? <Mana cost={ enchantCost }/> : undefined }
      </div>
      { children }
      <div className={ style.OwnerContainer }>
        { ownerBadge }
      </div>
    </div>
  )
}