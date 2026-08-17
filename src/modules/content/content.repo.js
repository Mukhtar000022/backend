const { prisma } = require('../../../db');

module.exports = {
  findAll: () => prisma.contentSection.findMany(),
  upsert: (key, data) =>
    prisma.contentSection.upsert({ where: { key }, update: { data }, create: { key, data } }),
};
