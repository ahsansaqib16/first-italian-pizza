const router = require('express').Router();
const ctrl   = require('../controllers/inventoryController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',              protect, ctrl.getAll);
router.get('/:id',           protect, ctrl.getById);
router.post('/',             protect, adminOnly, ctrl.create);
router.put('/:id',           protect, adminOnly, ctrl.update);
router.put('/:id/restock',   protect, adminOnly, ctrl.restock);
router.delete('/:id',        protect, adminOnly, ctrl.remove);

module.exports = router;
