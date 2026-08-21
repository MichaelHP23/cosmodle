import { useEffect, useMemo, useState } from "react"
import dataset from "../data/celestialObjects.json"
import type { CelestialObject } from "../types/celestial"
import type { ComparisonStatus, DailyGameState, GameMode } from "../types/game"
import { getDailyObject, pickRandomObject, daysSinceEpoch, dateForDayNumber, LAUNCH_DATE } from "../lib/dailyObject"
import { createInitialState, applyGuess, applyHint, loadDailyState, saveDailyState, MAX_GUESSES, MAX_HINTS } from "../lib/gameState"
import { getProfileForCategory, getComparableValue } from "../lib/objectProfiles"
import { compareProperty } from "../lib/comparison"
import { getStatistics, recordDailyResult, mergeServerStatistics, type Statistics } from "../lib/statistics"
import { getOrCreatePlayerId } from "../lib/playerId"
import { postResult, getPlayerStats } from "../lib/api"
import { DailyHeader } from "./DailyHeader"
import { GuessInput } from "./GuessInput"
import { GuessTable } from "./GuessTable"
import { ResultModal } from "./ResultModal"
import { LossModal } from "./LossModal"
import { Footer } from "./Footer"
import { HowToPlayModal } from "./HowToPlayModal"
import { GlobalStatsModal } from "./GlobalStatsModal"
import { ArchiveList } from "./ArchiveList"
import { HintPanel } from "./HintPanel"

const typedDataset = dataset as CelestialObject[]
const HOW_TO_PLAY_SEEN_KEY = "cosmodle:hasSeenHowToPlay"

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function GameBoard() {
  const [mode, setMode] = useState<GameMode>("daily")
  const today = useMemo(() => toDateString(new Date()), [])
  const dailyAnswer = useMemo(() => getDailyObject(new Date(), typedDataset), [])
  const todayDayNumber = useMemo(() => daysSinceEpoch(new Date(), LAUNCH_DATE) + 1, [])
  const playerId = useMemo(() => getOrCreatePlayerId(), [])

  const [practiceAnswer, setPracticeAnswer] = useState<CelestialObject>(() => pickRandomObject(typedDataset))
  const [dailyState, setDailyState] = useState<DailyGameState>(() => loadDailyState(today) ?? createInitialState(today))
  const [practiceGuessIds, setPracticeGuessIds] = useState<string[]>([])
  const [practiceWon, setPracticeWon] = useState(false)
  const [practiceHintsUsed, setPracticeHintsUsed] = useState(0)
  const [archiveDayNumber, setArchiveDayNumber] = useState<number | null>(null)
  const [archiveState, setArchiveState] = useState<DailyGameState | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showHowToPlay, setShowHowToPlay] = useState(() => !localStorage.getItem(HOW_TO_PLAY_SEEN_KEY))
  const [showGlobalStats, setShowGlobalStats] = useState(false)
  const [statistics, setStatistics] = useState<Statistics | null>(() => (dailyState.won ? getStatistics() : null))

  function closeHowToPlay() {
    localStorage.setItem(HOW_TO_PLAY_SEEN_KEY, "true")
    setShowHowToPlay(false)
  }

  useEffect(() => {
    if (mode === "daily") saveDailyState(dailyState)
  }, [dailyState, mode])

  useEffect(() => {
    if (mode === "archive" && archiveState) saveDailyState(archiveState)
  }, [archiveState, mode])

  useEffect(() => {
    getPlayerStats(playerId).then(server => {
      if (server) setStatistics(mergeServerStatistics(server))
    })
  }, [playerId])

  const archiveAnswer = useMemo(
    () => (archiveDayNumber !== null ? getDailyObject(dateForDayNumber(archiveDayNumber), typedDataset) : null),
    [archiveDayNumber]
  )

  const answer = mode === "daily" ? dailyAnswer : mode === "practice" ? practiceAnswer : archiveAnswer
  const guessIds = mode === "daily" ? dailyState.guessIds : mode === "practice" ? practiceGuessIds : archiveState?.guessIds ?? []
  const won = mode === "daily" ? dailyState.won : mode === "practice" ? practiceWon : archiveState?.won ?? false
  const lost = guessIds.length >= MAX_GUESSES && !won
  const guesses = guessIds.map(id => typedDataset.find(o => o.id === id)!).filter(Boolean)
  const profile = answer ? getProfileForCategory(answer.category) : []
  const gameOver = won || lost

  function handleGuess(id: string) {
    if (mode === "daily") {
      const { state: next } = applyGuess(dailyState, id, typedDataset, dailyAnswer.id)
      setDailyState(next)
      const justEnded = (next.won || next.guessIds.length >= MAX_GUESSES) && !(dailyState.won || dailyState.guessIds.length >= MAX_GUESSES)
      if (justEnded) {
        setStatistics(recordDailyResult(todayDayNumber, next.won, next.guessIds.length))
        setShowResultModal(true)
        postResult(playerId, todayDayNumber, next.won, next.guessIds.length, next.hintsUsed).then(server => {
          if (server) setStatistics(mergeServerStatistics(server))
        })
      }
    } else if (mode === "practice") {
      if (gameOver || practiceGuessIds.includes(id)) return
      const nextIds = [...practiceGuessIds, id]
      setPracticeGuessIds(nextIds)
      if (id === practiceAnswer.id) setPracticeWon(true)
      if (id === practiceAnswer.id || nextIds.length >= MAX_GUESSES) setShowResultModal(true)
    } else if (mode === "archive" && archiveState && archiveAnswer) {
      const { state: next } = applyGuess(archiveState, id, typedDataset, archiveAnswer.id)
      setArchiveState(next)
      if ((next.won || next.guessIds.length >= MAX_GUESSES) && !(archiveState.won || archiveState.guessIds.length >= MAX_GUESSES)) {
        setShowResultModal(true)
      }
    }
  }

  function handleUseHint() {
    if (mode === "daily") {
      setDailyState(s => applyHint(s).state)
    } else if (mode === "archive") {
      setArchiveState(s => (s ? applyHint(s).state : s))
    } else if (mode === "practice") {
      setPracticeHintsUsed(h => (practiceWon || h >= MAX_HINTS ? h : h + 1))
    }
  }

  function startNewPractice() {
    setPracticeAnswer(pickRandomObject(typedDataset))
    setPracticeGuessIds([])
    setPracticeWon(false)
    setPracticeHintsUsed(0)
    setShowResultModal(false)
  }

  function selectArchiveDay(dayNumber: number) {
    const dateString = toDateString(dateForDayNumber(dayNumber))
    setArchiveDayNumber(dayNumber)
    setArchiveState(loadDailyState(dateString) ?? createInitialState(dateString))
    setShowResultModal(false)
  }

  function backToArchiveList() {
    setArchiveDayNumber(null)
    setArchiveState(null)
  }

  function changeMode(next: GameMode) {
    setMode(next)
    setShowResultModal(false)
    if (next === "practice" && practiceGuessIds.length === 0) startNewPractice()
    if (next === "archive") {
      setArchiveDayNumber(null)
      setArchiveState(null)
    }
  }

  const hintsUsed = mode === "daily" ? dailyState.hintsUsed : mode === "archive" ? archiveState?.hintsUsed ?? 0 : practiceHintsUsed

  const hintableProfile = profile.filter(e => e.property !== "category")
  const guessStatusRows = answer
    ? guesses.map(guess => {
        const statuses: ComparisonStatus[] = hintableProfile.map(
          e =>
            compareProperty(
              getComparableValue(guess, e.property, typedDataset),
              getComparableValue(answer, e.property, typedDataset),
              e.kind
            ).status
        )
        return { statuses, isWinningGuess: guess.id === answer.id }
      })
    : []
  const correctProperties = new Set<string>()
  for (const row of guessStatusRows) {
    row.statuses.forEach((status, i) => {
      if (status === "correct") correctProperties.add(hintableProfile[i].property)
    })
  }

  const displayDayNumber = mode === "archive" ? archiveDayNumber ?? todayDayNumber : todayDayNumber
  const showingArchiveList = mode === "archive" && archiveDayNumber === null

  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <DailyHeader mode={mode} onModeChange={changeMode} dayNumber={displayDayNumber} onHelpClick={() => setShowHowToPlay(true)} />

        {mode === "archive" && (
          <div className="mb-4">
            {archiveDayNumber !== null ? (
              <button
                className="rounded-lg border-2 border-[#4d4d4d] bg-white px-3 py-1 text-sm font-semibold text-[#4d4d4d] hover:bg-[#f0f0f0]"
                onClick={backToArchiveList}
              >
                ‹ Back to Archive
              </button>
            ) : (
              <ArchiveList todayDayNumber={todayDayNumber} onSelect={selectArchiveDay} />
            )}
          </div>
        )}

        {!showingArchiveList && answer && (
          <>
            {!gameOver && (
              <>
                <HintPanel
                  profile={profile}
                  answer={answer}
                  hintsUsed={hintsUsed}
                  dataset={typedDataset}
                  maxHints={MAX_HINTS}
                  onUseHint={handleUseHint}
                  correctProperties={correctProperties}
                />
                <GuessInput dataset={typedDataset} guessedIds={guessIds} onGuess={handleGuess} />
                <div className="mt-2 text-sm text-[#4d4d4d]">
                  {MAX_GUESSES - guessIds.length} of {MAX_GUESSES} guesses left
                </div>
              </>
            )}
            <div className="mt-4 flex justify-center">
              <GuessTable profile={profile} guesses={guesses} answer={answer} dataset={typedDataset} />
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
                dayNumber={displayDayNumber}
                guessStatusRows={guessStatusRows}
                statistics={mode === "daily" ? statistics : null}
                onClose={() => setShowResultModal(false)}
              />
            )}
            {lost && showResultModal && (
              <LossModal
                answer={answer}
                guessCount={guessIds.length}
                dayNumber={displayDayNumber}
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
          </>
        )}
        <Footer onGlobalStatsClick={() => setShowGlobalStats(true)} />
        {showHowToPlay && <HowToPlayModal onClose={closeHowToPlay} />}
        {showGlobalStats && <GlobalStatsModal onClose={() => setShowGlobalStats(false)} />}
      </div>
    </div>
  )
}
