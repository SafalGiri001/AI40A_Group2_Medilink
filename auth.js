// MediLink front-end authentication (demo only: real security needs a server).
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const TIMEOUT_MINUTES = 15;

// ---------- helpers ----------
async function hash(text) {                       // Requirement 1: passwords are hashed (SHA-256)
  const bytes = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const read = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function logEvent(text) {                         // Requirement 3: failed attempts are logged
  const log = read("authLog", []);
  log.push(new Date().toISOString() + " " + text);
  write("authLog", log);
}

// ---------- session timeout (Requirement 4) ----------
function startSession(email) {
  sessionStorage.setItem("user", email);
  sessionStorage.setItem("lastActive", Date.now());
}
function requireLogin() {                         // call this on every protected page
  const last = Number(sessionStorage.getItem("lastActive"));
  const expired = Date.now() - last > TIMEOUT_MINUTES * 60 * 1000;
  if (!sessionStorage.getItem("user") || expired) {
    sessionStorage.clear();
    location.href = "login.html";
    return;
  }
  ["click", "keydown", "mousemove"].forEach(e =>
    document.addEventListener(e, () => sessionStorage.setItem("lastActive", Date.now())));
  setInterval(requireLogin, 30000);
}
function logout() { sessionStorage.clear(); location.href = "login.html"; }

// ---------- login page ----------
const form = document.getElementById("loginForm");
if (form) {
  const msg = document.getElementById("msg");
  const pw = document.getElementById("password");

  document.getElementById("toggle").onclick = e => {
    const show = pw.type === "password";
    pw.type = show ? "text" : "password";
    e.currentTarget.classList.toggle("on", show);
  };

  form.onsubmit = async e => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = pw.value;
    msg.className = "";

    if (!/^\S+@\S+\.\S+$/.test(email)) return (msg.textContent = "Enter a valid email address.");
    if (!password) return (msg.textContent = "Enter your password.");

    // Requirement 3: block after too many failures
    const fails = read("fails", {});
    const f = fails[email] || { count: 0, until: 0 };
    if (Date.now() < f.until) {
      logEvent("Blocked attempt on locked account " + email);
      return (msg.textContent = "Account locked. Try again in " +
        Math.ceil((f.until - Date.now()) / 60000) + " minutes.");
    }

    const users = read("users", {});
    if (users[email] && users[email] === await hash(password)) {
      delete fails[email]; write("fails", fails);
      if (read("mfaUsers", {})[email]) { startMfa(email); return; }   // MFA enabled -> code page
      startSession(email);
      location.href = "index.html";               // change to your dashboard page
      return;
    }

    f.count += 1;
    if (f.count >= MAX_ATTEMPTS) { f.until = Date.now() + LOCK_MINUTES * 60000; f.count = 0; }
    fails[email] = f; write("fails", fails);
    logEvent("Failed login for " + email);
    msg.textContent = "Wrong email or password.";
  };
}

// Demo account so you can test: medilink@example.com / Medi@1234
(async () => {
  const users = read("users", {});
  if (!users["medilink@example.com"]) {
    users["medilink@example.com"] = await hash("Medi@1234");
    write("users", users);
  }
})();

// ---------- sign up page ----------
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  const msg = document.getElementById("msg");

  signupForm.onsubmit = async e => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;
    msg.className = "";

    if (!name) return (msg.textContent = "Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return (msg.textContent = "Enter a valid email address.");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password))
      return (msg.textContent = "Password needs 8+ characters with upper case, lower case and a number.");
    if (password !== confirm) return (msg.textContent = "Passwords do not match.");

    const users = read("users", {});
    if (users[email]) return (msg.textContent = "An account with this email already exists.");

    users[email] = await hash(password);          // store only the hash, never the password
    write("users", users);
    if (document.getElementById("mfa").checked) {
      const m = read("mfaUsers", {}); m[email] = true; write("mfaUsers", m);
    }
    msg.className = "ok";
    msg.textContent = "Account created! Redirecting to login...";
    setTimeout(() => (location.href = "login.html"), 1200);
  };
}

// ---------- optional MFA (Requirement 2) ----------
function newCode(email) {
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
  sessionStorage.setItem("mfa", JSON.stringify({ email, code, expires: Date.now() + 5 * 60000, tries: 0 }));
  return code;
}
function startMfa(email) { newCode(email); location.href = "mfa.html"; }

const mfaForm = document.getElementById("mfaForm");
if (mfaForm) {
  const msg = document.getElementById("msg");
  const demo = document.getElementById("demoCode");
  const pending = () => JSON.parse(sessionStorage.getItem("mfa") || "null");

  if (!pending()) location.href = "login.html";   // nothing to verify
  else demo.textContent = pending().code;         // DEMO ONLY: a real app emails or texts this code

  document.getElementById("resend").onclick = e => {
    e.preventDefault();
    demo.textContent = newCode(pending().email);
    msg.className = "ok"; msg.textContent = "New code sent.";
  };

  mfaForm.onsubmit = e => {
    e.preventDefault();
    const p = pending();
    const entered = document.getElementById("code").value.trim();
    msg.className = "";
    if (Date.now() > p.expires) { msg.textContent = "Code expired. Send a new code."; return; }
    if (entered === p.code) {
      sessionStorage.removeItem("mfa");
      startSession(p.email);
      location.href = "index.html";               // change to your dashboard page
      return;
    }
    p.tries += 1;
    logEvent("Wrong MFA code for " + p.email);
    if (p.tries >= 3) { sessionStorage.removeItem("mfa"); location.href = "login.html"; return; }
    sessionStorage.setItem("mfa", JSON.stringify(p));
    msg.textContent = "Wrong code. " + (3 - p.tries) + " tries left.";
  };
}