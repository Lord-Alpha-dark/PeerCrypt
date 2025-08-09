const {createDecipheriv}= require('crypto');
const {fs}= require('fs');

const algorithm='aes-256-cbc';

function decryptFile(encryptedPath,keyPath,outputPath){
    const {key,iv}=JSON.parse(fs.readFileSync(keyPath,'utf-8'));
    const decipher=createDecipheriv(algorithm,Buffer.from(key,'hex'),Buffer.from(iv,'hex'));

    const input = fs.createReadStream(encryptedPath);
  const output = fs.createWriteStream(outputPath);

  input.pipe(decipher).pipe(output);

  output.on('finish', () => {
    console.log('✅ File decrypted');
  });
}

module.exports={ decryptFile };