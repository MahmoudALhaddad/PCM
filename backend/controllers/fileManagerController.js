import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';
import multer from 'multer';
import pool from '../config/database.js';

const UPLOAD_ROOT = path.resolve('uploads');


const getUserRole = async (userId) => {
  const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.role;
};


const getUserInfo = async (userId) => {
  const result = await pool.query('SELECT id, name, role FROM users WHERE id = $1', [userId]);
  return result.rows[0];
};

const isProjectMember = async (projectId, userId) => {
  const membership = await pool.query(
    'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return membership.rows.length > 0;
};


const projectExists = async (projectId) => {
  const result = await pool.query('SELECT 1 FROM projects WHERE id = $1', [projectId]);
  return result.rows.length > 0;
};

const sanitizeFolder = (folder) => {
  if (!folder || folder.includes('..') || folder.includes('/') || folder.includes('\\')) return null;
  if (folder === 'project_files') return folder;
  if (/^task_[a-zA-Z0-9-_]+$/.test(folder)) return folder;
  return null;
};

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
  const safeProjectFolder = `project_${projectId}`;
  const projectBase = path.join(UPLOAD_ROOT, safeProjectFolder);
  const projectFiles = path.join(projectBase, 'project_files');
  return { projectBase, projectFiles };
};


export const ensureProjectBaseFolders = async (projectId) => {
  const { projectBase, projectFiles } = getProjectPaths(projectId);
  await ensureDir(projectBase);
  await ensureDir(projectFiles);
  return { projectBase, projectFiles };
};


const assertEmployeeProjectAccess = async (projectId, userId) => {
  const member = await isProjectMember(projectId, userId);
  if (!member) return false;
  return true;
};

const listFilesInFolder = async (folderPath) => {
  try {
    const entries = await fsp.readdir(folderPath, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile());
    const detailed = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(folderPath, file.name);
        const stats = await fsp.stat(filePath);
        return {
          name: file.name,
          size: stats.size,
          created_at: stats.birthtime,
          modified_at: stats.mtime,
        };
      })
    );
    return detailed;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
};

// Multer storages

const projectFilesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { projectId } = req.params;
    const { projectFiles } = getProjectPaths(projectId);
    try {
      fs.mkdirSync(projectFiles, { recursive: true });
      cb(null, projectFiles);
    } catch (err) {
      cb(err, projectFiles);
    }
  },
  filename: (req, file, cb) => {
    const safeName = sanitizeFileName(file.originalname) || 'file';
    cb(null, `${Date.now()}_${safeName}`);
  },
});


export const projectFilesUpload = multer({ storage: projectFilesStorage });

const taskFilesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { projectId } = req.params;
    const safeUser = req.userSafeName || 'user';
    const folderName = `task_${safeUser}`;
    const projectBase = getProjectPaths(projectId).projectBase;
    const dest = path.join(projectBase, folderName);
    try {
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    } catch (err) {
      cb(err, dest);
    }
  },
  filename: (req, file, cb) => {
    const safeName = sanitizeFileName(file.originalname) || 'file';
    cb(null, `${Date.now()}_${safeName}`);
  },
});

export const taskFilesUpload = multer({ storage: taskFilesStorage });

// Pre middleware to fetch user name for task uploads
export const prepareTaskUpload = async (req, res, next) => {
  try {
    const user = await getUserInfo(req.userId);
    req.userSafeName = slugifyName(user?.name || `user_${req.userId}`);
    next();
  } catch (error) {
    console.error('prepareTaskUpload error:', error);
    res.status(500).json({ error: 'Failed to prepare upload' });
  }
};

// Ensure project exists and caller has at least member access
export const ensureTaskUploadAccess = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const role = await getUserRole(req.userId);
    if (role === 'admin' || role === 'manager') {
      req.userRole = role;
      return next();
    }
    const allowed = await assertEmployeeProjectAccess(projectId, req.userId);
    if (!allowed) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    req.userRole = role;
    next();
  } catch (error) {
    console.error('ensureTaskUploadAccess error:', error);
    res.status(500).json({ error: 'Authorization error' });
  }
};

// Handlers

export const listProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;
    const role = await getUserRole(req.userId);

    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (role !== 'admin' && role !== 'manager') {
      const isMember = await assertEmployeeProjectAccess(projectId, req.userId);
      if (!isMember) return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { projectBase, projectFiles } = await ensureProjectBaseFolders(projectId);

    const response = { project_files: [], task_folders: [] };

    // Always include project_files
    response.project_files = await listFilesInFolder(projectFiles);

    if (role === 'admin' || role === 'manager') {
      const entries = await fsp.readdir(projectBase, { withFileTypes: true }).catch(() => []);
      const taskFolders = entries.filter((e) => e.isDirectory() && e.name.startsWith('task_'));
      for (const folder of taskFolders) {
        const folderPath = path.join(projectBase, folder.name);
        const files = await listFilesInFolder(folderPath);
        response.task_folders.push({ folder: folder.name, files });
      }
    }

    res.json(response);
  } catch (error) {
    console.error('List project files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
};

export const uploadProjectFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await ensureProjectBaseFolders(projectId);
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ success: true, file: req.file.filename, folder: 'project_files' });
  } catch (error) {
    console.error('Upload project file error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const uploadTaskFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const role = req.userRole || (await getUserRole(req.userId));
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const folder = `task_${req.userSafeName || 'user'}`;
    res.json({ success: true, file: req.file.filename, folder, role });
  } catch (error) {
    console.error('Upload task file error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const { projectId, folder, fileName } = req.params;
    const role = await getUserRole(req.userId);

    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const safeFolder = sanitizeFolder(folder);
    const safeFile = sanitizeFileName(fileName);
    if (!safeFolder || !safeFile) {
      return res.status(400).json({ error: 'Invalid folder or file name' });
    }

    if (role !== 'admin' && role !== 'manager') {
      const isMember = await assertEmployeeProjectAccess(projectId, req.userId);
      if (!isMember) return res.status(403).json({ error: 'Insufficient permissions' });
      if (safeFolder !== 'project_files') {
        return res.status(403).json({ error: 'Employees can access project_files only' });
      }
    }

    const base = getProjectPaths(projectId).projectBase;
    const targetPath = path.join(base, safeFolder, safeFile);
    try {
      await fsp.access(targetPath);
    } catch (err) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(targetPath);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { projectId, folder, fileName } = req.params;
    const role = await getUserRole(req.userId);

    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can delete files' });
    }

    const safeFolder = sanitizeFolder(folder);
    const safeFile = sanitizeFileName(fileName);
    if (!safeFolder || !safeFile) {
      return res.status(400).json({ error: 'Invalid folder or file name' });
    }

    const base = getProjectPaths(projectId).projectBase;
    const targetPath = path.join(base, safeFolder, safeFile);
    try {
      await fsp.unlink(targetPath);
      res.json({ success: true, deleted: safeFile, folder: safeFolder });
    } catch (err) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: 'File not found' });
      throw err;
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
