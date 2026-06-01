import { getExpectedDigit, isCorrectDigit, TOTAL_DIGITS } from './pi-digits.js';
import { addScore, renderLeaderboard } from './leaderboard.js';
import { attachDigitInput, focusDigitInput } from './digit-input.js';

const MAX_LIVES = 5;
const DIGIT_TIME_SEC = 30;
const MAX_NAME_LENGTH = 10;

export function createGame(rootEl) {
  let playerName = '';
  let position = 0;
  let score = 0;
  let livesRemaining = MAX_LIVES;
  let typedDigits = '';
  let phase = 'name'; // name | playing | gameover | win
  let digitTimerId = null;
  let timeRemaining = DIGIT_TIME_SEC;

  rootEl.innerHTML = `
    <div class="app">
      <header class="header">
        <h1>π Quiz</h1>
        <p class="subtitle">How many digits of π do you know?</p>
      </header>

      <section id="screen-name" class="screen">
        <label for="player-name" class="label">Your name</label>
        <input
          id="player-name"
          type="text"
          class="text-input"
          placeholder="Enter your name (max 10)"
          autocomplete="name"
          maxlength="10"
        />
        <button id="btn-start" class="btn btn-primary" disabled>Start Game</button>
      </section>

      <section id="screen-game" class="screen hidden">
        <div class="hud">
          <div class="hud-item hud-lives">
            <span class="hud-label">Lives</span>
            <span id="hud-lives" class="hud-value lives">${renderLives(MAX_LIVES)}</span>
          </div>
          <div class="hud-item hud-timer">
            <span class="hud-label">Time</span>
            <span id="hud-timer" class="hud-value timer">${DIGIT_TIME_SEC}s</span>
          </div>
        </div>

        <div class="pi-display" id="pi-display" aria-live="polite">
          <span class="pi-start">3.</span><span id="typed-digits" class="typed-digits"></span><span class="cursor" aria-hidden="true">|</span>
          <input
            id="digit-input"
            class="digit-input"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            aria-label="Enter the next digit of pi"
          />
        </div>
      </section>

      <section id="screen-result" class="screen hidden">
        <div id="result-message" class="result-message"></div>
        <p class="result-score">You typed <strong id="final-score">0</strong> correct digits after 3.</p>
        <button id="btn-play-again" class="btn btn-primary">Play Again</button>
      </section>

      <section class="leaderboard-section">
        <h2>Leaderboard</h2>
        <div id="leaderboard"></div>
      </section>
    </div>
  `;

  const els = {
    screenName: rootEl.querySelector('#screen-name'),
    screenGame: rootEl.querySelector('#screen-game'),
    screenResult: rootEl.querySelector('#screen-result'),
    nameInput: rootEl.querySelector('#player-name'),
    btnStart: rootEl.querySelector('#btn-start'),
    hudLives: rootEl.querySelector('#hud-lives'),
    hudTimer: rootEl.querySelector('#hud-timer'),
    typedDigits: rootEl.querySelector('#typed-digits'),
    digitInput: rootEl.querySelector('#digit-input'),
    piDisplay: rootEl.querySelector('#pi-display'),
    resultMessage: rootEl.querySelector('#result-message'),
    finalScore: rootEl.querySelector('#final-score'),
    btnPlayAgain: rootEl.querySelector('#btn-play-again'),
    leaderboard: rootEl.querySelector('#leaderboard'),
  };

  renderLeaderboard(els.leaderboard);

  els.nameInput.addEventListener('input', () => {
    els.btnStart.disabled = els.nameInput.value.trim().length === 0;
  });

  els.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !els.btnStart.disabled) startGame();
  });

  els.btnStart.addEventListener('click', startGame);
  els.btnPlayAgain.addEventListener('click', resetToName);

  els.piDisplay.addEventListener('click', () => focusDigitInput(els.digitInput));

  attachDigitInput(els.digitInput, onDigit);

  function startGame() {
    playerName = els.nameInput.value.trim().slice(0, MAX_NAME_LENGTH);
    if (!playerName) return;

    position = 0;
    score = 0;
    livesRemaining = MAX_LIVES;
    typedDigits = '';
    phase = 'playing';

    showScreen('game');
    updateHud();
    els.typedDigits.textContent = '';

    focusDigitInput(els.digitInput);
    startDigitTimer();
  }

  function onDigit(digit) {
    if (phase !== 'playing') return;

    if (isCorrectDigit(position, digit)) {
      typedDigits += digit;
      position++;
      score++;
      els.typedDigits.textContent = typedDigits;
      updateHud();

      if (score >= TOTAL_DIGITS) {
        endGame(true);
      } else {
        startDigitTimer();
      }
    } else {
      loseLife();
      if (phase === 'playing') {
        startDigitTimer();
      }
    }

    focusDigitInput(els.digitInput);
  }

  function startDigitTimer() {
    stopDigitTimer();
    timeRemaining = DIGIT_TIME_SEC;
    updateTimerHud();

    digitTimerId = setInterval(() => {
      timeRemaining--;
      updateTimerHud();

      if (timeRemaining <= 0) {
        onDigitTimeout();
      }
    }, 1000);
  }

  function stopDigitTimer() {
    if (digitTimerId !== null) {
      clearInterval(digitTimerId);
      digitTimerId = null;
    }
  }

  function onDigitTimeout() {
    if (phase !== 'playing') return;

    loseLife();
    if (phase !== 'playing') return;

    startDigitTimer();
    focusDigitInput(els.digitInput);
  }

  function updateTimerHud() {
    els.hudTimer.textContent = `${timeRemaining}s`;
    els.hudTimer.classList.toggle('timer-low', timeRemaining <= 10);
    els.hudTimer.classList.toggle('timer-critical', timeRemaining <= 5);
  }

  async function endGame(won) {
    phase = won ? 'win' : 'gameover';
    stopDigitTimer();
    els.digitInput.blur();

    await addScore(playerName, score);
    await renderLeaderboard(els.leaderboard);

    els.finalScore.textContent = score;
    els.resultMessage.textContent = won
      ? `🎉 Amazing! You completed all ${TOTAL_DIGITS} digits!`
      : `Game over, ${playerName}. You're out of lives.`;
    els.resultMessage.className = won ? 'result-message win' : 'result-message lose';

    showScreen('result');
  }

  function resetToName() {
    stopDigitTimer();
    phase = 'name';
    els.nameInput.value = playerName;
    els.btnStart.disabled = playerName.length === 0;
    showScreen('name');
    els.nameInput.focus();
  }

  function loseLife() {
    if (phase !== 'playing') return;

    livesRemaining--;
    updateHud();

    if (livesRemaining <= 0) {
      endGame(false);
    }
  }

  function updateHud() {
    els.hudLives.innerHTML = renderLives(livesRemaining);
  }

  function showScreen(name) {
    els.screenName.classList.toggle('hidden', name !== 'name');
    els.screenGame.classList.toggle('hidden', name !== 'game');
    els.screenResult.classList.toggle('hidden', name !== 'result');
  }

  els.nameInput.focus();
}

function renderLives(livesRemaining) {
  return Array.from({ length: MAX_LIVES }, (_, i) =>
    `<span class="life ${i < livesRemaining ? 'life-remaining' : 'life-lost'}">♥</span>`
  ).join('');
}
