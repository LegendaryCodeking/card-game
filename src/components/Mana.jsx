import Icon from "./Icon";
import style from "./Mana.module.css";

export default function Mana({ cost = 3 }) {
  const icons = [];
  for (let i = 0; i < cost; i++) {
    icons.push((<Icon key={i} icon='hexagon-fill'/>));
  }

  return (
    <div className={`${ style.Mana }`}>
      { icons }
    </div>
  )
}