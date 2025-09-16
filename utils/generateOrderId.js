function generateOrderId() {
  // Generate 3 random uppercase letters
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) // A–Z
  ).join("");

  // Generate 4 random digits
  const numbers = Math.floor(1000 + Math.random() * 9000); // 1000–9999

  return `${letters}${numbers}`;
}

module.exports = generateOrderId;
