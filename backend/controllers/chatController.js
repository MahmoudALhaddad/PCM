import pool from '../config/database.js';

// Get chat history between two users
export const getChatHistory = async (req, res) => {
  try {
    const { withUserId, limit = 50, cursor } = req.query;
    const userId = req.userId;

    if (!withUserId) {
      return res.status(400).json({ error: 'withUserId is required' });
    }

    let params = [userId, withUserId];
    let query = `
      SELECT m.id, m.sender_id, m.recipient_id, m.content, m.is_read, m.created_at,
             sender.name AS sender_name, recipient.name AS recipient_name
      FROM messages m
      LEFT JOIN users sender ON sender.id = m.sender_id
      LEFT JOIN users recipient ON recipient.id = m.recipient_id
      WHERE (m.sender_id = $1 AND m.recipient_id = $2)
         OR (m.sender_id = $2 AND m.recipient_id = $1)
    `;

    if (cursor) {
      params.push(cursor);
      query += ` AND m.created_at < $${params.length}`;
    }

    query += ` ORDER BY m.created_at ASC`;
    
    const limitValue = parseInt(limit);
    if (limitValue && limitValue > 0) {
      params.push(limitValue);
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);
    const messages = result.rows;

    console.log(`Chat history request: userId=${userId}, withUserId=${withUserId}, limit=${limit}`);
    console.log(`Query returned ${messages.length} messages`);
    console.log('Messages:', messages);

    res.json({
      messages,
      hasMore: false,
      nextCursor: null,
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

// Get all conversations for a user with all messages
export const getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all unique users the current user has chatted with
    const result = await pool.query(`
      WITH chat_users AS (
        SELECT DISTINCT 
          CASE 
            WHEN sender_id = $1 THEN recipient_id
            ELSE sender_id
          END AS other_user_id
        FROM messages
        WHERE sender_id = $1 OR recipient_id = $1
      ),
      latest_messages AS (
        SELECT 
          CASE 
            WHEN m.sender_id = $1 THEN m.recipient_id
            ELSE m.sender_id
          END AS other_user_id,
          m.content AS last_message,
          m.created_at AS last_message_time,
          ROW_NUMBER() OVER (
            PARTITION BY CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END
            ORDER BY m.created_at DESC
          ) AS rn
        FROM messages m
        WHERE m.sender_id = $1 OR m.recipient_id = $1
      )
      SELECT 
        cu.other_user_id,
        u.name AS other_user_name,
        u.role AS other_user_role,
        lm.last_message,
        lm.last_message_time
      FROM chat_users cu
      JOIN users u ON u.id = cu.other_user_id
      LEFT JOIN latest_messages lm ON lm.other_user_id = cu.other_user_id AND lm.rn = 1
      ORDER BY COALESCE(lm.last_message_time, '1970-01-01') DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// Search users to start a new conversation
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.userId;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const result = await pool.query(
      `SELECT id, name, role, department
       FROM users
       WHERE id != $1 
         AND name ILIKE $2
       ORDER BY name
       LIMIT 20`,
      [currentUserId, `%${query}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// faisal - Save message to database
export const saveMessage = async (senderId, recipientId, content) => {
  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, content, is_read)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id, sender_id, recipient_id, content, is_read, created_at`,
      [senderId, recipientId, content]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Save message error:', error);
    throw error;
  }
};

// Get user by ID (for socket.io)
export const getUserById = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT id, name, role FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

// faisal - Mark messages as read
export const markMessagesAsRead = async (req, res, io, userId) => {
  try {
    const recipientId = userId;
    const { senderIds } = req.body; // Array of sender IDs whose messages to mark as read

    if (!Array.isArray(senderIds) || senderIds.length === 0) {
      return res.status(400).json({ error: 'senderIds array is required' });
    }

    console.log('faisal - Marking messages as read:', { recipientId, senderIds, hasIo: !!io });

    // Mark all messages from senders as read for this recipient
    await pool.query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE recipient_id = $1 AND sender_id = ANY($2::int[])`,
      [recipientId, senderIds]
    );

    console.log('faisal - Messages updated in database');

    // faisal - Emit socket event to notify senders
    senderIds.forEach(senderId => {
      if (io) {
        console.log(`faisal - Emitting messages_marked_read to user:${senderId}`);
        io.to(`user:${senderId}`).emit('messages_marked_read', {
          senderId,
          recipientId,
          timestamp: new Date(),
        });
      } else {
        console.error('faisal - IO instance not available!');
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};
