import express from "express";

import db from "../config/db.js";

const router = express.Router();

router.get("/ruangan", async (req, res) => {
  const query = `
    SELECT * 
    FROM 
    ruangan
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err.message);
      return res
        .status(500)
        .json({ code: 500, message: "Internal server error" });
    }

    return res.status(200).json({ code: 200, data: results });
  });
});

router.post("/ruangan", async (req, res) => {
  const { nama_ruangan } = req.body;

  const insertQuery = `
    INSERT INTO ruangan (nama_ruangan)
    VALUES (?)
  `;

  db.query(insertQuery, [nama_ruangan], (err, results) => {
    if (err) {
      console.error("Error executing query:", err.message);
      return res
        .status(500)
        .json({ code: 500, message: "Internal server error" });
    }

    const insertedId = results.insertId;

    const selectQuery = `SELECT id, nama_ruangan FROM ruangan WHERE id = ?`;
    db.query(selectQuery, [insertedId], (err, rows) => {
      if (err) {
        console.error("Error executing select query:", err.message);
        return res
          .status(500)
          .json({ code: 500, message: "Internal server error" });
      }

      return res.status(201).json({
        code: 200,
        data: rows[0],
      });
    });
  });
});

router.put("/ruangan/:id", async (req, res) => {
  const { id } = req.params;
  const { nama_ruangan } = req.body;

  const updateQuery = `
            UPDATE ruangan
            SET nama_ruangan = ?
            WHERE id = ?
            `;

  db.query(updateQuery, [nama_ruangan, id], (err, results) => {
    if (err) {
      console.error("Error executing query:", err.message);
      return res
        .status(500)
        .json({ code: 500, message: "Internal server error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: "Ruangan not found",
      });
    }

    const selectQuery = `SELECT id, nama_ruangan FROM ruangan WHERE id = ?`;

    db.query(selectQuery, [id], (err, rows) => {
      if (err) {
        console.error("Error executing select query:", err.message);
        return res
          .status(500)
          .json({ code: 500, message: "Internal server error" });
      }

      return res.status(200).json({
        code: 200,
        data: rows[0],
      });
    });
  });
});

router.delete("/ruangan/:id", async (req, res) => {
  const { id } = req.params;

  const deleteQuery = `
            DELETE FROM ruangan
            WHERE id = ?
            `;

  db.query(deleteQuery, [id], (err, results) => {
    if (err) {
      console.error("Error executing query:", err.message);
      return res
        .status(500)
        .json({ code: 500, message: "Internal server error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: "Ruangan not found",
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Ruangan deleted successfully",
    });
  });
});
export default router;
