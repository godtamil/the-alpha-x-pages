const form = document.querySelector('#application-form');
const message = document.querySelector('#form-message');
const gameSelect = form.elements.favouriteGame;
const otherGame = document.querySelector('#other-game-field');

document.querySelector('.menu-toggle').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const open = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!open));
  document.querySelector('#site-nav').classList.toggle('open', !open);
});
document.querySelectorAll('#site-nav a').forEach((link) => link.addEventListener('click', () => {
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
  document.querySelector('#site-nav').classList.remove('open');
}));

gameSelect.addEventListener('change', () => {
  const isOther = gameSelect.value === 'Other';
  otherGame.hidden = !isOther;
  otherGame.querySelector('input').required = isOther;
});

function setError(input, text) {
  const field = input.closest('.field');
  field.classList.toggle('invalid', Boolean(text));
  field.querySelector('.field-error').textContent = text || '';
  input.setAttribute('aria-invalid', text ? 'true' : 'false');
}
function validate() {
  let firstInvalid = null;
  const fields = [form.elements.fullName, form.elements.whatsapp, gameSelect, form.elements.otherGame, form.elements.reason];
  for (const input of fields) {
    if (input === form.elements.otherGame && gameSelect.value !== 'Other') continue;
    let error = '';
    if (input.required && !input.value.trim()) error = 'This field is required.';
    if (input === form.elements.fullName && input.value.trim().length < 2) error = 'Please enter at least 2 characters.';
    if (input === form.elements.whatsapp && input.value.trim() && !/^\+[1-9][\d\s().-]{7,20}$/.test(input.value.trim())) error = 'Include your country code, like +919876543210.';
    if (input === form.elements.reason && input.value.trim().length < 10) error = 'Please write at least 10 characters.';
    setError(input, error);
    if (error && !firstInvalid) firstInvalid = input;
  }
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;
  if (!validate()) return;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.querySelector('span:first-child').textContent = 'SENDING…';
  try {
    const values = Object.fromEntries(new FormData(form).entries());
    const response = await fetch('https://the-alpha-x-gang.harinash12346.chatgpt.site/api/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'We could not send your application. Please try again.');
    form.reset();
    otherGame.hidden = true;
    otherGame.querySelector('input').required = false;
    message.className = 'form-message';
    message.textContent = result.message;
    message.hidden = false;
  } catch (error) {
    message.className = 'form-message error';
    message.textContent = error.message || 'The application service is unavailable. Your application was not sent.';
    message.hidden = false;
  } finally {
    button.disabled = false;
    button.querySelector('span:first-child').textContent = 'SUBMIT APPLICATION';
  }
});

form.querySelectorAll('input,select,textarea').forEach((input) => input.addEventListener('input', () => {
  if (input.closest('.field')?.classList.contains('invalid')) setError(input, '');
}));
