const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const dbConn = require('./lib/mysql/connection.js');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'public')));

app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');

app.listen(port, ()=>{
    console.log('App running on port '+port);
});

app.get('/',(req,res)=>{
    dataJudul = 'Main Menu';
    res.render('index', {dataJudul});
})

app.get('/dataPesanan',(req,res)=>{
    res.render('dataPesanan/framePesanan');
})

app.post('/hapusPesanan',(req,res)=>{
    const {id} = req.body;
    dbConn.query('DELETE FROM tb_pesanan WHERE ?', {id}, (err,result)=>{
        if (err) throw err;
        res.json('OK!');
    })
})

app.get('/listPesanan1',(req,res)=>{
    dbConn.query("SELECT T2.id, T2.pemesan, T2.nomorMeja, GROUP_CONCAT(T2.menu SEPARATOR '</li><li>') as menu, GROUP_CONCAT(T2.jmlPesanan SEPARATOR '</li><li>') as jumlah, T2.status, T2.nomortrx FROM (SELECT T1.id, T1.pemesan, T1.nomorMeja, T1.menu, T1.jmlPesanan, tb_status.status, T1.nomortrx FROM (SELECT T0.id, T0.pemesan, tb_meja.nama as nomorMeja, T0.menu, T0.jmlPesanan, T0.status, T0.nomortrx FROM (SELECT tb_pesanan.id, tb_pesanan.pemesan, tb_pesanan.noMeja, tb_menu.nama as menu, tb_pesanan.jmlPesanan, tb_pesanan.status, tb_pesanan.nomortrx FROM tb_pesanan INNER JOIN tb_menu on tb_pesanan.idMenu = tb_menu.id) AS T0 INNER JOIN tb_meja on T0.noMeja = tb_meja.id) AS T1 INNER JOIN tb_status on T1.status = tb_status.id) As T2 WHERE status = 'Diproses' GROUP BY T2.nomortrx",(err,result)=>{
        if (err) throw err;
        res.json(result);
    })
})

app.get('/pesanan',(req,res)=>{
    res.render('pesanan/pesanan');
})

app.get('/pesananData',(req,res)=>{
    dataMeja =[];
    dbConn.query('Select * FROM tb_meja',(err,result)=>{
        if (err) throw err;
        dataMeja = result;
    });
    dbConn.query('SELECT*FROM tb_menu',(err,result)=>{
        if (err) throw err;
        res.render('pesanan/pesananData',{dataMeja, dataMenu:result});
    })
})

app.post('/listPesanan',(req,res)=>{
    const {nomortrx} = req.body;
    dbConn.query("SELECT * From (SELECT tb_pesanan.id, tb_pesanan.pemesan, tb_menu.nama, tb_pesanan.jmlPesanan, tb_pesanan.nomortrx, tb_pesanan.totalHarga FROM tb_pesanan INNER JOIN tb_menu on tb_pesanan.idMenu = tb_Menu.id) as T where ?",{nomortrx},(err,result)=>{
        if (err) throw err;
      res.json(result);
    });   
})

app.post('/cekHarga',(req,res)=>{
    const {id} = req.body;
    dbConn.query('SELECT harga FROM tb_menu WHERE ?',{id},(err,result)=>{
        if(err) throw err;
        res.json(result);
    })
})

app.post('/lanjutkanPesanan',(req,res)=>{
    const {nomortrx, status, nama, total, noMeja} =req.body;
    dbConn.query("INSERT INTO tb_transaksi set ?", {nomortrx, status, nama, total, noMeja}, (err)=>{
        if(err) throw err;
    });
    dbConn.query("UPDATE tb_pesanan SET status="+status+" WHERE ?", {nomortrx}, (err,result)=>{
        if(err) throw err;
        res.json('OK!');
    })
})

app.post('/tambahPesanan',(req,res)=>{
    const {pemesan, noMeja, idMenu, jmlPesanan, nomortrx, totalHarga} = req.body;
    dbConn.query('INSERT INTO tb_pesanan set ?',{pemesan, noMeja, idMenu, jmlPesanan, nomortrx, totalHarga},(err,result)=>{
        if(err) throw err;
        res.json(result);
    })
})

app.get('/main',(req,res)=>{
    res.render('main');
})

app.post('/bayarPesanan',(req,res)=>{
    const {nomortrx, status} = req.body;
    dbConn.query("UPDATE tb_transaksi SET status="+status+" WHERE ?", {nomortrx}, (err,result)=>{
        if(err) throw err;
    })
    dbConn.query("UPDATE tb_pesanan SET status="+status+" WHERE ?", {nomortrx}, (err,result)=>{
        if(err) throw err;
        res.json('OK!')
    })
})

app.get('/pembayaran',(req,res)=>{
    res.render('pembayaran/framePembayaran');
})

app.get('/loadMeja',(req,res)=>{
    dbConn.query('SELECT tb_transaksi.nama as pelanggan, tb_transaksi.nomorTrx, tb_meja.nama as meja from tb_transaksi INNER JOIN tb_meja on tb_transaksi.noMeja = tb_meja.id WHERE status=2',(err,result)=>{
        if(err) throw err;
        res.render('pembayaran/pilihMeja', {dataMeja : result});
    });
})

app.get('/pembayaranData',(req,res)=>{
    dbConn.query('Select T1.pemesan, T1.meja, tb_status.status, T1.nomortrx from (Select * from (select tb_pesanan.pemesan, tb_meja.nama  as meja, tb_pesanan.status, tb_pesanan.nomortrx from tb_pesanan INNER JOIN tb_meja on tb_pesanan.noMeja =  tb_meja.id) as T WHERE T.status = 2) AS T1 INNER JOIN tb_status on T1.status = tb_status.id group by T1.nomortrx',(err,result)=>{
        if(err) throw err;
        res.json();
    })
})


app.post('/detailMeja', (req,res)=>{
    const {nomorTrx} = req.body;
    dbConn.query('SELECT*FROM tb_transaksi WHERE ?',{nomorTrx},(err,result)=>{
        if(err) throw err;
        res.json(result);
    })
})
app.post('/trxSelesai', (req,res)=>{
    const {nomorTrx,status} = req.body;
     dbConn.query("UPDATE tb_transaksi SET status="+status+" WHERE ?", {nomorTrx}, (err,result)=>{
        if(err) throw err;
        res.json('OK!')
    })
})

app.get('/tambahMenu', (req,res)=>{
    res.render('tambahMenu/frameTambahMenu');
})

app.get('/getAllMenu', (req,res)=>{
    dbConn.query("SELECT tb_menu.id, tb_menu.nama, tb_jenismenu.nama as jenis, tb_menu.harga, tb_menu.stok FROM tb_menu INNER JOIN tb_jenismenu on tb_menu.jenis = tb_jenismenu.id", (err,result)=>{
        if(err) throw err;
        res.json(result);
    })
})

app.post('/getStokMenu', (req,res)=>{
    let {id} = req.body;
    dbConn.query('SELECT tb_menu.stok FROM tb_menu WHERE ?',{id}, (err,result)=>{
        if(err) throw err;
        res.json(result);
    })
})
app.post('/getStokMenu', (req,res)=>{
    let {id} = req.body;
    dbConn.query('SELECT tb_menu.stok FROM tb_menu WHERE ?',{id}, (err,result)=>{
        if(err) throw err;
        res.json(result);
    })
})

app.post('/menuTambahStok', (req,res)=>{
    const {stok, id}= req.body;
    dbConn.query("UPDATE tb_menu SET stok="+stok+" WHERE id="+id, (err,result)=>{
        if(err) throw err;
        res.json('OK!')
    })
})

app.post('/detailMenu', (req,res)=>{
    const {id} = req.body;
    dbConn.query('SELECT * FROM tb_menu WHERE ?', {id}, (err,result)=>{
        if(err) throw err;
        res.json(result);
    })
})

app.get('/loadJenis', (req,res)=>{
    dbConn.query('SELECT * FROM tb_jenismenu', (err,result)=>{
        if(err) throw err;
        res.json(result);
    })
})

app.post('/hapusMenu', (req,res)=>{
    const {id} = req.body;
    dbConn.query('DELETE from tb_menu WHERE ?', {id}, (err,result)=>{
        if(err) throw err;
        res.json('OK!');
    })
})

app.post('/tambahMenu', (req,res)=>{
    const {nama, jenis, harga, stok} = req.body;
    dbConn.query('INSERT INTO tb_menu set ?', {nama, jenis, harga, stok}, (err,result)=>{
        if(err) throw err;
        res.json('OK!');
    })
})

app.post('/updateMenu', (req,res)=>{
    const {id, nama, jenis, harga, stok} = req.body;
    dbConn.query('UPDATE tb_menu SET nama="'+nama+'", jenis='+jenis+', harga='+harga+', stok='+stok+' WHERE id='+id, (err,result)=>{
        if(err) throw err;
        res.json('OK!');
    })
})

app.get('/tambahMeja', (req,res)=>{
    res.render('tambahMeja/frameTambahMeja');
})

app.get('/getAllMeja',(req,res)=>{
    dbConn.query('Select * FROM tb_meja', (err,result)=>{
        if (err) throw err;
        res.json(result);
    })
})

app.post('/tambahMeja',(req,res)=>{
    const {nama} = req.body;
    dbConn.query('INSERT INTO tb_meja set ?', {nama}, (err,result)=>{
        if(err) throw err;
        res.json('OK!');
    })
})