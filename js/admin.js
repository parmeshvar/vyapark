// ========================================================
// VYAPARK SUPER ADMIN SYSTEM (Supabase Integration)
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    loadAdminDashboard();
    setupAdminTabs();
});

function setupAdminTabs() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const tabSections = document.querySelectorAll('.tab-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('data-tab');
            if (!targetId) return;

            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Update active tab section
            tabSections.forEach(section => {
                if (section.id === targetId) {
                    section.style.display = 'block';
                    section.classList.add('active');
                } else {
                    section.style.display = 'none';
                    section.classList.remove('active');
                }
            });
        });
    });
}

window.openAdminTab = function(targetId) {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const tabSections = document.querySelectorAll('.tab-section');

    navLinks.forEach(l => l.classList.remove('active'));
    
    // Find matching nav link and make it active
    const activeLink = Array.from(navLinks).find(l => l.getAttribute('data-tab') === targetId);
    if (activeLink) activeLink.classList.add('active');

    tabSections.forEach(section => {
        if (section.id === targetId) {
            section.style.display = 'block';
            section.classList.add('active');
        } else {
            section.style.display = 'none';
            section.classList.remove('active');
        }
    });
};

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
        
        // Update seller & buyer KPI Metrics Cards (Orders and Revenue will be updated below)
        const selEl = document.getElementById('active-sellers-kpi');
        const buyEl = document.getElementById('total-buyers-kpi');

        if (selEl) selEl.innerText = activeSellersCount;
        if (buyEl) buyEl.innerText = totalBuyersCount;
        
        // Render all sellers in the Manage Sellers tab
        if (sellers) {
            renderAllSellersTable(sellers);
        }

        // Render all buyers in the Manage Buyers tab
        if (buyers) {
            renderAllBuyersTable(buyers);
        }

        // Fetch Orders and render Orders tab
        let allOrders = [];
        try {
            const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            if (orders) allOrders = [...orders];
        } catch(e) { console.warn("Supabase orders fetch error", e); }
        
        try {
            const localOrders = JSON.parse(localStorage.getItem('vyapark_local_orders') || '[]');
            // Merge and sort
            allOrders = [...localOrders, ...allOrders].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        } catch(e) {}

        if (sellers && buyers) {
            const enrichedOrders = allOrders.map(o => {
                const b = buyers.find(buyer => buyer.id === o.buyer_id) || { full_name: 'Local/Guest Buyer' };
                const s = sellers.find(seller => seller.id === o.seller_id) || { shop_name: 'Local Shop' };
                return { ...o, buyer: b, seller: s };
            });
            renderAllOrdersTable(enrichedOrders);
            updateOrdersKPIs(enrichedOrders);
        }

        // Update Revenue & Orders Today KPIs
        const revEl = document.getElementById('total-revenue-kpi');
        const ordEl = document.getElementById('orders-today-kpi');
        const todayStr = new Date().toDateString();
        const ordersTodayCount = allOrders.filter(o => new Date(o.created_at).toDateString() === todayStr).length;
        let totalRevenue = 0;
        allOrders.forEach(o => totalRevenue += (Number(o.total_amount) || 0));
        
        if (revEl) revEl.innerText = '₹' + totalRevenue.toLocaleString('en-IN');
        if (ordEl) ordEl.innerText = ordersTodayCount;

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

window.renderAllSellersTable = function(sellers) {
    const tableBody = document.getElementById('all-sellers-table-body');
    if (!tableBody) return;

    if (sellers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No sellers found.</td></tr>`;
        return;
    }

    // Store globally for search filtering
    if (!window.allSellersData || window.allSellersData.length !== sellers.length) {
        window.allSellersData = sellers; 
    }

    tableBody.innerHTML = sellers.map(s => {
        const statusBadge = s.is_verified 
            ? `<span style="background: var(--success); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;"><i class="fa-solid fa-check"></i> Verified</span>` 
            : `<span style="background: var(--warning); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;"><i class="fa-solid fa-clock"></i> Pending</span>`;

        return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 15px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.full_name || 'Seller')}&background=10b981&color=fff" alt="Seller" style="width:40px; height:40px; border-radius:50%;">
                        <div>
                            <strong>${s.full_name || 'N/A'}</strong>
                            <div style="font-size:12px; color:var(--text-muted);">Joined: ${s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 15px;">${s.shop_name || 'N/A'}</td>
                <td style="padding: 15px;">
                    <div><i class="fa-solid fa-phone" style="font-size:10px;"></i> ${s.phone || 'N/A'}</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${s.address || 'N/A'}</div>
                </td>
                <td style="padding: 15px;">${statusBadge}</td>
                <td style="padding: 15px;">
                    <button class="action-btn view-seller-btn" data-id="${s.id}" title="View Details" style="background:var(--primary); color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-eye"></i></button>
                    ${s.is_verified 
                        ? `<button class="action-btn suspend-seller-btn" data-id="${s.id}" title="Suspend Seller" style="background:var(--warning); color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-ban"></i></button>`
                        : `<button class="action-btn approve-seller-btn" data-id="${s.id}" title="Approve Seller" style="background:var(--success); color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-check"></i></button>`
                    }
                    <button class="action-btn delete-seller-btn" data-id="${s.id}" title="Delete Seller" style="background:var(--danger); color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
};

window.suspendSeller = async function(id) {
    if(!confirm("Are you sure you want to suspend this seller? They will not be able to sell products.")) return;
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_verified: false })
            .eq('id', id);
            
        if (error) throw error;
        alert("Seller Suspended Successfully.");
        loadAdminDashboard();
    } catch(e) {
        alert("Failed to suspend seller: " + e.message);
    }
};

window.viewSellerDetails = function(id) {
    // Find seller in cached data
    const seller = window.allSellersData ? window.allSellersData.find(s => s.id === id) : null;
    if (!seller) { alert('Seller data not found.'); return; }

    const name = seller.full_name || 'N/A';
    document.getElementById('sdm-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=100`;
    document.getElementById('sdm-name').innerText = name;
    document.getElementById('sdm-shop').innerText = seller.shop_name ? `🏪 ${seller.shop_name}` : 'No shop name';
    document.getElementById('sdm-phone').innerText = seller.phone ? '+91 ' + seller.phone : 'N/A';
    document.getElementById('sdm-role').innerText = (seller.role || 'seller').toUpperCase();
    document.getElementById('sdm-status').innerHTML = seller.is_verified 
        ? '<span style="color:var(--success);">✓ Verified</span>' 
        : '<span style="color:var(--warning);">⏳ Pending</span>';
    document.getElementById('sdm-joined').innerText = seller.created_at ? new Date(seller.created_at).toLocaleDateString('en-IN') : 'N/A';
    document.getElementById('sdm-address').innerText = seller.address || 'No address on file';

    const modal = document.getElementById('seller-detail-modal');
    modal.style.display = 'flex';
};

window.doAdminLogout = async function() {
    if (!confirm('Are you sure you want to logout?')) return;
    await supabase.auth.signOut();
    localStorage.removeItem('vyapark_user_id');
    localStorage.removeItem('vyapark_user_role');
    window.location.href = 'auth.html';
};

// Setup search filter for sellers table
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('seller-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            if (window.allSellersData) {
                const filtered = window.allSellersData.filter(s => 
                    (s.full_name && s.full_name.toLowerCase().includes(term)) || 
                    (s.shop_name && s.shop_name.toLowerCase().includes(term)) ||
                    (s.phone && s.phone.toLowerCase().includes(term))
                );
                renderAllSellersTable(filtered);
            }
        });
    }

    const buyerSearchInput = document.getElementById('buyer-search');
    if (buyerSearchInput) {
        buyerSearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            if (window.allBuyersData) {
                const filtered = window.allBuyersData.filter(b => 
                    (b.full_name && b.full_name.toLowerCase().includes(term)) || 
                    (b.phone && b.phone.toLowerCase().includes(term))
                );
                renderAllBuyersTable(filtered);
            }
        });
    }

    // Action button event delegation
    const allSellersTableBody = document.getElementById('all-sellers-table-body');
    if (allSellersTableBody) {
        allSellersTableBody.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-seller-btn');
            if (viewBtn) window.viewSellerDetails(viewBtn.dataset.id);

            const suspendBtn = e.target.closest('.suspend-seller-btn');
            if (suspendBtn) window.suspendSeller(suspendBtn.dataset.id);

            const approveBtn = e.target.closest('.approve-seller-btn');
            if (approveBtn) window.approveSeller(approveBtn.dataset.id);

            const deleteBtn = e.target.closest('.delete-seller-btn');
            if (deleteBtn) window.rejectSeller(deleteBtn.dataset.id);
        });
    }

    const allBuyersTableBody = document.getElementById('all-buyers-table-body');
    if (allBuyersTableBody) {
        allBuyersTableBody.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-buyer-btn');
            if (viewBtn) window.viewBuyerDetails(viewBtn.dataset.id);

            const deleteBtn = e.target.closest('.delete-buyer-btn');
            if (deleteBtn) window.deleteBuyer(deleteBtn.dataset.id);
        });
    }
});

window.renderAllBuyersTable = function(buyers) {
    const tableBody = document.getElementById('all-buyers-table-body');
    if (!tableBody) return;

    if (buyers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted);">No buyers found.</td></tr>`;
        return;
    }

    // Store globally for search filtering
    if (!window.allBuyersData || window.allBuyersData.length !== buyers.length) {
        window.allBuyersData = buyers; 
    }

    tableBody.innerHTML = buyers.map(b => {
        return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 15px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(b.full_name || 'Buyer')}&background=6366f1&color=fff" alt="Buyer" style="width:40px; height:40px; border-radius:50%;">
                        <div>
                            <strong>${b.full_name || 'N/A'}</strong>
                        </div>
                    </div>
                </td>
                <td style="padding: 15px;">
                    <div><i class="fa-solid fa-phone" style="font-size:10px;"></i> ${b.phone || 'N/A'}</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${b.address || 'N/A'}</div>
                </td>
                <td style="padding: 15px;">${b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A'}</td>
                <td style="padding: 15px;">
                    <button class="action-btn view-buyer-btn" data-id="${b.id}" title="View Details" style="background:var(--primary); color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-eye"></i></button>
                    <button class="action-btn delete-buyer-btn" data-id="${b.id}" title="Delete Buyer" style="background:var(--danger); color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
};

window.viewBuyerDetails = function(id) {
    alert("View Buyer Details modal coming soon for ID: " + id);
};

window.deleteBuyer = async function(id) {
    if(!confirm("Are you sure you want to delete this buyer account?")) return;
    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        alert("Buyer Profile Deleted.");
        loadAdminDashboard();
    } catch(e) {
        alert("Failed to delete buyer: " + e.message);
    }
};

window.updateOrdersKPIs = function(orders) {
    if (!orders) return;
    
    let totalSales = 0;
    let totalCommission = 0;
    let pendingPayouts = 0;

    orders.forEach(o => {
        totalSales += Number(o.total_amount) || 0;
        totalCommission += Number(o.commission_amount) || 0;
        if (o.status !== 'cancelled' && o.status !== 'delivered') {
            pendingPayouts += (Number(o.total_amount) - Number(o.commission_amount)) || 0;
        }
    });

    document.getElementById('total-orders-kpi').innerText = orders.length;
    document.getElementById('total-sales-kpi').innerText = '₹' + totalSales.toLocaleString('en-IN');
    document.getElementById('total-commission-kpi').innerText = '₹' + totalCommission.toLocaleString('en-IN');
    document.getElementById('pending-payouts-kpi').innerText = '₹' + pendingPayouts.toLocaleString('en-IN');
};

window.renderAllOrdersTable = function(orders) {
    const tableBody = document.getElementById('all-orders-table-body');
    if (!tableBody) return;

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No orders found.</td></tr>`;
        return;
    }

    if (!window.allOrdersData || window.allOrdersData.length !== orders.length) {
        window.allOrdersData = orders; 
    }

    tableBody.innerHTML = orders.map(o => {
        let statusColor = 'var(--text-muted)';
        if (o.status === 'delivered') statusColor = 'var(--success)';
        if (o.status === 'pending') statusColor = 'var(--warning)';
        if (o.status === 'processing') statusColor = 'var(--primary)';
        if (o.status === 'cancelled') statusColor = 'var(--danger)';

        const orderDate = new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

        return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 15px;">
                    <strong>#${o.id.split('-')[0].toUpperCase()}</strong>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${orderDate}</div>
                </td>
                <td style="padding: 15px;">
                    <div>${o.buyer.full_name || 'N/A'}</div>
                    <div style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${o.buyer.phone || 'N/A'}</div>
                </td>
                <td style="padding: 15px;">
                    <div>${o.seller.shop_name || o.seller.full_name || 'N/A'}</div>
                    <div style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${o.seller.phone || 'N/A'}</div>
                </td>
                <td style="padding: 15px;">
                    <div><strong>₹${o.total_amount}</strong></div>
                    <div style="font-size:12px; color:var(--success); margin-top:2px;">Comm: ₹${o.commission_amount}</div>
                    <div style="font-size:12px; color:var(--text-muted);">GST: ₹${o.gst_amount}</div>
                </td>
                <td style="padding: 15px;">
                    <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                        ${o.status}
                    </span>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${o.payment_method.toUpperCase()}</div>
                </td>
                <td style="padding: 15px;">
                    <button onclick="updateOrderStatus('${o.id}')" title="Update Status" style="background:var(--primary); color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-pen"></i></button>
                </td>
            </tr>
        `;
    }).join('');
};

window.updateOrderStatus = async function(id) {
    const newStatus = prompt("Enter new status (pending, processing, shipped, delivered, cancelled):");
    if(!newStatus) return;
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if(!validStatuses.includes(newStatus.toLowerCase())) {
        alert("Invalid status entered.");
        return;
    }

    try {
        if (id.startsWith('ord-')) {
            // Local mock order update
            let localOrders = JSON.parse(localStorage.getItem('vyapark_local_orders') || '[]');
            const idx = localOrders.findIndex(o => o.id === id);
            if (idx > -1) {
                localOrders[idx].status = newStatus.toLowerCase();
                localStorage.setItem('vyapark_local_orders', JSON.stringify(localOrders));
                alert("Local Order Status Updated.");
                loadAdminDashboard();
                return;
            }
        }
        
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus.toLowerCase() })
            .eq('id', id);
            
        if (error) throw error;
        alert("Order Status Updated.");
        loadAdminDashboard();
    } catch(e) {
        alert("Failed to update status: " + e.message);
    }
};

// Search orders logic
document.addEventListener('DOMContentLoaded', () => {
    const orderSearchInput = document.getElementById('order-search');
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            if (window.allOrdersData) {
                const filtered = window.allOrdersData.filter(o => 
                    (o.id && o.id.toLowerCase().includes(term)) || 
                    (o.buyer.full_name && o.buyer.full_name.toLowerCase().includes(term)) ||
                    (o.seller.shop_name && o.seller.shop_name.toLowerCase().includes(term))
                );
                renderAllOrdersTable(filtered);
            }
        });
    }
});
