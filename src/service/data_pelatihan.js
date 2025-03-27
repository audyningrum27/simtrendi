import express from 'express';
import db from '../../database/db.js';
import multer from 'multer';

const router = express.Router();

// Menampilkan Pelatihan di Grafik
router.get('/pelatihan-per-bulan', (req, res) => {
    const query = `
    SELECT 
        MONTH(tanggal_mulai) AS bulan, 
        COUNT(CASE WHEN status = 'Selesai' THEN 1 END) AS selesai,
        COUNT(CASE WHEN status = 'Proses' THEN 1 END) AS proses,
        COUNT(CASE WHEN status = 'Belum Dimulai' THEN 1 END) AS belum_dimulai
    FROM data_pelatihan
    GROUP BY MONTH(tanggal_mulai)
  `;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        res.json(results);
    });
});

// Mendapatkan jumlah pelatihan per bulan berdasarkan status dan id_pegawai
router.get('/pelatihan-per-bulan/:id_pegawai', (req, res) => {
    const { id_pegawai } = req.params;
    const query = `
    SELECT 
      MONTH(tanggal_mulai) AS bulan, 
      status,
      COUNT(*) AS jumlah_pelatihan
    FROM data_pelatihan
    WHERE id_pegawai = ?
    GROUP BY MONTH(tanggal_mulai), status
    ORDER BY MONTH(tanggal_mulai)
  `;
    db.query(query, [id_pegawai], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        res.json(results);
    });
});

//Menampilkan tabel Pelatihan Pegawai berdasarkan id pegawai
router.get('/status_count/:id_pegawai', async (req, res) => {
    const { id_pegawai } = req.params;

    try {
        const query = `
        SELECT status, COUNT(*) as jumlah
        FROM data_pelatihan
        WHERE id_pegawai = ?
        GROUP BY status;
      `;
        const [rows] = await db.execute(query, [id_pegawai]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pelatihan count:', error);
        res.status(500).send('Server error');
    }
});


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ADMIN
// Menampilkan Data Pelatihan
router.get('/pelatihan', (req, res) => {
    console.log("GET /api/data_pelatihan/pelatihan");
    const query = `
    SELECT 
        p.nip,
        p.nama_pegawai,
        pel.id_pelatihan,
        pel.id_pegawai,
        pel.nama_penyelenggara,
        pel.nama_kegiatan,
        pel.tanggal_mulai,
        pel.tanggal_selesai,
        pel.deskripsi_kegiatan,
        pel.status,
        pel.bukti_pelaksanaan
    FROM 
        data_pelatihan pel
    JOIN 
        data_pegawai p ON pel.id_pegawai = p.id_pegawai
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        return res.json(results);
    });
});

//Menampilkan Detail Pelatihan
router.get('/pelatihan/:id_pelatihan', (req, res) => {
    const { id_pelatihan } = req.params;
    const sql = `
    SELECT 
        p.nip,
        p.nama_pegawai,
        pel.id_pelatihan,
        pel.id_pegawai,
        pel.nama_penyelenggara,
        pel.nama_kegiatan,
        pel.tanggal_mulai,
        pel.tanggal_selesai,
        pel.deskripsi_kegiatan,
        pel.brosur_pelatihan,
        pel.status,
        pel.bukti_pelaksanaan
    FROM 
        data_pelatihan pel
    JOIN 
        data_pegawai p ON pel.id_pegawai = p.id_pegawai
    WHERE 
        id_pelatihan = ?
    `;
    db.query(sql, [id_pelatihan], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            if (result.length > 0) {
                let pelatihan = result[0];
                if (pelatihan.bukti_pelaksanaan) {
                    let imageType = 'jpeg'; // Default
                    const buffer = Buffer.from(pelatihan.bukti_pelaksanaan);
                    if (buffer.slice(0, 4).toString('hex') === '89504e47') {
                        imageType = 'png';
                    }
                    pelatihan.bukti_pelaksanaan = {
                        data: buffer.toString('base64'),
                        type: imageType
                    };
                }

                res.json(pelatihan);
            } else {
                res.status(404).json({ error: 'Pelatihan not found' });
            }
        }
    });
});

// Menampilkan Bukti Pelaksanaan
router.get('/pelatihan/view-bukti/:id_pelatihan', (req, res) => {
    const { id_pelatihan } = req.params;

    const sql = 'SELECT bukti_pelaksanaan FROM data_pelatihan WHERE id_pelatihan = ?';
    db.query(sql, [id_pelatihan], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.length > 0) {
            const buktiPelaksanaan = result[0].bukti_pelaksanaan;
            if (buktiPelaksanaan) {
                const buffer = Buffer.from(buktiPelaksanaan, 'base64');

                // Default type is jpeg
                let contentType = 'image/jpeg';
                const fileSignature = buffer.slice(0, 4).toString('hex');

                if (fileSignature === '89504e47') {
                    contentType = 'image/png';
                } else if (fileSignature === '25504446') {
                    contentType = 'application/pdf';
                }

                res.setHeader('Content-Type', contentType);
                res.send(buffer);
            } else {
                res.status(404).json({ error: 'Bukti Pelaksanaan not found' });
            }
        } else {
            res.status(404).json({ error: 'Pelatihan not found' });
        }
    });
});

// Menampilkan Brosur Pelatihan
router.get('/pelatihan/view-brosur/:id_pelatihan', (req, res) => {
    const { id_pelatihan } = req.params;

    const sql = 'SELECT brosur_pelatihan FROM data_pelatihan WHERE id_pelatihan = ?';
    db.query(sql, [id_pelatihan], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.length > 0) {
            const brosurPelatihan = result[0].brosur_pelatihan;
            if (brosurPelatihan) {
                const buffer = Buffer.from(brosurPelatihan, 'base64');

                // Default type is jpeg
                let contentType = 'image/jpeg';
                const fileSignature = buffer.slice(0, 4).toString('hex');

                if (fileSignature === '89504e47') {
                    contentType = 'image/png';
                } else if (fileSignature === '25504446') {
                    contentType = 'application/pdf';
                }

                res.setHeader('Content-Type', contentType);
                res.send(buffer);
            } else {
                res.status(404).json({ error: 'Brosur Pelatihan Izin not found' });
            }
        } else {
            res.status(404).json({ error: 'Pelatihan not found' });
        }
    });
});

// Menambah Jadwal Pelatihan
router.post('/pelatihan', upload.single('brosur_pelatihan'), (req, res) => {
    const { id_pegawai, nama_penyelenggara, nama_kegiatan, tanggal_mulai, tanggal_selesai, deskripsi_kegiatan } = req.body;
    const brosur_pelatihan = req.file.buffer;
    const status = 'Belum Dimulai';
    const query = `INSERT INTO data_pelatihan (id_pegawai, nama_penyelenggara, nama_kegiatan, tanggal_mulai, tanggal_selesai, deskripsi_kegiatan, brosur_pelatihan, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let promises = id_pegawai.map(id => {
        return new Promise((resolve, reject) => {
            db.query(query, [id, nama_penyelenggara, nama_kegiatan, tanggal_mulai, tanggal_selesai, deskripsi_kegiatan, brosur_pelatihan, status], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });

    Promise.all(promises)
        .then(results => {
            res.status(201).json({ message: 'Jadwal Pelatihan created successfully', results });
        })
        .catch(err => {
            console.error('Error inserting data:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

//Mengedit Jadwal Pelatihan
router.put('/pelatihan/:id_pelatihan', (req, res) => {
    const { id_pelatihan } = req.params;
    const { nama_penyelenggara, nama_kegiatan, tanggal_mulai, tanggal_selesai, deskripsi_kegiatan } = req.body;

    const query = `
    UPDATE data_pelatihan 
    SET 
      nama_penyelenggara = ?, 
      nama_kegiatan = ?, 
      tanggal_mulai = ?, 
      tanggal_selesai = ?, 
      deskripsi_kegiatan = ? 
    WHERE id_pelatihan = ?`;

    db.query(query, [nama_penyelenggara, nama_kegiatan, tanggal_mulai, tanggal_selesai, deskripsi_kegiatan, id_pelatihan], (err, result) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pelatihan not found' });
        }
        res.json({ message: 'Pelatihan updated successfully' });
    });
});

//Menghapus Jadwal Pelatihan
router.delete('/pelatihan/:id_pelatihan', (req, res) => {
    const { id_pelatihan } = req.params;
    const query = `DELETE FROM data_pelatihan WHERE id_pelatihan = ?`;
    db.query(query, [id_pelatihan], (err, result) => {
        if (err) {
            console.error('Error deleting data:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pelatihan not found' });
        }
        res.json({ message: 'Pelatihan deleted successfully' });
    });
});

// Mengubah status pelatihan
router.put('/pelatihan/status/:id_pelatihan', (req, res) => {
    const { id_pelatihan } = req.params;
    const { status } = req.body;

    const query = `
    UPDATE data_pelatihan 
    SET 
      status = ? 
    WHERE id_pelatihan = ?`;

    db.query(query, [status, id_pelatihan], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pelatihan not found' });
        }
        res.json({ message: 'Status updated successfully' });
    });
});

//USER
//Menampilkan jadwal pelatihan berdasarkan id pegawai
router.get('/jadwalpelatihan/:id_pegawai', (req, res) => {
    const { id_pegawai } = req.params;
    console.log("GET /api/data_pelatihan/pelatihan/:id_pegawai");
    const query = `
    SELECT 
        p.nip,
        p.nama_pegawai,
        pel.id_pelatihan,
        pel.id_pegawai,
        pel.nama_penyelenggara,
        pel.nama_kegiatan,
        pel.tanggal_mulai,
        pel.tanggal_selesai,
        pel.deskripsi_kegiatan,
        pel.status,
        pel.bukti_pelaksanaan
    FROM 
        data_pelatihan pel
    JOIN 
        data_pegawai p ON pel.id_pegawai = p.id_pegawai
    WHERE 
        pel.id_pegawai = ?
    `;
    db.query(query, [id_pegawai], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        return res.json(results);
    });
});

// Menampilkan pelatihan dengan status "Proses" berdasarkan id pegawai
router.get('/pelatihan-proses/:id_pegawai', (req, res) => {
    const { id_pegawai } = req.params;
    const query = `
    SELECT 
        id_pelatihan, 
        nama_kegiatan,
        nama_penyelenggara,
        tanggal_mulai,
        tanggal_selesai
    FROM 
        data_pelatihan 
    WHERE 
        id_pegawai = ? AND status = 'Proses'
    `;
    db.query(query, [id_pegawai], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        res.json(results);
    });
});

// Mengupload bukti pelaksanaan pada pelatihan dengan status "Proses"
router.post('/upload-bukti/:id_pelatihan', upload.single('bukti_pelaksanaan'), (req, res) => {
    const { id_pelatihan } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileBuffer = file.buffer;

    const query = 'UPDATE data_pelatihan SET bukti_pelaksanaan = ?, status = ? WHERE id_pelatihan = ? AND status = ?';
    db.query(query, [fileBuffer, 'Belum Acc', id_pelatihan, 'Proses'], (err, result) => {
        if (err) {
            console.error('Error uploading file to the database:', err);
            return res.status(500).json({ message: 'Error uploading file' });
        }
        res.status(200).json({ message: 'Bukti pelaksanaan uploaded successfully' });
    });
});

export default router;