// login.js - demo login / signup (users.json + localStorage)
let mode = 'login';
let next = new URLSearchParams(location.search).get('next') || 'index.html';
if (!/^[\w-]+\.html$/.test(next)) next = 'index.html';

if (getSession()) location.href = next;

const form = document.getElementById('authForm');
const msg = document.getElementById('authMsg');
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const nameField = document.getElementById('nameField');
const submitBtn = document.getElementById('submitBtn');

function setMode(newMode) {
  mode = newMode;
  tabLogin.classList.toggle('active', mode === 'login');
  tabSignup.classList.toggle('active', mode === 'signup');
  nameField.style.display = mode === 'signup' ? 'block' : 'none';
  submitBtn.textContent = mode === 'signup' ? 'Create account' : 'Log in';
  msg.textContent = '';
}
tabLogin.addEventListener('click', () => setMode('login'));
tabSignup.addEventListener('click', () => setMode('signup'));

function startSession(user, remember) {
  const data = JSON.stringify({ name: user.name, email: user.email });
  if (remember) localStorage.setItem(KEYS.session, data);
  else sessionStorage.setItem(KEYS.session, data);
  location.href = next;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('fullname').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const remember = document.getElementById('remember').checked;

  if (!email || !password) { msg.textContent = 'Please enter email and password.'; return; }

  loadJSON('data/users.json').then(fileUsers => {
    const extraUsers = JSON.parse(localStorage.getItem(KEYS.extraUsers) || '[]');
    const allUsers = fileUsers.concat(extraUsers);

    if (mode === 'login') {
      const user = allUsers.find(u => u.email === email && u.password === password);
      if (!user) { msg.textContent = 'Wrong email or password.'; return; }
      startSession(user, remember);
    } else {
      if (!name) { msg.textContent = 'Please enter your name.'; return; }
      if (password.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; return; }
      if (allUsers.find(u => u.email === email)) { msg.textContent = 'This email is already registered.'; return; }
      const newUser = { name: name, email: email, password: password };
      extraUsers.push(newUser);
      localStorage.setItem(KEYS.extraUsers, JSON.stringify(extraUsers));
      startSession(newUser, remember);
    }
  }).catch(() => showDataError(msg));
});
