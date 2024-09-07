CREATE TABLE users (
id serial unique Primary Key,
name VARCHAR(45) NOT NULL
);

CREATE TABLE books (
id serial unique Primary Key,
title VARCHAR(45) NOT NULL,
name VARCHAR(100) Unique,
author VARCHAR(60),
publishing_date DATE,
isbn CHAR(13)
);

CREATE TABLE notes (
id serial unique Primary Key,
summary TEXT,
detailed_notes TEXT,
user_id INT REFERENCES users(id),
book_id INT REFERENCES books(id),
publishingDate Date
);

CREATE TABLE ratings (
id serial unique Primary Key,
book_id INT References books(id),
user_id INT REferences users(id)
);
-- Forgot to add ratings
ALTER TABLE ratings
ADD COLUMN rating INTEGER,
ADD CONSTRAINT check_rating_range
CHECK (rating >=0 AND rating <=10);
-- ADDed the constraint for stopping multiple entries of the saame book by a single user.
ALTER TABLE ratings
ADD CONSTRAINT unique_user_book
UNIQUE (user_id,book_id)

-- Filling the tables.
INSERT INTO users (name) VALUES ('Ibtesam');
INSERT INTO users (name) VALUES ('Ihtesham');
INSERT INTO users (name) VALUES ('Zeenat');

INSERT INTO books (title,author,publishing_date,isbn) VALUES ('Thinking, Fast and Slow','Daniel Kahneman','2011-1-23','9780374275631');
INSERT INTO books (title,author,publishing_date,isbn) VALUES ('Atomic Habits','James Clear','2016-3-23','9781847941831');

INSERT INTO ratings (user_id,book_id,rating) VALUES (1,1,8);
INSERT INTO ratings (user_id,book_id,rating) VALUES (1,2,10);
INSERT INTO ratings (user_id,book_id,rating) VALUES (2,1,8);
INSERT INTO ratings (user_id,book_id,rating) VALUES (2,2,7);

INSERT INTO notes (summary,detailed_notes,user_id,book_id, publishingDate) 
VALUES ('The book entails a systemic approach to understand how our brain works. There are two systems namely system1 and system2. System1 is responsible for taking decisions very quickly without giving much thought to it. However, System2 is engaged when you need to concentrate and contemplate the cues and then give a response.','This is note 1.<br> This is note 2.<br> I am testing the br ta by inserting it at the end of line.',1,1,'2024-09-07');

INSERT INTO notes (summary,detailed_notes,user_id,book_id, publishingDate) 
VALUES ('The book entails a systemic approach to understand how our brain works. There are two systems namely system1 and system2. System1 is responsible for taking decisions very quickly without giving much thought to it. However, System2 is engaged when you need to concentrate and contemplate the cues and then give a response.','This is note 1.<br> This is note 2.<br> I am testing the br ta by inserting it at the end of line.',2,1,'2024-09-07');


INSERT INTO notes (summary,detailed_notes,user_id,book_id, publishingDate) 
VALUES ('The book explains with examples and science how habits influence our lives. How small a habit can have a gigantic effect. The book further explains the science behind habits - how can we make little changes to incorporate the habits we always want in our life to have a great impact.','This is note 1.<br> This is note 2.<br> I am testing the br ta by inserting it at the end of line.',1,2,'2024-09-07');

INSERT INTO notes (summary,detailed_notes,user_id,book_id, publishingDate) 
VALUES ('The book explains with examples and science how habits influence our lives. How small a habit can have a gigantic effect. The book further explains the science behind habits - how can we make little changes to incorporate the habits we always want in our life to have a great impact.','This is habit note 1 with user 2.<br> This is a habit note 2 with user 2.<br> I am testing the br tag by inserting it at the end of line. in habit detailed notes',2,2,'2024-09-07');

-- This is the query that will give left join of notes and users and books with specific user.

SELECT * FROM notes
LEFT JOIN users ON notes.user_id = users.id
LEFT JOIN books ON notes.book_id = books.id
WHERE users.id = 2;