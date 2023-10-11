import RandomDistributor from "../../core/utils/RandomDistributor";
import { Cards } from "../../core/Cards";
import CardSlot from "../components/CardSlot";
import "./Demo.css";

export default function Demo() {

  /*
  const distributor = new RandomDistributor({ amount: 26, nodes: [
    { w: 1, v: Cards.FIREBALL.id },
    { w: 1, v: Cards.ARROW.id },
    { w: 1, group: [
      { w: 1, v: Cards.SHIELD.id },
      { w: 1, v: Cards.REPEAT.id },
    ]}
  ]});
  */
  
  const distributor = new RandomDistributor({ amount: 36, nodes: [
    /*
    { w: 1, v: Cards.HEAL.id },
    { w: 1, v: Cards.ANCHOR.id },
    { w: 1, v: Cards.SAINT_SHIELD.id },
    */
    { w: 5/6, name: "Non mana cards", group: [
      { w: 1, name: "Damage cards", group: [
        { w: 1, v: Cards.ARROW.id },
        { w: 1, v: Cards.FIREBALL.id },
      ]},
      { w: 1, name: "Non damage cards", group: [
        { w: 1, v: Cards.REPEAT.id },
        { w: 1, v: Cards.SHIELD.id },
        { w: 1, v: Cards.REVERSE.id },
      ]},
    ]},
    { w: 1/6, name: "Mana cards", group: [
      { w: 2/3, name: "1 mana cards", group: [
        { w: 1, v: Cards.HEAL.id },
        { w: 1, v: Cards.ANCHOR.id },       // TODO: TEST IT
        { w: 1, v: Cards.CRATER.id },       // TODO: TEST IT
        { w: 1, v: Cards.SAINT_SHIELD.id }, // TODO: TEST IT
      ]},
      { w: 1/3, name: "3 mana cards", group: [
        { w: 1, v: Cards.IMITATOR.id }
      ]},
    ]},
  ]});
  // distributor.generate(26);
  // distributor.shuffle();

  const cards = [];
  for (let i = 0; i < 100; i++) {
  // for (let cardId of distributor.values) {
    // const instance = Cards[cardId].createInstance();
    const cardId = distributor.pick();
    if (!cardId) break;

    const instance = Cards[cardId].createInstance();
    cards.push((
      <CardSlot cardInstance={ instance } enabled={ true }></CardSlot>
    ));
  }

  return (
    <div className='DemoContainer'>{cards}</div>
  );
}