document.addEventListener('DOMContentLoaded', () => {
	loadUserData();
});

async function loadUserData() {

	const res = await fetch('/api/me');

	if (!res.ok) {
		console.error('Failed to load user data:', res.status, res.statusText);
		return window.location.href = '/index';
	}

	const user = await res.json();
	console.log('User loaded:', user);

	document.getElementById('email').value = user.email;
	document.getElementById('username').value = user.username || '';

	document.getElementById('statusBadge').innerHTML =
		`<span class="status-badge status-${user.role}">${capitalize(user.role)}</span>`;

	document.getElementById('memberSince').textContent =
		new Date(user.created_at).toLocaleDateString();

	document.getElementById('accountType').innerHTML =
		`${user.oauth_provider ? 'OAuth' : 'Regular'} <span class="oauth-badge">${user.oauth_provider || 'Local'}</span>`;

	document.getElementById('userId').textContent = user.id;
}

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (!res.ok) throw new Error('Logout failed');
  } catch (err) {
    console.warn('Logout request failed:', err);
  }
  window.location.href = '/index';
});

document.getElementById('profileForm').addEventListener('submit', (e) => {
	e.preventDefault();

	const formData = {
		username: document.getElementById('username').value
	};

	 //TO DO 
	console.log('Profile update:', formData);
	showMessage('Profile updated successfully!', 'success');
});

function showMessage(message, type) {
	const existingMessages = document.querySelectorAll('.success-message, .error-message');
	existingMessages.forEach(msg => msg.remove());

	const messageDiv = document.createElement('div');
	messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
	messageDiv.textContent = message;

	const mainContainer = document.querySelector('.main-container');
	mainContainer.insertBefore(messageDiv, mainContainer.firstChild);

	setTimeout(() => messageDiv.remove(), 5000);
}
