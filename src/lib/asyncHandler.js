// Оборачивает async-обработчик, чтобы ошибки уходили в общий обработчик Express.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
