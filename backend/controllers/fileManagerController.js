// fileManagerController.js
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';
import multer from 'multer';
import pool from '../config/database.js';

const UPLOAD_ROOT = path.resolve('uploads');

// Utilities
const sanitizeFileName = (fileName) => {
  if (!fileName) return null;
  const base = path.basename(fileName);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const slugifyName = (name) => {
  if (!name) return 'user';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'user';
};

const ensureDir = async (dirPath) => {
  await fsp.mkdir(dirPath, { recursive: true });
};

const getProjectPaths = (projectId) => {
  const projectBase = path.join(UPLOAD_ROOT, `project_${projectId}`);
  const projectFiles = path.join(projectBase, 'project_files');
  const taskSubmissions = path.join(projectBase, 'task_submissions');
  return { projectBase, projectFiles, taskSubmissions };
};

// Ensure folders exist
export const ensureProjectBaseFolders = async (projectId) => {
  const { projectBase, projectFiles, taskSubmissions } = getProjectPaths(projectId);
  await ensureDir(projectBase);
  await ensureDir(projectFiles);
  await ensureDir(taskSubmissions);
  return { projectBase, projectFiles, taskSubmissions };
};

// Middleware to get username for task uploads
export const prepareTaskUpload = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT name FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];
    req.userSafeName = slugifyName(user?.name || `user_${req.userId}`);
    next();
  } catch (err) {
    console.error('prepareTaskUpload error:', err);
    res.status(500).json({ error: 'Failed to prepare upload' });
  }
};

// Multer storage: Admin project files (keep original filename)
const projectFilesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { projectFiles } = getProjectPaths(req.params.projectId);
    fs.mkdirSync(projectFiles, { recursive: true });
    cb(null, projectFiles);
  },
  filename: (req, file, cb) => {
    const safeName = sanitizeFileName(file.originalname) || 'file';
    cb(null, safeName); // KEEP ORIGINAL NAME
  },
});
export const projectFilesUpload = multer({ storage: projectFilesStorage });

// Multer storage: Employee task submissions (optional username prefix)
const taskFilesStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const { taskId } = req.params;
      const taskRes = await pool.query(
        `SELECT t.project_id FROM tasks t WHERE t.id = $1`,
        [taskId]
      );
      if (!taskRes.rows.length) return cb(new Error("Task not found"));

      const projectId = taskRes.rows[0].project_id;
      const folder = getProjectPaths(projectId).taskSubmissions;

      await fsp.mkdir(folder, { recursive: true });
      cb(null, folder);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const safeName = sanitizeFileName(file.originalname) || 'file';
    cb(null, `${req.userSafeName || 'user'}_${safeName}`);
  },
});

export const taskFilesUpload = multer({ storage: taskFilesStorage });

// List project files
export const listProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;
    const roleResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.userId]);
    const role = roleResult.rows[0]?.role;

    const { projectFiles, taskSubmissions } = await ensureProjectBaseFolders(projectId);

    const listFilesInFolder = async (folderPath) => {
      const entries = await fsp.readdir(folderPath, { withFileTypes: true }).catch(() => []);
      const files = entries.filter((e) => e.isFile());
      const detailed = await Promise.all(
        files.map(async (file) => {
          const stats = await fsp.stat(path.join(folderPath, file.name));
          return { name: file.name, size: stats.size, created_at: stats.birthtime };
        })
      );
      return detailed;
    };

    res.json({
      project_files: await listFilesInFolder(projectFiles),
      task_submissions: role === 'admin' || role === 'manager'
        ? await listFilesInFolder(taskSubmissions)
        : [],
    });
  } catch (err) {
    console.error('List project files error:', err);
    res.status(500).json({ error: 'Failed to list files' });
  }
};

// Upload handlers
export const uploadProjectFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ success: true, file: req.file.filename, folder: 'project_files' });
};

export const uploadTaskFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ success: true, file: req.file.filename, folder: 'task_submissions' });
};

// Download file
export const downloadFile = async (req, res) => {
  try {
    const { projectId, folder, fileName } = req.params;
    const roleResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.userId]);
    const role = roleResult.rows[0]?.role;

    const { projectBase } = getProjectPaths(projectId);

    if (!['project_files', 'task_submissions'].includes(folder)) {
      return res.status(400).json({ error: 'Invalid folder name' });
    }

    const safeFile = sanitizeFileName(fileName);
    if (!safeFile) return res.status(400).json({ error: 'Invalid file name' });

    if (role !== 'admin' && role !== 'manager' && folder !== 'project_files') {
      return res.status(403).json({ error: 'Employees can access project_files only' });
    }

    const targetPath = path.join(projectBase, folder, safeFile);
    try {
      await fsp.access(targetPath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(targetPath);
  } catch (err) {
    console.error('Download file error:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
};

// Delete file (admin only)
export const deleteFile = async (req, res) => {
  try {
    const { projectId, folder, fileName } = req.params;
    const roleResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.userId]);
    const role = roleResult.rows[0]?.role;

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can delete files' });
    }

    const { projectBase } = getProjectPaths(projectId);

    if (!['project_files', 'task_submissions'].includes(folder)) {
      return res.status(400).json({ error: 'Invalid folder name' });
    }

    const safeFile = sanitizeFileName(fileName);
    if (!safeFile) return res.status(400).json({ error: 'Invalid file name' });

    const targetPath = path.join(projectBase, folder, safeFile);

    try {
      await fsp.unlink(targetPath);
      res.json({ success: true, deleted: safeFile, folder });
    } catch (err) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: 'File not found' });
      throw err;
    }
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
