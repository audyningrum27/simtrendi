import express, { response } from "express";
import multer from "multer";

import crypto from "crypto";
import db from "../config/db.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/rapat", (req, res) => {
  const sql = "SELECT * FROM data_rapat";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    return res.status(200).json({ code: 200, data: results });
  });
});

router.get("/rapat/hari-ini", (req, res) => {
  const sql = "SELECT * FROM data_rapat WHERE DATE(tanggal_rapat) = CURDATE()";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    return res.status(200).json({ code: 200, data: results });
  });
});

router.get("/rapat/mendatang", (req, res) => {
  const sql = "SELECT * FROM data_rapat WHERE DATE(tanggal_rapat) > CURDATE()";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    return res.status(200).json({ code: 200, data: results });
  });
});

router.get("/rapat/:id", (req, res) => {
  const sql = "SELECT * FROM data_rapat WHERE id_rapat = ?";
  const id = req.params.id;

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    if (results.length === 0) {
      return res
        .status(404)
        .json({ code: 404, message: "Rapat tidak ditemukan" });
    }
    return res.status(200).json({ code: 200, data: results[0] });
  });
});

router.post("/rapat", (req, res) => {
  const {
    judulRapat,
    nomorSurat,
    pelaksanaanRapat,
    ruangRapat,
    tanggalRapat,
    waktuRapat,
    agendaRapat,
  } = req.body;

  if (
    !judulRapat ||
    !nomorSurat ||
    !pelaksanaanRapat ||
    !ruangRapat ||
    !tanggalRapat ||
    !waktuRapat ||
    !agendaRapat
  ) {
    return res.status(400).json({
      status: 400,
      message: "Data tidak lengkap. Harap isi semua field yang diperlukan.",
    });
  }

  const kodePresensi = crypto.randomBytes(35).toString("hex");

  const sql = `
        INSERT INTO data_rapat (
          judul_rapat, nomor_surat, pelaksanaan_rapat,
          ruang_rapat, tanggal_rapat, waktu_rapat, agenda_rapat, kode_presensi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

  const values = [
    judulRapat,
    nomorSurat,
    pelaksanaanRapat,
    ruangRapat,
    tanggalRapat,
    waktuRapat,
    agendaRapat,
    kodePresensi,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Gagal menyimpan data:", err);
      return res.status(500).json({
        status: 500,
        message: "Gagal menyimpan data",
        error: err.message,
      });
    }

    res.status(200).json({
      status: 200,
      message: "Rapat berhasil ditambahkan",

      data: {
        id: result.insertId,
        nomorSurat,
        pelaksanaanRapat,
        ruangRapat,
        tanggalRapat,
        waktuRapat,
        agendaRapat,
        kodePresensi,
      },
    });
  });
});

router.put("/rapat/:id", upload.single("file_notulensi"), (req, res) => {
  const { id } = req.params;
  const {
    judulRapat,
    nomorSurat,
    pelaksanaanRapat,
    ruangRapat,
    tanggalRapat,
    waktuRapat,
    agendaRapat,
    teksNotulensi,
    linkNotulensi,
  } = req.body;

  const fileNotulensi = req.file ? req.file.buffer : null;

  const sql = `
      UPDATE data_rapat
      SET
        judul_rapat = ?, 
        nomor_surat = ?, 
        pelaksanaan_rapat = ?, 
        ruang_rapat = ?, 
        tanggal_rapat = ?, 
        waktu_rapat = ?, 
        agenda_rapat = ?, 
        teks_notulensi = ?, 
        link_notulensi = ?,
        file_notulensi = ?
      WHERE id_rapat = ?
    `;

  const values = [
    judulRapat,
    nomorSurat,
    pelaksanaanRapat,
    ruangRapat,
    tanggalRapat,
    waktuRapat,
    agendaRapat,
    teksNotulensi,
    linkNotulensi,
    fileNotulensi,
    id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Gagal memperbarui data:", err);
      return res.status(500).json({
        status: 500,
        message: "Gagal memperbarui data",
        error: err.message,
      });
    }

    res.status(200).json({
      status: 200,
      message: "Rapat berhasil diperbarui",
      data: {
        id,
        judulRapat,
        nomorSurat,
        pelaksanaanRapat,
        ruangRapat,
        tanggalRapat,
        waktuRapat,
        agendaRapat,
        teksNotulensi,
        linkNotulensi,
      },
    });
  });
});

router.delete("/rapat/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM data_rapat WHERE id_rapat = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Gagal menghapus data:", err);
      return res.status(500).json({
        status: 500,
        message: "Gagal menghapus data",
        error: err.message,
      });
    }

    res.status(200).json({
      status: 200,
      message: "Rapat berhasil dihapus",
      data: {},
    });
  });
});

router.get("/rapat/presensi/:id", (req, res) => {
    const { id } = req.params;
    
    const sql = "SELECT * FROM data_presensi WHERE id_rapat = ?";
    
    db.query(sql, [id], (err, results) => {
        if (err) {
        return res.status(500).json({ code: 500, error: err.message });
        }
        return res.status(200).json({ code: 200, data: results });
    });
});
export default router;
