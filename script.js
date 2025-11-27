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
    
    // Don't set default date anymore
    selectedDate = null;
    renderCalendar();
    
    initializeConcernCollapsible();
    
    // Initial validation check
    validateForm();
});

function setupEventListeners() {
    // Real-time validation on all mandatory fields
    const mandatoryFields = ['name', 'mobile', 'city', 'pincode', 'location'];
    mandatoryFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Clear error when user starts typing
            field.addEventListener('input', function() {
                const errorElement = document.getElementById(`${fieldId}-error`);
                if (errorElement) {
                    errorElement.style.display = 'none';
                    errorElement.classList.remove('show');
                }
                if (this.classList.contains('error')) {
                    this.classList.remove('error');
                }
                validateForm();
            });
            // Show error only when user leaves the field
            field.addEventListener('blur', function() {
                validateField(fieldId, true);
            });
        }
    });

    // Consent checkbox validation
    consentCheckbox.addEventListener('change', function() {
        const errorElement = document.getElementById('consent-error');
        if (errorElement && this.checked) {
            errorElement.style.display = 'none';
            errorElement.classList.remove('show');
        }
        validateForm();
    });

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
        const errorElement = document.getElementById('mobile-error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.classList.remove('show');
        }
        if (this.classList.contains('error')) {
            this.classList.remove('error');
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
        const errorElement = document.getElementById('pincode-error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.classList.remove('show');
        }
        if (this.classList.contains('error')) {
            this.classList.remove('error');
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
            const errorElement = document.getElementById('concern-error');
            if (errorElement && document.querySelectorAll('input[name="concern"]:checked').length > 0) {
                errorElement.style.display = 'none';
                errorElement.classList.remove('show');
            }
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
            const errorElement = document.getElementById('timeslot-error');
            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.classList.remove('show');
            }
            validateForm();
        });
    });
}

// Validate individual field and show error message only when explicitly asked
function validateField(fieldId, showError = false) {
    let isValid = true;
    let errorMsg = '';
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    switch(fieldId) {
        case 'name':
            const name = inputElement.value.trim();
            if (!name) {
                isValid = false;
                errorMsg = 'Please enter your name';
            }
            break;
            
        case 'mobile':
            const mobile = inputElement.value.trim();
            if (!mobile) {
                isValid = false;
                errorMsg = 'Please enter your mobile number';
            } else if (mobile.length !== 10 || !/^[0-9]{10}$/.test(mobile)) {
                isValid = false;
                errorMsg = 'Please enter a valid 10-digit mobile number';
            }
            break;
            
        case 'city':
            const city = inputElement.value.trim();
            if (!city) {
                isValid = false;
                errorMsg = 'Please enter your city';
            }
            break;
            
        case 'pincode':
            const pincode = inputElement.value.trim();
            if (!pincode) {
                isValid = false;
                errorMsg = 'Please enter your pincode';
            } else if (pincode.length !== 6 || !/^[0-9]{6}$/.test(pincode)) {
                isValid = false;
                errorMsg = 'Please enter a valid 6-digit pincode';
            }
            break;
            
        case 'location':
            const location = inputElement.value.trim();
            if (!location) {
                isValid = false;
                errorMsg = 'Please enter your location';
            }
            break;
            
        case 'concern':
            const concernsSelected = document.querySelectorAll('input[name="concern"]:checked').length > 0;
            if (!concernsSelected) {
                isValid = false;
                errorMsg = 'Please select at least one concern';
            }
            break;
            
        case 'date':
            if (!selectedDate) {
                isValid = false;
                errorMsg = 'Please select a date';
            }
            break;
            
        case 'timeslot':
            const timeSlotSelected = document.querySelector('input[name="timeSlot"]:checked') !== null;
            if (!timeSlotSelected) {
                isValid = false;
                errorMsg = 'Please select a time slot';
            }
            break;
            
        case 'consent':
            if (!consentCheckbox.checked) {
                isValid = false;
                errorMsg = 'Please accept the consent to proceed';
            }
            break;
    }
    
    // Show/hide error message ONLY if showError is true
    if (errorElement && showError) {
        if (!isValid) {
            errorElement.textContent = errorMsg;
            errorElement.style.display = 'block';
            errorElement.classList.add('show');
            if (inputElement) {
                inputElement.classList.add('error');
            }
        } else {
            errorElement.style.display = 'none';
            errorElement.classList.remove('show');
            if (inputElement) {
                inputElement.classList.remove('error');
            }
        }
    }
    
    return isValid;
}

// Validate entire form - Button always stays active
function validateForm() {
    // Just check if all fields are valid, but don't disable button
    const isNameValid = document.getElementById('name').value.trim() !== '';
    const isMobileValid = document.getElementById('mobile').value.trim().length === 10;
    const isCityValid = document.getElementById('city').value.trim() !== '';
    const isPincodeValid = document.getElementById('pincode').value.trim().length === 6;
    const isLocationValid = document.getElementById('location').value.trim() !== '';
    const isConcernValid = document.querySelectorAll('input[name="concern"]:checked').length > 0;
    const isDateValid = selectedDate !== null;
    const isTimeSlotValid = document.querySelector('input[name="timeSlot"]:checked') !== null;
    const isConsentValid = consentCheckbox.checked;
    
    const isFormValid = 
        isNameValid && 
        isMobileValid && 
        isCityValid && 
        isPincodeValid && 
        isLocationValid && 
        isConcernValid && 
        isDateValid && 
        isTimeSlotValid && 
        isConsentValid;
    
    // Button is ALWAYS enabled
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
    
    return isFormValid;
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
            
            // Clear date error when date is selected
            const errorElement = document.getElementById('date-error');
            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.classList.remove('show');
            }
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
                                const pincodeError = document.getElementById('pincode-error');
                                if (pincodeError) {
                                    pincodeError.style.display = 'none';
                                    pincodeError.classList.remove('show');
                                }
                            }
                            if (data.address.city || data.address.town || data.address.village) {
                                cityInput.value = data.address.city || data.address.town || data.address.village;
                                const cityError = document.getElementById('city-error');
                                if (cityError) {
                                    cityError.style.display = 'none';
                                    cityError.classList.remove('show');
                                }
                            }
                            locationInput.value = data.display_name || '';
                            const locationError = document.getElementById('location-error');
                            if (locationError) {
                                locationError.style.display = 'none';
                                locationError.classList.remove('show');
                            }
                            
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
    
    // Validate all fields and show errors for invalid ones
    let allValid = true;
    let firstErrorField = null;
    
    const fieldsToValidate = ['name', 'mobile', 'city', 'pincode', 'location', 'concern', 'date', 'timeslot', 'consent'];
    
    fieldsToValidate.forEach(fieldId => {
        if (!validateField(fieldId, true)) {
            allValid = false;
            if (!firstErrorField) {
                firstErrorField = fieldId;
            }
        }
    });
    
    // If form is not valid, scroll to first error
    if (!allValid) {
        const firstError = document.getElementById(`${firstErrorField}-error`);
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // If all valid, proceed with submission
    const name = document.getElementById('name').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const pincode = document.getElementById('pincode').value.trim();
    const location = document.getElementById('location').value.trim();
    
    const concerns = Array.from(document.querySelectorAll('input[name="concern"]:checked'))
        .map(cb => cb.value);
    
    const timeSlot = document.querySelector('input[name="timeSlot"]:checked');
    
    submitBtn.disabled = true;
    loadingMessage.style.display = 'block';
    
    const formData = {
        name: name,
        mobile: mobile,
        address: address,
        city: city,
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
xhr.open('POST', '/api/submit', true);
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
