// const multer = require("multer");
// const storage = multer.memoryStorage();
// const uploads = multer({ storage: storage })


// module.exports = uploads;

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 5MB limit
  }
});

module.exports = {
  single: (fieldName) => upload.single(fieldName),
  fields: (fields) => upload.fields(fields),
  array: (fieldName, maxCount) => upload.array(fieldName, maxCount)
};