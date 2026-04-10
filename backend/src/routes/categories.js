const router = require('express').Router();
const ctrl   = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',       protect, ctrl.getAll);
router.post('/',      protect, adminOnly, ctrl.create);
router.put('/:id',    protect, adminOnly, ctrl.update);
router.delete('/:id', protect, adminOnly, ctrl.remove);

module.exports = router;
