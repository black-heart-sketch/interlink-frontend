import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguageCycle(interval = 3000) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  
  // Get languages from translation or fallback
  const languages = t('common.languages', { returnObjects: true }) || ["German", "French", "Italian", "English"];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % languages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [languages.length, interval]);

  return languages[index];
}
