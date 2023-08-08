
export default class CardState {
  icon = "shield-shaded";
  owner = "opponent";

  constructor(props) {
    if (props) {
      this.icon = props.icon;
    }
  }
}