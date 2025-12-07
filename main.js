// EduCareer Hub - Main JavaScript File

// ============================================
// GLOBAL VARIABLES & STATE
// ============================================

let colleges = [];
let exams = [];
let statistics = [];
let userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {};
let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
    initializeScrollProgress();
    checkAchievements();
    showWelcomeMessage();
});

function initializeApp() {
    console.log('EduCareer Hub initializing...');
    
    // Set user level
    const userLevel = calculateUserLevel();
    const levelElement = document.getElementById('userLevel');
    if (levelElement) {
        levelElement.textContent = userLevel;
    }
    
    // Initialize notifications
    updateNotificationBadge();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// ============================================
// DATA LOADING
// ============================================

async function loadInitialData() {
    try {
        await Promise.all([
            loadStatistics(),
            loadFeaturedColleges(),
            loadExamCountdowns()
        ]);
        
        // Load placement chart after data is loaded
        if (document.getElementById('placementChart')) {
            loadPlacementChart();
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
        showErrorToast('Failed to load data. Please refresh the page.');
    }
}

async function loadStatistics() {
    try {
        const response = await fetch('tables/statistics?limit=100');
        const data = await response.json();
        statistics = data.data || [];
        renderStatistics();
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function renderStatistics() {
    const container = document.getElementById('statsContainer');
    if (!container) return;
    
    container.innerHTML = statistics.map(stat => `
        <div class="stat-card animate-fade-in-up">
            <div class="flex items-start space-x-4">
                <div class="stat-icon bg-gradient-to-br from-purple-500 to-pink-500">
                    <i class="${stat.icon}"></i>
                </div>
                <div class="flex-1">
                    <h3 class="text-3xl font-bold text-gray-800 mb-1">${stat.value}</h3>
                    <p class="text-lg font-semibold text-gray-700 mb-1">${stat.label}</p>
                    <p class="text-sm text-gray-500">${stat.description}</p>
                    ${stat.trend ? `
                        <div class="mt-2 inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            stat.trend === 'up' ? 'bg-green-100 text-green-700' : 
                            stat.trend === 'down' ? 'bg-red-100 text-red-700' : 
                            'bg-gray-100 text-gray-700'
                        }">
                            <i class="fas fa-arrow-${stat.trend === 'up' ? 'up' : stat.trend === 'down' ? 'down' : 'right'}"></i>
                            <span>${stat.trend === 'up' ? 'Growing' : stat.trend === 'down' ? 'Declining' : 'Stable'}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    // Animate counters
    animateCounters();
}

async function loadFeaturedColleges() {
    try {
        const response = await fetch('tables/colleges?limit=6&sort=nirf_rank');
        const data = await response.json();
        colleges = data.data || [];
        renderFeaturedColleges();
    } catch (error) {
        console.error('Error loading colleges:', error);
    }
}

function renderFeaturedColleges() {
    const container = document.getElementById('featuredColleges');
    if (!container) return;
    
    container.innerHTML = colleges.slice(0, 6).map((college, index) => `
        <div class="college-card relative animate-fade-in-up" style="animation-delay: ${index * 0.1}s">
            <div class="college-card-rank">#${college.nirf_rank}</div>
            <div class="college-card-badge">${college.type}</div>
            
            <div class="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <i class="fas fa-university text-6xl text-purple-600 opacity-50"></i>
            </div>
            
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-2 truncate-2-lines">
                    ${college.short_name || college.name}
                </h3>
                <p class="text-gray-600 mb-4 flex items-center">
                    <i class="fas fa-map-marker-alt mr-2 text-purple-600"></i>
                    ${college.city}, ${college.state}
                </p>
                
                <div class="space-y-2 mb-4">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">NIRF Score</span>
                        <span class="font-bold text-purple-600">${college.nirf_score}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Avg Package</span>
                        <span class="font-bold text-green-600">₹${college.avg_package} LPA</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Placement Rate</span>
                        <span class="font-bold text-blue-600">${college.placement_rate}%</span>
                    </div>
                </div>
                
                <div class="flex items-center space-x-2 mb-4">
                    ${(college.highlights || []).slice(0, 2).map(h => `
                        <span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                            ${h}
                        </span>
                    `).join('')}
                </div>
                
                <div class="flex space-x-2">
                    <a href="college-detail.html?id=${college.id}" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg text-center font-semibold hover:shadow-lg transition">
                        View Details
                    </a>
                    <button onclick="toggleFavorite('${college.id}')" class="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-200 transition">
                        <i class="fas fa-heart ${isFavorite(college.id) ? 'text-red-500' : ''}"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadExamCountdowns() {
    try {
        const response = await fetch('tables/exams?limit=6');
        const data = await response.json();
        exams = data.data || [];
        renderExamCountdowns();
        
        // Update countdowns every second
        setInterval(updateCountdowns, 1000);
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

function renderExamCountdowns() {
    const container = document.getElementById('examCountdown');
    if (!container) return;
    
    const upcomingExams = exams.filter(exam => exam.status === 'upcoming').slice(0, 3);
    
    container.innerHTML = upcomingExams.map((exam, index) => `
        <div class="bg-white rounded-2xl shadow-lg p-6 animate-fade-in-up" style="animation-delay: ${index * 0.1}s">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">${exam.name}</h3>
                    <p class="text-sm text-gray-600">${exam.full_name}</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-calendar-alt text-white text-xl"></i>
                </div>
            </div>
            
            <div class="mb-4">
                <p class="text-sm text-gray-600 mb-1">Exam Date</p>
                <p class="font-semibold text-gray-800">${formatDate(exam.exam_date)}</p>
            </div>
            
            <div class="countdown-timer mb-4" data-exam-date="${exam.exam_date}" data-exam-id="${exam.id}">
                <div class="countdown-item">
                    <span class="countdown-value days">00</span>
                    <span class="countdown-label">Days</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-value hours">00</span>
                    <span class="countdown-label">Hours</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-value minutes">00</span>
                    <span class="countdown-label">Mins</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-value seconds">00</span>
                    <span class="countdown-label">Secs</span>
                </div>
            </div>
            
            ${exam.total_registrations ? `
                <p class="text-sm text-gray-600">
                    <i class="fas fa-users mr-1"></i>
                    ${formatNumber(exam.total_registrations)} registered
                </p>
            ` : ''}
        </div>
    `).join('');
    
    updateCountdowns();
}

function updateCountdowns() {
    const countdowns = document.querySelectorAll('.countdown-timer');
    
    countdowns.forEach(countdown => {
        const examDate = new Date(countdown.dataset.examDate);
        const now = new Date();
        const difference = examDate - now;
        
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            countdown.querySelector('.days').textContent = String(days).padStart(2, '0');
            countdown.querySelector('.hours').textContent = String(hours).padStart(2, '0');
            countdown.querySelector('.minutes').textContent = String(minutes).padStart(2, '0');
            countdown.querySelector('.seconds').textContent = String(seconds).padStart(2, '0');
        } else {
            countdown.innerHTML = '<div class="text-center text-red-600 font-bold">Exam Completed</div>';
        }
    });
}

// ============================================
// CHART RENDERING
// ============================================

function loadPlacementChart() {
    const ctx = document.getElementById('placementChart');
    if (!ctx) return;
    
    const topColleges = colleges.slice(0, 10);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topColleges.map(c => c.short_name || c.name),
            datasets: [{
                label: 'Average Package (₹ LPA)',
                data: topColleges.map(c => c.avg_package),
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 2,
                borderRadius: 8
            }, {
                label: 'Median Package (₹ LPA)',
                data: topColleges.map(c => c.median_package),
                backgroundColor: 'rgba(236, 72, 153, 0.8)',
                borderColor: 'rgba(236, 72, 153, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                title: {
                    display: true,
                    text: 'Placement Packages Comparison (Top 10 Colleges)',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: 20
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Package (₹ Lakhs)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Chat widget
    const chatWidget = document.getElementById('chatWidget');
    const chatBox = document.getElementById('chatBox');
    
    if (chatWidget && chatBox) {
        chatWidget.addEventListener('click', () => {
            chatBox.classList.toggle('hidden');
            if (!chatBox.classList.contains('hidden')) {
                trackEvent('chat_opened');
            }
        });
    }
    
    // Notification button
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    
    if (notificationBtn && notificationPanel) {
        notificationBtn.addEventListener('click', () => {
            notificationPanel.classList.toggle('hidden');
            if (!notificationPanel.classList.contains('hidden')) {
                loadNotifications();
            }
        });
    }
    
    // Quick search
    const quickSearch = document.getElementById('quickSearch');
    if (quickSearch) {
        quickSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performQuickSearch();
            }
        });
    }
    
    // Chat input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
}

// ============================================
// SCROLL PROGRESS
// ============================================

function initializeScrollProgress() {
    window.addEventListener('scroll', updateScrollProgress);
}

function updateScrollProgress() {
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;
    
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.scrollY;
    const progress = (scrolled / documentHeight) * 100;
    
    progressBar.style.width = progress + '%';
    
    // Navbar shadow on scroll
    const navbar = document.getElementById('navbar');
    if (navbar) {
        if (scrolled > 50) {
            navbar.classList.add('shadow-lg');
        } else {
            navbar.classList.remove('shadow-lg');
        }
    }
}

// ============================================
// COUNTER ANIMATIONS
// ============================================

function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const target = parseFloat(counter.dataset.target);
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(updateCounter);
            } else {
                counter.textContent = current.toFixed(2);
            }
        }, 20);
    });
}

// ============================================
// QUICK SEARCH
// ============================================

function performQuickSearch() {
    const searchInput = document.getElementById('quickSearch');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (query) {
        trackEvent('quick_search', { query });
        window.location.href = `colleges.html?search=${encodeURIComponent(query)}`;
    }
}

// ============================================
// FAVORITES
// ============================================

function toggleFavorite(collegeId) {
    const index = favorites.indexOf(collegeId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showToast('Removed from favorites', 'info');
    } else {
        favorites.push(collegeId);
        showToast('Added to favorites', 'success');
        trackAchievement('first_favorite');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Re-render if on current page
    if (document.getElementById('featuredColleges')) {
        renderFeaturedColleges();
    }
}

function isFavorite(collegeId) {
    return favorites.includes(collegeId);
}

// ============================================
// CHAT FUNCTIONALITY
// ============================================

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    
    if (!input || !messages) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    const userMessageHTML = `
        <div class="flex items-start space-x-2 justify-end">
            <div class="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3 rounded-lg shadow max-w-xs">
                <p class="text-sm">${escapeHtml(message)}</p>
            </div>
            <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 flex-shrink-0">
                <i class="fas fa-user text-sm"></i>
            </div>
        </div>
    `;
    
    messages.innerHTML += userMessageHTML;
    input.value = '';
    
    // Scroll to bottom
    messages.scrollTop = messages.scrollHeight;
    
    // Simulate bot response
    setTimeout(() => {
        const botResponse = generateBotResponse(message);
        const botMessageHTML = `
            <div class="flex items-start space-x-2">
                <div class="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <i class="fas fa-robot text-sm"></i>
                </div>
                <div class="bg-white p-3 rounded-lg shadow max-w-xs">
                    <p class="text-sm">${botResponse}</p>
                </div>
            </div>
        `;
        
        messages.innerHTML += botMessageHTML;
        messages.scrollTop = messages.scrollHeight;
    }, 1000);
    
    trackEvent('chat_message_sent');
}

function generateBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('jee') || lowerMessage.includes('exam')) {
        return 'For JEE Main 2025, registrations have crossed 15.39 lakh candidates! Check our Timeline page for important dates.';
    } else if (lowerMessage.includes('iit') || lowerMessage.includes('college')) {
        return 'We have detailed information on top colleges including IITs, NITs, and private institutions. Visit our Colleges page to explore!';
    } else if (lowerMessage.includes('placement') || lowerMessage.includes('package')) {
        return 'Top IITs offer average packages of ₹18-21 LPA. Check individual college profiles for detailed placement statistics.';
    } else if (lowerMessage.includes('fee') || lowerMessage.includes('cost')) {
        return 'IIT fees are around ₹9 lakhs for 4 years, while top NITs charge approximately ₹6 lakhs. Use our Compare tool to check fees.';
    } else if (lowerMessage.includes('help')) {
        return 'I can help you with college information, exam dates, placements, fees, and admissions. What would you like to know?';
    } else {
        return 'I can help you find the perfect engineering college! Try asking about exams, colleges, placements, or fees.';
    }
}

function closeChatBox() {
    const chatBox = document.getElementById('chatBox');
    if (chatBox) {
        chatBox.classList.add('hidden');
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

function loadNotifications() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    const notifications = getNotifications();
    
    if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="p-4 text-center text-gray-500">No new notifications</div>';
        return;
    }
    
    notificationList.innerHTML = notifications.map(notif => `
        <div class="p-4 hover:bg-gray-50 cursor-pointer">
            <div class="flex items-start space-x-3">
                <div class="w-10 h-10 bg-${notif.color}-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="${notif.icon} text-${notif.color}-600"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-semibold text-sm text-gray-800">${notif.title}</h4>
                    <p class="text-xs text-gray-600 mt-1">${notif.message}</p>
                    <p class="text-xs text-gray-400 mt-1">${notif.time}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function getNotifications() {
    // Generate dynamic notifications based on upcoming exams
    const notifications = [];
    
    exams.forEach(exam => {
        const examDate = new Date(exam.exam_date);
        const now = new Date();
        const daysUntil = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntil > 0 && daysUntil <= 30) {
            notifications.push({
                icon: 'fas fa-calendar-alt',
                color: 'orange',
                title: `${exam.name} approaching!`,
                message: `Only ${daysUntil} days left until ${exam.name}`,
                time: 'Just now'
            });
        }
    });
    
    return notifications.slice(0, 5);
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    const count = getNotifications().length;
    
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function closeNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

// ============================================
// NEWSLETTER
// ============================================

function subscribeNewsletter() {
    const emailInput = document.getElementById('newsletterEmail');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showToast('Please enter your email', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email', 'error');
        return;
    }
    
    // Save to local storage (in real app, send to server)
    const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
    if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
    }
    
    emailInput.value = '';
    showToast('Successfully subscribed! Check your email.', 'success');
    trackAchievement('newsletter_subscribed');
    trackEvent('newsletter_subscribed', { email });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

function formatNumber(num) {
    if (num >= 100000) {
        return (num / 100000).toFixed(2) + ' Lakh';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 left-6 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-slide-in-right`;
    toast.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} text-xl"></i>
            <p class="font-semibold">${message}</p>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showErrorToast(message) {
    showToast(message, 'error');
}

function calculateUserLevel() {
    const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
    const level = Math.floor(activities.length / 10) + 1;
    return Math.min(level, 10);
}

function trackEvent(eventName, data = {}) {
    const events = JSON.parse(localStorage.getItem('userActivities') || '[]');
    events.push({
        event: eventName,
        data: data,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('userActivities', JSON.stringify(events));
    
    // Update user level
    const newLevel = calculateUserLevel();
    const levelElement = document.getElementById('userLevel');
    if (levelElement) {
        levelElement.textContent = newLevel;
    }
}

function showWelcomeMessage() {
    const lastVisit = localStorage.getItem('lastVisit');
    const now = new Date().toISOString();
    
    if (!lastVisit) {
        setTimeout(() => {
            showToast('Welcome to EduCareer Hub! 🎓', 'success');
        }, 1000);
    }
    
    localStorage.setItem('lastVisit', now);
}