const electron = require("electron");
const path = require("path");
const url = require("url");
const { app, BrowserWindow, Menu, ipcMain, webContents } = electron;
const db = require("./assets/lib/connection.js").db;  //MYSQL BAĞLANTISI
let wMainHtml, wYeniPersonel,wPersonelList; 

//------------------------------------------------------- app.on("ready") -------------------------------------------------------
//uygulama hazır('ready) olduğunda çalışır(Başlangıç)
app.on("ready", () => {

    //Ana Pencere Oluştur  
    wMainHtml = new BrowserWindow({    //ipcRenderer'(html)dan gelen eventleri okur izni 
        //frame: false,
        webPreferences: {
            nodeIntegration: true   //ipcRenderer'(html)dan gelen eventleri okur izni
        }
    })
    wMainHtml.loadURL(
        url.format({
            pathname: path.join(__dirname, "main.html"),
            protocol: "file",
            slashes: true
        })
    );
    //Genişletilebilme
    //mainWindow.setResizable(false)
    //Ana Pencere kapanırsa
    wMainHtml.on("close", ()=>{
        app.quit();
    })

    //Ana Menü
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    //------------------  EVENT 'lar  ------------------
    //olayı yakala veriyi oku
    ipcMain.on("mainhtml:inputValue", (err, data) => {
        console.log(data);
    });
    //yeni_personel  window aç
    ipcMain.on("mainhtml:yeniPersonelEkle", ()=>{
        fncWindowYeniPersonel();
    })
    //yeni_personel kapama Eventları
    ipcMain.on("yeni_personel:vazgec", ()=>{
        wYeniPersonel.close();
        wYeniPersonel = null;
    });
    //yeni_personel Kaydet Event
    ipcMain.on("yeni_personel:save", (err, tc, ad, soyad) => {
        if(tc && ad && soyad){
            let arryPersonel = [tc,ad,soyad]
            let objPersonel = {
                tc : tc,
                ad : ad,
                soyad : soyad
            }
           //MYSQL insert
            db.query("INSERT INTO `personel` (`tc`, `ad`, `soyad`) VALUES (?)", [arryPersonel] ,(e,r,f)=>{
                if(e){
                    console.log("MYSQL HATASI: " + e)
                }else{
                    console.log("MYSQL :INSERT işlemi başarılı ")
                    //wPersonelList.webContents.send("mainjs:AddedPersonelList", objPersonel) 
                    wMainHtml.webContents.send("main.js:EklemeBasarili");
                    wYeniPersonel.close();
                    wYeniPersonel = null;     
                }
            })
        }else{
            console.log("Boş alan var")
        }
    });
    
    //------------------  MYSQL 'lar  ------------------ 
    //mysql Silme İşlemi
    ipcMain.on("personel_list:mysqlRemoveWithTc", (err, atrbt_tc) =>{
        console.log("silmek istenen TC'li kişi: " + atrbt_tc);
        db.query("DELETE FROM personel WHERE tc = ?",atrbt_tc, (err, result, fields)=>{
            if(result.affectedRow > 0){
                console.log("silme işlemi başaro: affectedRow > 0:" + result.affectedRow)
            }
        })
    })

});
//------------------------------------------------------- Fonk ve Olay -------------------------------------------------------

//-------------MENULER - Main.html-------------
//Ana menülerimiz
const mainMenuTemplate = [
    {
        label: "Personel",
        submenu: [
            {
                label: "Personel Ekle",
                accelerator: process.platform == "darwin" ? "cmd+n" : "Ctrl+n",
                click(){
                    // ipcRenderer.send("key:yeniPersonelEkle");    //bu hata verdi
                    fncWindowYeniPersonel();
                }
            },
            {
                label: "Personel Düzenle"
            },
            {
                label: "Personel Listesi",
                accelerator: process.platform == "darwin" ? "cmd+l" : "Ctrl+l",
                click(){
                    //fncWindowPersonelList();
                    fncDataPullSql();   //fonk içinde personel_list penceresi açılır
                }
            },
            {
                label: "Tümünü Sil"
            }
        ]
    },
    {
        label: "Araç",
        submenu: [
            {
                label : "Yenile",
                role: "reload"
            },
            {
                label: "Çıkış",
                accelerator: process.platform == "darwin" ? "cmd+Q" : "Ctrl+Q", //hızlandırıcı
                role: "quit"
            }
        ]
    }
]
//işletim sistemine göre dizinin başına menu ekler
if(process.platform == "darwin"){
    mainMenuTemplate.unshift({
        label: app.getName(),
        role: "TODO"
    })
}
//Ürün konumundaysa DevToolda Gösterme
if(process.env.NODE_ENV !== "production"){
    mainMenuTemplate.push(
        {
            label: "Geliştirici Araçları",
            submenu: [
                {
                    label: "Geliştirici Ayarları",
                    click(item, focusedWindow){
                        focusedWindow.toggleDevTools();
                    },
                    accelerator: process.platform == "darwin" ? "cmd+d" : "Ctrl+d"
                }
            ]
        }
    )
}


//-------------PENCERELER - WINDOWS-------------
//Window - Yeni Personel Ekle 
function fncWindowYeniPersonel(){ 
    wYeniPersonel = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true   //ipcRenderer'(html)dan gelen eventleri okur izni
        },
        //frame: false,   //çerceve iptal
        width: 520,
        height: 800,
        title: "Yeni Personel Ekle"
    });
    //Genişletilebilirililik fasle
    wYeniPersonel.setResizable(true)
    wYeniPersonel.loadURL(
        url.format({
            pathname: path.join(__dirname,"assets/pages/yeni_personel.html"),
            protocol: "file",
            slashes: true
        })
    )
    wYeniPersonel.on("close", ()=>{
        wYeniPersonel = null;   //bellekte yer kaplamasın
    })
}
//window - Personel Listesi
function fncWindowPersonelList(){ 
    wPersonelList = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true   //ipcRenderer'(html)dan gelen eventleri okur izni
        },
        //frame: false,   //çerceve iptal
        width: 700,
        height: 400,
        title: "Yeni Personel Ekle"
    });
    //Genişletilebilirililik fasle
    wPersonelList.setResizable(true)
    wPersonelList.loadURL(
        url.format({
            pathname: path.join(__dirname,"assets/pages/personel_list.html"),
            protocol: "file",
            slashes: true
        })
    )
    wPersonelList.on("close", ()=>{
        wPersonelList = null;   //bellekte yer kaplamasın
    })
}


//-------------MYSQL - -------------
//veri çeken ekrana basan
function fncDataPullSql(){
    fncWindowPersonelList();  //sayfa açılmalı
    //webContent deki dom yüklendiyse çalışır
    wPersonelList.webContents.once("dom-ready", ()=>{
        db.query("SELECT * FROM personel", (error, table, fields)=>{
            //console.log(table);
            wPersonelList.webContents.send("mainjs:db_init",table)
        })
    })
}
