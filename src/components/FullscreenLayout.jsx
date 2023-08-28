import { Children } from 'react'
import './FullscreenLayout.css'

export default function FullscreenLayout({ children }) {
  return (
    <div className='fullscreen-layout'>
      { children }
    </div>
  )
}