import style from './CardDeck.module.css';

export default function CardDeck({ onClick, available }) {
  return (
  <div onClick={ onClick } className={ `${style.CardDeck} ${ !available ? style.Disabled : style.Enabled }` }>
    <div className={ `${style.Card} ${style.FirstCard}` }></div>
    <div className={ `${style.Card} ${style.SecondCard}` }></div>
    <div className={ `${style.Card} ${style.ThirdCard}` }></div>
  </div>
  )
}