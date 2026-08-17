const { prisma } = require('../../../db');

const include = { group: true, tutor: true };
const order = [{ weekday: 'asc' }, { order_no: 'asc' }, { start_time: 'asc' }];

module.exports = {
  findMany: (where = {}) => prisma.lesson.findMany({ where, orderBy: order, include }),
  findById: (id) => prisma.lesson.findUnique({ where: { id: Number(id) }, include }),
  findByGroup: (groupId) => prisma.lesson.findMany({ where: { group_id: Number(groupId) }, orderBy: order, include }),
  create: (data) => prisma.lesson.create({ data, include }),
  update: (id, data) => prisma.lesson.update({ where: { id: Number(id) }, data, include }),
  remove: (id) => prisma.lesson.delete({ where: { id: Number(id) } }),
};
