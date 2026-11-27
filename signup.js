lucide.createIcons();

const form = document.getElementById('signupForm');
const passwordInput = document.getElementById('password');
const togglePwdBtn = document.getElementById('togglePwd');
const duplicateAlert = document.getElementById('duplicateAlert');
const successAlert = document.getElementById('successAlert');

const registeredUsers = [
  { email: 'user@medilink.com', username: 'medilink_user' },
  { email: 'doctor@medilink.com', username: 'dr_smith' }
];

togglePwdBtn.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePwdBtn.innerHTML = `<i data-lucide="${isPassword ? 'eye' : 'eye-off'}"></i>`;
  lucide.createIcons();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  duplicateAlert.hidden = true;
  successAlert.hidden = true;
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');

  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const username = document.getElementById('username').value.trim().toLowerCase();
  const password = passwordInput.value;
  const termsAccepted = document.getElementById('terms').checked;

  let isValid = true;

  if (!fullName) {
    document.getElementById('nameError').textContent = 'Full name is required.';
    isValid = false;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('emailError').textContent = 'Please enter a valid email address.';
    isValid = false;
  }

  if (!username || username.length < 3) {
    document.getElementById('usernameError').textContent = 'Username must be at least 3 characters.';
    isValid = false;
  }

  if (!password || password.length < 8) {
    document.getElementById('passwordError').textContent = 'Password must be at least 8 characters.';
    isValid = false;
  }

  if (!termsAccepted) {
    document.getElementById('termsError').textContent = 'You must agree to the Terms and Privacy Policy.';
    isValid = false;
  }

  if (!isValid) return;

  const isDuplicate = registeredUsers.some(
    user => user.email === email || user.username === username
  );

  if (isDuplicate) {
    duplicateAlert.hidden = false;
    return;
  }

  registeredUsers.push({ email, username });
  successAlert.hidden = false;
  form.reset();
});