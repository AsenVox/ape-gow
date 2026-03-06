import { useEffect, useMemo, useState } from 'react'

import './App.css'

import './table.css'



import { hashSeedToU32 } from 'ape-gow-sim/src/prng'

import { dealRound } from 'ape-gow-sim/src/deal'

import { validateSplit } from 'ape-gow-sim/src/split'

import { settleRound } from 'ape-gow-sim/src/settle'

import { houseWayV0 } from 'ape-gow-sim/src/houseWay'
import { eval5 } from 'ape-gow-sim/src/eval5'
import { eval2 } from 'ape-gow-sim/src/eval2'



import { CardFace } from './components/CardFace'
import GameWindowPlatform from './components/GameWindowPlatform'



import acLogo from './assets/AC Logo/PNG/Logo_WithText/Logo_HorizontalText_White.png'



type Card = { rank: string; suit: string }

type PlayerSplit = { low: [Card, Card]; high: [Card, Card, Card, Card, Card] }

const rankValue: Record<string, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
  X: 15, // Joker
}

function handName5(category: number) {
  return (
    {
      0: 'High Card',
      1: 'One Pair',
      2: 'Two Pair',
      3: 'Three of a Kind',
      4: 'Straight',
      5: 'Flush',
      6: 'Full House',
      7: 'Four of a Kind',
      8: 'Straight Flush',
    } as Record<number, string>
  )[category] ?? '—'
}

function handName2(category: number) {
  return category === 1 ? 'Pair' : 'High Card'
}

function sortCardsForDisplay(cards: Card[]) {
  // Vegas-ish: group duplicates together and generally show high→low.
  // Joker is shown last so it doesn't break the visual grouping.
  const counts = new Map<string, number>()
  for (const c of cards) {
    if (c.rank === 'X') continue
    counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1)
  }

  return [...cards].sort((a, b) => {
    const aj = a.rank === 'X'
    const bj = b.rank === 'X'
    if (aj !== bj) return aj ? 1 : -1

    const ca = counts.get(a.rank) ?? 1
    const cb = counts.get(b.rank) ?? 1
    if (ca !== cb) return cb - ca

    const ra = rankValue[a.rank] ?? 0
    const rb = rankValue[b.rank] ?? 0
    return rb - ra
  })
}

export default function App() {

  const [seed, setSeed] = useState('demo-seed-1') // deterministic per hand

  // ApeChurch lifecycle: 0 setup → 1 ongoing → 2 game over
  const [_currentView, setCurrentView] = useState<0 | 1 | 2>(0)
  const [isLoading, setIsLoading] = useState(false)

  const [main, setMain] = useState(0)

  const [side, setSide] = useState(0)
  const [push, setPush] = useState(0)

  // Track chips as the user places them (so stacking/undo is deterministic and non-glitchy)
  const [mainChips, setMainChips] = useState<number[]>([])
  const [sideChips, setSideChips] = useState<number[]>([])
  const [pushChips, setPushChips] = useState<number[]>([])



  // chip UI (table-like). Units are 1/5/10/25/100; USD display later via $APE price toggle.

  const [activeChip, setActiveChip] = useState(5)



  // indices into the 7-card player hand

  const [lowIdx, setLowIdx] = useState<number[]>([])

  const [highIdx, setHighIdx] = useState<number[]>([])



  const [assignTarget, setAssignTarget] = useState<'low' | 'high'>('low')



  const [dealerRevealed, setDealerRevealed] = useState(false)

  const [dealerFlipped, setDealerFlipped] = useState<boolean[]>(() => Array(7).fill(false))

  const [dealerArranged, setDealerArranged] = useState(false)



  const [playerFlipped, setPlayerFlipped] = useState<boolean[]>(() => Array(7).fill(false))

  // Visual aid: sort your revealed pool to scan hands faster.
  const [playerSort, setPlayerSort] = useState<'none' | 'asc' | 'desc'>('asc')



  const view = useMemo(() => {

    const seedU32 = hashSeedToU32(seed)

    const deal = dealRound(seedU32)



    const player7 = deal.player as any as Card[]

    const house7 = deal.house as any as Card[]



    const playerSplit: PlayerSplit | null =

      lowIdx.length === 2 && highIdx.length === 5

        ? {

            low: [player7[lowIdx[0]], player7[lowIdx[1]]],

            high: [

              player7[highIdx[0]],

              player7[highIdx[1]],

              player7[highIdx[2]],

              player7[highIdx[3]],

              player7[highIdx[4]],

            ],

          }

        : null



    const houseSplitRaw = houseWayV0(house7 as any) as any as PlayerSplit

    // Re-order for a "Vegas clean" presentation: group pairs/trips together, high→low.
    const houseSplit: PlayerSplit = {
      high: sortCardsForDisplay(houseSplitRaw.high) as any,
      low: sortCardsForDisplay(houseSplitRaw.low) as any,
    }



    // Map dealer's 7 cards -> target slot (High 0-4, Low 0-1) so we can animate into position.

    const used = new Set<number>()

    const dealerTargets: { row: 'high' | 'low'; slot: number }[] = Array(7).fill(null).map(() => ({ row: 'high', slot: 0 }))



    function takeIndexFor(card: Card): number {

      for (let i = 0; i < house7.length; i++) {

        if (used.has(i)) continue

        const c = house7[i]

        if (c.rank === card.rank && c.suit === card.suit) {

          used.add(i)

          return i

        }

      }

      return -1

    }



    for (let s = 0; s < 5; s++) {

      const idx = takeIndexFor(houseSplit.high[s])

      if (idx >= 0) dealerTargets[idx] = { row: 'high', slot: s }

    }

    for (let s = 0; s < 2; s++) {

      const idx = takeIndexFor(houseSplit.low[s])

      if (idx >= 0) dealerTargets[idx] = { row: 'low', slot: s }

    }



    const validation = playerSplit

      ? validateSplit(deal.player as any, playerSplit as any)

      : { ok: false, reason: 'Pick 2 cards for Low and 5 for High.' }



    const res = playerSplit && validation.ok

      ? settleRound({
          deal: deal as any,
          playerSplit: playerSplit as any,
          mainWager: main,
          sideWager: side,
          pushAceHighWager: push,
          config: { faceUpAceHighPush: true },
        })

      : null



    const dealerHighName = handName5(eval5(houseSplit.high as any).category)
    const dealerLowName = handName2(eval2(houseSplit.low as any).category)

    return {
      seedU32,
      deal,
      player7,
      house7,
      playerSplit,
      houseSplit,
      dealerTargets,
      validation,
      res,
      dealerHighName,
      dealerLowName,
    }

  }, [seed, main, side, lowIdx, highIdx])



  const poolIdx = useMemo(() => {
    const taken = new Set([...lowIdx, ...highIdx])
    return [0, 1, 2, 3, 4, 5, 6].filter((i) => !taken.has(i))
  }, [lowIdx, highIdx])

  const displayPoolIdx = useMemo(() => {
    if (playerSort === 'none') return poolIdx

    const dir = playerSort === 'asc' ? 1 : -1
    return [...poolIdx].sort((ia, ib) => {
      // Keep unrevealed cards at the end once dealer arranged.
      const ra = dealerArranged && !playerFlipped[ia] ? 1 : 0
      const rb = dealerArranged && !playerFlipped[ib] ? 1 : 0
      if (ra !== rb) return ra - rb

      const a = view.player7[ia]
      const b = view.player7[ib]
      const va = rankValue[a.rank] ?? 0
      const vb = rankValue[b.rank] ?? 0
      if (va !== vb) return (va - vb) * dir
      return (a.suit > b.suit ? 1 : a.suit < b.suit ? -1 : 0) * dir
    })
  }, [poolIdx, playerSort, dealerArranged, playerFlipped, view.player7])



  const allPlayerRevealed = useMemo(() => playerFlipped.every(Boolean), [playerFlipped])

  const canSplit = dealerArranged && allPlayerRevealed

  // Bets must be placed before any cards are flipped, then locked.
  const betsLocked = dealerRevealed
  const hasMainBet = mainChips.length > 0 && main > 0
  const isRoundComplete = dealerArranged && allPlayerRevealed && lowIdx.length === 2 && highIdx.length === 5 && view.validation.ok

  // Game-over modal
  const [isGameFinished, setIsGameFinished] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [resultsSeenSeed, setResultsSeenSeed] = useState<string | null>(null)

  // Advance lifecycle to "game over" once a valid split is locked in.
  useEffect(() => {
    if (!isRoundComplete) return
    setCurrentView(2)
    setIsGameFinished(true)

    // Open results modal once per seed (prevents repeat-open during re-renders)
    if (resultsSeenSeed !== seed) {
      setResultsOpen(true)
      setResultsSeenSeed(seed)
    }
  }, [isRoundComplete, resultsSeenSeed, seed])



  function resetHands() {
    setLowIdx([])
    setHighIdx([])
    setAssignTarget('low')

    setDealerRevealed(false)
    setDealerFlipped(Array(7).fill(false))
    setDealerArranged(false)

    setPlayerFlipped(Array(7).fill(false))
  }

  function handleReset() {
    setIsGameFinished(false)
    setResultsOpen(false)
    setResultsSeenSeed(null)
    // Full reset back to setup view (ApeChurch requirement)
    resetHands()
    setIsLoading(false)
    setCurrentView(0)

    // reset bets + stacks
    setMain(0)
    setSide(0)
    setPush(0)
    setMainChips([])
    setSideChips([])
    setPushChips([])
  }

  function handlePlayAgain() {
    setIsGameFinished(false)
    setResultsOpen(false)
    setResultsSeenSeed(null)
    // Fresh hand (new deterministic seed), keep user in setup to place/adjust bets
    setSeed(`demo-${Date.now()}`)
    resetHands()
    setIsLoading(false)
    setCurrentView(0)
  }

  function handleRewatch() {
    setIsGameFinished(false)
    setResultsOpen(false)
    // keep seen seed so it won't auto-pop during rewatch
    // Replay same seed/outcome without a new bet/tx (ApeChurch requirement)
    resetHands()
    setIsLoading(false)
    setCurrentView(1)
    // kick off the dealer flow again
    flipDealer()
  }

  async function playGame() {
    // ensure we can show modal at end of this round
    setIsGameFinished(false)
    setResultsOpen(false)
    // Start a new game with current bet (simulated tx)
    if (dealerRevealed) return

    // Face Up Pai Gow: MAIN wager required; side bets optional.
    if (!hasMainBet) return

    setIsLoading(true)
    setCurrentView(1)

    // simulate chain confirmation delay
    window.setTimeout(() => {
      setIsLoading(false)
      flipDealer()
    }, 450)
  }



  function clickPool(i: number) {

    // Before split-stage: clicks flip cards (player reveal flow)

    if (!dealerRevealed) return

    if (!playerFlipped[i]) {

      const next = [...playerFlipped]

      next[i] = true

      setPlayerFlipped(next)

      return

    }



    // Split-stage: clicks assign cards to Low/High

    if (!canSplit) return



    if (assignTarget === 'low') {

      if (lowIdx.length >= 2) return

      setLowIdx([...lowIdx, i])

      if (lowIdx.length + 1 >= 2) setAssignTarget('high')

      return

    }



    if (highIdx.length >= 5) return

    setHighIdx([...highIdx, i])

  }



  function removeFromLow(i: number) {

    setLowIdx(lowIdx.filter((x) => x !== i))

    setAssignTarget('low')

  }



  function removeFromHigh(i: number) {

    setHighIdx(highIdx.filter((x) => x !== i))

    setAssignTarget('high')

  }



  function _newRandomSeed() {
    setSeed(`demo-${Date.now()}`)
    resetHands()

    // Reset bet stacks too (new hand = clean betting slate)
    setMain(0)
    setSide(0)
    setMainChips([])
    setSideChips([])
  }
  void _newRandomSeed



  function setTargetLow() {

    if (!canSplit) return

    setAssignTarget('low')

  }



  function setTargetHigh() {

    if (!canSplit) return

    // If Low isn't filled yet, keep it honest.

    if (lowIdx.length < 2) {

      setAssignTarget('low')

      return

    }

    setAssignTarget('high')

  }



  function flipDealer() {

    if (dealerRevealed) return



    // Phase 1: flip 7 cards (one by one)

    setDealerRevealed(true)

    setDealerArranged(false)

    setDealerFlipped(Array(7).fill(false))



    for (let i = 0; i < 7; i++) {

      window.setTimeout(() => {

        setDealerFlipped((prev) => {

          const next = [...prev]

          next[i] = true

          return next

        })

      }, i * 120)

    }



    // Phase 2: "arrange" (simple reveal/swap to split layout after a short pause)

    window.setTimeout(() => {

      setDealerArranged(true)

    }, 7 * 120 + 650)

  }



  function flipAllPlayer() {

    // Player can only flip once the dealer has arranged.
    if (!dealerArranged) return

    setPlayerFlipped(Array(7).fill(true))

  }



  function autoSplitHouseWay() {

    if (!canSplit) return



    // Map split cards back to indices in the 7-card hand (handle duplicates safely)

    const cards = view.player7

    const used = new Set<number>()



    function pickIndexFor(card: Card): number {

      for (let i = 0; i < cards.length; i++) {

        if (used.has(i)) continue

        const c = cards[i]

        if (c.rank === card.rank && c.suit === card.suit) {

          used.add(i)

          return i

        }

      }

      return -1

    }



    const split = houseWayV0(cards as any) as any as PlayerSplit

    const low = [pickIndexFor(split.low[0]), pickIndexFor(split.low[1])].filter((x) => x >= 0)

    const high = split.high.map(pickIndexFor).filter((x) => x >= 0)



    if (low.length === 2 && high.length === 5) {

      setLowIdx(low)

      setHighIdx(high)

      setAssignTarget('low')

    }

  }



  // Seed entry UI removed for table layout (still deterministic by seed).

  // Reintroduce if we want debugging controls.



  const chipValues = [1, 5, 10, 25, 100]

  function wobbleStyle(v: number, i: number) {
    // Stable wobble based on chip value + index (NOT total bet), so it doesn't "glitch" when the bet changes.
    const t = Math.sin((v * 1000 + i * 97.13) * 12.9898) * 43758.5453
    const r = (t - Math.floor(t)) * 2 - 1
    const t2 = Math.sin((v * 1000 + i * 41.77) * 78.233) * 12345.6789
    const r2 = (t2 - Math.floor(t2)) * 2 - 1

    const x = r * 2.6 // px
    const rot = r2 * 2.0 // deg
    return { x, rot }
  }



  const chipStyleFor = (v: number) => {
    // Poker-chip styling via CSS variables (used by rack chips).
    if (v === 1)
      return {
        borderColor: 'rgba(215,225,230,0.28)',
        ['--chipColor' as any]: '#2a2a2a',
        ['--chipStripe' as any]: 'rgba(235,240,244,0.95)',
      }

    if (v === 5)
      return {
        borderColor: 'rgba(105,174,251,0.55)',
        ['--chipColor' as any]: '#1e4a86',
        ['--chipStripe' as any]: 'rgba(235,240,244,0.95)',
      }

    if (v === 10)
      return {
        borderColor: 'rgba(239,185,11,0.60)',
        ['--chipColor' as any]: '#9a6a10',
        ['--chipStripe' as any]: 'rgba(235,240,244,0.95)',
      }

    if (v === 25)
      return {
        borderColor: 'rgba(140,255,0,0.52)',
        ['--chipColor' as any]: '#2d7a21',
        ['--chipStripe' as any]: 'rgba(235,240,244,0.95)',
      }

    return {
      borderColor: 'rgba(215,225,230,0.38)',
      ['--chipColor' as any]: '#3a3a3a',
      ['--chipStripe' as any]: 'rgba(235,240,244,0.95)',
    }
  }



  function placeMainChip() {
    if (betsLocked) return
    setMain((x) => Number((x + activeChip).toFixed(2)))
    setMainChips((prev) => [...prev, activeChip])
  }

  function placeSideChip() {
    if (betsLocked) return
    setSide((x) => Number((x + activeChip).toFixed(2)))
    setSideChips((prev) => [...prev, activeChip])
  }

  function placePushChip() {
    if (betsLocked) return
    setPush((x) => Number((x + activeChip).toFixed(2)))
    setPushChips((prev) => [...prev, activeChip])
  }

  function undoMainChip() {
    if (betsLocked) return
    setMainChips((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setMain((x) => Number(Math.max(0, x - last).toFixed(2)))
      return prev.slice(0, -1)
    })
  }

  function undoSideChip() {
    if (betsLocked) return
    setSideChips((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setSide((x) => Number(Math.max(0, x - last).toFixed(2)))
      return prev.slice(0, -1)
    })
  }

  function undoPushChip() {
    if (betsLocked) return
    setPushChips((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setPush((x) => Number(Math.max(0, x - last).toFixed(2)))
      return prev.slice(0, -1)
    })
  }



  const panel = {

    background: 'rgba(20, 20, 20, 0.82)',

    border: '1px solid var(--border)',

    borderRadius: 16,

    padding: 16,

  } as const


  const r = view.res
  const mainPayout = r?.mainPayout ?? 0
  const bonusPayout = r?.sidePayout ?? 0
  const pushPayout = r?.pushAceHighPayout ?? 0
  const netPayout = mainPayout + bonusPayout + pushPayout


  return (

    <div className="tableWrap">
      <GameWindowPlatform
        game={{ title: 'Pai Gow' }}
        isLoading={isLoading}
        isGameFinished={resultsOpen && isGameFinished}
        betAmount={main}
        payout={netPayout}
        payoutBreakdown={[
          { label: 'Main hand', bet: main, payout: mainPayout },
          { label: 'Bonus / Side', bet: side, payout: bonusPayout },
          { label: 'Push (Ace High)', bet: push, payout: pushPayout },
        ]}
        inReplayMode={false}
        isUserOriginalPlayer={true}
        showPNL={false}
        onReset={handleReset}
        onPlayAgain={handlePlayAgain}
        playAgainText={'New hand'}
        onRewatch={handleRewatch}
        currentGameId={BigInt(view.seedU32)}
      >

      {/* Keep our modal mounted for now (team liked it), but platform alignment uses GameWindowPlatform+GameResultsModalPlatform. */}

      <div className="table">

        <div className="rail">

          <div className="brand">

            <img src={acLogo} alt="ApeChurch" style={{ height: 26, opacity: 0.95 }} />

            <div>

              <div className="title">Pai Gow</div>

              <div className="sub">1v1 table demo - dealer flips {'->'} arranges {'->'} player flips {'->'} split</div>

            </div>

          </div>

          <div className="controls">

            <button className="btn" onClick={handlePlayAgain}>New hand</button>

            <button className="btn" onClick={handleReset}>Reset</button>

            <button className="btn" onClick={autoSplitHouseWay} disabled={!canSplit} title="Auto-split your hand using House Way">

              Auto-split

            </button>

          </div>

        </div>



        <div className="felt">

          <div className="zones">

            <div className="zone">

              <div className="zoneHeader dealerHeader">

                <div className="zoneLabel">DEALER</div>

                <div className="dealerHeaderControls" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '100%' }}>

                  <div className="dealerStatus" style={{ fontSize: 12, opacity: 0.7 }}>

                    {!dealerRevealed
                      ? 'Waiting'
                      : !dealerArranged
                        ? 'Flipping & arranging...'
                        : `High: ${view.dealerHighName} • Low: ${view.dealerLowName}`}

                  </div>

                  <button
                    className="btn"
                    onClick={playGame}
                    disabled={dealerRevealed || isLoading || !hasMainBet}
                    style={{ maxWidth: '100%' }}
                  >
                    {dealerRevealed ? (dealerArranged ? 'Dealer arranged' : 'Flipping...') : isLoading ? 'Confirming…' : 'Play'}
                  </button>

                </div>

              </div>



              {/* Dealer animated hand */}

              <div style={{ marginTop: 6, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 10, paddingRight: 12, maxWidth: '100%', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>

                {(() => {

                  // Read card sizing from CSS vars so mobile/tablet layouts don't clip.
                  const root = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : (null as any)
                  const CARD_W = (root ? Number.parseFloat(root.getPropertyValue('--cardW')) : NaN) || 72
                  const CARD_H = (root ? Number.parseFloat(root.getPropertyValue('--cardH')) : NaN) || 100

                  const GAP = CARD_W <= 56 ? 6 : 10
                  const STEP = CARD_W + GAP

                  // Space between dealer high row and low row
                  // Desktop needs a bit more room than mobile so the LOW label never overlaps.
                  const LOW_LABEL_H = CARD_W <= 50 ? 18 : 24
                  const LOW_Y = CARD_H + GAP + LOW_LABEL_H + (CARD_W <= 50 ? 12 : 0)
                  const H = LOW_Y + CARD_H
                  const W = STEP * 7 - GAP
                  const PAD = CARD_W <= 56 ? 6 : 8



                  return (

                    <div style={{ position: 'relative', height: H + PAD * 2, width: W + PAD * 2, overflow: 'visible' }}>

                      {view.house7.map((c, i) => {

                        const startX = PAD + i * STEP

                        const target = view.dealerTargets[i]

                        const endX = PAD + (dealerArranged ? target.slot : i) * STEP

                        const endY = dealerArranged ? (target.row === 'low' ? LOW_Y : 0) : 0

                        const dx = endX - startX

                        const dy = endY



                        return (

                          <div

                            key={`house-anim-${i}`}

                            style={{

                              position: 'absolute',

                              left: startX,

                              top: 0,

                              transform: `translate(${dx}px, ${dy}px)`,

                              transition: 'transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1)',

                              willChange: 'transform',
                              zIndex: 1,

                            }}

                          >

                            <CardFace card={c} faceDown={!dealerFlipped[i]} />

                          </div>

                        )

                      })}



                      {dealerArranged ? (
                        <div
                          style={{
                            position: 'absolute',
                            left: PAD,
                            // Place label centered in the gap between high row and low row
                            top: PAD + CARD_H + (LOW_Y - CARD_H) / 2 - 10,
                            fontWeight: 900,
                            opacity: 0.85,
                            letterSpacing: 0.6,
                            fontSize: 12,
                            zIndex: 999,
                            pointerEvents: 'none',
                            textShadow: '0 2px 10px rgba(0,0,0,0.65)',
                          }}
                        >
                          LOW (2)
                        </div>
                      ) : null}

                    </div>

                  )

                })()}

              </div>

            </div>



            <div className="zone">

              <div className="zoneHeader">

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

                  <div className="zoneLabel">BETS</div>

                  <div className="infoWrap" aria-label="Bonus paytable">

                    <button className="infoIcon" type="button" aria-label="Show bonus multipliers">i</button>

                    <div className="infoPopover">

                      <div style={{ fontWeight: 900, marginBottom: 6 }}>FACE UP PAYTABLES</div>

                      <div style={{ opacity: 0.9, fontSize: 12, lineHeight: 1.35 }}>
                        <div style={{ fontWeight: 900, marginBottom: 6 }}>Push Ace High (PUSH)</div>
                        <div>• Dealer Ace-high (no Joker) — <strong>5x</strong></div>
                        <div>• Dealer Ace-high (with Joker) — <strong>15x</strong></div>
                        <div>• Player + Dealer Ace-high — <strong>40x</strong></div>

                        <div style={{ height: 10 }} />

                        <div style={{ fontWeight: 900, marginBottom: 6 }}>Bonus (BONUS)</div>
                        <div>• 7 Card Straight Flush (no Joker) — <strong>5000x</strong></div>
                        <div>• Royal Flush + Royal Match — <strong>2000x</strong></div>
                        <div>• 7 Card Straight Flush (with Joker) — <strong>1000x</strong></div>
                        <div>• Five Aces — <strong>400x</strong></div>
                        <div>• Royal Flush — <strong>150x</strong></div>
                        <div>• Straight Flush — <strong>50x</strong></div>
                        <div>• Four of a Kind — <strong>25x</strong></div>
                        <div>• Full House — <strong>5x</strong></div>
                        <div>• Flush — <strong>4x</strong></div>
                        <div>• Three of a Kind — <strong>3x</strong></div>
                        <div>• Straight — <strong>2x</strong></div>
                      </div>

                      <div style={{ marginTop: 8, fontSize: 11, opacity: 0.65 }}>
                        Face Up rule: if the dealer’s best 5-card hand is Ace-high, the main wager auto-pushes.
                        PUSH side bet pays only when dealer is Ace-high.
                      </div>

                    </div>

                  </div>

                </div>

                <div style={{ fontSize: 12, opacity: 0.72 }}>

                  Chips are units (1/5/10/25/100). USD toggle (APE price) next.

                </div>

              </div>



              <div className="betLane">

                <button className="betSpot betSpotBonus" onClick={placeSideChip} disabled={betsLocked} title="Place Bonus bet">
                  {/* chip stack */}
                  <div className="chipStack" aria-hidden>
                    {sideChips.slice(0, 22).map((v, i) => {
                      const w = wobbleStyle(v, i)
                      return (
                        <div
                          key={`side-${i}`}
                          className={`stackChip chipV${v}`}
                          style={{
                            bottom: i * 4,
                            left: `${w.x}px`,
                            transform: `rotate(${w.rot}deg) translateZ(0)`,
                          }}
                        >
                          {v}
                        </div>
                      )
                    })}
                  </div>

                  {sideChips.length ? (
                    <button
                      type="button"
                      className="betBackBtn"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        undoSideChip()
                      }}
                      disabled={betsLocked}
                      title="Remove last chip"
                      aria-label="Remove last chip"
                    >
                      ↩
                    </button>
                  ) : null}

                  <div className="betContent">
                    <div className="betName">BONUS</div>
                    <div className="betValue" style={{ marginTop: 6, fontWeight: 900 }}>{side}</div>
                  </div>
                </button>

                <button className="betSpot betSpotPush" onClick={placePushChip} disabled={betsLocked} title="Place Push Ace High bet">
                  {/* chip stack */}
                  <div className="chipStack" aria-hidden>
                    {pushChips.slice(0, 22).map((v, i) => {
                      const w = wobbleStyle(v, i)
                      return (
                        <div
                          key={`push-${i}`}
                          className={`stackChip chipV${v}`}
                          style={{
                            bottom: i * 4,
                            left: `${w.x}px`,
                            transform: `rotate(${w.rot}deg) translateZ(0)`,
                          }}
                        >
                          {v}
                        </div>
                      )
                    })}
                  </div>

                  {pushChips.length ? (
                    <button
                      type="button"
                      className="betBackBtn"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        undoPushChip()
                      }}
                      disabled={betsLocked}
                      title="Remove last chip"
                      aria-label="Remove last chip"
                    >
                      ↩
                    </button>
                  ) : null}

                  <div className="betContent">
                    <div className="betName">PUSH</div>
                    <div className="betValue" style={{ marginTop: 6, fontWeight: 900 }}>{push}</div>
                  </div>
                </button>

                <button className="betSpot betSpotMain" onClick={placeMainChip} disabled={betsLocked} title="Place Main bet">
                  {/* chip stack */}
                  <div className="chipStack" aria-hidden>
                    {mainChips.slice(0, 22).map((v, i) => {
                      const w = wobbleStyle(v, i)
                      return (
                        <div
                          key={`main-${i}`}
                          className={`stackChip chipV${v}`}
                          style={{
                            bottom: i * 4,
                            left: `${w.x}px`,
                            transform: `rotate(${w.rot}deg) translateZ(0)`,
                          }}
                        >
                          {v}
                        </div>
                      )
                    })}
                  </div>

                  {mainChips.length ? (
                    <button
                      type="button"
                      className="betBackBtn"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        undoMainChip()
                      }}
                      disabled={betsLocked}
                      title="Remove last chip"
                      aria-label="Remove last chip"
                    >
                      ↩
                    </button>
                  ) : null}

                  <div className="betContent">
                    <div className="betName">MAIN</div>
                    <div className="betValue" style={{ marginTop: 6, fontWeight: 900, fontSize: 18 }}>{main}</div>
                  </div>
                </button>

                {/* jackpot indicator moved near chip rack */}

              </div>



              <div className="betFooterRow" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>

                <div className="chipRack">

                  {chipValues.map((v) => (

                    <button

                      key={v}

                      className={v === activeChip ? 'chip chipActive' : 'chip'}

                      onClick={() => setActiveChip(v)}
                      disabled={betsLocked}

                      style={chipStyleFor(v)}

                      title={`Select ${v} chip`}

                    >

                      {v}

                    </button>

                  ))}

                </div>

                {/* Jackpot (coming soon) — small pill next to chip rack on mobile */}
                <button className="jackpotPill" type="button" disabled title="Jackpot (coming soon)">
                  JACKPOT
                </button>

                <div className="controls">

                  <button
                    className="btn"
                    onClick={() => {
                      setMain(0)
                      setSide(0)
                      setMainChips([])
                      setSideChips([])
                    }}
                    title="Remove All Bets"
                    disabled={betsLocked}
                  >
                    Remove All Bets
                  </button>
                  {betsLocked ? (
                    <div style={{ fontSize: 12, opacity: 0.6 }}>Bets locked</div>
                  ) : null}

                </div>

              </div>

            </div>



            <div className="zone">

              <div className="zoneHeader">

                <div className="zoneLabel">PLAYER</div>

                <div className="playerHeaderControls" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

                  <button className="btn" onClick={flipAllPlayer} disabled={!dealerArranged}>
                    Flip all
                  </button>

                  <button
                    className="btn"
                    onClick={() => setPlayerSort((s) => (s === 'asc' ? 'desc' : s === 'desc' ? 'none' : 'asc'))}
                    disabled={!dealerArranged}
                    title="Sort your revealed pool"
                  >
                    Sort: {playerSort === 'asc' ? 'Low→High' : playerSort === 'desc' ? 'High→Low' : 'Off'}
                  </button>

                  <div style={{ fontSize: 12, opacity: 0.75 }}>

                    {!dealerArranged

                      ? 'Waiting on dealer'

                      : !allPlayerRevealed

                        ? `Flip ${playerFlipped.filter((x) => !x).length} more cards`

                        : 'Split enabled'}

                  </div>

                </div>

              </div>



              <div className="cardsRow" style={{ marginBottom: 12 }}>

                {displayPoolIdx.map((i) => (

                  <CardFace

                    key={i}

                    card={view.player7[i]}

                    faceDown={!dealerArranged || !playerFlipped[i]}

                    onClick={dealerArranged ? () => clickPool(i) : undefined}

                    title={!dealerArranged ? 'Wait for dealer to arrange' : !playerFlipped[i] ? 'Click to flip' : canSplit ? 'Click to assign' : 'Click'}

                  />

                ))}

              </div>



              <div style={{ display: 'grid', gap: 10 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>

                  <div style={{ fontWeight: 900, opacity: 0.85, letterSpacing: 0.6, fontSize: 12 }}>YOUR SPLIT</div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>

                    <div style={{ fontSize: 12, opacity: 0.75 }}>Assign to:</div>

                    <button className="btn" onClick={setTargetLow} disabled={!canSplit} style={{ padding: '8px 10px', borderRadius: 999 }}>

                      Low (2)

                    </button>

                    <button className="btn" onClick={setTargetHigh} disabled={!canSplit} style={{ padding: '8px 10px', borderRadius: 999 }}>

                      High (5)

                    </button>

                  </div>

                </div>



                <div style={{ display: 'grid', gap: 10 }}>

                  <div>

                    <div style={{ fontWeight: 900, opacity: 0.85, letterSpacing: 0.6, fontSize: 12, marginBottom: 8 }}>LOW (2)</div>

                    <div className="cardsRow">

                      {lowIdx.map((i) => (

                        <CardFace key={i} card={view.player7[i]} tone="low" onClick={() => removeFromLow(i)} />

                      ))}

                    </div>

                  </div>

                  <div>

                    <div style={{ fontWeight: 900, opacity: 0.85, letterSpacing: 0.6, fontSize: 12, marginBottom: 8 }}>HIGH (5)</div>

                    <div className="cardsRow">

                      {highIdx.map((i) => (

                        <CardFace key={i} card={view.player7[i]} tone="high" onClick={() => removeFromHigh(i)} />

                      ))}

                    </div>

                  </div>

                </div>

              </div>



              <div style={{ marginTop: 14, ...panel }}>

                <div style={{ fontWeight: 900, marginBottom: 8 }}>RESULT</div>

                {view.res ? (

                  <div style={{ display: 'grid', gap: 6 }}>

                    <div>Outcome: <strong>{view.res.outcome}</strong></div>

                    <div>Main payout: <strong>{view.res.mainPayout}</strong></div>

                    <div>Side payout: <strong>{view.res.sidePayout}</strong></div>

                    <div>Side hit: <strong>{view.res.sideHit ? `${view.res.sideHit.name} (${view.res.sideHit.multiplier}x)` : '-'}</strong></div>

                    <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button className="btn" onClick={handlePlayAgain}>Play again</button>
                      <button className="btn" onClick={handleRewatch}>Rewatch</button>
                      <button className="btn" onClick={handleReset}>Reset</button>
                    </div>

                  </div>

                ) : (

                  <div style={{ opacity: 0.8 }}>Make a valid split to see the outcome.</div>

                )}

              </div>

            </div>

          </div>

        </div>



        <details style={{ ...panel, marginTop: 16, cursor: 'pointer' }}>

          <summary>Debug</summary>

          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{JSON.stringify({ seedU32: view.seedU32, lowIdx, highIdx, res: view.res }, null, 2)}</pre>

        </details>

      </div>

      </GameWindowPlatform>
    </div>

  )

}



