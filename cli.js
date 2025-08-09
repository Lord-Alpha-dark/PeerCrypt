#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const {sendFile}= require('./sender.js');
const {receiveFile} = require('./receiver.js');

const program = new Command();

program
    .name('p2pshare')
    .description('A CLI tool for peer-to-peer file sharing')
    .version('1.0.0')

program
    .command('send <file>')
    .description('Send a file to a peer')
    .action((file) => {
        // Resolve the file path and log it
        const filePath = path.resolve(file);
        console.log(`📤 Sending file: ${filePath}`);
        sendFile(filePath);
    })

program
    .command('receive <host> <port> <destination>')
    .description('Receive a file from a peer')
    .action((host, port, destination) => {
        console.log(`📥 Connecting to: ${host}:${port}`);
        receiveFile(host, port, destination);
    })

program.parse(process.argv);

//You install packages, which contain libraries, which are made of modules
 