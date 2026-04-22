const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req,file,cb) => cb(null, 'uploads/'),
  filename: (req,file,cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'-'))
});
const fileFilter = (req,file,cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.png','.jpg','.jpeg','.webp'].includes(ext)) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};
module.exports = multer({ storage, fileFilter, limits: { fileSize: 2*1024*1024 } });
