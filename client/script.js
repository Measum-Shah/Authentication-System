// API Configuration
const API_BASE_URL = 'http://localhost:4000/api/v1/user';

// DOM Elements
const toast = document.getElementById('toast');

// Show toast message
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Handle form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Get current page
    const currentPage = window.location.pathname.split('/').pop();

    // Login Form
    if (currentPage === 'index.html' || currentPage === '') {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await fetch(`${API_BASE_URL}/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password }),
                        credentials: 'include' // For cookies
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showToast('Login successful!');
                        // Store token in localStorage
                        localStorage.setItem('token', data.token);
                        // Redirect to dashboard after 1 second
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1000);
                    } else {
                        showToast(data.message || 'Login failed', 'error');
                    }
                } catch (error) {
                    showToast('An error occurred. Please try again.', 'error');
                    console.error('Login error:', error);
                }
            });
        }
    }

    // Register Form
    if (currentPage === 'register.html') {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    password: document.getElementById('password').value,
                    verificationMethod: document.querySelector('input[name="verificationMethod"]:checked').value
                };
                
                try {
                    const response = await fetch(`${API_BASE_URL}/register`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData)
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showToast(data.message);
                        // Store email/phone for OTP verification
                        localStorage.setItem('otpVerificationEmail', formData.email);
                        localStorage.setItem('otpVerificationPhone', formData.phone);
                        // Redirect to OTP verification
                        setTimeout(() => {
                            window.location.href = 'verify-otp.html';
                        }, 1000);
                    } else {
                        showToast(data.message || 'Registration failed', 'error');
                    }
                } catch (error) {
                    showToast('An error occurred. Please try again.', 'error');
                    console.error('Registration error:', error);
                }
            });
        }
    }

    // Verify OTP Form
    if (currentPage === 'verify-otp.html') {
        // Set the verification target (email or phone)
        const email = localStorage.getItem('otpVerificationEmail');
        const phone = localStorage.getItem('otpVerificationPhone');
        const verificationTargetLabel = document.getElementById('verificationTargetLabel');
        
        if (email) {
            document.getElementById('email').value = email;
            verificationTargetLabel.textContent = `Verification sent to: ${email}`;
        } else if (phone) {
            document.getElementById('phone').value = phone;
            verificationTargetLabel.textContent = `Verification sent to: ${phone}`;
        }
        
        const verifyOtpForm = document.getElementById('verifyOtpForm');
        if (verifyOtpForm) {
            verifyOtpForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = {
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    otp: document.getElementById('otp').value
                };
                
                try {
                    const response = await fetch(`${API_BASE_URL}/otp-verification`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                        credentials: 'include' // For cookies
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showToast('Account verified successfully!');
                        // Store token in localStorage
                        localStorage.setItem('token', data.token);
                        // Clear OTP verification data
                        localStorage.removeItem('otpVerificationEmail');
                        localStorage.removeItem('otpVerificationPhone');
                        // Redirect to dashboard after 1 second
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1000);
                    } else {
                        showToast(data.message || 'Verification failed', 'error');
                    }
                } catch (error) {
                    showToast('An error occurred. Please try again.', 'error');
                    console.error('OTP verification error:', error);
                }
            });
        }
    }

    // Dashboard Page
    if (currentPage === 'dashboard.html') {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }
        
        // Set user name (you would normally get this from an API)
        const userName = localStorage.getItem('userName') || 'User';
        document.getElementById('userName').textContent = userName;
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async function() {
                try {
                    const response = await fetch(`${API_BASE_URL}/logout`, {
                        method: 'GET',
                        credentials: 'include' // For cookies
                    });
                    
                    if (response.ok) {
                        // Clear local storage and redirect
                        localStorage.removeItem('token');
                        localStorage.removeItem('userName');
                        window.location.href = 'index.html';
                    } else {
                        showToast('Logout failed', 'error');
                    }
                } catch (error) {
                    showToast('An error occurred during logout', 'error');
                    console.error('Logout error:', error);
                }
            });
        }
    }
});

// Check authentication on page load
window.addEventListener('load', function() {
    const currentPage = window.location.pathname.split('/').pop();
    const token = localStorage.getItem('token');
    
    // Redirect to login if not authenticated on protected pages
    const protectedPages = ['dashboard.html'];
    if (protectedPages.includes(currentPage) && !token) {
        window.location.href = 'index.html';
    }
    
    // Redirect to dashboard if already authenticated
    if ((currentPage === 'index.html' || currentPage === '' || currentPage === 'register.html') && token) {
        window.location.href = 'dashboard.html';
    }
});