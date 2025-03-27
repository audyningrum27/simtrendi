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

function keepAlive() {
    setInterval(() => {
        db.query('SELECT 1', (err) => {
            if (err) console.error("Database keep-alive error:", err);
        });
    }, 30000);
}

keepAlive();

export default db;