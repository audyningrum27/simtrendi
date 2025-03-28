import bcrypt from 'bcryptjs';
import db from './db.js'; 

const hashPassword = async (plainPassword) => {
    const saltRounds = 10;
    return await bcrypt.hash(plainPassword, saltRounds);
};

const createAdmin = async () => {
    const email = 'admin@gmail.com';
    const plainPassword = 'admin123';
    const hashedPassword = await hashPassword(plainPassword);
    const nip = '77668899';
    const nama_pegawai = 'Admin';

    const query = 'INSERT INTO admin (email, password, nip, nama_pegawai) VALUES (?, ?, ?, ?)';

    db.query(query, [email, hashedPassword, nip, nama_pegawai], (err, results) => {
        if (err) {
            console.error('Error inserting admin:', err);
        } else {
            console.log('Admin created successfully');
        }
    });
};

createAdmin();
