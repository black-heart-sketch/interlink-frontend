const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'dashboard');
const localesDir = path.join(__dirname, 'public', 'locales');
const languages = ['en', 'fr', 'de', 'it'];

function extractKeys(dir, keysMap) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      extractKeys(fullPath, keysMap);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      // match t('key') or t("key") or t(`key`) or t('key', 'Default')
      const regex = /t\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*['"`]([^'"`]+)['"`])?\s*\)/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        const defaultVal = match[2] || key.split('.').pop().replace(/_/g, ' ');
        
        // ensure it's a dashboard key
        if (key.startsWith('dashboard.')) {
           keysMap[key] = defaultVal;
        }
      }
    }
  }
}

function setNestedValue(obj, pathArr, value) {
  let current = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    const p = pathArr[i];
    if (!current[p]) {
      current[p] = {};
    }
    current = current[p];
  }
  const lastKey = pathArr[pathArr.length - 1];
  // Don't overwrite existing values for non-fr languages if we want to keep translated ones?
  // Actually, we'll just set it if it's not set.
  if (!current[lastKey]) {
      current[lastKey] = value;
  }
}

const extractedKeys = {};
extractKeys(srcDir, extractedKeys);

// We need a quick map to roughly translate some French to EN/DE/IT just so there are placeholders.
// But mostly we just want to ensure the keys exist.
for (const lang of languages) {
  const localeFile = path.join(localesDir, lang, 'translation.json');
  let localeData = {};
  if (fs.existsSync(localeFile)) {
    localeData = JSON.parse(fs.readFileSync(localeFile, 'utf-8'));
  }

  for (const [key, defaultVal] of Object.entries(extractedKeys)) {
    // For french we set the defaultVal (which is french). For others, we might just set the key name or "TODO: " + defaultVal
    const pathArr = key.split('.');
    let valToSet = defaultVal;
    if (lang !== 'fr') {
        // basic placeholder
        valToSet = `[${lang.toUpperCase()}] ${defaultVal}`;
    }
    
    // Check if it already exists to not overwrite actual translations
    let current = localeData;
    let exists = true;
    for (const p of pathArr) {
      if (current[p] === undefined) {
        exists = false;
        break;
      }
      current = current[p];
    }

    if (!exists || current === `[${lang.toUpperCase()}] ${defaultVal}`) {
        setNestedValue(localeData, pathArr, valToSet);
    }
  }

  fs.writeFileSync(localeFile, JSON.stringify(localeData, null, 2));
  console.log(`Updated ${lang}/translation.json`);
}

console.log('Done!');
