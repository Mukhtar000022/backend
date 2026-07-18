const API = '';
let TOKEN = localStorage.getItem('ayala_admin_token') || '';

function api(path, opts = {}) {
  opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (TOKEN) opts.headers['Authorization'] = 'Bearer ' + TOKEN;
  return fetch(API + path, opts).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
  });
}

async function login() {
  const pw = document.getElementById('pw').value;
  const msg = document.getElementById('loginMsg');
  try {
    const { token } = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: pw }) });
    TOKEN = token;
    localStorage.setItem('ayala_admin_token', token);
    showApp();
  } catch (e) {
    msg.textContent = e.message;
  }
}

function logout() {
  TOKEN = '';
  localStorage.removeItem('ayala_admin_token');
  document.getElementById('app').style.display = 'none';
  document.getElementById('login').style.display = 'block';
}

async function showApp() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  const content = await api('/api/content');
  ['home', 'education', 'parents', 'courses', 'gallery', 'contacts'].forEach((section) => {
    document.getElementById('ta-' + section).value = JSON.stringify(content[section], null, 2);
  });
  loadLeads();
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + name));
}

async function save(section) {
  const msgEl = document.getElementById('msg-' + section);
  msgEl.className = 'msg';
  msgEl.textContent = '';
  try {
    const value = JSON.parse(document.getElementById('ta-' + section).value);
    await api('/api/admin/content/' + section, { method: 'PUT', body: JSON.stringify(value) });
    msgEl.className = 'msg ok';
    msgEl.textContent = 'Сохранено ✓';
  } catch (e) {
    msgEl.className = 'msg err';
    msgEl.textContent = 'Ошибка: ' + e.message;
  }
}

async function loadLeads() {
  const body = document.getElementById('leadsBody');
  try {
    const leads = await api('/api/admin/leads');
    body.innerHTML = leads.map((l) => `
      <tr>
        <td>${new Date(l.createdAt).toLocaleString('ru-RU')}</td>
        <td>${l.type}</td>
        <td>${escapeHtml(l.name)}</td>
        <td>${escapeHtml(l.phone)}</td>
        <td>${escapeHtml(l.message || '')}</td>
        <td>
          <select onchange="updateStatus('${l.id}', this.value)">
            <option value="new" ${l.status === 'new' ? 'selected' : ''}>новая</option>
            <option value="contacted" ${l.status === 'contacted' ? 'selected' : ''}>связались</option>
            <option value="done" ${l.status === 'done' ? 'selected' : ''}>завершена</option>
          </select>
        </td>
        <td><span class="del" onclick="deleteLead('${l.id}')">Удалить</span></td>
      </tr>
    `).join('') || '<tr><td colspan="7">Пока нет заявок</td></tr>';
  } catch (e) {
    body.innerHTML = `<tr><td colspan="7">Ошибка: ${e.message}</td></tr>`;
  }
}

async function updateStatus(id, status) {
  await api('/api/admin/leads/' + id, { method: 'PATCH', body: JSON.stringify({ status }) });
}

async function deleteLead(id) {
  if (!confirm('Удалить заявку?')) return;
  await api('/api/admin/leads/' + id, { method: 'DELETE' });
  loadLeads();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

if (TOKEN) {
  showApp().catch(() => logout());
}
