let map = L.map('map').setView([46.0, 25.0], 6);
let isMapExpanded = false;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

async function loadPopularCampsitesOnMap() {
  try {
    const res = await fetch('/api/campsites?sort=popular');
   switch (res.status) {
      case 200:                          
        campsites = await res.json();
        break;
      case 401:
        throw new Error('Unauthorized');
      case 400:
        const errorData = await res.json();
        throw new Error(`Bad Request: ${errorData.errors.join(', ')}`);
      case 500:
        throw new Error('Server had an issue');
    }
    campsites.forEach((campsite) => {
      const marker = L.marker([campsite.lat, campsite.lon]).addTo(map);
      marker.bindPopup(createCampsitePopup(campsite));
    });
  } catch (err) {
    console.error('Error loading campsites:', err);
  }
}

function createCampsitePopup(campsite) {
  const container = document.createElement('div');
  container.style.textAlign = 'center';
  container.style.padding = '10px';

  const title = document.createElement('h3');
  title.textContent = campsite.name;
  title.style.margin = '0 0 10px 0';
  title.style.color = '#2E7D32';

  const rating = document.createElement('p');
  rating.textContent = `⭐ ${campsite.avg_rating}/5`;
  rating.style.margin = '5px 0';

  const price = document.createElement('p');
  const numericPrice = parseFloat(campsite.price);
  price.textContent = isNaN(numericPrice)
    ? 'Price not available'
    : `${numericPrice.toFixed(2)} RON/night`;
  price.style.margin = '5px 0';
  price.style.fontWeight = 'bold';
  price.style.color = '#4CAF50';


  const button = document.createElement('button');
  button.textContent = 'View Details';
  button.onclick = () => goToCampsite(campsite.id);
  button.style.background = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.padding = '8px 16px';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.marginTop = '10px';

  container.appendChild(title);
  container.appendChild(rating);
  container.appendChild(price);
  container.appendChild(button);

  return container;
}

function goToCampsite(id) {
  window.location.href = `/campsite?id=${id}`;
}

function toggleMap() {
  const mapElement = document.getElementById('map');
  const toggleBtn = document.querySelector('.map-toggle');

  isMapExpanded = !isMapExpanded;
  mapElement.classList.toggle('map-expanded', isMapExpanded);
  toggleBtn.textContent = isMapExpanded ? 'Collapse Map' : 'Expand Map';

  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const location = document.getElementById('location').value;
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const guests = document.getElementById('guests').value;

  const params = new URLSearchParams({ location, checkin, checkout, guests });
  window.location.href = `/campsites?${params.toString()}`;
});

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

document.getElementById('checkin').setAttribute('min', new Date().toISOString().split('T')[0]);

loadPopularCampsitesOnMap();

async function loadPopularCampsitesList() {
  try {
    const res = await fetch('/api/campsites?sort=popular');
    switch (res.status) {
      case 200:                          
        campsites = await res.json();
        break;
      case 400:
        const errorData = await res.json();
        throw new Error(`Bad Request: ${errorData.errors.join(', ')}`);
      case 401:
        throw new Error('Unauthorized');
      case 500:
        throw new Error('Server had an issue, try again');
    }
    const grid = document.getElementById('popularCampsitesGrid');
    grid.replaceChildren();

    campsites.slice(0, 6).forEach(campsite => {
      const card = document.createElement('div');
      card.className = 'campsite-card';
      card.onclick = () => goToCampsite(campsite.id);

      const image = document.createElement('div');
      image.className = 'campsite-image';
      image.textContent = campsite.media_ids[0] || '🏕️';

      const content = document.createElement('div');
      content.className = 'campsite-content';

      const title = document.createElement('h3');
      title.className = 'campsite-title';
      title.textContent = campsite.name;

      const location = document.createElement('div');
      location.className = 'campsite-location';
      location.textContent = `📍 ${campsite.county} County`;

      const ratingDiv = document.createElement('div');
      ratingDiv.className = 'rating';

      const stars = document.createElement('span');
      stars.className = 'stars';
      stars.textContent = '⭐'.repeat(Math.floor(campsite.avg_rating || 0));

      const ratingText = document.createElement('span');
      ratingText.textContent = `${(campsite.avg_rating || 0)} (${campsite.review_count || 0} reviews)`;

      ratingDiv.appendChild(stars);
      ratingDiv.appendChild(ratingText);

      const price = document.createElement('div');
      price.className = 'campsite-price';
      price.textContent = `${parseFloat(campsite.price).toFixed(2)} RON/night`;

      content.appendChild(title);
      content.appendChild(location);
      content.appendChild(ratingDiv);
      content.appendChild(price);

      card.appendChild(image);
      card.appendChild(content);
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading popular campsites:', err);
  }
}
loadPopularCampsitesList();