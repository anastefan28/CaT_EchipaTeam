const $      = sel => document.querySelector(sel);
const tmpl   = id  => document.getElementById(id).content;
const fmt    = d  => d.toLocaleDateString('en-US',
                    { year:'numeric', month:'short', day:'numeric' });
const longStatus = (ci, co) =>ci > Date.now() ? '🔮 Upcoming'
      : co < Date.now() ? '✅ Completed': '🏕️ Active';
async function api(path, opt = {}) {
  const res = await fetch(path, { credentials: 'include', ...opt });
  if (res.ok) return res.json();
  if (res.status === 401) return location.replace('/index');
  const { errors = [res.statusText] } = await res.json().catch(() => ({}));
  throw new Error(errors.join(', '));
}
function card(b) {
  const node = tmpl('tpl-booking-card').cloneNode(true);

  const ci = new Date(b.checkin  || b.period.slice(1).split(',')[0]);
  const co = new Date(b.checkout || b.period.split(',')[1].slice(0, -1));
  const nights = Math.ceil((co - ci) / 86_400_000);

  node.querySelector('.booking-title').textContent = b.campsite_name || b.name || 'Campsite';
  node.querySelector('.booking-id').textContent    = `Booking #${b.id.slice(0,8)}`;
  node.querySelector('.booking-status').textContent= b.status;
  node.querySelector('.date-range').textContent    =
      `📅 ${fmt(ci)} → ${fmt(co)} (${nights} night${nights!==1?'s':''})`;

  node.querySelector('.guests').textContent     = `👥 ${b.guests}`;
  node.querySelector('.booked-on').textContent  = `📝 ${fmt(new Date(b.created_at))}`;
  node.querySelector('.status-long').textContent= longStatus(ci, co);

  const view   = node.querySelector('.view-btn');
  const manage = node.querySelector('.manage-btn');

  if (b.campsite_id) view.addEventListener('click',
      () => location.href = `/campsite?id=${b.campsite_id}`);
  else view.remove();

  if (b.status === 'confirmed' && ci > Date.now())
      manage.addEventListener('click',
        () => alert(`Booking management coming soon for #${b.id}`));
  else manage.remove();

  return node;
}

function emptyState(title, msg, href = '', cta = '') {
  const n = tmpl('tpl-empty').cloneNode(true);
  n.querySelector('.title').textContent = title;
  n.querySelector('.msg').textContent   = msg;
  const link = n.querySelector('.cta');
  if (href) link.href = href; else link.removeAttribute('href');
  link.textContent = cta;
  return n;
}

async function loadBookings() {
  const box = $('#bookingsContainer');
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

$('#logoutBtn').addEventListener('click', async e => {
  e.preventDefault();
  try { await fetch('/api/auth/logout', { method:'POST' }); } catch {}
  location.href = '/index';
});

loadBookings();