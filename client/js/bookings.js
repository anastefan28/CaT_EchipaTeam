const fmt = d => d.toLocaleDateString('en-US',
  { year: 'numeric', month: 'short', day: 'numeric' });
const longStatus = (ci, co) => ci > Date.now() ? '🔮 Upcoming' : co < Date.now() ? '✅ Completed' : '🏕️ Active';
async function api(path, opt = {}) {
  const res = await fetch(path, { credentials: 'include', ...opt });
  if (res.ok) return res.json();
  if (res.status === 401) return location.replace('/index');
  const { errors = [res.statusText] } = await res.json().catch(() => ({}));
  throw new Error(errors.join(', '));
}

function card(b) {
  const node = document.getElementById('tpl-booking-card').content.cloneNode(true);

  const ci = new Date(b.checkin);
  const co = new Date(b.checkout);
  const nights = Math.ceil((co - ci) / 86_400_000);

  node.querySelector('.booking-title').textContent = b.campsite_name;
  node.querySelector('.date-range').textContent =
    `📅 ${fmt(ci)} → ${fmt(co)} (${nights} night${nights !== 1 ? 's' : ''})`;

  node.querySelector('.guests').textContent = `👥 ${b.guests}`;
  node.querySelector('.booked-on').textContent = `📝 ${fmt(new Date(b.created_at))}`;
  node.querySelector('.status-long').textContent = longStatus(ci, co);

  const view = node.querySelector('.view-btn');
  const delet = node.querySelector('.delete-btn');

  if (b.campsite_id) view.addEventListener('click',
    () => location.href = `/campsite?id=${b.campsite_id}`);
  else view.remove();

  if (b.status === 'confirmed' && ci > Date.now())
    delet.addEventListener('click', async () => {
      if (!confirm(`Cancel booking at ${b.campsite_name}?`)) return;
      try {
        const res = await fetch(`/api/bookings/${b.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
        loadBookings();
      } catch (err) {
        console.error(err);
        showMessage(`${err.message}`, 'error');
      }
    });
  else delet.remove();

  return node;
}

function emptyState(title, msg, href = '', cta = '') {
  const n = document.getElementById('tpl-empty').content.cloneNode(true);
  n.querySelector('.title').textContent = title;
  n.querySelector('.msg').textContent = msg;
  const link = n.querySelector('.cta');
  if (href) link.href = href; else link.removeAttribute('href');
  link.textContent = cta;
  return n;
}

async function loadBookings() {
  const box = document.querySelector('#bookingsContainer');
  box.innerHTML = '<div class="loading">Loading your bookings…</div>';
  try {
    const bookings = await api('/api/me/bookings');
    box.innerHTML = '';

    if (!bookings.length) {
      box.append(emptyState(
        'No bookings yet',
        'Ready for a camping adventure? Browse our amazing campsites!',
        '/campsites', 'Explore Campsites'));
      return;
    }
    bookings.forEach(b => box.append(card(b)));

  } catch (err) {
    console.error(err);
    box.replaceChildren(emptyState(
      'Unable to load bookings',
      'Please try again later or contact support.',
      '', 'Try Again'));
    box.querySelector('.cta').addEventListener('click', loadBookings);
  }
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

loadBookings();