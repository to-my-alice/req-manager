# IT Requirement Management System

A personal IT requirement management web application for tracking and managing project requirements.

## Technology Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **Vue Router** - Client-side routing
- **Vue I18n** - Internationalization (English / 中文)
- **Vite** - Next-generation frontend tooling

### Backend
- **Express.js** - Web application framework
- **better-sqlite3** - SQLite3 database driver
- **CORS** - Cross-origin resource sharing

### Database
- **SQLite** - Lightweight, file-based database

## Features

- **Dashboard** - Overview with stats, recent requirements, and project progress
- **Requirements** - Full CRUD with filtering, search, and pagination
- **Projects** - Project management with requirement tracking
- **Users** - User management with role assignment
- **i18n** - Bilingual support (English / Chinese)

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd req-manager
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Start Backend Server

```bash
cd server
npm start
```

Backend runs at: http://localhost:3001

### 3. Start Frontend Dev Server

```bash
npm run dev
```

Frontend runs at: http://localhost:5173

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| GET | /api/users/:id | Get user by ID |
| POST | /api/users | Create user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List all projects |
| GET | /api/projects/:id | Get project by ID |
| POST | /api/projects | Create project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |

### Requirements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/requirements | List all requirements |
| GET | /api/requirements/:id | Get requirement by ID |
| POST | /api/requirements | Create requirement |
| PUT | /api/requirements/:id | Update requirement |
| DELETE | /api/requirements/:id | Delete requirement |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stats | Dashboard statistics |

## Database

The SQLite database file is located at:
```
server/reqmanager.db
```

Data is automatically seeded on first run with sample users, projects, and requirements.

## Project Structure

```
req-manager/
├── src/
│   ├── pages/           # Page components
│   ├── router/          # Vue Router config
│   ├── locales/         # i18n translation files
│   ├── App.vue          # Root component
│   └── main.js          # Entry point
└── server/
    ├── index.js         # Express server
    ├── database.js      # SQLite setup & seed data
    └── reqmanager.db    # SQLite database
```
