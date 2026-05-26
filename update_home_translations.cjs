const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const langs = ['en', 'fr', 'de', 'it'];

const translations = {
  en: {
    revenue: "Revenue",
    total_leads: "Total CRM Leads",
    prospects_desc: "Prospects in admission pipeline",
    active_programs: "Active Programs",
    pending_testimonials: "Pending Testimonials",
    require_approval: "Require your approval",
    institute_trends: "Institute Trends",
    trends_desc: "Volume of new enrollments per day (this month)",
    monthly: "Monthly",
    daily: "Daily",
    staff_distribution: "Staff Distribution",
    system_performance: "System Performance",
    optimal: "Optimal",
    administrators: "Administrators",
    teachers: "Teachers",
    receptionists: "Receptionists",
    super_admins: "Super Admins"
  },
  fr: {
    revenue: "Chiffre d'Affaires",
    total_leads: "Total Leads CRM",
    prospects_desc: "Prospects dans le pipeline d'admission",
    active_programs: "Programmes Actifs",
    pending_testimonials: "Témoignages en attente",
    require_approval: "Nécessitent votre approbation",
    institute_trends: "Tendances de l'Institut",
    trends_desc: "Volume des nouvelles inscriptions par jour (ce mois-ci)",
    monthly: "Mensuel",
    daily: "Journalier",
    staff_distribution: "Répartition du Personnel",
    system_performance: "Performances du Système",
    optimal: "Optimal",
    administrators: "Administrateurs",
    teachers: "Enseignants",
    receptionists: "Réceptionnistes",
    super_admins: "Super Admins"
  },
  de: {
    revenue: "Umsatz",
    total_leads: "Gesamte CRM-Leads",
    prospects_desc: "Interessenten in der Zulassung",
    active_programs: "Aktive Programme",
    pending_testimonials: "Ausstehende Erfahrungsberichte",
    require_approval: "Erfordert Ihre Zustimmung",
    institute_trends: "Institutstrends",
    trends_desc: "Anzahl der Neuanmeldungen pro Tag (diesen Monat)",
    monthly: "Monatlich",
    daily: "Täglich",
    staff_distribution: "Personalverteilung",
    system_performance: "Systemleistung",
    optimal: "Optimal",
    administrators: "Administratoren",
    teachers: "Lehrer",
    receptionists: "Rezeptionisten",
    super_admins: "Super Admins"
  },
  it: {
    revenue: "Fatturato",
    total_leads: "Lead CRM Totali",
    prospects_desc: "Prospetti in ammissione",
    active_programs: "Programmi Attivi",
    pending_testimonials: "Testimonianze in Attesa",
    require_approval: "Richiede la tua approvazione",
    institute_trends: "Tendenze dell'Istituto",
    trends_desc: "Volume di nuove iscrizioni al giorno (questo mese)",
    monthly: "Mensile",
    daily: "Giornaliero",
    staff_distribution: "Distribuzione del Personale",
    system_performance: "Prestazioni del Sistema",
    optimal: "Ottimale",
    administrators: "Amministratorori",
    teachers: "Insegnanti",
    receptionists: "Addetti alla Reception",
    super_admins: "Super Admin"
  }
};

langs.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.dashboard = data.dashboard || {};
    data.dashboard.home = translations[lang];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
});
