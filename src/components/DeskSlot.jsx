import style from "./DeskSlot.module.css";
import Mana from "./Mana";

export default function DeskSlot({ children, owner }) {

  const ownerBadge = owner ? (
    <div className={`${ style.Owner } ${ owner.opponent ? style.Opponent : style.Player }`}>
      { owner.name }
    </div>
  ) : undefined;

  return (
    <div className={ style.CardDeskSlot }>
      <div className={ style.Effects }>
        <Mana />
      </div>
      { children }
      <div className={ style.OwnerContainer }>
        { ownerBadge }
      </div>
    </div>
  )
}