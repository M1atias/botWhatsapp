const fs = require('fs');
const { Client, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const ora = require('ora');
const chalk  = require('chalk');
const qrcode = require('qrcode-terminal');
const excelJs = require('exceljs');
const moment = require('moment');
//const path = require('path');

const SESSION_FILE_PATH = './session.json';
const app = express();

let client;
let sessionData;

app.use(express.urlencoded({extended:true}))




const sendWithApi = (req,res) =>{
    const {message,to} = req.body;
    console.log(message,to);
    res.send({status:'Enviado'})
}

app.post('/send',sendWithApi)

const withSession = () =>{
    // Si existe una sesión se carga las credenciales
    const spinner = ora(`Cargando ${chalk.yellow('Validando sesión con Whatsapp...')}`);
    sessionData = require(SESSION_FILE_PATH);
    spinner.start();
    client = new Client({
        session: sessionData
    })
    client.on('ready', () =>{
        console.log('Cliente esta listo')
        listenMessage();
        spinner.stop();
    })
    client.on('auth_failure', () =>{
        spinner.stop();
        console.log('** Error de autentificación generar nuevo QRCODE (Borrar el archivo session.json xd, proximo a automatizar) **');
    })
    client.initialize();
}
/**
 * Genera el QR
 */
const withOutSession = () => {
    console.log('Sin sesión guardada');
    client = new Client();
    client.on('qr', qr => {
        qrcode.generate(qr, {small:true});
    });
    client.on('authenticated' , (session) => {
        //Guardo credenciales de la sesión
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session),  (err) => {
            if(err){
                console.log(err);
            }
        });
    });
    client.initialize();
}
/**
 * Funcion que escucha cada vez que entra un mensaje
 */
const listenMessage = () =>{
    client.on('message', (msg) =>{
        console.log(msg)
        const {from, to, body} = msg;

        /**
         * Preguntas
         */
        switch(body){
            case 'info':
                sendMessage(from, 'Info de que ?? Strange Fruits ó M°aneskin')
                break;
            case 'adios':
                sendMessage(from, 'Chau !!! xd')
                break;
            case 'hola':
                sendMessage(from,'Hola !!!!')
                sendMedia(from,'dbz.PNG')
                break;
        }
        saveHistorial(from,body);
        console.log(body);
    })
}

const sendMedia = (to,file) =>{
    const mediaFile = MessageMedia.fromFilePath(`./mediaSend/${file}`)
    client.sendMessage(to,mediaFile)
}


const sendMessage = (to,message) => {
    client.sendMessage(to, message)
}

const saveHistorial = (number, message) =>{
    const pathChat = `./chats/${number}.xlsx`;
    const worbook = new excelJs.Workbook();
    const today = moment().format('DD-MM-YYYY hh:mm');

    if (fs.existsSync(pathChat)) {
        //Lee el archivo q esta creado y agrega los mensajes
        worbook.xlsx.readFile(pathChat)
        .then(()=>{
            const worksheet = worbook.getWorksheet(1);
            const lastRow = worksheet.lastRow;
            let getRowInsert = worksheet.getRow(++(lastRow.number));
            getRowInsert.getCell('A').value = today;
            getRowInsert.getCell('B').value = message;
            getRowInsert.commit();
            worbook.xlsx.writeFile(pathChat)
            .then(()=>{
                console.log('Se agrego el chat')
            })
            .catch(()=>{
                console.log('fallo xd')
            })
        })
    }else{
        const worksheet = worbook.addWorksheet('Chats');
        worksheet.columns = [
            {header: 'Fecha', key:'date'},
            {header: 'Mensaje', key: 'message'},
        ]
        worksheet.addRow([today,message])
        worbook.xlsx.writeFile(pathChat)
        .then(()=>{
            console.log('Chat creado')
        })
        .catch(()=>{
            console.log('fallo xd')
        })
        //Se crea el archivo
    }
}

(fs.existsSync(SESSION_FILE_PATH)) ? withSession():withOutSession();

app.listen(9000,()=>{
    console.log('API ok')
})