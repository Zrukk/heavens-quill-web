import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteTransition({ children }) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('fadeOut')
    }
  }, [location, displayLocation])

  useEffect(() => {
    if (transitionStage === 'fadeOut') {
      const timer = setTimeout(() => {
        setTransitionStage('fadeIn')
        setDisplayLocation(location)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [transitionStage, location])

  return (
    <div
      style={{
        opacity: transitionStage === 'fadeIn' ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
    >
      {children}
    </div>
  )
  }
