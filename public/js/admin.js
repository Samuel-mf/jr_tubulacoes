/* =============================================
   RJ Tubulação de Gás — Admin Dashboard Logic
   ============================================= */

const API = '';
let token = localStorage.getItem('admin_token');
let currentServices = [];

document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    showDashboard();
  }
  initLogin();
  initTabs();
  initServiceForm();
  initUpload();
  initLogout();
});

// ── Auth ─────────────────────────────────────
function initLogin() {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    const errorEl = document.getElementById('loginError');

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        token = data.token;
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_username', data.username);
        showDashboard();
      } else {
        errorEl.style.display = 'block';
        errorEl.textContent = data.error || 'Erro ao fazer login.';
      }
    } catch (err) {
      errorEl.style.display = 'block';
      errorEl.textContent = 'Erro de conexão com o servidor.';
    }
  });
}

function showDashboard() {
  document.getElementById('loginWrapper').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('adminUsername').textContent = 
    localStorage.getItem('admin_username') || 'admin';
  loadAdminServices();
  loadAdminGallery();
  loadContacts();
}

function initLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    token = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    document.getElementById('loginWrapper').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
  });
}

// ── Tabs ─────────────────────────────────────
function initTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// ── Services CRUD ────────────────────────────
async function loadAdminServices() {
  try {
    const res = await fetch(`${API}/api/services/all`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (res.status === 401 || res.status === 403) {
      toast('Sessão expirada. Faça login novamente.', 'error');
      document.getElementById('logoutBtn').click();
      return;
    }

    currentServices = await res.json();
    renderServicesTable();
    populateServiceDropdowns();
  } catch (err) {
    console.error('Erro ao carregar serviços:', err);
  }
}

function renderServicesTable() {
  const tbody = document.getElementById('servicesTableBody');
  tbody.innerHTML = currentServices.map(s => `
    <tr>
      <td>${s.display_order}</td>
      <td><strong>${escapeHtml(s.title)}</strong></td>
      <td class="desc-cell">${escapeHtml(s.description)}</td>
      <td>${s.is_active ? '✅' : '❌'}</td>
      <td>
        <div class="action-btns">
          <button class="btn-sm btn-edit" onclick="editService(${s.id})">Editar</button>
          <button class="btn-sm btn-delete" onclick="deleteService(${s.id}, '${escapeHtml(s.title)}')">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

document.getElementById('addServiceBtn').addEventListener('click', () => {
  document.getElementById('serviceId').value = '';
  document.getElementById('svcTitle').value = '';
  document.getElementById('svcDesc').value = '';
  document.getElementById('svcIcon').value = 'wrench';
  document.getElementById('svcOrder').value = '';
  document.getElementById('modalTitle').innerHTML = 'Novo <span>Serviço</span>';
  openModal('serviceModal');
});

window.editService = function(id) {
  const s = currentServices.find(sv => sv.id === id);
  if (!s) return;
  
  document.getElementById('serviceId').value = s.id;
  document.getElementById('svcTitle').value = s.title;
  document.getElementById('svcDesc').value = s.description;
  document.getElementById('svcIcon').value = s.icon || 'wrench';
  document.getElementById('svcOrder').value = s.display_order || 0;
  document.getElementById('modalTitle').innerHTML = 'Editar <span>Serviço</span>';
  openModal('serviceModal');
};

window.deleteService = async function(id, title) {
  if (!confirm(`Deseja realmente excluir "${title}"?`)) return;
  
  try {
    const res = await fetch(`${API}/api/services/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (res.ok) {
      toast('Serviço removido com sucesso!', 'success');
      loadAdminServices();
    } else {
      toast('Erro ao remover serviço.', 'error');
    }
  } catch (err) {
    toast('Erro de conexão.', 'error');
  }
};

function initServiceForm() {
  const form = document.getElementById('serviceForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('serviceId').value;
    const data = {
      title: document.getElementById('svcTitle').value,
      description: document.getElementById('svcDesc').value,
      icon: document.getElementById('svcIcon').value,
      display_order: parseInt(document.getElementById('svcOrder').value) || 0
    };
    
    try {
      const url = id ? `${API}/api/services/${id}` : `${API}/api/services`;
      const method = id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        toast(id ? 'Serviço atualizado!' : 'Serviço criado!', 'success');
        closeModal('serviceModal');
        loadAdminServices();
      } else {
        const err = await res.json();
        toast(err.error || 'Erro ao salvar.', 'error');
      }
    } catch (err) {
      toast('Erro de conexão.', 'error');
    }
  });
}

// ── Gallery ──────────────────────────────────
function initUpload() {
  const area = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');

  area.addEventListener('click', () => fileInput.click());
  
  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });
  
  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });
  
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  
  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });
}

async function handleFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      toast(`${file.name} não é uma imagem.`, 'error');
      continue;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast(`${file.name} excede 10MB.`, 'error');
      continue;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('caption', file.name.replace(/\.[^/.]+$/, ''));
    
    try {
      const res = await fetch(`${API}/api/gallery`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      
      if (res.ok) {
        toast(`${file.name} enviada com sucesso!`, 'success');
        loadAdminGallery();
      } else {
        toast(`Erro ao enviar ${file.name}.`, 'error');
      }
    } catch (err) {
      toast('Erro de conexão.', 'error');
    }
  }
}

async function loadAdminGallery() {
  try {
    const res = await fetch(`${API}/api/gallery`);
    const images = await res.json();
    
    const grid = document.getElementById('adminGalleryGrid');
    
    if (images.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px;">Nenhuma imagem na galeria.</p>';
      return;
    }
    
    grid.innerHTML = images.map(img => `
      <div class="gallery-admin-item">
        <img src="${img.image_path}" alt="${escapeHtml(img.caption || '')}" loading="lazy" />
        <div class="overlay">
          <button class="btn-sm btn-delete" onclick="deleteGalleryItem(${img.id})">Excluir</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Erro ao carregar galeria:', err);
  }
}

window.deleteGalleryItem = async function(id) {
  if (!confirm('Remover esta imagem?')) return;
  
  try {
    const res = await fetch(`${API}/api/gallery/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (res.ok) {
      toast('Imagem removida!', 'success');
      loadAdminGallery();
    } else {
      toast('Erro ao remover imagem.', 'error');
    }
  } catch (err) {
    toast('Erro de conexão.', 'error');
  }
};

// ── Contacts ─────────────────────────────────
async function loadContacts() {
  try {
    const res = await fetch(`${API}/api/contact`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (!res.ok) return;
    
    const contacts = await res.json();
    const list = document.getElementById('contactsList');
    
    if (contacts.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">Nenhum contato recebido.</p>';
      return;
    }
    
    list.innerHTML = contacts.map(c => `
      <div class="contact-card ${c.is_read ? '' : 'unread'}">
        <div class="contact-header">
          <div class="contact-name">${escapeHtml(c.name)}</div>
          <div class="contact-date">${formatDate(c.created_at)}</div>
        </div>
        <div class="contact-meta">
          <span>📞 ${escapeHtml(c.phone || '—')}</span>
          <span>✉️ ${escapeHtml(c.email || '—')}</span>
          ${c.service_interest ? `<span>🔧 ${escapeHtml(c.service_interest)}</span>` : ''}
        </div>
        ${c.message ? `<div class="contact-message">${escapeHtml(c.message)}</div>` : ''}
        <div class="action-btns" style="margin-top:12px;">
          ${!c.is_read ? `<button class="btn-sm btn-edit" onclick="markRead(${c.id})">Marcar como Lido</button>` : ''}
          <button class="btn-sm btn-delete" onclick="deleteContact(${c.id})">Excluir</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Erro ao carregar contatos:', err);
  }
}

window.markRead = async function(id) {
  try {
    await fetch(`${API}/api/contact/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    loadContacts();
  } catch (err) {
    toast('Erro ao atualizar.', 'error');
  }
};

window.deleteContact = async function(id) {
  if (!confirm('Remover este contato?')) return;
  try {
    await fetch(`${API}/api/contact/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    toast('Contato removido.', 'success');
    loadContacts();
  } catch (err) {
    toast('Erro de conexão.', 'error');
  }
};

// ── Helpers ──────────────────────────────────
function populateServiceDropdowns() {
  const select = document.getElementById('uploadService');
  select.innerHTML = '<option value="">Nenhum</option>';
  currentServices.forEach(s => {
    select.innerHTML += `<option value="${s.id}">${escapeHtml(s.title)}</option>`;
  });
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

window.closeModal = function(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
};

function toast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `${type === 'success' ? '✓' : '✕'} ${message}`;
  container.appendChild(el);
  
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
