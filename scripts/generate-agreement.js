const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const baseAgreementPath = path.join(__dirname, '..', 'BASEAGREEMENT');
const agreementPath = path.join(__dirname, '..', 'AGREEMENT');

try {
  console.log('Generating AGREEMENT...');
  const baseContent = fs.readFileSync(baseAgreementPath, 'utf8');
  fs.writeFileSync(agreementPath, baseContent);
  
  const yarnPath = path.join(__dirname, '..', '.yarn', 'releases', 'yarn-3.1.1.cjs');
  const cmd = `node "${yarnPath}" licenses generate-disclaimer`;
  
  console.log(`Running: ${cmd}`);
  const disclaimer = execSync(cmd, { cwd: path.join(__dirname, '..') }).toString();
  fs.appendFileSync(agreementPath, disclaimer);
  
  console.log('Successfully generated AGREEMENT');
} catch (e) {
  console.error('Failed to generate agreement:', e);
  process.exit(1);
}
