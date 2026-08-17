const { prisma } = require('../../../db');

module.exports = {
  create: (data) => prisma.lead.create({ data }),
  findMany: () => prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }),
  update: (id, data) => prisma.lead.update({ where: { id }, data }),
  remove: (id) => prisma.lead.delete({ where: { id } }),
};
