const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',       protect, adminOnly, ctrl.getAll);
router.post('/',      protect, adminOnly, ctrl.create);
router.put('/:id',    protect, adminOnly, ctrl.update);
router.delete('/:id', protect, adminOnly, ctrl.remove);

module.exports = router;
