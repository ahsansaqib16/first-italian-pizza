const router = require('express').Router();
const ctrl   = require('../controllers/expenseController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',          protect, ctrl.getAll);
router.get('/summary',   protect, ctrl.summary);
router.post('/',         protect, adminOnly, ctrl.create);
router.put('/:id',       protect, adminOnly, ctrl.update);
router.delete('/:id',    protect, adminOnly, ctrl.remove);

module.exports = router;
