var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://127.0.0.1')
const Readline = require('@serialport/parser-readline')
var SerialPort = require("serialport");
const parser = new Readline()
var arduinoCOMPort = "/dev/ttyACM0";
var arduinoport = new SerialPort(arduinoCOMPort, {baudRate: 9600}).setEncoding('utf8');
var MongoClient=require('mongodb').MongoClient;

arduinoport.on("open", (err) => {  
  console.log('serial port open'); //成功連接時印出port open
  if(err){
      console.log("no serial device found")//失敗時印出 device not found
  }
},20);
arduinoport.pipe(parser)
parser.on('data', line =>{
  let udate = new Date();
  let nowtime = udate.toLocaleString('zh-hant', { timeZone: 'Asia/Taipei' })
  console.log(line)
  Arduno_data = JSON.parse(line);
  Sensor_data = Object.values(Arduno_data)
  Sensor_key = Object.keys(Arduno_data)
  client.publish('arduino_data', line)
  MongoClient.connect("mongodb://127.0.0.1:27017/test",function(err,client){
    if(err){
        console.log(err);
        console.log('connecting fail');
        return;
    }
    console.log('connecting');
    var db_client = client.db('data_test')
    var db_table = db_client.collection('data')
    console.log('connection success')
    for(var i=0 ; i<Sensor_key.length;i++){
    db_client.collection('data',function(err,collection){
        collection.insertOne({ time:nowtime, name:Sensor_key[i], data:Sensor_data[i] });
     
    if(i == Sensor_key.length-1 ){
      collection.countDocuments(function(err,count){
        if(err) throw err;
        console.log('Total Rows:'+count);
    });
      collection.find({time:nowtime}).toArray(function(err,items){
      if(err) throw err;
      console.log(items);
      console.log("DATA FOUND");
    });
  }
  });
  }

  })
})
   
setInterval(function(){
  arduinoport.write('g')
},5000)