// Configuration - Replace with your actual Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxE57zW3g5EIObV9rIz2Qj9Extb5U3BkhyWXkXH1fg1bvsEK18A3afgW2J7xECFf675iw/exec';

// DOM Elements
const form = document.getElementById('leadForm');
const submitBtn = document.getElementById('submitBtn');
const consentCheckbox = document.getElementById('consent');
const errorMessage = document.getElementById('errorMessage');
const loadingMessage = document.getElementById('loadingMessage');
const calendarDates = document.getElementById('calendarDates');
const monthSelect = document.getElementById('month');
const yearSelect = document.getElementById('year');

// State
let selectedDate = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    setupEventListeners();
    
    // Set default date to November 18, 2025
    selectedDate = new Date(2025, 10, 18); // Month 10 = November (0-indexed)
    renderCalendar();
    
    // Initialize concern collapsible
    initializeConcernCollapsible();
});

// Setup Event Listeners
function setupEventListeners() {
    // Consent checkbox enables/disables submit button
    consentCheckbox.addEventListener('change', function() {
        submitBtn.disabled = !this.checked;
    });

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Calendar month/year change
    monthSelect.addEventListener('change', renderCalendar);
    yearSelect.addEventListener('change', renderCalendar);

    // Phone number validation
    const mobileInput = document.getElementById('mobile');
    mobileInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
        }
    });

    // Pincode validation
    const pincodeInput = document.getElementById('pincode');
    pincodeInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 6) {
            this.value = this.value.slice(0, 6);
        }
    });

    // Location picker - FIXED: Changed from .location-btn to .location-small-btn
    const locationBtn = document.querySelector('.location-small-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', getLocation);
    }

    // Concern checkbox handling
    const concernCheckboxes = document.querySelectorAll('input[name="concern"]');
    concernCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            this.parentElement.classList.toggle('checked', this.checked);
        });
    });

    // Time slot handling
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            timeSlots.forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            // Ensure the radio button is checked
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });
}

// Initialize Concern Collapsible
function initializeConcernCollapsible() {
    const header = document.querySelector(".concern-header");
    const body = document.querySelector(".concern-body");
    const arrow = document.querySelector(".arrow");

    if (!header || !body || !arrow) return;

    let isOpen = true; // default OPEN

    header.addEventListener("click", function () {
        isOpen = !isOpen;
        body.style.display = isOpen ? "block" : "none";
        arrow.textContent = isOpen ? "▲" : "▼";
    });
}

// Initialize Calendar
function initializeCalendar() {
    // Set to November 2025 by default
    monthSelect.value = 10; // November (0-indexed, so 10 = November)
    yearSelect.value = 2025;
}

// Render Calendar
function renderCalendar() {
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayIndex = firstDay.getDay();
    const lastDayIndex = lastDay.getDay();
    const nextDays = 7 - lastDayIndex - 1;
    
    let dates = '';
    
    // Previous month days
    for (let x = firstDayIndex; x > 0; x--) {
        dates += `<div class="calendar-date other-month disabled">${prevLastDay.getDate() - x + 1}</div>`;
    }
    
    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const currentDate = new Date(year, month, i);
        const isSelected = selectedDate && 
            selectedDate.getDate() === i && 
            selectedDate.getMonth() === month && 
            selectedDate.getFullYear() === year;
        
        const isPast = currentDate < today;
        const className = `calendar-date ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`;
        
        dates += `<div class="${className}" data-date="${i}" data-month="${month}" data-year="${year}">${i}</div>`;
    }
    
    // Next month days
    for (let j = 1; j <= nextDays; j++) {
        dates += `<div class="calendar-date other-month disabled">${j}</div>`;
    }
    
    calendarDates.innerHTML = dates;
    
    // Add click listeners to dates
    document.querySelectorAll('.calendar-date:not(.disabled)').forEach(dateEl => {
        dateEl.addEventListener('click', function() {
            document.querySelectorAll('.calendar-date').forEach(d => d.classList.remove('selected'));
            this.classList.add('selected');
            
            const day = parseInt(this.dataset.date);
            const month = parseInt(this.dataset.month);
            const year = parseInt(this.dataset.year);
            selectedDate = new Date(year, month, day);
        });
    });
}

// Get User Location
function getLocation(e) {
    e.preventDefault();
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // You can integrate a reverse geocoding API here
                // For now, we'll use a free service
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                    .then(response => response.json())
                    .then(data => {
                        const locationInput = document.getElementById('location');
                        const pincodeInput = document.getElementById('pincode');
                        const cityInput = document.getElementById('city');
                        
                        if (data.address) {
                            if (data.address.postcode) {
                                pincodeInput.value = data.address.postcode;
                            }
                            if (data.address.city || data.address.town || data.address.village) {
                                cityInput.value = data.address.city || data.address.town || data.address.village;
                            }
                            locationInput.value = data.display_name || '';
                        }
                    })
                    .catch(error => {
                        console.error('Geocoding error:', error);
                        alert('Could not fetch location details. Please enter manually.');
                    });
            },
            error => {
                alert('Unable to retrieve your location. Please enter manually.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Handle Form Submission
// Handle Form Submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Hide previous messages
    errorMessage.style.display = 'none';
    loadingMessage.style.display = 'none';
    
    const name = document.getElementById('name').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const address = document.getElementById('address').value.trim();
    const pincode = document.getElementById('pincode').value.trim();
    const location = document.getElementById('location').value.trim();
    
    if (!name || !mobile || !address || !pincode || !location) {
        showError('Please fill in all mandatory fields (marked with *)');
        return;
    }
    
    // Validate mobile number
    if (mobile.length !== 10 || !/^[0-9]{10}$/.test(mobile)) {
        showError('Please enter a valid 10-digit mobile number');
        return;
    }
    
    // Validate pincode
    if (pincode.length !== 6 || !/^[0-9]{6}$/.test(pincode)) {
        showError('Please enter a valid 6-digit pincode');
        return;
    }
    
    // Validate concerns (at least one must be selected)
    const concerns = Array.from(document.querySelectorAll('input[name="concern"]:checked'))
        .map(cb => cb.value);
    
    if (concerns.length === 0) {
        showError('Please select at least one concern');
        return;
    }
    
    // Validate date
    if (!selectedDate) {
        showError('Please select a date for the home trial');
        return;
    }
    
    // Validate time slot
    const timeSlot = document.querySelector('input[name="timeSlot"]:checked');
    if (!timeSlot) {
        showError('Please select a time slot');
        return;
    }
    
    // Validate consent
    if (!consentCheckbox.checked) {
        showError('Please accept the consent to proceed');
        return;
    }
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    loadingMessage.style.display = 'block';
    
    const formData = {
        name: name,
        mobile: mobile,
        address: address,
        city: document.getElementById('city').value.trim(),
        pincode: pincode,
        location: location,
        concerns: concerns.join(', '),
        appointmentDate: formatDate(selectedDate),
        timeSlot: timeSlot.value,
        consent: consentCheckbox.checked,
        utmSource: getUrlParameter('utm_source') || '',
        utmMedium: getUrlParameter('utm_medium') || '',
        utmCampaign: getUrlParameter('utm_campaign') || ''
    };
    
    // Use XMLHttpRequest instead of fetch to avoid CORS issues
    const xhr = new XMLHttpRequest();
    xhr.open('POST', GOOGLE_SCRIPT_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            // Success - redirect to thank you page
window.location.href = 
    `thankyou.html?name=${encodeURIComponent(formData.name)}&date=${encodeURIComponent(formData.appointmentDate)}&time=${encodeURIComponent(formData.timeSlot)}`;
        } else {
            // Error
            showError('There was an error submitting your request. Please try again.');
            submitBtn.disabled = false;
            loadingMessage.style.display = 'none';
        }
    };
    
    xhr.onerror = function() {
        // Network error
        showError('Network error. Please check your connection and try again.');
        submitBtn.disabled = false;
        loadingMessage.style.display = 'none';
    };
    
    xhr.send(JSON.stringify(formData));
}
// Utility Functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Scroll to error message
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function formatDate(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}