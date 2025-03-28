import express from 'express';
import multer from 'multer';

import db from '../db.js';

const router = express.Router();

router.get('/rapat', (req, res) => {
    console.log("GET api")
})