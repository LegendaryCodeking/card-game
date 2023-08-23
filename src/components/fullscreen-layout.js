import { Children } from 'react'
import './fullscreen-layout.css'

export default function FullscreenLayout({ children }) {
  return (
    <div className='fullscreen-layout'>
      { children }
    </div>
  )
}