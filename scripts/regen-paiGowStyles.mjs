import { readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync('app/pai-gow-table.css', 'utf8');
const out = `// Auto-generated from app/pai-gow-table.css for submission-safe global injection.\nexport const paiGowCss = ${JSON.stringify(css)};\n`;
writeFileSync('components/my-game/paiGowStyles.ts', out);
console.log('Wrote components/my-game/paiGowStyles.ts');
