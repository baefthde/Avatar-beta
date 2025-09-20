const express = require('express');
const bodyParser = require('body-parser');
const apiRoutes = require('./api');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use('/api', apiRoutes);
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
app.listen(port, () => {
  console.log(`Avatar-Chat UI läuft unter http://localhost:${port}`);
});
