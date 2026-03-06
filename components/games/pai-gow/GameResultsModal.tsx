import { useEffect, useMemo, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  outcome?: string
  mainPayout: number
  bonusPayout: number
  pushPayout: number
  net: number
  onRewatch?: () => void
  onPlayAgain?: () => void
}

function formatSigned(n: number) {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}`
}

export default function GameResultsModal(props: Props) {
  const {
    open,
    onClose,
    title = 'RESULT',
    outcome,
    mainPayout,
    bonusPayout,
    pushPayout,
    net,
    onRewatch,
    onPlayAgain,
  } = props

  // lightweight count-up so the modal feels "alive".
  const [animNet, setAnimNet] = useState(net)
  const target = useMemo(() => net, [net])

  useEffect(() => {
    if (!open) return

    const from = 0
    const to = target
    const dur = 520
    const t0 = performance.now()

    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      const eased = 1 - Math.pow(1 - k, 3)
      setAnimNet(from + (to - from) * eased)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open, target])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const netClass = net > 0 ? 'resNetPos' : net < 0 ? 'resNetNeg' : 'resNetZero'

  return (
    <div className="resModalOverlay" role="dialog" aria-modal="true" aria-label="Game results">
      <div className="resModal" onClick={(e) => e.stopPropagation()}>
        <div className="resModalTop">
          <div>
            <div className="resTitle">{title}</div>
            <div className="resSub">{outcome ? `Main: ${outcome}` : 'Round complete'}</div>
          </div>

          <button className="resClose" type="button" onClick={onClose} aria-label="Close results">
            ×
          </button>
        </div>

        <div className="resNetRow">
          <div className="resNetLabel">NET</div>
          <div className={`resNet ${netClass}`}>{formatSigned(animNet)}</div>
        </div>

        <div className="resBreakdown">
          <div className="resLine">
            <div className="resKey">MAIN</div>
            <div className="resVal">{formatSigned(mainPayout)}</div>
          </div>
          <div className="resLine">
            <div className="resKey">BONUS</div>
            <div className="resVal">{formatSigned(bonusPayout)}</div>
          </div>
          <div className="resLine">
            <div className="resKey">ACE HIGH (PUSH)</div>
            <div className="resVal">{formatSigned(pushPayout)}</div>
          </div>
        </div>

        <div className="resActions">
          {onRewatch ? (
            <button className="btn" type="button" onClick={onRewatch}>
              Rewatch
            </button>
          ) : null}
          {onPlayAgain ? (
            <button className="btn" type="button" onClick={onPlayAgain}>
              New hand
            </button>
          ) : null}
          <button className="btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="resFine">
          Units are chips (1/5/10/25/100). Net = MAIN + BONUS + PUSH.
        </div>
      </div>

      <button className="resModalBg" type="button" onClick={onClose} aria-label="Close results backdrop" />
    </div>
  )
}
