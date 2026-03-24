const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'reqmanager.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'member',
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#2563eb',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    priority TEXT DEFAULT 'medium',
    project_id INTEGER,
    assignee_id INTEGER,
    due_date DATE,
    tags TEXT DEFAULT '[]',
    attachments TEXT DEFAULT '[]',
    related_requirements TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS requirements_followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL,
    follower_id INTEGER NOT NULL,
    follow_date DATE NOT NULL,
    location TEXT,
    content TEXT NOT NULL,
    conclusion TEXT,
    next_follow_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE,
    FOREIGN KEY (follower_id) REFERENCES users(id)
  );
`);

// Seed data if tables are empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (name, email, role, avatar) VALUES (?, ?, ?, ?)');
  insertUser.run('Alice Chen', 'alice@example.com', 'admin', '/icon/Alice.png');
  insertUser.run('Bob Wilson', 'bob@example.com', 'manager', 'https://i.pravatar.cc/150?u=bob');
  insertUser.run('Carol Smith', 'carol@example.com', 'member', 'https://i.pravatar.cc/150?u=carol');
  insertUser.run('David Lee', 'david@example.com', 'member', 'https://i.pravatar.cc/150?u=david');
}

const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
if (projectCount.count === 0) {
  const insertProject = db.prepare('INSERT INTO projects (name, description, color) VALUES (?, ?, ?)');
  insertProject.run('Portal v3.0', 'Company internal portal redesign with new features', '#2563eb');
  insertProject.run('API Gateway', 'Unified API gateway for all services', '#10b981');
  insertProject.run('Infrastructure', 'Cloud infrastructure optimization', '#f59e0b');
  insertProject.run('Dashboard v2', 'Analytics dashboard rebuild', '#8b5cf6');
  insertProject.run('Security Initiative', 'Security audit and improvements', '#ef4444');
  insertProject.run('Mobile App', 'iOS/Android mobile application', '#06b6d4');
}

const reqCount = db.prepare('SELECT COUNT(*) as count FROM requirements').get();
if (reqCount.count === 0) {
  const insertReq = db.prepare(`
    INSERT INTO requirements (title, description, status, priority, project_id, assignee_id, due_date, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const projects = db.prepare('SELECT id FROM projects').all();
  const users = db.prepare('SELECT id FROM users').all();

  const requirements = [
    ['User authentication flow redesign', 'Implement OAuth2 and MFA support', 'in_progress', 'high', 1, 1, '2026-04-15', '["auth", "security"]'],
    ['API rate limiting', 'Add rate limiting to prevent abuse', 'approved', 'medium', 2, 2, '2026-04-20', '["api", "performance"]'],
    ['Database indexing optimization', 'Optimize slow queries in production', 'in_progress', 'critical', 3, 3, '2026-03-30', '["database", "performance"]'],
    ['Dashboard widget system', 'Create reusable widget components', 'draft', 'medium', 4, 1, '2026-05-01', '["ui", "components"]'],
    ['SSL certificate renewal', 'Renew expiring SSL certificates', 'completed', 'high', 5, 2, '2026-03-25', '["security"]'],
    ['Push notification service', 'Implement push notifications for mobile', 'in_review', 'medium', 6, 4, '2026-04-25', '["mobile", "notifications"]'],
    ['Design system documentation', 'Document all UI components', 'draft', 'low', 1, 3, '2026-05-10', '["docs", "ui"]'],
    ['Cache invalidation strategy', 'Implement smart cache invalidation', 'in_progress', 'high', 2, 1, '2026-04-18', '["cache", "performance"]'],
  ];

  for (const req of requirements) {
    insertReq.run(...req);
  }
}

module.exports = db;
