import React, { useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import GameResultsModalPlatform from './GameResultsModalPlatform'

type Game = {
  title?: string
  song?: string
  animatedBackground?: string
  gameBackground?: string
}

type Props = {
  game: Game
  isLoading: boolean
  isGameFinished: boolean
  customHeightMobile?: string
  children: React.ReactNode

  betAmount: number | null
  payout: number | null
  payoutBreakdown?: Array<{ label: string; bet?: number; payout?: number }>
  inReplayMode: boolean
  isUserOriginalPlayer: boolean
  showPNL: boolean
  isGamePaused?: boolean

  onReset: () => void
  onPlayAgain?: () => void
  playAgainText?: string
  onRewatch?: () => void
  currentGameId: bigint
}

const fallbackSong = ''

export default function GameWindowPlatform({
  game,
  isLoading,
  isGameFinished,
  customHeightMobile,
  children,
  betAmount,
  payout,
  payoutBreakdown,
  inReplayMode = true,
  isUserOriginalPlayer = false,
  showPNL = false,
  isGamePaused = false,
  onReset,
  onPlayAgain,
  playAgainText = 'Play Again',
  onRewatch,
  currentGameId,
}: Props) {
  const audioRef = useRef<Howl | null>(null)
  const [muteMusic, setMuteMusic] = useState(false)
  const [musicVolume] = useState(0.5)

  useEffect(() => {
    if (!game.song && !fallbackSong) return

    const sound = new Howl({
      src: [game.song || fallbackSong],
      loop: true,
      volume: musicVolume,
      mute: muteMusic,
    })

    audioRef.current = sound
    if (!muteMusic) sound.play()

    return () => {
      sound.unload()
      audioRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.song])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume(musicVolume)
  }, [musicVolume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.mute(muteMusic)
    if (!muteMusic && !audio.playing()) audio.play()
  }, [muteMusic])

  const muteSongToggle = () => setMuteMusic((x) => !x)

  return (
    <div className={cn('w-full rounded-[12px] border border-[#2A3640] relative overflow-hidden')}
      style={{ minHeight: customHeightMobile ? customHeightMobile : undefined }}
    >
      {isGamePaused && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-[#12181C]/75 backdrop-blur-xs rounded-[8px] p-4">
          <h2 className="font-semibold text-xl sm:text-3xl text-center">Game Paused</h2>
          <p className="text-sm opacity-80 text-center max-w-sm sm:max-w-md mx-auto">Please check back later.</p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-[#12181C]/75 text-white backdrop-blur-xs rounded-[8px]">
          Loading...
        </div>
      )}

      {isGameFinished && betAmount != null && payout != null && onPlayAgain && (
        <GameResultsModalPlatform
          key={currentGameId.toString()}
          isOpen={isGameFinished}
          payout={payout}
          betAmount={betAmount}
          usdMode={false}
          apePrice={1}
          isLoading={isLoading}
          gameTitle={game.title}
          payoutBreakdown={payoutBreakdown}
          onReset={onReset}
          onPlayAgain={onPlayAgain}
          playAgainButtonText={playAgainText}
          onRewatch={onRewatch}
          showPlayAgainOption={!inReplayMode && isUserOriginalPlayer}
          showRewatchOption={inReplayMode || isUserOriginalPlayer}
          showPNL={showPNL}
        />
      )}

      {/* Background (optional) */}
      {game.animatedBackground ? (
        <video
          src={game.animatedBackground}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          className="absolute inset-0 w-full h-full object-cover rounded-[8px] pointer-events-none opacity-75"
        />
      ) : game.gameBackground ? (
        <img
          src={game.gameBackground}
          alt="Game Background"
          className="absolute inset-0 w-full h-full object-cover rounded-[8px] opacity-75"
        />
      ) : null}

      {/* Game content */}
      {children}

      {/* Sound toggle */}
      {game.song ? (
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-4 right-4 z-30 p-2 bg-[#151C21]/40 rounded-[8px] text-[#91989C]"
          onClick={muteSongToggle}
          title={muteMusic ? 'Unmute sound' : 'Mute sound'}
        >
          {muteMusic ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </Button>
      ) : null}
    </div>
  )
}
