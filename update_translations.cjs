const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const langs = ['en', 'fr', 'de', 'it'];

const commonDashboard = {
  sidebar: {
    dashboard: "Dashboard",
    crm_leads: "CRM & Leads",
    programs: "Programs",
    partners: "Partners",
    testimonials: "Testimonials",
    gallery: "Gallery",
    users: "Users",
    events: "Events",
    activities: "Activities",
    conferences: "Conferences",
    upcoming: "Upcoming Events",
    flyer: "Flyer Campaign",
    members: "Members"
  },
  topbar: {
    current_session: "Current Session",
    server_status: "Server Status",
    online: "Online & Secure",
    profile: "Profile Settings",
    signout: "Sign Out"
  },
  actions: {
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    confirm_delete: "Are you sure you want to delete",
    search: "Search...",
    create: "Create"
  },
  status: {
    live: "Live",
    review: "Review",
    archived: "Archived",
    draft: "Draft",
    scheduled: "Scheduled",
    past: "Past",
    active: "Active",
    inactive: "Inactive",
    new: "New",
    contacted: "Contacted",
    converted: "Converted"
  },
  screens: {
    programs: {
      title: "Programs",
      name: "Name",
      category: "Category",
      duration: "Duration",
      level: "Level",
      add_program: "Add Program",
      delete_program: "Delete Program"
    },
    leads: {
      title: "Leads",
      name: "Name",
      email: "Email",
      phone: "Phone",
      status: "Status",
      add_lead: "Add Lead"
    },
    users: {
      title: "System Users",
      name: "Name",
      email: "Email",
      role: "Role",
      add_user: "Create User",
      password: "Password",
      password_placeholder: "min 8 chars"
    },
    events: {
      title: "Events",
      event_title: "Event Title",
      type: "Type",
      date: "Date",
      location: "Location",
      add_event: "Add Event"
    },
    gallery: {
      title: "Digital Assets",
      album_file: "Album / File",
      type: "Type",
      url: "URL",
      add_media: "Add Media",
      title_fr: "Title (FR)",
      title_en: "Title (EN)",
      files: "File(s)"
    },
    partners: {
      title: "Partners",
      name: "Partner Name",
      category: "Category",
      website: "Website",
      add_partner: "Add Partner"
    },
    testimonials: {
      title: "Testimonials",
      author: "Author",
      role: "Role",
      rating: "Rating",
      add_testimonial: "Add Testimonial",
      content: "Content"
    },
    activities: {
      title: "Activities",
      activity_name: "Activity Name",
      category: "Category",
      date: "Date",
      add_activity: "Add Activity"
    },
    conferences: {
      title: "Conferences",
      topic: "Topic",
      speaker: "Speaker",
      date: "Date",
      add_conference: "Add Conference"
    },
    flyer: {
      title: "Flyer Campaigns",
      campaign: "Campaign Name",
      channel: "Channel",
      start_date: "Start Date",
      end_date: "End Date",
      add_flyer: "Add Flyer"
    },
    members: {
      title: "Members",
      name: "Name",
      role: "Role",
      department: "Department",
      add_member: "Add Member"
    },
    upcoming: {
      title: "Upcoming Events",
      event_name: "Event Name",
      countdown: "Countdown",
      add_upcoming: "Add Upcoming Event"
    }
  }
};

const translations = {
  en: commonDashboard,
  fr: {
    sidebar: {
      dashboard: "Tableau de Bord",
      crm_leads: "CRM & Leads",
      programs: "Programmes",
      partners: "Partenaires",
      testimonials: "Témoignages",
      gallery: "Galerie",
      users: "Utilisateurs",
      events: "Événements",
      activities: "Activités",
      conferences: "Conférences",
      upcoming: "Événements à venir",
      flyer: "Campagne de Flyers",
      members: "Membres"
    },
    topbar: {
      current_session: "Session Actuelle",
      server_status: "Statut du Serveur",
      online: "En ligne & Sécurisé",
      profile: "Profil",
      signout: "Déconnexion"
    },
    actions: {
      add: "Ajouter",
      edit: "Modifier",
      delete: "Supprimer",
      save: "Enregistrer",
      saving: "Sauvegarde...",
      cancel: "Annuler",
      confirm_delete: "Êtes-vous sûr de vouloir supprimer",
      search: "Rechercher...",
      create: "Créer"
    },
    status: {
      live: "En Ligne",
      review: "En Revue",
      archived: "Archivé",
      draft: "Brouillon",
      scheduled: "Programmé",
      past: "Passé",
      active: "Actif",
      inactive: "Inactif",
      new: "Nouveau",
      contacted: "Contacté",
      converted: "Converti"
    },
    screens: {
      programs: {
        title: "Programmes",
        name: "Nom",
        category: "Catégorie",
        duration: "Durée",
        level: "Niveau",
        add_program: "Ajouter un Programme",
        delete_program: "Supprimer le Programme"
      },
      leads: {
        title: "Leads",
        name: "Nom",
        email: "Email",
        phone: "Téléphone",
        status: "Statut",
        add_lead: "Ajouter un Lead"
      },
      users: {
        title: "Utilisateurs",
        name: "Nom",
        email: "Email",
        role: "Rôle",
        add_user: "Créer un Utilisateur",
        password: "Mot de passe",
        password_placeholder: "min 8 car."
      },
      events: {
        title: "Événements",
        event_title: "Titre de l'événement",
        type: "Type",
        date: "Date",
        location: "Lieu",
        add_event: "Ajouter un événement"
      },
      gallery: {
        title: "Assets Numériques",
        album_file: "Album / Fichier",
        type: "Type",
        url: "URL",
        add_media: "Ajouter un Média",
        title_fr: "Titre (FR)",
        title_en: "Titre (EN)",
        files: "Fichier(s)"
      },
      partners: {
        title: "Partenaires",
        name: "Nom du Partenaire",
        category: "Catégorie",
        website: "Site Web",
        add_partner: "Ajouter un Partenaire"
      },
      testimonials: {
        title: "Témoignages",
        author: "Auteur",
        role: "Rôle",
        rating: "Note",
        add_testimonial: "Ajouter un Témoignage",
        content: "Contenu"
      },
      activities: {
        title: "Activités",
        activity_name: "Nom de l'activité",
        category: "Catégorie",
        date: "Date",
        add_activity: "Ajouter une Activité"
      },
      conferences: {
        title: "Conférences",
        topic: "Sujet",
        speaker: "Intervenant",
        date: "Date",
        add_conference: "Ajouter une Conférence"
      },
      flyer: {
        title: "Campagnes de Flyers",
        campaign: "Campagne",
        channel: "Canal",
        start_date: "Date de début",
        end_date: "Date de fin",
        add_flyer: "Ajouter un Flyer"
      },
      members: {
        title: "Membres",
        name: "Nom",
        role: "Rôle",
        department: "Département",
        add_member: "Ajouter un Membre"
      },
      upcoming: {
        title: "Événements à venir",
        event_name: "Nom de l'événement",
        countdown: "Compte à rebours",
        add_upcoming: "Ajouter un événement futur"
      }
    }
  },
  de: {
    sidebar: {
      dashboard: "Dashboard",
      crm_leads: "CRM & Leads",
      programs: "Programme",
      partners: "Partner",
      testimonials: "Erfahrungsberichte",
      gallery: "Galerie",
      users: "Benutzer",
      events: "Ereignisse",
      activities: "Aktivitäten",
      conferences: "Konferenzen",
      upcoming: "Kommende Veranstaltungen",
      flyer: "Flyer-Kampagnen",
      members: "Mitglieder"
    },
    topbar: {
      current_session: "Aktuelle Sitzung",
      server_status: "Server Status",
      online: "Online & Sicher",
      profile: "Profil",
      signout: "Abmelden"
    },
    actions: {
      add: "Hinzufügen",
      edit: "Bearbeiten",
      delete: "Löschen",
      save: "Speichern",
      saving: "Speichern...",
      cancel: "Abbrechen",
      confirm_delete: "Möchten Sie wirklich löschen",
      search: "Suche...",
      create: "Erstellen"
    },
    status: {
      live: "Live",
      review: "Überprüfung",
      archived: "Archiviert",
      draft: "Entwurf",
      scheduled: "Geplant",
      past: "Vergangen",
      active: "Aktiv",
      inactive: "Inaktiv",
      new: "Neu",
      contacted: "Kontaktiert",
      converted: "Konvertiert"
    },
    screens: {
      programs: {
        title: "Programme",
        name: "Name",
        category: "Kategorie",
        duration: "Dauer",
        level: "Niveau",
        add_program: "Programm Hinzufügen",
        delete_program: "Programm Löschen"
      },
      leads: {
        title: "Leads",
        name: "Name",
        email: "Email",
        phone: "Telefon",
        status: "Status",
        add_lead: "Lead Hinzufügen"
      },
      users: {
        title: "Benutzer",
        name: "Name",
        email: "Email",
        role: "Rolle",
        add_user: "Benutzer Erstellen",
        password: "Passwort",
        password_placeholder: "min 8 Zeichen"
      },
      events: {
        title: "Ereignisse",
        event_title: "Titel",
        type: "Typ",
        date: "Datum",
        location: "Ort",
        add_event: "Ereignis Hinzufügen"
      },
      gallery: {
        title: "Digitale Assets",
        album_file: "Album / Datei",
        type: "Typ",
        url: "URL",
        add_media: "Medien Hinzufügen",
        title_fr: "Titel (FR)",
        title_en: "Titel (EN)",
        files: "Datei(en)"
      },
      partners: {
        title: "Partner",
        name: "Partnername",
        category: "Kategorie",
        website: "Webseite",
        add_partner: "Partner Hinzufügen"
      },
      testimonials: {
        title: "Erfahrungsberichte",
        author: "Autor",
        role: "Rolle",
        rating: "Bewertung",
        add_testimonial: "Erfahrungsbericht Hinzufügen",
        content: "Inhalt"
      },
      activities: {
        title: "Aktivitäten",
        activity_name: "Name der Aktivität",
        category: "Kategorie",
        date: "Datum",
        add_activity: "Aktivität Hinzufügen"
      },
      conferences: {
        title: "Konferenzen",
        topic: "Thema",
        speaker: "Sprecher",
        date: "Datum",
        add_conference: "Konferenz Hinzufügen"
      },
      flyer: {
        title: "Flyer-Kampagnen",
        campaign: "Kampagne",
        channel: "Kanal",
        start_date: "Startdatum",
        end_date: "Enddatum",
        add_flyer: "Flyer Hinzufügen"
      },
      members: {
        title: "Mitglieder",
        name: "Name",
        role: "Rolle",
        department: "Abteilung",
        add_member: "Mitglied Hinzufügen"
      },
      upcoming: {
        title: "Kommende Veranstaltungen",
        event_name: "Veranstaltungsname",
        countdown: "Countdown",
        add_upcoming: "Kommende Veranstaltung Hinzufügen"
      }
    }
  },
  it: {
    sidebar: {
      dashboard: "Dashboard",
      crm_leads: "CRM & Leads",
      programs: "Programmi",
      partners: "Partner",
      testimonials: "Testimonianze",
      gallery: "Galleria",
      users: "Utenti",
      events: "Eventi",
      activities: "Attività",
      conferences: "Conferenze",
      upcoming: "Prossimi Eventi",
      flyer: "Campagne Flyer",
      members: "Membri"
    },
    topbar: {
      current_session: "Sessione Corrente",
      server_status: "Stato del Server",
      online: "Online & Sicuro",
      profile: "Profilo",
      signout: "Esci"
    },
    actions: {
      add: "Aggiungi",
      edit: "Modifica",
      delete: "Elimina",
      save: "Salva",
      saving: "Salvataggio...",
      cancel: "Annulla",
      confirm_delete: "Sei sicuro di voler eliminare",
      search: "Cerca...",
      create: "Crea"
    },
    status: {
      live: "Live",
      review: "In Revisione",
      archived: "Archiviato",
      draft: "Bozza",
      scheduled: "Programmato",
      past: "Passato",
      active: "Attivo",
      inactive: "Inattivo",
      new: "Nuovo",
      contacted: "Contattato",
      converted: "Convertito"
    },
    screens: {
      programs: {
        title: "Programmi",
        name: "Nome",
        category: "Categoria",
        duration: "Durata",
        level: "Livello",
        add_program: "Aggiungi Programma",
        delete_program: "Elimina Programma"
      },
      leads: {
        title: "Leads",
        name: "Nome",
        email: "Email",
        phone: "Telefono",
        status: "Stato",
        add_lead: "Aggiungi Lead"
      },
      users: {
        title: "Utenti",
        name: "Nome",
        email: "Email",
        role: "Ruolo",
        add_user: "Crea Utente",
        password: "Password",
        password_placeholder: "min 8 caratt."
      },
      events: {
        title: "Eventi",
        event_title: "Titolo Evento",
        type: "Tipo",
        date: "Data",
        location: "Luogo",
        add_event: "Aggiungi Evento"
      },
      gallery: {
        title: "Risorse Digitali",
        album_file: "Album / File",
        type: "Tipo",
        url: "URL",
        add_media: "Aggiungi Media",
        title_fr: "Titolo (FR)",
        title_en: "Titolo (EN)",
        files: "File(s)"
      },
      partners: {
        title: "Partner",
        name: "Nome Partner",
        category: "Categoria",
        website: "Sito Web",
        add_partner: "Aggiungi Partner"
      },
      testimonials: {
        title: "Testimonianze",
        author: "Autore",
        role: "Ruolo",
        rating: "Valutazione",
        add_testimonial: "Aggiungi Testimonianza",
        content: "Contenuto"
      },
      activities: {
        title: "Attività",
        activity_name: "Nome Attività",
        category: "Categoria",
        date: "Data",
        add_activity: "Aggiungi Attività"
      },
      conferences: {
        title: "Conferenze",
        topic: "Argomento",
        speaker: "Relatore",
        date: "Data",
        add_conference: "Aggiungi Conferenza"
      },
      flyer: {
        title: "Campagne Flyer",
        campaign: "Campagna",
        channel: "Canale",
        start_date: "Data di Inizio",
        end_date: "Data di Fine",
        add_flyer: "Aggiungi Flyer"
      },
      members: {
        title: "Membri",
        name: "Nome",
        role: "Ruolo",
        department: "Dipartimento",
        add_member: "Aggiungi Membro"
      },
      upcoming: {
        title: "Prossimi Eventi",
        event_name: "Nome Evento",
        countdown: "Conto alla rovescia",
        add_upcoming: "Aggiungi Evento Futuro"
      }
    }
  }
};

langs.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.dashboard = translations[lang] || commonDashboard;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}/translation.json`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
