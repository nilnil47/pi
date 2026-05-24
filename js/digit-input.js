/**
 * Normalize keyboard input from standard, Hebrew, Arabic, and full-width layouts.
 * Returns a single ASCII digit "0"-"9" or null if not a digit.
 */
const DIGIT_MAP = new Map([
  // Arabic-Indic digits (common on Hebrew/Arabic keyboards)
  ['٠', '0'], ['١', '1'], ['٢', '2'], ['٣', '3'], ['٤', '4'],
  ['٥', '5'], ['٦', '6'], ['٧', '7'], ['٨', '8'], ['٩', '9'],
  // Eastern Arabic-Indic (Persian/Urdu)
  ['۰', '0'], ['۱', '1'], ['۲', '2'], ['۳', '3'], ['۴', '4'],
  ['۵', '5'], ['۶', '6'], ['۷', '7'], ['۸', '8'], ['۹', '9'],
  // Full-width digits
  ['０', '0'], ['１', '1'], ['２', '2'], ['３', '3'], ['４', '4'],
  ['５', '5'], ['６', '6'], ['７', '7'], ['８', '8'], ['９', '9'],
]);

export function normalizeDigit(char) {
  if (!char || char.length === 0) return null;

  const ch = char[char.length - 1];

  if (ch >= '0' && ch <= '9') return ch;

  return DIGIT_MAP.get(ch) ?? null;
}

export function extractDigits(text) {
  const digits = [];
  for (const ch of text) {
    const d = normalizeDigit(ch);
    if (d) digits.push(d);
  }
  return digits;
}

/**
 * Attach digit input handling to a hidden input element.
 * Calls onDigit(digit) for each valid digit entered.
 */
export function attachDigitInput(inputEl, onDigit) {
  function handleValue(raw) {
    const digits = extractDigits(raw);
    inputEl.value = '';
    for (const d of digits) {
      onDigit(d);
    }
  }

  inputEl.addEventListener('input', () => handleValue(inputEl.value));

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      return;
    }

    const digit = normalizeDigit(e.key);
    if (digit) {
      e.preventDefault();
      onDigit(digit);
    }
  });

  inputEl.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text') ?? '';
    handleValue(text);
  });
}

export function focusDigitInput(inputEl) {
  inputEl.focus();
  // iOS needs a slight delay to reliably open the keyboard
  requestAnimationFrame(() => inputEl.focus());
}
