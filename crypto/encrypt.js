const {createCipheriv,randomBytes}=require('crypto');
const{ fs}=require('fs');

const algorithm='aes-256-cbc';
const key=randomBytes(32);
const iv=randomBytes(16);

function encryptFile(inputPath, outputPath) {
   const cipher=createCipheriv(algorithm, key, iv);
   const input=fs.createReadStream(inputPath);
   const output=fs.createWriteStream(outputPath);

   input.pipe(cipher).pipe(output);

   output.on('finish', () => {
       console.log('✅ File encrypted');
       // Save key and IV somewhere
       fs.writeFileSync(`${outputPath}.key`, JSON.stringify({ key: key.toString('hex'), iv: iv.toString('hex') }));
   });
}

module.exports={ encryptFile };