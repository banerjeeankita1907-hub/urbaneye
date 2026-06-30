let map, userMarker, currentUser = null;

// Base API URL (empty if same origin)
const API_BASE = '';

function initMap(lat = 20.5937, lng = 78.9629) {
  map = L.map('map').setView([lat, lng], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  map.on('click', onMapClick);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      map.setView([pos.coords.latitude, pos.coords.longitude], 13);
    });
  }
  loadIssues();
}

function onMapClick(e) {
  if (!currentUser) return alert('Please log in to select a location.');
  document.getElementById('latitude').value = e.latlng.lat;
  document.getElementById('longitude').value = e.latlng.lng;
  if (userMarker) map.removeLayer(userMarker);
  userMarker = L.marker(e.latlng).addTo(map).bindPopup('Issue location').openPopup();
}

async function loadIssues() {
  const res = await fetch('/api/issues');
  const issues = await res.json();
  map.eachLayer(layer => { if (layer instanceof L.Marker || layer instanceof L.CircleMarker) map.removeLayer(layer); });
  issues.forEach(iss => {
    const color = iss.severity === 'high' ? 'red' : iss.severity === 'medium' ? 'orange' : 'green';
    L.circleMarker([iss.latitude, iss.longitude], { radius: 8, color, fillOpacity: 0.8 }).addTo(map)
      .bindPopup(`<b>${iss.category}</b><br>${iss.description}<br><i>${iss.severity} priority</i>`);
  });
  renderIssueList(issues);
}

function renderIssueList(issues) {
  const list = document.getElementById('issueList');
  list.innerHTML = issues.slice(0, 10).map(iss => `
    <li class="list-group-item severity-${iss.severity}">
      <strong>${iss.category}</strong><br>
      <small>${iss.description.substring(0, 60)}...</small>
      <span class="badge bg-${iss.severity === 'high' ? 'danger' : iss.severity === 'medium' ? 'warning' : 'success'} float-end">${iss.severity}</span>
    </li>`).join('');
}

// Photo to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

document.getElementById('issueForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const desc = document.getElementById('desc').value;
  const category = document.getElementById('category').value;
  const lat = document.getElementById('latitude').value;
  const lng = document.getElementById('longitude').value;
  const photoFile = document.getElementById('photo').files[0];
  let photoBase64 = null;
  if (photoFile) photoBase64 = await fileToBase64(photoFile);

  const token = localStorage.getItem('token');
  const res = await fetch('/api/issues', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ description: desc, category, latitude: lat, longitude: lng, photo: photoBase64 })
  });
  if (res.ok) {
    alert('Issue reported successfully!');
    document.getElementById('issueForm').reset();
    if (userMarker) map.removeLayer(userMarker);
    loadIssues();
  } else {
    const err = await res.json();
    alert(err.error || 'Error reporting issue');
  }
});

// Auth UI
function updateNav() {
  if (currentUser) {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('registerBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    document.getElementById('reportLoginMsg').style.display = 'none';
    document.getElementById('issueForm').style.display = 'block';
    if (currentUser.role === 'admin') document.getElementById('dashboardLink').style.display = 'inline-block';
  } else {
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('registerBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('dashboardLink').style.display = 'none';
    document.getElementById('reportLoginMsg').style.display = 'block';
    document.getElementById('issueForm').style.display = 'none';
  }
}

function showAuthModal(type) {
  document.getElementById('authModalTitle').textContent = type === 'login' ? 'Login' : 'Register';
  document.getElementById('authModalBody').innerHTML = type === 'login' ? `
    <form id="authForm">
      <input type="email" id="email" class="form-control mb-2" placeholder="Email" required>
      <input type="password" id="password" class="form-control mb-2" placeholder="Password" required>
      <button type="submit" class="btn btn-primary w-100">Login</button>
    </form>` : `
    <form id="authForm">
      <input type="text" id="name" class="form-control mb-2" placeholder="Full Name" required>
      <input type="email" id="email" class="form-control mb-2" placeholder="Email" required>
      <input type="password" id="password" class="form-control mb-2" placeholder="Password" required>
      <button type="submit" class="btn btn-success w-100">Register</button>
    </form>`;
  const modal = new bootstrap.Modal(document.getElementById('authModal'));
  modal.show();
  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('name')?.value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    };
    const endpoint = type === 'login' ? '/api/login' : '/api/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      if (type === 'login') {
        localStorage.setItem('token', result.token);
        currentUser = result.user;
        updateNav();
        modal.hide();
      } else {
        alert('Registration successful! Please login.');
        modal.hide();
      }
    } else {
      alert(result.error || 'Error');
    }
  });
}

document.getElementById('loginBtn').addEventListener('click', () => showAuthModal('login'));
document.getElementById('registerBtn').addEventListener('click', () => showAuthModal('register'));
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  currentUser = null;
  updateNav();
  loadIssues();
});

// Check token on load
const token = localStorage.getItem('token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    currentUser = { id: payload.id, email: payload.email, role: payload.role };
    updateNav();
  } catch(e) {}
}

window.onload = initMap;
