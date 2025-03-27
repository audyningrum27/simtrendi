import express from 'express';
import authRoutes from '../service/auth.js';
import dataRoutes from '../service/data_pegawai.js';
import gajiRoutes from '../service/data_gaji.js';
import presensiRoutes from '../service/data_presensi.js';
import cutiRoutes from '../service/data_cuti.js';
import pelatihanRoutes from '../service/data_pelatihan.js';
import roleDataRoutes from '../service/data_role.js';
import notifikasiRoutes from '../service/data_notifikasi.js';

const router = express.Router();

// List Endpoint

router.use('/auth', authRoutes);
router.use('/data_pegawai', dataRoutes);
router.use('/data_gaji', gajiRoutes);
router.use('/data_presensi', presensiRoutes);
router.use('/data_cuti', cutiRoutes);
router.use('/data_pelatihan', pelatihanRoutes);
router.use('/data_role', roleDataRoutes);
router.use('/data_notifikasi', notifikasiRoutes);

export default router;
