/* Логотип детского сада: загрузка картинки в админ-панели.
 * Приложение показывает его на экране входа и в шапке. */
const logoEditor = (function () {
  let logoUrl = '';

  function init(branding) {
    logoUrl = (branding && branding.logoUrl) || '';
    render();
  }

  function render() {
    const box = document.getElementById('logoBox');
    if (!box) return;
    box.innerHTML = logoUrl
      ? `<img src="${escapeAttr(logoUrl)}" alt="Логотип" class="logo-img">
         <button class="btn-ghost" onclick="logoEditor.remove()">Удалить логотип</button>`
      : `<div class="logo-empty">Логотип пока не загружен</div>`;
    const prev = document.getElementById('logoPreview');
    if (prev) {
      prev.innerHTML = `
        <div style="background:#FFF7F3;border-radius:14px;padding:18px;text-align:center;">
          ${logoUrl
            ? `<img src="${escapeAttr(logoUrl)}" style="width:64px;height:64px;object-fit:contain;">`
            : '<div style="font-size:34px;">🎈</div>'}
          <div style="font-size:14px;font-weight:800;color:#D85A30;margin-top:8px;">Аяла Kids</div>
          <div style="font-size:12px;font-weight:800;color:#993C1D;margin-top:10px;">Вход</div>
        </div>`;
    }
  }

  // Файл читаем как data:URL и отправляем строкой — без multipart.
  function pick(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const msg = document.getElementById('msg-logo');
    msg.className = 'msg';
    msg.textContent = 'Загрузка…';
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api('/api/admin/logo', {
          method: 'POST',
          body: JSON.stringify({ data: reader.result }),
        });
        logoUrl = res.logoUrl;
        render();
        msg.className = 'msg ok';
        msg.textContent = 'Сохранено ✓ — появится в приложении';
      } catch (e) {
        msg.className = 'msg err';
        msg.textContent = 'Ошибка: ' + e.message;
      }
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  async function remove() {
    if (!confirm('Удалить логотип?')) return;
    const msg = document.getElementById('msg-logo');
    try {
      await api('/api/admin/logo', { method: 'DELETE' });
      logoUrl = '';
      render();
      msg.className = 'msg ok';
      msg.textContent = 'Удалено ✓';
    } catch (e) {
      msg.className = 'msg err';
      msg.textContent = 'Ошибка: ' + e.message;
    }
  }

  return { init, pick, remove };
})();

window.logoEditor = logoEditor;
