import { useEffect, useMemo, useState } from "react"
import dataset from "../data/celestialObjects.json"
import type { CelestialObject } from "../types/celestial"
import type { ComparisonStatus, DailyGameState, GameMode } from "../types/game"
import { getDailyObject, pickRandomObject, daysSinceEpoch, dateForDayNumber, LAUNCH_DATE } from "../lib/dailyObject"
import { createInitialState, applyGuess, applyHint, applyGiveUp, loadDailyState, saveDailyState } from "../lib/gameState"
import { MAX_GUESSES, MAX_HINTS } from "../lib/gameConstants"
import { getProfileForCategory, getComparableValue } from "../lib/objectProfiles"
import { compareProperty } from "../lib/comparison"
import { getStatistics, recordDailyResult, recordDailyGiveUp, mergeServerStatistics } from "../lib/statistics"
import type { Statistics } from "../lib/statisticsCore"
import { getOrCreatePlayerId } from "../lib/playerId"
import { postResult, getPlayerStats } from "../lib/api"
import { deriveKnowledge, revealKnowledge, describeKnowledge } from "../lib/knowledge"
import { useRevealedHints } from "../lib/useRevealedHints"
import { DailyHeader } from "./DailyHeader"
import { GuessInput } from "./GuessInput"
import { GuessList } from "./GuessList"
import { KnowledgePanel } from "./KnowledgePanel"
import { ObjectHero } from "./ObjectHero"
import { ResultModal } from "./ResultModal"
import { LossModal } from "./LossModal"
import { Footer } from "./Footer"
import { HowToPlayModal } from "./HowToPlayModal"
import { GlobalStatsModal } from "./GlobalStatsModal"
import { ArchiveList } from "./ArchiveList"
import { GameInfo } from "./GameInfo"
import { AdSlot } from "./AdSlot"

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
  const [practiceGaveUp, setPracticeGaveUp] = useState(false)
  const [archiveDayNumber, setArchiveDayNumber] = useState<number | null>(null)
  const [archiveState, setArchiveState] = useState<DailyGameState | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showHowToPlay, setShowHowToPlay] = useState(() => !localStorage.getItem(HOW_TO_PLAY_SEEN_KEY))
  const [showGlobalStats, setShowGlobalStats] = useState(false)
  const [confirmingGiveUp, setConfirmingGiveUp] = useState(false)
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
  const gaveUp = mode === "daily" ? dailyState.gaveUp : mode === "practice" ? practiceGaveUp : archiveState?.gaveUp ?? false
  const lost = !won && (gaveUp || guessIds.length >= MAX_GUESSES)
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

  // Giving up costs the streak and nothing else, so it records a give-up rather than a loss. Practice
  // and archive days carry no streak, so there they only reveal the answer.
  function handleGiveUp() {
    if (gameOver) return
    if (mode === "daily") {
      const { state: next, error } = applyGiveUp(dailyState)
      if (error) return
      setDailyState(next)
      setStatistics(recordDailyGiveUp(todayDayNumber))
      setShowResultModal(true)
      postResult(playerId, todayDayNumber, false, next.guessIds.length, next.hintsUsed, true).then(server => {
        if (server) setStatistics(mergeServerStatistics(server))
      })
    } else if (mode === "archive" && archiveState) {
      const { state: next, error } = applyGiveUp(archiveState)
      if (error) return
      setArchiveState(next)
      setShowResultModal(true)
    } else if (mode === "practice") {
      setPracticeGaveUp(true)
      setShowResultModal(true)
    }
  }

  function startNewPractice() {
    setPracticeAnswer(pickRandomObject(typedDataset))
    setPracticeGuessIds([])
    setPracticeWon(false)
    setPracticeHintsUsed(0)
    setPracticeGaveUp(false)
    setShowResultModal(false)
    setConfirmingGiveUp(false)
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
    setConfirmingGiveUp(false)
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

  // Hints are evidence about the answer just as guesses are, so the panel is built from both.
  const { revealedEntries, hintsLeft, allRevealed } = useRevealedHints({
    profile,
    answer: answer ?? dailyAnswer,
    dataset: typedDataset,
    hintsUsed,
    maxHints: MAX_HINTS,
    correctProperties,
    wrongGuessCount: guessIds.length,
  })

  // What the guesses and hints have established. Once the game is over there is nothing left to
  // deduce, so the same panel switches to the answer's own values and becomes its stat sheet.
  const knowledge = answer
    ? gameOver
      ? revealKnowledge(profile, answer, typedDataset)
      : deriveKnowledge(profile, guesses, answer, typedDataset, revealedEntries.map(e => e.property))
    : []
  const heroStatus = won
    ? `Solved in ${guessIds.length} ${guessIds.length === 1 ? "guess" : "guesses"}`
    : lost
      ? gaveUp
        ? "Gave up"
        : "Out of guesses"
      : `${MAX_GUESSES - guessIds.length} guesses left`

  return (
    <div className="starfield flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 py-8">
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
            <ObjectHero
              clauses={describeKnowledge(knowledge)}
              guessCount={guessIds.length}
              maxGuesses={MAX_GUESSES}
              revealed={gameOver ? answer : null}
              status={heroStatus}
            />
            {!gameOver && <GuessInput dataset={typedDataset} guessedIds={guessIds} onGuess={handleGuess} />}

            {/* The hint control sits on the panel heading because that is what it acts on: spending a
                hint fills in one of these rows. It used to sit above with a chip repeating the value,
                which said the same thing twice. */}
            <div className="mb-1 mt-6 flex items-baseline justify-between gap-3 px-0.5">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8b8598]">
                {gameOver ? answer.name : "What you know"}
              </span>
              {!gameOver && (
                <button
                  className="text-[12.5px] font-semibold text-[#d99a2b] disabled:cursor-not-allowed disabled:text-[#c4bdb0]"
                  onClick={handleUseHint}
                  disabled={hintsLeft <= 0}
                >
                  {allRevealed ? "All hints revealed" : `Reveal a hint · ${hintsLeft}`}
                </button>
              )}
            </div>
            <KnowledgePanel knowledge={knowledge} />

            {guesses.length > 0 && (
              <>
                <div className="mb-1 mt-7 px-0.5">
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8b8598]">
                    Your guesses
                  </span>
                </div>
                <GuessList profile={profile} guesses={guesses} answer={answer} dataset={typedDataset} />
              </>
            )}

            {!gameOver && (
              <div className="mt-7 text-right">
                {confirmingGiveUp ? (
                  <span className="flex flex-wrap items-center justify-end gap-2 text-xs">
                    <span className="text-[#b3405a]">
                      {mode === "daily" ? "This resets your streak. Sure?" : "Reveal the answer?"}
                    </span>
                    <button
                      className="rounded-lg bg-[#b3405a] px-3 py-1.5 font-semibold text-white hover:bg-[#a02c4e]"
                      onClick={handleGiveUp}
                    >
                      Give up
                    </button>
                    <button
                      className="rounded-lg bg-[#2c2742]/8 px-3 py-1.5 font-semibold text-[#2c2742]"
                      onClick={() => setConfirmingGiveUp(false)}
                    >
                      Keep playing
                    </button>
                  </span>
                ) : (
                  <button
                    className="text-[13px] text-[#8b8598] hover:text-[#b3405a]"
                    onClick={() => setConfirmingGiveUp(true)}
                  >
                    I give up
                  </button>
                )}
              </div>
            )}
            {gameOver && !showResultModal && (
              <div className="mt-4 text-center">
                <button
                  className="rounded-xl bg-[#e8a33d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#d9942f]"
                  onClick={() => setShowResultModal(true)}
                >
                  View result
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
                gaveUp={gaveUp}
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
        {/* Outside the board's own conditional so it always renders, same reasons as the ad slot below:
            genuine, non-spoiler text about the game itself, on the same screen the ad occupies rather
            than gated behind a modal like How to Play. */}
        <GameInfo />
        {/* Outside the board's own conditional so the reserved height exists in every mode and from
            the first paint, which is what keeps the layout shift at zero whether an ad ever fills or
            not. Below the guess table, so it can never come between a player and their next guess. */}
        <AdSlot id="board-ad" />
        {/* Before the first guess the board is short, so without this the footer sat halfway up the
            screen on a phone with a screenful of nothing under it. The spacer takes the slack, which
            leaves the footer's own top margin intact once the guess table is tall enough to fill the
            page on its own. */}
        <div className="flex-1" aria-hidden="true" />
        <Footer onGlobalStatsClick={() => setShowGlobalStats(true)} />
        {showHowToPlay && <HowToPlayModal onClose={closeHowToPlay} />}
        {showGlobalStats && <GlobalStatsModal onClose={() => setShowGlobalStats(false)} />}
      </div>
    </div>
  )
}
