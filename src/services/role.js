import express from "express";
import moment from "moment-timezone";

import db from "../config/db.js";

const router = express.Router();

router.get("/role/:id_role", (req, res) => {
  const { id_role } = req.params;

  const query = `
        SELECT id_deskripsi, pertanyaan_role
        FROM deskripsi_role
        WHERE id_role = ?
    `;

  db.query(query, [id_role], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    return res.json(results);
  });
});

router.post("/transaksi_role", async (req, res) => {
  const data = req.body;
  const timezone = "Asia/Jakarta";

  const updateData = (item) => {
    if (!item.id_deskripsi) {
      console.error("id_deskripsi is missing or null:", item);
      return Promise.reject(new Error("id_deskripsi cannot be null"));
    }

    const localDate = moment(item.tanggal)
      .tz(timezone)
      .format("YYYY-MM-DD HH:mm:ss");

    const sqlUpdate = `
            INSERT INTO transaksi_role (id_pegawai, id_deskripsi, id_presensi, tanggal, jawaban)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE jawaban = VALUES(jawaban), tanggal = VALUES(tanggal)
        `;
    const values = [
      item.id_pegawai,
      item.id_deskripsi,
      item.id_presensi,
      localDate,
      item.jawaban,
    ];
    return new Promise((resolve, reject) => {
      db.query(sqlUpdate, values, (err, result) => {
        if (err) {
          console.error("Error executing query:", err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  try {
    await Promise.all(data.map((item) => updateData(item)));
    res.json({ message: "Data successfully submitted" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/questions/:id_presensi", (req, res) => {
  const { id_presensi } = req.params;

  const query = `
        SELECT dr.id_deskripsi, dr.pertanyaan_role, tr.jawaban 
        FROM deskripsi_role dr
        JOIN transaksi_role tr ON dr.id_deskripsi = tr.id_deskripsi
        WHERE tr.id_presensi = ?
    `;

  db.query(query, [id_presensi], (error, results) => {
    if (error) {
      console.error("Error fetching questions:", error);
      return res.status(500).json({ message: "Error fetching questions" });
    }

    res.json(results);
  });
});

router.get("/hasil-kinerja/:id_pegawai", (req, res) => {
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
      console.error("Error fetching performance data:", error);
      return res
        .status(500)
        .json({ message: "Error fetching performance data" });
    }

    res.json(results);
  });
});

router.get("/manajemen/data/:id_role", async (req, res) => {
  const { id_role } = req.params;

  const query = `
        SELECT role.id_role, role.nama_role, manajemen.*
        FROM role
        LEFT JOIN manajemen ON manajemen.id_role = role.id_role
        WHERE role.id_role = ?
    `;

  db.query(query, [id_role], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const data = results.reduce((acc, row) => {
      const { id_role, nama_role, ...manajemenData } = row;

      if (!acc[id_role]) {
        acc[id_role] = {
          id_role,
          nama_role,
          manajemen: [],
        };
      }

      if (manajemenData.id_manajemen) {
        acc[id_role].manajemen.push(manajemenData);
      }

      return acc;
    }, {});

    return res.json(Object.values(data)[0]);
  });
});

router.get("/manajemen/pegawai/role", (req, res) => {
  const query = `
    SELECT * 
    FROM 
    role
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err.message);
      return res
        .status(500)
        .json({ code: 200, message: "Internal server error" });
    }

    return res.status(200).json({ code: 200, data: results });
  });
});

router.get("/manajemen/pegawai/role/:id_role", (req, res) => {
  const { id_role } = req.params;

  const query = `
  SELECT 
    r.id_role, r.nama_role, r.unit_kerja, r.status,
    m.id_manajemen, m.tanggung_jawab
  FROM role r
  LEFT JOIN manajemen m ON r.id_role = m.id_role
  WHERE r.id_role = ?
`;

  db.query(query, [id_role], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    const roleData = {
      id_role: results[0].id_role,
      nama_role: results[0].nama_role,
      unit_kerja: results[0].unit_kerja,
      status: results[0].status,
      tanggung_jawab: results
        .filter((row) => row.id_manajemen !== null)
        .map((row) => ({
          id_manajemen: row.id_manajemen,
          tanggung_jawab: row.tanggung_jawab,
        })),
    };

    return res.status(200).json(roleData);
  });
});

router.post("/manajemen/pegawai/role/create", (req, res) => {
  const { namaRole, unitKerja, status, tanggungJawab } = req.body;

  if (!namaRole || !unitKerja || !status) {
    return res
      .status(400)
      .json({ error: "nama role, unit kerja, dan status wajib diisi" });
  }

  const roleQuery = `
      INSERT INTO role (nama_role, unit_kerja, status)
      VALUES (?, ?, ?)
    `;

  db.query(roleQuery, [namaRole, unitKerja, status], (err, roleResult) => {
    if (err) {
      console.error("Error executing role insert query:", err);
      return res.status(500).json({
        error: "Internal server error (role)",
        details: err.sqlMessage,
      });
    }

    const insertRoleId = roleResult.insertId;

    if (!Array.isArray(tanggungJawab) || tanggungJawab.length === 0) {
      return res.status(200).json({
        id_role: insertRoleId,
        nama_role: namaRole,
        unit_kerja: unitKerja,
        status: status,
        tanggung_jawab: [],
      });
    }

    const manajemenData = tanggungJawab.map((item) => [insertRoleId, item]);

    const manajemenQuery = `
        INSERT INTO manajemen (id_role, tanggung_jawab)
        VALUES ?
      `;

    db.query(manajemenQuery, [manajemenData], (err) => {
      if (err) {
        console.error("Error executing manajemen insert query:", err);
        return res.status(500).json({
          error: "Internal server error (manajemen)",
          details: err.sqlMessage,
        });
      }

      const getManajemenQuery = `
          SELECT id_manajemen, tanggung_jawab
          FROM manajemen
          WHERE id_role = ?
        `;

      db.query(getManajemenQuery, [insertRoleId], (err, tanggungResult) => {
        if (err) {
          console.error("Error fetching tanggung jawab:", err);
          return res
            .status(500)
            .json({ error: "Failed to fetch tanggung jawab" });
        }

        return res.status(200).json({
          id_role: insertRoleId,
          nama_role: namaRole,
          unit_kerja: unitKerja,
          status: status,
          tanggung_jawab: tanggungResult,
        });
      });
    });
  });
});

router.put("/manajemen/pegawai/role/update/:id_role", (req, res) => {
  const { id_role } = req.params;
  const { namaRole, unitKerja, status, tanggungJawab } = req.body;

  if (!namaRole || !unitKerja || !status) {
    return res
      .status(400)
      .json({ error: "nama role, unit kerja, dan status wajib diisi" });
  }

  const updateRoleQuery = `
      UPDATE role
      SET nama_role = ?, unit_kerja = ?, status = ?
      WHERE id_role = ?
    `;

  db.query(
    updateRoleQuery,
    [namaRole, unitKerja, status, id_role],
    (err, result) => {
      if (err) {
        console.error("Error updating role:", err);
        return res.status(500).json({
          error: "Internal server error (role update)",
          details: err.sqlMessage,
        });
      }

      // Hapus tanggung jawab lama
      const deleteManajemenQuery = `
        DELETE FROM manajemen
        WHERE id_role = ?
      `;

      db.query(deleteManajemenQuery, [id_role], (err) => {
        if (err) {
          console.error("Error deleting old tanggung jawab:", err);
          return res.status(500).json({
            error: "Internal server error (delete manajemen)",
            details: err.sqlMessage,
          });
        }

        // Kalau tidak ada tanggung jawab baru
        if (!Array.isArray(tanggungJawab) || tanggungJawab.length === 0) {
          return res.status(200).json({
            id_role: parseInt(id_role),
            nama_role: namaRole,
            unit_kerja: unitKerja,
            status: status,
            tanggung_jawab: [],
          });
        }

        const manajemenData = tanggungJawab.map((item) => [id_role, item]);

        const insertManajemenQuery = `
          INSERT INTO manajemen (id_role, tanggung_jawab)
          VALUES ?
        `;

        db.query(insertManajemenQuery, [manajemenData], (err) => {
          if (err) {
            console.error("Error inserting new tanggung jawab:", err);
            return res.status(500).json({
              error: "Internal server error (insert manajemen)",
              details: err.sqlMessage,
            });
          }

          const getManajemenQuery = `
            SELECT id_manajemen, tanggung_jawab
            FROM manajemen
            WHERE id_role = ?
          `;

          db.query(getManajemenQuery, [id_role], (err, tanggungResult) => {
            if (err) {
              console.error("Error fetching tanggung jawab:", err);
              return res.status(500).json({
                error: "Failed to fetch tanggung jawab",
              });
            }

            return res.status(200).json({
              id_role: parseInt(id_role),
              nama_role: namaRole,
              unit_kerja: unitKerja,
              status: status,
              tanggung_jawab: tanggungResult,
            });
          });
        });
      });
    }
  );
});

router.delete("/manajemen/pegawai/role/delete/:id_role", (req, res) => {
  const { id_role } = req.params;

  const deleteManajemenQuery = `DELETE FROM manajemen WHERE id_role = ?`;

  db.query(deleteManajemenQuery, [id_role], (err) => {
    if (err) {
      console.error("Error deleting from manajemen:", err.message);
      return res
        .status(500)
        .json({ code: 500, message: "Internal server error (manajemen)" });
    }
    const deleteRoleQuery = `DELETE FROM role WHERE id_role = ?`;

    db.query(deleteRoleQuery, [id_role], (err, results) => {
      if (err) {
        console.error("Error deleting from role:", err.message);
        return res
          .status(500)
          .json({ code: 500, message: "Internal server error (role)" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ code: 400, message: "Role not found" });
      }

      return res.status(200).json({
        code: 200,
        message: "Role and associated tanggung jawab deleted successfully",
      });
    });
  });
});

export default router;
