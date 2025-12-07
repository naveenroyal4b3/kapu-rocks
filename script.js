// Data Storage (using localStorage)
const Storage = {
    get: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    add: (key, item) => {
        const items = Storage.get(key);
        items.push({ ...item, id: Date.now() });
        Storage.set(key, items);
        return items;
    },
    getItem: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    setItem: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

// Authentication System
const AuthManager = {
    currentUser: null,
    
    init: () => {
        // Load current session
        const session = Storage.getItem('currentSession');
        if (session) {
            AuthManager.currentUser = session;
            AuthManager.updateUI();
        }
        
        // Initialize sample users (for demo)
        if (Storage.get('users').length === 0) {
            Storage.set('users', [
                {
                    id: 1,
                    name: 'Admin User',
                    email: 'admin@kapurocks.com',
                    mobile: '+91 98765 43210',
                    password: 'admin123', // In production, this should be hashed
                    role: 'admin',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Owner User',
                    email: 'owner@kapurocks.com',
                    mobile: '+91 98765 43211',
                    password: 'owner123',
                    role: 'owner',
                    createdAt: new Date().toISOString()
                }
            ]);
        }
    },

    login: (emailOrMobile, password, loginType) => {
        const users = Storage.get('users');
        let user = null;

        if (loginType === 'gmail') {
            user = users.find(u => u.email === emailOrMobile && u.password === password);
        } else if (loginType === 'mobile') {
            // For mobile, we'll use OTP verification (simplified for demo)
            user = users.find(u => u.mobile === emailOrMobile);
            if (user && password === '123456') { // Demo OTP
                // In production, verify OTP properly
            } else {
                return { success: false, message: 'Invalid OTP' };
            }
        }

        if (user) {
            AuthManager.currentUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            };
            Storage.setItem('currentSession', AuthManager.currentUser);
            AuthManager.updateUI();
            return { success: true, user: AuthManager.currentUser };
        }

        return { success: false, message: 'Invalid credentials' };
    },

    register: (userData, registerType) => {
        const users = Storage.get('users');
        
        // Check if email or mobile already exists
        if (registerType === 'gmail') {
            if (users.find(u => u.email === userData.email)) {
                return { success: false, message: 'Email already registered' };
            }
        } else {
            if (users.find(u => u.mobile === userData.mobile)) {
                return { success: false, message: 'Mobile number already registered' };
            }
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            name: userData.name,
            email: userData.email || '',
            mobile: userData.mobile || '',
            password: userData.password,
            role: 'user', // Default role
            createdAt: new Date().toISOString()
        };

        Storage.add('users', newUser);
        
        // Auto-login after registration
        AuthManager.currentUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile,
            role: newUser.role
        };
        Storage.setItem('currentSession', AuthManager.currentUser);
        AuthManager.updateUI();
        
        return { success: true, user: AuthManager.currentUser };
    },

    logout: () => {
        AuthManager.currentUser = null;
        Storage.setItem('currentSession', null);
        AuthManager.updateUI();
        AdminManager.updateUI();
    },

    isAuthenticated: () => {
        return AuthManager.currentUser !== null;
    },

    hasRole: (role) => {
        if (!AuthManager.isAuthenticated()) return false;
        return AuthManager.currentUser.role === role;
    },

    hasPrivilege: (privilege) => {
        if (!AuthManager.isAuthenticated()) return false;
        const role = AuthManager.currentUser.role;
        
        // Owner has all privileges
        if (role === 'owner') return true;
        
        // Admin privileges
        if (role === 'admin' && ['approve_business', 'reject_business', 'view_pending'].includes(privilege)) {
            return true;
        }
        
        // User privileges
        if (role === 'user' && ['add_business', 'add_meeting', 'add_achievement'].includes(privilege)) {
            return true;
        }
        
        return false;
    },

    syncAccounts: (email, mobile) => {
        if (!AuthManager.isAuthenticated()) return false;
        
        const users = Storage.get('users');
        const userIndex = users.findIndex(u => u.id === AuthManager.currentUser.id);
        
        if (userIndex !== -1) {
            if (email && !users[userIndex].email) {
                users[userIndex].email = email;
            }
            if (mobile && !users[userIndex].mobile) {
                users[userIndex].mobile = mobile;
            }
            Storage.set('users', users);
            
            // Update current session
            AuthManager.currentUser.email = users[userIndex].email;
            AuthManager.currentUser.mobile = users[userIndex].mobile;
            Storage.setItem('currentSession', AuthManager.currentUser);
            
            return true;
        }
        return false;
    },

    updateUI: () => {
        const authButtons = document.getElementById('authButtons');
        const adminButtonContainer = document.getElementById('adminButtonContainer');
        const userProfileDropdown = document.getElementById('userProfileDropdown');
        
        if (AuthManager.isAuthenticated()) {
            // Hide login button, show user profile
            authButtons.innerHTML = `
                <button id="userProfileBtn" class="user-profile-btn">
                    <i class="fas fa-user"></i> ${AuthManager.currentUser.name}
                </button>
            `;
            
            // Show logout button directly
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
            }
            
            // Show admin button if user is admin or owner
            if (AuthManager.hasRole('admin') || AuthManager.hasRole('owner')) {
                adminButtonContainer.style.display = 'block';
            } else {
                adminButtonContainer.style.display = 'none';
            }
            
            // Update user profile dropdown
            document.getElementById('userDisplayName').textContent = AuthManager.currentUser.name;
            document.getElementById('userDisplayEmail').textContent = AuthManager.currentUser.email || AuthManager.currentUser.mobile;
            document.getElementById('userDisplayRole').textContent = AuthManager.currentUser.role.charAt(0).toUpperCase() + AuthManager.currentUser.role.slice(1);
            
            // Show owner menu if owner
            if (AuthManager.hasRole('owner')) {
                document.getElementById('ownerMenu').style.display = 'block';
            } else {
                document.getElementById('ownerMenu').style.display = 'none';
            }
            
            // Ensure dropdown is initially hidden
            userProfileDropdown.style.display = 'none';
            
            // Add profile button click handler (remove old one first)
            const profileBtn = document.getElementById('userProfileBtn');
            if (profileBtn) {
                // Clone to remove old listeners
                const newProfileBtn = profileBtn.cloneNode(true);
                profileBtn.parentNode.replaceChild(newProfileBtn, profileBtn);
                
                newProfileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const dropdown = document.getElementById('userProfileDropdown');
                    if (dropdown) {
                        const isVisible = dropdown.style.display === 'block';
                        dropdown.style.display = isVisible ? 'none' : 'block';
                    }
                });
            }
            
            // Attach logout button handlers (both direct button and dropdown)
            const directLogoutBtn = document.getElementById('logoutBtn');
            if (directLogoutBtn) {
                // Clone to remove old listeners
                const newDirectLogoutBtn = directLogoutBtn.cloneNode(true);
                directLogoutBtn.parentNode.replaceChild(newDirectLogoutBtn, directLogoutBtn);
                
                newDirectLogoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    AuthManager.logout();
                    showNotification('Logged out successfully', 'info');
                });
            }
            
            // Attach dropdown logout button handler
            const dropdownLogoutBtn = document.getElementById('logoutBtnDropdown');
            if (dropdownLogoutBtn) {
                // Clone to remove old listeners
                const newDropdownLogoutBtn = dropdownLogoutBtn.cloneNode(true);
                dropdownLogoutBtn.parentNode.replaceChild(newDropdownLogoutBtn, dropdownLogoutBtn);
                
                newDropdownLogoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    AuthManager.logout();
                    showNotification('Logged out successfully', 'info');
                });
            }
            
        } else {
            // Show login button, hide logout button
            authButtons.innerHTML = `
                <button id="loginBtn" class="btn-login"><i class="fas fa-sign-in-alt"></i> Login</button>
            `;
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }
            adminButtonContainer.style.display = 'none';
            if (userProfileDropdown) {
                userProfileDropdown.style.display = 'none';
            }
        }
    }
};

// Approval System Helper
const ApprovalSystem = {
    isFullyApproved: (item) => {
        return item.level1Approval && item.level2Approval && item.level3Approval;
    },

    getApprovalCount: (item) => {
        let count = 0;
        if (item.level1Approval) count++;
        if (item.level2Approval) count++;
        if (item.level3Approval) count++;
        return count;
    },

    approve: (item, level, adminId) => {
        if (level === 1) {
            item.level1Approval = { adminId, approvedAt: new Date().toISOString() };
        } else if (level === 2) {
            item.level2Approval = { adminId, approvedAt: new Date().toISOString() };
        } else if (level === 3) {
            item.level3Approval = { adminId, approvedAt: new Date().toISOString() };
        }
        
        // Auto-set status to approved if all 3 levels are approved
        if (ApprovalSystem.isFullyApproved(item)) {
            item.status = 'approved';
        }
        
        return item;
    },

    reject: (item, adminId) => {
        item.status = 'rejected';
        item.rejectedBy = adminId;
        item.rejectedAt = new Date().toISOString();
        return item;
    }
};

// Initialize sample data if empty
const initializeSampleData = () => {
    if (Storage.get('businesses').length === 0) {
        Storage.set('businesses', [
            {
                id: 1,
                name: 'Kapu Tech Solutions',
                owner: 'Rajesh Kapu',
                category: 'technology',
                description: 'Leading software development and IT consulting services for businesses.',
                email: 'contact@kaputech.com',
                phone: '+91 98765 43210',
                address: 'Hyderabad, Telangana',
                website: 'https://kaputech.com',
                status: 'approved',
                level1Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level2Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level3Approval: { adminId: 1, approvedAt: new Date().toISOString() }
            },
            {
                id: 2,
                name: 'Balija Spices & Foods',
                owner: 'Priya Balija',
                category: 'food',
                description: 'Authentic South Indian spices and traditional food products.',
                email: 'info@balijaspices.com',
                phone: '+91 98765 43211',
                address: 'Chennai, Tamil Nadu',
                website: '',
                status: 'approved',
                level1Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level2Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level3Approval: { adminId: 1, approvedAt: new Date().toISOString() }
            },
            {
                id: 3,
                name: 'Kapu Educational Academy',
                owner: 'Dr. Suresh Kapu',
                category: 'education',
                description: 'Quality education and coaching for competitive exams.',
                email: 'academy@kapuedu.com',
                phone: '+91 98765 43212',
                address: 'Bangalore, Karnataka',
                website: 'https://kapuedu.com',
                status: 'approved',
                level1Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level2Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level3Approval: { adminId: 1, approvedAt: new Date().toISOString() }
            }
        ]);
    }

    if (Storage.get('meetings').length === 0) {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);

        Storage.set('meetings', [
            {
                id: 1,
                title: 'Monthly Community Gathering',
                type: 'monthly',
                date: nextMonth.toISOString().split('T')[0],
                time: '18:00',
                location: 'Community Hall, Hyderabad',
                description: 'Monthly meetup to discuss community initiatives and networking.',
                status: 'approved',
                level1Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level2Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level3Approval: { adminId: 1, approvedAt: new Date().toISOString() }
            },
            {
                id: 2,
                title: 'Weekly Business Networking',
                type: 'weekly',
                date: nextWeek.toISOString().split('T')[0],
                time: '19:00',
                location: 'Online - Zoom',
                description: 'Weekly networking session for business owners and entrepreneurs.',
                status: 'approved',
                level1Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level2Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level3Approval: { adminId: 1, approvedAt: new Date().toISOString() }
            }
        ]);
    }

    if (Storage.get('achievements').length === 0) {
        Storage.set('achievements', [
            {
                id: 1,
                person: 'Dr. Anil Kapu',
                title: 'Published Research Paper',
                category: 'academic',
                description: 'Published groundbreaking research in medical science, contributing to community recognition.',
                date: new Date().toISOString().split('T')[0],
                status: 'approved',
                level1Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level2Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level3Approval: { adminId: 1, approvedAt: new Date().toISOString() }
            },
            {
                id: 2,
                person: 'Sneha Balija',
                title: 'Business Excellence Award',
                category: 'business',
                description: 'Received state-level award for outstanding contribution to entrepreneurship.',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'approved',
                level1Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level2Approval: { adminId: 1, approvedAt: new Date().toISOString() },
                level3Approval: { adminId: 1, approvedAt: new Date().toISOString() }
            }
        ]);
    }
};

// Business Management
const BusinessManager = {
    render: (filter = 'all', searchTerm = '') => {
        const businesses = Storage.get('businesses');
        const grid = document.getElementById('businessGrid');
        
        // Only show fully approved businesses (all 3 levels) to regular users
        let filtered = businesses.filter(b => ApprovalSystem.isFullyApproved(b));
        
        if (filter !== 'all') {
            filtered = filtered.filter(b => b.category === filter);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(b => 
                b.name.toLowerCase().includes(term) ||
                b.owner.toLowerCase().includes(term) ||
                b.description.toLowerCase().includes(term)
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-store"></i>
                    <p>No businesses found. Be the first to add your business!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(business => `
            <div class="business-card">
                <div class="business-card-header">
                    <div class="business-name">${business.name}</div>
                    <div class="business-category">${business.category}</div>
                </div>
                <div class="business-owner">
                    <i class="fas fa-user"></i> Owner: ${business.owner}
                </div>
                <div class="business-description">${business.description}</div>
                <div class="business-contact">
                    ${business.email ? `<div><i class="fas fa-envelope"></i> ${business.email}</div>` : ''}
                    ${business.phone ? `<div><i class="fas fa-phone"></i> ${business.phone}</div>` : ''}
                    ${business.address ? `<div><i class="fas fa-map-marker-alt"></i> ${business.address}</div>` : ''}
                    ${business.website ? `<div><a href="${business.website}" target="_blank" class="business-website"><i class="fas fa-globe"></i> Visit Website</a></div>` : ''}
                </div>
            </div>
        `).join('');
    },

    add: (businessData) => {
        // Set status as pending with no approvals - requires 3-level approval
        const businessWithStatus = { 
            ...businessData, 
            status: 'pending',
            level1Approval: null,
            level2Approval: null,
            level3Approval: null,
            submittedBy: AuthManager.currentUser?.id,
            submittedAt: new Date().toISOString()
        };
        Storage.add('businesses', businessWithStatus);
        BusinessManager.render();
        showNotification('Business submitted successfully! It requires approval from 3 admins before being published.', 'info');
    },

    getPending: () => {
        return Storage.get('businesses').filter(b => !ApprovalSystem.isFullyApproved(b) && b.status !== 'rejected');
    },

    updateStatus: (businessId, status) => {
        const businesses = Storage.get('businesses');
        const index = businesses.findIndex(b => b.id === businessId);
        if (index !== -1) {
            businesses[index].status = status;
            Storage.set('businesses', businesses);
            return true;
        }
        return false;
    },

    getPending: () => {
        return Storage.get('businesses').filter(b => b.status === 'pending');
    }
};

// Meeting Management
const MeetingManager = {
    render: (tab = 'upcoming') => {
        const meetings = Storage.get('meetings');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let filtered = [];
        
        // Only show fully approved meetings (all 3 levels)
        let approvedMeetings = meetings.filter(m => ApprovalSystem.isFullyApproved(m));
        
        if (tab === 'upcoming') {
            filtered = approvedMeetings.filter(m => new Date(m.date) >= today);
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (tab === 'weekly') {
            filtered = approvedMeetings.filter(m => m.type === 'weekly');
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (tab === 'monthly') {
            filtered = approvedMeetings.filter(m => m.type === 'monthly');
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (tab === 'past') {
            filtered = approvedMeetings.filter(m => new Date(m.date) < today);
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        const containerId = tab === 'upcoming' ? 'upcomingMeetings' : 
                           tab === 'weekly' ? 'weeklyMeetings' :
                           tab === 'monthly' ? 'monthlyMeetings' : 'pastMeetings';
        const container = document.getElementById(containerId);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No ${tab} meetings scheduled.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(meeting => {
            const meetingDate = new Date(meeting.date);
            const formattedDate = meetingDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            return `
                <div class="meeting-card">
                    <div class="meeting-header">
                        <div class="meeting-title">${meeting.title}</div>
                        <div class="meeting-type">${meeting.type}</div>
                    </div>
                    <div class="meeting-details">
                        <div class="meeting-detail">
                            <i class="fas fa-calendar"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="meeting-detail">
                            <i class="fas fa-clock"></i>
                            <span>${meeting.time}</span>
                        </div>
                        <div class="meeting-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${meeting.location}</span>
                        </div>
                    </div>
                    ${meeting.description ? `<div class="meeting-description">${meeting.description}</div>` : ''}
                </div>
            `;
        }).join('');
    },

    add: (meetingData) => {
        // Set status as pending with no approvals - requires 3-level approval
        const meetingWithStatus = {
            ...meetingData,
            status: 'pending',
            level1Approval: null,
            level2Approval: null,
            level3Approval: null,
            submittedBy: AuthManager.currentUser?.id,
            submittedAt: new Date().toISOString()
        };
        Storage.add('meetings', meetingWithStatus);
        MeetingManager.render('upcoming');
        MeetingManager.render('weekly');
        MeetingManager.render('monthly');
        MeetingManager.render('past');
        showNotification('Meeting submitted successfully! It requires approval from 3 admins before being published.', 'info');
    },

    getPending: () => {
        return Storage.get('meetings').filter(m => !ApprovalSystem.isFullyApproved(m) && m.status !== 'rejected');
    }
};

// Achievement Management
const AchievementManager = {
    render: () => {
        const achievements = Storage.get('achievements');
        const grid = document.getElementById('achievementsGrid');
        
        // Only show fully approved achievements (all 3 levels)
        const approved = achievements.filter(a => ApprovalSystem.isFullyApproved(a));
        const sorted = [...approved].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sorted.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-trophy"></i>
                    <p>No achievements yet. Share your success story!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = sorted.map(achievement => {
            const achievementDate = new Date(achievement.date);
            const formattedDate = achievementDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const icons = {
                academic: 'fas fa-graduation-cap',
                professional: 'fas fa-briefcase',
                business: 'fas fa-chart-line',
                sports: 'fas fa-medal',
                arts: 'fas fa-palette',
                'community': 'fas fa-hands-helping',
                other: 'fas fa-star'
            };

            return `
                <div class="achievement-card">
                    <div class="achievement-icon">
                        <i class="${icons[achievement.category] || icons.other}"></i>
                    </div>
                    <div class="achievement-person">${achievement.person}</div>
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-date">
                        <i class="fas fa-calendar"></i> ${formattedDate}
                    </div>
                    <div class="achievement-category">${achievement.category}</div>
                </div>
            `;
        }).join('');
    },

    add: (achievementData) => {
        // Set status as pending with no approvals - requires 3-level approval
        const achievementWithStatus = {
            ...achievementData,
            status: 'pending',
            level1Approval: null,
            level2Approval: null,
            level3Approval: null,
            submittedBy: AuthManager.currentUser?.id,
            submittedAt: new Date().toISOString()
        };
        Storage.add('achievements', achievementWithStatus);
        AchievementManager.render();
        showNotification('Achievement submitted successfully! It requires approval from 3 admins before being published.', 'info');
    },

    getPending: () => {
        return Storage.get('achievements').filter(a => !ApprovalSystem.isFullyApproved(a) && a.status !== 'rejected');
    }
};

// Modal Management
const ModalManager = {
    open: (modalId) => {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close: (modalId) => {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    },

    init: () => {
        // Close modals on X click
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    ModalManager.close(modal.id);
                }
            });
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    ModalManager.close(modal.id);
                }
            });
        });
    }
};

// Notification System
const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 3000;
        animation: slideInRight 0.3s;
        max-width: 400px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
};

// Smooth Scroll
const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
};

// Navigation
const initNavigation = () => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // Update active nav on scroll
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
};

// Form Handlers
const initForms = () => {
    // Business Form
    document.getElementById('businessForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!AuthManager.isAuthenticated()) {
            showNotification('Please login to add a business', 'error');
            ModalManager.close('businessModal');
            ModalManager.open('loginModal');
            return;
        }
        const businessData = {
            name: document.getElementById('businessName').value,
            owner: document.getElementById('ownerName').value || AuthManager.currentUser.name,
            category: document.getElementById('businessCategory').value,
            description: document.getElementById('businessDescription').value,
            email: document.getElementById('businessEmail').value,
            phone: document.getElementById('businessPhone').value,
            address: document.getElementById('businessAddress').value,
            website: document.getElementById('businessWebsite').value
        };
        BusinessManager.add(businessData);
        ModalManager.close('businessModal');
    });

    // Meeting Form
    document.getElementById('meetingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!AuthManager.isAuthenticated()) {
            showNotification('Please login to schedule a meeting', 'error');
            ModalManager.close('meetingModal');
            ModalManager.open('loginModal');
            return;
        }
        const meetingData = {
            title: document.getElementById('meetingTitle').value,
            type: document.getElementById('meetingType').value,
            date: document.getElementById('meetingDate').value,
            time: document.getElementById('meetingTime').value,
            location: document.getElementById('meetingLocation').value,
            description: document.getElementById('meetingDescription').value
        };
        MeetingManager.add(meetingData);
        ModalManager.close('meetingModal');
    });

    // Achievement Form
    document.getElementById('achievementForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!AuthManager.isAuthenticated()) {
            showNotification('Please login to share achievements', 'error');
            ModalManager.close('achievementModal');
            ModalManager.open('loginModal');
            return;
        }
        const achievementData = {
            person: document.getElementById('achievementPerson').value,
            title: document.getElementById('achievementTitle').value,
            category: document.getElementById('achievementCategory').value,
            description: document.getElementById('achievementDescription').value,
            date: document.getElementById('achievementDate').value || new Date().toISOString().split('T')[0]
        };
        AchievementManager.add(achievementData);
        ModalManager.close('achievementModal');
    });

    // Login Forms
    document.getElementById('gmailLoginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('gmailEmail').value;
        const password = document.getElementById('gmailPassword').value;
        const result = AuthManager.login(email, password, 'gmail');
        if (result.success) {
            showNotification('Login successful!', 'success');
            ModalManager.close('loginModal');
            // Sync mobile if provided
            const mobile = document.getElementById('gmailEmail').dataset.mobile;
            if (mobile) AuthManager.syncAccounts(email, mobile);
        } else {
            showNotification(result.message || 'Login failed', 'error');
        }
    });

    document.getElementById('mobileLoginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const mobile = document.getElementById('mobileNumber').value;
        const otp = document.getElementById('mobileOTP').value;
        const result = AuthManager.login(mobile, otp, 'mobile');
        if (result.success) {
            showNotification('Login successful!', 'success');
            ModalManager.close('loginModal');
        } else {
            showNotification(result.message || 'Login failed', 'error');
        }
    });

    // Register Forms
    document.getElementById('gmailRegisterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('regGmailPassword').value;
        const passwordConfirm = document.getElementById('regGmailPasswordConfirm').value;
        if (password !== passwordConfirm) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        const userData = {
            name: document.getElementById('regGmailName').value,
            email: document.getElementById('regGmailEmail').value,
            mobile: document.getElementById('regGmailMobile').value,
            password: password
        };
        const result = AuthManager.register(userData, 'gmail');
        if (result.success) {
            showNotification('Registration successful!', 'success');
            ModalManager.close('registerModal');
        } else {
            showNotification(result.message || 'Registration failed', 'error');
        }
    });

    document.getElementById('mobileRegisterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const otp = document.getElementById('regMobileOTP').value;
        if (otp !== '123456') { // Demo OTP
            showNotification('Invalid OTP', 'error');
            return;
        }
        const userData = {
            name: document.getElementById('regMobileName').value,
            mobile: document.getElementById('regMobileNumber').value,
            email: document.getElementById('regMobileEmail').value,
            password: 'mobile_' + Date.now() // Temporary password for mobile users
        };
        const result = AuthManager.register(userData, 'mobile');
        if (result.success) {
            showNotification('Registration successful!', 'success');
            ModalManager.close('registerModal');
        } else {
            showNotification(result.message || 'Registration failed', 'error');
        }
    });

    // OTP Handlers (Simplified - in production, integrate with SMS service)
    document.getElementById('sendOTP')?.addEventListener('click', () => {
        const mobile = document.getElementById('mobileNumber').value;
        if (!mobile) {
            showNotification('Please enter mobile number', 'error');
            return;
        }
        // Demo: Set OTP to 123456
        document.getElementById('mobileOTP').value = '123456';
        showNotification('OTP sent! (Demo: 123456)', 'info');
    });

    document.getElementById('sendRegOTP')?.addEventListener('click', () => {
        const mobile = document.getElementById('regMobileNumber').value;
        if (!mobile) {
            showNotification('Please enter mobile number', 'error');
            return;
        }
        // Demo: Set OTP to 123456
        document.getElementById('regMobileOTP').value = '123456';
        showNotification('OTP sent! (Demo: 123456)', 'info');
    });

    // Login/Register Modal Switchers
    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        ModalManager.close('loginModal');
        ModalManager.open('registerModal');
    });

    document.getElementById('showRegisterMobile')?.addEventListener('click', (e) => {
        e.preventDefault();
        ModalManager.close('loginModal');
        ModalManager.open('registerModal');
        document.querySelector('[data-tab="mobile-register"]').click();
    });

    document.getElementById('showLoginGmail')?.addEventListener('click', (e) => {
        e.preventDefault();
        ModalManager.close('registerModal');
        ModalManager.open('loginModal');
        document.querySelector('[data-tab="gmail"]').click();
    });

    document.getElementById('showLoginMobile')?.addEventListener('click', (e) => {
        e.preventDefault();
        ModalManager.close('registerModal');
        ModalManager.open('loginModal');
        document.querySelector('[data-tab="mobile"]').click();
    });

    // Login Tab Switchers
    document.querySelectorAll('.login-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            const modal = btn.closest('.modal-content');
            
            // Update active tab button
            modal.querySelectorAll('.login-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            modal.querySelectorAll('.login-tab-content').forEach(c => c.classList.remove('active'));
            const contentId = tab.includes('register') ? 
                (tab === 'gmail-register' ? 'gmailRegister' : 'mobileRegister') :
                (tab === 'gmail' ? 'gmailLogin' : 'mobileLogin');
            document.getElementById(contentId)?.classList.add('active');
        });
    });

    // Forgot Password Handler
    document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        ModalManager.close('loginModal');
        ModalManager.open('forgotPasswordModal');
    });

    document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('forgotPasswordInput').value;
        const users = Storage.get('users');
        const user = users.find(u => u.email === input || u.mobile === input);
        const resultDiv = document.getElementById('forgotPasswordResult');
        
        if (user) {
            // In production, send password reset email/SMS
            // For demo, show the password (in production, send reset link)
            resultDiv.style.display = 'block';
            resultDiv.style.background = '#d1fae5';
            resultDiv.style.color = '#065f46';
            resultDiv.innerHTML = `
                <strong>Password Reset Instructions Sent!</strong><br>
                <small>Demo Mode: Your password is "${user.password}"<br>
                In production, a password reset link would be sent to ${user.email || user.mobile}</small>
            `;
            document.getElementById('forgotPasswordForm').reset();
        } else {
            resultDiv.style.display = 'block';
            resultDiv.style.background = '#fee2e2';
            resultDiv.style.color = '#991b1b';
            resultDiv.innerHTML = '<strong>Error:</strong> No account found with that email or mobile number.';
        }
    });

    // Forgot Username Handler
    document.getElementById('forgotUsernameLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        ModalManager.close('loginModal');
        ModalManager.open('forgotUsernameModal');
    });

    document.getElementById('forgotUsernameForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const mobile = document.getElementById('forgotUsernameMobile').value;
        const users = Storage.get('users');
        const user = users.find(u => u.mobile === mobile);
        const resultDiv = document.getElementById('forgotUsernameResult');
        
        if (user) {
            // In production, send username/email via SMS
            resultDiv.style.display = 'block';
            resultDiv.style.background = '#d1fae5';
            resultDiv.style.color = '#065f46';
            resultDiv.innerHTML = `
                <strong>Username Recovery Successful!</strong><br>
                <small>Your email/username: <strong>${user.email || 'Not set'}</strong><br>
                Mobile: <strong>${user.mobile}</strong><br>
                In production, this information would be sent via SMS.</small>
            `;
            document.getElementById('forgotUsernameForm').reset();
        } else {
            resultDiv.style.display = 'block';
            resultDiv.style.background = '#fee2e2';
            resultDiv.style.color = '#991b1b';
            resultDiv.innerHTML = '<strong>Error:</strong> No account found with that mobile number.';
        }
    });

    // Back to Login handlers
    document.getElementById('backToLoginFromForgot')?.addEventListener('click', (e) => {
        e.preventDefault();
        ModalManager.close('forgotPasswordModal');
        ModalManager.open('loginModal');
    });

    document.getElementById('backToLoginFromUsername')?.addEventListener('click', (e) => {
        e.preventDefault();
        ModalManager.close('forgotUsernameModal');
        ModalManager.open('loginModal');
    });

    // Owner Management Handlers
    document.getElementById('manageAdmins')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!AuthManager.hasRole('owner')) {
            showNotification('Owner privileges required', 'error');
            return;
        }
        OwnerManager.showAdminManagement();
    });

    document.getElementById('manageUsers')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!AuthManager.hasRole('owner')) {
            showNotification('Owner privileges required', 'error');
            return;
        }
        OwnerManager.showUserManagement();
    });
};

// Filter and Search Handlers
const initFilters = () => {
    // Business Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            const searchTerm = document.getElementById('businessSearch').value;
            BusinessManager.render(filter, searchTerm);
        });
    });

    // Business Search
    document.getElementById('businessSearch').addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.filter-btn.active');
        const filter = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
        BusinessManager.render(filter, e.target.value);
    });

    // Meeting Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.meeting-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.getAttribute('data-tab');
            document.getElementById(tab).classList.add('active');
            MeetingManager.render(tab);
        });
    });
};

// Admin Management
const AdminManager = {
    isAdminMode: () => {
        return localStorage.getItem('adminMode') === 'true';
    },

    toggleAdminMode: () => {
        // Check if user has admin or owner privileges
        if (!AuthManager.hasRole('admin') && !AuthManager.hasRole('owner')) {
            showNotification('Access denied. Admin privileges required.', 'error');
            return;
        }
        
        const isAdmin = AdminManager.isAdminMode();
        localStorage.setItem('adminMode', (!isAdmin).toString());
        AdminManager.updateUI();
    },

    updateUI: () => {
        // Only show admin button if user has privileges
        if (!AuthManager.hasRole('admin') && !AuthManager.hasRole('owner')) {
            const adminPanel = document.getElementById('adminBusinessPanel');
            const adminToggle = document.getElementById('adminToggle');
            if (adminPanel) adminPanel.style.display = 'none';
            if (adminToggle) adminToggle.classList.remove('active');
            return;
        }
        
        const isAdmin = AdminManager.isAdminMode();
        const adminPanel = document.getElementById('adminBusinessPanel');
        const adminToggle = document.getElementById('adminToggle');
        
        if (isAdmin) {
            adminPanel.style.display = 'block';
            adminToggle.classList.add('active');
            adminToggle.innerHTML = '<i class="fas fa-user-shield"></i> Exit Admin';
            AdminManager.renderPendingItems();
        } else {
            adminPanel.style.display = 'none';
            adminToggle.classList.remove('active');
            adminToggle.innerHTML = '<i class="fas fa-user-shield"></i> Admin';
        }
    },

    renderPendingItems: () => {
        const pendingBusinesses = BusinessManager.getPending();
        const pendingMeetings = MeetingManager.getPending();
        const pendingAchievements = AchievementManager.getPending();
        const container = document.getElementById('pendingBusinesses');

        if (pendingBusinesses.length === 0 && pendingMeetings.length === 0 && pendingAchievements.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No pending approvals. All items are reviewed!</p>
                </div>
            `;
            return;
        }

        let html = '';

        // Render Pending Businesses
        if (pendingBusinesses.length > 0) {
            html += '<h3 style="margin-bottom: 1rem; color: var(--text-dark);"><i class="fas fa-store"></i> Pending Businesses</h3>';
            html += pendingBusinesses.map(business => {
                const approvalCount = ApprovalSystem.getApprovalCount(business);
                const nextLevel = approvalCount + 1;
                return `
                    <div class="pending-business-card">
                        <div class="pending-business-header">
                            <div>
                                <h4>${business.name}</h4>
                                <p class="pending-business-owner"><i class="fas fa-user"></i> ${business.owner}</p>
                                <div class="approval-status">
                                    <span class="approval-badge">Approvals: ${approvalCount}/3</span>
                                    ${business.level1Approval ? `<span class="approval-level">Level 1 ✓</span>` : ''}
                                    ${business.level2Approval ? `<span class="approval-level">Level 2 ✓</span>` : ''}
                                    ${business.level3Approval ? `<span class="approval-level">Level 3 ✓</span>` : ''}
                                </div>
                            </div>
                            <div class="pending-business-category">${business.category}</div>
                        </div>
                        <div class="pending-business-details">
                            <p><strong>Description:</strong> ${business.description}</p>
                            ${business.email ? `<p><i class="fas fa-envelope"></i> ${business.email}</p>` : ''}
                            ${business.phone ? `<p><i class="fas fa-phone"></i> ${business.phone}</p>` : ''}
                            ${business.address ? `<p><i class="fas fa-map-marker-alt"></i> ${business.address}</p>` : ''}
                            ${business.website ? `<p><i class="fas fa-globe"></i> <a href="${business.website}" target="_blank">${business.website}</a></p>` : ''}
                        </div>
                        <div class="pending-business-actions">
                            ${approvalCount < 3 ? `
                                <button class="btn btn-approve" onclick="AdminManager.approveItem('business', ${business.id}, ${nextLevel})">
                                    <i class="fas fa-check"></i> Approve Level ${nextLevel}
                                </button>
                            ` : ''}
                            <button class="btn btn-reject" onclick="AdminManager.rejectItem('business', ${business.id})">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Render Pending Meetings
        if (pendingMeetings.length > 0) {
            html += '<h3 style="margin-top: 2rem; margin-bottom: 1rem; color: var(--text-dark);"><i class="fas fa-calendar"></i> Pending Meetings</h3>';
            html += pendingMeetings.map(meeting => {
                const approvalCount = ApprovalSystem.getApprovalCount(meeting);
                const nextLevel = approvalCount + 1;
                const meetingDate = new Date(meeting.date);
                const formattedDate = meetingDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                return `
                    <div class="pending-business-card">
                        <div class="pending-business-header">
                            <div>
                                <h4>${meeting.title}</h4>
                                <p class="pending-business-owner"><i class="fas fa-calendar"></i> ${formattedDate} at ${meeting.time}</p>
                                <div class="approval-status">
                                    <span class="approval-badge">Approvals: ${approvalCount}/3</span>
                                    ${meeting.level1Approval ? `<span class="approval-level">Level 1 ✓</span>` : ''}
                                    ${meeting.level2Approval ? `<span class="approval-level">Level 2 ✓</span>` : ''}
                                    ${meeting.level3Approval ? `<span class="approval-level">Level 3 ✓</span>` : ''}
                                </div>
                            </div>
                            <div class="pending-business-category">${meeting.type}</div>
                        </div>
                        <div class="pending-business-details">
                            <p><strong>Location:</strong> ${meeting.location}</p>
                            ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
                        </div>
                        <div class="pending-business-actions">
                            ${approvalCount < 3 ? `
                                <button class="btn btn-approve" onclick="AdminManager.approveItem('meeting', ${meeting.id}, ${nextLevel})">
                                    <i class="fas fa-check"></i> Approve Level ${nextLevel}
                                </button>
                            ` : ''}
                            <button class="btn btn-reject" onclick="AdminManager.rejectItem('meeting', ${meeting.id})">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Render Pending Achievements
        if (pendingAchievements.length > 0) {
            html += '<h3 style="margin-top: 2rem; margin-bottom: 1rem; color: var(--text-dark);"><i class="fas fa-trophy"></i> Pending Achievements</h3>';
            html += pendingAchievements.map(achievement => {
                const approvalCount = ApprovalSystem.getApprovalCount(achievement);
                const nextLevel = approvalCount + 1;
                return `
                    <div class="pending-business-card">
                        <div class="pending-business-header">
                            <div>
                                <h4>${achievement.title}</h4>
                                <p class="pending-business-owner"><i class="fas fa-user"></i> ${achievement.person}</p>
                                <div class="approval-status">
                                    <span class="approval-badge">Approvals: ${approvalCount}/3</span>
                                    ${achievement.level1Approval ? `<span class="approval-level">Level 1 ✓</span>` : ''}
                                    ${achievement.level2Approval ? `<span class="approval-level">Level 2 ✓</span>` : ''}
                                    ${achievement.level3Approval ? `<span class="approval-level">Level 3 ✓</span>` : ''}
                                </div>
                            </div>
                            <div class="pending-business-category">${achievement.category}</div>
                        </div>
                        <div class="pending-business-details">
                            <p><strong>Description:</strong> ${achievement.description}</p>
                        </div>
                        <div class="pending-business-actions">
                            ${approvalCount < 3 ? `
                                <button class="btn btn-approve" onclick="AdminManager.approveItem('achievement', ${achievement.id}, ${nextLevel})">
                                    <i class="fas fa-check"></i> Approve Level ${nextLevel}
                                </button>
                            ` : ''}
                            <button class="btn btn-reject" onclick="AdminManager.rejectItem('achievement', ${achievement.id})">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        container.innerHTML = html;
    },

    approveItem: (type, itemId, level) => {
        if (!AuthManager.hasRole('admin') && !AuthManager.hasRole('owner')) {
            showNotification('Admin privileges required', 'error');
            return;
        }

        const adminId = AuthManager.currentUser.id;
        let items, Manager, renderMethod;

        if (type === 'business') {
            items = Storage.get('businesses');
            Manager = BusinessManager;
            renderMethod = () => BusinessManager.render();
        } else if (type === 'meeting') {
            items = Storage.get('meetings');
            Manager = MeetingManager;
            renderMethod = () => {
                MeetingManager.render('upcoming');
                MeetingManager.render('weekly');
                MeetingManager.render('monthly');
                MeetingManager.render('past');
            };
        } else if (type === 'achievement') {
            items = Storage.get('achievements');
            Manager = AchievementManager;
            renderMethod = () => AchievementManager.render();
        }

        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            const item = items[itemIndex];
            
            // Check if this admin already approved at this level
            if (level === 1 && item.level1Approval) {
                showNotification('Level 1 already approved by another admin', 'error');
                return;
            }
            if (level === 2 && item.level2Approval) {
                showNotification('Level 2 already approved by another admin', 'error');
                return;
            }
            if (level === 3 && item.level3Approval) {
                showNotification('Level 3 already approved by another admin', 'error');
                return;
            }

            ApprovalSystem.approve(item, level, adminId);
            Storage.set(type === 'business' ? 'businesses' : type === 'meeting' ? 'meetings' : 'achievements', items);
            
            AdminManager.renderPendingItems();
            renderMethod();
            
            if (ApprovalSystem.isFullyApproved(item)) {
                showNotification(`${type} approved by all 3 admins and published!`, 'success');
            } else {
                showNotification(`${type} approved at level ${level}. ${3 - level} more approval(s) needed.`, 'info');
            }
        }
    },

    rejectItem: (type, itemId) => {
        if (!AuthManager.hasRole('admin') && !AuthManager.hasRole('owner')) {
            showNotification('Admin privileges required', 'error');
            return;
        }

        if (confirm(`Are you sure you want to reject this ${type}? This action cannot be undone.`)) {
            const adminId = AuthManager.currentUser.id;
            let items, key;

            if (type === 'business') {
                items = Storage.get('businesses');
                key = 'businesses';
            } else if (type === 'meeting') {
                items = Storage.get('meetings');
                key = 'meetings';
            } else if (type === 'achievement') {
                items = Storage.get('achievements');
                key = 'achievements';
            }

            const itemIndex = items.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                ApprovalSystem.reject(items[itemIndex], adminId);
                Storage.set(key, items);
                
                AdminManager.renderPendingItems();
                showNotification(`${type} rejected.`, 'info');
            }
        }
    }
};

// Button Handlers
const initButtons = () => {
    document.getElementById('addBusinessBtn').addEventListener('click', () => {
        if (!AuthManager.isAuthenticated()) {
            showNotification('Please login to add a business', 'error');
            ModalManager.open('loginModal');
            return;
        }
        ModalManager.open('businessModal');
    });

    document.getElementById('addMeetingBtn').addEventListener('click', () => {
        if (!AuthManager.isAuthenticated()) {
            showNotification('Please login to schedule a meeting', 'error');
            ModalManager.open('loginModal');
            return;
        }
        ModalManager.open('meetingModal');
    });

    document.getElementById('addAchievementBtn').addEventListener('click', () => {
        if (!AuthManager.isAuthenticated()) {
            showNotification('Please login to share achievements', 'error');
            ModalManager.open('loginModal');
            return;
        }
        ModalManager.open('achievementModal');
    });

    // Admin toggle - handler added dynamically in AuthManager.updateUI
    const adminToggle = document.getElementById('adminToggle');
    if (adminToggle) {
        adminToggle.addEventListener('click', () => {
            AdminManager.toggleAdminMode();
        });
    }

    // Login button - handler added dynamically in AuthManager.updateUI
    // This will be set up after auth initialization
};

// Initialize App
const init = () => {
    // Initialize authentication first
    AuthManager.init();
    
    initializeSampleData();
    BusinessManager.render();
    MeetingManager.render('upcoming');
    MeetingManager.render('weekly');
    MeetingManager.render('monthly');
    MeetingManager.render('past');
    AchievementManager.render();
    ModalManager.init();
    initNavigation();
    initSmoothScroll();
    initForms();
    initFilters();
    initButtons();
    
    // Setup login button handler (after auth init)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'loginBtn' || e.target.closest('#loginBtn')) {
            ModalManager.open('loginModal');
        }
    });
    
    // Setup global click handler for closing user profile dropdown
    document.addEventListener('click', (e) => {
        const userProfileDropdown = document.getElementById('userProfileDropdown');
        if (userProfileDropdown && 
            !e.target.closest('#userProfileBtn') && 
            !e.target.closest('#userProfileDropdown')) {
            userProfileDropdown.style.display = 'none';
        }
    });
    
    AdminManager.updateUI();
};

// Owner Management (for owner role)
const OwnerManager = {
    showAdminManagement: () => {
        const users = Storage.get('users');
        const admins = users.filter(u => u.role === 'admin' || u.role === 'owner');
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h2>Manage Admins</h2>
                <div class="admin-list">
                    ${admins.map(admin => `
                        <div class="admin-item">
                            <div>
                                <strong>${admin.name}</strong>
                                <div>${admin.email || admin.mobile}</div>
                                <span class="role-badge role-${admin.role}">${admin.role}</span>
                            </div>
                            ${admin.role !== 'owner' ? `
                                <button class="btn btn-reject" onclick="OwnerManager.removeAdmin(${admin.id})">
                                    Remove Admin
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <h3 style="margin-top: 2rem;">Promote User to Admin</h3>
                <select id="promoteUserSelect" class="form-group" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem;">
                    <option value="">Select a user...</option>
                    ${users.filter(u => u.role === 'user').map(u => `
                        <option value="${u.id}">${u.name} (${u.email || u.mobile})</option>
                    `).join('')}
                </select>
                <button class="btn btn-primary" onclick="OwnerManager.promoteToAdmin()">
                    Promote to Admin
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    showUserManagement: () => {
        const users = Storage.get('users');
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h2>Manage Users</h2>
                <div class="user-management-list">
                    ${users.map(user => `
                        <div class="user-management-item">
                            <div>
                                <strong>${user.name}</strong>
                                <div>${user.email || user.mobile || 'No contact'}</div>
                                <span class="role-badge role-${user.role}">${user.role}</span>
                            </div>
                            <div class="user-actions">
                                ${user.role === 'user' ? `
                                    <button class="btn btn-approve" onclick="OwnerManager.promoteToAdmin(${user.id})">
                                        Make Admin
                                    </button>
                                ` : user.role === 'admin' ? `
                                    <button class="btn btn-reject" onclick="OwnerManager.removeAdmin(${user.id})">
                                        Remove Admin
                                    </button>
                                ` : ''}
                                <button class="btn btn-reject" onclick="OwnerManager.deleteUser(${user.id})" 
                                    ${user.role === 'owner' ? 'disabled style="opacity: 0.5;"' : ''}>
                                    Delete User
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    promoteToAdmin: (userId) => {
        if (!userId) {
            const select = document.getElementById('promoteUserSelect');
            userId = select ? parseInt(select.value) : null;
        }
        
        if (!userId) {
            showNotification('Please select a user', 'error');
            return;
        }

        if (confirm('Are you sure you want to promote this user to admin?')) {
            const users = Storage.get('users');
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].role = 'admin';
                Storage.set('users', users);
                showNotification('User promoted to admin successfully', 'success');
                OwnerManager.showAdminManagement();
            }
        }
    },

    removeAdmin: (userId) => {
        if (confirm('Are you sure you want to remove admin privileges from this user?')) {
            const users = Storage.get('users');
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1 && users[userIndex].role !== 'owner') {
                users[userIndex].role = 'user';
                Storage.set('users', users);
                showNotification('Admin privileges removed', 'success');
                OwnerManager.showAdminManagement();
            }
        }
    },

    deleteUser: (userId) => {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const users = Storage.get('users');
            const filtered = users.filter(u => u.id !== userId && u.role !== 'owner');
            Storage.set('users', filtered);
            showNotification('User deleted successfully', 'success');
            OwnerManager.showUserManagement();
        }
    }
};

// Expose AdminManager and OwnerManager functions globally for onclick handlers
window.AdminManager = AdminManager;
window.OwnerManager = OwnerManager;

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

