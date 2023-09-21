import { Action } from "./Actions.js";
import { Effects } from "./Effects.js";

export const CardType = {
  // Anything that player can place on the desk
  SPELL: "SPELL",
  // Add buffs to cards on the desk.
  ENCHANT: "ENCHANT",
}

export default class Card {
  id = "shield";
  icon = "shield-shaded";
  name = "";
  description = "";
  action = undefined;
  type = CardType.SPELL;

  constructor(data) {
    Object.assign(this, data);
  }

  createInstance(props) {
    return new CardInstance({ ...this, ...props });
  }
}

function dealDamage(actions, player, opponent, damage) {
  if (opponent.hasEffectById(Effects.HAS_SHIELD.id)) {
    actions.push(Action.damageBlocked(opponent.id, player.id, damage));
    return;
  };

  actions.push(Action.damage(opponent.id, player.id, damage));
  opponent.health -= damage;
}

export const Cards = {

  SHIELD: new Card({ 
    id: "SHIELD", 
    icon: "shield-shaded", 
    name: "Щит", 
    description: "Создает щит который блокирует весь последующий урон. Некоторые заклинания способны уничтожить данный щит.",
    type: CardType.SPELL,

    action({ actions, player }) {
      actions.push(Action.effectAdded(player.id, Effects.HAS_SHIELD.id))
      player.addEffect(Effects.HAS_SHIELD.createInstance());
    }
  }),

  ARROW: new Card({ 
    id: "ARROW", 
    icon: "heart-arrow", 
    name: "Магическая стрела", 
    description: "Наносит 3 урона сопернику.",
    type: CardType.SPELL,
    damage: 3,

    action({ actions, player, opponent }) {
      dealDamage( actions, player, opponent, this.damage);
    }
   }),

  FIREBALL: new Card({ 
    id: "FIREBALL", 
    icon: "fire", 
    name: "Огненный шар", 
    description: "Уничтожает один щит соперника. Если щитов у соперника нет, то наносит 6 урона.",
    type: CardType.SPELL,
    damage: 6,

    action({ actions, player, opponent }) {
      if (opponent.hasEffectById(Effects.HAS_SHIELD.id)) {
        opponent.removeEffectById(Effects.HAS_SHIELD.id);
        actions.push(Action.effectRemoved(opponent.id, Effects.HAS_SHIELD.id));
      } else {
        dealDamage(actions, player, opponent, this.damage);
      }
    }
  }),

  REVERSE: new Card({ 
    id: "REVERSE", 
    icon: "arrow-down-up", 
    name: "Воровство заклинания", 
    description: "Ворует следующее заклинание если оно принадлежит сопернику." ,
    type: CardType.SPELL,

    // TODO(vadim): Rename to "isAffected" and "currentSlotId" to "slotId"
    // and accept the object
    isCardAffected({ game, player, currentSlotId, targetSlotId }) {
      if (game.desk[targetSlotId].hasCard()) {
        const [ cardInstance, slotId ] = game.getNextDeskCard(currentSlotId);
        return targetSlotId === slotId && cardInstance.owner !== player.id;
      }
      return false;
    },

    action(context) {
      const { actions, game, slotId, player } = context;
      game.desk.forEach((cardSlot, cardSlotId) => {
        if (this.isCardAffected({ ...context, currentSlotId: slotId, targetSlotId: cardSlotId })) {
          const cardInstance = cardSlot.getCard();
          cardInstance.owner = player.id;
          actions.push(Action.changeOwner(cardInstance));
        }
      });
    }
  }),

  REPEAT: new Card({
    id: "REPEAT",
    icon: "arrow-clockwise",
    name: "Магический повтор",
    description: "Повторяет предыдущее заклинание от вашего имени.", 
    type: CardType.SPELL,

    // TODO(vadim): Rename to "isAffected" and "currentSlotId" to "slotId"
    // and accept the object
    /**
     * Returns true if card in targetSlotId is affected by this spell.
     */
    isCardAffected(game, currentSlotId, targetSlotId) {
      if (game.desk[targetSlotId].hasCard()) {
        const [ cardInstance, slotId ] = game.getPrevDeskCard(currentSlotId);
        return slotId === targetSlotId;
      }
      return false;
    },

    action(context) {
      const { game, slotId } = context;
      game.desk.forEach((cardSlot, cardSlotId) => {
        // avoid stack overflow
        if (cardSlotId === slotId) return; 

        const cardInstance = cardSlot.getCard();
        if (this.isCardAffected(game, slotId, cardSlotId)) {
          const card = Cards.getCardByInstance(cardInstance);
          card.action({ ...context, slotId: cardSlotId });
        }
      });
    },
  }),

  PIN: new Card({
    id: "PIN",
    icon: "pin-angle",
    name: "Закрепление",
    description: "Закрепляет выбранную вами карту. Данную карту не сможет перемещать ваш соперник.",
    type: CardType.ENCHANT,

    isAffected({ game, targetSlotId }) {
      return game.desk[targetSlotId].hasCard();
    },

    getManaCost({ targetSlotId }) {
      return targetSlotId > 2 ? 3 - (targetSlotId - 3) : targetSlotId + 1;
    },

    action({ game, targetSlotId }) {
      const cardInstance = game.desk[targetSlotId].getCard();
      if (cardInstance) cardInstance.pinned = true;
    }
  }),

  HEAL: new Card({
    id: "HEAL",
    icon: "patch-plus",
    name: "Лечение",
    description: "Восстанавливает 9 здоровья. Требует одну ману.",
    type: CardType.SPELL,

    getManaCost(context) {
      return 1;
    },

    action({ actions, player }) {
      actions.push(Action.heal(player.id, 9));
      player.health += 9;
    }
  }),

  // Spells:
  //  * Shield        (defense)
  //  * Magic Arrow   (3 damage)
  //  * Fireball      (6 damage)
  //  * Repeat        (mechanics)
  //  * Steal         (mechanics)

  // Special Spells:
  //  * Heal          (1 mana)    (9 heal)    (1/12 % prob)
  //  * Saint Sheild  (1 mana)                (1/12 % prob)

  // Enchants (advantage on attack):
  //  * Enchain   (1-3 mana)    - pin one card
  //  * Enlarge   (1 mana)      - card deals 3 more damage


  /** Everything below is optionall gameplay right now */

  SAINT_SHIELD: new Card({
    id: "SAINT_SHIELD",
    icon: "shield-fill-plus",
    name: "Святой щит",
    description: "Создает щит который блокирует последующий урон. Если щит не был уничтожен, то он остается у вас даже после окончания хода. Некоторые заклинания способны уничтожить данный щит.",
    type: CardType.SPELL,

    action(context) {
      const { player } = context;
      player.addEffect(Effects.SAINT_SHIELD.createInstance());
    }
  }),

  ORACLE: new Card({
    id: "ORACLE",
    icon: "eye",
    name: "Предзнаменование",
    description: "Повторяет последнее заклинание которое будет прочитано в этом раунде.",
    type: CardType.SPELL,
    
    action(context) {
      const { game, slotId } = context;

      const [ cardInstance, cardSlot ] = game.getLastDeskCard();
      if (cardInstance && cardSlot !== slotId) {
        cardInstance.action({ ...context, slotId: cardSlot });
      }
    }
  }),


  getCardById(cardId) {
    return this[cardId];
  },

  getCardByInstance(cardInstance) {
    return this[cardInstance.id];
  }

};

export const CardEffects = {
  PINNED: "PINNED",
}

export class CardInstance {
  id = undefined;
  owner = undefined;
  effects = [];

  constructor(data) {
    Object.assign(this, data);
  }

  hasEffect(effect) {
    return this.effects.find(v => v === effect) !== undefined;
  }

  addEffect(effect) {
    this.effects.push(effect);
  }

  getCard() {
    Cards.getCardByInstance(this);
  }
}

export class CardSlot {

  // TODO(vadim): Rename 'card' to 'cardInstance' otherwise
  // it is too much confusion
  card = undefined;
  
  constructor(data) {
    Object.assign(this, data);
    if (this.card) this.card = new CardInstance(this.card);
  }

  hasCard() {
    return this.card !== undefined;
  }

  setCard(cardInstance) {
    this.card = cardInstance;
  }

  getCard() {
    return this.card;
  }

  takeCard() {
    const card = this.card;
    this.card = undefined;
    return card;
  }
}
