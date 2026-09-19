import { useEffect, useRef } from 'react'

export default function AdsterraAd({ type, adKey, width, height, scriptSrc, containerId }) {
  const rendered = useRef(false)

  useEffect(() => {
    if (rendered.current) return
    rendered.current = true

    if (type === 'banner') {
      window.atOptions = {
        key: adKey,
        format: 'iframe',
        height: height,
        width: width,
        params: {},
      }

      const script = document.createElement('script')
      script.src = `https://www.highrevenueformat.com/${adKey}/invoke.js`
      script.async = true
      document.body.appendChild(script)

      return () => {
        if (script.parentNode) script.parentNode.removeChild(script)
      }
    }

    if ((type === 'native' || type === 'socialbar') && scriptSrc) {
      const script = document.createElement('script')
      script.src = scriptSrc
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      document.body.appendChild(script)

      return () => {
        if (script.parentNode) script.parentNode.removeChild(script)
      }
    }
  }, [type, adKey, width, height, scriptSrc])

  if ((type === 'native' || type === 'socialbar') && containerId) {
    return <div id={containerId} style={{ margin: '20px 0' }} />
  }

  if (type === 'banner') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '20px 0',
          minHeight: height,
          overflow: 'hidden',
        }}
      />
    )
  }

  return null
  }
