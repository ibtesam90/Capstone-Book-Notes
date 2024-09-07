import express from "express";
import axios from "axios";
import pg from "pg";
import bodyParser from "body-parser";

//creating an app from the express.
const app = express();
const port = 3000;

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
async function getUserDetails(quantity){
    if (quantity === "current"){
        try {
            const result = await db.query("SELECT * FROM users WHERE id = $1;",[currentUserID]);
            const user = result.rows[0]
            currentUser = user
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

async function getUserNotes() {
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
    await getUserDetails("current")
    res.render("index.ejs",{user : currentUser})
})

// handling user related routes here
app.get("/users", async (req , res) => {
    const allUsers = await getUserDetails('all');
    // console.log(allUsers);
    res.render("users.ejs",{user:currentUser, usersAll : allUsers})
})

app.get("/users/:id", (req, res) => {
    currentUserID = req.params.id;
    res.redirect("/");
})

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
        currentUserID = result.rows[0].id;
        res.redirect("/")

    }    
})

//handling the notes routes here

app.get("/notes", async (req , res) => {
    const notes = await getUserNotes();
    // console.log(notes);
    if (notes === "No content Found"){
        res.render("notes.ejs",{user:currentUser, message: notes})
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
    res.render("detail-note.ejs",{user:currentUser, note : noteDetails , averageRating:averageBookRating});

})

app.listen(port, () =>{
    console.log(`Server running on port ${port}.`)
})