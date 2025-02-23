const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const app = express();
const port = 5000;

// Middleware to parse JSON data
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",  // your MySQL username
    password: "",  // your MySQL password
    database: "user_registration"
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL database.");
});

// Handle user registration (Sign-up)
app.post("/signup", (req, res) => {
    const { role, fullName, email, password, companyName, storeName, storeID } = req.body;
    
    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: "Error hashing password" });

        let table;
        let additionalFields = [];

        // Determine the table based on the role
        if (role === "manufacturer") {
            table = "manufacturers";
            additionalFields = [companyName];
        } else if (role === "seller") {
            table = "sellers";
            additionalFields = [storeName, storeID];
        } else if (role === "consumer") {
            table = "consumers";
        }

        const sql = `INSERT INTO ${table} (name, email, password, ${additionalFields.length > 0 ? additionalFields.join(', ') : ''}) VALUES (?, ?, ?, ?)`;

        // Prepare the values for insertion
        const values = [fullName, email, hashedPassword, ...additionalFields];

        db.query(sql, values, (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Error registering user" });
            }
            res.status(200).json({ message: "User registered successfully!" });
        });
    });
});

// Handle user login
app.post("/login", (req, res) => {
    const { email, password, role } = req.body;
    let table;

    // Determine the table based on the role
    if (role === "manufacturer") {
        table = "manufacturers";
    } else if (role === "seller") {
        table = "sellers";
    } else if (role === "consumer") {
        table = "consumers";
    }

    const sql = `SELECT * FROM ${table} WHERE email = ?`;

    db.query(sql, [email], (err, result) => {
        if (err || result.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = result[0];

        // Compare password
        bcrypt.compare(password, user.password, (err, match) => {
            if (err || !match) {
                return res.status(401).json({ error: "Invalid email or password" });
            }
            res.status(200).json({ message: "Login successful", user });
        });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
