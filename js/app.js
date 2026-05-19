// ====================================
// Price Formatter — max 2 decimal paise digits
// ====================================
function formatPrice(amount) {
    const n = parseFloat(amount);
    if (isNaN(n)) return '0';
    // If whole number → no decimals. Otherwise fix to 2 decimal places.
    return n % 1 === 0 ? Math.round(n).toLocaleString('en-IN') : parseFloat(n.toFixed(2)).toLocaleString('en-IN');
}

// Database for Products and Services
const db = {
    products: {
        categories: [
            { id: 1, name: "Electronics", icon: "fa-laptop" },
            { id: 2, name: "Fashion", icon: "fa-shirt" },
            { id: 3, name: "Groceries", icon: "fa-basket-shopping" },
            { id: 4, name: "Home & Kitchen", icon: "fa-couch" },
            { id: 5, name: "Beauty & Care", icon: "fa-spray-can" },
            { id: 6, name: "Pharmacy", icon: "fa-pills" },
            { id: 7, name: "Toys & Baby", icon: "fa-baby-carriage" },
            { id: 8, name: "Sports", icon: "fa-dumbbell" },
            { id: 9, name: "Books", icon: "fa-book" },
            { id: 10, name: "Auto Parts", icon: "fa-car-side" },
            { id: 11, name: "Hardware", icon: "fa-hammer" },
            { id: 12, name: "Agriculture", icon: "fa-tractor" }
        ],
        trending: [
            { title: "Desi Ghee 1kg", seller: "Ramu Kirana", image: "https://images.unsplash.com/photo-1627997237096-7c70c4cc6cc1?w=200&q=80" },
            { title: "Cotton Kurti", seller: "Laxmi Boutique", image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=200&q=80" },
            { title: "Fresh Paneer", seller: "Amul Dairy", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6f46d?w=200&q=80" }
        ],
        items: [
            { id: 101, title: "Wireless Earbuds Pro", seller: "Tech Store", price: 1299, mrp: 2999, discount: "56%", distance: "1.2 km", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80", verified: true, promoted: true },
            { id: 102, title: "Men's Casual Shirt", seller: "Fashion Hub", price: 499, mrp: 999, discount: "50%", distance: "0.8 km", image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=500&q=80", verified: true, promoted: false },
            { id: 103, title: "Organic Apples (1kg)", seller: "Fresh Mart", price: 150, mrp: 200, discount: "25%", distance: "0.3 km", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6f46d?w=500&q=80", verified: false, promoted: true },
            { id: 104, title: "Smart Watch Series 8", seller: "Gadget Galaxy", price: 2499, mrp: 5000, discount: "50%", distance: "2.5 km", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80", verified: true, promoted: false }
        ]
    },
    services: {
        categories: [
            { id: 1, name: "Healthcare", icon: "fa-user-doctor" },
            { id: 2, name: "Legal & Finance", icon: "fa-scale-balanced" },
            { id: 3, name: "Travel & Stay", icon: "fa-plane" },
            { id: 4, name: "Salon & Spa", icon: "fa-scissors" },
            { id: 5, name: "Home Repairs", icon: "fa-screwdriver-wrench" },
            { id: 6, name: "Events & Party", icon: "fa-champagne-glasses" },
            { id: 7, name: "Education", icon: "fa-graduation-cap" },
            { id: 8, name: "Real Estate", icon: "fa-building" },
            { id: 9, name: "IT Services", icon: "fa-laptop-code" },
            { id: 10, name: "Packers", icon: "fa-truck-fast" },
            { id: 11, name: "Domestic Help", icon: "fa-broom" },
            { id: 12, name: "Auto Service", icon: "fa-wrench" }
        ],
        trending: [
            { title: "AC Repair", seller: "Cool Services", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&q=80" },
            { title: "Haircut", seller: "Style Salon", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&q=80" },
            { title: "Consultation", seller: "Dr. Sharma", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&q=80" }
        ],
        items: [
            { id: 201, title: "General Checkup", seller: "Dr. Verma Clinic", price: 500, mrp: 800, discount: "37%", distance: "2.1 km", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&q=80", verified: true, promoted: true },
            { id: 202, title: "Legal Consultation", seller: "Adv. Gupta", price: 1500, mrp: 2000, discount: "25%", distance: "3.5 km", image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&q=80", verified: true, promoted: false },
            { id: 203, title: "Deluxe Room Stay", seller: "Hotel Royal", price: 2500, mrp: 4000, discount: "38%", distance: "1.0 km", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80", verified: true, promoted: true },
            { id: 204, title: "Relaxing Spa Massage", seller: "Zen Spa", price: 999, mrp: 2000, discount: "50%", distance: "1.5 km", image: "https://images.unsplash.com/photo-1544161515-4abfbcece9f2?w=500&q=80", verified: false, promoted: false }
        ]
    }
};

let currentMainType = 'products';

async function fetchSupabaseItems() {
    try {
        const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select('*');
            
        const { data: servData, error: servError } = await supabase
            .from('services')
            .select('*');
            
        if (prodData && prodData.length > 0) {
            // Keep verified/promoted structure matching schema
            db.products.items = prodData.map(p => ({
                id: p.id,
                title: p.title,
                seller: "Vyapark Partner",
                price: parseFloat(p.price),
                mrp: parseFloat(p.mrp),
                discount: `${Math.round(((p.mrp - p.price) / p.mrp) * 100)}%`,
                distance: "1.1 km",
                image: p.image_url || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
                verified: true,
                promoted: p.is_approved, // show approved products as promoted/featured
                cod_available: p.cod_available,
                same_day_delivery: p.same_day_delivery,
                return_policy: p.return_policy,
                warranty_policy: p.warranty_policy
            }));
        }
        
        if (servData && servData.length > 0) {
            db.services.items = servData.map(s => ({
                id: s.id,
                title: s.title,
                seller: "Vyapark Service",
                price: parseFloat(s.price),
                mrp: parseFloat(s.price) * 1.2,
                discount: "15%",
                distance: "1.5 km",
                image: s.image_url || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&q=80",
                verified: true,
                promoted: s.is_approved
            }));
        }
    } catch (err) {
        console.warn("Supabase fetch failed, using local mock data fallback.", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial Dynamic Render
    fetchSupabaseItems().then(() => {
        renderApp();
    });

    // 1. Live Text Search
    const searchInput = document.getElementById('lang-search-placeholder');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            handleLiveSearch(val);
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if(!e.target.closest('.search-bar')) {
                const dropdown = document.getElementById('search-dropdown');
                if(dropdown) dropdown.style.display = 'none';
            }
        });
    }

    // 2. Voice Search
    const voiceBtn = document.querySelector('.voice-search');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                const currentLang = document.getElementById('lang-switcher')?.value || 'en';
                
                recognition.lang = currentLang === 'hi' ? 'hi-IN' : (currentLang === 'gu' ? 'gu-IN' : 'en-US');
                
                const icon = voiceBtn.querySelector('i');
                icon.className = 'fa-solid fa-microphone-lines fa-fade text-danger';
                
                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    if(searchInput) {
                        searchInput.value = transcript;
                        handleLiveSearch(transcript);
                    }
                    icon.className = 'fa-solid fa-microphone';
                };
                
                recognition.onerror = () => icon.className = 'fa-solid fa-microphone';
                recognition.onend = () => icon.className = 'fa-solid fa-microphone';
                
                recognition.start();
            } else {
                alert('Voice search is not supported in your browser.');
            }
        });
    }

    // Real Geolocation Implementation
    const locationDisplay = document.querySelector('.current-location');
    if (locationDisplay && 'geolocation' in navigator) {
        locationDisplay.innerHTML = 'Detecting Location... <i class="fa-solid fa-spinner fa-spin"></i>';
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // Save for distance calculations on other pages
                localStorage.setItem('buyer_lat', lat);
                localStorage.setItem('buyer_lng', lon);
                
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await res.json();
                    
                    const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Your Area';
                    const neighborhood = data.address.suburb || data.address.neighbourhood || '';
                    
                    const locationString = neighborhood ? `${neighborhood}, ${city}` : city;
                    locationDisplay.innerHTML = `${locationString} <i class="fa-solid fa-chevron-down"></i>`;
                } catch (e) {
                    locationDisplay.innerHTML = `Location Detected <i class="fa-solid fa-chevron-down"></i>`;
                }
            },
            (error) => {
                locationDisplay.innerHTML = `Set Location Manually <i class="fa-solid fa-chevron-down"></i>`;
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    // Initialize Default Language
    changeLanguage('en');
});

function handleLiveSearch(val) {
    const dropdown = document.getElementById('search-dropdown');
    if(!dropdown) return;
    
    if (val.length < 2) {
        dropdown.style.display = 'none';
        renderApp(); // reset main grid
        return;
    }
    
    const data = db[currentMainType];
    const filtered = data.items.filter(p => 
        p.title.toLowerCase().includes(val.toLowerCase()) || 
        p.seller.toLowerCase().includes(val.toLowerCase())
    );
    
    if (filtered.length === 0) {
        dropdown.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:14px;">No results found</div>`;
    } else {
        dropdown.innerHTML = filtered.map(item => `
            <div class="search-dropdown-item" onclick="window.location.href='product-details.html'">
                <img src="${item.image}" alt="${item.title}">
                <div class="sdi-info">
                    <div class="sdi-title">${item.title}</div>
                    <div class="sdi-meta">₹${formatPrice(item.price)} • ${item.seller}</div>
                </div>
                <i class="fa-solid fa-chevron-right" style="color:var(--text-muted); font-size:12px;"></i>
            </div>
        `).join('');
    }
    
    dropdown.style.display = 'flex';
    
    // We still update the main grid too as before
    renderApp(val);
}

// Toggle Main Type (Products / Services)
window.switchMainType = function(type) {
    currentMainType = type;
    
    // Update Active Button Style
    document.getElementById('btn-products').classList.toggle('active', type === 'products');
    document.getElementById('btn-services').classList.toggle('active', type === 'services');
    
    // Clear search input on switch
    const searchInput = document.getElementById('lang-search-placeholder');
    if (searchInput) searchInput.value = '';

    renderApp();
};

function renderApp(filterText = "") {
    const data = db[currentMainType];
    
    // 1. Render Sub-Categories
    const catContainer = document.getElementById('sub-categories-container');
    if (catContainer) {
        catContainer.innerHTML = '';
        data.categories.forEach(cat => {
            const el = document.createElement('div');
            el.className = 'category-item';
            el.innerHTML = `<div class="category-icon"><i class="fa-solid ${cat.icon}"></i></div><span>${cat.name}</span>`;
            catContainer.appendChild(el);
        });
    }

    // 2. Render Trending Feed
    const trendContainer = document.getElementById('trending-container');
    if (trendContainer) {
        trendContainer.innerHTML = '';
        data.trending.forEach(item => {
            const el = document.createElement('div');
            el.className = 'trending-card';
            el.innerHTML = `<img src="${item.image}" alt="${item.title}"><h4>${item.title}</h4><span><i class="fa-solid fa-shop"></i> ${item.seller}</span>`;
            trendContainer.appendChild(el);
        });
    }

    // 3. Render Items Grid
    const itemsContainer = document.getElementById('products-container');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
        
        const filtered = data.items.filter(p => 
            p.title.toLowerCase().includes(filterText.toLowerCase()) || 
            p.seller.toLowerCase().includes(filterText.toLowerCase())
        );
        
        if (filtered.length === 0) {
            itemsContainer.innerHTML = `<p style="grid-column: span 2; text-align:center; color:var(--text-muted); padding:20px;">No items found</p>`;
            return;
        }

        filtered.forEach(item => {
            const el = document.createElement('div');
            el.className = 'product-card';
            el.innerHTML = `
                ${item.promoted ? '<div class="promoted-badge">Promoted</div>' : ''}
                <button class="fav-btn" onclick="toggleFav(event, this)">
                    <i class="fa-heart fa-regular"></i>
                </button>
                <img src="${item.image}" class="product-img" alt="${item.title}">
                <div class="product-info">
                    <h4 class="product-title">${item.title}</h4>
                    <div class="product-seller">
                        ${item.seller} 
                        ${item.verified ? '<i class="fa-solid fa-circle-check text-primary" title="Verified"></i>' : ''}
                    </div>
                    <div class="product-price-row">
                        <span class="price">₹${formatPrice(item.price)}</span>
                        <span class="mrp">₹${formatPrice(item.mrp)}</span>
                        <span class="discount">${item.discount} OFF</span>
                    </div>
                    <div class="product-footer">
                        <div class="distance">
                            <i class="fa-solid fa-location-arrow"></i> ${item.distance}
                        </div>
                        <button class="wa-btn" onclick="shareWA(event, '${item.title}')" title="Share to WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>
                        <button class="add-btn" onclick="event.stopPropagation(); alert('Added to cart!');">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
            el.addEventListener('click', () => {
                window.location.href = 'product-details.html';
            });
            itemsContainer.appendChild(el);
        });
    }
}

// Helper for favorite button
window.toggleFav = function(event, btn) {
    event.stopPropagation();
    btn.classList.toggle('active');
    const icon = btn.querySelector('i');
    if (btn.classList.contains('active')) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
    } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
    }
}

// WhatsApp Share
window.shareWA = function(event, title) {
    event.stopPropagation();
    const text = `Hey! Check out ${title} on Vyapark. Download the app now!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}

// Multi-language Dictionary
const dict = {
    en: {
        delivering_to: "Delivering to",
        search_placeholder: "Search products, sellers or categories...",
        smart_watch: "Smart Watch",
        fresh_fruits: "Fresh Fruits",
        products: "Products",
        services: "Services",
        find_sellers: "Find sellers near you!",
        map_desc: "Use map view to explore",
        open_map: "Open Map",
        trending_mohalla: "Trending in your Mohalla",
        near_you: "Near You (5km)",
        view_all: "View All",
        nav_home: "Home",
        nav_map: "Map",
        nav_sell: "Sell",
        nav_chats: "Chats",
        nav_cart: "Cart"
    },
    hi: {
        delivering_to: "यहाँ डिलीवरी",
        search_placeholder: "प्रोडक्ट्स, सेलर्स खोजें...",
        smart_watch: "स्मार्ट वॉच",
        fresh_fruits: "ताज़े फल",
        products: "प्रोडक्ट्स",
        services: "सर्विसेज",
        find_sellers: "आसपास के सेलर्स खोजें!",
        map_desc: "मैप पर एक्सप्लोर करें",
        open_map: "मैप खोलें",
        trending_mohalla: "मोहल्ले में ट्रेंडिंग",
        near_you: "आपके नज़दीक (5km)",
        view_all: "सभी देखें",
        nav_home: "होम",
        nav_map: "मैप",
        nav_sell: "बेचें",
        nav_chats: "चैट्स",
        nav_cart: "कार्ट"
    },
    gu: {
        delivering_to: "અહીં પહોંચાડો",
        search_placeholder: "પ્રોડક્ટ્સ, સેલર્સ શોધો...",
        smart_watch: "સ્માર્ટ વોચ",
        fresh_fruits: "તાજા ફળો",
        products: "પ્રોડક્ટ્સ",
        services: "સર્વિસિસ",
        find_sellers: "નજીકના સેલર્સ શોધો!",
        map_desc: "મેપ પર જુઓ",
        open_map: "મેપ ખોલો",
        trending_mohalla: "તમારા વિસ્તારમાં ટ્રેન્ડિંગ",
        near_you: "તમારી નજીક (5km)",
        view_all: "બધા જુઓ",
        nav_home: "હોમ",
        nav_map: "મેપ",
        nav_sell: "વેચો",
        nav_chats: "ચેટ્સ",
        nav_cart: "કાર્ટ"
    }
};

window.changeLanguage = function(lang) {
    const translations = dict[lang];
    if (!translations) return;

    // Change text content for elements with data-lang attribute
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[key]) {
            if (el.tagName === 'INPUT') {
                el.placeholder = translations[key];
            } else {
                el.innerText = translations[key];
            }
        }
    });
}

window.toggleFilterModal = function() {
    const modal = document.getElementById('filter-modal');
    if (modal) {
        modal.classList.toggle('active');
    }
}

window.applyFilters = function() {
    toggleFilterModal();
    // Simulate re-rendering products with a loader
    const itemsContainer = document.getElementById('products-container');
    if (itemsContainer) {
        itemsContainer.innerHTML = `<div style="grid-column: span 2; text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin text-primary" style="font-size:32px;"></i><p style="margin-top:12px; font-weight:500;">Applying Filters...</p></div>`;
        
        setTimeout(() => {
            const searchInput = document.getElementById('lang-search-placeholder');
            renderApp(searchInput ? searchInput.value : '');
        }, 800);
    }
}
