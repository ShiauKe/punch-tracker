const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const fs = require('fs');

app.use(express.static('../public'));

app.get('/excels/:file', (req, res) => {
    // const fixedFileName = 'result_formatted.json';
    // const fileName = fixedFileName; // 使用固定的檔案名稱for測試
    const fileName = req.params.file;
    const filePath = path.join(__dirname, 'excels', fileName);
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
