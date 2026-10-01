/**
 * ============================================================================
 * DR. RAM MANOHAR LOHIA PUBLIC SCHOOL - SCHOOL MANAGEMENT SYSTEM
 * Client-Side Engine: Database, Students, Marksheet & TC Generator
 * Starts completely EMPTY with zero pre-filled / fake records.
 * ============================================================================
 */

// Storage Key for LocalStorage Persistence
const STORAGE_KEY = 'rml_school_db_v3';
const AUTH_STORAGE_KEY = 'rml_admin_session_auth_v1';

// Default State Configuration
const DefaultSettings = {
  schoolName: 'Dr. Ram Manohar Lohia Public School',
  schoolAddress: 'Badlapur, Jaunpur',
  schoolPhone: '',
  schoolEmail: '',
  schoolWebsite: '',
  schoolTagline: '— Discipline | Knowledge | Success —',
  academicSession: '2025 - 2026',
  examName: 'REPORT CARD / MARKSHEET',
  topMotto: 'Education Today | Character Tomorrow',
  footerQuote: '“Education is the Key to a Brighter Future”',
  adminUsername: 'admin',
  adminPassword: 'admin123',
  schoolLogo: '',
  schoolSeal: '',
  teacherSign: '',
  principalSign: '',
  watermarkImage: '',
  watermarkEnabled: true,
  watermarkOpacity: 0.07,
  watermarkSize: 320,
  gradingScale: [
    { grade: 'A+', min: 90, max: 100, remark: 'Outstanding' },
    { grade: 'A', min: 75, max: 89, remark: 'Very Good' },
    { grade: 'B+', min: 60, max: 74, remark: 'Good' },
    { grade: 'B', min: 45, max: 59, remark: 'Satisfactory' },
    { grade: 'C', min: 33, max: 44, remark: 'Needs Improvement' },
    { grade: 'D', min: 0, max: 32, remark: 'Poor' }
  ]
};

// Global Application Database
let SchoolDB = {
  settings: { ...DefaultSettings },
  students: [], // Starts completely EMPTY!
  marksheets: {}, // studentId -> marksheet data
  tcs: {} // studentId -> tc data
};

// Active Working Marksheet State (for currently active editor session)
let ActiveMarksheet = {
  selectedStudentId: null,
  schoolName: '',
  schoolAddress: '',
  schoolTagline: '',
  schoolLogo: '',
  academicSession: '',
  examName: '',
  topMotto: '',
  footerQuote: '',
  studentName: '',
  fatherName: '',
  motherName: '',
  className: '',
  section: '',
  rollNo: '',
  admissionNo: '',
  dob: '',
  studentPhoto: '',
  subjects: [], // Starts EMPTY!
  remarks: '',
  issueDate: '',
  teacherSign: '',
  schoolSeal: '',
  principalSign: '',
  watermarkEnabled: true,
  watermarkImage: '',
  watermarkOpacity: 0.07,
  watermarkSize: 320,
  gradingScale: []
};

// Active Working TC State
let ActiveTC = {
  selectedStudentId: null,
  tcNo: '',
  pupilName: '',
  fatherName: '',
  motherName: '',
  className: '',
  dob: '',
  issueDate: '',
  reason: ''
};

// Working temporary grading scale for the modal editor
let tempGradingScale = [];

// Modal student photo temp state
let tempModalPhoto = '';

/**
 * ============================================================================
 * INITIALIZATION & STORAGE ENGINE
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  loadDatabaseFromStorage();
  checkAdminAuth();
  syncSettingsToUI();
  initActiveMarksheetDefaults();
  initActiveTcDefaults();
  populateDropdownSelectors();
  updateDashboardStats();
  renderStudentsTable();
  recalculateAndRenderMarksheet();
  renderTcPreview();
});

function loadDatabaseFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      SchoolDB.settings = { ...DefaultSettings, ...(parsed.settings || {}) };
      SchoolDB.students = Array.isArray(parsed.students) ? parsed.students : [];
      SchoolDB.marksheets = parsed.marksheets || {};
      SchoolDB.tcs = parsed.tcs || {};
    }
  } catch (e) {
    console.error('Error loading database from storage:', e);
  }
}

function saveDatabaseToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SchoolDB));
    updateDashboardStats();
  } catch (e) {
    console.error('Error saving database to storage:', e);
    showToast('⚠️ Storage limit reached. Please optimize uploaded image sizes.');
  }
}

function syncSettingsToUI() {
  const s = SchoolDB.settings;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '';
  };

  // Header & Sidebar School Info
  setText('sbSchoolTitle', s.schoolName || 'RML Public School');
  setText('sbSchoolSub', s.schoolAddress || 'Badlapur, Jaunpur');
  setText('sbActiveSession', s.academicSession || '2025 - 2026');
  setText('topSessionText', `Session: ${s.academicSession || '2025 - 2026'}`);

  // Settings Panel Inputs
  setVal('setSchoolName', s.schoolName);
  setVal('setSchoolAddress', s.schoolAddress);
  setVal('setSchoolPhone', s.schoolPhone);
  setVal('setSchoolEmail', s.schoolEmail);
  setVal('setAcademicSession', s.academicSession);
  setVal('setExamName', s.examName);
  setVal('setSchoolTagline', s.schoolTagline);
  setVal('setAdminUsername', s.adminUsername || 'admin');
  setVal('setAdminPassword', s.adminPassword || 'admin123');
}

/**
 * ============================================================================
 * ADMIN AUTHENTICATION & SECURITY SYSTEM
 * ============================================================================
 */
function isUserAuthenticated() {
  try {
    const sessionAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionAuth) {
      const data = JSON.parse(sessionAuth);
      if (data && data.authenticated === true) return true;
    }
    const localAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (localAuth) {
      const data = JSON.parse(localAuth);
      if (data && data.authenticated === true) return true;
    }
  } catch (e) {
    console.error('Error verifying auth status:', e);
  }
  return false;
}

function checkAdminAuth() {
  const loginScreen = document.getElementById('adminLoginScreen');
  const mainApp = document.getElementById('mainAppContainer');
  const isAuth = isUserAuthenticated();

  if (isAuth) {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('auth-locked');
  } else {
    if (loginScreen) {
      loginScreen.classList.remove('hidden');
      const userInput = document.getElementById('loginUsername');
      if (userInput) setTimeout(() => userInput.focus(), 150);
    }
    if (mainApp) mainApp.classList.add('auth-locked');
  }
  return isAuth;
}

function handleAdminLogin(event) {
  if (event) event.preventDefault();

  const userInp = document.getElementById('loginUsername');
  const passInp = document.getElementById('loginPassword');
  const chkRemember = document.getElementById('chkRememberMe');
  const errAlert = document.getElementById('loginErrorAlert');
  const errText = document.getElementById('loginErrorText');

  const inputUser = userInp ? userInp.value.trim() : '';
  const inputPass = passInp ? passInp.value : '';
  const rememberMe = chkRemember ? chkRemember.checked : true;

  const validUser = (SchoolDB.settings.adminUsername || 'admin').trim();
  const validPass = SchoolDB.settings.adminPassword || 'admin123';

  if (inputUser === validUser && inputPass === validPass) {
    if (errAlert) errAlert.style.display = 'none';

    const authData = JSON.stringify({
      authenticated: true,
      username: inputUser,
      timestamp: Date.now()
    });

    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, authData);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, authData);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    const loginScreen = document.getElementById('adminLoginScreen');
    const mainApp = document.getElementById('mainAppContainer');

    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('auth-locked');

    if (userInp) userInp.value = '';
    if (passInp) passInp.value = '';

    showToast(`✅ Welcome back, ${inputUser}! Admin logged in successfully.`);
  } else {
    if (errAlert) {
      errAlert.style.display = 'flex';
      errAlert.classList.remove('shakeAlert');
      void errAlert.offsetWidth;
      errAlert.classList.add('shakeAlert');
      if (errText) {
        errText.textContent = 'Invalid username or password. Please try again.';
      }
    }
    if (passInp) {
      passInp.value = '';
      passInp.focus();
    }
  }
}

function handleAdminLogout() {
  if (!confirm('Are you sure you want to sign out of the Admin portal?')) {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);

  const loginScreen = document.getElementById('adminLoginScreen');
  const mainApp = document.getElementById('mainAppContainer');
  const errAlert = document.getElementById('loginErrorAlert');

  if (errAlert) errAlert.style.display = 'none';
  if (loginScreen) {
    loginScreen.classList.remove('hidden');
    const userInp = document.getElementById('loginUsername');
    if (userInp) {
      userInp.value = '';
      setTimeout(() => userInp.focus(), 150);
    }
    const passInp = document.getElementById('loginPassword');
    if (passInp) passInp.value = '';
  }
  if (mainApp) mainApp.classList.add('auth-locked');

  showToast('🔒 You have been securely logged out.');
}

function toggleLoginPasswordVisibility() {
  const pwdInput = document.getElementById('loginPassword');
  const eyeOpen = document.getElementById('eyeIconOpen');
  const eyeClosed = document.getElementById('eyeIconClosed');

  if (!pwdInput) return;

  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (eyeOpen) eyeOpen.style.display = 'none';
    if (eyeClosed) eyeClosed.style.display = 'block';
  } else {
    pwdInput.type = 'password';
    if (eyeOpen) eyeOpen.style.display = 'block';
    if (eyeClosed) eyeClosed.style.display = 'none';
  }
}

function updateAdminCredentials() {
  const userEl = document.getElementById('setAdminUsername');
  const passEl = document.getElementById('setAdminPassword');

  const newUsername = userEl ? userEl.value.trim() : '';
  const newPassword = passEl ? passEl.value : '';

  if (!newUsername) {
    showToast('⚠️ Admin username cannot be empty.');
    return;
  }
  if (!newPassword || newPassword.length < 4) {
    showToast('⚠️ Admin password must be at least 4 characters long.');
    return;
  }

  SchoolDB.settings.adminUsername = newUsername;
  SchoolDB.settings.adminPassword = newPassword;
  saveDatabaseToStorage();

  const isAuth = isUserAuthenticated();
  if (isAuth) {
    const authPayload = JSON.stringify({
      authenticated: true,
      username: newUsername,
      timestamp: Date.now()
    });
    if (localStorage.getItem(AUTH_STORAGE_KEY)) {
      localStorage.setItem(AUTH_STORAGE_KEY, authPayload);
    }
    if (sessionStorage.getItem(AUTH_STORAGE_KEY)) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, authPayload);
    }
  }

  showToast('✅ Admin credentials updated successfully!');
}

function initActiveMarksheetDefaults() {
  const s = SchoolDB.settings;
  ActiveMarksheet.schoolName = s.schoolName;
  ActiveMarksheet.schoolAddress = s.schoolAddress;
  ActiveMarksheet.schoolTagline = s.schoolTagline;
  ActiveMarksheet.schoolLogo = s.schoolLogo;
  ActiveMarksheet.academicSession = s.academicSession;
  ActiveMarksheet.examName = s.examName;
  ActiveMarksheet.topMotto = s.topMotto;
  ActiveMarksheet.footerQuote = s.footerQuote;
  ActiveMarksheet.teacherSign = s.teacherSign;
  ActiveMarksheet.schoolSeal = s.schoolSeal;
  ActiveMarksheet.principalSign = s.principalSign;
  ActiveMarksheet.watermarkImage = s.watermarkImage;
  ActiveMarksheet.watermarkEnabled = s.watermarkEnabled;
  ActiveMarksheet.watermarkOpacity = s.watermarkOpacity;
  ActiveMarksheet.watermarkSize = s.watermarkSize;
  ActiveMarksheet.issueDate = '';
  ActiveMarksheet.gradingScale = JSON.parse(JSON.stringify(s.gradingScale || []));

  // Sync into Form Controls
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('inpSchoolName', ActiveMarksheet.schoolName);
  setVal('inpSchoolAddress', ActiveMarksheet.schoolAddress);
  setVal('inpSchoolTagline', ActiveMarksheet.schoolTagline);
  setVal('inpAcademicSession', ActiveMarksheet.academicSession);
  setVal('inpExamName', ActiveMarksheet.examName);
  setVal('inpTopMotto', ActiveMarksheet.topMotto);
  setVal('inpFooterQuote', ActiveMarksheet.footerQuote);
  setVal('inpIssueDate', ActiveMarksheet.issueDate);

  const chkWatermark = document.getElementById('chkWatermarkToggle');
  if (chkWatermark) chkWatermark.checked = ActiveMarksheet.watermarkEnabled;

  const rngOpacity = document.getElementById('rngWatermarkOpacity');
  if (rngOpacity) rngOpacity.value = ActiveMarksheet.watermarkOpacity;

  const rngSize = document.getElementById('rngWatermarkSize');
  if (rngSize) rngSize.value = ActiveMarksheet.watermarkSize;

  updateMediaEditorPreview('schoolLogo', ActiveMarksheet.schoolLogo);
  updateMediaEditorPreview('teacherSign', ActiveMarksheet.teacherSign);
  updateMediaEditorPreview('schoolSeal', ActiveMarksheet.schoolSeal);
  updateMediaEditorPreview('principalSign', ActiveMarksheet.principalSign);
  updateMediaEditorPreview('watermarkImage', ActiveMarksheet.watermarkImage);
}

function initActiveTcDefaults() {
  const now = new Date();
  const todayStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  ActiveTC.issueDate = todayStr;
  ActiveTC.tcNo = `TC/${now.getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('inpTcNo', ActiveTC.tcNo);
  setVal('inpTcIssueDate', ActiveTC.issueDate);
}

/**
 * ============================================================================
 * VIEW NAVIGATION
 * ============================================================================
 */
function switchView(viewName) {
  const views = ['dashboard', 'students', 'search', 'marksheet', 'tc', 'settings'];
  views.forEach(v => {
    const el = document.getElementById(`view${capitalize(v)}`);
    if (el) el.classList.remove('active');

    const nav = document.getElementById(`navItem${capitalize(v)}`);
    if (nav) nav.classList.remove('active');
  });

  const activeView = document.getElementById(`view${capitalize(viewName)}`);
  if (activeView) activeView.classList.add('active');

  const activeNav = document.getElementById(`navItem${capitalize(viewName)}`);
  if (activeNav) activeNav.classList.add('active');

  // Update Page Headings
  const headings = {
    dashboard: { title: 'School Management Dashboard', sub: `${SchoolDB.settings.schoolName} — ${SchoolDB.settings.schoolAddress}` },
    students: { title: 'Class & Section Student Management', sub: 'Organize, register and manage students by class and section' },
    search: { title: 'School Student Directory & Search', sub: 'Instantly find students across all classes and sections' },
    marksheet: { title: 'Official Marksheet Generator', sub: 'Generate & print professional A4 single-page report cards' },
    tc: { title: 'Transfer Certificate (TC) Generator', sub: 'Generate & print official School Transfer Certificates' },
    settings: { title: 'School Settings & Data Portability', sub: 'Configure school details, logos, signatures and database backup' }
  };

  const h = headings[viewName] || headings.dashboard;
  const pageHeading = document.getElementById('pageMainHeading');
  const pageSub = document.getElementById('pageSubHeading');
  if (pageHeading) pageHeading.textContent = h.title;
  if (pageSub) pageSub.textContent = h.sub;

  // View specific refresh
  if (viewName === 'dashboard') {
    updateDashboardStats();
  } else if (viewName === 'students') {
    renderStudentsTable();
  } else if (viewName === 'marksheet') {
    populateDropdownSelectors();
    recalculateAndRenderMarksheet();
  } else if (viewName === 'tc') {
    populateDropdownSelectors();
    renderTcPreview();
  }

  // Close sidebar on mobile after navigation
  const sidebar = document.getElementById('appSidebar');
  if (sidebar) sidebar.classList.remove('open');
}

function toggleSidebar() {
  const sidebar = document.getElementById('appSidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

function capitalize(str) {
  if (!str) return '';
  if (str === 'tc') return 'TC';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * ============================================================================
 * DASHBOARD METRICS & RECENT RECORDS
 * ============================================================================
 */
function updateDashboardStats() {
  const students = SchoolDB.students || [];
  const marksheets = Object.keys(SchoolDB.marksheets || {}).length;
  const tcs = Object.keys(SchoolDB.tcs || {}).length;

  // Unique active classes
  const classesSet = new Set();
  students.forEach(st => {
    if (st.className) classesSet.add(st.className);
  });

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('dashTotalStudents', students.length);
  setText('dashTotalClasses', classesSet.size);
  setText('dashTotalMarksheets', marksheets);
  setText('dashTotalTCs', tcs);
  setText('sbStudentCountBadge', students.length);

  renderDashboardClassBreakdown();
  renderDashboardRecentStudents();
}

function renderDashboardClassBreakdown() {
  const container = document.getElementById('dashClassBreakdownGrid');
  if (!container) return;

  const students = SchoolDB.students || [];
  if (students.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--text-muted); background: var(--bg-input); border-radius: 8px; border: 1px dashed var(--border-color);">
        <p style="font-size: 0.85rem;">No students registered yet. Click <strong>"+ Add New Student"</strong> to begin.</p>
      </div>
    `;
    return;
  }

  // Group by Class and Section
  const classMap = {};
  students.forEach(st => {
    const c = st.className || 'Unassigned';
    const s = st.section || 'General';
    if (!classMap[c]) {
      classMap[c] = { count: 0, sections: new Set() };
    }
    classMap[c].count++;
    classMap[c].sections.add(`Sec ${s}`);
  });

  let html = '';
  Object.keys(classMap).sort().forEach(cls => {
    const info = classMap[cls];
    const secList = Array.from(info.sections).join(', ');
    html += `
      <div class="class-card" onclick="filterStudentsByClass('${escapeHtml(cls)}')">
        <div class="class-card-title">
          <span>${escapeHtml(cls)}</span>
          <span class="badge-pill badge-blue">${info.count} Students</span>
        </div>
        <div class="class-card-sections">${escapeHtml(secList)}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderDashboardRecentStudents() {
  const container = document.getElementById('dashRecentStudentsTableWrap');
  if (!container) return;

  const students = SchoolDB.students || [];
  if (students.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
        </div>
        <h4>No Student Records Found</h4>
        <p>The system is clean and ready. Register your first student to generate official marksheets and certificates.</p>
        <button class="btn btn-sm btn-primary" onclick="openAddStudentModal()" style="margin-top: 0.5rem;">+ Add First Student</button>
      </div>
    `;
    return;
  }

  // Show top 5 recent
  const recent = [...students].reverse().slice(0, 5);
  let rowsHtml = '';
  recent.forEach((st, idx) => {
    const avatarHtml = st.studentPhoto
      ? `<img src="${st.studentPhoto}" alt="Avatar">`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;

    rowsHtml += `
      <tr>
        <td style="width: 5%; text-align: center; color: var(--text-muted); font-weight:700;">${idx + 1}</td>
        <td>
          <div class="student-cell">
            <div class="student-avatar">${avatarHtml}</div>
            <div class="student-cell-info">
              <span class="student-cell-name">${escapeHtml(st.name)}</span>
              <span class="student-cell-roll">Roll: ${escapeHtml(st.rollNo || '—')} | Adm: ${escapeHtml(st.admissionNo || '—')}</span>
            </div>
          </div>
        </td>
        <td><span class="badge-pill badge-blue">${escapeHtml(st.className)} - Sec ${escapeHtml(st.section)}</span></td>
        <td>${escapeHtml(st.fatherName || '—')}</td>
        <td>${escapeHtml(st.contactNo || '—')}</td>
        <td style="text-align: right;">
          <div class="table-actions-cell" style="justify-content: flex-end;">
            <button class="btn btn-xs btn-outline" onclick="selectStudentForMarksheet('${st.id}')" title="Create Marksheet">📝 Marksheet</button>
            <button class="btn btn-xs btn-outline" onclick="selectStudentForTC('${st.id}')" title="Create TC">📜 TC</button>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th>Student Details</th>
          <th>Class & Section</th>
          <th>Father's Name</th>
          <th>Contact</th>
          <th style="text-align: right;">Quick Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

function filterStudentsByClass(className) {
  switchView('students');
  const selClass = document.getElementById('selStudentFilterClass');
  if (selClass) {
    selClass.value = className;
    onStudentFilterChanged();
  }
}

/**
 * ============================================================================
 * STUDENT MANAGEMENT (CLASS & SECTION DRIVEN)
 * ============================================================================
 */
function renderStudentsTable() {
  const container = document.getElementById('studentsMainTableContainer');
  if (!container) return;

  const selClass = document.getElementById('selStudentFilterClass')?.value || '';
  const selSection = document.getElementById('selStudentFilterSection')?.value || '';
  const searchQ = (document.getElementById('inpStudentTableSearch')?.value || '').toLowerCase().trim();

  let filtered = SchoolDB.students || [];

  if (selClass) {
    filtered = filtered.filter(s => s.className === selClass);
  }
  if (selSection) {
    filtered = filtered.filter(s => s.section === selSection);
  }
  if (searchQ) {
    filtered = filtered.filter(s =>
      (s.name || '').toLowerCase().includes(searchQ) ||
      (s.rollNo || '').toLowerCase().includes(searchQ) ||
      (s.admissionNo || '').toLowerCase().includes(searchQ) ||
      (s.fatherName || '').toLowerCase().includes(searchQ) ||
      (s.contactNo || '').toLowerCase().includes(searchQ)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
          </svg>
        </div>
        <h4>No Students Matching Criteria</h4>
        <p>${SchoolDB.students.length === 0 ? 'No students enrolled yet. Click "+ Add Student" to add the first record.' : 'No students found for the selected Class/Section filter.'}</p>
        <button class="btn btn-sm btn-primary" onclick="openAddStudentModal()" style="margin-top: 0.5rem;">+ Add New Student</button>
      </div>
    `;
    return;
  }

  let rowsHtml = '';
  filtered.forEach((st, idx) => {
    const avatarHtml = st.studentPhoto
      ? `<img src="${st.studentPhoto}" alt="Avatar">`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;

    rowsHtml += `
      <tr>
        <td style="width: 5%; text-align: center; color: var(--text-muted); font-weight:700;">${idx + 1}</td>
        <td>
          <div class="student-cell">
            <div class="student-avatar">${avatarHtml}</div>
            <div class="student-cell-info">
              <span class="student-cell-name">${escapeHtml(st.name)}</span>
              <span class="student-cell-roll">Roll: ${escapeHtml(st.rollNo || '—')} | Adm: ${escapeHtml(st.admissionNo || '—')}</span>
            </div>
          </div>
        </td>
        <td><span class="badge-pill badge-blue">${escapeHtml(st.className)} - Sec ${escapeHtml(st.section)}</span></td>
        <td>${escapeHtml(st.fatherName || '—')}</td>
        <td>${escapeHtml(st.dob || '—')}</td>
        <td>${escapeHtml(st.contactNo || '—')}</td>
        <td style="text-align: right;">
          <div class="table-actions-cell" style="justify-content: flex-end;">
            <button class="btn btn-xs btn-primary" onclick="selectStudentForMarksheet('${st.id}')" title="Create Marksheet">📝 Marksheet</button>
            <button class="btn btn-xs btn-outline" onclick="selectStudentForTC('${st.id}')" title="Create TC">📜 TC</button>
            <button class="btn btn-xs btn-outline" onclick="editStudent('${st.id}')" title="Edit Student">✏️</button>
            <button class="btn btn-xs btn-danger-ghost" onclick="deleteStudent('${st.id}')" title="Delete Student">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th>Student Details</th>
          <th>Class & Section</th>
          <th>Father's Name</th>
          <th>DOB</th>
          <th>Contact</th>
          <th style="text-align: right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

function onStudentFilterChanged() {
  renderStudentsTable();
}

/**
 * ============================================================================
 * ADD / EDIT STUDENT MODAL LOGIC
 * ============================================================================
 */
function openAddStudentModal(studentId = null) {
  tempModalPhoto = '';
  const modalTitle = document.getElementById('studentModalTitle');
  const inpId = document.getElementById('modalStudentId');

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  if (studentId) {
    const st = SchoolDB.students.find(s => s.id === studentId);
    if (!st) return;
    if (modalTitle) modalTitle.textContent = 'Edit Student Details';
    if (inpId) inpId.value = st.id;

    setVal('mInpStudentName', st.name);
    setVal('mInpFatherName', st.fatherName);
    setVal('mInpMotherName', st.motherName);
    setVal('mInpClass', st.className);
    setVal('mInpSection', st.section);
    setVal('mInpRollNo', st.rollNo);
    setVal('mInpAdmissionNo', st.admissionNo);
    setVal('mInpDob', st.dob);
    setVal('mInpContact', st.contactNo);
    setVal('mInpAddress', st.address);

    tempModalPhoto = st.studentPhoto || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'Register New Student';
    if (inpId) inpId.value = '';

    setVal('mInpStudentName', '');
    setVal('mInpFatherName', '');
    setVal('mInpMotherName', '');
    setVal('mInpClass', 'Class 6');
    setVal('mInpSection', 'A');
    setVal('mInpRollNo', '');
    setVal('mInpAdmissionNo', '');
    setVal('mInpDob', '');
    setVal('mInpContact', '');
    setVal('mInpAddress', '');
  }

  updateModalPhotoPreview();
  openModal('studentModal');
}

function handleModalPhotoUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 2 * 1024 * 1024) {
    showToast('⚠️ Photo must be less than 2MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    tempModalPhoto = e.target.result;
    updateModalPhotoPreview();
  };
  reader.readAsDataURL(file);
}

function removeModalPhoto() {
  tempModalPhoto = '';
  updateModalPhotoPreview();
}

function updateModalPhotoPreview() {
  const wrap = document.getElementById('modalPhotoPreviewWrap');
  const btnRemove = document.getElementById('mBtnRemovePhoto');
  if (wrap) {
    if (tempModalPhoto) {
      wrap.innerHTML = `<img src="${tempModalPhoto}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      wrap.innerHTML = `<span class="media-placeholder-txt">No Photo</span>`;
    }
  }
  if (btnRemove) {
    btnRemove.style.display = tempModalPhoto ? 'inline-flex' : 'none';
  }
}

function saveStudentFromModal() {
  const name = document.getElementById('mInpStudentName')?.value.trim();
  const className = document.getElementById('mInpClass')?.value || 'Class 6';
  const section = document.getElementById('mInpSection')?.value || 'A';

  if (!name) {
    showToast('⚠️ Student Name is required!');
    document.getElementById('mInpStudentName')?.focus();
    return;
  }

  const id = document.getElementById('modalStudentId')?.value;
  const studentData = {
    id: id || ('stud_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
    name: name,
    fatherName: document.getElementById('mInpFatherName')?.value.trim() || '',
    motherName: document.getElementById('mInpMotherName')?.value.trim() || '',
    className: className,
    section: section,
    rollNo: document.getElementById('mInpRollNo')?.value.trim() || '',
    admissionNo: document.getElementById('mInpAdmissionNo')?.value.trim() || '',
    dob: document.getElementById('mInpDob')?.value.trim() || '',
    contactNo: document.getElementById('mInpContact')?.value.trim() || '',
    address: document.getElementById('mInpAddress')?.value.trim() || '',
    studentPhoto: tempModalPhoto,
    updatedAt: Date.now()
  };

  if (id) {
    const idx = SchoolDB.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      SchoolDB.students[idx] = { ...SchoolDB.students[idx], ...studentData };
      showToast('✅ Student details updated successfully!');
    }
  } else {
    SchoolDB.students.push(studentData);
    showToast(`✅ Student "${studentData.name}" registered successfully!`);
  }

  saveDatabaseToStorage();
  closeModal('studentModal');
  renderStudentsTable();
  populateDropdownSelectors();
}

function editStudent(id) {
  openAddStudentModal(id);
}

function deleteStudent(id) {
  const st = SchoolDB.students.find(s => s.id === id);
  const name = st ? st.name : 'this student';
  if (confirm(`Are you sure you want to delete ${name} from the school database?`)) {
    SchoolDB.students = SchoolDB.students.filter(s => s.id !== id);
    delete SchoolDB.marksheets[id];
    delete SchoolDB.tcs[id];
    saveDatabaseToStorage();
    renderStudentsTable();
    populateDropdownSelectors();
    showToast(`Deleted student ${name}.`);
  }
}

/**
 * ============================================================================
 * CLASS & SECTION DROPDOWN POPULATOR FOR MARKSHEET & TC
 * ============================================================================
 */
function populateDropdownSelectors() {
  const students = SchoolDB.students || [];

  // Extract unique classes
  const allClasses = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12', 'Nursery', 'LKG', 'UKG'
  ];

  // Include any custom class from student records
  students.forEach(st => {
    if (st.className && !allClasses.includes(st.className)) {
      allClasses.push(st.className);
    }
  });

  const populateClassSelect = (elId) => {
    const el = document.getElementById(elId);
    if (!el) return;
    const currentVal = el.value;
    el.innerHTML = '<option value="">-- Select Class --</option>';
    allClasses.forEach(cls => {
      const opt = document.createElement('option');
      opt.value = cls;
      opt.textContent = cls;
      if (cls === currentVal) opt.selected = true;
      el.appendChild(opt);
    });
  };

  populateClassSelect('msSelectClass');
  populateClassSelect('tcSelectClass');
}

/**
 * ============================================================================
 * MARKSHEET MODULE LOGIC
 * ============================================================================
 */
function onMsClassSelected(selectedClass) {
  const secSelect = document.getElementById('msSelectSection');
  const studSelect = document.getElementById('msSelectStudent');
  if (!secSelect || !studSelect) return;

  secSelect.innerHTML = '<option value="">-- Select Section --</option>';
  studSelect.innerHTML = '<option value="">-- Choose Student --</option>';

  if (!selectedClass) return;

  // Available sections for this class
  const sections = ['A', 'B', 'C', 'D'];
  sections.forEach(sec => {
    const opt = document.createElement('option');
    opt.value = sec;
    opt.textContent = `Section ${sec}`;
    secSelect.appendChild(opt);
  });
}

function onMsSectionSelected(selectedSection) {
  const selectedClass = document.getElementById('msSelectClass')?.value;
  const studSelect = document.getElementById('msSelectStudent');
  if (!studSelect) return;

  studSelect.innerHTML = '<option value="">-- Choose Student --</option>';
  if (!selectedClass || !selectedSection) return;

  const matching = SchoolDB.students.filter(
    s => s.className === selectedClass && s.section === selectedSection
  );

  if (matching.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No students in this section';
    opt.disabled = true;
    studSelect.appendChild(opt);
    return;
  }

  matching.forEach(st => {
    const opt = document.createElement('option');
    opt.value = st.id;
    opt.textContent = `${st.name} (Roll: ${st.rollNo || 'N/A'})`;
    studSelect.appendChild(opt);
  });
}

function onMsStudentSelected(studentId) {
  if (!studentId) return;
  loadStudentIntoMarksheet(studentId);
}

function selectStudentForMarksheet(studentId) {
  switchView('marksheet');
  loadStudentIntoMarksheet(studentId);
}

function loadStudentIntoMarksheet(studentId) {
  const st = SchoolDB.students.find(s => s.id === studentId);
  if (!st) return;

  ActiveMarksheet.selectedStudentId = st.id;
  ActiveMarksheet.studentName = st.name;
  ActiveMarksheet.fatherName = st.fatherName;
  ActiveMarksheet.motherName = st.motherName;
  ActiveMarksheet.className = st.className;
  ActiveMarksheet.section = st.section;
  ActiveMarksheet.rollNo = st.rollNo;
  ActiveMarksheet.admissionNo = st.admissionNo;
  ActiveMarksheet.dob = st.dob;
  ActiveMarksheet.studentPhoto = st.studentPhoto || '';

  // Update Selector Dropdowns to match
  const clsEl = document.getElementById('msSelectClass');
  const secEl = document.getElementById('msSelectSection');
  const studEl = document.getElementById('msSelectStudent');

  if (clsEl) clsEl.value = st.className;
  onMsClassSelected(st.className);
  if (secEl) secEl.value = st.section;
  onMsSectionSelected(st.section);
  if (studEl) studEl.value = st.id;

  // Update Active Student Chip
  const chipName = document.getElementById('msActiveStudentName');
  const chipRoll = document.getElementById('msActiveStudentRoll');
  if (chipName) chipName.textContent = `${st.name} (${st.className} - Sec ${st.section})`;
  if (chipRoll) chipRoll.textContent = `Roll: ${st.rollNo || '—'} | Adm: ${st.admissionNo || '—'}`;

  // Populate Input Fields
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('inpStudentName', st.name);
  setVal('inpFatherName', st.fatherName);
  setVal('inpMotherName', st.motherName);
  setVal('inpClass', st.className);
  setVal('inpSection', st.section);
  setVal('inpRollNo', st.rollNo);
  setVal('inpAdmissionNo', st.admissionNo);
  setVal('inpDob', st.dob);

  updateMediaEditorPreview('studentPhoto', st.studentPhoto);

  // Check if saved marksheet exists for this student
  if (SchoolDB.marksheets[st.id]) {
    const saved = SchoolDB.marksheets[st.id];
    ActiveMarksheet.subjects = Array.isArray(saved.subjects) ? JSON.parse(JSON.stringify(saved.subjects)) : [];
    ActiveMarksheet.remarks = saved.remarks || '';
    ActiveMarksheet.issueDate = saved.issueDate || '';
    setVal('inpRemarks', ActiveMarksheet.remarks);
    setVal('inpIssueDate', ActiveMarksheet.issueDate);
    showToast(`Loaded saved marksheet for ${st.name}.`);
  } else {
    // Keep empty or preserved subjects
    showToast(`Loaded details for ${st.name}.`);
  }

  renderSubjectEditorTable();
  recalculateAndRenderMarksheet();
}

/**
 * ============================================================================
 * SUBJECT MANAGEMENT (ADD / EDIT / DELETE / REORDER)
 * ============================================================================
 */
function addSubjectRow(name = '', maxMarks = 100, obtMarks = '') {
  ActiveMarksheet.subjects.push({
    id: 'sub_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: name,
    maxMarks: maxMarks,
    obtMarks: obtMarks
  });

  renderSubjectEditorTable();
  recalculateAndRenderMarksheet();
}

function removeSubjectRow(index) {
  ActiveMarksheet.subjects.splice(index, 1);
  renderSubjectEditorTable();
  recalculateAndRenderMarksheet();
}

function moveSubjectUp(index) {
  if (index <= 0) return;
  const temp = ActiveMarksheet.subjects[index];
  ActiveMarksheet.subjects[index] = ActiveMarksheet.subjects[index - 1];
  ActiveMarksheet.subjects[index - 1] = temp;
  renderSubjectEditorTable();
  recalculateAndRenderMarksheet();
}

function moveSubjectDown(index) {
  if (index >= ActiveMarksheet.subjects.length - 1) return;
  const temp = ActiveMarksheet.subjects[index];
  ActiveMarksheet.subjects[index] = ActiveMarksheet.subjects[index + 1];
  ActiveMarksheet.subjects[index + 1] = temp;
  renderSubjectEditorTable();
  recalculateAndRenderMarksheet();
}

function onSubjectFieldChanged(index, field, value) {
  if (!ActiveMarksheet.subjects[index]) return;

  if (field === 'name') {
    ActiveMarksheet.subjects[index].name = value;
  } else if (field === 'maxMarks') {
    ActiveMarksheet.subjects[index].maxMarks = value;
  } else if (field === 'obtMarks') {
    ActiveMarksheet.subjects[index].obtMarks = value;
  }

  // Update grade badge for this row in editor table
  const sub = ActiveMarksheet.subjects[index];
  const grade = calculateSubjectGrade(sub.obtMarks, sub.maxMarks);
  const badgeEl = document.getElementById(`subEditorGrade_${index}`);
  if (badgeEl) badgeEl.textContent = grade;

  recalculateAndRenderMarksheet();
}

function renderSubjectEditorTable() {
  const tbody = document.getElementById('subjectEditorBody');
  const emptyNotice = document.getElementById('subjectsEmptyNotice');
  const table = document.getElementById('subjectEditorTable');

  if (!tbody) return;
  tbody.innerHTML = '';

  if (ActiveMarksheet.subjects.length === 0) {
    if (emptyNotice) emptyNotice.style.display = 'flex';
    if (table) table.style.display = 'none';
    return;
  }

  if (emptyNotice) emptyNotice.style.display = 'none';
  if (table) table.style.display = 'table';

  ActiveMarksheet.subjects.forEach((sub, idx) => {
    const tr = document.createElement('tr');
    const grade = calculateSubjectGrade(sub.obtMarks, sub.maxMarks);

    tr.innerHTML = `
      <td style="font-weight: 700; color: #94a3b8; text-align: center;">${idx + 1}</td>
      <td>
        <input type="text" class="form-control form-control-sm" 
          value="${escapeHtml(sub.name)}" 
          placeholder="e.g. Mathematics" 
          oninput="onSubjectFieldChanged(${idx}, 'name', this.value)">
      </td>
      <td>
        <input type="number" class="form-control form-control-sm" 
          value="${sub.maxMarks}" min="1" max="1000" 
          placeholder="100" style="text-align: center;"
          oninput="onSubjectFieldChanged(${idx}, 'maxMarks', this.value)">
      </td>
      <td>
        <input type="number" class="form-control form-control-sm" 
          value="${sub.obtMarks}" min="0" max="1000" 
          placeholder="Obt" style="text-align: center;"
          oninput="onSubjectFieldChanged(${idx}, 'obtMarks', this.value)">
      </td>
      <td style="text-align: center; font-weight: 800; color: #38bdf8;">
        <span id="subEditorGrade_${idx}">${grade}</span>
      </td>
      <td style="text-align: center;">
        <div style="display: flex; gap: 3px; justify-content: center;">
          <button class="tbl-action-btn" onclick="moveSubjectUp(${idx})" title="Move Up" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
          <button class="tbl-action-btn" onclick="moveSubjectDown(${idx})" title="Move Down" ${idx === ActiveMarksheet.subjects.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
          <button class="tbl-action-btn btn-delete" onclick="removeSubjectRow(${idx})" title="Delete Subject">&times;</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * ============================================================================
 * EVALUATION & GRADING ENGINE
 * ============================================================================
 */
function calculateGradeForPercentage(percentage) {
  const p = parseFloat(percentage);
  if (isNaN(p)) return '-';

  const scale = ActiveMarksheet.gradingScale || SchoolDB.settings.gradingScale || [];
  for (const tier of scale) {
    const min = parseFloat(tier.min);
    const max = parseFloat(tier.max);
    if (p >= min && p <= max) {
      return tier.grade;
    }
  }

  if (p >= 90) return 'A+';
  if (p >= 75) return 'A';
  if (p >= 60) return 'B+';
  if (p >= 45) return 'B';
  if (p >= 33) return 'C';
  return 'D';
}

function calculateSubjectGrade(obt, max) {
  if (obt === '' || obt === null || obt === undefined) return '-';
  const m = parseFloat(max) || 100;
  const o = parseFloat(obt);
  if (isNaN(o) || m <= 0) return '-';
  const perc = (o / m) * 100;
  return calculateGradeForPercentage(perc);
}

function calculateTotalsAndResults() {
  let totalMax = 0;
  let totalObt = 0;
  let hasObtMarks = false;
  let hasFailingSubject = false;

  ActiveMarksheet.subjects.forEach(sub => {
    const max = parseFloat(sub.maxMarks) || 0;
    totalMax += max;

    if (sub.obtMarks !== '' && sub.obtMarks !== null && !isNaN(parseFloat(sub.obtMarks))) {
      const obt = parseFloat(sub.obtMarks);
      totalObt += obt;
      hasObtMarks = true;

      const subPerc = max > 0 ? (obt / max) * 100 : 0;
      if (subPerc < 33) {
        hasFailingSubject = true;
      }
    }
  });

  const percentage = (hasObtMarks && totalMax > 0) ? ((totalObt / totalMax) * 100).toFixed(2) : '0.00';
  const overallGrade = hasObtMarks ? calculateGradeForPercentage(percentage) : '-';

  let finalResult = '-';
  if (ActiveMarksheet.subjects.length > 0 && hasObtMarks) {
    if (!hasFailingSubject && parseFloat(percentage) >= 33) {
      finalResult = 'PASS';
    } else {
      finalResult = 'FAIL';
    }
  }

  return {
    totalMax,
    totalObt: hasObtMarks ? totalObt : 0,
    hasObtMarks,
    percentage,
    overallGrade,
    finalResult
  };
}

/**
 * ============================================================================
 * MARKSHEET FORM SYNC & PREVIEW RENDER
 * ============================================================================
 */
function onDataChanged() {
  // Read School Details
  ActiveMarksheet.schoolName = document.getElementById('inpSchoolName')?.value || '';
  ActiveMarksheet.schoolAddress = document.getElementById('inpSchoolAddress')?.value || '';
  ActiveMarksheet.schoolTagline = document.getElementById('inpSchoolTagline')?.value || '';

  // Read Academic Details
  ActiveMarksheet.academicSession = document.getElementById('inpAcademicSession')?.value || '';
  ActiveMarksheet.examName = document.getElementById('inpExamName')?.value || 'REPORT CARD / MARKSHEET';
  ActiveMarksheet.topMotto = document.getElementById('inpTopMotto')?.value || '';
  ActiveMarksheet.footerQuote = document.getElementById('inpFooterQuote')?.value || '';
  ActiveMarksheet.issueDate = document.getElementById('inpIssueDate')?.value || '';

  // Read Student Details
  ActiveMarksheet.studentName = document.getElementById('inpStudentName')?.value || '';
  ActiveMarksheet.fatherName = document.getElementById('inpFatherName')?.value || '';
  ActiveMarksheet.motherName = document.getElementById('inpMotherName')?.value || '';
  ActiveMarksheet.className = document.getElementById('inpClass')?.value || '';
  ActiveMarksheet.section = document.getElementById('inpSection')?.value || '';
  ActiveMarksheet.rollNo = document.getElementById('inpRollNo')?.value || '';
  ActiveMarksheet.admissionNo = document.getElementById('inpAdmissionNo')?.value || '';
  ActiveMarksheet.dob = document.getElementById('inpDob')?.value || '';

  // Read Remarks
  ActiveMarksheet.remarks = document.getElementById('inpRemarks')?.value || '';

  // Read Watermark
  const chkWatermark = document.getElementById('chkWatermarkToggle');
  ActiveMarksheet.watermarkEnabled = chkWatermark ? chkWatermark.checked : true;

  const rngOpacity = document.getElementById('rngWatermarkOpacity');
  if (rngOpacity) {
    ActiveMarksheet.watermarkOpacity = parseFloat(rngOpacity.value) || 0.07;
    const lbl = document.getElementById('lblOpacityVal');
    if (lbl) lbl.textContent = `${Math.round(ActiveMarksheet.watermarkOpacity * 100)}%`;
  }

  const rngSize = document.getElementById('rngWatermarkSize');
  if (rngSize) {
    ActiveMarksheet.watermarkSize = parseInt(rngSize.value, 10) || 320;
    const lbl = document.getElementById('lblSizeVal');
    if (lbl) lbl.textContent = `${ActiveMarksheet.watermarkSize}px`;
  }

  recalculateAndRenderMarksheet();
}

function recalculateAndRenderMarksheet() {
  const calc = calculateTotalsAndResults();

  // Update Live Display Ribbon
  const totalDisplay = document.getElementById('calcDisplayTotal');
  const percDisplay = document.getElementById('calcDisplayPerc');
  const gradeDisplay = document.getElementById('calcDisplayGrade');
  const resultDisplay = document.getElementById('calcDisplayResult');

  if (totalDisplay) totalDisplay.textContent = `${calc.totalObt} / ${calc.totalMax}`;
  if (percDisplay) percDisplay.textContent = `${calc.percentage}%`;
  if (gradeDisplay) gradeDisplay.textContent = calc.overallGrade;
  if (resultDisplay) {
    resultDisplay.textContent = calc.finalResult;
    resultDisplay.className = `c-val ${calc.finalResult === 'PASS' ? 'highlight-green' : (calc.finalResult === 'FAIL' ? 'highlight-red' : '')}`;
  }

  // Render Exact Reference Marksheet HTML
  const root = document.getElementById('liveMarksheetRenderRoot');
  if (root) {
    root.innerHTML = generateReferenceMarksheetHTML(calc);
  }
}

/**
 * ============================================================================
 * MARKSHEET A4 PORTRAIT HTML BUILDER (PRECISE TABLE DESIGN & LAYOUT)
 * ============================================================================
 */
function generateReferenceMarksheetHTML(calc) {
  const s = ActiveMarksheet;

  // 1. Watermark HTML
  let watermarkHtml = '';
  const watermarkSrc = s.watermarkImage || s.schoolLogo;
  if (s.watermarkEnabled && watermarkSrc) {
    watermarkHtml = `
      <div class="ref-watermark-overlay" style="opacity: ${s.watermarkOpacity};">
        <div class="ref-watermark-inner" style="width: ${s.watermarkSize}px; height: ${s.watermarkSize}px;">
          <img src="${watermarkSrc}" alt="Watermark">
        </div>
      </div>
    `;
  }

  // 2. Student Photo HTML
  let photoHtml = '';
  if (s.studentPhoto) {
    photoHtml = `<img src="${s.studentPhoto}" alt="Student Photo" class="ref-student-photo-img" />`;
  } else {
    photoHtml = `
      <div class="ref-student-photo-placeholder">
        <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="40" r="22" fill="#94a3b8"/>
          <path d="M15 110 C15 80 30 72 50 72 C70 72 85 80 85 110 Z" fill="#94a3b8"/>
        </svg>
        <span>Student Photo</span>
      </div>
    `;
  }

  // 3. School Logo HTML
  let logoHtml = '';
  if (s.schoolLogo) {
    logoHtml = `<img src="${s.schoolLogo}" alt="School Logo">`;
  } else {
    logoHtml = `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" stroke="#08203e" stroke-width="3.5" fill="#ffffff"/>
        <path d="M50 18 L76 34 L76 66 L50 82 L24 66 L24 34 Z" stroke="#c29b38" stroke-width="2.5" fill="none"/>
        <path d="M35 50 L50 38 L65 50 L65 62 L50 50 L35 62 Z" fill="#08203e"/>
        <circle cx="50" cy="50" r="8" fill="#c29b38"/>
      </svg>
    `;
  }

  // 4. Marks Table Rows (Requirement #1 & #2 - Enhanced Spacing, Centering & Total Row)
  let subjectRowsHtml = '';
  let subjectWiseGradesListHtml = '';

  if (s.subjects.length === 0) {
    subjectRowsHtml = `
      <tr>
        <td colspan="5" class="ref-empty-subjects-cell">
          No subjects entered yet. Click "+ Add Subject" in the editor to enter marks.
        </td>
      </tr>
    `;
  } else {
    s.subjects.forEach((sub, idx) => {
      const grade = calculateSubjectGrade(sub.obtMarks, sub.maxMarks);
      subjectRowsHtml += `
        <tr>
          <td class="col-sno">${idx + 1}</td>
          <td class="col-subject">${escapeHtml(sub.name || '—')}</td>
          <td class="col-max">${sub.maxMarks || '—'}</td>
          <td class="col-obt">${sub.obtMarks !== '' && sub.obtMarks !== null ? sub.obtMarks : '—'}</td>
          <td class="col-grade">${grade}</td>
        </tr>
      `;

      subjectWiseGradesListHtml += `
        <div class="ref-sub-grade-item">
          <span class="ref-sub-name">${escapeHtml(sub.name || '—')}</span>
          <span style="color:#64748b; font-weight:700;">:</span>
          <strong class="ref-grade-val">${grade}</strong>
        </div>
      `;
    });
  }

  // 5. Performance Summary Scale Rows
  let scaleRowsHtml = '';
  (s.gradingScale || SchoolDB.settings.gradingScale || []).forEach(tier => {
    scaleRowsHtml += `
      <tr>
        <td><strong>${escapeHtml(tier.grade)}</strong></td>
        <td>${tier.min} – ${tier.max}%</td>
        <td>${escapeHtml(tier.remark)}</td>
      </tr>
    `;
  });

  // 6. Signatures & Seal HTML
  let teacherSignHtml = s.teacherSign ? `<img src="${s.teacherSign}" alt="Teacher Sign">` : '';
  let principalSignHtml = s.principalSign ? `<img src="${s.principalSign}" alt="Principal Sign">` : '';
  let schoolSealHtml = s.schoolSeal ? `<img src="${s.schoolSeal}" alt="School Seal">` : '';

  return `
    <div class="ref-marksheet-sheet">
      <div class="ref-outer-frame">
        <div class="ref-inner-frame">

          <!-- Ornate Corner Flourishes -->
          <div class="ref-corner-bracket corner-tl"></div>
          <div class="ref-corner-bracket corner-tr"></div>
          <div class="ref-corner-bracket corner-bl"></div>
          <div class="ref-corner-bracket corner-br"></div>

          ${watermarkHtml}

          <!-- 1. Top Motto -->
          <div class="ref-top-motto-row">
            <span class="ref-motto-line"></span>
            <span class="ref-motto-text">${escapeHtml(s.topMotto || 'Education Today | Character Tomorrow')}</span>
            <span class="ref-motto-line"></span>
          </div>

          <!-- 2. School Header (Logo | Name & City on One Line | Photo) -->
          <div class="ref-school-header-grid">
            <div class="ref-header-logo-col">
              <div class="ref-school-logo-wrap">
                ${logoHtml}
              </div>
            </div>

            <div class="ref-header-title-col">
              <h1 class="ref-school-title">${escapeHtml(s.schoolName || 'DR. RAM MANOHAR LOHIA PUBLIC SCHOOL')}</h1>
              <h2 class="ref-school-location">${escapeHtml(s.schoolAddress || 'BADLAPUR, JAUNPUR')}</h2>
              <div class="ref-school-tagline">${escapeHtml(s.schoolTagline || '— Discipline | Knowledge | Success —')}</div>
            </div>

            <div class="ref-header-photo-col">
              <div class="ref-student-photo-box">
                ${photoHtml}
              </div>
            </div>
          </div>

          <!-- 3. Title Ribbon Banner -->
          <div class="ref-banner-wrap">
            <div class="ref-main-banner">
              <span class="ref-banner-text">${escapeHtml(s.examName || 'REPORT CARD / MARKSHEET')}</span>
            </div>
          </div>

          <!-- 4. Academic Session Pill -->
          <div class="ref-session-row">
            <div class="ref-session-pill">
              Academic Session : ${escapeHtml(s.academicSession || '2025 - 2026')}
            </div>
          </div>

          <!-- 5. Student Information Box (3-Column Layout, NO Issue Date) -->
          <div class="ref-section-card ref-student-card">
            <div class="ref-section-pill-tab">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              <span>STUDENT INFORMATION</span>
            </div>
            <div class="ref-student-grid">
              <div class="ref-grid-col">
                <div class="ref-info-row"><span class="lbl">Student Name</span><span class="col">:</span><strong class="val">${escapeHtml(s.studentName || '—')}</strong></div>
                <div class="ref-info-row"><span class="lbl">Mother's Name</span><span class="col">:</span><strong class="val">${escapeHtml(s.motherName || '—')}</strong></div>
                <div class="ref-info-row"><span class="lbl">Admission No.</span><span class="col">:</span><strong class="val">${escapeHtml(s.admissionNo || '—')}</strong></div>
              </div>
              <div class="ref-grid-col">
                <div class="ref-info-row"><span class="lbl">Father's Name</span><span class="col">:</span><strong class="val">${escapeHtml(s.fatherName || '—')}</strong></div>
                <div class="ref-info-row"><span class="lbl">Class</span><span class="col">:</span><strong class="val">${escapeHtml(s.className || '—')}</strong></div>
                <div class="ref-info-row"><span class="lbl">Date of Birth</span><span class="col">:</span><strong class="val">${escapeHtml(s.dob || '—')}</strong></div>
              </div>
              <div class="ref-grid-col">
                <div class="ref-info-row"><span class="lbl">Roll Number</span><span class="col">:</span><strong class="val">${escapeHtml(s.rollNo || '—')}</strong></div>
                <div class="ref-info-row"><span class="lbl">Section</span><span class="col">:</span><strong class="val">${escapeHtml(s.section || '—')}</strong></div>
                <div class="ref-info-row"><span class="lbl">Session</span><span class="col">:</span><strong class="val">${escapeHtml(s.academicSession || '2025 - 2026')}</strong></div>
              </div>
            </div>
          </div>

          <!-- 6. Subject-Wise Marks Table (Full Width + Clear Centering + Prominent Total Row) -->
          <div class="ref-marks-section-wrap">
            <div class="ref-marks-tab-row">
              <div class="ref-section-pill-tab static-tab">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>SUBJECT WISE MARKS</span>
              </div>
            </div>
            <div class="ref-section-card ref-marks-card">
              <table class="ref-marks-table">
                <thead>
                  <tr>
                    <th style="width: 8%;">SR. NO.</th>
                    <th style="width: 44%; text-align: left; padding-left: 14px;">SUBJECT</th>
                    <th style="width: 16%;">MAXIMUM MARKS</th>
                    <th style="width: 16%;">MARKS OBTAINED</th>
                    <th style="width: 16%;">GRADE</th>
                  </tr>
                </thead>
                <tbody>
                  ${subjectRowsHtml}
                </tbody>
                <tfoot>
                  <tr class="ref-total-row">
                    <td colspan="2" class="col-total-label">TOTAL MARKS</td>
                    <td class="col-max">${calc.totalMax}</td>
                    <td class="col-obt">${calc.hasObtMarks ? calc.totalObt : '—'}</td>
                    <td class="col-grade">${calc.overallGrade}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- 7. Summary Metrics Ribbon (5 Dedicated Cards: Max, Obt, Perc, Grade, Result) -->
          <div class="ref-summary-ribbon-grid">
            <div class="ref-metric-block">
              <div class="ref-metric-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34c3.08-.63 5.4-3.1 5.8-6.16L20 4H4l.2 4.5c.4 3.06 2.72 5.53 5.8 6.16z"/>
                </svg>
              </div>
              <div class="ref-metric-content">
                <span class="lbl">TOTAL MAX MARKS</span>
                <span class="val">${calc.totalMax}</span>
              </div>
            </div>

            <div class="ref-metric-block">
              <div class="ref-metric-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <div class="ref-metric-content">
                <span class="lbl">TOTAL MARKS OBTAINED</span>
                <span class="val">${calc.hasObtMarks ? calc.totalObt : '0'}</span>
              </div>
            </div>

            <div class="ref-metric-block">
              <div class="ref-metric-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><circle cx="9.5" cy="9.5" r=".5" fill="currentColor"/><circle cx="14.5" cy="14.5" r=".5" fill="currentColor"/>
                </svg>
              </div>
              <div class="ref-metric-content">
                <span class="lbl">PERCENTAGE</span>
                <span class="val">${calc.percentage}%</span>
              </div>
            </div>

            <div class="ref-metric-block">
              <div class="ref-metric-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fbbf24" stroke="#d97706" stroke-width="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div class="ref-metric-content">
                <span class="lbl">OVERALL GRADE</span>
                <span class="val">${calc.overallGrade}</span>
              </div>
            </div>

            <div class="ref-metric-block">
              <div class="ref-metric-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${calc.finalResult === 'PASS' ? '#22c55e' : (calc.finalResult === 'FAIL' ? '#ef4444' : '#94a3b8')}" stroke-width="2">
                  <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
              </div>
              <div class="ref-metric-content">
                <span class="lbl">RESULT</span>
                <span class="val ${calc.finalResult === 'PASS' ? 'val-pass' : (calc.finalResult === 'FAIL' ? 'val-fail' : '')}">
                  ${calc.finalResult}
                </span>
              </div>
            </div>
          </div>

          <!-- 8. Lower 3-Column Evaluation & Remarks Section -->
          <div class="ref-lower-three-grid">
            <div class="ref-lower-card">
              <div class="ref-section-pill-tab">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 17v-4"/><path d="M12 17v-8"/><path d="M17 17v-11"/>
                </svg>
                <span>PERFORMANCE SUMMARY</span>
              </div>
              <table class="ref-mini-scale-table">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Marks Range</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${scaleRowsHtml}
                </tbody>
              </table>
            </div>

            <div class="ref-lower-card">
              <div class="ref-section-pill-tab">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>SUBJECT-WISE GRADE</span>
              </div>
              <div class="ref-sub-grade-list">
                ${subjectWiseGradesListHtml || '<div class="ref-no-grades-txt">No grades computed</div>'}
              </div>
            </div>

            <div class="ref-lower-card ref-remarks-box">
              <div class="ref-remarks-heading">Remarks</div>
              <div class="ref-remarks-body">
                ${escapeHtml(s.remarks || 'Good performance. Keep up the dedication and strive for continuous academic excellence.')}
              </div>
            </div>
          </div>

          <!-- 9. Issue Date Row (Bottom Placement near Signatures) -->
          <div class="ref-issue-date-row">
            <div class="ref-issue-date-wrap">
              <span class="ref-issue-lbl">Date of Issue :</span>
              <span class="ref-issue-val">${s.issueDate ? escapeHtml(s.issueDate) : '<span class="ref-blank-line">_________________________</span>'}</span>
            </div>
          </div>

          <!-- 10. Signatures & Official Seal Section (Bottom Positioned) -->
          <div class="ref-signatures-row">
            <div class="ref-sig-item">
              <div class="ref-sig-img-wrap">
                ${teacherSignHtml}
              </div>
              <div class="ref-sig-line"></div>
              <span class="ref-sig-title">Class Teacher</span>
              <span class="ref-sig-sub">Signature</span>
            </div>

            <div class="ref-seal-item">
              <div class="ref-seal-img-wrap">
                ${schoolSealHtml}
              </div>
              <span class="ref-seal-sub">School Seal</span>
            </div>

            <div class="ref-sig-item">
              <div class="ref-sig-img-wrap">
                ${principalSignHtml}
              </div>
              <div class="ref-sig-line"></div>
              <span class="ref-sig-title">Principal</span>
              <span class="ref-sig-sub">Signature</span>
            </div>
          </div>

          <!-- 11. Bottom Footer Ribbon -->
          <div class="ref-bottom-footer-bar">
            <div class="ref-footer-location">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>${escapeHtml(s.schoolAddress || 'School Campus')}</span>
            </div>
            <div class="ref-footer-quote">
              ${escapeHtml(s.footerQuote || '“Education is the Key to a Brighter Future”')}
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

function saveActiveMarksheet() {
  const studentId = ActiveMarksheet.selectedStudentId;
  if (!studentId) {
    showToast('⚠️ Please select a student first to save their marksheet record.');
    return;
  }

  SchoolDB.marksheets[studentId] = {
    subjects: JSON.parse(JSON.stringify(ActiveMarksheet.subjects)),
    remarks: ActiveMarksheet.remarks,
    issueDate: ActiveMarksheet.issueDate,
    examName: ActiveMarksheet.examName,
    academicSession: ActiveMarksheet.academicSession,
    savedAt: Date.now()
  };

  saveDatabaseToStorage();
  showToast('💾 Marksheet successfully saved to student record!');
}

function clearActiveMarksheet() {
  if (confirm('Reset marksheet fields and subjects?')) {
    ActiveMarksheet.selectedStudentId = null;
    ActiveMarksheet.studentName = '';
    ActiveMarksheet.fatherName = '';
    ActiveMarksheet.motherName = '';
    ActiveMarksheet.className = '';
    ActiveMarksheet.section = '';
    ActiveMarksheet.rollNo = '';
    ActiveMarksheet.admissionNo = '';
    ActiveMarksheet.dob = '';
    ActiveMarksheet.studentPhoto = '';
    ActiveMarksheet.subjects = [];
    ActiveMarksheet.remarks = '';
    ActiveMarksheet.issueDate = '';

    const clearVal = id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    };

    clearVal('inpStudentName');
    clearVal('inpFatherName');
    clearVal('inpMotherName');
    clearVal('inpClass');
    clearVal('inpSection');
    clearVal('inpRollNo');
    clearVal('inpAdmissionNo');
    clearVal('inpDob');
    clearVal('inpRemarks');
    clearVal('inpIssueDate');

    const chipName = document.getElementById('msActiveStudentName');
    const chipRoll = document.getElementById('msActiveStudentRoll');
    if (chipName) chipName.textContent = 'None Selected';
    if (chipRoll) chipRoll.textContent = '';

    updateMediaEditorPreview('studentPhoto', '');
    renderSubjectEditorTable();
    recalculateAndRenderMarksheet();
    showToast('Marksheet reset.');
  }
}

/**
 * ============================================================================
 * TRANSFER CERTIFICATE (TC) MODULE LOGIC
 * ============================================================================
 */
function onTcClassSelected(selectedClass) {
  const secSelect = document.getElementById('tcSelectSection');
  const studSelect = document.getElementById('tcSelectStudent');
  if (!secSelect || !studSelect) return;

  secSelect.innerHTML = '<option value="">-- Select Section --</option>';
  studSelect.innerHTML = '<option value="">-- Choose Student --</option>';

  if (!selectedClass) return;

  ['A', 'B', 'C', 'D'].forEach(sec => {
    const opt = document.createElement('option');
    opt.value = sec;
    opt.textContent = `Section ${sec}`;
    secSelect.appendChild(opt);
  });
}

function onTcSectionSelected(selectedSection) {
  const selectedClass = document.getElementById('tcSelectClass')?.value;
  const studSelect = document.getElementById('tcSelectStudent');
  if (!studSelect) return;

  studSelect.innerHTML = '<option value="">-- Choose Student --</option>';
  if (!selectedClass || !selectedSection) return;

  const matching = SchoolDB.students.filter(
    s => s.className === selectedClass && s.section === selectedSection
  );

  matching.forEach(st => {
    const opt = document.createElement('option');
    opt.value = st.id;
    opt.textContent = `${st.name} (Roll: ${st.rollNo || 'N/A'})`;
    studSelect.appendChild(opt);
  });
}

function onTcStudentSelected(studentId) {
  if (!studentId) return;
  loadStudentIntoTc(studentId);
}

function selectStudentForTC(studentId) {
  switchView('tc');
  loadStudentIntoTc(studentId);
}

function loadStudentIntoTc(studentId) {
  const st = SchoolDB.students.find(s => s.id === studentId);
  if (!st) return;

  ActiveTC.selectedStudentId = st.id;
  ActiveTC.pupilName = st.name;
  ActiveTC.fatherName = st.fatherName;
  ActiveTC.motherName = st.motherName;
  ActiveTC.className = `${st.className} - Section ${st.section}`;
  ActiveTC.dob = st.dob;

  // Update Selector Dropdowns
  const clsEl = document.getElementById('tcSelectClass');
  const secEl = document.getElementById('tcSelectSection');
  const studEl = document.getElementById('tcSelectStudent');

  if (clsEl) clsEl.value = st.className;
  onTcClassSelected(st.className);
  if (secEl) secEl.value = st.section;
  onTcSectionSelected(st.section);
  if (studEl) studEl.value = st.id;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('inpTcPupilName', st.name);
  setVal('inpTcFather', st.fatherName);
  setVal('inpTcMother', st.motherName);
  setVal('inpTcClass', ActiveTC.className);
  setVal('inpTcDob', st.dob);

  if (SchoolDB.tcs[st.id]) {
    const saved = SchoolDB.tcs[st.id];
    ActiveTC.tcNo = saved.tcNo || ActiveTC.tcNo;
    ActiveTC.issueDate = saved.issueDate || ActiveTC.issueDate;
    ActiveTC.reason = saved.reason || '';
    setVal('inpTcNo', ActiveTC.tcNo);
    setVal('inpTcIssueDate', ActiveTC.issueDate);
    setVal('inpTcReason', ActiveTC.reason);
  }

  renderTcPreview();
  showToast(`Loaded TC details for ${st.name}.`);
}

function renderTcPreview() {
  ActiveTC.tcNo = document.getElementById('inpTcNo')?.value || '';
  ActiveTC.pupilName = document.getElementById('inpTcPupilName')?.value || '';
  ActiveTC.fatherName = document.getElementById('inpTcFather')?.value || '';
  ActiveTC.motherName = document.getElementById('inpTcMother')?.value || '';
  ActiveTC.className = document.getElementById('inpTcClass')?.value || '';
  ActiveTC.dob = document.getElementById('inpTcDob')?.value || '';
  ActiveTC.issueDate = document.getElementById('inpTcIssueDate')?.value || '';
  ActiveTC.reason = document.getElementById('inpTcReason')?.value || '';

  const root = document.getElementById('liveTcRenderRoot');
  if (!root) return;

  const schoolName = SchoolDB.settings.schoolName || 'DR. RAM MANOHAR LOHIA PUBLIC SCHOOL';
  const schoolAddress = SchoolDB.settings.schoolAddress || 'BADLAPUR, JAUNPUR';
  const sealHtml = SchoolDB.settings.schoolSeal ? `<img src="${SchoolDB.settings.schoolSeal}" style="width:65px;height:65px;object-fit:contain;">` : '';

  root.innerHTML = `
    <div class="tc-sheet">
      <div class="tc-header">
        <h1>${escapeHtml(schoolName)}</h1>
        <p style="font-weight:700; color:#475569; font-size:0.88rem; margin-top:2px;">${escapeHtml(schoolAddress)}</p>
        <span class="tc-badge">TRANSFER CERTIFICATE</span>
        <div style="font-size:0.82rem; margin-top:10px; font-weight:800;">TC Serial No: ${escapeHtml(ActiveTC.tcNo || '—')}</div>
      </div>

      <div class="tc-body">
        <p>1. Name of the Pupil: <strong>${escapeHtml(ActiveTC.pupilName || '—')}</strong></p>
        <p>2. Father's / Guardian's Name: <strong>${escapeHtml(ActiveTC.fatherName || '—')}</strong></p>
        <p>3. Mother's Name: <strong>${escapeHtml(ActiveTC.motherName || '—')}</strong></p>
        <p>4. Nationality: <strong>Indian</strong></p>
        <p>5. Date of Birth (in Christian Era): <strong>${escapeHtml(ActiveTC.dob || '—')}</strong></p>
        <p>6. Class in which pupil last studied: <strong>${escapeHtml(ActiveTC.className || '—')}</strong></p>
        <p>7. School / Board Annual Examination last taken: <strong>Passed & Cleared</strong></p>
        <p>8. Whether failed, if so once/twice in the same class: <strong>No</strong></p>
        <p>9. Month up to which school dues paid: <strong>All Dues Cleared</strong></p>
        <p>10. Reason for leaving the school: <strong>${escapeHtml(ActiveTC.reason || 'Parent Request / Higher Studies')}</strong></p>
        <p>11. Date of issue of certificate: <strong>${escapeHtml(ActiveTC.issueDate || '—')}</strong></p>
        <p>12. General Conduct: <strong>Good</strong></p>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:2.5rem; text-align:center; font-size:0.82rem;">
        <div>
          <div style="border-top:1.5px solid #0f172a; width:130px; margin-bottom:4px;"></div>
          <span style="font-weight:700;">Prepared by</span>
        </div>

        <div style="display:flex; flex-direction:column; align-items:center;">
          ${sealHtml}
          <div style="border-top:1.5px solid #0f172a; width:130px; margin-top:4px; margin-bottom:4px;"></div>
          <span style="font-weight:700;">School Seal</span>
        </div>

        <div>
          <div style="border-top:1.5px solid #0f172a; width:140px; margin-bottom:4px;"></div>
          <span style="font-weight:700;">Principal (Signature)</span>
        </div>
      </div>
    </div>
  `;
}

function saveActiveTc() {
  const studentId = ActiveTC.selectedStudentId;
  if (!studentId) {
    showToast('⚠️ Please select a student first to save their TC.');
    return;
  }

  SchoolDB.tcs[studentId] = {
    tcNo: ActiveTC.tcNo,
    issueDate: ActiveTC.issueDate,
    reason: ActiveTC.reason,
    savedAt: Date.now()
  };

  saveDatabaseToStorage();
  showToast('💾 Transfer Certificate recorded successfully!');
}

/**
 * ============================================================================
 * SEARCH STUDENT MODULE
 * ============================================================================
 */
function performGlobalSearch(query) {
  const container = document.getElementById('searchResultsContainer');
  if (!container) return;

  const q = (query || '').toLowerCase().trim();
  if (!q) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h4>Search Any Student in the School</h4>
        <p>Type student name, roll number, admission number or class to instantly locate records.</p>
      </div>
    `;
    return;
  }

  const results = (SchoolDB.students || []).filter(s =>
    (s.name || '').toLowerCase().includes(q) ||
    (s.rollNo || '').toLowerCase().includes(q) ||
    (s.admissionNo || '').toLowerCase().includes(q) ||
    (s.fatherName || '').toLowerCase().includes(q) ||
    (s.className || '').toLowerCase().includes(q) ||
    (s.contactNo || '').toLowerCase().includes(q)
  );

  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <h4>No Matching Records Found</h4>
        <p>No student found matching "${escapeHtml(q)}".</p>
      </div>
    `;
    return;
  }

  let rowsHtml = '';
  results.forEach((st, idx) => {
    const avatarHtml = st.studentPhoto
      ? `<img src="${st.studentPhoto}" alt="Avatar">`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;

    rowsHtml += `
      <tr>
        <td style="width: 5%; text-align: center; color: var(--text-muted); font-weight:700;">${idx + 1}</td>
        <td>
          <div class="student-cell">
            <div class="student-avatar">${avatarHtml}</div>
            <div class="student-cell-info">
              <span class="student-cell-name">${escapeHtml(st.name)}</span>
              <span class="student-cell-roll">Roll: ${escapeHtml(st.rollNo || '—')} | Adm: ${escapeHtml(st.admissionNo || '—')}</span>
            </div>
          </div>
        </td>
        <td><span class="badge-pill badge-blue">${escapeHtml(st.className)} - Sec ${escapeHtml(st.section)}</span></td>
        <td>${escapeHtml(st.fatherName || '—')}</td>
        <td>${escapeHtml(st.contactNo || '—')}</td>
        <td style="text-align: right;">
          <div class="table-actions-cell" style="justify-content: flex-end;">
            <button class="btn btn-xs btn-primary" onclick="selectStudentForMarksheet('${st.id}')">📝 Marksheet</button>
            <button class="btn btn-xs btn-outline" onclick="selectStudentForTC('${st.id}')">📜 TC</button>
            <button class="btn btn-xs btn-outline" onclick="editStudent('${st.id}')">✏️ Edit</button>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div style="margin-bottom:0.5rem; font-size:0.8rem; color:#93c5fd; font-weight:700;">
      Found ${results.length} matching student${results.length > 1 ? 's' : ''}:
    </div>
    <div class="students-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th>Student Details</th>
            <th>Class & Section</th>
            <th>Father's Name</th>
            <th>Contact</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * ============================================================================
 * SETTINGS, ASSET UPLOADS & DATA BACKUP/RESTORE
 * ============================================================================
 */
function saveSchoolSettings() {
  const getVal = id => document.getElementById(id)?.value.trim() || '';

  SchoolDB.settings.schoolName = getVal('setSchoolName') || 'Dr. Ram Manohar Lohia Public School';
  SchoolDB.settings.schoolAddress = getVal('setSchoolAddress') || 'Badlapur, Jaunpur';
  SchoolDB.settings.schoolPhone = getVal('setSchoolPhone');
  SchoolDB.settings.schoolEmail = getVal('setSchoolEmail');
  SchoolDB.settings.academicSession = getVal('setAcademicSession') || '2025 - 2026';
  SchoolDB.settings.examName = getVal('setExamName') || 'REPORT CARD / MARKSHEET';
  SchoolDB.settings.schoolTagline = getVal('setSchoolTagline') || '— Discipline | Knowledge | Success —';

  saveDatabaseToStorage();
  syncSettingsToUI();
  initActiveMarksheetDefaults();
  recalculateAndRenderMarksheet();
  renderTcPreview();
  showToast('✅ School settings updated successfully!');
}

function handleMediaUpload(input, key) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];

  if (file.size > 3 * 1024 * 1024) {
    showToast('⚠️ Image size must be under 3MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    ActiveMarksheet[key] = base64;
    SchoolDB.settings[key] = base64;

    updateMediaEditorPreview(key, base64);
    saveDatabaseToStorage();
    recalculateAndRenderMarksheet();
    renderTcPreview();
    showToast(`✅ Uploaded ${key} successfully!`);
  };
  reader.readAsDataURL(file);
}

function removeMedia(key) {
  ActiveMarksheet[key] = '';
  SchoolDB.settings[key] = '';
  updateMediaEditorPreview(key, '');
  saveDatabaseToStorage();
  recalculateAndRenderMarksheet();
  renderTcPreview();
  showToast(`Removed ${key}.`);
}

function updateMediaEditorPreview(key, base64) {
  let wrapId = '';
  let btnRemoveId = '';

  if (key === 'schoolLogo') { wrapId = 'logoPreviewWrap'; btnRemoveId = 'btnRemoveLogo'; }
  else if (key === 'studentPhoto') { wrapId = 'studentPhotoPreviewWrap'; btnRemoveId = 'btnRemovePhoto'; }
  else if (key === 'teacherSign') { wrapId = 'teacherSignPreviewWrap'; btnRemoveId = 'btnRemoveTeacherSign'; }
  else if (key === 'schoolSeal') { wrapId = 'schoolSealPreviewWrap'; btnRemoveId = 'btnRemoveSchoolSeal'; }
  else if (key === 'principalSign') { wrapId = 'principalSignPreviewWrap'; btnRemoveId = 'btnRemovePrincipalSign'; }
  else if (key === 'watermarkImage') { wrapId = 'watermarkPreviewWrap'; btnRemoveId = 'btnRemoveWatermark'; }

  const wrap = document.getElementById(wrapId);
  const btn = document.getElementById(btnRemoveId);

  if (wrap) {
    if (base64) {
      wrap.innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:contain;">`;
    } else {
      wrap.innerHTML = `<span class="media-placeholder-txt">No Image</span>`;
    }
  }

  if (btn) {
    btn.style.display = base64 ? 'inline-flex' : 'none';
  }
}

function exportDatabaseJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(SchoolDB, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `school_db_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('📥 School database backup exported successfully!');
}

function importDatabaseJSON(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported && (imported.students || imported.settings)) {
        SchoolDB = {
          settings: { ...DefaultSettings, ...(imported.settings || {}) },
          students: Array.isArray(imported.students) ? imported.students : [],
          marksheets: imported.marksheets || {},
          tcs: imported.tcs || {}
        };
        saveDatabaseToStorage();
        syncSettingsToUI();
        initActiveMarksheetDefaults();
        populateDropdownSelectors();
        updateDashboardStats();
        renderStudentsTable();
        recalculateAndRenderMarksheet();
        renderTcPreview();
        showToast('✅ Database restored successfully!');
      } else {
        showToast('⚠️ Invalid JSON backup format.');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Could not parse JSON backup file.');
    }
  };
  reader.readAsText(file);
}

function resetDatabaseWithConfirm() {
  if (confirm('⚠️ CAUTION: Are you sure you want to clear ALL student records and marksheets? This cannot be undone.')) {
    SchoolDB.students = [];
    SchoolDB.marksheets = {};
    SchoolDB.tcs = {};
    saveDatabaseToStorage();
    clearActiveMarksheet();
    updateDashboardStats();
    renderStudentsTable();
    populateDropdownSelectors();
    showToast('All database records cleared.');
  }
}

/**
 * ============================================================================
 * CUSTOM GRADING SYSTEM MODAL
 * ============================================================================
 */
function openGradingModal() {
  tempGradingScale = JSON.parse(JSON.stringify(ActiveMarksheet.gradingScale || SchoolDB.settings.gradingScale || []));
  renderGradingScaleModalTable();
  openModal('gradingModal');
}

function renderGradingScaleModalTable() {
  const tbody = document.getElementById('gradingScaleModalBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  tempGradingScale.forEach((tier, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <input type="text" class="form-control form-control-sm" value="${escapeHtml(tier.grade)}" 
          style="font-weight:800; text-align:center;" 
          oninput="tempGradingScale[${idx}].grade = this.value">
      </td>
      <td>
        <input type="number" class="form-control form-control-sm" value="${tier.min}" min="0" max="100" 
          style="text-align:center;" 
          oninput="tempGradingScale[${idx}].min = parseFloat(this.value)||0">
      </td>
      <td>
        <input type="number" class="form-control form-control-sm" value="${tier.max}" min="0" max="100" 
          style="text-align:center;" 
          oninput="tempGradingScale[${idx}].max = parseFloat(this.value)||100">
      </td>
      <td>
        <input type="text" class="form-control form-control-sm" value="${escapeHtml(tier.remark)}" 
          placeholder="e.g. Outstanding" 
          oninput="tempGradingScale[${idx}].remark = this.value">
      </td>
      <td style="text-align:center;">
        <button class="tbl-action-btn btn-delete" onclick="removeGradingTier(${idx})" title="Delete Tier">&times;</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function addGradingTier() {
  tempGradingScale.push({ grade: 'B', min: 45, max: 59, remark: 'Satisfactory' });
  renderGradingScaleModalTable();
}

function removeGradingTier(idx) {
  if (tempGradingScale.length <= 1) {
    showToast('⚠️ At least one grading tier must be present.');
    return;
  }
  tempGradingScale.splice(idx, 1);
  renderGradingScaleModalTable();
}

function loadDefaultGradingPreset() {
  tempGradingScale = [
    { grade: 'A+', min: 90, max: 100, remark: 'Outstanding' },
    { grade: 'A', min: 75, max: 89, remark: 'Very Good' },
    { grade: 'B+', min: 60, max: 74, remark: 'Good' },
    { grade: 'B', min: 45, max: 59, remark: 'Satisfactory' },
    { grade: 'C', min: 33, max: 44, remark: 'Needs Improvement' },
    { grade: 'D', min: 0, max: 32, remark: 'Poor' }
  ];
  renderGradingScaleModalTable();
}

function saveGradingScale() {
  ActiveMarksheet.gradingScale = JSON.parse(JSON.stringify(tempGradingScale));
  SchoolDB.settings.gradingScale = JSON.parse(JSON.stringify(tempGradingScale));
  saveDatabaseToStorage();
  closeModal('gradingModal');
  renderSubjectEditorTable();
  recalculateAndRenderMarksheet();
  showToast('✅ Grading scale saved and applied!');
}

/**
 * ============================================================================
 * PRINT ENGINE & UTILITIES
 * ============================================================================
 */
function triggerDirectPrint() {
  const activeView = document.querySelector('.view-panel.active')?.id;
  if (activeView !== 'viewMarksheet' && activeView !== 'viewTC') {
    switchView('marksheet');
  }
  showToast('Opening print dialog (A4 Portrait)...');
  setTimeout(() => {
    window.print();
  }, 300);
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s, transform 0.4s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
