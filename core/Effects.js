
export class Effect {
  id = undefined;

  preAction = undefined;
  postAction = undefined;

  constructor(data) {
    Object.assign(this, data);
  }

  createInstance(props) {
    return new EffectInstance({ ...this, ...props });
  }
}

export class EffectInstance{
  constructor({ id }) {
    this.id = id;
  }
}

export const Effects = {

  HAS_SHIELD: new Effect({ id: "HAS_SHIELD", name: "Щит" }), 

  SAINT_SHIELD: new Effect({ id: "SAINT_SHIELD", name: "Святой щит", persistant: true }),

  getEffectByInstance(effectInstance) {
    return Effects[effectInstance.id];
  },

  getEffectById(effectId) {
    return Effects[effectId];
  }
}



