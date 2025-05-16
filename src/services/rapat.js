import express from "express";
import multer from "multer";

import crypto from "crypto";
import db from "../config/db.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/rapat", (req, res) => {
  const sql =
    "SELECT   id_rapat, judul_rapat, nomor_surat, pelaksanaan_rapat, ruang_rapat, waktu_rapat FROM data_rapat";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    return res.status(200).json({ code: 200, data: results });
  });
});

router.get("/rapat/hari-ini", (req, res) => {
  const sql =
    "SELECT   id_rapat, judul_rapat, nomor_surat, pelaksanaan_rapat, ruang_rapat, waktu_rapat FROM data_rapat WHERE DATE(tanggal_rapat) = CURDATE()";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    return res.status(200).json({ code: 200, data: results });
  });
});

router.get("/rapat/mendatang", (req, res) => {
  const sql =
    "SELECT   id_rapat, judul_rapat, nomor_surat, pelaksanaan_rapat, ruang_rapat, waktu_rapat FROM data_rapat WHERE DATE(tanggal_rapat) > CURDATE()";

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
    pesertaRapat = [],
    rolePeserta = [],
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

  const sqlInsertRapat = `
    INSERT INTO data_rapat (
      judul_rapat, nomor_surat, pelaksanaan_rapat,
      ruang_rapat, tanggal_rapat, waktu_rapat, agenda_rapat, kode_presensi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const valuesRapat = [
    judulRapat,
    nomorSurat,
    pelaksanaanRapat,
    ruangRapat,
    tanggalRapat,
    waktuRapat,
    agendaRapat,
    kodePresensi,
  ];

  db.query(sqlInsertRapat, valuesRapat, (err, result) => {
    if (err) {
      console.error("Gagal menyimpan data rapat:", err);
      return res.status(500).json({
        status: 500,
        message: "Gagal menyimpan data rapat",
        error: err.message,
      });
    }

    const idRapat = result.insertId;

    const presensiValues = pesertaRapat.map((idPegawai) => [
      idPegawai,
      idRapat,
      "Tidak Hadir",
    ]);

    const sqlPresensi = `
      INSERT INTO presensi_rapat (id_pegawai, id_rapat, status_presensi)
      VALUES ?
    `;

    db.query(sqlPresensi, [presensiValues], (err) => {
      if (err) {
        console.error("Gagal menyimpan presensi:", err);
        return res.status(500).json({
          status: 500,
          message: "Gagal menyimpan data presensi",
          error: err.message,
        });
      }

      const mappingValues = rolePeserta.map((idRole) => [idRapat, idRole]);

      const sqlMapping = `
        INSERT INTO mapping_rapat_role (id_rapat, id_role)
        VALUES ?
      `;

      db.query(sqlMapping, [mappingValues], (err) => {
        if (err) {
          console.error("Gagal menyimpan mapping role:", err);
          return res.status(500).json({
            status: 500,
            message: "Gagal menyimpan data mapping role",
            error: err.message,
          });
        }

        res.status(200).json({
          status: 200,
          message: "Rapat dan data terkait berhasil ditambahkan",
          data: {
            id: idRapat,
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
  });
});

router.put("/rapat/:id", (req, res) => {
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
    pesertaRapat = [],
    rolePeserta = [],
  } = req.body;

  const sqlUpdateRapat = `
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
      link_notulensi = ?
    WHERE id_rapat = ?
  `;

  const valuesRapat = [
    judulRapat,
    nomorSurat,
    pelaksanaanRapat,
    ruangRapat,
    tanggalRapat,
    waktuRapat,
    agendaRapat,
    teksNotulensi,
    linkNotulensi,
    id,
  ];

  db.query(sqlUpdateRapat, valuesRapat, (err) => {
    if (err) {
      console.error("Gagal memperbarui data rapat:", err);
      return res.status(500).json({
        status: 500,
        message: "Gagal memperbarui data rapat",
        error: err.message,
      });
    }

    const deletePresensi = `DELETE FROM presensi_rapat WHERE id_rapat = ?`;
    db.query(deletePresensi, [id], (err) => {
      if (err) {
        console.error("Gagal menghapus data presensi lama:", err);
        return res.status(500).json({
          status: 500,
          message: "Gagal menghapus presensi lama",
          error: err.message,
        });
      }

      const deleteMapping = `DELETE FROM mapping_rapat_role WHERE id_rapat = ?`;
      db.query(deleteMapping, [id], (err) => {
        if (err) {
          console.error("Gagal menghapus data mapping role lama:", err);
          return res.status(500).json({
            status: 500,
            message: "Gagal menghapus mapping role lama",
            error: err.message,
          });
        }

        const presensiValues = pesertaRapat.map((idPegawai) => [
          idPegawai,
          id,
          "Tidak Hadir",
        ]);
        const sqlPresensi = `
          INSERT INTO presensi_rapat (id_pegawai, id_rapat, status_presensi)
          VALUES ?
        `;
        db.query(sqlPresensi, [presensiValues], (err) => {
          if (err) {
            console.error("Gagal menyimpan presensi baru:", err);
            return res.status(500).json({
              status: 500,
              message: "Gagal menyimpan presensi baru",
              error: err.message,
            });
          }

          const mappingValues = rolePeserta.map((idRole) => [id, idRole]);
          const sqlMapping = `
            INSERT INTO mapping_rapat_role (id_rapat, id_role)
            VALUES ?
          `;
          db.query(sqlMapping, [mappingValues], (err) => {
            if (err) {
              console.error("Gagal menyimpan mapping role baru:", err);
              return res.status(500).json({
                status: 500,
                message: "Gagal menyimpan mapping role baru",
                error: err.message,
              });
            }

            res.status(200).json({
              status: 200,
              message:
                "Rapat berhasil diperbarui beserta data peserta dan role",
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
      });
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

  const sql = `
  SELECT
    presensi_rapat.id_presensi_rapat,
    data_pegawai.nama_pegawai,
    role.nama_role,
    role.nama_role,
    presensi_rapat.jam_scan_qr,
    presensi_rapat.status_presensi,
    presensi_rapat.keterangan
  FROM presensi_rapat
  JOIN data_pegawai ON presensi_rapat.id_pegawai = data_pegawai.id_pegawai
  JOIN role ON data_pegawai.id_role = role.id_role
  WHERE presensi_rapat.id_rapat = ?;
`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    return res.status(200).json({ code: 200, data: results });
  });
});

router.put("/rapat/presensi/:id_presensi_rapat", (req, res) => {
  const { id_presensi_rapat } = req.params;
  const { keterangan } = req.body;

  const updateSql = `
    UPDATE presensi_rapat
    SET keterangan = ?
    WHERE id_presensi_rapat = ?
  `;

  db.query(updateSql, [keterangan, id_presensi_rapat], (err, result) => {
    if (err) {
      console.error("Gagal memperbarui data:", err);
      return res.status(500).json({
        status: 500,
        message: "Gagal memperbarui data",
        error: err.message,
      });
    }

    const selectSql = `
      SELECT
        presensi_rapat.id_presensi_rapat,
        data_pegawai.nama_pegawai,
        role.nama_role,
        presensi_rapat.jam_scan_qr,
        presensi_rapat.status_presensi,
        presensi_rapat.keterangan
      FROM presensi_rapat
      JOIN data_pegawai ON presensi_rapat.id_pegawai = data_pegawai.id_pegawai
      JOIN role ON data_pegawai.id_role = role.id_role
      WHERE presensi_rapat.id_presensi_rapat = ?;
    `;

    db.query(selectSql, [req.params.id_presensi_rapat], (err, rows) => {
      if (err) {
        console.error("Gagal mengambil data:", err);
        return res.status(500).json({
          status: 500,
          message: "Gagal mengambil data",
          error: err.message,
        });
      }

      res.status(200).json({
        status: 200,
        data: rows,
      });
    });
  });
});

router.put("/rapat/presensi/qr/:kodePresensi", (req, res) => {
  const { kodePresensi } = req.params;
  const { idPegawai, jamScanPresensi } = req.body;

  const sqlCariRapat = `SELECT id_rapat FROM data_rapat WHERE kode_presensi = ?`;

  if (!kodePresensi) {
    return res.status(400).json({
      status: 400,
      message: "Kode presensi tidak boleh kosong",
    });
  }

  db.query(sqlCariRapat, [kodePresensi], (err, results) => {
    if (err) {
      return res.status(500).json({
        status: 500,
        message: "Gagal mencari rapat",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Kode presensi tidak ditemukan",
      });
    }

    const idRapat = results[0].id_rapat;

    const sqlUpdatePresensi = `
      UPDATE presensi_rapat
      SET jam_scan_qr = ?, status_presensi = 'Hadir'
      WHERE id_rapat = ? AND id_pegawai = ?
    `;

    db.query(
      sqlUpdatePresensi,
      [jamScanPresensi, idRapat, idPegawai],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: 500,
            message: "Gagal memperbarui presensi",
            error: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: 404,
            message: "Presensi tidak ditemukan untuk pegawai ini",
          });
        }

        const sqlGetUpdated = `
        SELECT * FROM presensi_rapat
        WHERE id_rapat = ? AND id_pegawai = ?
      `;

        db.query(sqlGetUpdated, [idRapat, idPegawai], (err, rows) => {
          if (err) {
            return res.status(500).json({
              status: 500,
              message: "Gagal mengambil data presensi setelah update",
              error: err.message,
            });
          }

          return res.status(200).json({
            status: 200,
            message: "Presensi berhasil diperbarui",
            data: rows[0],
          });
        });
      }
    );
  });
});

export default router;
