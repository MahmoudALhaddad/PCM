-- Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
<<<<<<< HEAD
<<<<<<< HEAD
    name VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE NOT NULL,
=======
    name VARCHAR(100) UNIQUE NOT NULL,
>>>>>>> ee66cc6 (update 9/12)
=======
    name VARCHAR(100) UNIQUE NOT NULL,
>>>>>>> d305354eea06466a47a6ad04b8f6ebc6d4fd5e21
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    department VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('planning', 'in_progress', 'completed')),
    deadline DATE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Project Members Table
CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE TABLE task_members (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(task_id, user_id)
);

-- Create Tasks Table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Task Comments Table
CREATE TABLE task_comments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Activity Log Table
CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    task_id INT REFERENCES tasks(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

<<<<<<< HEAD
-- Create Messages Table for chat
=======
-- faisal - Create Messages Table for chat with read status
>>>>>>> d305354eea06466a47a6ad04b8f6ebc6d4fd5e21
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INT REFERENCES users(id) ON DELETE SET NULL,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE, --faisal - track if message is read
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Files Table for uploads and folder mapping
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    task_id INT REFERENCES tasks(id) ON DELETE SET NULL,
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT,
    size BIGINT,
    folder_path TEXT DEFAULT '/',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create User Settings Table
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(30) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(100) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    desktop_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    entity_id INT,
    link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
<<<<<<< HEAD
=======
>>>>>>> allinone
>>>>>>> d305354eea06466a47a6ad04b8f6ebc6d4fd5e21
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Refresh Tokens Table for authentication
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked BOOLEAN DEFAULT false
);

-- Create indexes for better query performance
<<<<<<< HEAD
=======
<<<<<<< HEAD
CREATE INDEX idx_users_email ON users(email);
=======
>>>>>>> allinone
>>>>>>> d305354eea06466a47a6ad04b8f6ebc6d4fd5e21
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX idx_activity_log_task_id ON activity_log(task_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
<<<<<<< HEAD
=======
<<<<<<< HEAD
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
=======
>>>>>>> d305354eea06466a47a6ad04b8f6ebc6d4fd5e21
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);--faisal
CREATE INDEX idx_messages_created_at ON messages(created_at);--faisal
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_task_id ON files(task_id);
<<<<<<< HEAD
=======
>>>>>>> allinone
>>>>>>> d305354eea06466a47a6ad04b8f6ebc6d4fd5e21
