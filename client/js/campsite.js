document.addEventListener('DOMContentLoaded', function() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('mainImage');
    
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', function() {
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const images = ['🏕️', '🌲', '🔥', '🌅', '⛰️'];
            mainImage.textContent = images[index];
        });
    });
});

let selectedRating = 0;
const starInputs = document.querySelectorAll('.star-input');

starInputs.forEach((star, index) => {
    star.addEventListener('mouseover', function() {
        highlightStars(index + 1);
    });
    
    star.addEventListener('click', function() {
        selectedRating = index + 1;
        setStarRating(selectedRating);
    });
});

document.getElementById('ratingInput').addEventListener('mouseleave', function() {
    setStarRating(selectedRating);
});

function highlightStars(rating) {
    starInputs.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#ffd700';
            star.style.textShadow = '0 0 5px #ffd700';
        } else {
            star.style.color = '#ddd';
            star.style.textShadow = 'none';
        }
    });
}

function setStarRating(rating) {
    starInputs.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#ffd700';
            star.style.textShadow = '0 0 5px #ffd700';
        } else {
            star.style.color = '#ddd';
            star.style.textShadow = 'none';
        }
    });
}

function submitReview() {
    const reviewText = document.getElementById('reviewText').value;
    
    if (!selectedRating) {
        alert('Please select a star rating');
        return;
    }
    
    if (!reviewText.trim()) {
        alert('Please write a review');
        return;
    }
    
    const reviewsList = document.getElementById('reviewsList');
    const newReview = document.createElement('div');
    newReview.className = 'review-item';
    
    const stars = '⭐'.repeat(selectedRating);
    
    newReview.innerHTML = `
        <div class="review-header">
            <div>
                <div class="review-author">You</div>
                <div class="stars">${stars}</div>
            </div>
            <div class="review-date">Just now</div>
        </div>
        <div class="review-content">${reviewText}</div>
    `;
    
    reviewsList.insertBefore(newReview, reviewsList.firstChild);
     document.getElementById('reviewText').value = '';
    selectedRating = 0;
    setStarRating(0);
    
    alert('Review submitted successfully!');
}

function sendMessage() {
    const messageText = document.getElementById('messageText').value;
    
    if (!messageText.trim()) {
        alert('Please enter a message');
        return;
    }
    
    const chatMessages = document.getElementById('chatMessages');
    const newMessage = document.createElement('div');
    newMessage.className = 'message-item';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    newMessage.innerHTML = `
        <div class="message-header">
            <div class="message-author">You</div>
            <div class="message-time">${timeString}</div>
        </div>
        <div class="message-content">${messageText}</div>
    `;
    
    chatMessages.appendChild(newMessage);
    document.getElementById('messageText').value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const checkinDate = document.getElementById('checkinDate').value;
    const checkoutDate = document.getElementById('checkoutDate').value;
    const guestCount = document.getElementById('guestCount').value;
    
    if (!checkinDate || !checkoutDate || !guestCount) {
        alert('Please fill in all booking details');
        return;
    }
    
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    
    if (checkout <= checkin) {
        alert('Check-out date must be after check-in date');
        return;
    }
    
    calculateBookingCost();
    alert('Booking request submitted! You will be redirected to payment.');
});

document.getElementById('checkinDate').addEventListener('change', updateBookingSummary);
document.getElementById('checkoutDate').addEventListener('change', updateBookingSummary);

function updateBookingSummary() {
    calculateBookingCost();
    updateWeatherForecast();
}

function calculateBookingCost() {
    const checkinDate = document.getElementById('checkinDate').value;
    const checkoutDate = document.getElementById('checkoutDate').value;
    
    if (!checkinDate || !checkoutDate) return;
    
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    
    if (checkout <= checkin) return;
    
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    const ratePerNight = 45;
    const subtotal = nights * ratePerNight;
    const serviceFee = Math.round(subtotal * 0.12);
    const total = subtotal + serviceFee;
    
    document.getElementById('nightCount').textContent = nights;
    document.getElementById('ratePerNight').textContent = `$${ratePerNight}`;
    document.getElementById('subtotal').textContent = `$${subtotal}`;
    document.getElementById('serviceFee').textContent = `$${serviceFee}`;
    document.getElementById('totalCost').textContent = `$${total}`;
    
    document.getElementById('bookingSummary').style.display = 'block';
}

function updateWeatherForecast() {
    const checkinDate = document.getElementById('checkinDate').value;
    const checkoutDate = document.getElementById('checkoutDate').value;
    
    if (!checkinDate || !checkoutDate) return;
    
    const weatherInfo = document.getElementById('weatherInfo');
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    
    const weatherIcons = ['☀️', '⛅', '🌤️', '🌦️', '🌧️'];
    const conditions = ['Sunny', 'Partly Cloudy', 'Mostly Sunny', 'Light Rain', 'Rainy'];
    
    let weatherHTML = '';
    
    for (let i = 0; i < Math.min(nights, 5); i++) {
        const date = new Date(checkin);
        date.setDate(date.getDate() + i);
        const randomWeather = Math.floor(Math.random() * weatherIcons.length);
        const temp = 65 + Math.floor(Math.random() * 20);
        
        weatherHTML += `
            <div class="weather-item">
                <div class="weather-date">${date.toLocaleDateString()}</div>
                <div class="weather-info">
                    <span>${weatherIcons[randomWeather]}</span>
                    <span>${temp}°F - ${conditions[randomWeather]}</span>
                </div>
            </div>
        `;
    }
    
    weatherInfo.innerHTML = weatherHTML;
}

document.getElementById('reviewImages').addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length > 0) {
        alert(`${files.length} image(s) selected for review`);
    }
});

document.getElementById('reviewVideos').addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length > 0) {
        alert(`${files.length} video(s) selected for review`);
    }
});

document.getElementById('chatImages').addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length > 0) {
        alert(`${files.length} image(s) ready to send`);
    }
});

document.getElementById('chatVideos').addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length > 0) {
        alert(`${files.length} video(s) ready to send`);
    }
});

document.getElementById('messageText').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

const today = new Date().toISOString().split('T')[0];
document.getElementById('checkinDate').min = today;
document.getElementById('checkoutDate').min = today;