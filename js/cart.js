let currentTotal = 2197;
const ITEM_TOTAL = 2297;
const DISCOUNT = 100;
const DELIVERY_FEE = 40;

function updateQty(btn, change) {
    const valSpan = btn.parentElement.querySelector('.qty-val');
    let val = parseInt(valSpan.innerText) + change;
    if(val < 1) val = 1;
    valSpan.innerText = val;
    // Real app would recalculate prices here
}

function setDelivery(type) {
    const addressBox = document.getElementById('address-box');
    const payAtShop = document.getElementById('pay-at-shop');
    const cod = document.getElementById('cash-on-delivery');
    const deliveryFeeRow = document.getElementById('delivery-fee-row');
    const grandTotal = document.getElementById('grand-total');
    const bottomTotal = document.getElementById('bottom-total');

    if (type === 'home') {
        addressBox.classList.remove('hidden');
        payAtShop.classList.add('hidden');
        cod.classList.remove('hidden');
        
        // Add delivery fee
        deliveryFeeRow.style.display = 'flex';
        currentTotal = ITEM_TOTAL - DISCOUNT + DELIVERY_FEE;
        
        // Auto select online if pay at shop was selected
        if (document.querySelector('input[name="payment"]:checked').value === 'shop') {
            document.querySelector('input[value="online"]').checked = true;
        }
    } else {
        addressBox.classList.add('hidden');
        payAtShop.classList.remove('hidden');
        cod.classList.add('hidden');
        
        // Remove delivery fee
        deliveryFeeRow.style.display = 'none';
        currentTotal = ITEM_TOTAL - DISCOUNT;
        
        // Auto select shop if cod was selected
        if (document.querySelector('input[name="payment"]:checked').value === 'cod') {
            document.querySelector('input[value="online"]').checked = true;
        }
    }

    grandTotal.innerText = `₹${currentTotal}`;
    bottomTotal.innerText = `₹${currentTotal}`;
}

function placeOrder() {
    const deliveryMethod = document.querySelector('input[name="delivery"]:checked').value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    const modal = document.getElementById('success-modal');
    const msg = document.getElementById('success-msg');
    const dirBtn = document.getElementById('direction-btn');
    
    if (deliveryMethod === 'pickup') {
        if (paymentMethod === 'shop') {
            msg.innerText = "Please visit the shop to collect your items and make the payment via Cash or QR.";
        } else {
            msg.innerText = "Payment Successful! Please visit the shop to collect your items.";
        }
        dirBtn.style.display = 'block';
    } else {
        if (paymentMethod === 'cod') {
            msg.innerText = "Order confirmed. Please keep exact change ready at the time of delivery.";
        } else {
            msg.innerText = "Payment Successful! Your order will be delivered shortly.";
        }
        dirBtn.style.display = 'none';
    }
    
    modal.classList.remove('hidden');
}
