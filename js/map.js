document.addEventListener('DOMContentLoaded', () => {
    // Initialize Map centered on Delhi (mock location)
    const map = L.map('map-view', {zoomControl: false}).setView([28.6139, 77.2090], 13);

    // Add CartoDB Voyager tiles (clean, light mode style perfect for this app)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Mock Sellers Data
    const sellers = [
        {
            id: 1,
            lat: 28.6139,
            lng: 77.2090,
            product: "Wireless Earbuds Pro",
            seller: "Tech Store Delhi",
            price: 1299,
            dist: "1.2",
            image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=100&q=80"
        },
        {
            id: 2,
            lat: 28.6250,
            lng: 77.2150,
            product: "Men's Casual Shirt",
            seller: "Fashion Hub",
            price: 499,
            dist: "0.8",
            image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=100&q=80"
        },
        {
            id: 3,
            lat: 28.6050,
            lng: 77.2000,
            product: "Smart Watch Series 8",
            seller: "Gadget Galaxy",
            price: 2499,
            dist: "2.5",
            image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&q=80"
        }
    ];

    // Add markers
    sellers.forEach(s => {
        const customIcon = L.divIcon({
            className: 'custom-marker-wrapper',
            html: `<div class="custom-marker"><img src="${s.image}" /></div>`,
            iconSize: [44, 56],
            iconAnchor: [22, 56]
        });

        const marker = L.marker([s.lat, s.lng], {icon: customIcon}).addTo(map);
        
        marker.on('click', () => {
            openBottomSheet(s);
            map.flyTo([s.lat, s.lng], 15, {
                duration: 0.5
            });
        });
    });

    // Handle My Location Click
    document.querySelector('.my-location-btn').addEventListener('click', () => {
        map.flyTo([28.6139, 77.2090], 14, { duration: 1 });
    });

    // Close bottom sheet when map is clicked
    map.on('click', () => {
        document.getElementById('product-bottom-sheet').classList.remove('open');
    });

    // Bottom Sheet Logic
    function openBottomSheet(data) {
        document.getElementById('sheet-img').src = data.image;
        document.getElementById('sheet-title').innerText = data.product;
        document.getElementById('sheet-seller').innerHTML = `<i class="fa-solid fa-shop"></i> ${data.seller}`;
        document.getElementById('sheet-price').innerText = `₹${data.price}`;
        document.getElementById('sheet-dist').innerHTML = `<i class="fa-solid fa-location-arrow"></i> ${data.dist} km`;
        
        document.getElementById('product-bottom-sheet').classList.add('open');
    }
});
