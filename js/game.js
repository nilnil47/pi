import { getExpectedDigit, isCorrectDigit, TOTAL_DIGITS } from './pi-digits.js';
import { addScore, renderLeaderboard } from './leaderboard.js';
import { attachDigitInput, focusDigitInput } from './digit-input.js';

const MAX_WRONG = 3;

export function createGame(rootEl) {
  let playerName = '';
  let position = 0;
  let score = 0;
  let wrongCount = 0;
  let typedDigits = '';
  let phase = 'name'; // name | playing | gameover | win

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
          placeholder="Enter your name"
          autocomplete="name"
          maxlength="30"
        />
        <button id="btn-start" class="btn btn-primary" disabled>Start Game</button>
      </section>

      <section id="screen-game" class="screen hidden">
        <div class="hud">
          <div class="hud-item">
            <span class="hud-label">Player</span>
            <span id="hud-name" class="hud-value"></span>
          </div>
          <div class="hud-item">
            <span class="hud-label">Progress</span>
            <span id="hud-progress" class="hud-value">0 / ${TOTAL_DIGITS}</span>
          </div>
          <div class="hud-item hud-strikes">
            <span class="hud-label">Wrong</span>
            <span id="hud-strikes" class="hud-value strikes">${renderStrikes(0)}</span>
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

        <p class="hint">Tap the digits area — use the number row on your keyboard (works with Hebrew keyboard too)</p>

        <div id="feedback" class="feedback" aria-live="assertive"></div>
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
    hudName: rootEl.querySelector('#hud-name'),
    hudProgress: rootEl.querySelector('#hud-progress'),
    hudStrikes: rootEl.querySelector('#hud-strikes'),
    typedDigits: rootEl.querySelector('#typed-digits'),
    digitInput: rootEl.querySelector('#digit-input'),
    piDisplay: rootEl.querySelector('#pi-display'),
    feedback: rootEl.querySelector('#feedback'),
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
    playerName = els.nameInput.value.trim();
    if (!playerName) return;

    position = 0;
    score = 0;
    wrongCount = 0;
    typedDigits = '';
    phase = 'playing';

    showScreen('game');
    els.hudName.textContent = playerName;
    updateHud();
    els.typedDigits.textContent = '';
    els.feedback.textContent = '';
    els.feedback.className = 'feedback';

    focusDigitInput(els.digitInput);
  }

  function onDigit(digit) {
    if (phase !== 'playing') return;

    if (isCorrectDigit(position, digit)) {
      typedDigits += digit;
      position++;
      score++;
      els.typedDigits.textContent = typedDigits;
      flashFeedback('correct', '✓');
      updateHud();

      if (score >= TOTAL_DIGITS) {
        endGame(true);
      }
    } else {
      wrongCount++;
      updateHud();
      flashFeedback('wrong', '✗ Wrong!');

      if (wrongCount >= MAX_WRONG) {
        endGame(false);
      }
    }

    focusDigitInput(els.digitInput);
  }

  function endGame(won) {
    phase = won ? 'win' : 'gameover';
    els.digitInput.blur();

    addScore(playerName, score);
    renderLeaderboard(els.leaderboard);

    els.finalScore.textContent = score;
    els.resultMessage.textContent = won
      ? '🎉 Amazing! You completed all 1000 digits!'
      : `Game over, ${playerName}. You ran out of guesses.`;
    els.resultMessage.className = won ? 'result-message win' : 'result-message lose';

    showScreen('result');
  }

  function resetToName() {
    phase = 'name';
    els.nameInput.value = playerName;
    els.btnStart.disabled = playerName.length === 0;
    showScreen('name');
    els.nameInput.focus();
  }

  function updateHud() {
    els.hudProgress.textContent = `${score} / ${TOTAL_DIGITS}`;
    els.hudStrikes.innerHTML = renderStrikes(wrongCount);
  }

  function flashFeedback(type, text) {
    els.feedback.textContent = text;
    els.feedback.className = `feedback feedback-${type}`;
  }

  function showScreen(name) {
    els.screenName.classList.toggle('hidden', name !== 'name');
    els.screenGame.classList.toggle('hidden', name !== 'game');
    els.screenResult.classList.toggle('hidden', name !== 'result');
  }

  els.nameInput.focus();
}

function renderStrikes(count) {
  return Array.from({ length: MAX_WRONG }, (_, i) =>
    `<span class="strike ${i < count ? 'strike-used' : ''}">●</span>`
  ).join('');
}
