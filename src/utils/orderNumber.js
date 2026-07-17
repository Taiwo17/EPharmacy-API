const { customAlphabet } = require('nanoid');

// deterministic-ish human-friendly order numbers, e.g. MC-20260713-7F2K9
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);

function generateOrderNumber() {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;
  return `MC-${datePart}-${nanoid()}`;
}

module.exports = { generateOrderNumber };
