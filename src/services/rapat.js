import express from "express";
import multer from "multer";

import crypto from "crypto";
import db from "../config/db.js";

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
  const id = req.params.id;

  const sqlRapat = `
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

  const sqlPeserta = `SELECT id_pegawai FROM presensi_rapat WHERE id_rapat = ?`;
  const sqlRole = `SELECT id_role FROM mapping_rapat_role WHERE id_rapat = ?`;

  db.query(sqlRapat, [id], (err, rapatResult) => {
    if (err) {
      return res.status(500).json({ code: 500, error: err.message });
    }
    if (rapatResult.length === 0) {
      return res
        .status(404)
        .json({ code: 404, message: "Rapat tidak ditemukan" });
    }

    const rapat = rapatResult[0];

    db.query(sqlPeserta, [id], (err, pesertaResult) => {
      if (err) {
        return res.status(500).json({ code: 500, error: err.message });
      }
      const peserta_rapat = pesertaResult.map((row) => row.id_pegawai);

      db.query(sqlRole, [id], (err, roleResult) => {
        if (err) {
          return res.status(500).json({ code: 500, error: err.message });
        }
        const role_rapat = roleResult.map((row) => row.id_role);

        return res.status(200).json({
          code: 200,
          data: {
            ...rapat,
            peserta_rapat,
            role_rapat,
          },
        });
      });
    });
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
      code: 400,
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
        code: 500,
        error: err.message,
      });
    }

    const idRapat = result.insertId;

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
            code: 500,
            error: err.message,
          });
        }
        insertMappingRoles();
      });
    };

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
            code: 500,
            error: err.message,
          });
        }
        insertDone();
      });
    };

    const insertDone = () => {
      const getPesertaQuery = `
        SELECT id_pegawai FROM presensi_rapat WHERE id_rapat = ?
      `;
      const getRoleQuery = `
        SELECT id_role FROM mapping_rapat_role WHERE id_rapat = ?
      `;

      db.query(getPesertaQuery, [idRapat], (err, pesertaResults) => {
        if (err) {
          console.error("Gagal mengambil data peserta:", err);
          return res.status(500).json({
            code: 500,
            error: err.message,
          });
        }

        db.query(getRoleQuery, [idRapat], (err, roleResults) => {
          if (err) {
            console.error("Gagal mengambil data role:", err);
            return res.status(500).json({
              code: 500,
              error: err.message,
            });
          }

          const values = pesertaRapat.map((idPegawai) => [
            idPegawai,
            `Anda diundang dalam rapat: "${judulRapat}" yang akan dilaksanakan pada ${tanggalRapat} pukul ${waktuRapat} pelaksana ${pelaksanaanRapat}.`,
          ]);

          const randomAdminId =
            pesertaRapat[Math.floor(Math.random() * pesertaRapat.length)];

          const adminValues = [
            [
              randomAdminId,
              `Rapat "${judulRapat}" yang akan dilaksanakan pada ${tanggalRapat} pukul ${waktuRapat} pelaksana ${pelaksanaanRapat}.`,
            ],
          ];

          const allValues = [...values, ...adminValues];

          const placeholders = [
            ...values.map(() => "(?, ?, NOW(), 'pegawai', 'rapat')"),
            ...adminValues.map(() => "(?, ?, NOW(), 'admin', 'rapat')"),
          ].join(", ");

          const sql = `
          INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
          VALUES ${placeholders}
        `;

          db.query(sql, allValues.flat(), (err, result) => {
            if (err) {
              console.error("Gagal menambahkan notifikasi:", err);
              return res.status(500).json({ code: 500, error: err.message });
            }

            const peserta_rapat = pesertaResults.map((row) => row.id_pegawai);
            const role_rapat = roleResults.map((row) => row.id_role);

            res.status(200).json({
              code: 200,
              message: "Data rapat berhasil disimpan",
              data: {
                id_rapat: idRapat,
                nomor_surat: nomorSurat,
                pelaksanaan_rapat: pelaksanaanRapat,
                id_ruangan: idRuangan,
                tanggal_rapat: tanggalRapat,
                waktu_rapat: waktuRapat,
                agenda_rapat: agendaRapat,
                peserta_rapat,
                role_rapat,
              },
            });
          });
        });
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
        code: 500,
        message: "Gagal memperbarui data rapat",
        error: err.message,
      });
    }

    const deletePresensi = `DELETE FROM presensi_rapat WHERE id_rapat = ?`;
    db.query(deletePresensi, [id], (err) => {
      if (err) {
        console.error("Gagal menghapus data presensi lama:", err);
        return res.status(500).json({
          code: 500,
          message: "Gagal menghapus presensi lama",
          error: err.message,
        });
      }

      const deleteMapping = `DELETE FROM mapping_rapat_role WHERE id_rapat = ?`;
      db.query(deleteMapping, [id], (err) => {
        if (err) {
          console.error("Gagal menghapus data mapping role lama:", err);
          return res.status(500).json({
            code: 500,
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
              code: 500,
              message: "Gagal menyimpan presensi baru",
              error: err.message,
            });
          }

          insertMapping((err) => {
            if (err) {
              console.error("Gagal menyimpan mapping role baru:", err);
              return res.status(500).json({
                code: 500,
                message: "Gagal menyimpan mapping role baru",
                error: err.message,
              });
            }

            const randomAdminId =
              pesertaRapat[Math.floor(Math.random() * pesertaRapat.length)];

            const messagePegawai = `Rapat "${judulRapat}" telah diperbarui. Jadwal baru: ${tanggalRapat} pukul ${waktuRapat}, pelaksana ${pelaksanaanRapat}.`;
            const messageAdmin = `Rapat "${judulRapat}" telah diperbarui dan dijadwalkan ulang menjadi tanggal ${tanggalRapat} pukul ${waktuRapat}, pelaksana ${pelaksanaanRapat}.`;

            const values = pesertaRapat.map((idPegawai) => [
              idPegawai,
              messagePegawai,
            ]);

            const adminValues = [[randomAdminId, messageAdmin]];

            const allValues = [...values, ...adminValues];

            const placeholders = [
              ...values.map(() => "(?, ?, NOW(), 'pegawai', 'rapat')"),
              ...adminValues.map(() => "(?, ?, NOW(), 'admin', 'rapat')"),
            ].join(", ");

            const sql = `
              INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
              VALUES ${placeholders}
            `;

            db.query(sql, allValues.flat(), (err, result) => {
              if (err) {
                console.error(
                  "Gagal menambahkan notifikasi update rapat:",
                  err
                );
                return res.status(500).json({ code: 500, error: err.message });
              }

              res.status(200).json({
                code: 200,
                message:
                  "Rapat berhasil diperbarui beserta data peserta dan role",
                data: {
                  id_rapat: id,
                  judul_rapat: judulRapat,
                  nomor_surat: nomorSurat,
                  pelaksanaan_rapat: pelaksanaanRapat,
                  id_ruangan: idRuangan,
                  tanggal_rapat: tanggalRapat,
                  waktu_rapat: waktuRapat,
                  agenda_rapat: agendaRapat,
                  teks_notulensi: teksNotulensi,
                  link_notulensi: linkNotulensi,
                  peserta_rapat: pesertaRapat,
                  role_peserta: rolePeserta,
                },
              });
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
        code: 500,
        message: "Gagal menghapus data presensi",
        error: err.message,
      });
    }

    db.query(deleteMapping, [id], (err) => {
      if (err) {
        console.error("Gagal menghapus mapping role:", err);
        return res.status(500).json({
          code: 500,
          message: "Gagal menghapus mapping role",
          error: err.message,
        });
      }

      db.query(deleteRapat, [id], (err) => {
        if (err) {
          console.error("Gagal menghapus rapat:", err);
          return res.status(500).json({
            code: 500,
            message: "Gagal menghapus rapat",
            error: err.message,
          });
        }

        res.status(200).json({
          code: 200,
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
        pr.id_presensi_rapat,
        dp.id_pegawai,
        dp.nama_pegawai,
        r.nama_role,
        r.nama_role,
        pr.jam_scan_qr,
        pr.status_presensi,
        pr.keterangan
      FROM presensi_rapat pr
      JOIN data_pegawai dp ON pr.id_pegawai = dp.id_pegawai
      JOIN role r ON dp.id_role = r.id_role
      WHERE pr.id_rapat = ?;
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
        code: 500,
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
          code: 500,
          message: "Gagal mengambil data",
          error: err.message,
        });
      }

      res.status(200).json({
        code: 200,
        data: rows,
      });
    });
  });
});

router.put("/rapat/presensi/qr/generate", (req, res) => {
  const { idRapat } = req.body;

  if (!idRapat) {
    return res.status(400).json({
      code: 400,
      message: "Field idRapat harus diisi",
    });
  }

  const sqlGetRapat = "SELECT tanggal_rapat, waktu_rapat FROM data_rapat WHERE id_rapat = ?";
  db.query(sqlGetRapat, [idRapat], (err, rapatResults) => {
    if (err) {
      return res.status(500).json({ code: 500, error: "Gagal mengambil data rapat." });
    }
    if (rapatResults.length === 0) {
      return res.status(404).json({ code: 404, message: "Rapat tidak ditemukan." });
    }

    const rapat = rapatResults[0];
    const meetingStartTime = new Date(`${rapat.tanggal_rapat.toISOString().split('T')[0]}T${rapat.waktu_rapat}`);
    const now = new Date();

    if (now < meetingStartTime) {
      return res.status(403).json({
        code: 403,
        message: "QR code belum bisa dibuat karena rapat belum dimulai.",
      });
    }

    const kodePresensi = crypto.randomBytes(16).toString("hex");
    const waktuGenerate = new Date();
    waktuGenerate.setMinutes(waktuGenerate.getMinutes() + 1);

    const sqlUpdateQR = `
      UPDATE data_rapat
      SET kode_presensi = ?, waktu_generate = ?
      WHERE id_rapat = ?
    `;

    db.query(sqlUpdateQR, [kodePresensi, waktuGenerate.toTimeString().split(" ")[0], idRapat], (err) => {
      if (err) {
        return res.status(500).json({ code: 500, message: "Gagal generate kode presensi", error: err.message });
      }
      res.status(200).json({
        code: 200,
        message: "Kode presensi berhasil dibuat",
        data: { idRapat, kodePresensi, waktuGenerate: waktuGenerate.toTimeString().split(" ")[0] },
      });
    });
  });
});

router.put("/rapat/presensi/qr/:kodePresensi", (req, res) => {
  const { kodePresensi } = req.params;
  const { idPegawai, jamScanPresensi } = req.body;

  if (!kodePresensi || !idPegawai || !jamScanPresensi) {
    return res.status(400).json({
      code: 400,
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
        code: 500,
        message: "Gagal mencari rapat",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        code: 404,
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
        code: 403,
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
            code: 500,
            message: "Gagal memperbarui presensi",
            error: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            code: 404,
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
              code: 500,
              message: "Gagal mengambil data presensi setelah update",
              error: err.message,
            });
          }

          return res.status(200).json({
            code: 200,
            message: "Presensi berhasil diperbarui",
            data: rows[0],
          });
        });
      }
    );
  });
});

router.get("/rapat/presensi/karyawan/dashboard", (req, res) => {
  const query = `
  SELECT
      dp.nama_pegawai,
      r.nama_role,
      CAST(COUNT(CASE WHEN pr.status_presensi = 'Hadir' THEN 1 END) AS CHAR) AS jumlah_hadir,
      CAST(COUNT(CASE WHEN pr.status_presensi = 'Tidak Hadir' AND CONCAT(dr.tanggal_rapat, ' ', dr.waktu_rapat) < NOW() THEN 1 END) AS CHAR) AS jumlah_tidak_hadir,
      CAST(COUNT(*) AS CHAR) AS total_diundang,
      CAST(ROUND(
          100.0 * COUNT(CASE WHEN pr.status_presensi = 'Hadir' THEN 1 END) / COUNT(*)
      ) AS CHAR) AS persentase_hadir,
      CAST(ROUND(
          100.0 * COUNT(CASE WHEN pr.status_presensi = 'Tidak Hadir' AND CONCAT(dr.tanggal_rapat, ' ', dr.waktu_rapat) < NOW() THEN 1 END) / COUNT(*)
      ) AS CHAR) AS persentase_tidak_hadir
  FROM presensi_rapat pr
  JOIN data_rapat AS dr ON pr.id_rapat = dr.id_rapat
  JOIN data_pegawai AS dp ON pr.id_pegawai = dp.id_pegawai
  JOIN role AS r ON dp.id_role = r.id_role
  GROUP BY dp.nama_pegawai, r.nama_role
  ORDER BY dp.nama_pegawai;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.status(200).json({ code: 200, data: results });
  });
});

router.get("/rapat/presensi/karyawan/:idKaryawan", (req, res) => {
  const { idKaryawan } = req.params;

  const query = `
    SELECT
      dr.id_rapat,
      dr.judul_rapat,
      dr.pelaksanaan_rapat,
      dr.tanggal_rapat,
      dr.waktu_rapat,
      pr.id_presensi_rapat,
      pr.id_pegawai,
      pr.status_presensi,
      CASE
        WHEN CONCAT(dr.tanggal_rapat, ' ', dr.waktu_rapat) < NOW() THEN 'Selesai'
        WHEN DATE(dr.tanggal_rapat) = CURDATE() THEN 'Hari Ini'
        WHEN CONCAT(dr.tanggal_rapat, ' ', dr.waktu_rapat) > NOW() THEN 'Mendatang'
        ELSE 'Tidak Diketahui'
      END AS status_waktu
    FROM data_rapat AS dr
    JOIN presensi_rapat AS pr ON dr.id_rapat = pr.id_rapat
    WHERE pr.id_pegawai = ?
    ORDER BY dr.tanggal_rapat DESC, dr.waktu_rapat DESC
  `;

  db.query(query, [idKaryawan], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.status(200).json({ code: 200, data: results });
  });
});
export default router;
