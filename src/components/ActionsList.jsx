import { Actions } from "../../core/Actions";
import { Effects } from "../../core/effect";
import style from "./ActionsList.module.css"

export default function ActionsList({ actions, game }) {

  function renderAction(key, icon, content) {
    return (
      <div key={ key } className={ style.Action }>
        <div><i class={`bi bi-${ icon }`}></i></div>
        <div>{ content }</div>
      </div>
    );
  }

  function getAction(action, id) {
    const players = game.players;
    const opponent = players.find(p => p.id === action.target);

    if (action.type === Actions.DAMAGE) {
      return renderAction(action.id, "heartbreak", 
        (<><b>{ opponent.name }</b> {action.damage} урона</>))
    }

    if (action.type === Actions.CHANGE_OWNER) {
      return renderAction(action.id, "arrow-down-up", 
        (<>Следующее заклинение сменило владельца</>))
    }

    if (action.type === Actions.DAMAGE_BLOCKED) {
      return renderAction(action.id, "shield", 
        (<><b>{ opponent.name }</b> блокирует { action.damage } урона</>))
    }

    if (action.type === Actions.EFFECT_ADDED) {
      const effectName = Effects.getEffectById(action.effectId).name;
      return renderAction(action.id, "plus-circle", 
        (<><b>{ opponent.name }</b> получает { effectName }</>))
    }

    if (action.type === Actions.EFFECT_REMOVED) {
      const effectName = Effects.getEffectById(action.effectId).name;
      return renderAction(action.id, "dash-circle", 
        (<><b>{ opponent.name }</b> теряет { effectName }</>))
    }

    return undefined;
  }
  
  return (
    <div className={ style.ActionsContainer }>
      { actions.map((a, id) => getAction(a, id)) }
    </div>
  );
}