const { prisma } = require('../../../db');

const include = { parent: true, group: true };

module.exports = {
  findMany: (where = {}) => prisma.student.findMany({ where, orderBy: { id: 'asc' }, include }),
  findById: (id) => prisma.student.findUnique({ where: { id: Number(id) }, include }),
  create: (data) => prisma.student.create({ data, include }),
  update: (id, data) => prisma.student.update({ where: { id: Number(id) }, data, include }),
  remove: (id) => prisma.student.delete({ where: { id: Number(id) } }),
};
