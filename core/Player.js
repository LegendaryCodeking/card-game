
export default class Player {
  
  id = 1;
  name = "vadim";

  constructor(data) {
    Object.assign(this, data);
  }
}

/**
 * Contains game related player information.
 */
export class PlayerInstance {

  id = 0;
  icon = "emoji-angry";
  name = "player";
  health = 50;
  hand = [];
  pullSize = 0;
  effects = [];
  mana = 0;

  // TODO(vadim): This is temporary
  enchants = [];

  constructor(data) {
    Object.assign(this, data);
  }

  addEffect(effectInstance) {
    this.effects.push(effectInstance);
  }

  hasEffectById(effectId) {
    return this.effects.find(e => e.id === effectId) !== undefined;
  }

  hasEffect(query) {
    return this.effects.find(query) !== undefined;
  }

  removeEffectById(effectId) {
    const id = this.effects.findIndex(e => e.id === effectId);
    if (id >= 0) this.effects.splice(id, 1);
  }
}