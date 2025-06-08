const loginToggle = document.getElementById('loginToggle');
const registerToggle = document.getElementById('registerToggle');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

loginToggle.addEventListener('click', () => {
    loginToggle.classList.add('active');
    registerToggle.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

registerToggle.addEventListener('click', () => {
    registerToggle.classList.add('active');
    loginToggle.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

// Google OAuth simulation
document.getElementById('googleLogin').addEventListener('click', () => {
    window.location.href = '/api/auth/google'; 
});

document.getElementById('googleRegister').addEventListener('click', () => {
    window.location.href = '/api/auth/google';
});
// Form submissions
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    loginError.textContent = '';

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      window.location.href = '/dashboard'; 
    } else {
        const data = await res.json();
        loginError.textContent = data.error || 'Login failed. Try again.';
        loginError.classList.remove('hidden');    
    }
  } catch (err) {
    loginError.textContent = 'Server error. Please try again later.';
    loginError.classList.remove('hidden');
  }
});
const registerError = document.getElementById('registerError');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.classList.add('hidden');
    registerError.textContent = '';

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        registerError.textContent = 'Passwords do not match.';
        registerError.classList.remove('hidden');
        return;
    }

    try {
        const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, email, password }),
        });

        if (res.ok) {
        window.location.href = '/dashboard';
        } else {
        const data = await res.json();
        registerError.textContent = data.error || 'Registration failed.';
        registerError.classList.remove('hidden');
        }
    } catch {
        registerError.textContent = 'Server error. Please try again later.';
        registerError.classList.remove('hidden');
    }
});

// Forgot password
document.getElementById('forgotPassword').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Password reset functionality would be implemented here.');
});