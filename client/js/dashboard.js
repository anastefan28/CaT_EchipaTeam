let map = L.map('map').setView([39.8283, -98.5795], 4); // Center of USA
let isMapExpanded = false;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Sample campsite locations
const campsites = [
    {
        name: "Mountain View Campground",
        location: [40.3428, -105.6836],
        price: "$45/night",
        rating: 4.8
    },
    {
        name: "Lakeside Paradise",
        location: [39.0968, -120.0324],
        price: "$55/night",
        rating: 4.9
    },
    {
        name: "Forest Retreat",
        location: [44.4280, -110.5885],
        price: "$38/night",
        rating: 4.7
    },
    {
        name: "Desert Oasis",
        location: [36.1069, -115.1398],
        price: "$42/night",
        rating: 4.6
    },
    {
        name: "Coastal Camping",
        location: [36.2704, -121.8081],
        price: "$65/night",
        rating: 4.8
    }
];

// Add markers to map
campsites.forEach((campsite, index) => {
    const marker = L.marker(campsite.location).addTo(map);
    marker.bindPopup(`
                <div style="text-align: center; padding: 10px;">
                    <h3 style="margin: 0 0 10px 0; color: #2E7D32;">${campsite.name}</h3>
                    <p style="margin: 5px 0;">⭐ ${campsite.rating}/5</p>
                    <p style="margin: 5px 0; font-weight: bold; color: #4CAF50;">${campsite.price}</p>
                    <button onclick="goToCampsite(${index + 1})" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">View Details</button>
                </div>
            `);
});

// Search form submission
document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const location = document.getElementById('location').value;
    const checkin = document.getElementById('checkin').value;
    const guests = document.getElementById('guests').value;

    // Redirect to campsites page with search parameters
    const params = new URLSearchParams({
        location: location,
        checkin: checkin,
        guests: guests
    });
    window.location.href = `campsites.html?${params.toString()}`;
});

// Toggle map size
function toggleMap() {
    const mapElement = document.getElementById('map');
    const toggleBtn = document.querySelector('.map-toggle');

    if (isMapExpanded) {
        mapElement.classList.remove('map-expanded');
        toggleBtn.textContent = 'Expand Map';
        isMapExpanded = false;
    } else {
        mapElement.classList.add('map-expanded');
        toggleBtn.textContent = 'Collapse Map';
        isMapExpanded = true;
    }

    // Refresh map after size change
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
}

// Navigation functions
function goToCampsite(id) {
    window.location.href = `campsite.html?id=${id}`;
}

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault(); 
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/index';
});

// Set minimum date for check-in to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('checkin').setAttribute('min', today);
