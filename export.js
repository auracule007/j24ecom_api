const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Path to your SQLite database file inside prisma/
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

// Open the database (read-only for safety)
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database:', dbPath);
  }
});

db.serialize(() => {
  // Get all user-defined tables (ignore SQLite system tables)
  db.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
    (err, tables) => {
      if (err) throw err;

      const exportData = {};
      let pending = tables.length;

      if (pending === 0) {
        fs.writeFileSync("db.json", JSON.stringify(exportData, null, 2));
        console.log("No tables found. Empty db.json created.");
        db.close();
        return;
      }

      tables.forEach((table) => {
        const tableName = table.name;

        // Wrap table names in double quotes to handle reserved keywords like Order
        db.all(`SELECT * FROM "${tableName}";`, (err, rows) => {
          if (err) {
            console.error(`Error reading table ${tableName}:`, err.message);
            exportData[tableName] = [];
          } else {
            exportData[tableName] = rows;
          }

          pending--;
          if (pending === 0) {
            fs.writeFileSync("db.json", JSON.stringify(exportData, null, 2));
            console.log("✅ Export complete! Data saved to db.json");
            db.close();
          }
        });
      });
    }
  );
});
