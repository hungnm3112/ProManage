const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  updateTaskStatus
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const { validateTask } = require('../validators/taskValidator');

router.route('/')
  .get(protect, getTasks)
  .post(protect, validateTask, createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, validateTask, updateTask)
  .delete(protect, deleteTask);

router.post('/:id/comments', protect, addComment);
router.patch('/:id/status', protect, updateTaskStatus);

module.exports = router;
