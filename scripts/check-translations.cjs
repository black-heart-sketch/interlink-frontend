const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'fr', 'de', 'it'];
const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');

const flatten = (value, prefix = '', output = {}) => {
  Object.entries(value).forEach(([key, child]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flatten(child, nextKey, output);
    } else {
      output[nextKey] = child;
    }
  });
  return output;
};

const readLocale = (language) => {
  const file = path.join(ROOT, 'public', 'locales', language, 'translation.json');
  return flatten(JSON.parse(fs.readFileSync(file, 'utf8')));
};

const walk = (directory, output = []) => {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, output);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      output.push(fullPath);
    }
  });
  return output;
};

const localeMaps = Object.fromEntries(LANGUAGES.map((language) => [language, readLocale(language)]));
const localeKeys = Object.fromEntries(LANGUAGES.map((language) => [language, new Set(Object.keys(localeMaps[language]))]));
const allLocaleKeys = [...new Set(LANGUAGES.flatMap((language) => Object.keys(localeMaps[language])))].sort();

const sourceFiles = walk(SRC_DIR);
const staticKeyPattern = /\bt\(\s*(['"`])([^'"`$]+)\1/g;
const usedKeys = [];

sourceFiles.forEach((file) => {
  const relativeFile = path.relative(ROOT, file);
  const source = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = staticKeyPattern.exec(source))) {
    usedKeys.push({ file: relativeFile, key: match[2] });
  }
});

const failures = [];

allLocaleKeys.forEach((key) => {
  LANGUAGES.forEach((language) => {
    if (!localeKeys[language].has(key)) {
      failures.push(`Missing locale key in ${language}: ${key}`);
    }
    if (localeKeys[language].has(key) && String(localeMaps[language][key] ?? '').trim() === '') {
      failures.push(`Empty locale value in ${language}: ${key}`);
    }
  });
});

usedKeys.forEach(({ file, key }) => {
  LANGUAGES.forEach((language) => {
    if (!localeKeys[language].has(key)) {
      failures.push(`Missing key used by ${file} in ${language}: ${key}`);
    }
  });
});

if (failures.length) {
  console.error(`Translation audit failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Translation audit passed: ${sourceFiles.length} source files, ${usedKeys.length} static t(...) calls, ${allLocaleKeys.length} locale keys, ${LANGUAGES.length} languages.`);
