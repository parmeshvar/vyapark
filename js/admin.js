// ========================================================
// VYAPARK SUPER ADMIN SYSTEM (Supabase Integration)
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    loadAdminDashboard();
});

window.loadAdminDashboard = async function() {
    try {
        // 1. Fetch metrics from Supabase
        const { data: sellers } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'seller');
            
        const { data: buyers } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'buyer');
            
        const { data: products } = await supabase
            .from('products')
            .select('*');
            
        const pendingProducts = products ? products.filter(p => !p.is_approved) : [];
        const activeSellersCount = sellers ? sellers.length : 0;
        const totalBuyersCount = buyers ? buyers.length : 0;
        
        // Update KPI Metrics Cards
        const kpis = document.querySelectorAll('.kpi-grid .kpi-card h3');
        if (kpis.length >= 4) {
            // Keep total revenue mock/aesthetic but make active sellers & buyers live!
            kpis[1].innerText = activeSellersCount;
            kpis[2].innerText = totalBuyersCount;
            kpis[3].innerText = pendingProducts.length; // Pending approvals today
        }
        
        // 2. Load Pending Seller Approvals
        const sellerApprovalContainer = document.querySelector('.admin-panel:nth-child(1) .panel-body');
        if (sellerApprovalContainer) {
            const pendingSellers = sellers ? sellers.filter(s => !s.is_verified) : [];
            
            if (pendingSellers.length === 0) {
                sellerApprovalContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;"><i class="fa-solid fa-circle-check text-success fa-lg"></i> All sellers verified!</div>`;
            } else {
                sellerApprovalContainer.innerHTML = pendingSellers.map(s => `
                    <div class="approval-item" id="seller-app-${s.id}">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.shop_name || s.full_name)}&background=10b981&color=fff" alt="Seller">
                        <div class="ai-info" style="flex:1; margin-left:12px;">
                            <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:600;">${s.shop_name || s.full_name}</h4>
                            <p style="margin:0; font-size:12px; color:var(--text-muted);">Phone: ${s.phone || 'N/A'}</p>
                            <label style="font-size:11px; display:flex; align-items:center; gap:4px; margin-top:4px; cursor:pointer;">
                                <input type="checkbox" id="badge-${s.id}" checked style="accent-color:var(--warning);"> <i class="fa-solid fa-medal text-warning"></i> Golden Badge
                            </label>
                        </div>
                        <div class="ai-actions" style="display:flex; gap:8px;">
                            <button class="btn-success-small" title="Approve Seller" onclick="approveSeller('${s.id}')" style="background:var(--success); color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                            <button class="btn-danger-small" title="Reject Seller" onclick="rejectSeller('${s.id}')" style="background:var(--danger); color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // 3. Load Pending Product Approvals
        const productApprovalContainer = document.querySelector('.admin-panel:nth-child(2) .panel-body');
        if (productApprovalContainer) {
            if (pendingProducts.length === 0) {
                productApprovalContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;"><i class="fa-solid fa-circle-check text-success fa-lg"></i> All products approved!</div>`;
            } else {
                productApprovalContainer.innerHTML = pendingProducts.map(p => `
                    <div class="approval-item" id="prod-app-${p.id}">
                        <img src="${p.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&q=80'}" alt="Product" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
                        <div class="ai-info" style="flex:1; margin-left:12px;">
                            <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:600;">${p.title}</h4>
                            <p style="margin:0; font-size:12px; color:var(--text-muted);">By Seller | Price: ₹${p.price}</p>
                        </div>
                        <div class="ai-actions" style="display:flex; gap:8px;">
                            <button class="btn-success-small" title="Approve Product" onclick="approveProduct('${p.id}')" style="background:var(--success); color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                            <button class="btn-danger-small" title="Reject Product" onclick="rejectProduct('${p.id}')" style="background:var(--danger); color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
    } catch(err) {
        console.error("Super Admin Dashboard Error:", err);
    }
};

window.approveSeller = async function(id) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_verified: true })
            .eq('id', id);
            
        if (error) throw error;
        alert("Seller Verified & Golden Badge Approved! 🏅");
        loadAdminDashboard();
    } catch(e) {
        alert("Failed to verify seller: " + e.message);
    }
};

window.rejectSeller = async function(id) {
    if(!confirm("Are you sure you want to reject this seller profile?")) return;
    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        alert("Seller Profile Rejected & Deleted.");
        loadAdminDashboard();
    } catch(e) {
        alert("Failed to reject seller: " + e.message);
    }
};

window.approveProduct = async function(id) {
    try {
        const { error } = await supabase
            .from('products')
            .update({ is_approved: true })
            .eq('id', id);
            
        if (error) throw error;
        alert("Product is now LIVE on Vyapark! 🎉");
        loadAdminDashboard();
    } catch(e) {
        alert("Failed to approve product: " + e.message);
    }
};

window.rejectProduct = async function(id) {
    if(!confirm("Are you sure you want to reject this product listing?")) return;
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        alert("Product Listing Rejected & Deleted.");
        loadAdminDashboard();
    } catch(e) {
        alert("Failed to reject product: " + e.message);
    }
};
