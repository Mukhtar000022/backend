const repo = require('./content.repo');

// Разделы, которые админ редактирует в панели:
//   home     — эмодзи и приветствие;
//   contacts — телефоны, адрес, соцсети;
//   theme    — цвета приложения (mobile-app/src/theme.ts);
//   branding — логотип детского сада (см. logo.js);
//   layout   — порядок блоков на главном экране родителя.
const SECTIONS = ['home', 'contacts', 'theme', 'branding', 'layout'];

// Собирает объект контента { home, education, ... } из строк БД.
async function getContent() {
  const rows = await repo.findAll();
  const content = {};
  for (const row of rows) {
    try {
      content[row.key] = JSON.parse(row.data);
    } catch (e) {
      content[row.key] = null;
    }
  }
  return content;
}

function isValidSection(section) {
  return SECTIONS.includes(section);
}

async function updateSection(section, body) {
  await repo.upsert(section, JSON.stringify(body));
  return body;
}

module.exports = { getContent, updateSection, isValidSection, SECTIONS };
