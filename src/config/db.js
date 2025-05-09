import mysql from "mysql2";
import { Client } from "ssh2";
import dotenv from "dotenv";

dotenv.config();

const isLevel = process.env.LEVEL;

let db;

if (isLevel === "local") {
  const dbConfig = {
    host: process.env.DB_HOST_LOCAL,
    database: process.env.DB_DATABASE_LOCAL,
    user: process.env.DB_USER_LOCAL,
    password: process.env.DB_PASSWORD_LOCAL,
    port: process.env.DB_PORT_LOCAL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  db = mysql.createPool(dbConfig);
}

if (isLevel === "production") {
  const dbConfig = {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  db = mysql.createPool(dbConfig);
}

if (isLevel === "development") {
  const sshConfig = {
    host: process.env.SSH_HOST,
    port: process.env.SSH_PORT,
    username: process.env.SSH_USERNAME,
    password: process.env.SSH_PASSWORD,
  };

  const dbConfig = {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  const sshClient = new Client();

  const connectToDatabase = () => {
    return new Promise((resolve, reject) => {
      sshClient
        .on("ready", () => {
          console.log("SSH Connection Established");

          sshClient.forwardOut(
            "127.0.0.1",
            0,
            dbConfig.host,
            dbConfig.port,
            (err, stream) => {
              if (err) {
                console.error("SSH Forwarding Error:", err);
                sshClient.end();
                reject(err);
                return;
              }

              const updatedDbConfig = {
                ...dbConfig,
                stream,
              };

              const db = mysql.createPool(updatedDbConfig);
              console.log("Database Connection Established");
              resolve(db);
            }
          );
        })
        .connect(sshConfig);
    });
  };

  db = await connectToDatabase();
}

function keepAlive() {
  setInterval(() => {
    db.query("SELECT 1", (err) => {
      if (err) console.error("Database keep-alive error:", err);
    });
  }, process.env.SET_INTERVAL || 30000);
}

keepAlive();

export default db;
