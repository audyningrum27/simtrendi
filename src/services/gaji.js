import xlsx from 'xlsx';
import { format } from 'date-fns';
import express from 'express';
import multer from 'multer';

import db from '../config/db.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const excelDateToJSDate = (serial) => {
    const excelStartDate = new Date(Date.UTC(1899, 11, 30));
    const utcDays = serial;
    const utcDate = new Date(excelStartDate.getTime() + utcDays * 86400 * 1000);
    return utcDate;
};

router.get('/gaji', (req, res) => {
    console.log("GET /api/data_gaji/gaji");
    const query = `
    SELECT 
        p.nip,
        p.nama_pegawai,
        g.id_gaji,
        g.nip,
        g.bulan_gaji,
        g.gaji_dasar,
        g.tunjangan,
        g.potongan,
        g.total
    FROM 
        data_gaji g
    JOIN 
        data_pegawai p ON g.nip = p.nip
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        return res.json(results);
    });
});

router.post('/gaji', (req, res) => {
    const { nip, bulan_gaji, gaji_dasar, tunjangan, potongan } = req.body;

    if (Array.isArray(nip)) {
        const values = nip.map(id => [id, bulan_gaji, gaji_dasar, tunjangan, potongan]);
        const query = 'INSERT INTO data_gaji (nip, bulan_gaji, gaji_dasar, tunjangan, potongan) VALUES ?';

        db.query(query, [values], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal Server Error' });
            }

            return res.status(201).json({ message: 'Data Gaji Berhasil Ditambahkan!' });
        });
    } else {
        const query = 'INSERT INTO data_gaji (nip, bulan_gaji, gaji_dasar, tunjangan, potongan) VALUES (?, ?, ?, ?, ?)';

        db.query(query, [nip, bulan_gaji, gaji_dasar, tunjangan, potongan], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal Server Error' });
            }

            return res.status(201).json({ message: 'Data Gaji Berhasil Ditambahkan!' });
        });
    }
});

router.post('/import-gaji', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log('Raw data from Excel:', data);

    const queries = data.map(row => {
        const { nip, bulan_gaji, gaji_dasar, tunjangan, potongan } = row;

        let formattedBulanGaji;
        if (bulan_gaji instanceof Date) {
            formattedBulanGaji = format(bulan_gaji, 'yyyy-MM-dd');
        } else if (typeof bulan_gaji === 'number') {
            const jsDate = excelDateToJSDate(bulan_gaji);
            formattedBulanGaji = format(jsDate, 'yyyy-MM-dd');
        } else {
            const parsedDate = new Date(bulan_gaji);
            formattedBulanGaji = format(parsedDate, 'yyyy-MM-dd');
        }

        console.log('Formatted bulan_gaji:', formattedBulanGaji);

        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO data_gaji (nip, bulan_gaji, gaji_dasar, tunjangan, potongan) VALUES (?, ?, ?, ?, ?)';
            db.query(query, [nip, formattedBulanGaji, gaji_dasar, tunjangan, potongan], (err, result) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });

    Promise.all(queries)
        .then(() => res.status(201).json({ message: 'Data Gaji Berhasil Diimport!' }))
        .catch(err => res.status(500).json({ message: 'Internal Server Error' }));
});

router.get('/download-template', (req, res) => {
    db.query('SELECT nip, nama_pegawai FROM data_pegawai WHERE status_kepegawaian = "Aktif"', (err, rows) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        const workbook = xlsx.utils.book_new();
        
        const worksheetData = [
            ['nip', 'nama_pegawai', 'bulan_gaji', 'gaji_dasar', 'tunjangan', 'potongan'],
            ...rows.map(row => [row.nip, row.nama_pegawai, '', '', '', '']) 
        ];
        
        const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

        worksheet['!cols'] = [
            { wch: 20 }, 
            { wch: 20 }, 
            { wch: 20 }, 
            { wch: 15 }, 
            { wch: 15 }, 
            { wch: 15 }, 
        ];

        xlsx.utils.book_append_sheet(workbook, worksheet, 'Template Gaji');
        
        const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="template_data_gaji.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    });
});

router.get('/gaji/:nip', (req, res) => {
    const { nip } = req.params;
    console.log("GET /api/data_gaji/gaji/:nip");
    const query = `
    SELECT 
        p.nip,
        p.nama_pegawai,
        g.id_gaji,
        g.nip,
        g.bulan_gaji,
        g.gaji_dasar,
        g.tunjangan,
        g.potongan,
        g.total,
        g.status_gaji
    FROM 
        data_gaji g
    JOIN 
        data_pegawai p ON g.nip = p.nip
    WHERE 
        g.nip = ?
    `;
    db.query(query, [nip], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        return res.json(results);
    });
});

export default router;