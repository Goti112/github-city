const watermark = 'github-city · miquelmanzano.com'

export const captureCity = async (canvas: HTMLCanvasElement, login: string): Promise<Blob> => {
  if (!Number.isInteger(canvas.width) || canvas.width <= 0 || !Number.isInteger(canvas.height) || canvas.height <= 0) {
    throw new RangeError(`No se puede capturar un canvas sin dimensiones: ${canvas.width}×${canvas.height}`)
  }

  const output = document.createElement('canvas')
  output.width = canvas.width
  output.height = canvas.height

  const context = output.getContext('2d')
  if (context === null) {
    throw new Error(`No se pudo crear el contexto 2D para capturar la ciudad de @${login}`)
  }

  const fontSize = Math.max(16, Math.round(output.width * 0.02))
  const padding = Math.round(fontSize * 0.8)
  const bandHeight = fontSize + padding * 2
  context.drawImage(canvas, 0, 0, output.width, output.height)
  context.fillStyle = 'rgba(9, 16, 23, 0.82)'
  context.fillRect(0, output.height - bandHeight, output.width, bandHeight)
  context.font = `600 ${fontSize}px system-ui, sans-serif`
  context.textAlign = 'right'
  context.textBaseline = 'bottom'
  context.fillStyle = '#eff5f7'
  context.fillText(watermark, output.width - padding, output.height - padding)

  return new Promise<Blob>((resolve, reject) => {
    output.toBlob((blob) => {
      if (blob === null) {
        reject(new Error(`El navegador no pudo codificar la captura de @${login} como PNG`))
        return
      }

      resolve(blob)
    }, 'image/png')
  })
}
