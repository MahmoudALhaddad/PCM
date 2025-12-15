import pool from "../config/database.js";

// Get all notifications for current user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `
      SELECT id, type, title, link, is_read, created_at
      FROM notifications
      WHERE user_id = $1 AND is_read = false
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
export const markChatNotificationsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { fromUserId } = req.body;

    if (!fromUserId) {
      return res.status(400).json({ error: "fromUserId is required" });
    }

    await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1
        AND from_user_id = $2
        AND type = 'message'
        AND is_read = false
      `,
      [userId, fromUserId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Mark chat notifications read error:", err);
    res.status(500).json({ error: "Failed to mark chat notifications" });
  }
};


// Mark specific notifications as read
export const markNotificationsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }

    await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND id = ANY($2::int[])`,
      [userId, ids]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Mark notifications read error:", err);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
};

// Mark ALL notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

// Create notification (used by socket)
export const createNotification = async ({
  userId,
  fromUserId,
  type,
  title,
  body = null,
  link = null,
}) => {
  const result = await pool.query(
    `
    INSERT INTO notifications (user_id, from_user_id, type, title, body, link)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [userId, fromUserId, type, title, body, link]
  );

  return result.rows[0];
};
export const markAllMessageNotificationsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1
        AND type = 'message'
        AND is_read = false
      `,
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Mark all message notifications read error:", err);
    res.status(500).json({ error: "Failed to mark message notifications" });
  }
};
