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

const db = new pg.Client({
    user: "postgres",
    host : "localhost",
    database : "bookNotes",
    password : "postgres",
    port : 5432,
});

db.connect();

let currentUserID = 1;
async function getUserDetails(quantity){
    if (quantity === "current"){
        try {
            const result = await db.query("SELECT * FROM users WHERE id = $1;",[currentUserID]);
            const user = result.rows[0]
            return user
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

app.get("/", async (req , res) => {
    const currentUserDetail = await getUserDetails("current")
    res.render("index.ejs",{user : currentUserDetail})
})

app.get("/users", async (req , res) => {
    const currentUser = await getUserDetails("current");
    const allUsers = await getUserDetails('all');
    console.log(allUsers);
    
    res.render("users.ejs",{user:currentUser, usersAll : allUsers})
})

app.get("/users/:id", (req, res) => {
    currentUserID = req.params.id;
    res.redirect("/");
})

app.listen(port, () =>{
    console.log(`Server running on port ${port}.`)
})