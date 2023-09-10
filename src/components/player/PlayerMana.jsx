import Icon from "../Icon";
import style from "./PlayerMana.module.css"

export default function PlayerMana({ player, cost = 0 }) {
  
  const mana = [];

  for (let i = 0; i < 3; i++) {

    // TODO(vadim): Naming sucks as always
    const filled = (player.mana >= cost) && i < player.mana;
    const wasted = i < cost;

    let iconStyle = '';
    if (filled) iconStyle = wasted ? style.ManaWasted : style.ManaFilled;
    else iconStyle = wasted ? style.ManaLack : '';

    mana.push((<div className={`${ style.ManaIcon } ${ iconStyle }`}>
      { filled || wasted ? <Icon icon='hexagon-fill'/> : <Icon icon='hexagon' />}
    </div>));
  }

  return (
    <div className={`${ style.PlayerMana }`}>
      { mana }
    </div>
  );
}