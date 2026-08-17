const { prisma } = require('../../../db');

module.exports = {
  findMany: () =>
    prisma.group.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { students: true, parents: true, tutors: true } } },
    }),
  findById: (id) =>
    prisma.group.findUnique({
      where: { id: Number(id) },
      include: { students: true, parents: true, tutors: true },
    }),
  create: (data) => prisma.group.create({ data }),
  update: (id, data) => prisma.group.update({ where: { id: Number(id) }, data }),
  remove: (id) => prisma.group.delete({ where: { id: Number(id) } }),
};
