import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, '../templates/form_izin_template.docx');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/cuti/all', (req, res) => {
    console.log("GET /api/data_cuti/cuti/all");
    const query = `
    SELECT 
        p.nip,
        p.nama_pegawai,
        c.id_cuti,
        c.id_pegawai,
        c.tanggal_mulai,
        c.tanggal_selesai,
        c.bukti_form_izin,
        c.status_cuti
    FROM 
        data_cuti c
    JOIN 
        data_pegawai p ON c.id_pegawai = p.id_pegawai;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        return res.json(results);
    });
});

router.delete('/cuti/expired', (req, res) => {
    const query = `
        DELETE FROM data_cuti
        WHERE status_cuti = 'Proses' AND tanggal_selesai < CURDATE()
    `;
    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        return res.json({ message: `${result.affectedRows} cuti telah dihapus` });
    });
});

router.get('/cuti/approved', (req, res) => {
    console.log("GET /api/data_cuti/cuti/approved");
    const query = `
    SELECT 
        p.nip,
        p.nama_pegawai,
        c.id_cuti,
        c.id_pegawai,
        c.tanggal_mulai,
        c.tanggal_selesai,
        c.bukti_form_izin,
        c.status_cuti
    FROM 
        data_cuti c
    JOIN 
        data_pegawai p ON c.id_pegawai = p.id_pegawai
    WHERE
        c.status_cuti = 'Diterima';
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        return res.json(results);
    });
});

router.get('/cuti/approved/:id_pegawai', (req, res) => {
    console.log("GET /api/data_cuti/cuti/approved/:id_pegawai");
    const { id_pegawai } = req.params;
    if (!id_pegawai) {
        return res.status(400).json({ message: 'id_pegawai is required' });
    }

    const query = `
    SELECT 
        MONTH(tanggal_mulai) AS bulan,
        YEAR(tanggal_mulai) AS tahun,
        CAST(SUM(DATEDIFF(tanggal_selesai, tanggal_mulai) + 1) AS UNSIGNED) AS jumlah_cuti
    FROM 
        data_cuti
    WHERE
        status_cuti = 'Diterima'
        AND id_pegawai = ?
    GROUP BY 
        MONTH(tanggal_mulai), YEAR(tanggal_mulai)
    ORDER BY 
        tahun, bulan;
    `;

    db.query(query, [id_pegawai], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        console.log('Jumlah entri cuti diterima per bulan untuk pegawai:', results);
        return res.json(results);
    });
});

router.post('/cuti', upload.single('bukti_form_izin'), (req, res) => {
    const { id_pegawai, tanggalMulai, tanggalSelesai } = req.body;
    const file = req.file;
    
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const buktiFormIzinBuffer = file.buffer;

    const query = `
        INSERT INTO data_cuti (id_pegawai, tanggal_mulai, tanggal_selesai, bukti_form_izin, status_cuti)
        VALUES (?, ?, ?, ?, 'Proses')
    `;
    db.query(query, [id_pegawai, tanggalMulai, tanggalSelesai, buktiFormIzinBuffer], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        return res.status(201).json({ message: 'Pengajuan Cuti Berhasil', id_cuti: result.insertId });
    });
});

router.get('/cuti/:id_pegawai', (req, res) => {
    const { id_pegawai } = req.params;
    const query = `
    SELECT 
        c.id_cuti,
        c.id_pegawai,
        c.tanggal_mulai,
        c.tanggal_selesai,
        c.bukti_form_izin,
        c.status_cuti
    FROM 
        data_cuti c
    WHERE 
        c.id_pegawai = ?
    `;
    db.query(query, [id_pegawai], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        return res.json(results);
    });
});

router.get('/cuti/view-bukti/:id_cuti', (req, res) => {
    const { id_cuti } = req.params;

    const sql = 'SELECT bukti_form_izin FROM data_cuti WHERE id_cuti = ?';
    db.query(sql, [id_cuti], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.length > 0) {
            const buktiFormIzin = result[0].bukti_form_izin;
            if (buktiFormIzin) {
                const buffer = Buffer.from(buktiFormIzin, 'base64');

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
                res.status(404).json({ error: 'Bukti Form Izin not found' });
            }
        } else {
            res.status(404).json({ error: 'Cuti not found' });
        }
    });
});

router.put('/cuti/:id_pegawai', (req, res) => {
    const { id_pegawai } = req.params;
    const { status_cuti } = req.body;
    const query = `
        UPDATE data_cuti
        SET status_cuti = ?
        WHERE id_cuti = ?
    `;
    db.query(query, [status_cuti, id_pegawai], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cuti tidak ditemukan' });
        }

        return res.status(200).json({ message: 'Status cuti berhasil diperbarui' });
    });
});

router.get('/cuti/daily', (req, res) => {
    const { date } = req.query;
    const query = `
        SELECT 
            COUNT(*) AS Cuti
        FROM 
            data_cuti
        WHERE 
            DATE(tanggal_mulai) <= ? AND DATE(tanggal_selesai) >= ?
    `;
    db.query(query, [date, date], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        return res.json(results[0]);
    });
});

router.post('/notifikasi-admin', (req, res) => {
    const { id_pegawai, message } = req.body;
    const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type)
        VALUES (?, ?, NOW(), 'admin')
    `;
    db.query(query, [id_pegawai, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        return res.status(201).json({ message: 'Notifikasi berhasil ditambahkan' });
    });
});

router.get('/notifikasi-admin', (req, res) => {
    const query = `
        SELECT * FROM notifikasi
        WHERE type = 'admin'
        ORDER BY tanggal DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        return res.json(results);
    });
});

router.put('/notifikasi/:id_notifikasi', (req, res) => {
    const { id_notifikasi } = req.params;
    const query = `
        UPDATE notifikasi
        SET status = 'read'
        WHERE id_notifikasi = ?
    `;
    db.query(query, [id_notifikasi], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        return res.status(200).json({ message: 'Status notifikasi berhasil diperbarui' });
    });
});

router.post('/notifikasi-pegawai', (req, res) => {
    const { id_pegawai, message } = req.body;
    const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type)
        VALUES (?, ?, NOW(), 'pegawai')
    `;
    db.query(query, [id_pegawai, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        return res.status(201).json({ message: 'Notifikasi berhasil ditambahkan' });
    });
});

router.get('/notifikasi/:id_pegawai', (req, res) => {
    const { id_pegawai } = req.params;
    const query = `
      SELECT * FROM notifikasi
      WHERE id_pegawai = ? AND type = 'pegawai'
      ORDER BY tanggal DESC
    `;
    db.query(query, [id_pegawai], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
  
      return res.json(results);
    });
});  

router.get('/download-template-cuti', (req, res) => {
    res.download(TEMPLATE_PATH, 'form_izin_template.docx', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });
});

export default router;