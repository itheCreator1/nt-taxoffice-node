/**
 * Admin Availability JavaScript
 * Manages office hours and blocked dates
 */

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const logoutBtn = document.getElementById('logoutBtn');
const alertContainer = document.getElementById('alertContainer');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userInitials = document.getElementById('userInitials');
const settingsForm = document.getElementById('settingsForm');
const blockDateForm = document.getElementById('blockDateForm');
const blockDate = document.getElementById('blockDate');
const blockReason = document.getElementById('blockReason');
const blockedDatesList = document.getElementById('blockedDatesList');

const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];

function showAlert(message, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alertContainer.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

function renderDaysForm(days) {
  const container = document.getElementById('daysContainer');
  if (!container) return;

  container.innerHTML = days
    .map(
      (day) => `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <h3 style="font-size:16px;font-weight:600;margin:0;">${dayNames[day.day_of_week]}</h3>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox"
                           class="day-checkbox"
                           data-day="${day.day_of_week}"
                           ${day.is_working_day ? 'checked' : ''}>
                    <span>Εργάσιμη</span>
                </label>
            </div>
            <div class="day-hours" id="hours-${day.day_of_week}" style="display:${day.is_working_day ? 'grid' : 'none'};grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                    <label style="display:block;font-size:14px;margin-bottom:6px;">Ώρα Έναρξης</label>
                    <input type="time"
                           class="form-control day-start"
                           data-day="${day.day_of_week}"
                           value="${day.start_time ? day.start_time.substring(0, 5) : '09:00'}">
                </div>
                <div>
                    <label style="display:block;font-size:14px;margin-bottom:6px;">Ώρα Λήξης</label>
                    <input type="time"
                           class="form-control day-end"
                           data-day="${day.day_of_week}"
                           value="${day.end_time ? day.end_time.substring(0, 5) : '17:00'}">
                </div>
            </div>
        </div>
    `
    )
    .join('');

  // Add event listeners for checkboxes
  document.querySelectorAll('.day-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const { day } = e.target.dataset;
      const hoursDiv = document.getElementById(`hours-${day}`);
      hoursDiv.style.display = e.target.checked ? 'grid' : 'none';
    });
  });
}

async function checkAuth() {
  try {
    const response = await fetch('/api/admin/me');
    const data = await response.json();
    if (!data.success || !data.authenticated) {
      window.location.href = '/admin/login.html';
      return false;
    }
    userName.textContent = data.data.username;
    userEmail.textContent = data.data.email;
    userInitials.textContent = data.data.username.substring(0, 2).toUpperCase();
    return true;
  } catch (error) {
    window.location.href = '/admin/login.html';
    return false;
  }
}

async function loadSettings() {
  try {
    const response = await fetch('/api/admin/availability/settings');
    const data = await response.json();
    if (data.success) {
      const { days } = data.data;
      renderDaysForm(days);
    } else {
      showAlert(data.message || 'Σφάλμα φόρτωσης ρυθμίσεων.', 'error');
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showAlert('Σφάλμα φόρτωσης ρυθμίσεων.', 'error');
  }
}

async function saveSettings(e) {
  e.preventDefault();

  // Collect data from all 7 days
  const days = [];
  for (let i = 0; i < 7; i++) {
    const checkbox = document.querySelector(`.day-checkbox[data-day="${i}"]`);
    const startInput = document.querySelector(`.day-start[data-day="${i}"]`);
    const endInput = document.querySelector(`.day-end[data-day="${i}"]`);

    days.push({
      day_of_week: i,
      is_working_day: checkbox.checked,
      start_time: checkbox.checked ? `${startInput.value}:00` : null,
      end_time: checkbox.checked ? `${endInput.value}:00` : null,
    });
  }

  // Validation: at least one working day
  if (!days.some((d) => d.is_working_day)) {
    showAlert('Επιλέξτε τουλάχιστον μία εργάσιμη ημέρα.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/admin/availability/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    });
    const data = await response.json();
    if (data.success) {
      showAlert('Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς!', 'success');
    } else {
      showAlert(data.message || 'Σφάλμα αποθήκευσης.', 'error');
    }
  } catch (error) {
    showAlert('Σφάλμα σύνδεσης με τον διακομιστή.', 'error');
  }
}

async function loadBlockedDates() {
  try {
    const response = await fetch('/api/admin/availability/blocked-dates');
    const data = await response.json();
    if (data.success) {
      if (data.data.length === 0) {
        blockedDatesList.innerHTML =
          '<p style="color:#6b7280;text-align:center;padding:20px;">Δεν υπάρχουν αποκλεισμένες ημερομηνίες.</p>';
        return;
      }
      blockedDatesList.innerHTML = data.data
        .map((bd) => {
          const dateObj = new Date(bd.blocked_date);
          const formattedDate = dateObj.toLocaleDateString('el-GR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:8px;">
                    <div>
                        <strong>${formattedDate}</strong>
                        ${bd.reason ? `<br><small style="color:#6b7280;">${bd.reason}</small>` : ''}
                    </div>
                    <button class="btn btn-sm btn-danger remove-blocked-date" data-id="${bd.id}">Αφαίρεση</button>
                </div>
                `;
        })
        .join('');
    }
  } catch (error) {
    showAlert('Σφάλμα φόρτωσης αποκλεισμένων ημερομηνιών.', 'error');
  }
}

async function addBlockedDate(e) {
  e.preventDefault();
  if (!blockDate.value) return;
  try {
    const response = await fetch('/api/admin/availability/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocked_date: blockDate.value,
        reason: blockReason.value || null,
      }),
    });
    const data = await response.json();
    if (data.success) {
      showAlert('Η ημερομηνία αποκλείστηκε επιτυχώς!', 'success');
      blockDate.value = '';
      blockReason.value = '';
      await loadBlockedDates();
    } else {
      showAlert(data.message || 'Σφάλμα αποκλεισμού ημερομηνίας.', 'error');
    }
  } catch (error) {
    showAlert('Σφάλμα σύνδεσης με τον διακομιστή.', 'error');
  }
}

async function removeBlockedDate(id) {
  if (!confirm('Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτή την αποκλεισμένη ημερομηνία;')) return;
  try {
    const response = await fetch(`/api/admin/availability/blocked-dates/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (data.success) {
      showAlert('Η ημερομηνία αφαιρέθηκε επιτυχώς!', 'success');
      await loadBlockedDates();
    } else {
      showAlert(data.message || 'Σφάλμα αφαίρεσης.', 'error');
    }
  } catch (error) {
    showAlert('Σφάλμα σύνδεσης με τον διακομιστή.', 'error');
  }
}

// Event delegation for remove blocked date buttons
blockedDatesList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('remove-blocked-date')) {
    const { id } = e.target.dataset;
    await removeBlockedDate(id);
  }
});

sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login.html';
});
settingsForm.addEventListener('submit', saveSettings);
blockDateForm.addEventListener('submit', addBlockedDate);

async function init() {
  if (!(await checkAuth())) return;
  await loadSettings();
  await loadBlockedDates();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
