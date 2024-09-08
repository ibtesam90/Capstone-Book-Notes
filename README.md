### CAPSTONE PROJECT OF KEEPING BOOK NOTES WITH POSTGRES DATABASE

It was a capstone project of The webdevelopment Bootcamp 2024 by Angela Yu of The Laondon App brewery.

## Session Based implementation.
The express-session module has been used to create and handle session.

## Task
The task was to add book notes with setting up a database. The database has to be conceptualized by ourselves and then implemented.
The next task was to interact with the database through the web-app and handle all the routes using express.

## Database Tables
Following tables have been created. ALL the queries are available in the bookNotes.sql
# users
Sotres (id, name)
# books
Stores the (id,title,author,publishing_date,isbn)
# notes
store (id,summary,detailed_notes,user_id(user.id),book_id(book.id)
# ratings
Stores the (id, user_id(user.id), book_id(book.id), rating)


## Implemented Scenarios

- The scenarios covered are change of users from users link in navbar.
- Your book Notes nav link takes to the current user notes and display all his created notes.
- Add Review allows the user to either select the book from books table to avoid any duplication of book title or if it doesn't match, it add the book initially to the book and then the summary and rating
- The titles are the links towards the detailed notes of the book.
- The add user nav link allows you to add new users based on unique names.

## Limitations

The current limitation are
  - There is no editing of the already given summaries or noted.
  - Furthermore, the detailed notes are not paragraphwise as there is only a single column attached to it. Next improvement could be to implement the detailed notes in a separate table and then reference the same from it and displayed as different paragraphs.
  - Login pages are not setup so Users page is used. Another enhancement is to implement the login methodology and discard the users page to select the user.
  - Another improvement that can be done is to make it as an API where in the the requested data can be sent to be viewed in different site.
