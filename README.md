# 🔗 p2pshare – Secure, Encrypted, Parallel P2P File Sharing CLI

## 📌 Overview
`p2pshare` is a **Node.js CLI tool** for secure, resumable, parallel **peer-to-peer** file sharing.  
Built with **TCP sockets** and **event-driven architecture**, it allows multiple peers to send chunks of a file simultaneously, encrypted end-to-end.

---

## ✨ Features

- 🔒 **AES Encryption** for file data + **RSA Encryption** for key exchange  
- ⚡ **Parallel Multi-Peer Downloads** with file chunking  
- 📊 **Real-time progress tracking** (bytes sent/received + %)  
- ⏯ **Pause & Resume** functionality for transfers  
- 🔁 **Event-driven** architecture leveraging Node.js non-blocking I/O   
- ✅ **Integrity verification** using SHA-256 hashes  

---

## 🛠 Tech Stack

- **Node.js** – Event-driven runtime  
- **net** – TCP networking  
- **crypto** – AES + RSA encryption  
- **fs** – File system operations  
- **commander** – CLI command parsing  

---

## 🚀 Installation

```bash
npm install -g p2pshare
```

---

## 📦 Usage

### Sender
To send a file, simply specify the file path. The tool will start a server and wait for receivers.
```bash
p2pshare send <file-path>
```
- **Encrypts** the file using AES-256.
- **Listens** on a port for incoming connections from receivers.
- **Sends** the file to all connected peers in parallel.

### Receiver
To receive a file, provide the sender's IP address, port, and the desired destination path.
```bash
p2pshare receive <sender-ip> <port> <destination-path>
```
- **Connects** to the sender.
- **Downloads** the encrypted file.
- **Decrypts** and saves the file to the specified path.

---

## 🌐 Example Flow

**Scenario:** User A has a large file (`movie.mp4`) and wants to share it with User B and User C.

```
[ You (A) ]
     |
     |  (Chunks via TCP)
     v
[ Friend B ] <----+
     |            |
(Chunks via TCP)  | (This is the P2P part:
     |            |  B becomes a sender for C)
     v            |
[ Friend C ] <----+
```
1.  **User A (Sender):**
    - Runs `p2pshare send movie.mp4`.
    - The tool encrypts the file and waits for connections on port 5000.

2.  **User B (Receiver 1):**
    - Runs `p2pshare receive <User-A-IP> 5000 "D:\movies\movie.mp4"`.
    - Starts downloading the file from User A.

3.  **User C (Receiver 2):**
    - Runs `p2pshare receive <User-A-IP> 5000 "C:\downloads\movie.mp4"`.
    - Also starts downloading the file from User A, at the same time as User B.
