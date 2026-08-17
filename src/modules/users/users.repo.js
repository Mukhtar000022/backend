// Слой данных (repository): только работа с БД через Prisma.
const { prisma } = require('../../../db');

module.exports = {
  findMany: () => prisma.user.findMany({ orderBy: { id: 'asc' } }),
  findById: (id) => prisma.user.findUnique({ where: { id: Number(id) } }),
  findByPhone: (phone_number) => prisma.user.findUnique({ where: { phone_number } }),
  create: (data) => prisma.user.create({ data }),
  update: (id, data) => prisma.user.update({ where: { id: Number(id) }, data }),
  remove: (id) => prisma.user.delete({ where: { id: Number(id) } }),
};
