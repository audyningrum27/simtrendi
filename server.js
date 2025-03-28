import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 9000;
const APP_URL = process.env.APP_URL || 'localhost';

const url = `http://${APP_URL}:${PORT}`;

app.listen(PORT, () => {
    console.log(`Server running on \x1b[34m\x1b[4m${url}\x1b[0m`);
});
