const fs = require('fs');
const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')
const port = new SerialPort(process.argv[2], { baudRate: 9600 })

let sampling = 1000;
if (process.argv[4]) sampling = process.argv[4] * 1000;

console.log("Input interface: " + process.argv[2]);
console.log("Output file: " + process.argv[3]);
console.log("Sampling rate (ms): " + sampling);

fs.writeFileSync(process.argv[3], "data,eCO2,eCH20,TVOC,PM2.5,PM10,Temp,Humt\n");

let eco2Arr = [];
let ech20Arr = [];
let tvocArr = [];
let pm25Arr = [];
let pm10Arr = [];
let tempArr = [];
let humArr = [];

const parser = port.pipe(new ByteLength({length: 17}))
parser.on('data', data => {
  const hexs = data.toString('hex').match(/.{1,2}/g);

  const eco2 = parseInt(parseInt(hexs[2], 16) * 256 + parseInt(hexs[3], 16));
  const ech20 = parseInt(parseInt(hexs[4], 16) * 256 + parseInt(hexs[5], 16));
  const tvoc = parseInt(parseInt(hexs[6], 16) * 256 + parseInt(hexs[7], 16));
  const pm25 = parseInt(parseInt(hexs[8], 16) * 256 + parseInt(hexs[9], 16));
  const pm10 = parseInt(parseInt(hexs[10], 16) * 256 + parseInt(hexs[11], 16));
  const temp = parseFloat(parseInt(hexs[12], 16) + (parseInt(hexs[13], 16) * 0.1));
  const hum = parseFloat(parseInt(hexs[14], 16) + (parseInt(hexs[15], 16) * 0.1));

  /*process.stdout.cursorTo(0, 1);
  process.stdout.write("eCO2: " + eco2 + " ppm\n" +
                       "eCH20: " + ech20 + " µg/m³\n" +
                       "TVOC: " + tvoc + " µg/m³\n" +
                       "PM2.5: " + pm25 + " µg/m³\n" +
                       "PM10: " + pm10 + " µg/m³\n" +
                       "Temp: " + temp + " °C\n" +
                       "Humt: " + hum + " %RH");
  process.stdout.clearLine();*/

  eco2Arr.push(eco2);
  ech20Arr.push(ech20);
  tvocArr.push(tvoc);
  pm25Arr.push(pm25);
  pm10Arr.push(pm10);
  tempArr.push(temp);
  humArr.push(hum);
}) // will have 8 bytes per data event

setTimeout(publishData, sampling);

function publishData () {
    let date = new Date();
    date.toISOString();

    console.log(date)

    eco2 = arrayMean(eco2Arr, 0);
    ech20 = arrayMean(ech20Arr, 0);
    tvoc = arrayMean(tvocArr, 0);
    pm25 = arrayMean(pm25Arr, 0);
    pm10 = arrayMean(pm10Arr, 0);
    temp = arrayMean(tempArr, 1);
    hum = arrayMean(humArr, 1);

    fs.appendFileSync(process.argv[3], date+","+eco2+","+ech20+","+tvoc+","+pm25+","+pm10+","+temp+","+hum+"\n");

    eco2Arr = [];
    ech20Arr = [];
    tvocArr = [];
    pm25Arr = [];
    pm10Arr = [];
    tempArr = [];
    humArr = [];

    setTimeout(publishData, sampling);
}

function arrayMean(arr, precision) {
    const sum = arr.reduce((a, b) => a + b, 0);
    const avg = (sum / arr.length) || 0;

    return avg.toFixed(precision);
}
