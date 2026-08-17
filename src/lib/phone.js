// Телефонные номера Казахстана. Хранятся в едином формате: +7(7XX) XXX-XX-XX
// Пользователь может ввести номер как угодно (8 707…, +7 707…, 707…, с пробелами
// и скобками) — нормализуем к одному виду, чтобы поиск и уникальность работали.

// Оставляет только цифры.
function toDigits(input) {
  return String(input == null ? '' : input).replace(/\D/g, '');
}

// Приводит к 11 цифрам, начинающимся с 7. Возвращает null, если не получается.
function canonicalDigits(input) {
  let d = toDigits(input);
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1); // 8XXXXXXXXXX -> 7XXXXXXXXXX
  if (d.length === 10) d = '7' + d; // номер без кода страны -> добавляем 7
  if (d.length === 11 && d[0] === '7') return d;
  return null;
}

// Форматирует номер как +7(7XX) XXX-XX-XX. Возвращает null для некорректных.
// Принимаются только мобильные РК (код оператора начинается с 7).
function normalizePhone(input) {
  const d = canonicalDigits(input);
  if (!d || d[1] !== '7') return null;
  return `+7(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}

function isValidPhone(input) {
  return normalizePhone(input) !== null;
}

module.exports = { normalizePhone, isValidPhone };
