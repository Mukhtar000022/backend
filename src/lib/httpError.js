// Ошибка с явным HTTP-статусом. Общий обработчик Express (server.js) отдаёт
// клиенту { error: message } с этим статусом (для 4xx).
module.exports = function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
};
