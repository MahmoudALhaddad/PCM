import pool from '../config/database.js';

// faisal - Create and persist a notification
export const createNotification = async (
  userId,
  message,
  type = 'general',
  entityId = null,
  link = null,
  metadata = {}
) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, message, type, entity_id, link, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, message, type, entity_id, link, metadata, read, created_at`,
    [userId, message, type, entityId, link, JSON.stringify(metadata)]
  );
  return result.rows[0];
};

// faisal - Get notifications for authenticated user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const result = await pool.query(
      `SELECT id, message, type, entity_id, link, metadata, read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// faisal - Mark specific notifications as read
export const markNotificationsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    await pool.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE user_id = $1 AND id = ANY($2::int[])`,
      [userId, ids]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

// faisal - Mark all notifications as read for the user
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.userId;
    await pool.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};
