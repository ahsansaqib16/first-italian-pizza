const router  = require('express').Router();
const ctrl    = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Use UPLOADS_DIR env var (set by Electron to AppData) or fallback for dev
const uploadDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb)  => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/',       protect, ctrl.getAll);
router.get('/:id',    protect, ctrl.getById);
router.post('/',      protect, adminOnly, upload.single('image'), ctrl.create);
router.put('/:id',    protect, adminOnly, upload.single('image'), ctrl.update);
router.delete('/:id', protect, adminOnly, ctrl.remove);

module.exports = router;
