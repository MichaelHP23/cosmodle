import { useEffect, useMemo, useState } from "react"
import dataset from "../data/celestialObjects.json"
import type { CelestialObject } from "../types/celestial"
import type { ComparisonStatus, DailyGameState, GameMode } from "../types/game"
import { getDailyObject, pickRandomObject, daysSinceEpoch, LAUNCH_DATE } from "../lib/dailyObject"
import { createInitialState, applyGuess, loadDailyState, saveDailyState } from "../lib/gameState"
import { getProfileForCategory } from "../lib/objectProfiles"
import { compareProperty } from "../lib/comparison"
import { DailyHeader } from "./DailyHeader"
import { GuessInput } from "./GuessInput"
import { GuessRow } from "./GuessRow"
import { ResultModal } from "./ResultModal"

const typedDataset = dataset as CelestialObject[]

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

  useEffect(() => {
    if (mode === "daily") saveDailyState(dailyState)
  }, [dailyState, mode])

  const answer = mode === "daily" ? dailyAnswer : practiceAnswer
  const guessIds = mode === "daily" ? dailyState.guessIds : practiceGuessIds
  const won = mode === "daily" ? dailyState.won : practiceWon
  const guesses = guessIds.map(id => typedDataset.find(o => o.id === id)!).filter(Boolean)

  function handleGuess(id: string) {
    if (mode === "daily") {
      const { state: next } = applyGuess(dailyState, id, typedDataset, dailyAnswer.id)
      setDailyState(next)
      if (next.won) setShowResultModal(true)
    } else {
      if (won || practiceGuessIds.includes(id)) return
      setPracticeGuessIds([...practiceGuessIds, id])
      if (id === practiceAnswer.id) {
        setPracticeWon(true)
        setShowResultModal(true)
      }
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
    const profile = getProfileForCategory(guess.category)
    const statuses: ComparisonStatus[] = profile
      .filter(e => e.property !== "category")
      .map(e => compareProperty((guess as any)[e.property], (answer as any)[e.property], e.kind).status)
    return { statuses, isWinningGuess: guess.id === answer.id }
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <DailyHeader mode={mode} onModeChange={changeMode} dayNumber={dayNumber} />
      {!won && <GuessInput dataset={typedDataset} guessedIds={guessIds} onGuess={handleGuess} />}
      <div className="mt-6">
        {[...guesses].reverse().map(guess => (
          <GuessRow key={guess.id} guess={guess} answer={answer} />
        ))}
      </div>
      {won && !showResultModal && (
        <div className="mt-4 text-center">
          <button
            className="rounded bg-slate-700 px-4 py-2 text-slate-100"
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
          onClose={() => setShowResultModal(false)}
        />
      )}
      {mode === "practice" && won && (
        <div className="mt-4 text-center">
          <button className="rounded bg-slate-700 px-4 py-2 text-slate-100" onClick={startNewPractice}>
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}
