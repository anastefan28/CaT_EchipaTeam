document.addEventListener('DOMContentLoaded', () => {
	loadUserData();
});

async function loadUserData() {
  try {
    const res = await fetch('/api/me');
    switch (res.status) {
	case 200:                          
		user = await res.json();
        break;
      case 401:
        throw new Error('Unauthorized – please sign in');
      case 404:
        throw new Error('User not found');
      case 500:
        throw new Error('Server had an issue');
    }
    document.getElementById('email').value= user.email;
    document.getElementById('username').value= user.username || '';
    document.getElementById('statusBadge').innerHTML =
      `<span class="status-badge status-${user.role}">${capitalize(user.role)}</span>`;
    document.getElementById('memberSince').textContent =
      new Date(user.created_at).toLocaleDateString();
    document.getElementById('accountType').innerHTML =
      `${user.oauth_provider ? 'OAuth' : 'Regular'} <span class="oauth-badge">${user.oauth_provider || 'Local'}</span>`;
    document.getElementById('userId').textContent = user.id;
  } catch (err) {
    console.error('Error loading user data:', err);
    window.location.href = '/index';
  }
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

document.getElementById('profileForm').addEventListener('submit', async (e) => {
	e.preventDefault();

	const formData = {
		username: document.getElementById('username').value
	};

	try {
		const res = await fetch('/api/me', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include', 
			body: JSON.stringify(formData)
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.error || 'Update failed');
		}

		const result = await res.json();
		console.log('Profile update:', result);
		showMessage('Profile updated successfully!', 'success');
	} catch (err) {
		console.error('Error updating profile:', err.message);
		showMessage(`⚠️ ${err.message}`, 'error');
	}
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
