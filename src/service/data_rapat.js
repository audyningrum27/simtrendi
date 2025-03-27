import express from 'express';
import db from '../db.js';
import multer from 'multer';

const router = express.Router();

//Menampilkan Detail Rapat
router.get('/rapat', (req, res) => {
    console.log("GET api")
})