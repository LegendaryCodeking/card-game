
export const Actions = {
  DAMAGE: "DAMAGE",
  EFFECT_ADDED: "EFFECT_ADDED",
  EFFECT_REMOVED: "EFFECT_REMOVED",
  CHANGE_OWNER: "CHANGE_OWNER",
  DAMAGE_BLOCKED: "DAMAGE_BLOCKED",
  HEAL: "HEAL",
  PIN: "PIN",
}

// TODO(vadim): Rename to "Actions" and merge with the previous structure
export class Action {

  constructor(props) {
    Object.assign(this, props);
  }

  static damage(target, source, damage) {
    return new Action({ 
      type: Actions.DAMAGE, target, source, damage })
  }

  static damageBlocked(target, source, damage) {
    return new Action({ type: Actions.DAMAGE_BLOCKED, target, source, damage });
  }

  static pinCard(target, cardId) {
    return new Action({ type: Actions.PIN, target, cardId });
  }

  static effectAdded(target, effectId) {
    return new Action({ type: Actions.EFFECT_ADDED, target, effectId });
  }

  static effectRemoved(target, effectId) {
    return new Action({ type: Actions.EFFECT_REMOVED, target, effectId });
  }

  static heal(target, heal) {
    return new Action({ type: Actions.HEAL, target, heal });
  }

  static changeOwner(target) {
    return new Action({ type: Actions.CHANGE_OWNER, target });
  }
}
