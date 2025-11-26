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

let selectedDate = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    setupEventListeners();
    
    selectedDate = new Date(2025, 10, 26); // Month 10 = November (0-indexed)
    renderCalendar();
    
    initializeConcernCollapsible();
    
    // Initial validation check
    validateForm();
});

function setupEventListeners() {
    // Real-time validation on all mandatory fields
    const mandatoryFields = ['name', 'mobile', 'address', 'pincode', 'location'];
    mandatoryFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', validateForm);
            field.addEventListener('blur', validateForm);
        }
    });

    // Consent checkbox validation
    consentCheckbox.addEventListener('change', validateForm);

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Calendar changes
    monthSelect.addEventListener('change', renderCalendar);
    yearSelect.addEventListener('change', renderCalendar);

    // Mobile number validation
    const mobileInput = document.getElementById('mobile');
    mobileInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
        }
        validateForm();
    });

    // Pincode validation
    const pincodeInput = document.getElementById('pincode');
    pincodeInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 6) {
            this.value = this.value.slice(0, 6);
        }
        validateForm();
    });

    // Location picker
    const locationBtn = document.querySelector('.location-small-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', getLocation);
    }

    // Concern checkboxes
    const concernCheckboxes = document.querySelectorAll('input[name="concern"]');
    concernCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            this.parentElement.classList.toggle('checked', this.checked);
            validateForm();
        });
    });

    // Time slots
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            timeSlots.forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            validateForm();
        });
    });
}

// Validate entire form and enable/disable submit button
function validateForm() {
    // Check all mandatory fields
    const name = document.getElementById('name').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const address = document.getElementById('address').value.trim();
    const pincode = document.getElementById('pincode').value.trim();
    const location = document.getElementById('location').value.trim();
    
    // Check mobile number validity (must be exactly 10 digits)
    const isMobileValid = mobile.length === 10 && /^[0-9]{10}$/.test(mobile);
    
    // Check pincode validity (must be exactly 6 digits)
    const isPincodeValid = pincode.length === 6 && /^[0-9]{6}$/.test(pincode);
    
    // Check at least one concern is selected
    const concernsSelected = document.querySelectorAll('input[name="concern"]:checked').length > 0;
    
    // Check date is selected
    const dateSelected = selectedDate !== null;
    
    // Check time slot is selected
    const timeSlotSelected = document.querySelector('input[name="timeSlot"]:checked') !== null;
    
    // Check consent is checked
    const consentChecked = consentCheckbox.checked;
    
    // Enable submit button only if ALL conditions are met
    const isFormValid = 
        name && 
        isMobileValid && 
        address && 
        isPincodeValid && 
        location && 
        concernsSelected && 
        dateSelected && 
        timeSlotSelected && 
        consentChecked;
    
    submitBtn.disabled = !isFormValid;
    
    // Optional: Add visual feedback
    if (isFormValid) {
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    } else {
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    }
}

function initializeConcernCollapsible() {
    const header = document.querySelector(".concern-header");
    const body = document.querySelector(".concern-body");
    const arrow = document.querySelector(".arrow");

    if (!header || !body || !arrow) return;

    let isOpen = true;

    header.addEventListener("click", function () {
        isOpen = !isOpen;
        body.style.display = isOpen ? "block" : "none";
        arrow.textContent = isOpen ? "▲" : "▼";
    });
}

function initializeCalendar() {
    monthSelect.value = 10;
    yearSelect.value = 2025;
}

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
    
    for (let x = firstDayIndex; x > 0; x--) {
        dates += `<div class="calendar-date other-month disabled">${prevLastDay.getDate() - x + 1}</div>`;
    }
    
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
    
    for (let j = 1; j <= nextDays; j++) {
        dates += `<div class="calendar-date other-month disabled">${j}</div>`;
    }
    
    calendarDates.innerHTML = dates;
    
    document.querySelectorAll('.calendar-date:not(.disabled)').forEach(dateEl => {
        dateEl.addEventListener('click', function() {
            document.querySelectorAll('.calendar-date').forEach(d => d.classList.remove('selected'));
            this.classList.add('selected');
            
            const day = parseInt(this.dataset.date);
            const month = parseInt(this.dataset.month);
            const year = parseInt(this.dataset.year);
            selectedDate = new Date(year, month, day);
            
            // Revalidate form when date is selected
            validateForm();
        });
    });
}

function getLocation(e) {
    e.preventDefault();
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
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
                            
                            // Revalidate after location is filled
                            validateForm();
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

async function handleFormSubmit(e) {
    e.preventDefault();
    
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
    
    if (mobile.length !== 10 || !/^[0-9]{10}$/.test(mobile)) {
        showError('Please enter a valid 10-digit mobile number');
        return;
    }
    
    if (pincode.length !== 6 || !/^[0-9]{6}$/.test(pincode)) {
        showError('Please enter a valid 6-digit pincode');
        return;
    }
    
    const concerns = Array.from(document.querySelectorAll('input[name="concern"]:checked'))
        .map(cb => cb.value);
    
    if (concerns.length === 0) {
        showError('Please select at least one concern');
        return;
    }
    
    if (!selectedDate) {
        showError('Please select a date for the home trial');
        return;
    }
    
    const timeSlot = document.querySelector('input[name="timeSlot"]:checked');
    if (!timeSlot) {
        showError('Please select a time slot');
        return;
    }
    
    if (!consentCheckbox.checked) {
        showError('Please accept the consent to proceed');
        return;
    }
    
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
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', GOOGLE_SCRIPT_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            window.location.href = `thankyou.html?name=${encodeURIComponent(formData.name)}&date=${encodeURIComponent(formData.appointmentDate)}&time=${encodeURIComponent(formData.timeSlot)}`;
        } else {
            showError('There was an error submitting your request. Please try again.');
            submitBtn.disabled = false;
            loadingMessage.style.display = 'none';
        }
    };
    
    xhr.onerror = function() {
        showError('Network error. Please check your connection and try again.');
        submitBtn.disabled = false;
        loadingMessage.style.display = 'none';
    };
    
    xhr.send(JSON.stringify(formData));
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
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