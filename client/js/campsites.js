let allCampsites = [];
let filteredCampsites = [];
let displayedCount = 6;
let map;
let isMapVisible = false;
let isMapExpanded = false;
let mapMarkers = [];

function initializeMap() {
  if (!map) {
    map = L.map('map').setView([46.0, 25.0], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  }
}
function toggleMapVisibility() {
  const mapContainer = document.getElementById('mapContainer');
  const toggleBtn = document.getElementById('toggleMapBtn');
  const container = document.querySelector('.container');

  isMapVisible = !isMapVisible;

  if (isMapVisible) {
    mapContainer.classList.remove('hidden');
    container.classList.add('with-map');
    toggleBtn.textContent = '❌ Hide Map';
    initializeMap();

    setTimeout(() => {
      map.invalidateSize();
      updateMapMarkers();
    }, 100);
  } else {
    mapContainer.classList.add('hidden');
    container.classList.remove('with-map');
    toggleBtn.textContent = '📍 View on Map';
  }
}

function toggleMapExpansion() {
  const mapElement = document.getElementById('map');
  const expandBtn = document.getElementById('expandMapBtn');

  isMapExpanded = !isMapExpanded;
  mapElement.classList.toggle('map-expanded', isMapExpanded);
  expandBtn.textContent = isMapExpanded ? 'Collapse Map' : 'Expand Map';

  setTimeout(() => {
    map.invalidateSize();
  }, 300);
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

function updateMapMarkers() {
  if (!map) return;
  mapMarkers.forEach(marker => map.removeLayer(marker));
  mapMarkers = [];

  filteredCampsites.forEach(campsite => {
    if (campsite.lat && campsite.lon) {
      const marker = L.marker([campsite.lat, campsite.lon]).addTo(map);
      marker.bindPopup(createCampsitePopup(campsite));
      mapMarkers.push(marker);
    }
  });
  if (mapMarkers.length > 0) {
    const group = new L.featureGroup(mapMarkers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}
document.getElementById('toggleMapBtn').addEventListener('click', toggleMapVisibility);
document.getElementById('expandMapBtn').addEventListener('click', toggleMapExpansion);

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const qs = new URLSearchParams(window.location.search);
    const res = await fetch(`/api/campsites?${qs}`);
    switch (res.status) {
      case 200:
        allCampsites = await res.json();
        break;
      case 400: {
        const { errors = [] } = await res.json();
        throw new Error(`Bad Request: ${errors.join(', ')}`);
      }
      case 401:
        window.location.href = '/index';
        throw new Error('Unauthorized');
      case 500:
        throw new Error('Server had an issue, try again');
      default:
        throw new Error(`Unexpected status ${res.status}`);
    }
    initFiltersFromURL(qs);
    setupEventListeners();
    applyFilters();

  } catch (err) {
    console.error('Error fetching campsites:', err);
  }
});

function initFiltersFromURL(params) {
  if (params.get('location')) {
    document.getElementById('locationFilter').value = params.get('location');
  }
  if (params.get('minPrice')) document.getElementById('minPrice').value = params.get('minPrice');
  if (params.get('maxPrice')) document.getElementById('maxPrice').value = params.get('maxPrice');
  if (params.get('county')) document.getElementById('countyFilter').value = params.get('county');
  if (params.get('capacity')) document.getElementById('capacityFilter').value = params.get('capacity');
  if (params.get('rating')) {
    const ratingInput = document.querySelector(`input[name="rating"][value="${params.get('rating')}"]`);
    if (ratingInput) ratingInput.checked = true;
  }

  if (params.get('type')) {
    const types = params.get('type').split(',');
    types.forEach(t => {
      const checkbox = document.querySelector(`input[name="type"][value="${t}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }

  if (params.get('amenities')) {
    const amenities = params.get('amenities').split(',');
    amenities.forEach(a => {
      const checkbox = document.querySelector(`input[name="amenities"][value="${a}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }

  const guests = parseInt(params.get('guests'));
  if (guests) {
    const capFilter = document.getElementById('capacityFilter');
    if (guests <= 2) capFilter.value = '1';
    else if (guests <= 4) capFilter.value = '3';
    else if (guests <= 6) capFilter.value = '5';
    else capFilter.value = '7';
  }
}

function setupEventListeners() {
  document.getElementById('locationFilter').addEventListener('input', applyFilters);
  document.getElementById('minPrice').addEventListener('input', applyFilters);
  document.getElementById('maxPrice').addEventListener('input', applyFilters);
  document.getElementById('countyFilter').addEventListener('change', applyFilters);
  document.getElementById('capacityFilter').addEventListener('change', applyFilters);
  document.querySelectorAll('input[name="rating"]').forEach(el => el.addEventListener('change', applyFilters));
  document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(el => el.addEventListener('change', applyFilters));
  document.getElementById('sortSelect').addEventListener('change', sortCampsites);
  document.getElementById('loadMoreBtn').addEventListener('click', () => {
    displayedCount += 6;
    renderCampsites();
    if (isMapVisible) {
      updateMapMarkers();
    }
  });
}

function applyFilters() {
  updateURLParams();
  const loc = document.getElementById('locationFilter').value.toLowerCase();
  const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
  const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
  const county = document.getElementById('countyFilter').value;
  const capacity = document.getElementById('capacityFilter').value;
  const rating = parseFloat(document.querySelector('input[name="rating"]:checked')?.value) || 0;

  const selectedTypes = Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value);
  const selectedAmenities = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked'))
    .filter(cb => cb.name === 'amenities')
    .map(cb => cb.value);

  filteredCampsites = allCampsites.filter(c => {
    if (loc && !c.name.toLowerCase().includes(loc) && !c.description.toLowerCase().includes(loc)
       && !c.county.toLowerCase().includes(loc)) return false;
    if (c.price < minPrice || c.price > maxPrice) return false;
    if (county && c.county !== county) return false;
    if (selectedTypes.length && !selectedTypes.includes(c.type)) return false;
    if (capacity && c.capacity < capacity) return false;
    if (c.avg_rating < rating) return false;
    if (selectedAmenities.length && !selectedAmenities.every(a => c.amenities.includes(a))) return false;
    return true;
  });

  displayedCount = 6;
  renderCampsites();
  if (isMapVisible) {
    updateMapMarkers();
  }
}

function sortCampsites() {
  const sort = document.getElementById('sortSelect').value;

  filteredCampsites.sort((a, b) => {
    switch (sort) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.avg_rating - a.avg_rating;
      case 'newest': return b.created_at - a.created_at;
      default: return b.reviewCount - a.reviewCount;
    }
  });

  renderCampsites();
}

function renderCampsites() {
  const grid = document.getElementById('campsitesGrid');
  grid.replaceChildren();

  const toShow = filteredCampsites.slice(0, displayedCount);
  toShow.forEach(campsite => {
    const card = document.createElement('div');
    card.className = 'campsite-card';
    card.onclick = () => goToCampsite(campsite.id);

    const image = document.createElement('div');
    image.className = 'campsite-image';
    if (campsite.media_ids[0]) {
      const img = document.createElement('img');
      img.src = `/api/media/${campsite.media_ids[0]}`;
      img.alt = campsite.name;
      img.loading = 'lazy';
      image.appendChild(img);
    } else {
      image.textContent = '🏕️';
    }

    const type = document.createElement('div');
    type.className = 'campsite-type';
    type.textContent = capitalize(campsite.type);
    image.appendChild(type);

    const content = document.createElement('div');
    content.className = 'campsite-content';

    const header = document.createElement('div');
    header.className = 'campsite-header';

    const nameBlock = document.createElement('div');
    const name = document.createElement('h3');
    name.className = 'campsite-title';
    name.textContent = campsite.name;
    const county = document.createElement('div');
    county.className = 'campsite-county';
    county.textContent = `${campsite.county} County`;
    nameBlock.appendChild(name);
    nameBlock.appendChild(county);

    const priceBlock = document.createElement('div');
    priceBlock.className = 'campsite-price';
    priceBlock.textContent = `${campsite.price} RON`;
    const unit = document.createElement('span');
    unit.className = 'price-unit';
    unit.textContent = '/night';
    priceBlock.appendChild(unit);

    header.appendChild(nameBlock);
    header.appendChild(priceBlock);

    const description = document.createElement('p');
    description.className = 'campsite-description';
    description.textContent = campsite.description;

    const details = document.createElement('div');
    details.className = 'campsite-details';

    const capInfo = document.createElement('div');
    capInfo.className = 'capacity-info';
    capInfo.textContent = `👥 Up to ${campsite.capacity} guests`;

    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'rating';

    const stars = document.createElement('span');
    stars.className = 'stars';
    stars.textContent = '⭐'.repeat(Math.floor(campsite.avg_rating));

    const ratingScore = document.createElement('span');
    ratingScore.className = 'rating-score';
    ratingScore.textContent = campsite.avg_rating;

    const reviewCount = document.createElement('span');
    reviewCount.className = 'rating-count';
    reviewCount.textContent = `(${campsite.review_count})`;

    ratingDiv.appendChild(stars);
    ratingDiv.appendChild(ratingScore);
    ratingDiv.appendChild(reviewCount);

    details.appendChild(capInfo);
    details.appendChild(ratingDiv);

    const amenitiesDiv = document.createElement('div');
    amenitiesDiv.className = 'amenities';

    (campsite.amenities || []).slice(0, 3).forEach(a => {
      const tag = document.createElement('span');
      tag.className = 'amenity-tag';
      tag.textContent = a;
      amenitiesDiv.appendChild(tag);
    });

    if ((campsite.amenities?.length || 0) > 3) {
      const moreTag = document.createElement('span');
      moreTag.className = 'amenity-tag';
      moreTag.textContent = `+${campsite.amenities.length - 3} more`;
      amenitiesDiv.appendChild(moreTag);
    }

    content.appendChild(header);
    content.appendChild(description);
    content.appendChild(details);
    content.appendChild(amenitiesDiv);

    card.appendChild(image);
    card.appendChild(content);
    grid.appendChild(card);
  });

  document.getElementById('resultsCount').textContent = filteredCampsites.length;
  document.getElementById('loadMoreBtn').style.display = displayedCount >= filteredCampsites.length ? 'none' : 'block';
}


function goToCampsite(id) {
  window.location.href = `/campsite?id=${id}`;
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


function updateURLParams() {
  const params = new URLSearchParams();

  const loc = document.getElementById('locationFilter').value.trim();
  const minPrice = document.getElementById('minPrice').value.trim();
  const maxPrice = document.getElementById('maxPrice').value.trim();
  const county = document.getElementById('countyFilter').value;
  const capacity = document.getElementById('capacityFilter').value;
  const rating = document.querySelector('input[name="rating"]:checked')?.value;

  if (loc) params.set('location', loc);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (county) params.set('county', county);
  if (capacity) params.set('capacity', capacity);
  if (rating) params.set('rating', rating);
  const selectedTypes = Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value);
  if (selectedTypes.length) params.set('type', selectedTypes.join(','));
  const selectedAmenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(cb => cb.value);
  if (selectedAmenities.length) params.set('amenities', selectedAmenities.join(','));
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

async function clearAllFilters() {
  document.getElementById('locationFilter').value = '';
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  document.getElementById('countyFilter').value = '';
  document.getElementById('capacityFilter').value = '';
  document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="type"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('input[name="amenities"]').forEach(cb => cb.checked = false);

  window.history.replaceState({}, '', window.location.pathname);

  try {
    const res = await fetch(`/api/campsites`);
    switch (res.status) {
      case 200:
        allCampsites = await res.json();
        break;
      case 400: {
        const { errors = [] } = await res.json();
        throw new Error(`Bad Request: ${errors.join(', ')}`);
      }
      case 401:
        window.location.href = '/index';
        throw new Error('Unauthorized');
      case 500:
        throw new Error('Server had an issue, try again');
      default:
        throw new Error(`Unexpected status ${res.status}`);
    }
  } catch (err) {
    console.error('Error fetching campsites:', err);
    return;
  }

  applyFilters();
}
