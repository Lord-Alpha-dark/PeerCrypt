const fs = require('fs');
const net = require('net');
const { createCipheriv, randomBytes, publicEncrypt } = require('crypto');

function sendFile(filePath) {

    let connectionCount = 0;
    const connections = new Set();
    const server = net.createServer((socket) => {
        connectionCount++;
        console.log(`receiver ${connectionCount} connected`);

        connections.add(socket);


        socket.on('close', () => {
            console.log(`receiver ${connectionCount} disconnected`);
            connections.delete(socket);
        });

        let buffer = Buffer.alloc(0);
        let publicKey;
        //First expect 4 bytes for key length
        let expectedLength = 4;

        socket.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);

            if (!publicKey) {
                //waiting for receiver's public key
                if (buffer.length >= 4) {
                    const keyLength = buffer.readUInt32BE(0);
                    expectedLength = 4 + keyLength;

                    if (buffer.length >= expectedLength) {
                        publicKey = buffer.subarray(4, expectedLength).toString();
                        buffer = buffer.subarray(expectedLength);

                        console.log('✅ Public key received');


                        const key = randomBytes(32);
                        const iv = randomBytes(16);
                        const cipher = createCipheriv('aes-256-cbc', key, iv);

                        //encrypting key and iv with publicKey
                        const encryptedKey = publicEncrypt(publicKey, key);
                        const encryptedIv = publicEncrypt(publicKey, iv);

                        //sending encrypted key and iv lengths + data
                        const keyLenBuf = Buffer.alloc(4);
                        keyLenBuf.writeUInt32BE(encryptedKey.length, 0);
                        const ivLenBuf = Buffer.alloc(4);
                        ivLenBuf.writeUInt32BE(encryptedIv.length, 0);

                        socket.write(keyLenBuf);
                        socket.write(encryptedKey);
                        socket.write(ivLenBuf);
                        socket.write(encryptedIv);

                        console.log('🔐 Encrypted AES key and IV sent');

                        //Get file size and sending it
                        const stats = fs.statSync(filePath);
                        const totalSize = BigInt(stats.size);
                        const sizeBuf = Buffer.alloc(8);
                        sizeBuf.writeBigUInt64BE(totalSize, 0);
                        socket.write(sizeBuf);

                        //Sending encrypted file
                        const readStream = fs.createReadStream(filePath);
                        let sentBytes = 0;
                        let isPaused = false;

                        // Attaching a data listener to the read stream to track progress
                        readStream.on('data', (data) => {
                            sentBytes += data.length;
                            const progress = (BigInt(sentBytes) * 100n) / totalSize;
                            const formattedSent=formatBytes(sentBytes);
                            const formattedTotal=formatBytes(Number(totalSize));
                           process.stdout.write(`\r📤 Sending: ${progress}% (${formattedSent} / ${formattedTotal})`);

                        });

                        readStream.pipe(cipher).pipe(socket);

                        
                        console.log('\n\n╔════════════════════════════════════════╗');
                        console.log('║   Press "p" to pause, "r" to resume  ║');
                        console.log('║         or Ctrl+C to exit          ║');
                        console.log('╚════════════════════════════════════════╝\n');

                        const keyListener=(key)=>{
                            if(key.toLowerCase()=='p' && !isPaused){
                                console.log('\n⏸️  Pausing transfer...');
                                readStream.pause();
                                isPaused = true;
                            }
                            else if(key.toLowerCase()=='r' && isPaused){
                                console.log('\n▶️  Resuming transfer...');
                                readStream.resume();
                                isPaused = false;
                            }
                        }

                        process.stdin.setRawMode(true);
                        process.stdin.resume();
                        process.stdin.setEncoding('utf-8');
                        process.stdin.on('data', keyListener);

                        const cleanupStdin = () => {
                            process.stdin.removeListener('data', keyListener);
                            process.stdin.setRawMode(false);
                            process.stdin.pause();
                        }

                        readStream.on('end', () => {
                            console.log('file sent successfully');
                            socket.end();
                            cleanupStdin();
                            //server.close();
                        });

                         socket.on('close', () => {
                            cleanupStdin();
                        });
                    }
                }
            }

        });

        socket.on('error', (err) => {
            console.error(`❌ Error with receiver ${connectionCount}:`, err.message);
        });

    });

    const PORT = 5000;

    server.listen(PORT, () => {
        console.log(`🚀 Sender ready. Waiting for connection on port ${PORT}`);
        //console.log(`Your IP: ${getLocalIP()}`);
    });

    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');  // User feedback

        for (const socket of connections) {
            socket.destroy();
        }

        server.close((err) => {
            if (err) {
                console.error('❌ Error closing server:', err);
                process.exit(1);
            } else {
                console.log('✅ Server closed successfully.');
                process.exit(0);
            }
        });
    });
}


function formatBytes(bytes){
    if(bytes==0) return '0 Bytes';
    const K=1024;
    const sizes=['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i=Math.floor(Math.log(bytes)/Math.log(K));
    return parseFloat((bytes/Math.pow(K, i)).toFixed(2)) + ' ' + sizes[i];
}
module.exports = { sendFile };
