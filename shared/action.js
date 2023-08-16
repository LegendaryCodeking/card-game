
export const ActionType = {
  DAMAGE: "DAMAGE",
  EFFECT_ADDED: "EFFECT_ADDED",
  EFFECT_REMOVED: "EFFECT_REMOVED",
  CHANGE_OWNER: "CHANGE_OWNER",
}

export class Action {

  constructor(props) {
    Object.assign(this, props);
  }

  static damage(target, source, damage) {
    return new Action({ type: ActionType.DAMAGE, target, source, damage })
  }

  static effectAdded(target, effect) {
    return new Action({ type: ActionType.EFFECT_ADDED, target, effect });
  }

  static effectRemoved(target, effect) {
    return new Action({ type: ActionType.EFFECT_REMOVED, target, effect });
  }

  static changeOwner(target) {
    return new Action({ type: ActionType.CHANGE_OWNER, target });
  }
}
