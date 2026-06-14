const crypto = require('crypto');

/**
 * Generate a custom ID with a specific prefix and a 6-digit random number.
 * @param {string} prefix - The ID prefix (e.g., 'USR', 'PRJ')
 * @returns {string} The generated ID
 */
function generateId(prefix) {
  // Generate a random number between 100000 and 999999
  const randomNum = crypto.randomInt(100000, 1000000);
  return `${prefix}-${randomNum}`;
}

/**
 * Generate a unique ID by checking against a Mongoose model.
 * @param {string} prefix - The ID prefix
 * @param {Object} model - The Mongoose model to check against
 * @param {string} field - The field name in the model to check for uniqueness
 * @returns {Promise<string>} A unique ID
 */
async function generateUniqueId(prefix, model, field) {
  let isUnique = false;
  let id;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    id = generateId(prefix);
    const existingDoc = await model.findOne({ [field]: id });
    if (!existingDoc) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error(`Failed to generate a unique ID for prefix ${prefix} after ${maxAttempts} attempts.`);
  }

  return id;
}

module.exports = {
  generateId,
  generateUniqueId
};
