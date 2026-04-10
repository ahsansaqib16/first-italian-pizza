const router = require('express').Router();
const ctrl   = require('../controllers/settingController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',  protect, ctrl.getAll);
router.post('/', protect, adminOnly, ctrl.upsert);

module.exports = router;
