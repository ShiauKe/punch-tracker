const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const fs = require('fs');

app.use(express.static('../public'));

// app.get('/excels/:file', (req, res) => {
//     const fileName = req.params.file;
//     const filePath = path.join(__dirname, 'excels', fileName);
//     if (fs.existsSync(filePath)) {
//         const fileContent = fs.readFileSync(filePath, 'utf8');
//         res.setHeader('Content-Type', 'application/json');
//         res.send(fileContent);
//     } else {
//         res.status(404).send({ error: 'File not found' });
//     }
// });
app.get('/test/:file', (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(path.dirname(__dirname), 'test', fileName);
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(fileContent);
    } else {
        res.status(404).send({ error: 'File not found' });
    }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
