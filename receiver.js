const fs = require('fs');
const net = require('net');
const { createDecipheriv, privateDecrypt, generateKey, generateKeyPairSync } = require('crypto');


function receiveFile(host, port, destination) {
  const client = net.createConnection({ host, port }, () => {
    console.log(`📥 Connected to ${host}:${port}`);

  });

  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  const publicKeyBuffer = Buffer.from(publicKey);
  const keyLength = Buffer.alloc(4);
  keyLength.writeUInt32BE(publicKeyBuffer.length);

  client.write(keyLength);
  client.write(publicKeyBuffer);

  console.log('🔑 Sent public key to sender');

  let state = 'WAITING_ENCRYPTED_KEY';
  let buffer = Buffer.alloc(0);
  let key, iv, decipher, writeStream;
   let totalSize = 0n;
  let receivedBytes = 0;
  
  client.on('data', (chunk) => {

    if(state=='WAITING_ENCRYPTED_DATA'){
      return;
    }

    buffer = Buffer.concat([buffer, chunk]);
    let processed = true;
    while(processed){
      processed = false;
    switch (state) {
      case 'WAITING_ENCRYPTED_KEY':
        if (buffer.length >= 4) {
          const encKeyLength = buffer.readUInt32BE(0);
          const expectedLength = 4 + encKeyLength;

          if (buffer.length >= expectedLength) {
            const encryptedKey = buffer.subarray(4, expectedLength);
            buffer = buffer.subarray(expectedLength);


            key = privateDecrypt(privateKey, encryptedKey);
            console.log('🔓 Decrypted AES key');

            state = 'WAITING_ENCRYPTED_IV';
            processed = true;
          }
        }
        break;

      case 'WAITING_ENCRYPTED_IV':
        if (buffer.length >= 4) {
          const encIvLength = buffer.readUInt32BE(0);
          const expectedLength = 4 + encIvLength;

          if (buffer.length >= expectedLength) {
            const encryptedIv = buffer.subarray(4, expectedLength);
            buffer = buffer.subarray(expectedLength);

            iv = privateDecrypt(privateKey, encryptedIv);
            console.log('🔓 Decrypted AES IV');

             state = 'WAITING_FILE_SIZE';
              processed = true;
          }
        }
        break;

        case 'WAITING_FILE_SIZE':
          if(buffer.length >= 8) {

             totalSize = buffer.readBigUInt64BE(0);
            buffer = buffer.subarray(8);

            // Setup file decryption
            decipher = createDecipheriv('aes-256-cbc', key, iv);
            writeStream = fs.createWriteStream(destination);
            // Pipe the rest of the socket data directly to the decipher
              decipher.pipe(writeStream);

            // Process any remaining data as encrypted file
            if (buffer.length > 0) {
              receivedBytes += buffer.length;
              decipher.write(buffer);
            }
           // Handshake is done, remove this complex listener
              client.removeAllListeners('data');
              client.on('data', (fileChunk) => {
                receivedBytes += fileChunk.length;
              decipher.write(fileChunk);
              if(totalSize>0){
                const progress = (BigInt(receivedBytes) * 100n) / totalSize;
                const formattedReceived=formatBytes(receivedBytes);
                const formattedTotal=formatBytes(Number(totalSize));
                process.stdout.write(`\r📥 Receiving: ${progress}% (${formattedReceived} / ${formattedTotal})`);
              }
            });

              state = 'WAITING_ENCRYPTED_DATA';
            console.log('📥 Receiving encrypted file...');
          }
        }
        break;
    }
  }
  );

  client.on('end', () => {
    if (decipher) {
      decipher.end();  // Finalize decryption
    }
    console.log('✅ File received successfully.');
  });

  client.on('error', (err) => {
    console.error('❌ Error:', err.message);
  });
}

function formatBytes(bytes){
    if(bytes==0) return '0 Bytes';
    const K=1024;
    const sizes=['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i=Math.floor(Math.log(bytes)/Math.log(K));
    return parseFloat((bytes/Math.pow(K, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = { receiveFile };
