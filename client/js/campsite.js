const campId = new URLSearchParams(location.search).get('id');
const MAX_SIZE = 5 * 1024 * 1024;
let getRating;
async function api(path, opt = {}) {
  const res = await fetch(path, { credentials: 'include', ...opt });
  if (res.ok) return res.json();
  if (res.status === 401) return location.replace('/index');
  const { errors = [res.statusText] } = await res.json().catch(() => ({}));
  throw new Error(errors.join(', '));
}

const el = {
  name: document.querySelector('#campsiteName'),
  location: document.querySelector('#campsiteRegion'),
  type: document.querySelector('#campsiteType'),
  desc: document.querySelector('#campsiteDescription'),
  capacity: document.querySelector('#campsiteCapacity'),
  coords: document.querySelector('#campsiteCoords'),
  price: document.querySelector('#campsitePrice'),
  stars: document.querySelector('#ratingStars'),
  score: document.querySelector('#ratingScore'),
  count: document.querySelector('#ratingCount'),

  amenGrid: document.querySelector('#amenitiesGrid'),
  guestSelect: document.querySelector('#guestCount'),

  mainImg: document.querySelector('#mainImage'),
  prev: document.querySelector('#prevBtn'),
  next: document.querySelector('#nextBtn'),

  reviewsWrap: document.querySelector('#reviewsList'),
  chatWrap: document.querySelector('#chatMessages')
};

function renderCampsite(c) {
  el.name.textContent = c.name;
  el.location.textContent = `${c.county} County`;
  el.type.textContent = c.type.toUpperCase();
  el.desc.textContent = c.description ?? '';
  el.capacity.textContent = `Up to ${c.capacity} guests`;
  el.coords.textContent = `${c.lat}, ${c.lon}`;
  el.price.textContent = `RON ${(+c.price).toFixed(2)}`;

  el.stars.textContent = '⭐'.repeat(Math.round(c.avg_rating));
  el.score.textContent = (+c.avg_rating).toFixed(1);
  el.count.textContent = `(${c.review_count} reviews)`;

  el.amenGrid.replaceChildren();
  (c.amenities ?? []).forEach(a => {
    const div = document.createElement('div');
    div.className = 'amenity-item';
    div.textContent = a;
    el.amenGrid.append(div);
  });

  el.guestSelect.replaceChildren();
  for (let i = 1; i <= c.capacity; i++) {
    const opt = new Option(`${i} guest${i > 1 ? 's' : ''}`, i);
    el.guestSelect.add(opt);
  }

  document.querySelector('#priceDisplay').textContent = `RON ${(+c.price).toFixed(2)}`;
}

function buildSlider(ids = []) {
  let idx = 0;
  const show = i => {
    el.mainImg.replaceChildren();
    if (!ids.length) { el.mainImg.textContent = '🏕️'; return; }
    const img = new Image();
    img.src = `/api/media/${ids[i]}`;
    img.style = 'width:100%;height:100%;object-fit:cover';
    el.mainImg.append(img);
  };

  show(0);
  el.prev.onclick = () => ids.length && show(idx = (idx - 1 + ids.length) % ids.length);
  el.next.onclick = () => ids.length && show(idx = (idx + 1) % ids.length);

  if (ids.length < 2) { el.prev.style.display = el.next.style.display = 'none'; }
}

async function mediaNode(id) {
  const blob = await fetch(`/api/media/${id}`).then(r => r.blob());
  const url = URL.createObjectURL(blob);

  let el;
  if (blob.type.startsWith('image/'))
    el = new Image();
  else if (blob.type.startsWith('video/')) {
    el = Object.assign(document.createElement('video'), { controls: true });
  }
  else if (blob.type.startsWith('audio/'))
    el = Object.assign(document.createElement('audio'), { controls: true });
  else return null;

  el.src = url;
  el.className = 'media-preview';
  return el;
}

function updateFileLabel() {
  const inputs = [
    { id: 'reviewMedia', labelId: 'fileLabel' },
    { id: 'messageMedia', labelId: 'fileLabelMessage' }
  ];

  for (const { id, labelId } of inputs) {
    const input = document.getElementById(id);
    const label = document.getElementById(labelId);
    if (input && label) {
      label.classList.toggle('has-files', input.files.length > 0);
    }
  }
}
async function uploadMedia({ files, reviewId, messageId }) {
  if (!files.length) return [];

  const fd = new FormData();
  fd.append('campsite_id', campId);
  if (reviewId) fd.append('review_id', reviewId);
  if (messageId) fd.append('message_id', messageId);
  [...files].forEach(f => fd.append('data', f));

  const { media_ids } = await api('/api/media', { method: 'POST', body: fd });
  return media_ids;
}
function reviewNode(r) {
  const card = document.createElement('div');
  card.className = 'review-item';

  const head = document.createElement('div');
  head.className = 'review-header';

  const left = document.createElement('div');
  const author = document.createElement('div');
  author.className = 'review-author';
  author.textContent = r.username || 'You';
  const stars = document.createElement('div');
  stars.className = 'stars';
  stars.textContent = '⭐'.repeat(r.rating);
  left.append(author, stars);

  const date = document.createElement('div');
  date.className = 'review-date';
  date.textContent = new Date(r.created_at).toLocaleDateString();
  head.append(left, date);

  const body = document.createElement('div');
  body.className = 'review-content';
  body.textContent = r.body_md;

  card.append(head, body);
  return card;
}

async function renderReviews(arr, append = true) {
  const frag = document.createDocumentFragment();
  for (const r of arr) {
    const card = reviewNode(r);
    if (r.media_ids.length) {
      const box = document.createElement('div');
      box.className = 'review-media';
      for (const id of r.media_ids)
        box.append(await mediaNode(id));
      card.append(box);
    }
    frag.append(card);
  }
  append ? el.reviewsWrap.append(frag) : el.reviewsWrap.replaceChildren(frag);
}

function messageNode(m) {
  const item = document.createElement('div');
  item.className = 'message-item';
  const head = document.createElement('div');
  head.className = 'message-header';
  const who = document.createElement('div');
  who.className = 'message-author';
  who.textContent = m.username || 'You';
  const when = document.createElement('div');
  when.className = 'message-time';
  when.textContent = new Date(m.created_at)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  head.append(who, when);
  const body = document.createElement('div');
  body.className = 'message-content';
  body.textContent = m.body_md;

  item.append(head, body);
  return item;
}

async function renderMessages(list, append = true) {
  const frag = document.createDocumentFragment();
  for (const m of list) {
    const msg = messageNode(m);
    if (m.media_ids?.length) {
      const box = document.createElement('div');
      box.className = 'message-media';
      for (const id of m.media_ids) box.append(await mediaNode(id));
      msg.append(box);
    }
    frag.append(msg);
  }
  append ? el.chatWrap.append(frag) : el.chatWrap.replaceChildren(frag);
  el.chatWrap.scrollTop = el.chatWrap.scrollHeight;
}
document.getElementById('reviewMedia').addEventListener('change', e => {
  for (const f of e.target.files) {
    if (f.size > MAX_SIZE) {
      alert(`${f.name} is larger than 5 MB. Please choose a smaller file.`);
      e.target.value = '';
      return;
    }
  }
});
document.getElementById('messageMedia').addEventListener('change', e => {
  for (const f of e.target.files) {
    if (f.size > MAX_SIZE) {
      alert(`${f.name} is larger than 5 MB. Please choose a smaller file.`);
      e.target.value = '';
      return;
    }
  }
});
async function submitReview() {
  const rating = +document.querySelector('.rating input:checked')?.value || 0;
  const text = document.querySelector('#reviewText').value.trim();
  const files = document.querySelector('#reviewMedia').files;
  if (!rating) return showReviewBanner('⚠️ Pick a star rating first', 'warn');
  if (!text)
    return showReviewBanner('⚠️ Write a review before submitting', 'warn');

  try {
    const review = await api(`/api/campsites/${campId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, body_md: text })
    });

    review.media_ids = await uploadMedia({ reviewId: review.id, files });
    renderReviews([review]);
    document.querySelector('#reviewText').value = '';
    document.querySelector('#reviewMedia').value = '';
    showReviewBanner('🎉 Review posted – thank you!', 'success');

  } catch (ex) {
    showReviewBanner('⚠️ You already reviewed this campsite.', 'warn');
    document.querySelector('#reviewText').value = '';
    document.querySelector('#reviewMedia').value = '';
  }
}

async function sendMessage() {
  const text = document.querySelector('#messageText').value.trim();
  const files = document.querySelector('#messageMedia').files;
  if (!text) return;

  const msg = await api(`/api/campsites/${campId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body_md: text })
  });

  msg.media_ids = await uploadMedia({ messageId: msg.id, files });
  renderMessages([msg]);

  document.querySelector('#messageText').value = '';
  document.querySelector('#messageMedia').value = '';
}

document.addEventListener('click', e => {
  if (!e.target.classList.contains('media-preview')) return;
  const modal = document.querySelector('#mediaModal');
  const box = document.querySelector('#modalContent');
  box.replaceChildren(e.target.cloneNode(true));
  modal.classList.remove('hidden');
});
document.querySelector('#modalOverlay').onclick = () =>
  document.querySelector('#mediaModal').classList.add('hidden');

async function fetchWeather(lat, lon, startDate, endDate) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather fetch failed");
    const data = await res.json();
    return data.daily;
  } catch (err) {
    console.error("Weather error:", err);
    return null;
  }
}
async function initDatePickers() {
  const booked = await api(`/api/campsites/${campId}/booked`);
  const disabled = booked.map(r => ({
    from: r.checkin,
    to: r.checkout
  }));
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  let fpOut;
  const fpIn = flatpickr('#checkinDate', {
    dateFormat: 'Y-m-d',
    minDate: tomorrow,
    disable: disabled,
    onChange: ([d]) => {
      fpOut.set('minDate', d ? new Date(d.getTime() + 86_400_000) : tomorrow);
      fpOut.open();
      updateWeatherIfBoth();
    }
  });

  fpOut = flatpickr('#checkoutDate', {
    dateFormat: 'Y-m-d',
    minDate: tomorrow,
    disable: disabled,
    onChange: updateWeatherIfBoth
  });
  function updateWeatherIfBoth() {
    const inVal = document.getElementById('checkinDate').value;
    const outVal = document.getElementById('checkoutDate').value;
    if (inVal && outVal) updateWeather();
  }
}
document.getElementById('checkinDate').addEventListener('change', () => {
  updateWeather();
});
document.getElementById('checkoutDate').addEventListener('change', () => {
  updateWeather();
});
async function updateWeather() {
  const checkin = document.getElementById('checkinDate').value;
  const checkout = document.getElementById('checkoutDate').value;

  if (!checkin || !checkout || checkin >= checkout) return;

  const lat = el.coords.textContent.split(',')[0].trim();
  const lon = el.coords.textContent.split(',')[1].trim();

  const weather = await fetchWeather(lat, lon, checkin, checkout);
  if (weather) renderWeather(weather);
}
function renderWeather(daily) {
  const box = document.querySelector('#weatherInfo');
  box.replaceChildren(); 

  daily.time.forEach((date, i) => {
    const row = document.createElement('div');
    row.className = 'weather-item';

    const dateDiv = document.createElement('div');
    dateDiv.className = 'weather-date';
    dateDiv.textContent = date;

    const infoDiv = document.createElement('div');
    infoDiv.className = 'weather-info';

    const tempSpan = document.createElement('span');
    tempSpan.textContent = `🌡️ ${daily.temperature_2m_min[i]}°C → ${daily.temperature_2m_max[i]}°C`;

    const spacer = document.createTextNode('\u00A0');

    const rainSpan = document.createElement('span');
    rainSpan.textContent = `☔ ${daily.precipitation_sum[i]} mm`;

    infoDiv.append(tempSpan, spacer, rainSpan);
    row.append(dateDiv, infoDiv);
    box.append(row);
  });
}

const form = document.getElementById('bookingForm');
async function postBooking(data) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  if (res.ok) return res.json();
  const { errors = [res.statusText] } = await res.json().catch(() => ({}));
  const err = new Error(errors.join(', '));
  err.status = res.status;
  throw err;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const checkin = document.getElementById('checkinDate').value;
  const checkout = document.getElementById('checkoutDate').value;
  console.log(checkin, checkout);
  const guests = +document.getElementById('guestCount').value;
  try {
    await postBooking({ campsite_id: campId, checkin, checkout, guests });
    form.reset();
    showBanner('🎉 Booking confirmed! Payment at the site. See you soon.', 'success');
  } catch (ex) {
    if (ex.status === 409) {
      showBanner('⚠️ Those dates are already taken – choose others.', 'warn');
    } else {
      showBanner(`❌ ${ex.message}`, 'error');
    }
  }
});
const reviewBanner = document.getElementById('reviewBanner');
const showReviewBanner = (txt, kind = 'success') => {
  reviewBanner.textContent = txt;
  reviewBanner.className = `banner ${kind}`;
  reviewBanner.classList.remove('hidden');
  clearTimeout(showReviewBanner.t);
  showReviewBanner.t = setTimeout(() => reviewBanner.classList.add('hidden'), 4000);
};
const banner = document.getElementById('bookingBanner');
const showBanner = (text, kind = 'success') => {
  banner.textContent = text;
  banner.className = `banner ${kind}`;
  banner.classList.remove('hidden');
  clearTimeout(showBanner.t);
  showBanner.t = setTimeout(() => banner.classList.add('hidden'), 4000);
};
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
(async () => {
  if (!campId) return alert('Missing ?id parameter');

  try {
    const [campsite, reviews, messages] = await Promise.all([
      api(`/api/campsites/${campId}`),
      api(`/api/campsites/${campId}/reviews`),
      api(`/api/campsites/${campId}/messages`)
    ]);

    renderCampsite(campsite);
    buildSlider(campsite.media_ids || []);
    await initDatePickers();
    await renderReviews(reviews || [], false);
    await renderMessages(messages || [], false);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
})();

window.submitReview = submitReview;
window.sendMessage = sendMessage;
