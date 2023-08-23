
export class Effect {
  id = undefined;

  preAction = undefined;
  postAction = undefined;

  constructor(data) {
    Object.assign(this, data);
  }
}

export class EffectReference {
  id = undefined;
  constructor(data) {
    Object.assign(this, data);
  }
}

export const Effects = {
  HAS_SHIELD: new Effect({ id: "HAS_SHIELD", name: "щит" }), 

  getEffect(effectRef) {
    return Effects[effectRef.id];
  },

  getEffectById(effectId) {
    return Effects[effectId];
  }
}

