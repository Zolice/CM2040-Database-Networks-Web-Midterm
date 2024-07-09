-- SQLBook: Code
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- Table: Accounts
CREATE TABLE IF NOT EXISTS Author (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    blog_name TEXT NOT NULL,
    password TEXT NOT NULL
);

-- Table: Articles
CREATE TABLE IF NOT EXISTS Articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    state TEXT CHECK (
        state IN ('draft', 'published')
    ),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    number_of_reads INTEGER DEFAULT 0,
    number_of_likes INTEGER DEFAULT 0,
    FOREIGN KEY (author_id) REFERENCES Author (id)
);

-- Table: ReaderComments
CREATE TABLE IF NOT EXISTS ReaderComments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,
    commenter_name TEXT,
    comment TEXT NOT NULL,
    comment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES Articles (id)
);

INSERT INTO
    Author (name, email, blog_name, password)
VALUES (
        'Author',
        'author@mail.com',
        'Author''s Blog',
        '$2b$10$Y6ciYYf/UOaD5CUe.1NdbOEQadxddjablj0CcfNoqu5H00BlOXgJy' -- default password: password
    );

COMMIT;