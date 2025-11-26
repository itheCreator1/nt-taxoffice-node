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
const officeHoursStart = document.getElementById('officeHoursStart');
const officeHoursEnd = document.getElementById('officeHoursEnd');
const slotDuration = document.getElementById('slotDuration');
const blockDateForm = document.getElementById('blockDateForm');
const blockDate = document.getElementById('blockDate');
const blockReason = document.getElementById('blockReason');
const blockedDatesList = document.getElementById('blockedDatesList');

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
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
            const settings = data.data;
            officeHoursStart.value = settings.office_hours_start.substring(0, 5);
            officeHoursEnd.value = settings.office_hours_end.substring(0, 5);
            slotDuration.value = settings.slot_duration;
            const days = settings.working_days.split(',');
            document.querySelectorAll('input[name="workingDays"]').forEach(checkbox => {
                checkbox.checked = days.includes(checkbox.value);
            });
        }
    } catch (error) {
        showAlert('Σφάλμα φόρτωσης ρυθμίσεων.', 'error');
    }
}

async function saveSettings(e) {
    e.preventDefault();
    const workingDays = Array.from(document.querySelectorAll('input[name="workingDays"]:checked')).map(cb => cb.value);
    if (workingDays.length === 0) {
        showAlert('Επιλέξτε τουλάχιστον μία ημέρα λειτουργίας.', 'error');
        return;
    }
    try {
        const response = await fetch('/api/admin/availability/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                office_hours_start: officeHoursStart.value + ':00',
                office_hours_end: officeHoursEnd.value + ':00',
                slot_duration: parseInt(slotDuration.value),
                working_days: workingDays.join(',')
            })
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
                blockedDatesList.innerHTML = '<p style="color:#6b7280;text-align:center;padding:20px;">Δεν υπάρχουν αποκλεισμένες ημερομηνίες.</p>';
                return;
            }
            blockedDatesList.innerHTML = data.data.map(bd => {
                const dateObj = new Date(bd.blocked_date);
                const formattedDate = dateObj.toLocaleDateString('el-GR', { year: 'numeric', month: 'long', day: 'numeric' });
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:8px;">
                    <div>
                        <strong>${formattedDate}</strong>
                        ${bd.reason ? '<br><small style="color:#6b7280;">' + bd.reason + '</small>' : ''}
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="removeBlockedDate(${bd.id})">Αφαίρεση</button>
                </div>
                `;
            }).join('');
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
                reason: blockReason.value || null
            })
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

window.removeBlockedDate = async function(id) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτή την αποκλεισμένη ημερομηνία;')) return;
    try {
        const response = await fetch('/api/admin/availability/blocked-dates/' + id, { method: 'DELETE' });
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
};

sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
logoutBtn.addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
});
settingsForm.addEventListener('submit', saveSettings);
blockDateForm.addEventListener('submit', addBlockedDate);

async function init() {
    if (!await checkAuth()) return;
    await loadSettings();
    await loadBlockedDates();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
