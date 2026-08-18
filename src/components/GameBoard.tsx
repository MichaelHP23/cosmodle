import { useEffect, useMemo, useState } from "react"
import dataset from "../data/celestialObjects.json"
import type { CelestialObject } from "../types/celestial"
import type { ComparisonStatus, DailyGameState, GameMode } from "../types/game"
import { getDailyObject, pickRandomObject, daysSinceEpoch, LAUNCH_DATE } from "../lib/dailyObject"
import { createInitialState, applyGuess, loadDailyState, saveDailyState, MAX_GUESSES } from "../lib/gameState"
import { getProfileForCategory } from "../lib/objectProfiles"
import { compareProperty } from "../lib/comparison"
import { getStatistics, recordDailyResult, type Statistics } from "../lib/statistics"
import { DailyHeader } from "./DailyHeader"
import { GuessInput } from "./GuessInput"
import { GuessTable } from "./GuessTable"
import { ResultModal } from "./ResultModal"
import { LossModal } from "./LossModal"
import { Footer } from "./Footer"
import { HowToPlayModal } from "./HowToPlayModal"

const typedDataset = dataset as CelestialObject[]
const HOW_TO_PLAY_SEEN_KEY = "cosmodle:hasSeenHowToPlay"

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function GameBoard() {
  const [mode, setMode] = useState<GameMode>("daily")
  const today = useMemo(() => todayDateString(), [])
  const dailyAnswer = useMemo(() => getDailyObject(new Date(), typedDataset), [])
  const dayNumber = useMemo(() => daysSinceEpoch(new Date(), LAUNCH_DATE) + 1, [])

  const [practiceAnswer, setPracticeAnswer] = useState<CelestialObject>(() => pickRandomObject(typedDataset))
  const [dailyState, setDailyState] = useState<DailyGameState>(() => loadDailyState(today) ?? createInitialState(today))
  const [practiceGuessIds, setPracticeGuessIds] = useState<string[]>([])
  const [practiceWon, setPracticeWon] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showHowToPlay, setShowHowToPlay] = useState(() => !localStorage.getItem(HOW_TO_PLAY_SEEN_KEY))
  const [statistics, setStatistics] = useState<Statistics | null>(() => (dailyState.won ? getStatistics() : null))

  function closeHowToPlay() {
    localStorage.setItem(HOW_TO_PLAY_SEEN_KEY, "true")
    setShowHowToPlay(false)
  }

  useEffect(() => {
    if (mode === "daily") saveDailyState(dailyState)
  }, [dailyState, mode])

  const answer = mode === "daily" ? dailyAnswer : practiceAnswer
  const guessIds = mode === "daily" ? dailyState.guessIds : practiceGuessIds
  const won = mode === "daily" ? dailyState.won : practiceWon
  const lost = guessIds.length >= MAX_GUESSES && !won
  const guesses = guessIds.map(id => typedDataset.find(o => o.id === id)!).filter(Boolean)
  const profile = getProfileForCategory(answer.category)
  const gameOver = won || lost

  function handleGuess(id: string) {
    if (mode === "daily") {
      const { state: next } = applyGuess(dailyState, id, typedDataset, dailyAnswer.id)
      setDailyState(next)
      const justEnded = (next.won || next.guessIds.length >= MAX_GUESSES) && !(dailyState.won || dailyState.guessIds.length >= MAX_GUESSES)
      if (justEnded) {
        setStatistics(recordDailyResult(dayNumber, next.won, next.guessIds.length))
        setShowResultModal(true)
      }
    } else {
      if (gameOver || practiceGuessIds.includes(id)) return
      const nextIds = [...practiceGuessIds, id]
      setPracticeGuessIds(nextIds)
      if (id === practiceAnswer.id) setPracticeWon(true)
      if (id === practiceAnswer.id || nextIds.length >= MAX_GUESSES) setShowResultModal(true)
    }
  }

  function startNewPractice() {
    setPracticeAnswer(pickRandomObject(typedDataset))
    setPracticeGuessIds([])
    setPracticeWon(false)
    setShowResultModal(false)
  }

  function changeMode(next: GameMode) {
    setMode(next)
    if (next === "practice" && practiceGuessIds.length === 0) startNewPractice()
  }

  const guessStatusRows = guesses.map(guess => {
    const statuses: ComparisonStatus[] = profile
      .filter(e => e.property !== "category")
      .map(e => compareProperty((guess as any)[e.property], (answer as any)[e.property], e.kind).status)
    return { statuses, isWinningGuess: guess.id === answer.id }
  })

  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <DailyHeader mode={mode} onModeChange={changeMode} dayNumber={dayNumber} onHelpClick={() => setShowHowToPlay(true)} />
        {!gameOver && (
          <>
            <GuessInput dataset={typedDataset} guessedIds={guessIds} onGuess={handleGuess} />
            <div className="mt-2 text-sm text-[#4d4d4d]">
              {MAX_GUESSES - guessIds.length} of {MAX_GUESSES} guesses left
            </div>
          </>
        )}
        <div className="mt-4">
          <GuessTable profile={profile} guesses={guesses} answer={answer} />
        </div>
        {gameOver && !showResultModal && (
          <div className="mt-4 text-center">
            <button
              className="rounded-lg border-2 border-[#4d4d4d] bg-white px-4 py-2 font-semibold text-[#4d4d4d] hover:bg-[#f0f0f0]"
              onClick={() => setShowResultModal(true)}
            >
              View Result
            </button>
          </div>
        )}
        {won && showResultModal && (
          <ResultModal
            answer={answer}
            guessCount={guessIds.length}
            dayNumber={dayNumber}
            guessStatusRows={guessStatusRows}
            statistics={mode === "daily" ? statistics : null}
            onClose={() => setShowResultModal(false)}
          />
        )}
        {lost && showResultModal && (
          <LossModal
            answer={answer}
            guessCount={guessIds.length}
            dayNumber={dayNumber}
            guessStatusRows={guessStatusRows}
            statistics={mode === "daily" ? statistics : null}
            onClose={() => setShowResultModal(false)}
          />
        )}
        {mode === "practice" && gameOver && (
          <div className="mt-4 text-center">
            <button
              className="rounded-lg border-2 border-[#00998a] bg-[#00b99b] px-4 py-2 font-semibold text-white hover:bg-[#00a68a]"
              onClick={startNewPractice}
            >
              Play Again
            </button>
          </div>
        )}
        <Footer />
        {showHowToPlay && <HowToPlayModal onClose={closeHowToPlay} />}
      </div>
    </div>
  )
}
