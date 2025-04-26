import express from "express";
import authRoutes from "../services/auth.js";
import pegawaiRoutes from "../services/pegawai.js";
import gajiRoutes from "../services/gaji.js";
import presensiRoutes from "../services/presensi.js";
import cutiRoutes from "../services/cuti.js";
import pelatihanRoutes from "../services/pelatihan.js";
import roleDataRoutes from "../services/role.js";
import notifikasiRoutes from "../services/notifikasi.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/data_pegawai", pegawaiRoutes);
router.use("/data_gaji", gajiRoutes);
router.use("/data_presensi", presensiRoutes);
router.use("/data_cuti", cutiRoutes);
router.use("/data_pelatihan", pelatihanRoutes);
router.use("/data_role", roleDataRoutes);
router.use("/data_notifikasi", notifikasiRoutes);

export default router;
