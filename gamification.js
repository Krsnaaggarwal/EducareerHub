// EduCareer Hub - Gamification System

// ============================================
// ACHIEVEMENTS SYSTEM
// ============================================

const ACHIEVEMENTS = {
    first_visit: {
        id: 'first_visit',
        title: 'Welcome Aboard!',
        description: 'Visited EduCareer Hub for the first time',
        icon: 'fa-star',
        points: 10
    },
    first_favorite: {
        id: 'first_favorite',
        title: 'Favorite Finder',
        description: 'Added your first college to favorites',
        icon: 'fa-heart',
        points: 15
    },
    assessment_completed: {
        id: 'assessment_completed',
        title: 'Self Discovery',
        description: 'Completed the college assessment quiz',
        icon: 'fa-clipboard-check',
        points: 25
    },
    compare_colleges: {
        id: 'compare_colleges',
        title: 'Comparison Expert',
        description: 'Compared colleges using the comparison tool',
        icon: 'fa-balance-scale',
        points: 20
    },
    explorer: {
        id: 'explorer',
        title: 'College Explorer',
        description: 'Viewed 10 different college profiles',
        icon: 'fa-compass',
        points: 30
    },
    researcher: {
        id: 'researcher',
        title: 'Dedicated Researcher',
        description: 'Spent more than 30 minutes on the site',
        icon: 'fa-search',
        points: 40
    },
    newsletter_subscribed: {
        id: 'newsletter_subscribed',
        title: 'Staying Connected',
        description: 'Subscribed to the newsletter',
        icon: 'fa-envelope',
        points: 15
    },
    profile_complete: {
        id: 'profile_complete',
        title: 'Profile Master',
        description: 'Completed your profile with all details',
        icon: 'fa-user-check',
        points: 35
    },
    decision_maker: {
        id: 'decision_maker',
        title: 'Decision Maker',
        description: 'Made your final college choice',
        icon: 'fa-trophy',
        points: 50
    },
    social_sharer: {
        id: 'social_sharer',
        title: 'Social Butterfly',
        description: 'Shared EduCareer Hub with friends',
        icon: 'fa-share-alt',
        points: 20
    }
};

// ============================================
// ACHIEVEMENT TRACKING
// ============================================

function checkAchievements() {
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
    
    // Check for first visit achievement
    if (!unlockedAchievements.includes('first_visit')) {
        const visits = JSON.parse(localStorage.getItem('userActivities') || '[]');
        if (visits.length === 0) {
            unlockAchievement('first_visit');
        }
    }
    
    // Check for explorer achievement
    if (!unlockedAchievements.includes('explorer')) {
        const viewedColleges = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        if (viewedColleges.length >= 10) {
            unlockAchievement('explorer');
        }
    }
    
    // Check for researcher achievement (time-based)
    if (!unlockedAchievements.includes('researcher')) {
        checkTimeSpentAchievement();
    }
    
    updateProgressIndicators();
}

function unlockAchievement(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return;
    
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
    
    if (unlockedAchievements.includes(achievementId)) {
        return; // Already unlocked
    }
    
    unlockedAchievements.push(achievementId);
    localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
    
    // Add points
    const currentPoints = parseInt(localStorage.getItem('totalPoints') || '0');
    const newPoints = currentPoints + achievement.points;
    localStorage.setItem('totalPoints', newPoints.toString());
    
    // Show achievement toast
    showAchievementToast(achievement);
    
    // Track event
    trackEvent('achievement_unlocked', { achievementId, points: achievement.points });
    
    // Update level
    updateUserLevel();
    
    // Play sound effect (optional)
    playAchievementSound();
}

function trackAchievement(achievementId) {
    unlockAchievement(achievementId);
}

function showAchievementToast(achievement) {
    const toast = document.getElementById('achievementToast');
    const text = document.getElementById('achievementText');
    
    if (!toast || !text) return;
    
    text.textContent = achievement.title;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

function playAchievementSound() {
    // Optional: Add achievement sound effect
    // const audio = new Audio('sounds/achievement.mp3');
    // audio.play().catch(() => {});
}

// ============================================
// PROGRESS TRACKING
// ============================================

function updateProgressIndicators() {
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    const progress = (unlockedAchievements.length / totalAchievements) * 100;
    
    // Update progress bars if they exist
    const progressBars = document.querySelectorAll('.achievement-progress');
    progressBars.forEach(bar => {
        bar.style.width = progress + '%';
    });
    
    // Update progress text
    const progressTexts = document.querySelectorAll('.achievement-progress-text');
    progressTexts.forEach(text => {
        text.textContent = `${unlockedAchievements.length}/${totalAchievements} Achievements`;
    });
}

function getProgressData() {
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
    const totalPoints = parseInt(localStorage.getItem('totalPoints') || '0');
    const userLevel = calculateUserLevel();
    
    return {
        achievements: unlockedAchievements.length,
        totalAchievements: Object.keys(ACHIEVEMENTS).length,
        points: totalPoints,
        level: userLevel,
        progress: (unlockedAchievements.length / Object.keys(ACHIEVEMENTS).length) * 100
    };
}

// ============================================
// USER LEVEL SYSTEM
// ============================================

function updateUserLevel() {
    const totalPoints = parseInt(localStorage.getItem('totalPoints') || '0');
    const level = calculateLevelFromPoints(totalPoints);
    
    localStorage.setItem('userLevel', level.toString());
    
    const levelElement = document.getElementById('userLevel');
    if (levelElement) {
        const currentLevel = parseInt(levelElement.textContent);
        if (level > currentLevel) {
            // Level up!
            levelElement.textContent = level;
            showLevelUpToast(level);
        }
    }
}

function calculateLevelFromPoints(points) {
    // Level formula: Every 100 points = 1 level
    return Math.floor(points / 100) + 1;
}

function showLevelUpToast(level) {
    showToast(`🎉 Level Up! You are now Level ${level}!`, 'success');
}

// ============================================
// TIME TRACKING
// ============================================

let sessionStartTime = Date.now();
let totalTimeSpent = parseInt(localStorage.getItem('totalTimeSpent') || '0');

function checkTimeSpentAchievement() {
    const currentSessionTime = Date.now() - sessionStartTime;
    const totalTime = totalTimeSpent + currentSessionTime;
    
    // 30 minutes = 1800000 milliseconds
    if (totalTime >= 1800000) {
        unlockAchievement('researcher');
    }
}

// Save time spent before leaving
window.addEventListener('beforeunload', () => {
    const currentSessionTime = Date.now() - sessionStartTime;
    const newTotalTime = totalTimeSpent + currentSessionTime;
    localStorage.setItem('totalTimeSpent', newTotalTime.toString());
});

// ============================================
// ACTIVITY STREAKS
// ============================================

function checkDailyStreak() {
    const lastVisitDate = localStorage.getItem('lastVisitDate');
    const today = new Date().toDateString();
    
    if (lastVisitDate !== today) {
        const streak = parseInt(localStorage.getItem('dailyStreak') || '0');
        
        if (lastVisitDate) {
            const lastDate = new Date(lastVisitDate);
            const todayDate = new Date(today);
            const diffTime = Math.abs(todayDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // Consecutive day
                const newStreak = streak + 1;
                localStorage.setItem('dailyStreak', newStreak.toString());
                
                if (newStreak === 7) {
                    showToast('🔥 7 Day Streak! Keep it up!', 'success');
                }
            } else if (diffDays > 1) {
                // Streak broken
                localStorage.setItem('dailyStreak', '1');
            }
        } else {
            localStorage.setItem('dailyStreak', '1');
        }
        
        localStorage.setItem('lastVisitDate', today);
    }
}

// Check streak on page load
checkDailyStreak();

// ============================================
// LEADERBOARD (Mock)
// ============================================

function getLeaderboardData() {
    const userData = getProgressData();
    
    // Mock leaderboard data
    return [
        { rank: 1, name: 'Rahul S.', points: 850, level: 9 },
        { rank: 2, name: 'Priya K.', points: 720, level: 8 },
        { rank: 3, name: 'Ankit P.', points: 680, level: 7 },
        { rank: 4, name: 'You', points: userData.points, level: userData.level },
        { rank: 5, name: 'Neha M.', points: 520, level: 6 }
    ].sort((a, b) => b.points - a.points).map((user, index) => ({
        ...user,
        rank: index + 1
    }));
}

// ============================================
// DAILY CHALLENGES
// ============================================

const DAILY_CHALLENGES = [
    {
        id: 'explore_3_colleges',
        title: 'College Explorer',
        description: 'View 3 different college profiles',
        points: 15,
        progress: 0,
        target: 3
    },
    {
        id: 'complete_assessment',
        title: 'Know Yourself',
        description: 'Complete the assessment quiz',
        points: 25,
        progress: 0,
        target: 1
    },
    {
        id: 'compare_2_colleges',
        title: 'Make Comparisons',
        description: 'Compare 2 colleges',
        points: 20,
        progress: 0,
        target: 1
    },
    {
        id: 'spend_10_minutes',
        title: 'Engaged Learner',
        description: 'Spend 10 minutes on the site',
        points: 10,
        progress: 0,
        target: 600000 // milliseconds
    }
];

function getDailyChallenges() {
    const lastChallengeDate = localStorage.getItem('lastChallengeDate');
    const today = new Date().toDateString();
    
    if (lastChallengeDate !== today) {
        // Reset daily challenges
        localStorage.setItem('lastChallengeDate', today);
        localStorage.setItem('dailyChallengeProgress', JSON.stringify({}));
    }
    
    const progress = JSON.parse(localStorage.getItem('dailyChallengeProgress') || '{}');
    
    return DAILY_CHALLENGES.map(challenge => ({
        ...challenge,
        progress: progress[challenge.id] || 0,
        completed: (progress[challenge.id] || 0) >= challenge.target
    }));
}

function updateChallengeProgress(challengeId, increment = 1) {
    const progress = JSON.parse(localStorage.getItem('dailyChallengeProgress') || '{}');
    progress[challengeId] = (progress[challengeId] || 0) + increment;
    localStorage.setItem('dailyChallengeProgress', JSON.stringify(progress));
    
    const challenge = DAILY_CHALLENGES.find(c => c.id === challengeId);
    if (challenge && progress[challengeId] >= challenge.target) {
        const totalPoints = parseInt(localStorage.getItem('totalPoints') || '0');
        localStorage.setItem('totalPoints', (totalPoints + challenge.points).toString());
        showToast(`✅ Challenge Complete: ${challenge.title} (+${challenge.points} points)`, 'success');
    }
}

// ============================================
// PROFILE COMPLETENESS
// ============================================

function calculateProfileCompleteness() {
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    const fields = [
        'name',
        'email',
        'phone',
        'state',
        'preferredBranch',
        'budgetRange',
        'examScore',
        'preferredLocation'
    ];
    
    const completedFields = fields.filter(field => profile[field]).length;
    const completeness = (completedFields / fields.length) * 100;
    
    if (completeness === 100) {
        unlockAchievement('profile_complete');
    }
    
    return {
        completeness,
        completedFields,
        totalFields: fields.length
    };
}

// ============================================
// BADGES DISPLAY
// ============================================

function renderAchievementBadges(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
    
    const html = Object.values(ACHIEVEMENTS).map(achievement => {
        const isUnlocked = unlockedAchievements.includes(achievement.id);
        
        return `
            <div class="achievement-badge ${isUnlocked ? '' : 'opacity-50 grayscale'} bg-white p-4 rounded-xl shadow-md text-center transition-all hover:scale-105">
                <div class="w-16 h-16 mx-auto mb-3 rounded-full ${isUnlocked ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-300'} flex items-center justify-center">
                    <i class="fas ${achievement.icon} text-2xl text-white"></i>
                </div>
                <h4 class="font-bold text-sm mb-1">${achievement.title}</h4>
                <p class="text-xs text-gray-600 mb-2">${achievement.description}</p>
                <span class="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                    ${achievement.points} pts
                </span>
                ${isUnlocked ? '<div class="text-green-500 text-xs mt-2"><i class="fas fa-check"></i> Unlocked</div>' : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

window.trackAchievement = trackAchievement;
window.updateChallengeProgress = updateChallengeProgress;
window.getProgressData = getProgressData;
window.getDailyChallenges = getDailyChallenges;
window.calculateProfileCompleteness = calculateProfileCompleteness;
window.renderAchievementBadges = renderAchievementBadges;
window.getLeaderboardData = getLeaderboardData;