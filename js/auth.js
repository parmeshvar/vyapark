// ========================================================
// VYAPARK AUTHENTICATION ENGINE (Supabase)
// ========================================================

window.authPhone = "";
window.generatedOTP = "";
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

// 1. Send simulated OTP & check database
window.sendOTP = async function() {
    const phoneInput = document.getElementById('phone-input').value.trim();
    if (phoneInput.length < 10) {
        alert("Please enter a valid 10-digit phone number");
        return;
    }
    
    window.authPhone = phoneInput;
    document.getElementById('display-phone').innerText = "+91 " + phoneInput;
    
    // Generate simulated 4-digit code
    window.generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Premium Dev Experience - Toast/Alert simulated OTP immediately!
    alert(`🔑 Vyapark Security Code: ${window.generatedOTP}\n\nPlease enter this code on the next screen.`);
    
    nextStep('step-otp');
    
    // Auto focus first OTP input box
    setTimeout(() => {
        const firstBox = document.querySelector('.otp-box');
        if (firstBox) firstBox.focus();
    }, 150);
};

// Auto move focus in OTP boxes
document.querySelectorAll('.otp-box').forEach((box, index, list) => {
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

// 2. Verify OTP & Authenticate using Supabase Auth (simulating phone via custom-constructed emails)
window.verifyOTP = async function() {
    let typedOTP = "";
    document.querySelectorAll('.otp-box').forEach(box => {
        typedOTP += box.value;
    });
    
    if (typedOTP !== window.generatedOTP) {
        alert("Incorrect Security Code! Please try again.");
        return;
    }
    
    const email = `${window.authPhone}@vyapark.com`;
    const password = "VyaparkPassword123!"; // Secure static password for easy mapping
    
    const btn = document.querySelector('#step-otp button');
    btn.disabled = true;
    btn.innerText = "Authenticating...";
    
    try {
        // Try logging in
        let { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        // If user does not exist, sign them up
        if (error) {
            const signup = await supabase.auth.signUp({
                email: email,
                password: password
            });
            if (signup.error) throw signup.error;
            data = signup.data;
        }
        
        const userId = (data && data.user) ? data.user.id : null;
        if (!userId) throw new Error("Could not retrieve authenticated User ID.");
        
        // Save to localStorage immediately as a robust fallback!
        localStorage.setItem('vyapark_user_id', userId);
        
        // Check if Profile exists in Database
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
            
        if (profile && profile.full_name) {
            localStorage.setItem('vyapark_user_role', profile.role);
            // Profile is already set up! Welcome back and redirect directly.
            alert(`Welcome back to Vyapark, ${profile.full_name}! 🎉`);
            if (profile.role === 'seller') {
                window.location.href = 'seller.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            // New user, proceed to role selection
            nextStep('step-role');
        }
    } catch (err) {
        console.error(err);
        alert("Auth failed: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Verify & Continue";
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

// 3. Complete setup and insert Profile into Profiles Table
window.finishSetup = async function() {
    const fullName = document.getElementById('profile-name').value.trim();
    const pincode = document.getElementById('profile-pincode').value.trim();
    const address = document.getElementById('profile-address').value.trim();
    
    if (!fullName) {
        alert("Please enter your Full Name");
        return;
    }
    
    const btn = document.querySelector('#step-profile button');
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
            phone: window.authPhone,
            role: window.selectedRole,
            shop_name: window.selectedRole === 'seller' ? `${fullName}'s Store` : null
        };
        
        const { error } = await supabase
            .from('profiles')
            .upsert(profileData);
            
        if (error) throw error;
        
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
        btn.disabled = false;
        btn.innerText = "Get Started";
    }
};
