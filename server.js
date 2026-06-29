const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
  if (req.url.startsWith('/log')) {
    console.log('BROWSER LOG:', decodeURIComponent(req.url));
    res.end('ok');
    return;
  }
  
  let cleanUrl = decodeURIComponent(req.url.split('?')[0]);
  let p = path.join(__dirname, cleanUrl === '/' ? 'index.html' : cleanUrl);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    let content = fs.readFileSync(p);
    if (req.url === '/' || req.url === '/index.html') {
      content = content.toString().replace('<head>', '<head><script>' +
        'window.onerror=function(m,s,l,c,e){ fetch("/log?msg=ERROR:"+encodeURIComponent(m+" at "+l+":"+c+"\\n"+(e&&e.stack))); };' +
        'const origLog = console.log; console.log = function(...args) { fetch("/log?msg=LOG:"+encodeURIComponent(args.join(" "))); origLog(...args); };' +
        'const origWarn = console.warn; console.warn = function(...args) { fetch("/log?msg=WARN:"+encodeURIComponent(args.join(" "))); origWarn(...args); };' +
        'const origErr = console.error; console.error = function(...args) { fetch("/log?msg=ERROR:"+encodeURIComponent(args.join(" "))); origErr(...args); };' +
        '</script>');
    }
    if (p.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
    else if (p.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
    else res.setHeader('Content-Type', 'text/html');
    res.end(content);
  } else {
    res.statusCode = 404;
    res.end('not found');
  }
}).listen(8086, () => {
  console.log('Error catching server running on 8086');
});
