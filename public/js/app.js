// CREDENTIALS & DEFAULTS
const ADMIN_USER = "Nazwa";
const ADMIN_PASS = "nazwa123";

let profileData = {};
let materiData = [];
let tugasData = [];

// INITIAL LOAD
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("educlass_logged_in") === "true") {
        showDashboard();
    } else {
        document.getElementById("loginPage").style.display = "flex";
        document.getElementById("dashboardPage").style.display = "none";
    }
    
    if (localStorage.getItem("educlass_theme") === "dark") {
        document.body.classList.add("dark-mode");
        const icon = document.getElementById("themeIcon");
        if (icon) icon.className = "fa-solid fa-sun";
    }

    startRealtimeClock();
});

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("educlass_theme", isDark ? "dark" : "light");

    const icon = document.getElementById("themeIcon");
    if (icon) {
        icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }
}

function handleMainLogin(e) {
    e.preventDefault();
    const user = document.getElementById("loginUsername").value.trim();
    const pass = document.getElementById("loginPassword").value;

    if ((user.toLowerCase() === ADMIN_USER.toLowerCase()) && pass === ADMIN_PASS) {
        if (document.getElementById("rememberMe").checked) {
            localStorage.setItem("educlass_logged_in", "true");
        }
        showDashboard();
    } else {
        alert("Username atau Password salah! 🥺 (Gunakan: Nazwa / nazwa123)");
    }
}

function handleLogout() {
    localStorage.removeItem("educlass_logged_in");
    document.getElementById("dashboardPage").style.display = "none";
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("mainLoginForm").reset();
}

function showDashboard() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("dashboardPage").style.display = "block";
    fetchDataFromServer();
}

function togglePasswordVisibility() {
    const passInput = document.getElementById("loginPassword");
    const eyeIcon = document.getElementById("togglePasswordIcon");

    if (passInput.type === "password") {
        passInput.type = "text";
        eyeIcon.classList.remove("fa-eye-slash");
        eyeIcon.classList.add("fa-eye");
    } else {
        passInput.type = "password";
        eyeIcon.classList.remove("fa-eye");
        eyeIcon.classList.add("fa-eye-slash");
    }
}

function startRealtimeClock() {
    function updateClock() {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const wibTime = new Date(utc + (3600000 * 7));

        const hours = String(wibTime.getHours()).padStart(2, '0');
        const minutes = String(wibTime.getMinutes()).padStart(2, '0');
        const seconds = String(wibTime.getSeconds()).padStart(2, '0');
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = wibTime.toLocaleDateString('id-ID', options);

        const clockEl = document.getElementById("realtimeClock");
        const dateEl = document.getElementById("realtimeDate");

        if (clockEl) clockEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${hours}:${minutes}:${seconds} WIB`;
        if (dateEl) dateEl.innerText = dateString;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

function fetchDataFromServer() {
    fetch('/api/data')
        .then(res => res.json())
        .then(data => {
            profileData = data.profile || {};
            materiData = data.materi || [];
            tugasData = data.tugas || [];
            loadProfile();
            updateDashboardStats();
            populateMatkulFilters();
            renderData();
            checkDeadlineNotifications();
        })
        .catch(err => console.error("Gagal mengambil data dari server:", err));
}

function checkDeadlineNotifications() {
    const alertsContainer = document.getElementById("dashboardDeadlineAlerts");
    if (!alertsContainer) return;
    alertsContainer.innerHTML = "";

    const now = new Date();

    tugasData.forEach(tugas => {
        if (tugas.deadline && tugas.status !== "Selesai") {
            const dl = new Date(tugas.deadline);
            const diffHours = (dl - now) / (1000 * 60 * 60);

            if (diffHours > 0 && diffHours <= 48) {
                showToast(`⚠️ Deadline Dekat: ${tugas.judul} (${Math.round(diffHours)} jam lagi!)`, 'warning');

                alertsContainer.innerHTML += `
                    <div class="alert-item">
                        <div>
                            <strong>${tugas.matkul}</strong> - ${tugas.judul}
                            <br><small style="color:#e11d48;"><i class="fa-solid fa-clock"></i> Deadline: ${new Date(tugas.deadline).toLocaleString('id-ID')}</small>
                        </div>
                        <button class="btn btn-sm btn-pink-cute" onclick="switchSection('tugas')">Lihat</button>
                    </div>
                `;
            } else if (diffHours < 0) {
                alertsContainer.innerHTML += `
                    <div class="alert-item" style="background:#ffe4e6;">
                        <div>
                            <strong style="color:#e11d48;">Terlambat:</strong> ${tugas.judul} (${tugas.matkul})
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="switchSection('tugas')">Detail</button>
                    </div>
                `;
            }
        }
    });

    if (alertsContainer.innerHTML === "") {
        alertsContainer.innerHTML = "<p style='color:#64748b; font-size:0.9rem;'>Tidak ada deadline mendesak saat ini. Aman! 🎉</p>";
    }
}

function showToast(msg, type = 'info') {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid fa-bell"></i> <span>${msg}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function updateDashboardStats() {
    document.getElementById("statTotalMateri").innerText = materiData.length;
    document.getElementById("statTotalTugas").innerText = tugasData.length;

    const selesai = tugasData.filter(t => t.status === "Selesai").length;
    const belumSelesai = tugasData.filter(t => t.status !== "Selesai").length;

    document.getElementById("statTugasSelesai").innerText = selesai;
    document.getElementById("statTugasBelumSelesai").innerText = belumSelesai;
}

function switchSection(secId) {
    document.querySelectorAll(".page-section").forEach(sec => sec.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

    if (secId === 'dashboard') {
        document.getElementById("sectionDashboard").classList.add("active");
        document.querySelectorAll(".nav-item")[0].classList.add("active");
    } else if (secId === 'materi') {
        document.getElementById("sectionMateri").classList.add("active");
        document.querySelectorAll(".nav-item")[1].classList.add("active");
    } else if (secId === 'tugas') {
        document.getElementById("sectionTugas").classList.add("active");
        document.querySelectorAll(".nav-item")[2].classList.add("active");
    }
}

function populateMatkulFilters() {
    const matkulMateriSel = document.getElementById("filterMatkulMateri");
    const matkulTugasSel = document.getElementById("filterMatkulTugas");

    const allMatkulMateri = [...new Set(materiData.map(m => m.matkul))];
    const allMatkulTugas = [...new Set(tugasData.map(t => t.matkul))];

    if (matkulMateriSel) {
        matkulMateriSel.innerHTML = '<option value="ALL">Semua Mata Kuliah</option>';
        allMatkulMateri.forEach(m => {
            matkulMateriSel.innerHTML += `<option value="${m}">${m}</option>`;
        });
    }

    if (matkulTugasSel) {
        matkulTugasSel.innerHTML = '<option value="ALL">Semua Mata Kuliah</option>';
        allMatkulTugas.forEach(t => {
            matkulTugasSel.innerHTML += `<option value="${t}">${t}</option>`;
        });
    }
}

function loadProfile() {
    document.getElementById("sidebarNama").innerText = profileData.nama || "Nazwa";
    document.getElementById("sidebarNimClass").innerText = `TI24D`;
}

function openProfileModal() {
    document.getElementById("inputNama").value = profileData.nama || '';
    document.getElementById("inputNim").value = profileData.nim || '';
    document.getElementById("inputKelas").value = profileData.kelas || '';
    document.getElementById("profileModal").style.display = "flex";
}

function saveProfile(e) {
    e.preventDefault();
    const payload = {
        nama: document.getElementById("inputNama").value,
        nim: document.getElementById("inputNim").value,
        kelas: document.getElementById("inputKelas").value
    };

    fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(res => {
        profileData = res.profile;
        loadProfile();
        closeModal("profileModal");
        alert("Profil berhasil diperbarui! ✨");
    })
    .catch(err => alert("Gagal memperbarui profil"));
}

function applyFilters() {
    renderData();
}

function renderData() {
    const materiContainer = document.getElementById("materiList");
    const tugasContainer = document.getElementById("tugasList");

    const filterMatkulM = document.getElementById("filterMatkulMateri")?.value || "ALL";
    const filterMatkulT = document.getElementById("filterMatkulTugas")?.value || "ALL";

    let filteredMateri = materiData;
    if (filterMatkulM !== "ALL") {
        filteredMateri = materiData.filter(m => m.matkul === filterMatkulM);
    }

    materiContainer.innerHTML = "";
    if (filteredMateri.length === 0) {
        materiContainer.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:#64748b; padding: 20px;'>Tidak ada materi perkuliahan 📚</p>";
    } else {
        filteredMateri.forEach((item) => {
            materiContainer.innerHTML += createCardHTML(item, 'materi');
        });
    }

    let filteredTugas = tugasData;
    if (filterMatkulT !== "ALL") {
        filteredTugas = tugasData.filter(t => t.matkul === filterMatkulT);
    }

    tugasContainer.innerHTML = "";
    if (filteredTugas.length === 0) {
        tugasContainer.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:#64748b; padding: 20px;'>Tidak ada deadline tugas 📝</p>";
    } else {
        filteredTugas.forEach((item) => {
            tugasContainer.innerHTML += createCardHTML(item, 'tugas');
        });
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getDownloadUrl(filePath, fileName) {
    if (!filePath) return '#';
    return `/api/download?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName || 'file')}`;
}

function createCardHTML(item, type) {
    const isTugas = type === 'tugas';
    
    // File lampiran (soal tugas / file materi)
    let lampiranHTML = '';
    if (item.filePath) {
        const downloadUrl = getDownloadUrl(item.filePath, item.fileName);
        lampiranHTML = `
            <div class="card-file-box">
                <div class="file-box-title">
                    <i class="fa-solid fa-paperclip"></i> ${isTugas ? 'Lampiran Soal / Tugas' : 'File Materi'}
                </div>
                <div class="file-box-name" title="${escapeHtml(item.fileName)}">${escapeHtml(item.fileName)}</div>
                <div class="file-box-actions">
                    <button type="button" class="btn btn-sm btn-primary-cute" data-path="${escapeHtml(item.filePath)}" data-name="${escapeHtml(item.fileName)}" onclick="previewFile(this.dataset.path, this.dataset.name)">
                        <i class="fa-solid fa-eye"></i> Lihat
                    </button>
                    <a href="${downloadUrl}" class="btn btn-sm btn-secondary">
                        <i class="fa-solid fa-download"></i> Unduh
                    </a>
                </div>
            </div>
        `;
    } else if (item.fileName) {
        lampiranHTML = `<div style="font-size: 0.8rem; color:#64748b; margin: 8px 0;"><i class="fa-solid fa-paperclip"></i> ${escapeHtml(item.fileName)}</div>`;
    }

    let deadlineHTML = isTugas && item.deadline ? `<div class="card-deadline"><i class="fa-regular fa-clock"></i> Deadline: ${new Date(item.deadline).toLocaleString('id-ID')}</div>` : '';

    let statusBadgeHTML = '';
    let statusActionHTML = '';
    let submissionBoxHTML = '';

    if (isTugas) {
        const st = item.status || "Belum Dikerjakan";
        let badgeClass = "status-belum-dikerjakan";
        if (st === "Sedang Dikerjakan") badgeClass = "status-sedang-dikerjakan";
        else if (st === "Selesai") badgeClass = "status-selesai";
        else if (st === "Terlambat") badgeClass = "status-terlambat";

        statusBadgeHTML = `
            <div style="margin-top:8px;">
                <span class="status-badge-custom ${badgeClass}">${st}</span>
                <select class="cute-select" style="font-size:0.75rem; padding:3px 8px;" onchange="updateTugasStatus('${item.id}', this.value)">
                    <option value="Belum Dikerjakan" ${st === 'Belum Dikerjakan' ? 'selected' : ''}>Belum Dikerjakan</option>
                    <option value="Sedang Dikerjakan" ${st === 'Sedang Dikerjakan' ? 'selected' : ''}>Sedang Dikerjakan</option>
                    <option value="Selesai" ${st === 'Selesai' ? 'selected' : ''}>Selesai</option>
                    <option value="Terlambat" ${st === 'Terlambat' ? 'selected' : ''}>Terlambat</option>
                </select>
            </div>
        `;

        const historyList = item.history || [];
        const historyCount = historyList.length;

        // Tampilkan kotak file tugas yang telah dikumpulkan jika ada
        if (historyCount > 0) {
            const latest = historyList[0];
            const dateStr = new Date(latest.date).toLocaleString('id-ID');
            const downloadUrl = getDownloadUrl(latest.filePath, latest.fileName);

            submissionBoxHTML = `
                <div class="card-file-box submitted">
                    <div class="file-box-title">
                        <i class="fa-solid fa-circle-check"></i> File Tugas Dikumpulkan
                    </div>
                    <div class="file-box-name" title="${escapeHtml(latest.fileName)}">${escapeHtml(latest.fileName)}</div>
                    <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 8px;">
                        <i class="fa-regular fa-clock"></i> Diupload: ${dateStr}
                    </div>
                    <div class="file-box-actions">
                        <button type="button" class="btn btn-sm btn-primary-cute" data-path="${escapeHtml(latest.filePath)}" data-name="${escapeHtml(latest.fileName)}" onclick="previewFile(this.dataset.path, this.dataset.name)">
                            <i class="fa-solid fa-eye"></i> Lihat
                        </button>
                        <a href="${downloadUrl}" class="btn btn-sm btn-secondary">
                            <i class="fa-solid fa-download"></i> Unduh
                        </a>
                    </div>
                </div>
            `;
        }

        statusActionHTML = `
            <div style="margin-top: 10px; display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn btn-sm btn-pink-cute" data-id="${escapeHtml(item.id)}" data-judul="${escapeHtml(item.judul)}" onclick="openSubmitModal(this.dataset.id, this.dataset.judul)">
                    <i class="fa-solid fa-upload"></i> ${historyCount > 0 ? 'Upload Ulang' : 'Upload Tugas'}
                </button>
                <button class="btn btn-sm btn-secondary" onclick="openHistoryModal('${item.id}')">
                    <i class="fa-solid fa-clock-rotate-left"></i> Riwayat (${historyCount})
                </button>
            </div>
        `;
    }

    let editDeleteBtns = `
        <div>
            <button class="btn btn-sm btn-secondary" onclick="openFormModal('${type}', '${item.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteData('${type}', '${item.id}')" title="Hapus"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `;

    return `
        <div class="card ${isTugas ? 'tugas-card' : ''}">
            <div>
                <span class="card-tag">${escapeHtml(item.matkul)}</span>
                <h3>${escapeHtml(item.judul)}</h3>
                ${deadlineHTML}
                ${statusBadgeHTML}
                <p>${escapeHtml(item.catatan || '')}</p>
            </div>
            <div>
                ${lampiranHTML}
                ${submissionBoxHTML}
                ${statusActionHTML}
                <div class="card-footer">
                    <span style="font-size:0.75rem; color:#94a3b8; font-weight:600;">#${type.toUpperCase()}</span>
                    ${editDeleteBtns}
                </div>
            </div>
        </div>
    `;
}

function updateTugasStatus(tugasId, newStatus) {
    fetch(`/api/tugas/status/${tugasId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(res => {
        fetchDataFromServer();
    });
}

function openFormModal(dataType, itemId = null) {
    document.getElementById("formDataType").value = dataType;
    const isEdit = itemId !== null;

    document.getElementById("modalFormTitle").innerText = isEdit ? `Edit ${dataType.toUpperCase()} ✨` : `Upload/Tambah ${dataType.toUpperCase()} ✨`;
    document.getElementById("editItemId").value = isEdit ? itemId : "";

    document.getElementById("fieldDeadline").style.display = dataType === 'tugas' ? 'block' : 'none';
    document.getElementById("fieldStatus").style.display = dataType === 'tugas' ? 'block' : 'none';

    if (isEdit) {
        const list = dataType === 'materi' ? materiData : tugasData;
        const item = list.find(i => i.id === itemId);
        if (item) {
            document.getElementById("formMatkul").value = item.matkul;
            document.getElementById("formJudul").value = item.judul;
            document.getElementById("formCatatan").value = item.catatan || "";
            if (dataType === 'tugas') {
                document.getElementById("formDeadline").value = item.deadline || "";
                document.getElementById("formStatus").value = item.status || "Belum Dikerjakan";
            }
            document.getElementById("fileInfoText").innerText = item.fileName ? `File tersimpan: ${item.fileName}` : "";
        }
    } else {
        document.getElementById("dataForm").reset();
        document.getElementById("fileInfoText").innerText = "";
    }

    document.getElementById("formModal").style.display = "flex";
}

function handleSaveData(e) {
    e.preventDefault();
    const dataType = document.getElementById("formDataType").value;
    const itemId = document.getElementById("editItemId").value;
    const matkul = document.getElementById("formMatkul").value;
    const judul = document.getElementById("formJudul").value;
    const catatan = document.getElementById("formCatatan").value;
    const deadline = document.getElementById("formDeadline").value;
    const status = document.getElementById("formStatus").value;
    const fileInput = document.getElementById("formFile");

    const formData = new FormData();
    formData.append("type", dataType);
    formData.append("matkul", matkul);
    formData.append("judul", judul);
    formData.append("catatan", catatan);
    if (dataType === 'tugas') {
        formData.append("deadline", deadline);
        formData.append("status", status);
    }
    
    if (fileInput.files && fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
    }

    let url = '/api/item';
    let method = 'POST';

    if (itemId !== "") {
        url = `/api/item/${dataType}/${itemId}`;
        method = 'PUT';
    }

    fetch(url, {
        method: method,
        body: formData
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        closeModal("formModal");
        fetchDataFromServer();
    })
    .catch(err => {
        alert("Terjadi kesalahan saat menyimpan data.");
    });
}

function openSubmitModal(tugasId, tugasJudul) {
    document.getElementById("submitTaskId").value = tugasId;
    document.getElementById("submitTaskTitle").innerText = `Tugas: ${tugasJudul}`;
    document.getElementById("submitTaskForm").reset();
    document.getElementById("submitModal").style.display = "flex";
}

function handleUploadTugas(e) {
    e.preventDefault();
    const tugasId = document.getElementById("submitTaskId").value;
    const fileInput = document.getElementById("submitFile");

    if (!fileInput.files || !fileInput.files[0]) {
        alert("Pilih file terlebih dahulu!");
        return;
    }

    const formData = new FormData();
    formData.append("type", "pengumpulan");
    formData.append("file", fileInput.files[0]);

    fetch(`/api/submit-tugas/${tugasId}`, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        closeModal("submitModal");
        fetchDataFromServer();
    })
    .catch(err => alert("Gagal mengumpulkan tugas."));
}

function openHistoryModal(tugasId) {
    const tugas = tugasData.find(t => t.id === tugasId);
    if (!tugas) return;

    document.getElementById("historyTaskTitle").innerText = `Tugas: ${tugas.judul} (${tugas.matkul})`;
    const container = document.getElementById("historyListContainer");
    container.innerHTML = "";

    const historyList = tugas.history || [];

    if (historyList.length === 0) {
        container.innerHTML = "<p style='color:#64748b; text-align:center; padding: 20px;'>Belum ada riwayat pengumpulan tugas 📜</p>";
    } else {
        historyList.forEach((h, idx) => {
            const dateStr = new Date(h.date).toLocaleString('id-ID');
            const downloadUrl = getDownloadUrl(h.filePath, h.fileName);
            container.innerHTML += `
                <div class="history-item">
                    <div style="overflow: hidden; text-overflow: ellipsis; max-width: 55%;">
                        <strong>#${historyList.length - idx} ${escapeHtml(h.fileName)}</strong>
                        <br><small style="color:#64748b;"><i class="fa-regular fa-clock"></i> ${dateStr}</small>
                    </div>
                    <div style="display:flex; gap: 6px; align-items:center; flex-shrink: 0;">
                        <button type="button" class="btn btn-sm btn-primary-cute" data-path="${escapeHtml(h.filePath)}" data-name="${escapeHtml(h.fileName)}" onclick="previewFile(this.dataset.path, this.dataset.name)">
                            <i class="fa-solid fa-eye"></i> Lihat
                        </button>
                        <a href="${downloadUrl}" class="btn btn-sm btn-secondary">
                            <i class="fa-solid fa-download"></i> Unduh
                        </a>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById("historyModal").style.display = "flex";
}

function previewFile(filePath, fileName) {
    if (!filePath) {
        alert("File tidak ditemukan!");
        return;
    }

    const safeName = fileName || 'Berkas';
    const ext = safeName.split('.').pop().toLowerCase();
    const modalSubtitle = document.getElementById("previewModalSubtitle");
    const modalBody = document.getElementById("previewModalBody");
    const openTabBtn = document.getElementById("previewOpenTabBtn");
    const downloadBtn = document.getElementById("previewDownloadBtn");

    modalSubtitle.innerText = safeName;
    openTabBtn.href = filePath;
    downloadBtn.href = getDownloadUrl(filePath, safeName);

    modalBody.innerHTML = '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        modalBody.innerHTML = `
            <div class="preview-img-wrapper">
                <img src="${filePath}" alt="${escapeHtml(safeName)}" class="preview-img">
            </div>
        `;
    } else if (ext === 'pdf') {
        modalBody.innerHTML = `
            <div class="preview-iframe-wrapper">
                <iframe src="${filePath}#toolbar=1" class="preview-iframe" title="${escapeHtml(safeName)}"></iframe>
            </div>
        `;
    } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
        modalBody.innerHTML = `
            <video controls class="preview-video">
                <source src="${filePath}">
                Browser Anda tidak mendukung pemutar video.
            </video>
        `;
    } else if (['mp3', 'wav', 'aac'].includes(ext)) {
        modalBody.innerHTML = `
            <div style="padding: 25px; text-align: center; width: 100%;">
                <audio controls style="width: 100%; max-width: 400px;">
                    <source src="${filePath}">
                </audio>
            </div>
        `;
    } else {
        // Dokumen Office (DOCX, PPTX, XLSX) atau ZIP/RAR
        let iconClass = "fa-file-lines";
        let typeName = "Dokumen";

        if (['doc', 'docx'].includes(ext)) {
            iconClass = "fa-file-word";
            typeName = "Microsoft Word";
        } else if (['ppt', 'pptx'].includes(ext)) {
            iconClass = "fa-file-powerpoint";
            typeName = "Microsoft PowerPoint";
        } else if (['xls', 'xlsx'].includes(ext)) {
            iconClass = "fa-file-excel";
            typeName = "Microsoft Excel";
        } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            iconClass = "fa-file-zipper";
            typeName = "Arsip Terkompresi";
        }

        modalBody.innerHTML = `
            <div class="preview-fallback-box">
                <div class="fallback-icon"><i class="fa-solid ${iconClass}"></i></div>
                <h4>${escapeHtml(safeName)}</h4>
                <p>File ini merupakan berkas <strong>${typeName} (.${ext.toUpperCase()})</strong>. Format ini dapat dibuka dengan aplikasi pembaca dokumen di perangkat Anda atau diunduh langsung.</p>
                <div style="margin-top: 18px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <a href="${getDownloadUrl(filePath, safeName)}" class="btn btn-pink-cute">
                        <i class="fa-solid fa-cloud-arrow-down"></i> Unduh File Sekarang
                    </a>
                    <a href="${filePath}" target="_blank" class="btn btn-secondary">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Langsung
                    </a>
                </div>
            </div>
        `;
    }

    document.getElementById("filePreviewModal").style.display = "flex";
}

function deleteData(type, id) {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        fetch(`/api/item/${type}/${id}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(res => {
            alert(res.message);
            fetchDataFromServer();
        })
        .catch(err => alert("Gagal menghapus data"));
    }
}

function filterData() {
    const keyword = document.getElementById("searchInput").value.toLowerCase();
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        if (text.includes(keyword)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};
