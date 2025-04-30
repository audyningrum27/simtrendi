import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";

import db from "../config/db.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/pegawai", async (req, res) => {
  const {
    nama_pegawai,
    nip,
    tempat_lahir,
    tanggal_lahir,
    jenis_kelamin,
    alamat,
    no_telp,
    email,
    password,
    id_role,
    status_bpjs,
    status_kawin,
  } = req.body;
  const status_kepegawaian = "Aktif";
  const sql = `
        INSERT INTO data_pegawai (nama_pegawai, nip, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, no_telp, email, password, id_role, status_bpjs, status_kepegawaian, status_kawin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const values = [
    nama_pegawai,
    nip,
    tempat_lahir,
    tanggal_lahir,
    jenis_kelamin,
    alamat,
    no_telp,
    email,
    hashedPassword,
    id_role,
    status_bpjs,
    status_kepegawaian,
    status_kawin,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json({ message: "Pegawai added successfully", id: result.insertId });
    }
  });
});

router.get("/pegawai", (req, res) => {
  console.log("GET /api/data_pegawai/pegawai");
  const query = `
        SELECT 
            dp.id_pegawai, 
            dp.nip, 
            dp.nama_pegawai, 
            dp.jenis_kelamin, 
            dp.status_kepegawaian,
            r.nama_role,
            r.unit_kerja
        FROM 
            data_pegawai dp
        JOIN 
            role r ON dp.id_role = r.id_role
        ORDER BY 
            dp.nip ASC
    `;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.json(results);
  });
});

router.get("/pegawai/:id_pegawai", (req, res) => {
  const { id_pegawai } = req.params;
  const sql = `
        SELECT 
            dp.id_pegawai,
            dp.nip,
            dp.nama_pegawai,
            dp.tempat_lahir,
            dp.tanggal_lahir,
            dp.jenis_kelamin,
            dp.alamat,
            dp.no_telp,
            dp.email,
            dp.password,
            dp.id_role,
            dp.status_bpjs,
            dp.status_kepegawaian,
            r.nama_role,
            r.unit_kerja
        FROM 
            data_pegawai dp
        JOIN 
            role r ON dp.id_role = r.id_role
        WHERE dp.id_pegawai = ?
    `;
  db.query(sql, [id_pegawai], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      if (result.length > 0) {
        const pegawai = result[0];
        if (pegawai.foto_profil) {
          let imageType = "jpeg";
          const buffer = Buffer.from(pegawai.foto_profil, "base64");
          if (buffer.slice(0, 4).toString("hex") === "89504e47") {
            imageType = "png";
          }
          pegawai.foto_profil = {
            data: buffer.toString("base64"),
            type: imageType,
          };
        }
        res.json(pegawai);
      } else {
        res.status(404).json({ error: "Pegawai not found" });
      }
    }
  });
});

router.delete("/pegawai/:id_pegawai", (req, res) => {
  const { id_pegawai } = req.params;
  const sql = "DELETE FROM data_pegawai WHERE id_pegawai = ?";
  db.query(sql, [id_pegawai], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json({ message: "Pegawai deleted successfully" });
    }
  });
});

router.put("/pegawai/:id_pegawai", (req, res) => {
  const { id_pegawai } = req.params;
  const {
    nama_pegawai,
    nip,
    tempat_lahir,
    tanggal_lahir,
    jenis_kelamin,
    alamat,
    no_telp,
    email,
    password,
    id_role,
    status_bpjs,
    status_kepegawaian,
  } = req.body;

  const sqlSelect = `SELECT password FROM data_pegawai WHERE id_pegawai = ?`;
  db.query(sqlSelect, [id_pegawai], async (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    let hashedPassword = result[0].password;
    if (password && password !== "") {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const sqlUpdate = `
            UPDATE data_pegawai
            SET
                nama_pegawai = ?,
                nip = ?,
                tempat_lahir = ?,
                tanggal_lahir = ?,
                jenis_kelamin = ?,
                alamat = ?,
                no_telp = ?,
                email = ?,
                password = ?,
                id_role = ?,
                status_bpjs = ?,
                status_kepegawaian = ?
            WHERE id_pegawai = ?
        `;
    const values = [
      nama_pegawai,
      nip,
      tempat_lahir,
      tanggal_lahir,
      jenis_kelamin,
      alamat,
      no_telp,
      email,
      hashedPassword,
      id_role,
      status_bpjs,
      status_kepegawaian,
      id_pegawai,
    ];

    db.query(sqlUpdate, values, (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).json({ error: "Internal server error" });
      } else {
        return res.json({ message: "Pegawai updated successfully" });
      }
    });
  });
});

router.get("/pegawai/active/count", (req, res) => {
  const { date } = req.query;
  const query = `
      SELECT 
        (SELECT COUNT(*) FROM data_pegawai) - 
        (SELECT COUNT(DISTINCT dp.id_pegawai) 
         FROM data_pegawai dp
         JOIN data_cuti dc ON dp.id_pegawai = dc.id_pegawai
         WHERE dc.status_cuti = 'Diterima' 
         AND ? BETWEEN dc.tanggal_mulai AND dc.tanggal_selesai) AS active_count
      FROM data_pegawai
    `;
  db.query(query, [date], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    console.log("Hasil jumlah pegawai aktif:", results);
    return res.json(results[0]);
  });
});

router.get("/pegawai/total/count", (req, res) => {
  const query = "SELECT COUNT(*) AS total_count FROM data_pegawai";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    console.log("Hasil jumlah total pegawai:", results);
    return res.json(results[0]);
  });
});

router.get("/pegawai/cuti/count", (req, res) => {
  const { date } = req.query;
  const query = `
      SELECT COUNT(DISTINCT dp.id_pegawai) AS cuti_count 
      FROM data_pegawai dp
      JOIN data_cuti dc ON dp.id_pegawai = dc.id_pegawai
      WHERE dc.status_cuti = 'Diterima' 
      AND ? BETWEEN dc.tanggal_mulai AND dc.tanggal_selesai
    `;
  db.query(query, [date], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    console.log("Hasil jumlah pegawai cuti:", results);
    return res.json(results[0]);
  });
});

router.get("/pegawai/role/count", (req, res) => {
  const sql = `
        SELECT r.unit_kerja, COUNT(d.id_role) as count
        FROM data_pegawai d
        JOIN role r ON d.id_role = r.id_role
        GROUP BY r.unit_kerja
    `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    return res.json(results);
  });
});

router.get("/pegawai/profil/:id_pegawai", (req, res) => {
  const { id_pegawai } = req.params;
  const sql = `
        SELECT dp.*, r.unit_kerja
        FROM data_pegawai dp
        JOIN role r ON dp.id_role = r.id_role
        WHERE dp.id_pegawai = ?
    `;
  db.query(sql, [id_pegawai], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      if (result.length > 0) {
        const profil = result[0];
        if (profil.foto_profil) {
          let imageType = "jpeg";
          const buffer = Buffer.from(profil.foto_profil, "base64");
          if (buffer.slice(0, 4).toString("hex") === "89504e47") {
            imageType = "png";
          }
          profil.foto_profil = {
            data: buffer.toString("base64"),
            type: imageType,
          };
        }
        res.json(profil);
      } else {
        res.status(404).json({ error: "Profil Pegawai not found" });
      }
    }
  });
});

router.post(
  "/pegawai/upload-foto/:id_pegawai",
  upload.single("foto_profil"),
  (req, res) => {
    const { id_pegawai } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileBuffer = file.buffer;

    const query =
      "UPDATE data_pegawai SET foto_profil = ? WHERE id_pegawai = ?";
    db.query(query, [fileBuffer, id_pegawai], (err, result) => {
      if (err) {
        console.error("Error uploading file to the database:", err);
        return res.status(500).json({ message: "Error uploading file" });
      }
      res.status(200).json({ message: "Photo Profile uploaded successfully" });
    });
  }
);

router.post(
  "/pegawai/upload-kk/:id_pegawai",
  upload.single("kartu_keluarga"),
  (req, res) => {
    const { id_pegawai } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileBuffer = file.buffer;

    const query =
      "UPDATE data_pegawai SET kartu_keluarga = ? WHERE id_pegawai = ?";
    db.query(query, [fileBuffer, id_pegawai], (err, result) => {
      if (err) {
        console.error("Error uploading file to the database:", err);
        return res.status(500).json({ message: "Error uploading file" });
      }
      res.status(200).json({ message: "KK uploaded successfully" });
    });
  }
);

router.get("/pegawai/view-kk/:id_pegawai", (req, res) => {
  const { id_pegawai } = req.params;

  const sql = "SELECT kartu_keluarga FROM data_pegawai WHERE id_pegawai = ?";
  db.query(sql, [id_pegawai], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.length > 0) {
      const kartuKeluarga = result[0].kartu_keluarga;
      if (kartuKeluarga) {
        const buffer = Buffer.from(kartuKeluarga, "base64");

        let contentType = "image/jpeg";
        const fileSignature = buffer.slice(0, 4).toString("hex");

        if (fileSignature === "89504e47") {
          contentType = "image/png";
        } else if (fileSignature === "25504446") {
          contentType = "application/pdf";
        }

        res.setHeader("Content-Type", contentType);
        res.send(buffer);
      } else {
        res.status(404).json({ error: "Kartu Keluarga not found" });
      }
    } else {
      res.status(404).json({ error: "Pegawai not found" });
    }
  });
});

router.put("/pegawai/profil/:id_pegawai", async (req, res) => {
  const { id_pegawai } = req.params;
  const {
    nama_pegawai,
    nip,
    tempat_lahir,
    tanggal_lahir,
    jenis_kelamin,
    alamat,
    no_telp,
    email,
    password,
    status_bpjs,
    status_kepegawaian,
  } = req.body;

  const sqlSelect = `SELECT password FROM data_pegawai WHERE id_pegawai = ?`;
  db.query(sqlSelect, [id_pegawai], async (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    let hashedPassword = result[0].password;
    if (password && password !== "") {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const sqlUpdate = `
            UPDATE data_pegawai
            SET
                nama_pegawai = ?,
                nip = ?,
                tempat_lahir = ?,
                tanggal_lahir = ?,
                jenis_kelamin = ?,
                alamat = ?,
                no_telp = ?,
                email = ?,
                password = ?,
                status_bpjs = ?,
                status_kepegawaian = ?
            WHERE id_pegawai = ?
        `;
    const values = [
      nama_pegawai,
      nip,
      tempat_lahir,
      tanggal_lahir,
      jenis_kelamin,
      alamat,
      no_telp,
      email,
      hashedPassword,
      status_bpjs,
      status_kepegawaian,
      id_pegawai,
    ];

    db.query(sqlUpdate, values, (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).json({ error: "Internal server error" });
      } else {
        return res.json({ message: "Pegawai updated successfully" });
      }
    });
  });
});

export default router;
