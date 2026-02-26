import { useEffect, useRef, useState } from 'react'
import './Scratchpad.css'

export default function Scratchpad({ savedData, onDataChange }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState('pen') // pen | eraser
  const lastPos = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (savedData) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = savedData
    }
  }, [])

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e) {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    lastPos.current = getPos(e, canvas)
  }

  function draw(e) {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)

    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : '#1a1a2e'
    ctx.lineWidth = tool === 'eraser' ? 20 : 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  function endDraw() {
    if (!isDrawing) return
    setIsDrawing(false)
    if (onDataChange) {
      onDataChange(canvasRef.current.toDataURL())
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (onDataChange) onDataChange(null)
  }

  return (
    <div className="scratchpad-container">
      <div className="scratchpad-header">
        <span className="scratchpad-title">SCRATCHPAD</span>
        <div className="scratchpad-tools">
          <button
            className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
          >✏️</button>
          <button
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >⬜</button>
          <button className="tool-btn clear-btn" onClick={clearCanvas} title="Clear">Clear</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="scratchpad-canvas"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  )
}
