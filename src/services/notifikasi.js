import express from "express";

import db from "../config/db.js";

const router = express.Router();

router.post("/notifikasi-admin/cuti", (req, res) => {
  const { id_pegawai, message } = req.body;
  const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
        VALUES (?, ?, NOW(), 'admin', 'cuti')
    `;
  db.query(query, [id_pegawai, message], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(201).json({ message: "Notifikasi berhasil ditambahkan" });
  });
});

router.get("/notifikasi-admin/cuti", (req, res) => {
  const query = `
        SELECT * FROM notifikasi
        WHERE type = 'admin' AND category = 'cuti'
        ORDER BY tanggal DESC
    `;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.json(results);
  });
});

router.put("/notifikasi-admin/cuti/:id_notifikasi", (req, res) => {
  const { id_notifikasi } = req.params;
  const query = `
        UPDATE notifikasi
        SET status = 'read'
        WHERE id_notifikasi = ?
    `;
  db.query(query, [id_notifikasi], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res
      .status(200)
      .json({ message: "Status notifikasi berhasil diperbarui" });
  });
});

router.post("/notifikasi-admin/pelatihan", (req, res) => {
  const { id_pegawai, message } = req.body;
  const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
        VALUES (?, ?, NOW(), 'admin', 'pelatihan')
    `;
  db.query(query, [id_pegawai, message], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(201).json({ message: "Notifikasi berhasil ditambahkan" });
  });
});

router.get("/notifikasi-admin/pelatihan", (req, res) => {
  const query = `
        SELECT * FROM notifikasi
        WHERE type = 'admin' AND category = 'pelatihan'
        ORDER BY tanggal DESC
    `;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.json(results);
  });
});

router.put("/notifikasi-admin/pelatihan/:id_notifikasi", (req, res) => {
  const { id_notifikasi } = req.params;
  const query = `
        UPDATE notifikasi
        SET status = 'read'
        WHERE id_notifikasi = ?
    `;
  db.query(query, [id_notifikasi], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res
      .status(200)
      .json({ message: "Status notifikasi berhasil diperbarui" });
  });
});

router.post("/notifikasi-pegawai/cuti", (req, res) => {
  const { id_pegawai, message } = req.body;
  const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
        VALUES (?, ?, NOW(), 'pegawai', 'cuti')
    `;
  db.query(query, [id_pegawai, message], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(201).json({ message: "Notifikasi berhasil ditambahkan" });
  });
});

router.get("/notifikasi-cuti/:id_pegawai", (req, res) => {
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
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json(results);
  });
});

router.put("/notifikasi-cuti/:id_notifikasi", (req, res) => {
  const { id_notifikasi } = req.params;
  const query = `
        UPDATE notifikasi
        SET status = 'read'
        WHERE id_notifikasi = ?
    `;
  db.query(query, [id_notifikasi], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res
      .status(200)
      .json({ message: "Status notifikasi berhasil diperbarui" });
  });
});

router.post("/notifikasi-pegawai/pelatihan", (req, res) => {
  const { id_pegawai, message } = req.body;
  const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
        VALUES (?, ?, NOW(), 'pegawai', 'pelatihan')
    `;
  db.query(query, [id_pegawai, message], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(201).json({ message: "Notifikasi berhasil ditambahkan" });
  });
});

router.get("/notifikasi-pelatihan/:id_pegawai", (req, res) => {
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
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json(results);
  });
});

router.put("/notifikasi-pelatihan/:id_notifikasi", (req, res) => {
  const { id_notifikasi } = req.params;
  const query = `
        UPDATE notifikasi
        SET status = 'read'
        WHERE id_notifikasi = ?
    `;
  db.query(query, [id_notifikasi], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res
      .status(200)
      .json({ message: "Status notifikasi berhasil diperbarui" });
  });
});

router.post("/notifikasi-pegawai/accpelatihan", (req, res) => {
  const { id_pegawai, message } = req.body;
  const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
        VALUES (?, ?, NOW(), 'pegawai', 'acc-pelatihan')
    `;
  db.query(query, [id_pegawai, message], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(201).json({ message: "Notifikasi berhasil ditambahkan" });
  });
});

router.get("/notifikasi-acc-pelatihan/:id_pegawai", (req, res) => {
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
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json(results);
  });
});

router.put("/notifikasi-acc-pelatihan/:id_notifikasi", (req, res) => {
  const { id_notifikasi } = req.params;
  const query = `
        UPDATE notifikasi
        SET status = 'read'
        WHERE id_notifikasi = ?
    `;
  db.query(query, [id_notifikasi], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res
      .status(200)
      .json({ message: "Status notifikasi berhasil diperbarui" });
  });
});

// ROUTE INI YANG DIBUAT

router.get("/admin", (req, res) => {
  const query = `
    SELECT * FROM notifikasi
    WHERE type = 'admin'
        AND status = 'unread'
    ORDER BY id_notifikasi ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Gagal mengambil notifikasi admin:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.status(200).json({ code: 200, data: results });
  });
});

router.put("/admin/:idNotifikasi", (req, res) => {
  const { idNotifikasi } = req.params;
  const checkQuery = `
    SELECT status FROM notifikasi
    WHERE id_notifikasi = ? AND type = 'admin'
  `;
  db.query(checkQuery, [idNotifikasi], (err, results) => {
    if (err) {
      console.error("Gagal memeriksa status notifikasi:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (results.length === 0) {
      return res
        .status(404)
        .json({ code: 404, message: "Notifikasi tidak ditemukan" });
    }
    if (results[0].status === "read") {
      return res
        .status(400)
        .json({ code: 400, message: "Notifikasi sudah dibaca" });
    }
    const updateQuery = `
      UPDATE notifikasi
      SET status = 'read'
      WHERE id_notifikasi = ? AND type = 'admin'
    `;
    db.query(updateQuery, [idNotifikasi], (err) => {
      if (err) {
        console.error("Gagal memperbarui notifikasi:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      return res.status(200).json({
        code: 200,
        message: "Notifikasi berhasil diperbarui menjadi 'read'",
      });
    });
  });
});

router.get("/pegawai/:idPegawai", (req, res) => {
  const { idPegawai } = req.params;
  const query = `
  SELECT * FROM notifikasi
  WHERE id_pegawai = ?
    AND type = 'pegawai'
    AND status = 'unread'
  ORDER BY id_notifikasi ASC
`;
  db.query(query, [idPegawai], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.status(200).json({ code: 200, data: results });
  });
});

router.put("/pegawai/:idPegawai/:idNotifikasi", (req, res) => {
  const { idPegawai, idNotifikasi } = req.params;

  const checkQuery = `
    SELECT status FROM notifikasi
    WHERE id_pegawai = ? AND id_notifikasi = ? AND type = 'pegawai'
  `;

  db.query(checkQuery, [idPegawai, idNotifikasi], (err, results) => {
    if (err) {
      console.error("Gagal memeriksa status notifikasi:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ code: 404, message: "Notifikasi tidak ditemukan" });
    }

    if (results[0].status === "read") {
      return res
        .status(400)
        .json({ code: 400, message: "Notifikasi sudah dibaca" });
    }

    const updateQuery = `
      UPDATE notifikasi
      SET status = 'read'
      WHERE id_pegawai = ? AND id_notifikasi = ? AND type = 'pegawai'
    `;

    db.query(updateQuery, [idPegawai, idNotifikasi], (err) => {
      if (err) {
        console.error("Gagal memperbarui notifikasi:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      return res.status(200).json({
        code: 200,
        message: "Notifikasi berhasil diperbarui menjadi 'read'",
      });
    });
  });
});

export default router;
