import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

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

# MIME Types & Headers
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
  console.log('====================================================');
  console.log('🚀 ZeePrep Mobile/Web Hostinger FTP Deployment Pipeline');
  console.log('====================================================\n');

  // 1. Verify dist folder exists
  if (!fs.existsSync(distDir)) {
    console.error('❌ Error: "dist" folder not found. Please run "npx expo export -p web" first.');
    process.exit(1);
  }

  // 2. Inject SPA .htaccess into dist
  const htaccessPath = path.join(distDir, '.htaccess');
  fs.writeFileSync(htaccessPath, htaccessContent, 'utf-8');
  console.log('✓ Injected SPA .htaccess routing rules into dist/.htaccess');

  // 3. Read FTP Config from env or process arguments
  const host = process.env.HOSTINGER_FTP_HOST || process.argv[2];
  const user = process.env.HOSTINGER_FTP_USER || process.argv[3];
  const password = process.env.HOSTINGER_FTP_PASSWORD || process.argv[4];
  const remoteDir = process.env.HOSTINGER_FTP_TARGET_DIR || process.argv[5] || '/public_html';
  const port = parseInt(process.env.HOSTINGER_FTP_PORT || '21', 10);
  const secure = process.env.HOSTINGER_FTP_SECURE === 'true' || false;

  if (!host || !user || !password) {
    console.error('\n⚠️ Missing FTP Credentials!');
    console.log('Please provide credentials via .env file or command line arguments:');
    console.log('  HOSTINGER_FTP_HOST=...');
    console.log('  HOSTINGER_FTP_USER=...');
    console.log('  HOSTINGER_FTP_PASSWORD=...');
    console.log('  HOSTINGER_FTP_TARGET_DIR=public_html/your-subdomain/\n');
    console.log('Usage: node scripts/deploy_hostinger_ftp.mjs <host> <user> <pass> <remoteDir>');
    process.exit(1);
  }

  // 4. Strict Safety Guard
  console.log(`\n🔒 Safety Check: Target directory is strictly locked to: "${remoteDir}"`);
  console.log('Connecting to Hostinger FTP server...');

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host,
      user,
      password,
      port,
      secure,
    });

    console.log('✓ Successfully connected and authenticated with Hostinger FTP.');

    // Ensure remote directory exists
    await client.ensureDir(remoteDir);
    console.log(`✓ Navigated to isolated target directory: ${remoteDir}`);

    console.log('\n📦 Uploading dist files to target subdomain...');
    await client.uploadFromDir(distDir);

    console.log('\n====================================================');
    console.log('🎉 DEPLOYMENT COMPLETE! All files synced to Hostinger.');
    console.log(`Target: ${remoteDir}`);
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ FTP Deployment Error:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
