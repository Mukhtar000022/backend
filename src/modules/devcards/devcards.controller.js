const service = require('./devcards.service');

module.exports = {
  // Справочник: возрастные группы + уровни оценивания.
  meta: async (req, res) => res.json({ ageGroups: service.ageGroups(), levels: service.levels() }),

  // Каталог навыков одной группы (kishi | ortangy | eresek).
  catalog: async (req, res) => {
    const cat = service.catalogFor(req.params.ageGroup);
    if (!cat) return res.status(404).json({ error: 'Жас тобы табылмады' });
    res.json(cat);
  },

  // Просмотр карты ребёнка. ?age_group=... — конкретная группа,
  // без параметра — все карты ребёнка. Родитель видит только своего ребёнка.
  view: async (req, res) => {
    const data = await service.view(req.user, req.params.studentId, req.query.age_group);
    res.json(data);
  },

  // Сохранение карты (воспитатель/админ).
  save: async (req, res) => {
    const card = await service.save(req.user, req.params.studentId, req.body || {});
    res.json(card);
  },
};
