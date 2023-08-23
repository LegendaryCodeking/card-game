
export const ActionType = {
  DAMAGE: "DAMAGE",
  EFFECT_ADDED: "EFFECT_ADDED",
  EFFECT_REMOVED: "EFFECT_REMOVED",
  CHANGE_OWNER: "CHANGE_OWNER",
  DAMAGE_BLOCKED: "DAMAGE_BLOCKED",
}

// TODO: Rename to "Actions"
export class Action {

  constructor(props) {
    Object.assign(this, props);
  }

  static damage(target, source, damage) {
    return new Action({ 
      type: ActionType.DAMAGE, target, source, damage })
  }

  static damageBlocked(target, source, damage) {
    return new Action({ type: ActionType.DAMAGE_BLOCKED, target, source, damage });
  }

  static effectAdded(target, effectId) {
    return new Action({ type: ActionType.EFFECT_ADDED, target, effectId });
  }

  static effectRemoved(target, effectId) {
    return new Action({ type: ActionType.EFFECT_REMOVED, target, effectId });
  }

  static changeOwner(target) {
    return new Action({ type: ActionType.CHANGE_OWNER, target });
  }
}
