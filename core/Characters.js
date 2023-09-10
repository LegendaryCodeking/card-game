
export class Character {
  id = "";

  constructor(props) {
    Object.assign(this, props);
  }

  createInstance() {
    return new CharacterInstance(this);
  }
}

export class CharacterInstance {
  constructor({ id }) {
    this.id = id;
  }
}

export const Characters = {

  DEFAULT: new Character({
    id: 'default',
  }),
  
}