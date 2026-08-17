const { prisma } = require('../../../db');

const include = { group: true, user: true, students: true };

module.exports = {
  findMany: () => prisma.parent.findMany({ orderBy: { id: 'asc' }, include }),
  findById: (id) => prisma.parent.findUnique({ where: { id: Number(id) }, include }),
  findByUserId: (userId) =>
    prisma.parent.findUnique({
      where: { user_id: Number(userId) },
      include: { group: true, students: { orderBy: { firstname: 'asc' } } },
    }),
  create: (data) => prisma.parent.create({ data, include }),
  update: (id, data) => prisma.parent.update({ where: { id: Number(id) }, data, include }),
  remove: (id) => prisma.parent.delete({ where: { id: Number(id) } }),
};
