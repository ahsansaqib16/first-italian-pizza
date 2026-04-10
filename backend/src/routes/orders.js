const router = require('express').Router();
const ctrl   = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.get('/',             protect, ctrl.getAll);
router.get('/:id',          protect, ctrl.getById);
router.post('/',            protect, ctrl.create);
router.put('/:id/status',   protect, ctrl.updateStatus);
router.put('/:id/cancel',   protect, ctrl.cancel);

module.exports = router;
