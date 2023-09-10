import style from './FullscreenOverlay.module.css'

export default function FullscreenOverlay({ children }) {
  return (
    <div className={`${ style.FullscreenOverlay }`}>
      { children }
    </div>
  )
}