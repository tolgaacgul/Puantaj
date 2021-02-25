const mysql      = require('mysql');
//mamp kurulumundaki parametreler girildi
const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'user',
  password : '***',
  database : 'db_personel'
});

connection.connect(function(err){
  if(err){
    console.log("x_CONNECTİON.JS: DB bağlatı hatası :", err);
    //throw err //app'de hata verdirir.
  }else{
    console.log("✓_CONNECTİON.JS: DB bağlantısı başaralı")
  }
});

//Burada yazılana js leri obje olarak dışarı cıkar = db
module.exports = {
    db : connection
}