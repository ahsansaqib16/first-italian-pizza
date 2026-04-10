const router = require('express').Router();
const ctrl   = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/summary',     protect, ctrl.summary);
router.get('/daily',       protect, ctrl.daily);
router.get('/monthly',     protect, ctrl.monthly);
router.get('/top-products',protect, ctrl.topProducts);
router.get('/by-category', protect, ctrl.byCategory);

module.exports = router;
