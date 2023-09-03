import './FullscreenLayout.css'

// TODO(vadim): Use CSS modules
export default function FullscreenLayout({ children }) {
  return (
    <div className='fullscreen-layout'>
      { children }
    </div>
  )
}