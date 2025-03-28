import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import db from '../config/db.js';

const router = express.Router();

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    let query = '';
    let queryParams = [];
    if (email === 'admin@gmail.com') {
        query = 'SELECT * FROM admin WHERE email = ?';
        queryParams = [email];
    } else {
        query = 'SELECT * FROM data_pegawai WHERE email = ?';
        queryParams = [email];
    }

    db.query(query, queryParams, (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            const token = jwt.sign({ id: user.id, email: user.email }, 'secretkey', { expiresIn: '1h' });

            return res.json({
                token,
                email: user.email,
                nama_pegawai: user.nama_pegawai,
                nip: user.nip,
                id_pegawai: user.id_pegawai
            });
        });
    });
});

export default router;