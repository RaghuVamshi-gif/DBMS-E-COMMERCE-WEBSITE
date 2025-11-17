import mysql from "mysql2";

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Raghu#123",   // <= enter your password here
    database: "ecommerce"
});

db.connect(err => {
    if (err) console.log("DB ERROR:", err);
    else console.log("MySQL Connected Successfully");
});

export default db;
