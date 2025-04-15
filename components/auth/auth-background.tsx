"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

export function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  // Desenhar o gráfico
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return // Add this null check to fix the TypeScript error

    // Variáveis para controlar a animação
    let animationPhase = 0 // 0: crescendo, 1: estável, 2: desvanecendo, 3: pausa
    let fadeOpacity = 1
    let currentAnimation: number | null = null

    // Função para redimensionar o canvas
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1

      // Definir o tamanho real do canvas (para resolução nítida)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr

      // Definir o tamanho de exibição do canvas
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`

      // Escalar o contexto para corresponder ao DPR
      ctx.scale(dpr, dpr)

      // Reiniciar a animação quando o tamanho mudar
      if (currentAnimation) {
        animationPhase = 0
        fadeOpacity = 1
      }
    }

    // Registrar evento de redimensionamento
    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    // Função para desenhar o gráfico
    function drawGraph(progress = 1, opacity = 1) {
      // Limpar o canvas
      ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1))

      // Definir cores baseadas no tema - usando cores mais visíveis
      const barColor =
        theme === "dark" ? `rgba(74, 222, 128, ${opacity * 0.5})` : `rgba(20, 184, 80, ${opacity * 0.25})`

      const lineColor =
        theme === "dark" ? `rgba(74, 222, 128, ${opacity * 0.6})` : `rgba(16, 158, 68, ${opacity * 0.35})`

      const gridColor = theme === "dark" ? `rgba(255, 255, 255, ${opacity * 0.03})` : `rgba(0, 0, 0, ${opacity * 0.02})`

      // Obter dimensões reais de desenho
      const width = canvas.width / (window.devicePixelRatio || 1)
      const height = canvas.height / (window.devicePixelRatio || 1)

      // Desenhar a grade
      const gridSize = Math.max(30, Math.min(width, height) / 20) // Grid responsivo
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 0.5

      // Linhas horizontais
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Linhas verticais
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      // Configurações para o gráfico
      const numBars = 7
      const maxBarHeight = height * 0.7 // 70% da altura do canvas
      const barWidth = Math.min(width / 15, 100) // Largura responsiva

      // Adicionar margem de 10% em cada lado
      const horizontalMargin = width * 0.05 // 10% de margem em cada lado

      // Calcular espaço disponível e espaçamento entre barras
      const availableWidth = width - horizontalMargin * 2
      const totalBarWidth = barWidth * numBars
      const totalSpacing = availableWidth - totalBarWidth
      const barSpacing = totalSpacing / (numBars - 1)

      // Posição inicial e linha base
      const startX = horizontalMargin
      const baseY = height * 0.9 // Linha base do gráfico (90% da altura)

      // Alturas das barras (crescentes com curva suave)
      const barHeights = [
        maxBarHeight * 0.2,
        maxBarHeight * 0.35,
        maxBarHeight * 0.5,
        maxBarHeight * 0.65,
        maxBarHeight * 0.8,
        maxBarHeight * 0.95,
        maxBarHeight,
      ]

      // Desenhar linha base
      ctx.strokeStyle = barColor
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(startX, baseY)
      ctx.lineTo(startX + availableWidth, baseY)
      ctx.stroke()

      // Desenhar barras com animação
      ctx.fillStyle = barColor

      // Pontos para a curva - vamos ajustar para que a linha não toque nenhuma das barras
      const curvePoints = []

      // Primeiro, vamos criar os pontos das barras para referência
      const barTops = []

      for (let i = 0; i < numBars; i++) {
        const currentHeight = barHeights[i] * progress
        const x = startX + i * (barWidth + barSpacing)
        const y = baseY - currentHeight

        // Barra com cantos arredondados
        ctx.beginPath()
        const radius = Math.min(barWidth / 4, 8) // Raio dos cantos arredondados

        // Desenhar retângulo com cantos arredondados
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + barWidth - radius, y)
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
        ctx.lineTo(x + barWidth, baseY - radius)
        ctx.quadraticCurveTo(x + barWidth, baseY, x + barWidth - radius, baseY)
        ctx.lineTo(x + radius, baseY)
        ctx.quadraticCurveTo(x, baseY, x, baseY - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()

        ctx.fill()

        // Armazenar o ponto central do topo da barra
        barTops.push({
          x: x + barWidth / 2,
          y: y,
        })
      }

      // Agora vamos criar uma linha que não toca nenhuma das barras
      // Vamos usar uma abordagem diferente: criar uma linha que passa acima de todas as barras

      // Primeiro, vamos definir o ponto inicial e final da linha
      const firstBarX = barTops[0].x
      const firstBarY = barTops[0].y
      const lastBarX = barTops[barTops.length - 1].x
      const lastBarY = barTops[barTops.length - 1].y

      // Calcular a inclinação da linha reta entre o primeiro e último ponto
      const slope = (lastBarY - firstBarY) / (lastBarX - firstBarX)

      // Agora, para cada barra, vamos calcular um ponto acima dela
      for (let i = 0; i < numBars; i++) {
        const barX = barTops[i].x
        const barY = barTops[i].y

        // Calcular o ponto na linha reta
        const lineY = firstBarY + slope * (barX - firstBarX)

        // Ajustar o ponto para ficar acima da barra
        // Para a primeira e última barra, usamos um offset fixo
        // Para as barras do meio, calculamos um offset que varia
        let offsetY

        if (i === 0) {
          // Primeira barra: offset maior para ficar bem acima
          offsetY = maxBarHeight * 0.08
        } else if (i === numBars - 1) {
          // Última barra: offset menor, mas ainda acima
          offsetY = maxBarHeight * 0.05
        } else {
          // Barras do meio: offset que varia com base na posição
          // Quanto mais perto do meio, maior o offset
          const distanceFromCenter = Math.abs(i - (numBars - 1) / 2) / ((numBars - 1) / 2)
          offsetY = maxBarHeight * (0.15 - 0.1 * distanceFromCenter)
        }

        // Aplicar o offset para garantir que a linha não toque a barra
        const adjustedY = Math.min(lineY, barY) - offsetY

        curvePoints.push({
          x: barX,
          y: adjustedY,
        })
      }

      // Desenhar a linha de tendência apenas se o progresso for suficiente
      if (progress > 0.3) {
        const lineProgress = (progress - 0.3) / 0.7 // Normalizar para 0-1

        // Desenhar a curva
        ctx.strokeStyle = lineColor
        ctx.lineWidth = 4
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        ctx.beginPath()
        ctx.moveTo(curvePoints[0].x, curvePoints[0].y)

        // Usar curva de Bezier para suavizar a linha
        for (let i = 0; i < curvePoints.length - 1; i++) {
          const xc = (curvePoints[i].x + curvePoints[i + 1].x) / 2
          const yc = (curvePoints[i].y + curvePoints[i + 1].y) / 2
          ctx.quadraticCurveTo(curvePoints[i].x, curvePoints[i].y, xc, yc)
        }

        // Conectar ao último ponto
        ctx.quadraticCurveTo(
          curvePoints[curvePoints.length - 2].x,
          curvePoints[curvePoints.length - 2].y,
          curvePoints[curvePoints.length - 1].x,
          curvePoints[curvePoints.length - 1].y,
        )

        ctx.stroke()

        // Desenhar a seta tradicional (>) no final da linha
        if (lineProgress > 0.8) {
          const arrowProgress = (lineProgress - 0.8) / 0.2 // Normalizar para 0-1
          const lastPoint = curvePoints[curvePoints.length - 1]
          const arrowSize = 30 * arrowProgress // Tamanho da seta

          // Ângulo da linha no ponto final (aproximadamente horizontal para a direita)
          const angle = 0 // 0 radianos = direção para a direita

          // Desenhar a seta tradicional (>)
          ctx.fillStyle = lineColor
          ctx.beginPath()

          // Ponto de início (onde a linha termina)
          const startX = lastPoint.x
          const startY = lastPoint.y

          // Calcular os pontos da seta
          const tipX = startX + arrowSize * 2
          const tipY = startY

          // Pontas da seta
          const arrowWidth = arrowSize * 0.8

          // Desenhar a seta (>)
          ctx.moveTo(startX, startY)
          ctx.lineTo(tipX, tipY)
          ctx.lineTo(startX + arrowSize, startY - arrowWidth)
          ctx.moveTo(tipX, tipY)
          ctx.lineTo(startX + arrowSize, startY + arrowWidth)

          // Definir estilo da linha para a seta
          ctx.strokeStyle = lineColor
          ctx.lineWidth = 4 * arrowProgress
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          ctx.stroke()
        }
      }
    }

    // Função para animar as barras com transição suave
    function animateGraph() {
      let startTime = null
      // Aumentar a duração para tornar a animação mais lenta e suave
      const growDuration = 4000 // Aumentado de 2500 para 4000 ms
      const stableDuration = 7000 // Aumentado de 5000 para 6000 ms
      const fadeDuration = 2000 // Aumentado de 1500 para 2000 ms
      const pauseDuration = 4500 // Aumentado de 2000 para 2500 ms

      function animate(timestamp) {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime

        // Calcular o progresso com base na fase atual
        let progress = 0

        if (animationPhase === 0) {
          // Fase de crescimento
          progress = Math.min(elapsed / growDuration, 1)

          // Usar easing mais suave para o crescimento
          // easeOutQuint para uma desaceleração mais gradual
          progress = 1 - Math.pow(1 - progress, 5)

          if (progress >= 1) {
            animationPhase = 1
            startTime = timestamp
          }
        } else if (animationPhase === 1) {
          // Fase estável
          progress = 1

          if (elapsed >= stableDuration) {
            animationPhase = 2
            startTime = timestamp
          }
        } else if (animationPhase === 2) {
          // Fase de desvanecimento
          progress = 1
          fadeOpacity = 1 - Math.min(elapsed / fadeDuration, 1)

          // Usar easing mais suave para o fade
          // easeInOutQuint para uma transição mais suave
          const x = fadeOpacity
          fadeOpacity = x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2

          if (fadeOpacity <= 0) {
            // Passar para a fase de pausa
            animationPhase = 3
            fadeOpacity = 0
            startTime = timestamp
          }
        } else if (animationPhase === 3) {
          // Fase de pausa
          progress = 0
          fadeOpacity = 0

          if (elapsed >= pauseDuration) {
            // Reiniciar o ciclo
            animationPhase = 0
            fadeOpacity = 1
            startTime = timestamp
          }
        }

        // Desenhar o gráfico com o progresso atual
        drawGraph(progress, fadeOpacity)

        // Solicitar o próximo frame
        currentAnimation = requestAnimationFrame(animate)
      }

      // Iniciar a animação
      currentAnimation = requestAnimationFrame(animate)
    }

    // Iniciar a animação
    animateGraph()

    return () => {
      if (currentAnimation) {
        cancelAnimationFrame(currentAnimation)
        currentAnimation = null
      }
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [theme])

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none w-full h-full" style={{ opacity: 0.4 }} />
  )
}
