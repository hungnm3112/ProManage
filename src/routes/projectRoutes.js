const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember
} = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');
const { validateProject } = require('../validators/projectValidator');

router.route('/')
  .get(protect, getProjects)
  .post(protect, validateProject, createProject);

router.route('/:id')
  .get(protect, getProject)
  .put(protect, validateProject, updateProject)
  .delete(protect, deleteProject);

router.post('/:id/team', protect, addTeamMember);

module.exports = router;
