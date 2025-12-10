import pool from '../config/database.js';

const getUserRole = async (userId) => {
  const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.role;
};

const ensureProjectAccess = async (projectId, userId) => {
  const role = await getUserRole(userId);
  if (role === 'admin' || role === 'manager') return true;

  const membership = await pool.query(
    'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (membership.rows.length > 0) return true;

  const creator = await pool.query(
    'SELECT 1 FROM projects WHERE id = $1 AND created_by = $2',
    [projectId, userId]
  );
  return creator.rows.length > 0;
};

// Get all projects
export const getProjects = async (req, res) => {
  try {
    const { status } = req.query;
    const role = await getUserRole(req.userId);

    const conditions = [];
    const params = [];

    if (status) {
      const validStatuses = ['planning', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }

    if (role !== 'admin' && role !== 'manager') {
      params.push(req.userId);
      const memberClause = `(p.id IN (SELECT project_id FROM project_members WHERE user_id = $${params.length}) OR p.created_by = $${params.length})`;
      conditions.push(memberClause);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = 
    `
      SELECT p.*, u.name AS created_by_name
      FROM projects p
      LEFT JOIN users u ON u.id = p.created_by
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query, params);
    
    // Fetch members for each project
    const projectsWithMembers = await Promise.all(
      result.rows.map(async (project) => {
        const members = await pool.query(
          `SELECT u.id AS user_id, u.name
           FROM project_members pm
           JOIN users u ON u.id = pm.user_id
           WHERE pm.project_id = $1
           ORDER BY u.role, u.name`,
          [project.id]
        );
        return { ...project, project_members: members.rows };
      })
    );

    res.json(projectsWithMembers);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// Get project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const canAccess = await ensureProjectAccess(id, req.userId);
    if (!canAccess) return res.status(403).json({ error: 'Insufficient permissions' });

    const result = await pool.query(
      `SELECT p.*, u.name AS created_by_name
       FROM projects p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const members = await pool.query(
      `SELECT u.id AS user_id, u.name
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY u.role, u.name`,
      [id]
    );

    res.json({ ...result.rows[0], project_members: members.rows });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

// Create new project
export const createProject = async (req, res) => {
  try {
    const { name, clientName, description, deadline, status = 'planning', memberIds = [] } = req.body;

    if (!name || !clientName) {
      return res.status(400).json({ error: 'Name and client name are required' });
    }

    const validStatuses = ['planning', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const insertResult = await pool.query(
      `INSERT INTO projects (name, client_name, description, status, deadline, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, clientName, description, status, deadline, req.userId]
    );

    const project = insertResult.rows[0];

    // Add creator and specified members to project
    const uniqueMembers = Array.from(new Set([...(memberIds || [])]));
    const memberInserts = uniqueMembers.map((memberId) =>
      pool.query(
        'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [project.id, memberId]
      )
    );

    await Promise.all(memberInserts);

    // Fetch member details

    const memberDetails = await pool.query(
      `SELECT u.id AS user_id, u.name
       FROM users u
       WHERE u.id = ANY($1)
       ORDER BY u.role, u.name`,
      [uniqueMembers]
    );

    res.status(201).json({ ...project, project_members: memberDetails.rows });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, clientName, description, deadline, status, memberIds } = req.body;

    if (status) {
      const validStatuses = ['planning', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status ' });
      }
    }

    const projectResult = await pool.query('SELECT created_by FROM projects WHERE id = $1', [id]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const role = await getUserRole(req.userId);
    const isOwner = projectResult.rows[0].created_by === req.userId;
    if (!(role === 'admin' || role === 'manager' || isOwner)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updateResult = await pool.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           client_name = COALESCE($2, client_name),
           description = COALESCE($3, description),
           deadline = COALESCE($4, deadline),
           status = COALESCE($5, status)
       WHERE id = $6 
       RETURNING *`,
      [name, clientName, description, deadline, status, id]
    );

    if (memberIds && Array.isArray(memberIds)) { 
      const uniqueMembers = Array.from(new Set([...memberIds]));
      await pool.query('DELETE FROM project_members WHERE project_id = $1', [id]);
      const inserts = uniqueMembers.map((memberId) =>
        pool.query(
          'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, memberId]
        )
      );
      await Promise.all(inserts);
    }

    // Fetch updated member details
    const updatedMembers = await pool.query(

      `SELECT u.id AS user_id, u.name
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY u.role, u.name`,
      [id]

    );

    res.json({ ...updateResult.rows[0], project_members: updatedMembers.rows });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await getUserRole(req.userId);
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete projects' });
    }

    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted', project: result.rows[0] });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// Get all projects with their tasks and task members
export const getProjectsWithTasks = async (req, res) => {
  try {
    const role = await getUserRole(req.userId);

    // Get projects based on role
    let projectsQuery = `
      SELECT p.id, p.name, p.client_name, p.deadline, p.created_at, p.status
      FROM projects p
    `;
    const params = [];

    if (role !== 'admin' && role !== 'manager') {
      params.push(req.userId);
      projectsQuery += `
        WHERE p.id IN (
          SELECT project_id FROM project_members WHERE user_id = $${params.length}
          UNION
          SELECT id FROM projects WHERE created_by = $${params.length}
        )
      `;
    }

    projectsQuery += ` ORDER BY p.created_at DESC`;

    const projectsResult = await pool.query(projectsQuery, params);
    const projects = projectsResult.rows;

    // For each project, get its tasks with assigned members
    const projectsWithTasks = await Promise.all(
      projects.map(async (project) => {
        // Get all tasks for this project
        const tasksResult = await pool.query(
          `SELECT t.id, t.project_id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at
           FROM tasks t
           WHERE t.project_id = $1
           ORDER BY t.created_at DESC`,
          [project.id]
        );

        // For each task, get assigned members
        const tasksWithMembers = await Promise.all(
          tasksResult.rows.map(async (task) => {
            const membersResult = await pool.query(
              `SELECT u.id as user_id, u.name as full_name
               FROM task_members tm
               JOIN users u ON u.id = tm.user_id
               WHERE tm.task_id = $1
               ORDER BY tm.added_at ASC`,
              [task.id]
            );

            return {
              id: task.id,
              project_id: task.project_id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              assigned_to: membersResult.rows,
              due_date: task.due_date,
              created_at: task.created_at,
            };
          })
        );

        return {
          id: project.id,
          name: project.name,
          client_name: project.client_name,
          deadline: project.deadline,
          created_at: project.created_at,
          tasks: tasksWithMembers,
        };
      })
    );

    res.json(projectsWithTasks);
  } catch (error) {
    console.error('Get projects with tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch projects with tasks' });
  }
};

// GET project members
// Get members of a specific project
export const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const members = await pool.query(
      `SELECT u.id, u.name, u.role
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY u.name`,
      [projectId]
    );

    res.json(members.rows);
  } catch (err) {
    console.error("Get project members error:", err);
    res.status(500).json({ error: "Failed to load project members" });
  }
};
