import express from 'express';
import db from '../../database/db.js';

const router = express.Router();

// Admin
// Menambah Notifikasi Jika Ada Pengajuan Cuti
router.post('/notifikasi-admin/cuti', (req, res) => {
    const { id_pegawai, message } = req.body;
    const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
        VALUES (?, ?, NOW(), 'admin', 'cuti')
    `;
    db.query(query, [id_pegawai, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        return res.status(201).json({ message: 'Notifikasi berhasil ditambahkan' });
    });
});

// Menampilkan Notifikasi Jika Ada Pengajuan Cuti
router.get('/notifikasi-admin/cuti', (req, res) => {
    const query = `
        SELECT * FROM notifikasi
        WHERE type = 'admin' AND category = 'cuti'
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

// Update status notifikasi cuti
router.put('/notifikasi-admin/cuti/:id_notifikasi', (req, res) => {
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

// Menambah Notifikasi Jika Ada Pelaporan Pelatihan
router.post('/notifikasi-admin/pelatihan', (req, res) => {
    const { id_pegawai, message } = req.body;
    const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
        VALUES (?, ?, NOW(), 'admin', 'pelatihan')
    `;
    db.query(query, [id_pegawai, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        return res.status(201).json({ message: 'Notifikasi berhasil ditambahkan' });
    });
});

// Menampilkan Notifikasi Jika Ada Pelaporan Pelatihan
router.get('/notifikasi-admin/pelatihan', (req, res) => {
    const query = `
        SELECT * FROM notifikasi
        WHERE type = 'admin' AND category = 'pelatihan'
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

// Update status notifikasi pelatihan
router.put('/notifikasi-admin/pelatihan/:id_notifikasi', (req, res) => {
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

// Pegawai
// Menambah Notifikasi Jika Cuti Diterima 
router.post('/notifikasi-pegawai/cuti', (req, res) => {
    const { id_pegawai, message } = req.body;
    const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
        VALUES (?, ?, NOW(), 'pegawai', 'cuti')
    `;
    db.query(query, [id_pegawai, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        return res.status(201).json({ message: 'Notifikasi berhasil ditambahkan' });
    });
});

// Menampilkan Notifikasi Berdasarkan ID Pegawai jika Cuti Diterima
router.get('/notifikasi-cuti/:id_pegawai', (req, res) => {
    const { id_pegawai } = req.params;
    const query = `
      SELECT * FROM notifikasi
      WHERE id_pegawai = ? 
        AND type = 'pegawai' 
        AND category = 'cuti'
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

// Update status notifikasi Cuti
router.put('/notifikasi-cuti/:id_notifikasi', (req, res) => {
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

// Menambah Notifikasi Jika Ada Jadwal Pelatihan
router.post('/notifikasi-pegawai/pelatihan', (req, res) => {
    const { id_pegawai, message } = req.body;
    const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
        VALUES (?, ?, NOW(), 'pegawai', 'pelatihan')
    `;
    db.query(query, [id_pegawai, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        return res.status(201).json({ message: 'Notifikasi berhasil ditambahkan' });
    });
});

// Menampilkan Notifikasi Berdasarkan ID Pegawai Jika Ada Jadwal Pelatihan
router.get('/notifikasi-pelatihan/:id_pegawai', (req, res) => {
    const { id_pegawai } = req.params;
    const query = `
      SELECT * FROM notifikasi
      WHERE id_pegawai = ? 
        AND type = 'pegawai' 
        AND category = 'pelatihan'
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

// Update status notifikasi Pelatihan
router.put('/notifikasi-pelatihan/:id_notifikasi', (req, res) => {
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

// Menambah Notifikasi Jika Pelatihan Disetujui atau Ditolak
router.post('/notifikasi-pegawai/accpelatihan', (req, res) => {
    const { id_pegawai, message } = req.body;
    const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
        VALUES (?, ?, NOW(), 'pegawai', 'acc-pelatihan')
    `;
    db.query(query, [id_pegawai, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        return res.status(201).json({ message: 'Notifikasi berhasil ditambahkan' });
    });
});

// Menampilkan Notifikasi Pelatihan Disetujui atau Ditolak
router.get('/notifikasi-acc-pelatihan/:id_pegawai', (req, res) => {
    const { id_pegawai } = req.params;
    const query = `
      SELECT * FROM notifikasi
      WHERE id_pegawai = ? 
        AND type = 'pegawai' 
        AND category = 'acc-pelatihan'
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

// Update status notifikasi Persetujuan Pelatihan
router.put('/notifikasi-acc-pelatihan/:id_notifikasi', (req, res) => {
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

export default router;