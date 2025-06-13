let allCampsites = [];
let filteredCampsites = [];
let displayedCount = 6;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const qs  = new URLSearchParams(window.location.search);
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
    if (guests <= 2) capFilter.value = '1-2';
    else if (guests <= 4) capFilter.value = '3-4';
    else if (guests <= 6) capFilter.value = '5-6';
    else capFilter.value = '7+';
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
    if (loc && !c.name.toLowerCase().includes(loc) && !c.description.toLowerCase().includes(loc)) return false;
    if (c.price < minPrice || c.price > maxPrice) return false;
    if (county && c.county !== county) return false;
    if (selectedTypes.length && !selectedTypes.includes(c.type)) return false;
    if (capacity) {
      const [minCap, maxCap] = capacity.includes('+') ? [7, Infinity] : capacity.split('-').map(Number);
      if (c.capacity < minCap || c.capacity > maxCap) return false;
    }
    if (c.rating < rating) return false;
    if (selectedAmenities.length && !selectedAmenities.every(a => c.amenities.includes(a))) return false;

    return true;
  });

  displayedCount = 6;
  renderCampsites();
}

function sortCampsites() {
  const sort = document.getElementById('sortSelect').value;

  filteredCampsites.sort((a, b) => {
    switch (sort) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'newest': return b.id - a.id;
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
    if (campsite.main_media_id) {
      const img = document.createElement('img');
      img.src= `/api/media/${campsite.main_media_id}`;
      img.alt= campsite.name;
      img.loading= 'lazy';             
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
  window.location.href = `/campsite-detail.html?id=${id}`;
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
