const { prisma } = require('../../../db');

const include = { user: true, group: true };

module.exports = {
  findMany: () => prisma.tutor.findMany({ orderBy: { id: 'asc' }, include }),
  findById: (id) => prisma.tutor.findUnique({ where: { id: Number(id) }, include }),
  findByUserId: (userId) =>
    prisma.tutor.findUnique({
      where: { user_id: Number(userId) },
      include: { group: { include: { students: { orderBy: { firstname: 'asc' } } } } },
    }),
  create: (data) => prisma.tutor.create({ data, include }),
  update: (id, data) => prisma.tutor.update({ where: { id: Number(id) }, data, include }),
  remove: (id) => prisma.tutor.delete({ where: { id: Number(id) } }),
};
