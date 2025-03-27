// import mysql from 'mysql2';

// const db = mysql.createConnection({
//     host: "alessandria-db.id.domainesia.com",
//     database: "risetdrp_simatren",
//     user: "risetdrp_simatren",
//     password: "jkqmy5mn8j5qxcmg0k",
//     port: 3306
// });

// db.connect((err) => {
//     if (err) throw err;
//     console.log('Connected to database');
// });

// export default db;

import mysql from 'mysql2';

const dbConfig = {
    host: "alessandria-db.id.domainesia.com",
    database: "risetdrp_simatren",
    user: "risetdrp_simatren",
    password: "jkqmy5mn8j5qxcmg0k",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const db = mysql.createPool(dbConfig);

// Function Keep Alive
function keepAlive() {
    setInterval(() => {
        db.query('SELECT 1', (err) => {
            if (err) console.error("Database keep-alive error:", err);
        });
    }, 30000); // Ping database setiap 30 detik
}

keepAlive();

export default db;
