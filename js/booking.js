// booking.js - mock checkout (no real payment)
const user = getSession();
const area = document.getElementById('bookingArea');
const plan = JSON.parse(localStorage.getItem(KEYS.pending) || 'null');

if (!user) {
  location.href = 'login.html?next=booking.html';
} else if (!plan) {
  area.innerHTML = '<div class="empty-box"><p>No trip selected yet.</p>' +
    '<a href="itinerary.html" class="btn-primary">Build an itinerary first</a></div>';
} else {
  document.getElementById('summary').innerHTML =
    '<h3>Trip summary</h3><p class="summary-dest">' + esc(plan.destTitle) + '</p>' +
    '<p class="summary-meta">' + plan.days + ' days \u00B7 ' + plan.travelers + ' travelers \u00B7 ' +
    dateRange(plan.startDate, plan.days) + '</p>' +
    '<ul class="summary-lines">' +
    '<li><span>Package fare</span><span>' + money(plan.fare) + '</span></li>' +
    '<li><span>Entry tickets (all stops)</span><span>' + money(plan.entry) + '</span></li>' +
    '<li><span>Local transport</span><span>' + money(plan.transport) + '</span></li></ul>' +
    '<div class="summary-total"><span>Total</span><span>' + money(plan.total) + '</span></div>' +
    '<p class="summary-note">Within your ' + money(plan.budget) + ' budget.</p>';

  document.getElementById('name').value = user.name;
  document.getElementById('bemail').value = user.email;

  document.getElementById('bookingForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('bemail').value.trim();
    const notes = document.getElementById('notes').value.trim();
    let phone = document.getElementById('phone').value.replace(/[\s+-]/g, '');
    if (phone.length === 12 && phone.startsWith('91')) phone = phone.slice(2);

    const msg = document.getElementById('bookMsg');
    if (!name || !email) { msg.textContent = 'Please fill in name and email.'; return; }
    if (!/^\d{10}$/.test(phone)) { msg.textContent = 'Enter a valid 10-digit phone number.'; return; }

    const booking = {
      id: 'WP' + Date.now().toString().slice(-6),
      bookedOn: new Date().toISOString(),
      status: 'Confirmed',
      traveler: { name: name, phone: phone, email: email, notes: notes },
      plan: plan
    };
    const list = getUserList('bookings');
    list.push(booking);
    setUserList('bookings', list);
    localStorage.removeItem(KEYS.pending);

    area.innerHTML = '<div class="empty-box"><h3>Booking confirmed!</h3>' +
      '<p>Booking ID: <b>' + booking.id + '</b></p>' +
      '<p>' + esc(plan.destTitle) + ' \u00B7 ' + dateRange(plan.startDate, plan.days) + '</p>' +
      '<p>Total: ' + money(plan.total) + ' (simulated payment)</p>' +
      '<a href="profile.html" class="btn-primary">View My Trips</a></div>';
  });
}
