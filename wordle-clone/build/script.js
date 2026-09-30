import { WORDS } from "./words.js";
import { THEMES } from "./themes.js";

const NUMBER_OF_GUESSES = 6;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let rightGuessString = WORDS[Math.floor(Math.random() * WORDS.length)]
console.log(rightGuessString)

const ALL_VALID_WORDS = new Set([
  ...WORDS,
  ...Object.values(THEMES).flatMap((theme) => theme.words || [])
])
let currentTheme = "classic"
let currentMode = "classic"

const TIME_ATTACK_SECONDS = 60
const BONUS_SECONDS_PER_GREEN = 5
let timeLeft = TIME_ATTACK_SECONDS
let timerId = null

const REVEAL_COST = 15
const REMOVE_COST = 10
const STORAGE_KEY = "wordle-clone-progress"
let progress = loadProgress()

let foundGreens = [false, false, false, false, false]
let revealed = [null, null, null, null, null]
let pendingTimeouts = []

const themeSelect = document.getElementById("theme-select")
const modeSelect = document.getElementById("mode-select")
const newGameBtn = document.getElementById("new-game-btn")
const revealBtn = document.getElementById("reveal-btn")
const removeBtn = document.getElementById("remove-btn")
const timerEl = document.getElementById("timer")
const timerTrack = document.getElementById("timer-track")
const timerFill = document.getElementById("timer-fill")
const hintRow = document.getElementById("hint-row")

toastr.options = {
  positionClass: "toast-bottom-center",
  timeOut: 2500,
  preventDuplicates: true
}

function initBoard() {
  let board = document.getElementById("game-board");

  for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
    let row = document.createElement("div")
    row.className = "letter-row"

    for (let j = 0; j < 5; j++) {
      let box = document.createElement("div")
      box.className = "letter-box"
      row.appendChild(box)
    }

    board.appendChild(row)
  }
}

document.addEventListener("keyup", (e) => {
  if (guessesRemaining === 0) {
    return
  }

  let pressedKey = String(e.key)

  const target = e.target
  if (target instanceof HTMLElement) {
    if (target.tagName === "SELECT") {
      return
    }
    if (target.tagName === "BUTTON" && (pressedKey === "Enter" || pressedKey === " ")) {
      return
    }
  }

  if (pressedKey === "Backspace" && nextLetter !== 0) {
    deleteLetter()
    return
  }

  if (pressedKey === "Enter") {
    checkGuess()
    return
  }

  let found = pressedKey.match(/[a-z]/gi)
  if (!found || found.length > 1) {
    return
  } else {
    insertLetter(pressedKey)
  }
})

function insertLetter (pressedKey) {
  if (nextLetter === 5) {
    return
  }
  pressedKey = pressedKey.toLowerCase()

  let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining]
  let box = row.children[nextLetter]
  animateCSS(box, "pulse")
  box.textContent = pressedKey
  box.classList.add("filled-box")
  currentGuess.push(pressedKey)
  nextLetter += 1
}

function deleteLetter () {
  let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining]
  let box = row.children[nextLetter - 1]
  box.textContent = ""
  box.classList.remove("filled-box")
  currentGuess.pop()
  nextLetter -= 1
}

function checkGuess () {
  let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining]
  let guessString = ''
  let rightGuess = Array.from(rightGuessString)

  for (const val of currentGuess) {
    guessString += val
  }

  if (guessString.length != 5) {
    toastr.error("Not enough letters!")
    return
  }

  if (!ALL_VALID_WORDS.has(guessString)) {
    toastr.error("Word not in list!")
    return
  }

  let letterColors = ['grey', 'grey', 'grey', 'grey', 'grey']

  for (let i = 0; i < 5; i++) {
    if (currentGuess[i] === rightGuess[i]) {
      letterColors[i] = 'green'
      rightGuess[i] = "#"
    }
  }

  for (let i = 0; i < 5; i++) {
    if (letterColors[i] === 'green') {
      continue
    }
    let letterPosition = rightGuess.indexOf(currentGuess[i])
    if (letterPosition !== -1) {
      letterColors[i] = 'yellow'
      rightGuess[letterPosition] = "#"
    }
  }

  let newGreens = 0
  for (let i = 0; i < 5; i++) {
    if (letterColors[i] === 'green' && !foundGreens[i]) {
      foundGreens[i] = true
      newGreens += 1
    }
  }

  for (let i = 0; i < 5; i++) {
    let box = row.children[i]
    let letter = currentGuess[i]
    let letterColor = letterColors[i]

    let delay = 250 * i
    const timeoutId = setTimeout(()=> {
      animateCSS(box, 'flipInX')
      box.dataset.state = letterColor
      shadeKeyBoard(letter, letterColor)
    }, delay)
    pendingTimeouts.push(timeoutId)
  }

  if (guessString === rightGuessString) {
    toastr.success("You guessed right! Game over!")
    guessesRemaining = 0
    endGame(true)
    return
  } else {
    guessesRemaining -= 1;
    currentGuess = [];
    nextLetter = 0;

    if (guessesRemaining === 0) {
      toastr.error("You've run out of guesses! Game over!")
      toastr.info(`The right word was: "${rightGuessString}"`)
      endGame(false)
      return
    }

    if (currentMode === "timed" && newGreens > 0) {
      addTime(newGreens * BONUS_SECONDS_PER_GREEN)
    }
  }
}

function shadeKeyBoard(letter, color) {
  for (const elem of document.getElementsByClassName("keyboard-button")) {
    if (elem.textContent === letter) {
      let oldColor = elem.dataset.state
      if (oldColor === 'green') {
        return
      }

      if (oldColor === 'yellow' && color !== 'green') {
        return
      }

      elem.dataset.state = color
      break
    }
  }
}

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
  const target = e.target

  if (!target.classList.contains("keyboard-button")) {
    return
  }
  let key = target.textContent

  if (key === "Del") {
    key = "Backspace"
  }

  target.blur()

  document.dispatchEvent(new KeyboardEvent("keyup", {'key': key}))
})

const animateCSS = (element, animation, prefix = 'animate__') =>
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    const node = element
    node.style.setProperty('--animate-duration', '0.3s');

    node.classList.add(`${prefix}animated`, animationName);

    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
  });

function populateThemeSelect() {
  for (const [key, theme] of Object.entries(THEMES)) {
    const option = document.createElement("option")
    option.value = key
    option.textContent = theme.label
    themeSelect.appendChild(option)
  }
}

function startNewGame(keepWord = false) {
  pendingTimeouts.forEach(clearTimeout)
  pendingTimeouts = []
  stopTimer()

  currentTheme = themeSelect.value
  currentMode = modeSelect.value
  document.body.className = `theme-${currentTheme}`

  if (!keepWord) {
    const pool = THEMES[currentTheme].words || WORDS
    rightGuessString = pool[Math.floor(Math.random() * pool.length)]
    console.log(rightGuessString)
  }

  guessesRemaining = NUMBER_OF_GUESSES
  currentGuess = []
  nextLetter = 0
  foundGreens = [false, false, false, false, false]
  revealed = [null, null, null, null, null]

  document.getElementById("game-board").innerHTML = ""
  initBoard()

  for (const key of document.getElementsByClassName("keyboard-button")) {
    delete key.dataset.state
    key.disabled = false
  }

  renderHints()
  updatePowerupButtons()

  if (currentMode === "timed") {
    startTimer()
  } else {
    timerEl.hidden = true
    timerTrack.hidden = true
  }
}

function endGame(won) {
  stopTimer()
  if (won) {
    recordWin()
  } else {
    recordLoss()
  }
  updatePowerupButtons()
}

newGameBtn.addEventListener("click", () => {
  newGameBtn.blur()
  startNewGame()
})

for (const select of [themeSelect, modeSelect]) {
  select.addEventListener("change", () => {
    select.blur()
    startNewGame()
  })
}

function startTimer() {
  timeLeft = TIME_ATTACK_SECONDS
  timerEl.hidden = false
  timerTrack.hidden = false
  updateTimerUI()

  timerId = setInterval(() => {
    timeLeft -= 1
    updateTimerUI()

    if (timeLeft <= 0) {
      stopTimer()
      if (guessesRemaining > 0) {
        guessesRemaining = 0
        toastr.error("Time's up! Game over!")
        toastr.info(`The right word was: "${rightGuessString}"`)
        recordLoss()
        updatePowerupButtons()
      }
    }
  }, 1000)
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

function addTime(seconds) {
  timeLeft += seconds
  updateTimerUI()
  toastr.info(`+${seconds}s for new green letters`)
}

function updateTimerUI() {
  const shown = Math.max(timeLeft, 0)
  timerEl.textContent = `Time: ${shown}s`
  timerEl.classList.toggle("low", shown <= 10)
  timerFill.style.width = `${Math.min(100, (shown / TIME_ATTACK_SECONDS) * 100)}%`
}

function todayKey() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

function daysBetween(fromKey, toKey) {
  return Math.round((Date.parse(toKey) - Date.parse(fromKey)) / 86400000)
}

function loadProgress() {
  const defaults = { coins: 20, winStreak: 0, dailyStreak: 0, lastWinDay: null }
  let saved = defaults
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      saved = { ...defaults, ...JSON.parse(raw) }
    }
  } catch (err) {
    console.warn("Couldn't load saved progress, starting fresh", err)
  }

  if (saved.lastWinDay && daysBetween(saved.lastWinDay, todayKey()) > 1) {
    saved.dailyStreak = 0
  }
  return saved
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (err) {
    console.warn("Couldn't save progress", err)
  }
  updateStatusBar()
}

function recordWin() {
  progress.winStreak += 1
  let earned = 10 + Math.min(progress.winStreak, 5) * 2

  const today = todayKey()
  if (progress.lastWinDay !== today) {
    const gap = progress.lastWinDay ? daysBetween(progress.lastWinDay, today) : null
    progress.dailyStreak = gap === 1 ? progress.dailyStreak + 1 : 1
    progress.lastWinDay = today
    const dailyBonus = Math.min(progress.dailyStreak, 5) * 5
    earned += dailyBonus
    toastr.info(`Daily streak: ${progress.dailyStreak} day${progress.dailyStreak === 1 ? "" : "s"} (+${dailyBonus} bonus coins)`)
  }

  progress.coins += earned
  saveProgress()
  toastr.success(`+${earned} coins`)
}

function recordLoss() {
  progress.winStreak = 0
  saveProgress()
}

function updateStatusBar() {
  document.getElementById("coins").textContent = `Coins: ${progress.coins}`
  document.getElementById("win-streak").textContent = `Win streak: ${progress.winStreak}`
  document.getElementById("daily-streak").textContent = `Daily streak: ${progress.dailyStreak}`
}

function updatePowerupButtons() {
  const gameOver = guessesRemaining === 0
  revealBtn.disabled = gameOver
  removeBtn.disabled = gameOver
}

function spendCoins(cost) {
  if (progress.coins < cost) {
    toastr.error(`You need ${cost} coins for that. You have ${progress.coins}.`)
    return false
  }
  progress.coins -= cost
  saveProgress()
  return true
}

function renderHints() {
  hintRow.innerHTML = ""
  hintRow.hidden = revealed.every((letter) => letter === null)
  for (const letter of revealed) {
    const slot = document.createElement("span")
    slot.className = "hint-slot"
    slot.textContent = letter || ""
    hintRow.appendChild(slot)
  }
}

revealBtn.addEventListener("click", () => {
  revealBtn.blur()
  if (guessesRemaining === 0) {
    return
  }

  const openSpots = []
  for (let i = 0; i < 5; i++) {
    if (!foundGreens[i] && revealed[i] === null) {
      openSpots.push(i)
    }
  }
  if (openSpots.length === 0) {
    toastr.info("Every letter is already solved or revealed")
    return
  }
  if (!spendCoins(REVEAL_COST)) {
    return
  }

  const spot = openSpots[Math.floor(Math.random() * openSpots.length)]
  const letter = rightGuessString[spot]
  revealed[spot] = letter
  renderHints()
  shadeKeyBoard(letter, 'green')
  toastr.success(`Letter ${spot + 1} is ${letter.toUpperCase()}`)
})

removeBtn.addEventListener("click", () => {
  removeBtn.blur()
  if (guessesRemaining === 0) {
    return
  }

  const candidates = []
  for (const key of document.getElementsByClassName("keyboard-button")) {
    const letter = key.textContent
    if (letter.length === 1 && !rightGuessString.includes(letter) && !key.dataset.state) {
      candidates.push(key)
    }
  }
  if (candidates.length < 2) {
    toastr.info("There aren't two unused letters left to remove")
    return
  }
  if (!spendCoins(REMOVE_COST)) {
    return
  }

  const picked = []
  while (picked.length < 2) {
    const index = Math.floor(Math.random() * candidates.length)
    picked.push(candidates.splice(index, 1)[0])
  }
  for (const key of picked) {
    key.dataset.state = 'grey'
    key.disabled = true
  }
  toastr.success(`Removed ${picked.map((k) => k.textContent.toUpperCase()).join(" and ")}`)
})

populateThemeSelect()
updateStatusBar()
startNewGame(true)
