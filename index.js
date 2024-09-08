import express from "express";
import axios from "axios";
import pg from "pg";
import bodyParser from "body-parser";
import session from "express-session";

//creating an app from the express.
const app = express();
const port = 3000;

app.use(session({
    secret: 'your_secret_key', // Change this to a strong unique string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use true if using HTTPS
}));

app.use((req, res, next) => {
    console.log('Session:', req.session); // Should log the session object
    next();
});
//setting up the public folder for css and images
app.use(express.static("public"));


app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
// setting up the database connection
const db = new pg.Client({
    user: "postgres",
    host : "localhost",
    database : "bookNotes",
    password : "postgres",
    port : 5432,
});

db.connect();

let currentUserID = 1; //used to get the relevant data. This needs to be valid number in database otherwise there will be errors.
let currentUser = {}
// quantity is either current or all. current uses currentUserID.
async function getUserDetails(quantity,req){
    const currentUserID = req.session.currentUserID;
    // console.log(currentUserID)
    if (quantity === "current"){
        try {
            const result = await db.query("SELECT * FROM users WHERE id = $1;",[currentUserID]);
            const user = result.rows[0]
            req.session.currentUser = user
        } catch (error) {
            console.log(error)
        }
    } else if (quantity = "all") {
        try {
            const result = await db.query("SELECT * FROM users;");
            const users = result.rows
            return users
        } catch (error) {
            console.log(error)
        }
    } else {
        console.log("Wrong argument given in the getUserDetails().")
    }
    
}

async function getUserByName(name){
    const result = await db.query("SELECT name FROM users WHERE LOWER (name) = $1;",[name.toLowerCase()]);
    if (result.rowCount == 0) {
        return ""
    } else {
        return result.rows[0].name
    }
    
}

async function getUserNotes(req) {
    const currentUserID = req.session.currentUserID;
    const result = await db.query(`SELECT notes.summary, notes.user_id, notes.publishing_date AS npd, notes.book_id, books.title,books.author, books.publishing_date, books.isbn, ratings.rating 
        FROM notes
        LEFT JOIN books ON notes.book_id = books.id
        LEFT JOIN ratings ON ratings.user_id = notes.user_id AND ratings.book_id = notes.book_id
        WHERE notes.user_id = $1 ORDER BY books.title ASC;`,[currentUserID]);
    if (result.rowCount === 0){
        return "No content Found"
    } else {
        const notes = result.rows;
        return notes
    }
}

async function getDetailNotes(userID, BookID) {
    const result = await db.query(`SELECT notes.summary, notes.detailed_notes, notes.user_id, notes.book_id, notes.publishing_date AS npd, books.title,books.author, books.publishing_date, books.isbn, ratings.rating 
                    FROM notes
                    LEFT JOIN books ON notes.book_id = books.id
                    LEFT JOIN ratings ON ratings.user_id = $1 AND  ratings.book_id = $2
                    WHERE notes.user_id = $1;`,[userID,BookID]);
    return result.rows[0]
}

async function getAverageRating(bookID) {
    const result = await db.query(`SELECT AVG(rating) FROM ratings WHERE book_id = $1`,[bookID]);
    // console.log(result.rows)
    return parseFloat(result.rows[0].avg).toFixed(2);

}

app.get("/", async (req , res) => {
    if (!req.session.currentUserID) {
        // Assign a default user ID if not set
        req.session.currentUserID = 4; // Replace '1' with a valid default user ID from your database
        await getUserDetails("current", req); // Get the details for the default user
    }
    await getUserDetails("current",req)
    // console.log(req.session)
    res.render("index.ejs",{user : req.session.currentUser})
})

// handling user related routes here
app.get("/users", async (req , res) => {
    const allUsers = await getUserDetails('all',req);
    // console.log(allUsers);
    res.render("users.ejs",{user:req.session.currentUser, usersAll : allUsers})
})

app.get("/users/:id", (req, res) => {
    req.session.currentUserID = req.params.id; // Store in session
    res.redirect("/");
});

//handling add-user routes here
app.get("/add-user", (req , res) => {
    res.render("add-user.ejs");
})

app.post("/add-user",  async (req , res) => {
    const name = req.body.name;
    // console.log(name.toUpperCase());
    
    const dbNameCheck = await getUserByName(name);
    // console.log(dbNameCheck)
    if (dbNameCheck !=''){
        res.render("add-user.ejs", {message : 'Name Already Exist.'});
    } else {
        const result = await db.query("INSERT INTO users (name) VALUES ($1) RETURNING *;",[name])
        req.session.currentUserID = result.rows[0].id;
        res.redirect("/")

    }    
})

//handling the notes routes here

app.get("/notes", async (req , res) => {
    const notes = await getUserNotes(req);
    // console.log(notes);
    if (notes === "No content Found"){
        res.render("notes.ejs",{user:req.session.currentUser, message: notes})
    } else{
        res.render("notes.ejs",{notes:notes , user: currentUser});
    }
})

app.get("/notes/:user_id/:book_id", async (req , res) => {
    const reqUserID = req.params.user_id;
    const reqBookID = req.params.book_id;
    const noteDetails = await getDetailNotes(reqUserID,reqBookID);
    const averageBookRating = await getAverageRating(reqBookID);
    // console.log(averageBookRating);
    res.render("detail-note.ejs",{user:req.session.currentUser, note : noteDetails , averageRating:averageBookRating});

})

// Handling the add-review routes
app.get("/add-review", async (req , res) => {
    res.render("add-review.ejs")
})

app.get('/search-titles', async (req, res) => {
    const searchTerm = req.query.q; // Get the search term from the query string

    // Query the database for titles matching the search term (adjust according to your DB)
    const titles = await db.query(`
        SELECT title, author, publishing_date, isbn 
        FROM books 
        WHERE title ILIKE $1
        LIMIT 10
    `, [`%${searchTerm}%`]);

    res.json(titles.rows); // Send matching titles as a JSON response
});

app.post("/add-review", async (req , res) => {
    const formTitle = req.body.title;
    const formAuthor = req.body.author;
    const formPublishingDate = req.body.publishingDate;
    const formISBN = req.body.isbn;
    const formRating = req.body.rating;
    const formSummary = req.body.summary;
    const formDetailNotes = req.body.notes;
    let formID = 0;
    // console.log(formPublishingDate);
    
    //Check the id of the Book title
    try {
        const checkTitleID = await db.query("SELECT * from books WHERE LOWER (title) = $1;",[formTitle.toLowerCase()])
        // console.log(checkTitleID.rows);
        // console.log(typeof(checkTitleID.rowCount));
        
        
        if (checkTitleID.rowCount === 0 || checkTitleID.rowCount > 1) { //check row count to either get the title ID or else enter the data into the books table
            if (checkTitleID.rowCount === 0) {
                // console.log("entered into the NewBook entry");
                
                const newBookEntry = await db.query(`INSERT INTO books (title, author , publishing_date, isbn)
                    VALUES ($1 ,$2 ,$3 ,$4)
                    RETURNING *`,[formTitle,formAuthor,formPublishingDate,formISBN]);
                formID = newBookEntry.rows[0].id;
            } else {
                console.log("There are more than one title matching the formTitle in add-review form.");
            }

        } else {
            
            
            formID = checkTitleID.rows[0].id;          
        }
    } catch (error) {
        // console.log("Entered the Error cathing code for book title");
        console.log(error.stack)
    }

    try {
        //check if the notes alreay exist or not
        const checkNotes = await db.query("SELECT * from notes WHERE book_id = $1 AND user_id = $2;",[formID,req.session.currentUserID])
        // console.log(checkNotes.rows);
        
        if (checkNotes.rowCount >= 1) {
            if (checkNotes.rowCount === 1) { //update the records
                console.log("The notes ");
            } else {
                console.log("There more than one note related to (book_id and user_id).")
            }
            
        } else { //Make new entry in the notes. 
            try {
                // console.log("entered notes entry block");
                // console.log("Entered note insert");
                
                await db.query("INSERT INTO notes (summary,detailed_notes,user_id,book_id,publishing_date) VALUES ($1,$2,$3,$4,$5);",[formSummary,formDetailNotes,req.session.currentUserID,formID,new Date()]);
            } catch (error) {
                console.log("entered note error catching block");
                console.error(error.stack)
            }
            try {
                await db.query(`INSERT INTO ratings (book_id, user_id,rating)
                    VALUES (${formID},${req.session.currentUserID},${formRating});`)
            } catch (error) {
                console.log("entered rating error catching block");
                
                console.error(error.stack);
                
            }
            //Once the entry has been made the page needs to be redirected to the detailedR Review page
            // console.log("currentUserID:",currentUserID);
            
            res.redirect("/");
            
            
        }
    } catch (error) {
        console.error(error.stack);
    }
})

app.listen(port, () =>{
    console.log(`Server running on port ${port}.`)
})