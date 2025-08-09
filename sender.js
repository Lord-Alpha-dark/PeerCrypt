const fs = require('fs');
const net = require('net');
const {createCipheriv,randomBytes}=require('crypto');

function sendFile(filePath){
    
    let connectionCount=0;
    const server = net.createServer((socket => {
        connectionCount++;
        console.log(`receiver ${connectionCount} connected`);
        const key = randomBytes(32);
        const iv = randomBytes(16);

    const cipher = createCipheriv('aes-256-cbc', key, iv);

         socket.write(key);  // Send 32-byte key
        socket.write(iv);   // Send 16-byte IV

        const readStream= fs.createReadStream(filePath);
        readStream.pipe(cipher).pipe(socket);
        
        readStream.on('end',()=>{
            console.log('file sent successfully');
            socket.end();
            //server.close();
        })
    }));

    const PORT=5000;

    server.listen(PORT,()=>{
         console.log(`🚀 Sender ready. Waiting for connection on port ${PORT}`);
            //console.log(`Your IP: ${getLocalIP()}`);
    });

    process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');  // User feedback
    server.close();                                
    process.exit(0);                             
});
}

module.exports = { sendFile };
