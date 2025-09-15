-- Chainlit SQLite schema for SQLAlchemyDataLayer
-- This schema matches the expectations of backend/chainlit/data/sql_alchemy.py
-- Create tables before running Chainlit with DATABASE_URL=sqlite+aiosqlite:///./chainlit.db

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL UNIQUE,
  "metadata" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS threads (
  "id" TEXT PRIMARY KEY,
  "createdAt" TEXT,
  "name" TEXT,
  "userId" TEXT,
  "userIdentifier" TEXT,
  "tags" TEXT, -- SQLite stores arrays as JSON strings
  "metadata" TEXT, -- JSON stored as TEXT
  FOREIGN KEY ("userId") REFERENCES users("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS steps (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "type" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "parentId" TEXT,
  "disableFeedback" INTEGER,
  "streaming" INTEGER,
  "waitForAnswer" INTEGER,
  "isError" INTEGER,
  "metadata" TEXT, -- JSON stored as TEXT
  "tags" TEXT, -- JSON stored as TEXT
  "input" TEXT,
  "output" TEXT,
  "createdAt" TEXT,
  "start" TEXT,
  "end" TEXT,
  "generation" TEXT, -- JSON stored as TEXT
  "showInput" TEXT,
  "language" TEXT,
  "indent" INTEGER,
  FOREIGN KEY ("threadId") REFERENCES threads("id") ON DELETE CASCADE,
  FOREIGN KEY ("parentId") REFERENCES steps("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS elements (
  "id" TEXT PRIMARY KEY,
  "threadId" TEXT,
  "type" TEXT,
  "url" TEXT,
  "chainlitKey" TEXT,
  "name" TEXT NOT NULL,
  "display" TEXT,
  "objectKey" TEXT,
  "size" TEXT,
  "page" INTEGER,
  "language" TEXT,
  "forId" TEXT,
  "mime" TEXT,
  "props" TEXT, -- JSON stored as TEXT
  FOREIGN KEY ("threadId") REFERENCES threads("id") ON DELETE CASCADE,
  FOREIGN KEY ("forId") REFERENCES steps("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS feedbacks (
  "id" TEXT PRIMARY KEY,
  "forId" TEXT NOT NULL,
  "threadId" TEXT,
  "value" INTEGER NOT NULL,
  "comment" TEXT,
  FOREIGN KEY ("forId") REFERENCES steps("id") ON DELETE CASCADE,
  FOREIGN KEY ("threadId") REFERENCES threads("id") ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_identifier ON users("identifier");
CREATE INDEX IF NOT EXISTS idx_threads_userId ON threads("userId");
CREATE INDEX IF NOT EXISTS idx_steps_threadId ON steps("threadId");
CREATE INDEX IF NOT EXISTS idx_steps_parentId ON steps("parentId");
CREATE INDEX IF NOT EXISTS idx_elements_threadId ON elements("threadId");
CREATE INDEX IF NOT EXISTS idx_elements_forId ON elements("forId");
CREATE INDEX IF NOT EXISTS idx_feedbacks_forId ON feedbacks("forId");
CREATE INDEX IF NOT EXISTS idx_feedbacks_threadId ON feedbacks("threadId");
