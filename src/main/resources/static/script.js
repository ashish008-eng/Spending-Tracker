// Global variables
let editingExpenseId = null;
const API_BASE_URL = "https://spending-tracker-ha0d.onrender.com";
//const jwtToken = localStorage.getItem('jwtToken');
let allExpensesData = []; // Store all expenses for monthly reports

/////////////////////////////////////////////////////////////////////////////////
const API_BASE_URL = "https://spending-tracker-ha0d.onrender.com";

// ✅ FIX
function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

//////////////////////////////////////////////////////////////
// Toggle password visibility
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Category icons mapping
const categoryIcons = {
    'Food': '🍔',
    'Transport': '🚗',
    'Entertainment': '🎬',
    'Utilities': '💡',
    'Shopping': '🛍️',
    'Healthcare': '🏥',
    'Education': '📚',
    'Travel': '✈️',
    'Other': '📦'
};

// Get category icon
function getCategoryIcon(category) {
    return categoryIcons[category] || '📦';
}

// Check if user is authenticated
//function checkAuth() {
//    if (!jwtToken) {
//        window.location.href = 'index.html';
//        return false;
//    }
//    return true;
//}

function checkAuth() {
    const token = getAuthToken();

    if (!token) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Format currency (Indian Rupees)
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);
}

// Format currency for PDF (avoids Unicode issues with ₹ symbol in jsPDF)
function formatCurrencyForPDF(amount) {
    // Format number with Indian numbering system (lakhs and crores)
    const formattedNumber = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
    return 'Rs. ' + formattedNumber;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Get JWT token from localStorage
function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

// API helper functions
//async function apiRequest(url, options = {}) {
//
//    const token = getAuthToken();
//   // const token = getAuthToken();
//
//    const defaultOptions = {
//        headers: {
//            'Content-Type': 'application/json',
//            'Authorization': `Bearer ${token}`,
//            ...options.headers
//        }
//    };

async function apiRequest(url, options = {}) {
    const token = getAuthToken(); // ✅ dynamic

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // ✅ FIX
        }
    });

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('jwtToken');
            window.location.href = 'index.html';
            throw new Error('Authentication failed');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
}

// Fetch all expenses
async function fetchExpenses() {
    try {
        const expenses = await apiRequest(`${API_BASE_URL}/expense`);
        displayExpenses(expenses);
        updateStats(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        document.getElementById('expenseList').innerHTML = `
            <div class="error-message">
                <p>Failed to load expenses. Please try again.</p>
                <button onclick="fetchExpenses()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }
}

// Display expenses in the list
function displayExpenses(expenses) {
    const expenseList = document.getElementById('expenseList');
    
    if (expenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-receipt"></i>
                </div>
                <p>No expenses found. Add your first expense above!</p>
            </div>
        `;
        return;
    }

    expenseList.innerHTML = expenses.map(expense => {
        const expenseId = expense.id || expense._id;
        const category = expense.category || 'Other';
        const title = expense.title || 'No description';
        const icon = getCategoryIcon(category);
        
        return `
            <div class="expense-item" data-id="${expenseId}">
                <div class="expense-icon">${icon}</div>
                <div class="expense-info">
                    <h3>${escapeHtml(title)}</h3>
                    <div class="expense-meta">
                        <span class="expense-category">
                            <span class="category-badge category-${category.toLowerCase()}">${icon} ${escapeHtml(category)}</span>
                        </span>
                        <span class="expense-date">
                            <i class="far fa-calendar"></i>
                            ${formatDate(expense.date)}
                        </span>
                    </div>
                </div>
                <div class="expense-actions">
                    <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                    <div class="expense-buttons">
                        <button onclick="editExpense('${expenseId}')" class="btn btn-icon btn-edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteExpense('${expenseId}')" class="btn btn-icon btn-delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats(expenses) {
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const avgAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;
    
    document.getElementById('totalExpenses').textContent = totalExpenses;
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
    document.getElementById('avgExpense').textContent = formatCurrency(avgAmount);
    
    // Update chart
    updateChart(expenses);
}

// Update chart with expense data
function updateChart(expenses) {
    const svg = document.getElementById('donutChart');
    const centerLabel = document.getElementById('centerLabel');
    const legendContainer = document.getElementById('chartLegend');
    
    if (!svg || !centerLabel || !legendContainer) return;
    
    // Calculate category totals
    const categoryTotals = {};
    const categoryCounts = {};
    const categoryExpenses = {}; // Store individual expenses per category
    
    expenses.forEach(expense => {
        const category = expense.category || 'Other';
        const amount = parseFloat(expense.amount);
        
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
            categoryCounts[category] = 0;
            categoryExpenses[category] = [];
        }
        
        categoryTotals[category] += amount;
        categoryCounts[category]++;
        categoryExpenses[category].push({
            title: expense.title,
            amount: amount
        });
    });
    
    // Prepare data
    const categories = Object.keys(categoryTotals);
    const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    // Colors for categories
    const colors = [
        '#ef4444', // Food - Red
        '#3b82f6', // Transport - Blue
        '#a855f7', // Entertainment - Purple
        '#f59e0b', // Utilities - Orange
        '#10b981', // Shopping - Green
        '#f43f5e', // Healthcare - Pink
        '#06b6d4', // Education - Cyan
        '#84cc16', // Travel - Lime
        '#64748b'  // Other - Gray
    ];
    
    // Update center text
    centerLabel.textContent = totalExpenses;
    
    // Clear existing chart segments
    const existingSegments = svg.querySelectorAll('.chart-segment');
    existingSegments.forEach(segment => segment.remove());
    
    // Draw donut chart
    const centerX = 100;
    const centerY = 100;
    const outerRadius = 80;
    const innerRadius = 50;
    const circumference = 2 * Math.PI * outerRadius;
    
    let startAngle = -Math.PI / 2;
    
    categories.forEach((category, index) => {
        const amount = categoryTotals[category];
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        const endAngle = startAngle + (percentage / 100) * (Math.PI * 2);
        
        // Calculate arc path
        const startX = centerX + outerRadius * Math.cos(startAngle);
        const startY = centerY + outerRadius * Math.sin(startAngle);
        const endX = centerX + outerRadius * Math.cos(endAngle);
        const endY = centerY + outerRadius * Math.sin(endAngle);
        
        // Large arc flag
        const largeArcFlag = percentage > 50 ? 1 : 0;
        
        // Create outer arc path
        const outerArcPath = `M ${startX} ${startY} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY} L ${centerX} ${centerY} Z`;
        
        // Create inner arc path (for donut effect)
        const innerStartX = centerX + innerRadius * Math.cos(startAngle);
        const innerStartY = centerY + innerRadius * Math.sin(startAngle);
        const innerEndX = centerX + innerRadius * Math.cos(endAngle);
        const innerEndY = centerY + innerRadius * Math.sin(endAngle);
        
        const innerArcPath = `M ${innerEndX} ${innerEndY} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY} Z`;
        
        // Create segment group
        const segmentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        segmentGroup.className = 'chart-segment';
        
        // Create outer arc
        const outerArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        outerArc.setAttribute('d', outerArcPath);
        outerArc.setAttribute('fill', colors[index % colors.length]);
        outerArc.setAttribute('stroke', 'white');
        outerArc.setAttribute('stroke-width', '2');
        
        // Create inner arc
        const innerArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        innerArc.setAttribute('d', innerArcPath);
        innerArc.setAttribute('fill', 'white');
        
        segmentGroup.appendChild(outerArc);
        segmentGroup.appendChild(innerArc);
        svg.appendChild(segmentGroup);
        
        startAngle = endAngle;
    });
    
    // Update legend
    legendContainer.innerHTML = '';
    
    categories.forEach((category, index) => {
        const amount = categoryTotals[category];
        const count = categoryCounts[category];
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${colors[index % colors.length]}"></div>
            <div class="legend-label">${getCategoryIcon(category)} ${category}</div>
            <div class="legend-value">${formatCurrency(amount)}</div>
            <div class="legend-percent">${percentage.toFixed(1)}%</div>
        `;
        legendContainer.appendChild(legendItem);
    });
    
    // If no data, show empty state
    if (categories.length === 0) {
        legendContainer.innerHTML = '<div class="no-data">No expenses to display</div>';
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add or update expense
async function saveExpense(expenseData) {
    try {
        const url = editingExpenseId 
            ? `${API_BASE_URL}/expense/${editingExpenseId}`
            : `${API_BASE_URL}/expense`;
        
        const method = editingExpenseId ? 'PUT' : 'POST';
        
        console.log('Saving expense:', expenseData);
        console.log('URL:', url);
        console.log('Method:', method);
        
        const response = await apiRequest(url, {
            method: method,
            body: JSON.stringify(expenseData)
        });
        
        console.log('Response:', response);
        
        // Reset form and refresh list
        resetForm();
        fetchExpenses();
        
        // Show success message
        showMessage('Expense saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving expense:', error);
        showMessage('Failed to save expense. Please try again.', 'error');
    }
}

// Edit expense function
function editExpense(id) {
    // Find the expense in the current list
    const expenseItems = document.querySelectorAll('.expense-item');
    let expenseData = null;
    
    for (const item of expenseItems) {
        if (item.dataset.id === id) {
            // Extract data from the DOM
            const descriptionEl = item.querySelector('h3');
            const categoryEl = item.querySelector('.category-badge');
            const amountEl = item.querySelector('.expense-amount');
            const dateEl = item.querySelector('.expense-date');
            
            if (descriptionEl && categoryEl && amountEl && dateEl) {
                // Parse amount - remove currency symbol (₹, $, etc.) and commas
                const amountText = amountEl.textContent.replace(/[^\d.-]/g, '');
                expenseData = {
                    id: id,
                    title: descriptionEl.textContent,
                    category: categoryEl.textContent.replace(/^[^\s]+\s+/, ''), // Remove emoji and space
                    amount: parseFloat(amountText),
                    date: dateEl.textContent.replace(/[^\w\s/-]/g, '').trim()
                };
            }
            break;
        }
    }
    
    if (expenseData) {
        // Set editing mode
        editingExpenseId = id;
        document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Expense';
        document.getElementById('cancelEditBtn').style.display = 'inline-block';
        
        // Populate form
        document.getElementById('description').value = expenseData.title;
        document.getElementById('amount').value = expenseData.amount;
        document.getElementById('category').value = expenseData.category;
        
        // Convert date format for input
        const date = new Date(expenseData.date);
        if (!isNaN(date.getTime())) {
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('date').value = formattedDate;
        }
        
        // Scroll to form
        document.getElementById('expenseForm').scrollIntoView({ behavior: 'smooth' });
        
        // Highlight the form
        const formCard = document.querySelector('.form-card');
        formCard.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            formCard.style.animation = '';
        }, 500);
    }
}

// Delete expense function
async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        await fetch(`${API_BASE_URL}/expense/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        // Refresh the list
        fetchExpenses();
        showMessage('Expense deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting expense:', error);
        showMessage('Failed to delete expense. Please try again.', 'error');
    }
}

// Reset form to add mode
function resetForm() {
    editingExpenseId = null;
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Expense';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('expenseForm').reset();
}

// Show message to user
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Only run dashboard code on dashboard page
    if (!window.location.pathname.includes('dashboard.html')) {
        return;
    }
    
    // Mobile menu toggle functionality
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuToggle && sidebar) {
        // Toggle sidebar on menu button click
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('active');
            }
        });
        
        // Close sidebar when clicking overlay
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', function() {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
            });
        }
        
        // Close sidebar when clicking nav item on mobile
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                if (window.innerWidth < 768) {
                    sidebar.classList.remove('open');
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.remove('active');
                    }
                }
            });
        });
    }
    
    // Set current date in headers
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDateEl = document.getElementById('currentDate');
    const expensesDateEl = document.getElementById('expensesDate');
    
    if (currentDateEl) {
        currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
    if (expensesDateEl) {
        expensesDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
    
    // Set default date to today
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) {
        dateInput.value = now.toISOString().split('T')[0];
    }
    
    // Display user's name in welcome message
    const welcomeMessageEl = document.getElementById('welcomeMessage');
    const username = localStorage.getItem('username');
    if (welcomeMessageEl && username) {
        welcomeMessageEl.textContent = `Welcome, ${username}!`;
    }
    
    // Check authentication
    if (!checkAuth()) return;
    
    // Fetch expenses on load
    fetchExpenses();
    
    // Sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const sectionId = this.getAttribute('data-section');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide sections
            sections.forEach(section => {
                if (section.id === sectionId + '-section') {
                    section.classList.add('active');
                    // Fetch expenses for expenses section
                    if (sectionId === 'expenses') {
                        fetchAllExpenses();
                    }
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
    
    // Form submission
    document.getElementById('expenseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const expenseData = {
            title: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            date: formData.get('date')
        };
        
        // Validate form
        if (!expenseData.title || !expenseData.amount || !expenseData.category || !expenseData.date) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }
        
        if (expenseData.amount <= 0) {
            showMessage('Amount must be greater than 0.', 'error');
            return;
        }
        
        saveExpense(expenseData);
    });
    
    // Cancel edit button
    document.getElementById('cancelEditBtn').addEventListener('click', resetForm);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('jwtToken');
        window.location.href = 'index.html';
    });
    
    // Category filter for dashboard
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const filter = this.value;
            const expenseItems = document.querySelectorAll('.expense-item');
            
            expenseItems.forEach(item => {
                const categoryBadge = item.querySelector('.category-badge');
                if (categoryBadge) {
                    const itemCategory = categoryBadge.textContent.replace(/^[^\s]+\s+/, '');
                    if (filter === '' || itemCategory === filter) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    }
    
    // Category filter for expenses section
    const allExpensesFilter = document.getElementById('allExpensesFilter');
    if (allExpensesFilter) {
        allExpensesFilter.addEventListener('change', function() {
            const filter = this.value;
            const expenseItems = document.querySelectorAll('#allExpensesList .expense-item');
            
            expenseItems.forEach(item => {
                const categoryBadge = item.querySelector('.category-badge');
                if (categoryBadge) {
                    const itemCategory = categoryBadge.textContent.replace(/^[^\s]+\s+/, '');
                    if (filter === '' || itemCategory === filter) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    }
});

// Function to fetch all expenses for expenses section
async function fetchAllExpenses() {
    try {
        const expenses = await apiRequest(`${API_BASE_URL}/expense`);
        displayAllExpenses(expenses);
    } catch (error) {
        console.error('Error fetching all expenses:', error);
        document.getElementById('allExpensesList').innerHTML = `
            <div class="error-message">
                <p>Failed to load expenses. Please try again.</p>
                <button onclick="fetchAllExpenses()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }
}

// Display all expenses in the expenses section
function displayAllExpenses(expenses) {
    const expenseList = document.getElementById('allExpensesList');
    
    if (expenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-receipt"></i>
                </div>
                <p>No expenses found.</p>
            </div>
        `;
        return;
    }

    expenseList.innerHTML = expenses.map(expense => {
        const expenseId = expense.id || expense._id;
        const category = expense.category || 'Other';
        const icon = getCategoryIcon(category);
        return `
            <div class="expense-item" data-id="${expenseId}">
                <div class="expense-icon">${icon}</div>
                <div class="expense-info">
                    <h3>${escapeHtml(expense.title || 'No description')}</h3>
                    <div class="expense-meta">
                        <span class="expense-category">
                            <span class="category-badge category-${category.toLowerCase()}">${icon} ${escapeHtml(category)}</span>
                        </span>
                        <span class="expense-date">
                            <i class="far fa-calendar"></i>
                            ${formatDate(expense.date)}
                        </span>
                    </div>
                </div>
                <div class="expense-actions">
                    <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                    <div class="expense-buttons">
                        <button onclick="editExpense('${expenseId}')" class="btn btn-icon btn-edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteExpense('${expenseId}')" class="btn btn-icon btn-delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Function to logout all devices
function logoutAllDevices() {
    if (!confirm('Are you sure you want to logout from all devices?')) {
        return;
    }
    
    // For now, just logout from current device
    // In a real application, this would call an API to invalidate all sessions
    localStorage.removeItem('jwtToken');
    showMessage('Logged out from all devices successfully!', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// ============================================
// MONTHLY REPORTS FUNCTIONALITY
// ============================================

// Month names array
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Initialize Monthly Reports section
function initMonthlyReports() {
    populateYearDropdown();
    setDefaultMonthYear();
}

// Populate year dropdown with last 10 years
function populateYearDropdown() {
    const yearSelect = document.getElementById('reportYear');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    
    for (let year = currentYear; year >= currentYear - 10; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// Set default month and year to current
function setDefaultMonthYear() {
    const monthSelect = document.getElementById('reportMonth');
    const yearSelect = document.getElementById('reportYear');
    
    if (monthSelect) {
        monthSelect.value = new Date().getMonth();
    }
    if (yearSelect) {
        yearSelect.value = new Date().getFullYear();
    }
}

// Fetch all expenses and store for monthly reports
async function fetchExpensesForReports() {
    try {
        const expenses = await apiRequest(`${API_BASE_URL}/expense`);
        allExpensesData = expenses;
        return expenses;
    } catch (error) {
        console.error('Error fetching expenses for reports:', error);
        return [];
    }
}

// Load monthly report
async function loadMonthlyReport() {
    const monthSelect = document.getElementById('reportMonth');
    const yearSelect = document.getElementById('reportYear');
    
    if (!monthSelect || !yearSelect) {
        showMessage('Please select a month and year.', 'error');
        return;
    }
    
    const selectedMonth = parseInt(monthSelect.value);
    const selectedYear = parseInt(yearSelect.value);
    
    // Fetch all expenses first
    await fetchExpensesForReports();
    
    // Filter expenses for the selected month and year
    const monthlyExpenses = allExpensesData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedMonth && 
               expenseDate.getFullYear() === selectedYear;
    });
    
    // Sort expenses by date (newest first)
    monthlyExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display the monthly report
    displayMonthlyReport(monthlyExpenses, selectedMonth, selectedYear);
}

// Display monthly report
function displayMonthlyReport(expenses, month, year) {
    const monthYear = `${monthNames[month]} ${year}`;
    
    // Update title
    document.getElementById('monthlyExpensesTitle').textContent = monthYear;
    
    // Calculate totals
    const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const totalCount = expenses.length;
    
    // Update badges
    document.getElementById('monthlyCountBadge').textContent = `${totalCount} expense${totalCount !== 1 ? 's' : ''}`;
    document.getElementById('monthlyTotalBadge').textContent = formatCurrency(totalAmount);
    
    // Display monthly summary
    displayMonthlySummary(expenses, month, year);
    
    // Display expenses list
    displayMonthlyExpensesList(expenses);
}

// Display monthly summary with category breakdown
function displayMonthlySummary(expenses, month, year) {
    const summaryContent = document.getElementById('monthlySummaryContent');
    
    if (expenses.length === 0) {
        summaryContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-calendar-times"></i>
                </div>
                <p>No expenses found for ${monthNames[month]} ${new Date().getFullYear()}</p>
            </div>
        `;
        return;
    }
    
    // Calculate category totals
    const categoryTotals = {};
    let totalAmount = 0;
    
    expenses.forEach(expense => {
        const category = expense.category || 'Other';
        const amount = parseFloat(expense.amount || 0);
        
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += amount;
        totalAmount += amount;
    });
    
    // Find highest and lowest expense categories
    const categories = Object.keys(categoryTotals);
    const highestCategory = categories.reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b);
    const lowestCategory = categories.reduce((a, b) => categoryTotals[a] < categoryTotals[b] ? a : b);
    
    // Calculate average expense
    const avgExpense = totalAmount / expenses.length;
    
    // Build summary HTML
    let summaryHTML = `
        <div class="monthly-summary-item">
            <div class="summary-label">
                <i class="fas fa-receipt"></i>
                Total Expenses
            </div>
            <div class="summary-value">${expenses.length}</div>
        </div>
        <div class="monthly-summary-item">
            <div class="summary-label">
                <i class="fas fa-dollar-sign"></i>
                Total Spent
            </div>
            <div class="summary-value highlight">${formatCurrency(totalAmount)}</div>
        </div>
        <div class="monthly-summary-item">
            <div class="summary-label">
                <i class="fas fa-chart-line"></i>
                Average Expense
            </div>
            <div class="summary-value">${formatCurrency(avgExpense)}</div>
        </div>
        <div class="monthly-summary-item">
            <div class="summary-label">
                <i class="fas fa-arrow-up"></i>
                Highest Category
            </div>
            <div class="summary-value">${getCategoryIcon(highestCategory)} ${highestCategory}</div>
        </div>
        <div class="monthly-summary-item">
            <div class="summary-label">
                <i class="fas fa-arrow-down"></i>
                Lowest Category
            </div>
            <div class="summary-value">${getCategoryIcon(lowestCategory)} ${lowestCategory}</div>
        </div>
    `;
    
    // Add category breakdown
    if (categories.length > 0) {
        summaryHTML += `
            <div class="category-breakdown">
                <h3><i class="fas fa-chart-pie"></i> Category Breakdown</h3>
        `;
        
        // Sort categories by amount (highest first)
        const sortedCategories = categories.sort((a, b) => categoryTotals[b] - categoryTotals[a]);
        
        sortedCategories.forEach(category => {
            const amount = categoryTotals[category];
            const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            
            summaryHTML += `
                <div class="category-breakdown-item">
                    <div class="category-name">
                        ${getCategoryIcon(category)} ${category}
                    </div>
                    <div class="category-bar">
                        <div class="category-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="category-amount">${formatCurrency(amount)}</div>
                </div>
            `;
        });
        
        summaryHTML += `</div>`;
    }
    
    summaryContent.innerHTML = summaryHTML;
}

// Display monthly expenses list
function displayMonthlyExpensesList(expenses) {
    const expenseList = document.getElementById('monthlyExpensesList');
    
    if (expenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-receipt"></i>
                </div>
                <p>No expenses found for the selected month</p>
            </div>
        `;
        return;
    }
    
    expenseList.innerHTML = expenses.map(expense => {
        const expenseId = expense.id || expense._id;
        const category = expense.category || 'Other';
        const title = expense.title || 'No description';
        const icon = getCategoryIcon(category);
        
        return `
            <div class="expense-item" data-id="${expenseId}">
                <div class="expense-icon">${icon}</div>
                <div class="expense-info">
                    <h3>${escapeHtml(title)}</h3>
                    <div class="expense-meta">
                        <span class="expense-category">
                            <span class="category-badge category-${category.toLowerCase()}">${icon} ${escapeHtml(category)}</span>
                        </span>
                        <span class="expense-date">
                            <i class="far fa-calendar"></i>
                            ${formatDate(expense.date)}
                        </span>
                    </div>
                </div>
                <div class="expense-actions">
                    <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Download monthly PDF report
async function downloadMonthlyPDF() {
    const monthSelect = document.getElementById('reportMonth');
    const yearSelect = document.getElementById('reportYear');
    
    if (!monthSelect || !yearSelect) {
        showMessage('Please select a month and year.', 'error');
        return;
    }
    
    const selectedMonth = parseInt(monthSelect.value);
    const selectedYear = parseInt(yearSelect.value);
    
    // Fetch all expenses first if not already loaded
    if (allExpensesData.length === 0) {
        await fetchExpensesForReports();
    }
    
    // Filter expenses for the selected month and year
    const monthlyExpenses = allExpensesData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedMonth && 
               expenseDate.getFullYear() === selectedYear;
    });
    
    if (monthlyExpenses.length === 0) {
        showMessage('No expenses found for the selected month to generate PDF.', 'error');
        return;
    }
    
    // Sort expenses by date
    monthlyExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    generatePDF(monthlyExpenses, selectedMonth, selectedYear);
}

// Generate PDF report with professional formatting
function generatePDF(expenses, month, year) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const monthYear = `${monthNames[month]} ${year}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;
    
    // ====== TITLE SECTION ======
    // Company/App Name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('SpendingTracker', pageWidth / 2, yPos, { align: 'center' });
    
    // Report Title
    yPos += 8;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Monthly Expense Report', pageWidth / 2, yPos, { align: 'center' });
    
    // Subtitle (Month & Year)
    yPos += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(monthYear, pageWidth / 2, yPos, { align: 'center' });
    
    // Decorative line under title
    yPos += 4;
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    // Calculate totals
    const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    
    // ====== SUMMARY SECTION ======
    yPos += 12;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Summary', margin, yPos);
    
    yPos += 7;
    
    // Summary boxes with clean design
    const summaryStartY = yPos;
    const boxWidth = (contentWidth - 8) / 2;
    const boxHeight = 14;
    const boxPadding = 4;
    
    // Box 1: Total Expenses Count
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, summaryStartY, boxWidth, boxHeight, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Total Expenses', margin + 4, summaryStartY + 5);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(expenses.length.toString(), margin + boxWidth - 4, summaryStartY + 10, { align: 'right' });
    
    // Box 2: Total Amount
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + boxWidth + 8, summaryStartY, boxWidth, boxHeight, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Total Amount', margin + boxWidth + 12, summaryStartY + 5);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(formatCurrencyForPDF(totalAmount), pageWidth - margin - 4, summaryStartY + 10, { align: 'right' });
    
    // ====== CATEGORY BREAKDOWN ======
    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense.category || 'Other';
        const amount = parseFloat(expense.amount || 0);
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += amount;
    });
    
    yPos = summaryStartY + boxHeight + 12;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Category Breakdown', margin, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const categories = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]);
    
    // Category table headers
    const catHeaderY = yPos;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, catHeaderY - 3, contentWidth, 6, 1, 1, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Category', margin + 3, catHeaderY + 1);
    doc.text('Percentage', margin + 100, catHeaderY + 1);
    doc.text('Amount', pageWidth - margin - 3, catHeaderY + 1, { align: 'right' });
    
    yPos = catHeaderY + 5;
    doc.setFont('helvetica', 'normal');
    
    categories.forEach((category, index) => {
        const amount = categoryTotals[category];
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        
        // Alternate row background
        if (index % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(margin, yPos - 2, contentWidth, 5, 0.5, 0.5, 'F');
        }
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(9);
        doc.text(category, margin + 3, yPos + 2);
        
        doc.setTextColor(100, 116, 139);
        doc.text(`${percentage.toFixed(1)}%`, margin + 100, yPos + 2);
        
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrencyForPDF(amount), pageWidth - margin - 3, yPos + 2, { align: 'right' });
        
        yPos += 5;
        
        // Check if we need a new page
        if (yPos > 130) {
            doc.addPage();
            yPos = 25;
        }
    });
    
    // ====== EXPENSE DETAILS TABLE ======
    yPos += 8;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Expense Details', margin, yPos);
    
    yPos += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Table column configuration - optimized for readability
    const headerY = yPos;
    const colConfig = [
        { header: 'Date', width: 28, align: 'left' },
        { header: 'Description', width: 85, align: 'left' },
        { header: 'Category', width: 38, align: 'left' },
        { header: 'Amount (\u20B9)', width: 38, align: 'right' }
    ];
    
    // Calculate table start position
    const tableTotalWidth = colConfig.reduce((sum, col) => sum + col.width + 4, -4);
    const tableStartX = margin + (contentWidth - tableTotalWidth) / 2;
    
    // Draw table header with gradient-like effect
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(tableStartX, headerY - 4, tableTotalWidth, 8, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    
    let currentX = tableStartX + 4;
    colConfig.forEach(col => {
        if (col.align === 'right') {
            doc.text(col.header, currentX + col.width - 2, headerY + 2, { align: 'right' });
        } else {
            doc.text(col.header, currentX, headerY + 2, { align: col.align });
        }
        currentX += col.width + 4;
    });
    
    // Table rows
    yPos = headerY + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    
    expenses.forEach((expense, index) => {
        const title = (expense.title || 'No description');
        const truncatedTitle = title.length > 38 ? title.substring(0, 38) + '...' : title;
        const category = expense.category || 'Other';
        const amount = formatCurrencyForPDF(expense.amount);
        const date = new Date(expense.date).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        // Alternate row colors for readability
        if (index % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(tableStartX, yPos - 3, tableTotalWidth, 6, 0.5, 0.5, 'F');
        }
        
        // Add thin separator line between rows
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.line(tableStartX, yPos + 3, tableStartX + tableTotalWidth, yPos + 3);
        
        currentX = tableStartX + 4;
        
        colConfig.forEach((col, colIndex) => {
            let text = '';
            switch(colIndex) {
                case 0: text = date; break;
                case 1: text = truncatedTitle; break;
                case 2: text = category; break;
                case 3: text = amount; break;
            }
            
            // Amount column - bold and darker
            if (colIndex === 3) {
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
            } else {
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(71, 85, 105);
            }
            
            if (col.align === 'right') {
                doc.text(text, currentX + col.width - 2, yPos, { align: 'right' });
            } else {
                doc.text(text, currentX, yPos, { align: col.align });
            }
            currentX += col.width + 4;
        });
        
        yPos += 6;
        
        // Check if we need a new page
        if (yPos > 270) {
            doc.addPage();
            yPos = 25;
            
            // Re-add table header on new page
            doc.setFillColor(99, 102, 241);
            doc.roundedRect(tableStartX, yPos - 4, tableTotalWidth, 8, 2, 2, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            currentX = tableStartX + 4;
            colConfig.forEach(col => {
                if (col.align === 'right') {
                    doc.text(col.header, currentX + col.width - 2, yPos + 2, { align: 'right' });
                } else {
                    doc.text(col.header, currentX, yPos + 2, { align: col.align });
                }
                currentX += col.width + 4;
            });
            
            yPos += 10;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
        }
    });
    
    // ====== FOOTER ON ALL PAGES ======
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer background
        doc.setFillColor(241, 245, 249);
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        // Footer line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(0, pageHeight - 15, pageWidth, pageHeight - 15);
        
        // Footer text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        
        const generatedDate = new Date().toLocaleDateString('en-US', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        
        doc.text(
            `Generated: ${generatedDate}`,
            margin,
            pageHeight - 8,
            { align: 'left' }
        );
        
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth - margin,
            pageHeight - 8,
            { align: 'right' }
        );
        
        doc.text(
            'SpendingTracker - Monthly Expense Report',
            pageWidth / 2,
            pageHeight - 8,
            { align: 'center' }
        );
    }
    
    // Save the PDF
    doc.save(`Expense_Report_${monthNames[month].toLowerCase()}_${year}.pdf`);
    
    showMessage('PDF downloaded successfully!', 'success');
}

// Dark mode functionality
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (!darkModeToggle) return;
    
    // Check if dark mode is saved in localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Apply dark mode if enabled
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.checked = true;
    }
    
    // Add event listener for toggle
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'false');
        }
    });
}

// Initialize monthly reports when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMonthlyReports();
    initDarkMode();
});
