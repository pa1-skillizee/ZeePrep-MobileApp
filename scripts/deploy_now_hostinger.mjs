import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Caching & MIME types
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
  </FilesMatch>
  <FilesMatch "\\.(html|json)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
</IfModule>
`;

async function deploy() {
  console.log('=== Starting Hostinger FTP Deployment ===\n');

  if (!fs.existsSync(distDir)) {
    console.error('❌ Error: dist/ directory not found. Please build first.');
    process.exit(1);
  }

  // Inject .htaccess
  const htaccessPath = path.join(distDir, '.htaccess');
  fs.writeFileSync(htaccessPath, htaccessContent, 'utf-8');
  console.log('✓ Injected SPA .htaccess into dist/');

  const client = new ftp.Client();
  client.ftp.verbose = true;
  client.ftp.timeout = 60000;

  try {
    console.log('Connecting to Hostinger (187.124.193.92)...');
    await client.access({
      host: '187.124.193.92',
      user: 'u460407084.zeeprep',
      password: '3S@EaVDHk79jmDP',
      port: 21,
      secure: false,
    });

    console.log('✓ Connected & Logged in successfully.');
    console.log('Uploading all files from dist/ to remote root / ...');

    // Upload dist directory contents to /
    await client.uploadFromDir(distDir);

    console.log('✓ File sync completed.');

    // Remove default.php if present so index.html is loaded directly
    try {
      await client.remove('default.php');
      console.log('✓ Cleaned up initial Hostinger default.php');
    } catch (e) {
      // default.php may already be gone or renamed
    }

    console.log('\nVerifying uploaded files on server:');
    const list = await client.list();
    list.forEach(i => console.log(` - ${i.isDirectory ? '[DIR]' : '[FILE]'} ${i.name} (${i.size} bytes)`));

    console.log('\n====================================================');
    console.log('🎉 HOSTINGER DEPLOYMENT 100% COMPLETE & LIVE!');
    console.log('====================================================');
  } catch (err) {
    console.error('Deployment error:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
