const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ============ USERS ============
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, email, role, avatar } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  // Check if email already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  const result = db.prepare('INSERT INTO users (name, email, role, avatar) VALUES (?, ?, ?, ?)').run(name, email, role || 'member', avatar || null);
  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { name, email, role, avatar } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  // Check if email already exists for another user
  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.params.id);
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  db.prepare('UPDATE users SET name = ?, email = ?, role = ?, avatar = ? WHERE id = ?').run(name, email, role, avatar, req.params.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/api/users/:id', (req, res) => {
  // Check if user has assigned requirements
  const assigned = db.prepare('SELECT COUNT(*) as count FROM requirements WHERE assignee_id = ?').get(req.params.id);
  if (assigned.count > 0) {
    return res.status(400).json({ error: 'Cannot delete user with assigned requirements' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ PROJECTS ============
app.get('/api/projects', (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT p.*,
           COUNT(r.id) as requirement_count,
           SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_count
    FROM projects p
    LEFT JOIN requirements r ON p.id = r.project_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' GROUP BY p.id ORDER BY p.created_at DESC';

  const projects = db.prepare(query).all(...params);
  res.json(projects);
});

app.get('/api/projects/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const requirements = db.prepare('SELECT * FROM requirements WHERE project_id = ?').all(req.params.id);
  project.requirements = requirements;

  res.json(project);
});

app.post('/api/projects', (req, res) => {
  const { name, description, color } = req.body;
  const result = db.prepare('INSERT INTO projects (name, description, color) VALUES (?, ?, ?)').run(name, description, color);
  res.json({ id: result.lastInsertRowid, name, description, color });
});

app.put('/api/projects/:id', (req, res) => {
  const { name, description, color } = req.body;
  db.prepare('UPDATE projects SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(name, description, color, req.params.id);
  res.json({ id: req.params.id, name, description, color });
});

app.delete('/api/projects/:id', (req, res) => {
  // Check if project has requirements
  const reqs = db.prepare('SELECT COUNT(*) as count FROM requirements WHERE project_id = ?').get(req.params.id);
  if (reqs.count > 0) {
    return res.status(400).json({ error: 'Cannot delete project with assigned requirements' });
  }
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ REQUIREMENTS ============
app.get('/api/requirements', (req, res) => {
  const { status, priority, project_id, search } = req.query;
  let query = `
    SELECT r.*, p.name as project_name, p.color as project_color, u.name as assignee_name, u.avatar as assignee_avatar
    FROM requirements r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN users u ON r.assignee_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND r.priority = ?';
    params.push(priority);
  }
  if (project_id) {
    query += ' AND r.project_id = ?';
    params.push(project_id);
  }
  if (search) {
    query += ' AND (r.title LIKE ? OR r.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY r.created_at DESC';

  const requirements = db.prepare(query).all(...params);
  requirements.forEach(r => {
    r.tags = JSON.parse(r.tags || '[]');
    r.attachments = JSON.parse(r.attachments || '[]');
    r.related_requirements = JSON.parse(r.related_requirements || '[]');
  });
  res.json(requirements);
});

app.get('/api/requirements/:id', (req, res) => {
  const requirement = db.prepare(`
    SELECT r.*, p.name as project_name, p.color as project_color, u.name as assignee_name, u.avatar as assignee_avatar
    FROM requirements r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN users u ON r.assignee_id = u.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

  requirement.tags = JSON.parse(requirement.tags || '[]');
  requirement.attachments = JSON.parse(requirement.attachments || '[]');
  requirement.related_requirements = JSON.parse(requirement.related_requirements || '[]');

  res.json(requirement);
});

app.post('/api/requirements', (req, res) => {
  const { title, description, status, priority, project_id, assignee_id, due_date, tags, attachments, related_requirements } = req.body;
  const result = db.prepare(`
    INSERT INTO requirements (title, description, status, priority, project_id, assignee_id, due_date, tags, attachments, related_requirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, status || 'draft', priority || 'medium', project_id, assignee_id, due_date,
         JSON.stringify(tags || []), JSON.stringify(attachments || []), JSON.stringify(related_requirements || []));

  const newReq = db.prepare('SELECT * FROM requirements WHERE id = ?').get(result.lastInsertRowid);
  res.json(newReq);
});

app.put('/api/requirements/:id', (req, res) => {
  const { title, description, status, priority, project_id, assignee_id, due_date, tags, attachments, related_requirements } = req.body;
  db.prepare(`
    UPDATE requirements SET
      title = ?, description = ?, status = ?, priority = ?, project_id = ?, assignee_id = ?,
      due_date = ?, tags = ?, attachments = ?, related_requirements = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description, status, priority, project_id, assignee_id, due_date,
         JSON.stringify(tags || []), JSON.stringify(attachments || []), JSON.stringify(related_requirements || []), req.params.id);

  const updated = db.prepare('SELECT * FROM requirements WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/api/requirements/:id', (req, res) => {
  db.prepare('DELETE FROM requirements WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ STATS ============
app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM requirements').get().count;
  const inProgress = db.prepare("SELECT COUNT(*) as count FROM requirements WHERE status = 'in_progress'").get().count;
  const completed = db.prepare("SELECT COUNT(*) as count FROM requirements WHERE status = 'completed'").get().count;
  const overdue = db.prepare("SELECT COUNT(*) as count FROM requirements WHERE due_date < date('now') AND status != 'completed'").get().count;

  const recentRequirements = db.prepare(`
    SELECT r.*, p.name as project_name, u.name as assignee_name
    FROM requirements r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN users u ON r.assignee_id = u.id
    ORDER BY r.created_at DESC LIMIT 5
  `).all();

  const projectProgress = db.prepare(`
    SELECT p.id, p.name, p.color, COUNT(r.id) as total,
           SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM projects p
    LEFT JOIN requirements r ON p.id = r.project_id
    GROUP BY p.id
    LIMIT 5
  `).all();

  res.json({ total, inProgress, completed, overdue, recentRequirements, projectProgress });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
