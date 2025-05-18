import express from "express";
import multer from "multer";

import crypto from "crypto";
import db from "../config/db.js";
import { id } from "date-fns/locale";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/rapat", (req, res) => {
  const sql = `
    SELECT 
      dr.id_rapat, 
      dr.judul_rapat, 
      dr.nomor_surat,
      dr.id_ruangan,
      r.nama_ruangan,
      dr.pelaksanaan_rapat, 
      dr.tanggal_rapat, 
      dr.waktu_rapat 
    FROM 
      data_rapat dr
    JOIN 
      ruangan r
    ON 
      dr.id_ruangan = r.id_ruangan
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    return res.status(200).json({ code: 200, data: results });
  });
});

router.get("/rapat/hari-ini", (req, res) => {
  const sql = `
      SELECT 
      dr.id_rapat, 
      dr.judul_rapat, 
      dr.nomor_surat,
      dr.id_ruangan,
      r.nama_ruangan,
      dr.pelaksanaan_rapat, 
      dr.tanggal_rapat, 
      dr.waktu_rapat 
    FROM 
      data_rapat dr
    JOIN 
      ruangan r
    ON 
      dr.id_ruangan = r.id_ruangan
    WHERE
      DATE(dr.tanggal_rapat) = CURDATE()
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    return res.status(200).json({ code: 200, data: results });
  });
});

router.get("/rapat/mendatang", (req, res) => {
  const sql = `
      SELECT 
      dr.id_rapat, 
      dr.judul_rapat, 
      dr.nomor_surat,
      dr.id_ruangan,
      r.nama_ruangan,
      dr.pelaksanaan_rapat, 
      dr.tanggal_rapat, 
      dr.waktu_rapat 
    FROM 
      data_rapat dr
    JOIN 
      ruangan r
    ON 
      dr.id_ruangan = r.id_ruangan
    WHERE
      DATE(dr.tanggal_rapat) > CURDATE()
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    return res.status(200).json({ code: 200, data: results });
  });
});

router.get("/rapat/:id", (req, res) => {
  const sql = `
    SELECT 
      dr.id_rapat, 
      dr.judul_rapat, 
      dr.nomor_surat,
      dr.id_ruangan,
      r.nama_ruangan,
      dr.pelaksanaan_rapat, 
      dr.tanggal_rapat, 
      dr.waktu_rapat,
      dr.agenda_rapat,
      dr.teks_notulensi,
      dr.link_notulensi,
      dr.kode_presensi,
      dr.waktu_generate
    FROM 
      data_rapat dr
    JOIN 
      ruangan r
    ON 
      dr.id_ruangan = r.id_ruangan
    WHERE 
      dr.id_rapat = ?
  `;
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
    idRuangan,
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
    !idRuangan ||
    !tanggalRapat ||
    !waktuRapat ||
    !agendaRapat
  ) {
    return res.status(400).json({
      status: 400,
      message: "Data tidak lengkap. Harap isi semua field yang diperlukan.",
    });
  }

  const sqlInsertRapat = `
    INSERT INTO data_rapat (
      judul_rapat, nomor_surat, pelaksanaan_rapat,
      id_ruangan, tanggal_rapat, waktu_rapat, agenda_rapat
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const valuesRapat = [
    judulRapat,
    nomorSurat,
    pelaksanaanRapat,
    idRuangan,
    tanggalRapat,
    waktuRapat,
    agendaRapat,
  ];

  db.query(sqlInsertRapat, valuesRapat, (err, result) => {
    if (err) {
      console.error("Gagal menyimpan data rapat:", err);
      return res.status(500).json({
        status: 500,
        error: err.message,
      });
    }

    const idRapat = result.insertId;

    const insertMappingRoles = () => {
      if (rolePeserta.length === 0) return insertDone();
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
            error: err.message,
          });
        }
        insertDone();
      });
    };

    const insertPresensi = () => {
      if (pesertaRapat.length === 0) return insertMappingRoles();
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
            error: err.message,
          });
        }
        insertMappingRoles();
      });
    };

    const insertDone = () => {
      res.status(200).json({
        status: 200,
        message: "Data rapat berhasil disimpan",
        data: {
          id: idRapat,
          nomorSurat,
          pelaksanaanRapat,
          idRuangan,
          tanggalRapat,
          waktuRapat,
          agendaRapat,
        },
      });
    };

    insertPresensi();
  });
});

router.put("/rapat/:id", (req, res) => {
  const { id } = req.params;
  const {
    judulRapat,
    nomorSurat,
    pelaksanaanRapat,
    idRuangan,
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
      id_ruangan = ?, 
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
    idRuangan,
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

        const insertPresensi = (callback) => {
          if (pesertaRapat.length === 0) return callback();
          const presensiValues = pesertaRapat.map((idPegawai) => [
            idPegawai,
            id,
            "Tidak Hadir",
          ]);
          const sqlInsertPresensi = `
            INSERT INTO presensi_rapat (id_pegawai, id_rapat, status_presensi)
            VALUES ?
          `;
          db.query(sqlInsertPresensi, [presensiValues], (err) => {
            if (err) return callback(err);
            callback();
          });
        };

        const insertMapping = (callback) => {
          if (rolePeserta.length === 0) return callback();
          const mappingValues = rolePeserta.map((idRole) => [id, idRole]);
          const sqlInsertMapping = `
            INSERT INTO mapping_rapat_role (id_rapat, id_role)
            VALUES ?
          `;
          db.query(sqlInsertMapping, [mappingValues], (err) => {
            if (err) return callback(err);
            callback();
          });
        };

        insertPresensi((err) => {
          if (err) {
            console.error("Gagal menyimpan presensi baru:", err);
            return res.status(500).json({
              status: 500,
              message: "Gagal menyimpan presensi baru",
              error: err.message,
            });
          }

          insertMapping((err) => {
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
                idRuangan,
                tanggalRapat,
                waktuRapat,
                agendaRapat,
                teksNotulensi,
                linkNotulensi,
                pesertaRapat,
                rolePeserta,
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

  const deletePresensi = "DELETE FROM presensi_rapat WHERE id_rapat = ?";
  const deleteMapping = "DELETE FROM mapping_rapat_role WHERE id_rapat = ?";
  const deleteRapat = "DELETE FROM data_rapat WHERE id_rapat = ?";

  db.query(deletePresensi, [id], (err) => {
    if (err) {
      console.error("Gagal menghapus presensi:", err);
      return res.status(500).json({
        status: 500,
        message: "Gagal menghapus data presensi",
        error: err.message,
      });
    }

    db.query(deleteMapping, [id], (err) => {
      if (err) {
        console.error("Gagal menghapus mapping role:", err);
        return res.status(500).json({
          status: 500,
          message: "Gagal menghapus mapping role",
          error: err.message,
        });
      }

      db.query(deleteRapat, [id], (err) => {
        if (err) {
          console.error("Gagal menghapus rapat:", err);
          return res.status(500).json({
            status: 500,
            message: "Gagal menghapus rapat",
            error: err.message,
          });
        }

        res.status(200).json({
          status: 200,
          message: "Rapat dan semua relasinya berhasil dihapus",
          data: [],
        });
      });
    });
  });
});

router.get("/rapat/presensi/:id_presensi_rapat", (req, res) => {
  const { id_presensi_rapat } = req.params;

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

  db.query(sql, [id_presensi_rapat], (err, results) => {
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

router.put("/rapat/presensi/qr/generate", (req, res) => {
  const { idRapat, waktuSekarang } = req.body;

  if (!idRapat || !waktuSekarang) {
    return res.status(400).json({
      status: 400,
      message: "Field id_rapat dan waktu_sekarang harus diisi",
    });
  }

  const kodePresensi = crypto.randomBytes(16).toString("hex");

  const [jam, menit, detik] = waktuSekarang.split(":").map(Number);
  const waktu = new Date();
  waktu.setHours(jam);
  waktu.setMinutes(menit + 5);
  waktu.setSeconds(detik);

  const waktuGenerate = waktu.toTimeString().split(" ")[0].substring(0, 8);

  const sql = `
    UPDATE data_rapat
    SET kode_presensi = ?, waktu_generate = ?
    WHERE id_rapat = ?
  `;

  db.query(sql, [kodePresensi, waktuGenerate, idRapat], (err, result) => {
    if (err) {
      console.error("Gagal generate kode presensi:", err);
      return res.status(500).json({
        status: 500,
        message: "Gagal generate kode presensi",
        error: err.message,
      });
    }

    res.status(200).json({
      status: 200,
      message: "Kode presensi berhasil dibuat",
      data: {
        idRapat: idRapat,
        kodePresensi,
        waktuGenerate,
      },
    });
  });
});

router.put("/rapat/presensi/qr/:kodePresensi", (req, res) => {
  const { kodePresensi } = req.params;
  const { idPegawai, jamScanPresensi } = req.body;

  if (!kodePresensi || !idPegawai || !jamScanPresensi) {
    return res.status(400).json({
      status: 400,
      message: "Kode presensi, ID pegawai, dan jam scan wajib diisi",
    });
  }

  const sqlCariRapat = `
    SELECT id_rapat, waktu_generate 
    FROM data_rapat 
    WHERE kode_presensi = ?
  `;

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

    const { id_rapat: idRapat, waktu_generate: waktuGenerate } = results[0];

    const waktuScan = new Date(jamScanPresensi);
    const scanJam = waktuScan.getHours().toString().padStart(2, "0");
    const scanMenit = waktuScan.getMinutes().toString().padStart(2, "0");
    const scanDetik = waktuScan.getSeconds().toString().padStart(2, "0");
    const waktuScanString = `${scanJam}:${scanMenit}:${scanDetik}`;

    if (waktuScanString > waktuGenerate) {
      return res.status(403).json({
        status: 403,
        message: "Waktu presensi telah berakhir",
      });
    }

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
            message: "ID Pegawai tidak ditemukan atau presensi tidak valid",
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
