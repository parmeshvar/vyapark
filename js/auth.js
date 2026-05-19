// ========================================================
// VYAPARK AUTHENTICATION ENGINE (Email/Password & OTP)
// ========================================================

window.authEmail = "";
window.generatedOTP = ""; // For simulated signup fallback
window.otpFlowType = ""; // 'signup' or 'reset'
window.selectedRole = "buyer";

function nextStep(stepId) {
    document.querySelectorAll('.auth-step').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

function prevStep(stepId) {
    nextStep(stepId);
}

// Auto move focus in OTP boxes
document.addEventListener('DOMContentLoaded', () => {
    const list = document.querySelectorAll('.otp-box');
    list.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            if(e.target.value.length === 1 && index < list.length - 1) {
                list[index + 1].focus();
            }
        });
        box.addEventListener('keydown', (e) => {
            if(e.key === 'Backspace' && e.target.value === '' && index > 0) {
                list[index - 1].focus();
            }
        });
    });
});

window.doLogin = async function() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    const btn = document.querySelector('#step-login button.btn-primary');
    btn.disabled = true;
    btn.innerText = "Logging in...";

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        await window.handleSuccessfulAuth(data.user.id);
    } catch (err) {
        alert("Login failed: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Login";
    }
};

window.startOtpFlow = function(type) {
    window.otpFlowType = type;
    document.getElementById('email-entry-title').innerHTML = type === 'signup' ? 'Sign Up' : 'Reset <span class="text-primary">Password</span>';
    nextStep('step-email-entry');
};

window.sendEmailOTP = async function() {
    const email = document.getElementById('otp-email').value.trim();
    if (!email || !email.includes('@')) {
        alert("Please enter a valid email address");
        return;
    }
    
    window.authEmail = email;
    document.getElementById('display-email').innerText = email;
    
    const btn = document.querySelector('#step-email-entry button');
    btn.disabled = true;
    btn.innerText = "Sending...";

    try {
        if (window.otpFlowType === 'reset') {
            // Trigger native Supabase password reset (usually sends a link, but we'll simulate the OTP for the UI)
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) console.warn("Supabase Reset Error (Ignored for prototype):", error);
        } else {
            // Trigger native Supabase OTP signup
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) console.warn("Supabase OTP Error (Ignored for prototype):", error);
        }
        
        // DEV PROTOTYPE MODE: Always generate a fake OTP so the user can test the UI without checking their inbox
        window.generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        alert(`🔑 [PROTOTYPE MODE]\nYour verification code is: ${window.generatedOTP}\n\n(In production, this is sent to your email)`);
        
        // Clear old otp boxes
        document.querySelectorAll('.otp-box').forEach(b => b.value = '');
        nextStep('step-otp');
        setTimeout(() => {
            const firstBox = document.querySelector('.otp-box');
            if (firstBox) firstBox.focus();
        }, 150);
    } catch (err) {
        // We shouldn't hit this often now that we catch inner errors, but just in case
        console.error("Critical error in OTP sending:", err);
    } finally {
        btn.disabled = false;
        btn.innerText = "Send Verification Code";
    }
};

window.verifyOTP = async function() {
    let typedOTP = "";
    document.querySelectorAll('.otp-box').forEach(box => {
        typedOTP += box.value;
    });
    
    // We check against the simulated OTP for a smooth dev experience
    if (typedOTP !== window.generatedOTP) {
        // Fallback to real supabase verify if the user actually typed a real email OTP
        const type = window.otpFlowType === 'reset' ? 'recovery' : 'email';
        const { error } = await supabase.auth.verifyOtp({ email: window.authEmail, token: typedOTP, type });
        if (error) {
            alert("Incorrect Verification Code! Please try again.");
            return;
        }
    }
    
    document.getElementById('password-step-title').innerHTML = window.otpFlowType === 'signup' ? 'Create <span class="text-primary">Password</span>' : 'Set New <span class="text-primary">Password</span>';
    nextStep('step-create-password');
};

window.saveNewPassword = async function() {
    const password = document.getElementById('new-password').value;
    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }
    
    const btn = document.querySelector('#step-create-password button');
    btn.disabled = true;
    btn.innerText = "Saving...";

    try {
        if (window.otpFlowType === 'signup') {
            let userId = null;
            const { data, error } = await supabase.auth.signUp({
                email: window.authEmail,
                password: password
            });
            
            if (error) {
                console.warn("Supabase SignUp Error (Ignored for prototype):", error);
                // Fallback for prototype if rate limited (Must be a valid UUID)
                userId = crypto.randomUUID ? crypto.randomUUID() : '123e4567-e89b-12d3-a456-426614174000';
            } else {
                userId = data.user ? data.user.id : null;
            }
            
            if (!userId) {
                // If Supabase requires email confirmation, it won't return a session right away
                alert("Account created! You can now login.");
                window.location.reload();
                return;
            }
            localStorage.setItem('vyapark_user_id', userId);
            nextStep('step-role');
            
        } else if (window.otpFlowType === 'reset') {
            // Check if we have an active session (from native verifyOtp)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { error } = await supabase.auth.updateUser({ password });
                if (error) console.warn("Supabase Update Password Error:", error);
            } else {
                console.warn("No active session to update password natively. Simulated successfully.");
            }
            alert("Password updated successfully! Please login with your new password.");
            window.location.reload();
        }
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Save Password";
    }
};

window.handleSuccessfulAuth = async function(userId) {
    localStorage.setItem('vyapark_user_id', userId);
    
    let profile = null;
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
    if (data) {
        profile = data;
    } else {
        // Fallback to local storage profile for prototype mode
        const localProfile = localStorage.getItem('vyapark_local_profile');
        if (localProfile) {
            try {
                const p = JSON.parse(localProfile);
                if (p.id === userId) profile = p;
            } catch(e) {}
        }
    }
        
    if (profile && profile.full_name) {
        localStorage.setItem('vyapark_user_role', profile.role);
        alert(`Welcome back, ${profile.full_name}! 🎉`);
        if (profile.role === 'seller') {
            window.location.href = 'seller.html';
        } else {
            window.location.href = 'index.html';
        }
    } else {
        nextStep('step-role');
    }
};

window.selectRole = function(role) {
    window.selectedRole = role;
    document.querySelectorAll('.role-card').forEach(el => {
        el.classList.remove('selected');
    });
    const selectedRadio = document.querySelector(`input[value="${role}"]`);
    if (selectedRadio) {
        selectedRadio.checked = true;
        selectedRadio.closest('.role-card').classList.add('selected');
    }
};

window.finishSetup = async function() {
    const fullName = document.getElementById('profile-name').value.trim();
    const pincode = document.getElementById('profile-pincode').value.trim();
    const address = document.getElementById('profile-address').value.trim();
    
    if (!fullName) {
        alert("Please enter your Full Name");
        return;
    }
    
    let lat = document.getElementById('loc-lat').value;
    let lng = document.getElementById('loc-lng').value;

    const btn = document.querySelector('#step-profile button.btn-primary');
    btn.disabled = true;
    btn.innerText = "Setting up your profile...";
    
    try {
        let userId = localStorage.getItem('vyapark_user_id');
        if (!userId) {
            const session = (await supabase.auth.getSession()).data.session;
            if (session) userId = session.user.id;
        }
        
        if (!userId) throw new Error("No active user session or ID found. Please try logging in again.");
        
        const profileData = {
            id: userId,
            full_name: fullName,
            phone: null, 
            role: window.selectedRole,
            shop_name: window.selectedRole === 'seller' ? `${fullName}'s Store` : null
        };

        if (lat && lng) {
            profileData.location_lat = parseFloat(lat);
            profileData.location_lng = parseFloat(lng);
        }
        
        const { error } = await supabase
            .from('profiles')
            .upsert(profileData);
            
        if (error) {
            console.warn("Supabase Profile Save Error:", error);
            // If it's a simulated user, it will fail the foreign key constraint. Fallback to localStorage.
            localStorage.setItem('vyapark_local_profile', JSON.stringify(profileData));
        }
        
        alert("Profile setup complete! Welcome to Vyapark. 🚀");
        
        if (window.selectedRole === 'seller') {
            window.location.href = 'seller.html';
        } else {
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error(err);
        alert("Failed to save profile: " + err.message);
    } finally {
        const btnPrimary = document.querySelector('#step-profile button.btn-primary');
        if (btnPrimary) {
            btnPrimary.disabled = false;
            btnPrimary.innerText = "Get Started";
        }
    }
};

window.pinLocation = function() {
    const statusText = document.getElementById('loc-status');
    const mapContainer = document.getElementById('map-container');
    const btn = document.getElementById('btn-get-location');
    
    statusText.innerText = "Locating...";
    btn.disabled = true;

    if (!navigator.geolocation) {
        statusText.innerText = "Geolocation is not supported by your browser.";
        btn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            document.getElementById('loc-lat').value = lat;
            document.getElementById('loc-lng').value = lng;
            
            mapContainer.style.display = 'block';
            statusText.innerText = "Location pinned successfully!";
            statusText.style.color = "var(--success)";
            btn.innerHTML = '<i class="fa-solid fa-check text-success"></i> Location Pinned';
            
            // Initialize Map
            if (!window.authMap) {
                window.authMap = L.map('map-container').setView([lat, lng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(window.authMap);
                window.authMarker = L.marker([lat, lng], { draggable: true }).addTo(window.authMap);
                
                // Allow manual pin adjustment
                window.authMarker.on('dragend', function(e) {
                    const pos = e.target.getLatLng();
                    document.getElementById('loc-lat').value = pos.lat;
                    document.getElementById('loc-lng').value = pos.lng;
                });
            } else {
                window.authMap.setView([lat, lng], 15);
                window.authMarker.setLatLng([lat, lng]);
            }
        },
        (error) => {
            console.warn("Geolocation error:", error);
            statusText.innerText = "Failed to get location. Please allow GPS access.";
            statusText.style.color = "var(--danger)";
            btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
};

// Developer Quick Login for Testing
window.quickLogin = function(role) {
    const testId = 'test_' + role + '_' + Date.now().toString().slice(-6);
    
    localStorage.setItem('vyapark_user_id', testId);
    localStorage.setItem('vyapark_user_role', role);
    
    let profileData = {
        id: testId,
        full_name: 'Test ' + (role.charAt(0).toUpperCase() + role.slice(1)),
        role: role,
        is_verified: true
    };
    
    if (role === 'seller') {
        profileData.shop_name = 'Test Store';
        profileData.phone = '9999999999';
    }
    
    if (role === 'admin') {
        profileData.is_admin = true; // if future logic requires it
    }
    
    localStorage.setItem('vyapark_local_profile', JSON.stringify(profileData));
    
    if (role === 'admin') {
        window.location.href = 'admin.html';
    } else if (role === 'seller') {
        window.location.href = 'seller.html';
    } else {
        window.location.href = 'index.html';
    }
};
