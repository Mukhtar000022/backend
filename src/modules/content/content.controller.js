const service = require('./content.service');
const { saveImage, removeImage } = require('../../lib/imageStore');

module.exports = {
  getContent: async (req, res) => res.json(await service.getContent()),

  // Логотип детского сада: картинка приходит как data:URL (base64).
  // Старый файл удаляем, чтобы не копить мусор в uploads.
  uploadLogo: async (req, res) => {
    const url = saveImage((req.body || {}).data, { maxBytes: 3 * 1024 * 1024, prefix: 'logo-' });
    const current = await service.getContent();
    const previous = current.branding && current.branding.logoUrl;
    await service.updateSection('branding', { ...(current.branding || {}), logoUrl: url });
    if (previous && previous !== url) removeImage(previous);
    res.status(201).json({ ok: true, logoUrl: url });
  },

  removeLogo: async (req, res) => {
    const current = await service.getContent();
    const previous = current.branding && current.branding.logoUrl;
    await service.updateSection('branding', { ...(current.branding || {}), logoUrl: '' });
    if (previous) removeImage(previous);
    res.json({ ok: true });
  },

  updateSection: async (req, res) => {
    const { section } = req.params;
    if (!service.isValidSection(section)) {
      return res.status(404).json({ error: 'Раздел не найден' });
    }
    const content = await service.updateSection(section, req.body);
    res.json({ ok: true, content });
  },
};
