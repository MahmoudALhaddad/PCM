const pool = require('../config/database');

// Create comment
const createComment = async (req, res) => {
  try {
    const { comment, taskId } = req.body;
    const userId = req.userId;

    if (!comment || !taskId) {
      return res.status(400).json({ error: 'Comment and task ID required' });
    }

    const result = await pool.query(
      `INSERT INTO task_comments (comment, task_id, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, comment, task_id, user_id, created_at`,
      [comment, taskId, userId]
    );

    res.status(201).json({
      message: 'Comment created successfully',
      comment: result.rows[0],
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

// Get task comments
const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await pool.query(
      `SELECT tc.id, tc.comment, tc.task_id, tc.user_id, u.name as user_name, tc.created_at
       FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at DESC`,
      [taskId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Update comment
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const result = await pool.query(
      `UPDATE task_comments 
       SET comment = COALESCE($1, comment)
       WHERE id = $2
       RETURNING id, comment, task_id, user_id, created_at`,
      [comment, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({
      message: 'Comment updated successfully',
      comment: result.rows[0],
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM task_comments WHERE id = $1 RETURNING id, comment',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({
      message: 'Comment deleted successfully',
      comment: result.rows[0],
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

module.exports = {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
};
