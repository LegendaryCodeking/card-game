import Icon from "./Icon";
import style from "./EnchantUse.module.css";

export default function EnchantUse({ active = true, onClick }) {
  return (
    <div className={`${ style.EnchantUse } ${ active ? style.Active : '' }`} onClick={onClick}>
      <div className={`${ style.Cost }`}>1-3 <Icon icon='hexagon-fill'/></div>
      <div>Закрепление</div>
    </div>
  )
}