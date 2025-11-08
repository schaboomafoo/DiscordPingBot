const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');

function loadUsers() {
  try {
    const raw = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load users.json:', err.message);
    return {};
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Failed to save users.json:', err.message);
  }
}

module.exports = { loadUsers, saveUsers };