import { useState, useEffect } from 'react'

/**
 * Animated typewriter/streaming effect for AI generated text.
 * Gives realistic LLM token generation feel with a pulsing terminal cursor.
 */
export default function StreamingText({
  text = '',
  speed = 12,
  chunkSize = 3,
  onComplete,
  className = '',
  showCursor = true,
}) {
  const [displayed, setDisplayed] = useState('')
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (!text) {
      setDisplayed('')
      setIsDone(true)
      return
    }

    // If text is very long (like full final report markdown), stream in larger chunks
    const chunk = text.length > 500 ? Math.max(chunkSize, Math.floor(text.length / 80)) : chunkSize
    let currentIdx = 0
    setIsDone(false)
    setDisplayed('')

    const timer = setInterval(() => {
      currentIdx += chunk
      if (currentIdx >= text.length) {
        setDisplayed(text)
        setIsDone(true)
        clearInterval(timer)
        onComplete?.()
      } else {
        setDisplayed(text.slice(0, currentIdx))
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, chunkSize, onComplete])

  return (
    <span className={`streaming-text-wrap ${className}`}>
      {displayed}
      {showCursor && !isDone && <span className="stream-cursor">▍</span>}
    </span>
  )
}
