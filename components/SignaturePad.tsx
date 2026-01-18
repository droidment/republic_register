'use client'

import { useRef, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void
  disabled?: boolean
}

export default function SignaturePad({ onSave, disabled }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Resize canvas to fit container
    function resizeCanvas() {
      if (sigCanvas.current && containerRef.current) {
        const canvas = sigCanvas.current.getCanvas()
        const container = containerRef.current
        canvas.width = container.offsetWidth
        canvas.height = 200
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  function handleClear() {
    if (sigCanvas.current) {
      sigCanvas.current.clear()
      setIsEmpty(true)
    }
  }

  function handleEnd() {
    if (sigCanvas.current) {
      setIsEmpty(sigCanvas.current.isEmpty())
      if (!sigCanvas.current.isEmpty()) {
        const dataUrl = sigCanvas.current.toDataURL('image/png')
        onSave(dataUrl)
      }
    }
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={`border-2 rounded-lg overflow-hidden ${
          disabled ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'
        }`}
      >
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-[200px]',
            style: { touchAction: 'none' },
          }}
          backgroundColor="rgb(255, 255, 255)"
          penColor="black"
          onEnd={handleEnd}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {isEmpty ? 'Sign above using your mouse or finger' : 'Signature captured'}
        </p>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || isEmpty}
          className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
