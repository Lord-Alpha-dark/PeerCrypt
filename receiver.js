const fs = require('fs');
const net = require('net');
const { createDecipheriv } = require('crypto');


function receiveFile(host, port, destination) {
   const client=net.createConnection({host,port},()=>
{
    console.log(`📥 Connected to ${host}:${port}`);
});

    let keyReceived=false;
    let key, iv;
    let buffer =Buffer.alloc(0);
    let decipher, writeStream;

  client.on('data', (chunk) => {
    if(!keyReceived)
    {
      buffer=Buffer.concat([buffer, chunk]);

      if(buffer.length>=48)
      {
        key=buffer.subarray(0,32);
        iv=buffer.subarray(32,48);
        keyReceived=true;

        console.log('✅ Key and IV received');

        decipher = createDecipheriv('aes-256-cbc', key, iv);
        writeStream = fs.createWriteStream(destination);
        decipher.pipe(writeStream);  // Decrypted data → file
        
        const remainingData=buffer.subarray(48);

        if(remainingData.length>0)
        {
          decipher.write(remainingData);
        }
      }
    }else{
      decipher.write(chunk);
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

module.exports = { receiveFile };