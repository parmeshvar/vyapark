document.addEventListener('DOMContentLoaded', () => {
    // Initialize Dashboard Tab by default
    switchTab('dashboard', document.querySelector('.nav-item.active'));
});

let salesChartInstance = null;
window.lastUploadedImageData = null;

function switchTab(tabId, navElement) {
    // Update Nav UI
    document.querySelectorAll('.bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
    if(navElement) {
        navElement.classList.add('active');
    }

    // Get Content Area
    const mainContent = document.getElementById('main-content');
    
    // Get Template
    const template = document.getElementById(`tpl-${tabId}`);
    if (template) {
        // Clear main content and inject template
        mainContent.innerHTML = template.innerHTML;
        
        // Tab Specific Initialization
        if (tabId === 'dashboard') {
            initChart();
        } else if (tabId === 'products') {
            renderSellerProducts();
        } else if (tabId === 'add') {
            setTimeout(() => {
                if (typeof updateSubCategories === 'function') updateSubCategories();
            }, 50);
        }
    }
}

function initChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales (₹)',
                data: [1200, 1900, 1500, 2200, 1800, 2800, 2500],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, display: false },
                x: { grid: { display: false } }
            }
        }
    });
}

window.showMasterProducts = function(val) {
    const grid = document.getElementById('master-products-grid');
    if (val.length > 2) {
        grid.style.display = 'grid';
    } else {
        grid.style.display = 'none';
    }
}

window.showCustomForm = function() {
    document.getElementById('add-product-form').style.display = 'block';
    document.getElementById('prod-title').value = '';
    document.getElementById('prod-main-category').value = 'products';
    updateSubCategories();
    document.getElementById('prod-description').value = '';
    document.getElementById('prod-mrp').value = '';
    
    // Reset image area
    const imgArea = document.getElementById('product-img-preview');
    imgArea.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i>
                         <p>Upload Image</p>
                         <span style="font-size:11px; color:var(--text-muted);">Auto-resize & Compress</span>`;
    imgArea.onclick = () => document.getElementById('product-image-upload').click();
}

window.selectMasterProduct = function(title, category, imgUrl, mrp) {
    // Show form
    document.getElementById('add-product-form').style.display = 'block';
    
    // Fill fields
    document.getElementById('prod-title').value = title;
    document.getElementById('prod-main-category').value = 'products';
    updateSubCategories();
    document.getElementById('prod-sub-category').value = category;
    document.getElementById('prod-mrp').value = mrp;
    
    window.lastUploadedImageData = imgUrl;
    
    // Replace upload UI with image preview
    const imgArea = document.getElementById('product-img-preview');
    imgArea.innerHTML = `<img src="${imgUrl}" style="width:100px; height:100px; border-radius:8px; object-fit:cover;">
                         <p style="margin-top:8px; font-size:12px; color:var(--success); font-weight:600;"><i class="fa-solid fa-circle-check"></i> Image Auto-selected</p>`;
                         
    // Scroll to form
    setTimeout(() => {
        document.getElementById('add-product-form').scrollIntoView({behavior: "smooth"});
    }, 100);
}

// Client-side Image Compression
window.handleImageUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const imgArea = document.getElementById('product-img-preview');
    imgArea.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-primary"></i><p style="margin-top:8px;">Compressing...</p>`;
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Auto-resize limit
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress as JPEG with 70% quality
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            window.lastUploadedImageData = compressedDataUrl;

            // Update UI with compressed preview
            imgArea.innerHTML = `<img src="${compressedDataUrl}" style="width:100px; height:100px; border-radius:8px; object-fit:cover;">
                                 <p style="margin-top:8px; font-size:12px; color:var(--success); font-weight:600;"><i class="fa-solid fa-compress"></i> Resized & Compressed</p>`;
            imgArea.onclick = null; // Remove click to avoid accidental re-upload
        }
    }
}

async function uploadToCloudinary(base64Data) {
    const cloudName = window.CLOUDINARY_CLOUD_NAME || "dmj4hvj80";
    const preset = window.CLOUDINARY_UPLOAD_PRESET || "uw-upload-preset";
    
    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append("upload_preset", preset);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
    });
    
    if (!res.ok) {
        throw new Error("Failed to upload image to Cloudinary CDN.");
    }
    
    const data = await res.json();
    return data.secure_url;
}

window.submitProductToSupabase = async function() {
    const title = document.getElementById('prod-title').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const mrp = parseFloat(document.getElementById('prod-mrp').value);
    const category = document.getElementById('prod-category').value;
    const stock = parseInt(document.getElementById('prod-stock').value) || 10;
    
    const cod = document.getElementById('pol-cod').checked;
    const sdd = document.getElementById('pol-sdd').checked;
    const ret = document.getElementById('pol-ret').checked;
    const war = document.getElementById('pol-war').checked;
    
    if (!title || !price || !mrp) {
        alert("Please enter title, price and MRP");
        return;
    }
    
    const btn = document.querySelector('#add-product-form button.btn-primary');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Uploading Image...';
    
    try {
        let imageUrl = window.lastUploadedImageData || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80";
        
        // Upload image to Cloudinary if it is a local compressed Base64
        if (imageUrl && imageUrl.startsWith('data:image')) {
            btn.innerText = 'Saving Image to Cloudinary CDN...';
            imageUrl = await uploadToCloudinary(imageUrl);
        }
        
        btn.innerText = 'Submitting Product details...';
        
        const productData = {
            title: title,
            price: price,
            mrp: mrp,
            category: category,
            stock: stock,
            image_url: imageUrl,
            cod_available: cod,
            same_day_delivery: sdd,
            return_policy: ret,
            warranty_policy: war,
            is_approved: false
        };
        
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select();
            
        if (error) throw error;
        
        alert('Product uploaded and sent to Admin for approval! 🎉');
        
        // Reset Form and Switch Tab
        document.getElementById('add-product-form').style.display = 'none';
        switchTab('products', document.querySelector('.bottom-nav a:nth-child(2)'));
    } catch (err) {
        console.error(err);
        alert('Upload Error: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

window.renderSellerProducts = async function() {
    const listContainer = document.querySelector('.seller-product-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin fa-2x text-primary"></i><p style="margin-top:12px;">Loading your Catalog...</p></div>`;
    
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const session = (await supabase.auth.getSession()).data.session;
        let sellerProfile = null;
        if (session) {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
            sellerProfile = data;
        }
        
        const shopHeader = document.querySelector('.seller-shop-info h3');
        if (shopHeader && sellerProfile) {
            shopHeader.innerHTML = `${sellerProfile.shop_name || sellerProfile.full_name} <button class="btn-outline-small" style="padding:4px 10px;"><i class="fa-solid fa-share-nodes"></i> Share Catalog</button>`;
        }
        
        const catalogTitle = document.querySelector('.section-header h2');
        if (catalogTitle) {
            catalogTitle.innerText = `My Catalog (${products ? products.length : 0})`;
        }
        
        if (!products || products.length === 0) {
            listContainer.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-muted);"><i class="fa-solid fa-store-slash fa-2x"></i><p style="margin-top:12px;">Your catalog is empty. Click 'Add New' to list your first product!</p></div>`;
            return;
        }
        
        listContainer.innerHTML = products.map(item => `
            <div class="seller-product-item" id="prod-${item.id}">
                <img src="${item.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&q=80'}" alt="${item.title}" style="width:70px; height:70px; border-radius:8px; object-fit:cover;">
                <div class="spi-info" style="flex:1; margin-left:12px;">
                    <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:600; color:var(--text-main);">${item.title}</h4>
                    <div class="spi-price" style="font-size:13px; font-weight:700; color:var(--primary);">
                        ₹${item.price} 
                        <span class="stock ${item.is_approved ? 'text-success' : 'text-warning'}" style="font-size:11px; margin-left:8px; font-weight:600;">
                            ${item.is_approved ? 'Live' : 'Pending'}
                        </span>
                    </div>
                    <div class="spi-actions" style="margin-top:8px; display:flex; gap:12px; align-items:center;">
                        <button class="btn-icon-small" onclick="deleteProduct('${item.id}')" style="color:var(--danger); border-color:rgba(239,68,68,0.2);"><i class="fa-solid fa-trash"></i></button>
                        <button class="btn-icon-small" onclick="shareWA(event, '${item.title}')"><i class="fa-solid fa-share-nodes"></i></button>
                        <div class="toggle-switch" style="margin-left:auto;">
                            <input type="checkbox" ${item.stock > 0 ? 'checked' : ''} onchange="toggleStock('${item.id}', this.checked)">
                            <span class="slider"></span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (err) {
        console.error(err);
        listContainer.innerHTML = `<div style="text-align:center; padding:32px; color:var(--danger);"><p>Error loading catalog: ${err.message}</p></div>`;
    }
};

window.deleteProduct = async function(id) {
    if(!confirm("Are you sure you want to delete this product?")) return;
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        document.getElementById(`prod-${id}`).remove();
        alert("Product deleted successfully!");
    } catch(e) {
        alert("Delete failed: " + e.message);
    }
};

window.toggleStock = async function(id, checked) {
    try {
        const { error } = await supabase
            .from('products')
            .update({ stock: checked ? 10 : 0 })
            .eq('id', id);
        if (error) throw error;
    } catch(e) {
        alert("Failed to update stock: " + e.message);
    }
};

const PRODUCT_SUBCATEGORIES = [
    "Electronics", "Fashion", "Groceries", "Home & Living", 
    "Beauty & Care", "Sports & Fitness", "Toys & Games", 
    "Automotive", "Books & Stationery", "Pharmacy & Wellness", 
    "Jewelry & Watches", "Hardware & Tools"
];

const SERVICE_SUBCATEGORIES = [
    "Home Cleaning", "Plumbing", "Electrical Works", "AC Repair & Service", 
    "Carpentry", "Painting Services", "Beauty & Salon at Home", 
    "Appliance Repair", "IT Support & Tech Help", "Tuition & Coaching", 
    "Photography", "Event Management"
];

window.updateSubCategories = function() {
    const mainCat = document.getElementById('prod-main-category').value;
    const subCatSelect = document.getElementById('prod-sub-category');
    if (!subCatSelect) return;
    
    let options = [];
    if (mainCat === 'products') {
        options = PRODUCT_SUBCATEGORIES;
        // Show MRP, Stock, and Policies
        document.getElementById('mrp-group').style.display = 'block';
        document.getElementById('stock-group').style.display = 'block';
        document.getElementById('policies-group').style.display = 'block';
    } else {
        options = SERVICE_SUBCATEGORIES;
        // Hide MRP, Stock, and Policies for Services
        document.getElementById('mrp-group').style.display = 'none';
        document.getElementById('stock-group').style.display = 'none';
        document.getElementById('policies-group').style.display = 'none';
    }
    
    subCatSelect.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
};
