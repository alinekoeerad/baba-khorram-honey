const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ChatExport_2026-10-17', 'messages.html');
if (!fs.existsSync(filePath)) {
  console.log('File does not exist:', filePath);
  process.exit(0);
}

const html = fs.readFileSync(filePath, 'utf8');
const regex = /<div class="text[^"]*">([\s\S]*?)<\/div>/g;
let match;
const messages = [];
while ((match = regex.exec(html)) !== null) {
  const clean = match[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  if (clean) {
    messages.push(clean);
  }
}

console.log('Found', messages.length, 'messages');
messages.forEach((msg, idx) => {
  console.log(`\n--- Message ${idx + 1} (${msg.length} chars) ---`);
  console.log(msg.slice(0, 300));
});
