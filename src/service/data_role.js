import express from 'express';
import db from '../../database/db.js';
import moment from 'moment-timezone';

const router = express.Router();

//Menampilkan Pertanyaan Berdasarkan Id Role
router.get('/role/:id_role', (req, res) => {
    const { id_role } = req.params;

    const sqlQuery = `
        SELECT id_deskripsi, pertanyaan_role
        FROM deskripsi_role
        WHERE id_role = ?
    `;

    db.query(sqlQuery, [id_role], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.json(results);
    });
});

// Menyimpan data transaksi_role
router.post('/transaksi_role', async (req, res) => {
    const data = req.body;
    const timezone = 'Asia/Jakarta';

    const updateData = (item) => {
        if (!item.id_deskripsi) {
            console.error('id_deskripsi is missing or null:', item);
            return Promise.reject(new Error('id_deskripsi cannot be null'));
        }

        const localDate = moment(item.tanggal).tz(timezone).format('YYYY-MM-DD HH:mm:ss');

        const sqlUpdate = `
            INSERT INTO transaksi_role (id_pegawai, id_deskripsi, id_presensi, tanggal, jawaban)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE jawaban = VALUES(jawaban), tanggal = VALUES(tanggal)
        `;
        const values = [item.id_pegawai, item.id_deskripsi, item.id_presensi, localDate, item.jawaban];
        return new Promise((resolve, reject) => {
            db.query(sqlUpdate, values, (err, result) => {
                if (err) {
                    console.error('Error executing query:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };

    try {
        await Promise.all(data.map(item => updateData(item)));
        res.json({ message: 'Data successfully submitted' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Menampilkan hasil jawaban di Admin
router.get('/questions/:id_presensi', (req, res) => {
    const { id_presensi } = req.params;

    const query = `
        SELECT dr.id_deskripsi, dr.pertanyaan_role, tr.jawaban 
        FROM deskripsi_role dr
        JOIN transaksi_role tr ON dr.id_deskripsi = tr.id_deskripsi
        WHERE tr.id_presensi = ?
    `;

    db.query(query, [id_presensi], (error, results) => {
        if (error) {
            console.error('Error fetching questions:', error);
            return res.status(500).json({ message: 'Error fetching questions' });
        }

        res.json(results);
    });
});

//Menampilkan Jumlah Dari Aktivitas Harian yang Diisi
router.get('/hasil-kinerja/:id_pegawai', (req, res) => {
    const { id_pegawai } = req.params;

    const query = `
        SELECT dr.pertanyaan_role, 
               COUNT(CASE WHEN tr.jawaban = true THEN 1 END) AS jumlah_terlaksana
        FROM deskripsi_role dr
        JOIN role r ON dr.id_role = r.id_role
        JOIN data_pegawai dp ON dp.id_role = r.id_role
        LEFT JOIN transaksi_role tr 
        ON dr.id_deskripsi = tr.id_deskripsi 
        AND tr.id_pegawai = dp.id_pegawai
        WHERE dp.id_pegawai = ?
        GROUP BY dr.id_deskripsi, dr.pertanyaan_role
        ORDER BY dr.id_deskripsi ASC
    `;

    db.query(query, [id_pegawai], (error, results) => {
        if (error) {
            console.error('Error fetching performance data:', error);
            return res.status(500).json({ message: 'Error fetching performance data' });
        }

        res.json(results);
    });
});

export default router;
