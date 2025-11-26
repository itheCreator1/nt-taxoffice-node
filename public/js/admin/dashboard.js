/**
 * Admin Dashboard JavaScript
 * Handles all dashboard interactions and data management
 */

// State
let currentPage = 1;
let currentFilters = {};
let appointments = [];
let stats = {};

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const alertContainer = document.getElementById('alertContainer');

// User info
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userInitials = document.getElementById('userInitials');

// Stats
const statPending = document.getElementById('statPending');
const statConfirmed = document.getElementById('statConfirmed');
const statToday = document.getElementById('statToday');
const statMonth = document.getElementById('statMonth');

// Filters
const filterStatus = document.getElementById('filterStatus');
const filterStartDate = document.getElementById('filterStartDate');
const filterEndDate = document.getElementById('filterEndDate');
const searchInput = document.getElementById('searchInput');
const applyFiltersBtn = document.getElementById('applyFilters');
const clearFiltersBtn = document.getElementById('clearFilters');

// Table
const loadingOverlay = document.getElementById('loadingOverlay');
const appointmentsTableBody = document.getElementById('appointmentsTableBody');
const paginationInfo = document.getElementById('paginationInfo');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');

// Modals
const detailsModal = document.getElementById('detailsModal');
const closeDetailsModal = document.getElementById('closeDetailsModal');
const detailsModalBody = document.getElementById('detailsModalBody');

const statusModal = document.getElementById('statusModal');
const closeStatusModal = document.getElementById('closeStatusModal');
const statusForm = document.getElementById('statusForm');
const statusAppointmentId = document.getElementById('statusAppointmentId');
const newStatus = document.getElementById('newStatus');
const declineReason = document.getElementById('declineReason');
const declineReasonGroup = document.getElementById('declineReasonGroup');
const cancelStatusChange = document.getElementById('cancelStatusChange');

const deleteModal = document.getElementById('deleteModal');
const closeDeleteModal = document.getElementById('closeDeleteModal');
const deleteAppointmentId = document.getElementById('deleteAppointmentId');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

/**
 * Show loading overlay
 */
function showLoading() {
    loadingOverlay.classList.add('show');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    loadingOverlay.classList.remove('show');
}

/**
 * Check authentication
 */
async function checkAuth() {
    try {
        const response = await fetch('/api/admin/me');
        const data = await response.json();

        if (!data.success || !data.authenticated) {
            window.location.href = '/admin/login.html';
            return false;
        }

        // Update user info
        userName.textContent = data.data.username;
        userEmail.textContent = data.data.email;

        // Generate initials
        const initials = data.data.username
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        userInitials.textContent = initials;

        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/admin/login.html';
        return false;
    }
}

/**
 * Load statistics
 */
async function loadStats() {
    try {
        const response = await fetch('/api/admin/appointments/stats');
        const data = await response.json();

        if (data.success) {
            stats = data.data;

            // Update stat cards
            statPending.textContent = stats.statusCounts.pending || 0;
            statConfirmed.textContent = stats.statusCounts.confirmed || 0;
            statToday.textContent = stats.todayCount || 0;
            statMonth.textContent = stats.monthCount || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load appointments
 */
async function loadAppointments() {
    showLoading();

    try {
        // Build query string
        const params = new URLSearchParams({
            page: currentPage,
            limit: 50,
            ...currentFilters
        });

        const response = await fetch(`/api/admin/appointments?${params}`);
        const data = await response.json();

        if (data.success) {
            appointments = data.data.appointments;
            renderAppointmentsTable();
            updatePagination(data.data.pagination);
        } else {
            showAlert(data.message || 'Σφάλμα φόρτωσης ραντεβού.', 'error');
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        showAlert('Σφάλμα σύνδεσης με τον διακομιστή.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Render appointments table
 */
function renderAppointmentsTable() {
    if (appointments.length === 0) {
        appointmentsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Δεν βρέθηκαν ραντεβού.</td>
            </tr>
        `;
        return;
    }

    appointmentsTableBody.innerHTML = appointments.map(apt => `
        <tr>
            <td>${formatDate(apt.appointment_date)}</td>
            <td>${formatTime(apt.appointment_time)}</td>
            <td>${escapeHtml(apt.client_name)}</td>
            <td>
                <div>${escapeHtml(apt.client_email)}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(apt.client_phone)}</div>
            </td>
            <td>${escapeHtml(apt.service_type)}</td>
            <td><span class="status-badge status-${apt.status}">${getStatusLabel(apt.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" onclick="viewAppointment(${apt.id})" title="Προβολή">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    ${apt.status !== 'cancelled' ? `
                    <button class="action-btn status-btn" onclick="openStatusModal(${apt.id})" title="Αλλαγή κατάστασης">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>
                    ` : ''}
                    <button class="action-btn delete-btn" onclick="openDeleteModal(${apt.id})" title="Διαγραφή">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Update pagination
 */
function updatePagination(pagination) {
    paginationInfo.textContent = `Σελίδα ${pagination.page} από ${pagination.totalPages}`;

    prevPageBtn.disabled = pagination.page === 1;
    nextPageBtn.disabled = pagination.page === pagination.totalPages;
}

/**
 * View appointment details
 */
window.viewAppointment = async function(id) {
    try {
        const response = await fetch(`/api/admin/appointments/${id}`);
        const data = await response.json();

        if (data.success) {
            const apt = data.data.appointment;
            const history = data.data.history;

            detailsModalBody.innerHTML = `
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Πελάτης</div>
                        <div class="detail-value">${escapeHtml(apt.client_name)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Email</div>
                        <div class="detail-value">${escapeHtml(apt.client_email)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Τηλέφωνο</div>
                        <div class="detail-value">${escapeHtml(apt.client_phone)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Κατάσταση</div>
                        <div class="detail-value">
                            <span class="status-badge status-${apt.status}">${getStatusLabel(apt.status)}</span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Ημερομηνία</div>
                        <div class="detail-value">${formatDate(apt.appointment_date)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Ώρα</div>
                        <div class="detail-value">${formatTime(apt.appointment_time)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Υπηρεσία</div>
                        <div class="detail-value">${escapeHtml(apt.service_type)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Δημιουργήθηκε</div>
                        <div class="detail-value">${formatDateTime(apt.created_at)}</div>
                    </div>
                </div>

                ${apt.notes ? `
                <div class="detail-section">
                    <h3>Σημειώσεις</h3>
                    <p style="white-space: pre-wrap;">${escapeHtml(apt.notes)}</p>
                </div>
                ` : ''}

                ${apt.decline_reason ? `
                <div class="detail-section">
                    <h3>Λόγος Απόρριψης</h3>
                    <p style="white-space: pre-wrap;">${escapeHtml(apt.decline_reason)}</p>
                </div>
                ` : ''}

                ${history.length > 0 ? `
                <div class="detail-section">
                    <h3>Ιστορικό Αλλαγών</h3>
                    <div class="history-timeline">
                        ${history.map(h => `
                            <div class="history-item">
                                <div class="history-icon" style="background: var(--${getStatusColor(h.new_status)}-light); color: var(--${getStatusColor(h.new_status)}-color);">
                                    ${h.new_status[0].toUpperCase()}
                                </div>
                                <div class="history-content">
                                    <div class="history-action">
                                        ${getStatusLabel(h.old_status)} → ${getStatusLabel(h.new_status)}
                                    </div>
                                    <div class="history-meta">
                                        ${formatDateTime(h.changed_at)} • ${h.changed_by}
                                        ${h.notes ? ` • ${escapeHtml(h.notes)}` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            `;

            detailsModal.classList.add('show');
        } else {
            showAlert(data.message || 'Σφάλμα φόρτωσης λεπτομερειών.', 'error');
        }
    } catch (error) {
        console.error('Error loading appointment details:', error);
        showAlert('Σφάλμα σύνδεσης με τον διακομιστή.', 'error');
    }
};

/**
 * Open status change modal
 */
window.openStatusModal = function(id) {
    statusAppointmentId.value = id;
    newStatus.value = '';
    declineReason.value = '';
    declineReasonGroup.style.display = 'none';
    statusModal.classList.add('show');
};

/**
 * Handle status form submission
 */
statusForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = statusAppointmentId.value;
    const status = newStatus.value;
    const reason = declineReason.value;

    if (!status) {
        showAlert('Παρακαλώ επιλέξτε κατάσταση.', 'error');
        return;
    }

    if (status === 'declined' && !reason.trim()) {
        showAlert('Παρακαλώ εισάγετε λόγο απόρριψης.', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/admin/appointments/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status,
                decline_reason: status === 'declined' ? reason : null
            })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Η κατάσταση ενημερώθηκε επιτυχώς!', 'success');
            statusModal.classList.remove('show');
            await loadStats();
            await loadAppointments();
        } else {
            showAlert(data.message || 'Σφάλμα ενημέρωσης κατάστασης.', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showAlert('Σφάλμα σύνδεσης με τον διακομιστή.', 'error');
    }
});

/**
 * Open delete modal
 */
window.openDeleteModal = function(id) {
    deleteAppointmentId.value = id;
    deleteModal.classList.add('show');
};

/**
 * Handle delete confirmation
 */
confirmDelete.addEventListener('click', async () => {
    const id = deleteAppointmentId.value;

    try {
        const response = await fetch(`/api/admin/appointments/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Το ραντεβού διαγράφηκε επιτυχώς!', 'success');
            deleteModal.classList.remove('show');
            await loadStats();
            await loadAppointments();
        } else {
            showAlert(data.message || 'Σφάλμα διαγραφής ραντεβού.', 'error');
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        showAlert('Σφάλμα σύνδεσης με τον διακομιστή.', 'error');
    }
});

/**
 * Apply filters
 */
function applyFilters() {
    currentFilters = {};

    if (filterStatus.value) {
        currentFilters.status = filterStatus.value;
    }
    if (filterStartDate.value) {
        currentFilters.startDate = filterStartDate.value;
    }
    if (filterEndDate.value) {
        currentFilters.endDate = filterEndDate.value;
    }
    if (searchInput.value.trim()) {
        currentFilters.search = searchInput.value.trim();
    }

    currentPage = 1;
    loadAppointments();
}

/**
 * Clear filters
 */
function clearFilters() {
    filterStatus.value = '';
    filterStartDate.value = '';
    filterEndDate.value = '';
    searchInput.value = '';
    currentFilters = {};
    currentPage = 1;
    loadAppointments();
}

/**
 * Utility functions
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('el-GR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    return timeString.substring(0, 5);
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('el-GR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusLabel(status) {
    const labels = {
        pending: 'Εκκρεμής',
        confirmed: 'Επιβεβαιωμένο',
        declined: 'Απορριφθέν',
        completed: 'Ολοκληρωμένο',
        cancelled: 'Ακυρωμένο'
    };
    return labels[status] || status;
}

function getStatusColor(status) {
    const colors = {
        pending: 'warning',
        confirmed: 'success',
        declined: 'danger',
        completed: 'info',
        cancelled: 'secondary'
    };
    return colors[status] || 'secondary';
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Event listeners
 */
// Sidebar toggle
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/admin/login.html';
    }
});

// Refresh
refreshBtn.addEventListener('click', async () => {
    await loadStats();
    await loadAppointments();
});

// Filters
applyFiltersBtn.addEventListener('click', applyFilters);
clearFiltersBtn.addEventListener('click', clearFilters);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        applyFilters();
    }
});

// Pagination
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadAppointments();
    }
});

nextPageBtn.addEventListener('click', () => {
    currentPage++;
    loadAppointments();
});

// Modal close handlers
closeDetailsModal.addEventListener('click', () => {
    detailsModal.classList.remove('show');
});

closeStatusModal.addEventListener('click', () => {
    statusModal.classList.remove('show');
});

cancelStatusChange.addEventListener('click', () => {
    statusModal.classList.remove('show');
});

closeDeleteModal.addEventListener('click', () => {
    deleteModal.classList.remove('show');
});

cancelDelete.addEventListener('click', () => {
    deleteModal.classList.remove('show');
});

// Show/hide decline reason based on status selection
newStatus.addEventListener('change', (e) => {
    if (e.target.value === 'declined') {
        declineReasonGroup.style.display = 'block';
        declineReason.required = true;
    } else {
        declineReasonGroup.style.display = 'none';
        declineReason.required = false;
    }
});

// Close modals on backdrop click
[detailsModal, statusModal, deleteModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

/**
 * Initialize dashboard
 */
async function init() {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    await loadStats();
    await loadAppointments();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
