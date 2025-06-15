import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import db from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(
  __dirname,
  "../templates/form_izin_template.docx"
);

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/cuti/all", (req, res) => {
  console.log("GET /api/data_cuti/cuti/all");
  const query = `
    SELECT 
        p.nip,
        p.nama_pegawai,
        c.id_cuti,
        c.id_pegawai,
        c.tanggal_mulai,
        c.tanggal_selesai,
        c.status_cuti,
        c.alasan
    FROM 
        data_cuti c
    JOIN 
        data_pegawai p ON c.id_pegawai = p.id_pegawai;
    `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json({ code: 200, data: results });
  });
});

router.get("/cuti/:id_pegawai", (req, res) => {
  const { id_pegawai } = req.params;

  const query = `
    SELECT 
        c.id_cuti,
        c.id_pegawai,
        c.tanggal_mulai,
        c.tanggal_selesai,
        c.alasan,
        c.status_cuti,
        pka.status AS status_kaur,
        pkt.status AS status_kanit,
        pk.status AS status_kadiv
    FROM data_cuti c
    LEFT JOIN persetujuan_kaur pka ON c.id_cuti = pka.id_cuti
    LEFT JOIN persetujuan_kanit pkt ON c.id_cuti = pkt.id_cuti
    LEFT JOIN persetujuan_kadiv pk ON c.id_cuti = pk.id_cuti
    WHERE c.id_pegawai = ?
  `;

  db.query(query, [id_pegawai], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const convertedResults = results.map((row) => ({
      ...row,
      status_kadiv: !!row.status_kadiv,
      status_kaur: !!row.status_kaur,
      status_kanit: !!row.status_kanit,
    }));

    return res.status(200).json({ code: 200, data: convertedResults });
  });
});

router.post("/cuti", (req, res) => {
  const { idPegawai, tanggalMulai, tanggalSelesai, alasan } = req.body;

  if (!alasan) {
    return res.status(400).json({ message: "Alasan cuti wajib diisi" });
  }

  const insertCutiQuery = `
    INSERT INTO data_cuti (id_pegawai, tanggal_mulai, tanggal_selesai, alasan, status_cuti)
    VALUES (?, ?, ?, ?, 'Proses')
  `;

  db.query(
    insertCutiQuery,
    [idPegawai, tanggalMulai, tanggalSelesai, alasan],
    (err, result) => {
      if (err) {
        console.error("Insert cuti error:", err);
        return res.status(500).json({ message: "Gagal menyimpan data cuti" });
      }

      const idCutiBaru = result.insertId;

      const insertKadiv = `INSERT INTO persetujuan_kadiv (id_cuti, status) VALUES (?, 0)`;
      const insertKaur = `INSERT INTO persetujuan_kaur (id_cuti, status) VALUES (?, 0)`;
      const insertHrd = `INSERT INTO persetujuan_kanit (id_cuti, status) VALUES (?, 0)`;

      db.query(insertKadiv, [idCutiBaru], (err1) => {
        if (err1)
          return res
            .status(500)
            .json({ message: "Gagal insert ke persetujuan_kadiv" });

        db.query(insertKaur, [idCutiBaru], (err2) => {
          if (err2)
            return res
              .status(500)
              .json({ message: "Gagal insert ke persetujuan_kaur" });

          db.query(insertHrd, [idCutiBaru], (err3) => {
            if (err3)
              return res
                .status(500)
                .json({ message: "Gagal insert ke persetujuan_kanit" });

            const getCutiQuery = `
              SELECT 
                dc.id_cuti,
                dp.nama_pegawai,
                r.nama_role,
                dc.tanggal_mulai,
                dc.tanggal_selesai,
                dc.alasan,
                dc.status_cuti,
                CASE WHEN pk.status = 1 THEN true ELSE false END AS status_kadiv,
                CASE WHEN pka.status = 1 THEN true ELSE false END AS status_kaur,
                CASE WHEN pkt.status = 1 THEN true ELSE false END AS status_kanit
              FROM data_cuti dc
              JOIN data_pegawai dp ON dc.id_pegawai = dp.id_pegawai
              JOIN role r ON dp.id_role = r.id_role
              LEFT JOIN persetujuan_kadiv pk ON dc.id_cuti = pk.id_cuti
              LEFT JOIN persetujuan_kaur pka ON dc.id_cuti = pka.id_cuti
              LEFT JOIN persetujuan_kanit pkt ON dc.id_cuti = pkt.id_cuti
              WHERE dc.id_cuti = ?
            `;

            db.query(getCutiQuery, [idCutiBaru], (err4, results) => {
              if (err4) {
                console.error("Gagal ambil data cuti:", err4);
                return res
                  .status(500)
                  .json({ message: "Gagal mengambil data cuti" });
              }

              const formatDate = (date) => {
                const d = new Date(date);
                const day = String(d.getDate()).padStart(2, "0");
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const year = d.getFullYear();
                return `${day}/${month}/${year}`;
              };

              const result = results[0];

              result.status_kadiv = !!result.status_kadiv;
              result.status_kaur = !!result.status_kaur;
              result.status_kanit = !!result.status_kanit;

              const message = `${
                result.nama_pegawai
              } melakukan pengajuan cuti dari ${formatDate(
                result.tanggal_mulai
              )} hingga ${formatDate(result.tanggal_selesai)}.`;

              const notifQuery = `
                  INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
                  VALUES 
                    (?, ?, NOW(), 'pegawai', 'cuti'),
                    (?, ?, NOW(), 'admin', 'cuti')
                `;

              db.query(
                notifQuery,
                [idPegawai, message, idPegawai, message],
                (notifErr) => {
                  if (notifErr) {
                    console.error("Gagal menambahkan notifikasi:", notifErr);
                    return res
                      .status(500)
                      .json({ message: "Gagal menambahkan notifikasi" });
                  }

                  return res.status(200).json({
                    code: 200,
                    message: "Pengajuan Cuti Berhasil",
                    data: results,
                  });
                }
              );
            });
          });
        });
      });
    }
  );
});

router.get("/cuti/approved", (req, res) => {
  console.log("GET /api/data_cuti/cuti/approved");
  const query = `
    SELECT 
        p.nip,
        p.nama_pegawai,
        c.id_cuti,
        c.id_pegawai,
        c.tanggal_mulai,
        c.tanggal_selesai,
        c.alasan,
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
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json(results);
  });
});

router.get("/cuti/approved/:id_pegawai", (req, res) => {
  console.log("GET /api/data_cuti/cuti/approved/:id_pegawai");
  const { id_pegawai } = req.params;
  if (!id_pegawai) {
    return res.status(400).json({ message: "id_pegawai is required" });
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
      console.error("Error executing query:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    console.log("Jumlah entri cuti diterima per bulan untuk pegawai:", results);
    return res.json(results);
  });
});

router.delete("/cuti/expired", (req, res) => {
  const query = `
        DELETE FROM data_cuti
        WHERE status_cuti = 'Proses' AND tanggal_selesai < CURDATE()
    `;
  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json({ message: `${result.affectedRows} cuti telah dihapus` });
  });
});

router.put("/cuti/approval", (req, res) => {
  try {
    const { idCuti, idPegawai, idPegawaiCuti, status } = req.body;

    db.query(
      "SELECT * FROM data_cuti WHERE id_cuti = ?",
      [idCuti],
      (err, cutiResults) => {
        if (err) {
          console.error("Gagal ambil cutiResults:", err);
          return res.status(500).json({ code: 500, error: "Kesalahan server" });
        }

        if (!cutiResults.length) {
          return res
            .status(400)
            .json({ code: 400, error: "Cuti tidak ditemukan" });
        }

        if (cutiResults[0].status_cuti !== "Proses") {
          return res
            .status(400)
            .json({ code: 400, error: "Cuti sudah dikonfirmasi atau selesai" });
        }

        const checkPegawaiQuery = `
            SELECT 
              dp.id_pegawai,
              dp.nama_pegawai,
              r.nama_role,
              CASE
                WHEN r.nama_role IN (
                  'Guru MA / Kaur TTQ',
                  'Guru MTs / Kaur TTQ',
                  'Guru MTs / Kaur HUDA, IT dan Media'
                ) THEN 'KAUR'
                WHEN r.nama_role IN (
                  'Kepala Divisi Ekonomi',
                  'Kepala Divisi HRD & Personalia',
                  'Kepala Divisi Humas & Dakwah',
                  'Kepala Divisi Sarana & Bangunan',
                  'Kepala Divisi Perguruan Tinggi',
                  'Kepala Divisi Pesantren & Pendidikan Hk 1',
                  'Kepala Divisi Pesantren & Pendidikan Hk 2'
                ) THEN 'KADIV'
                WHEN r.nama_role IN (
                  'Guru MA / Kanit Pembinaan Pa',
                  'Guru MA / Kanit Pembinaan Pi',
                  'Guru MA / Kanit TTQ',
                  'Guru MA / Kepala Madrasah Tsanawiyah',
                  'Guru MTs / Sekretaris Divisi Pesantren',
                  'Kepala Madrasah Aliyah',
                  'Guru MTs / Kanit Pembinaan HK 2',
                  'Guru MTs / Sekretaris Pondok HK 2',
                  'Kamad MTs HK 2',
                  'Kepala Unit Dapur Umum',
                  'Kepala Unit Keuangan',
                  'Kepala Unit Klinik Pratama',
                  'Guru MA / Kanit Sekretariat Yayasan'
                ) THEN 'KANIT'
                ELSE 'LAINNYA'
              END AS status_role
            FROM data_pegawai dp
            JOIN role r ON dp.id_role = r.id_role
            WHERE dp.id_pegawai = ?
      `;

        db.query(checkPegawaiQuery, [idPegawai], (err, roleResults) => {
          if (err) {
            console.error("Gagal ambil roleResults:", err);
            return res
              .status(500)
              .json({ code: 500, error: "Kesalahan server saat ambil role" });
          }

          if (!roleResults.length) {
            return res
              .status(400)
              .json({ code: 400, error: "Pegawai tidak ditemukan" });
          }

          const role = roleResults[0].status_role;

          if (role === "LAINNYA") {
            return res.status(403).json({
              code: 403,
              error: "Anda tidak memiliki hak persetujuan",
            });
          }

          const tableMap = {
            KAUR: "persetujuan_kaur",
            KANIT: "persetujuan_kanit",
            KADIV: "persetujuan_kadiv",
          };

          const tableRole = tableMap[role];

          const checkPersetujuanQuery = `
                SELECT * FROM ${tableRole} WHERE id_cuti = ?
            `;

          db.query(
            checkPersetujuanQuery,
            [idCuti],
            (err, persetujuanResults) => {
              if (err) {
                console.error("Gagal ambil persetujuanResults:", err);
                return res
                  .status(500)
                  .json({ code: 500, error: "Kesalahan server" });
              }

              if (
                persetujuanResults[0].status === 1 &&
                persetujuanResults[0].id_pegawai !== null &&
                persetujuanResults[0].tanggal_konfirmasi !== null
              ) {
                return res.status(400).json({
                  code: 400,
                  error: "Telah disetujui",
                });
              }

              const updatePersetujuanQuery = `
                    UPDATE ${tableRole}
                    SET status = 1, id_pegawai = ?, tanggal_konfirmasi = NOW()
                    WHERE id_cuti = ?
                `;

              db.query(
                updatePersetujuanQuery,
                [idPegawai, idCuti],
                (updateErr, persetujuanUpdate) => {
                  if (updateErr) {
                    console.error("Gagal update persetujuan:", updateErr);
                    return res
                      .status(500)
                      .json({ code: 500, error: "Gagal update persetujuan" });
                  }

                  const checkStatusPersetujuanQuery = `
                              SELECT 'kaur' as role, status FROM persetujuan_kaur WHERE id_cuti = ?
                              UNION
                              SELECT 'kanit' as role, status FROM persetujuan_kanit WHERE id_cuti = ?
                              UNION
                              SELECT 'kadiv' as role, status FROM persetujuan_kadiv WHERE id_cuti = ?
                    `;

                  db.query(
                    checkStatusPersetujuanQuery,
                    [idCuti, idCuti, idCuti],
                    (checkErr, results) => {
                      if (checkErr) {
                        console.error(
                          "Gagal mengecek status persetujuan:",
                          checkErr
                        );
                        return res.status(500).json({
                          code: 500,
                          error: "Gagal mengecek status persetujuan",
                        });
                      }

                      const belumSetuju = results
                        .filter((row) => row.status !== 1)
                        .map((row) => row.role);

                      if (belumSetuju.length === 0) {
                        db.query(
                          `UPDATE data_cuti SET status_cuti = 'Diterima' WHERE id_cuti = ?`,
                          [idCuti],
                          (updateCutiErr, updateCutiRes) => {
                            if (updateCutiErr) {
                              console.error(
                                "Gagal update status data_cuti:",
                                updateCutiErr
                              );
                              return res.status(500).json({
                                code: 500,
                                error:
                                  "Persetujuan lengkap, tapi gagal memperbarui status cuti.",
                              });
                            }

                            const query = `
                                INSERT INTO notifikasi (id_pegawai, message, tanggal, type, category)
                                VALUES (?, ?, NOW(), 'pegawai', 'cuti')
                            `;

                            const message = `Cuti telah disetujui oleh semua pihak. Silakan cek status cuti Anda.`;

                            db.query(
                              query,
                              [idPegawaiCuti, message],
                              (notifErr, notifResult) => {
                                if (notifErr) {
                                  console.error(
                                    "Gagal menambahkan notifikasi:",
                                    notifErr
                                  );
                                  return res.status(500).json({
                                    code: 500,
                                    error: "Gagal menambahkan notifikasi",
                                  });
                                }

                                return res.status(200).json({
                                  code: 200,
                                  data: {
                                    id_cuti: idCuti,
                                    status_cuti: "Diterima",
                                  },
                                });
                              }
                            );
                          }
                        );
                      } else {
                        return res.status(200).json({
                          code: 200,
                          data: belumSetuju,
                        });
                      }
                    }
                  );
                }
              );
            }
          );
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ code: 500, error: "Internal Server Error" });
  }
});

router.get("/cuti/daily", (req, res) => {
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
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json(results[0]);
  });
});

router.post("/notifikasi-admin", (req, res) => {
  const { id_pegawai, message } = req.body;
  const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type)
        VALUES (?, ?, NOW(), 'admin')
    `;
  db.query(query, [id_pegawai, message], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(201).json({ message: "Notifikasi berhasil ditambahkan" });
  });
});

router.get("/notifikasi-admin", (req, res) => {
  const query = `
        SELECT * FROM notifikasi
        WHERE type = 'admin'
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

router.put("/notifikasi/:id_notifikasi", (req, res) => {
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

router.post("/notifikasi-pegawai", (req, res) => {
  const { id_pegawai, message } = req.body;
  const query = `
        INSERT INTO notifikasi (id_pegawai, message, tanggal, type)
        VALUES (?, ?, NOW(), 'pegawai')
    `;
  db.query(query, [id_pegawai, message], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(201).json({ message: "Notifikasi berhasil ditambahkan" });
  });
});

router.get("/notifikasi/:id_pegawai", (req, res) => {
  const { id_pegawai } = req.params;
  const query = `
      SELECT * FROM notifikasi
      WHERE id_pegawai = ? AND type = 'pegawai'
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

export default router;
