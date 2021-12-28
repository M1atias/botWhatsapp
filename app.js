const fs = require('fs');
const { Client } = require('whatsapp-web.js');
const ora = require('ora');
const chalk  = require('chalk');
const qrcode = require('qrcode-terminal');
const SESSION_FILE_PATH = './session.json';
let client;
let sessionData;
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
        console.log(from, to, body);
        sendMessage(from, 'test !!')
    })
}
const sendMessage = (to,message) => {
    client.sendMessage(to, message)
}
(fs.existsSync(SESSION_FILE_PATH)) ? withSession():withOutSession();