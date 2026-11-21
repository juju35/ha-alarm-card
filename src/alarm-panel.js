/*
 * Alarm panel for Home Assistant (served by the Alarm Card integration)
 * https://github.com/juju35/ha-alarm-card
 *
 * Sets up Alarmo (https://github.com/nielsfaber/alarmo) in the style of the alarm cards: the same tabs and settings
 * as Alarmo's own panel (General, Sensors, Codes, Actions), then the panel's Settings. The header is the alarm card's
 * illustrated banner across the page, with the mode buttons. Everything is read and written through Alarmo's own
 * API (its websocket commands and /api/alarmo/* views), so Alarmo's entities, cards and automations are unchanged.
 */

const PANEL_VERSION = "__VERSION__";

// The panel's texts; English is the source and every other language falls back to it, key by key.
const PANEL_STRINGS = {
  en: {
    title: "Alarm",
    t_general: "General",
    t_sensors: "Sensors",
    t_codes: "Codes",
    t_actions: "Actions",
    t_settings: "Settings",
    loading: "Loading…",
    no_alarmo: "Alarmo is not installed",
    no_alarmo_hint: "This panel sets up Alarmo. Install Alarmo from the Marketplace, add it in Settings → Devices & services, then come back.",
    saved: "Saved",
    error: "Could not save: {error}",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    remove: "Remove",
    add: "Add",
    test: "Try it",
    confirm_delete: "Delete “{name}”?",
    none: "None",
    all_areas: "All areas",
    search: "Search",
    sec: "s",
    // States in the header
    s_disarmed: "Disarmed",
    s_armed_home: "Armed home",
    s_armed_away: "Armed away",
    s_armed_night: "Armed night",
    s_armed_vacation: "Armed vacation",
    s_armed_custom_bypass: "Armed custom",
    s_arming: "Exit delay",
    s_pending: "Entry delay",
    s_triggered: "Triggered",
    s_disarming: "Disarming",
    s_unavailable: "Unavailable",
    sub_ready: "{n} sensors ready",
    sub_blocking: "Not ready: {names}",
    sub_since: "Since {time}",
    sub_triggered: "Cause: {names}",
    sub_none: "No alarm found",
    // Modes
    m_disarm: "Disarm",
    m_armed_home: "Home",
    m_armed_away: "Away",
    m_armed_night: "Night",
    m_armed_vacation: "Vacation",
    m_armed_custom_bypass: "Custom",
    code_title: "Code",
    code_hint: "Enter the code to continue",
    // General
    modes: "Modes",
    modes_hint: "The enabled modes show on the cards and in the commands; each has its own delays.",
    mode_off: "Disabled",
    mode_line: "Exit {exit} · Entry {entry} · Alarm {trigger}",
    unlimited: "unlimited",
    exit_time: "Exit delay",
    exit_time_hint: "Time to leave once the alarm is armed",
    entry_time: "Entry delay",
    entry_time_hint: "Time to disarm after a detection",
    trigger_time: "Alarm duration",
    trigger_time_hint: "0 = no limit",
    areas: "Areas",
    add_area: "Add an area",
    area_name: "Name",
    area_line: "{n} sensors",
    delete_area: "Delete the area",
    behaviour: "Behaviour",
    master: "Master alarm",
    master_hint: "One entity driving every area together",
    master_name: "Master alarm name",
    disarm_after_trigger: "Disarm after triggering",
    disarm_after_trigger_hint: "Otherwise the alarm goes back to the mode it was in",
    ignore_blocking: "Ignore blocking sensors after triggering",
    ignore_blocking_hint: "Rearms even when sensors are still open",
    mqtt: "MQTT",
    mqtt_hint: "Publishes the state and accepts commands (keypads, wall panels).",
    state_topic: "State topic",
    command_topic: "Command topic",
    event_topic: "Event topic",
    require_code: "Code required",
    require_code_hint: "For MQTT commands",
    // Sensors
    sensors: "Sensors",
    no_sensors: "No sensor yet: add some below.",
    st_ready: "Ready",
    st_open: "Keeps it from arming",
    st_bypassed: "Bypassed",
    st_unavailable: "Unavailable",
    st_disabled: "Disabled",
    st_open_ok: "Open allowed",
    on: "Open",
    off: "Closed",
    type: "Type",
    ty_door: "Door",
    ty_window: "Window",
    ty_motion: "Motion",
    ty_tamper: "Tamper",
    ty_environmental: "Environmental",
    ty_other: "Other",
    area: "Area",
    group: "Group",
    sensor_modes: "Modes",
    sensor_modes_hint: "The sensor watches in these modes",
    use_exit_delay: "Use the exit delay",
    use_entry_delay: "Use the entry delay",
    use_entry_delay_hint: "Otherwise it triggers at once",
    arm_on_close: "Arm on close",
    arm_on_close_hint: "Arms when the sensor closes during the exit delay",
    allow_open: "Allow open when arming",
    auto_bypass: "Bypass automatically",
    auto_bypass_hint: "When it is open on arming",
    trigger_unavailable: "Trigger when unavailable",
    always_on: "Always on",
    always_on_hint: "Even disarmed (smoke, water)",
    f_immediate: "Immediate",
    f_entry: "Entry delay",
    f_always: "Always on",
    f_bypass: "Auto bypass",
    f_unavailable: "Triggers when unavailable",
    add_sensors: "Add sensors",
    add_sensors_hint: "Entities not used by the alarm yet.",
    add_n: "Add ({n})",
    no_candidates: "Every sensor is already in the alarm.",
    groups: "Sensor groups",
    groups_hint: "Triggers only when several sensors of the group detect within the time window.",
    new_group: "New group",
    group_line: "{events} events in {timeout} s · {n} sensors",
    event_count: "Events",
    timeout: "Time window",
    group_sensors: "Sensors",
    // Codes
    code_usage: "Code use",
    code_arm_required: "Code to arm",
    code_disarm_required: "Code to disarm",
    code_mode_change_required: "Code to change mode",
    code_mode_change_hint: "Armed → another mode",
    code_format: "Code format",
    code_format_hint: "Number pad or free text",
    cf_number: "Number",
    cf_text: "Text",
    users: "Users",
    new_user: "New user",
    user_name: "Name",
    code: "Code",
    code_keep: "Leave empty to keep it",
    old_code: "Current code",
    can_arm: "Can arm",
    can_disarm: "Can disarm",
    is_override_code: "Override code",
    is_override_code_hint: "Arms even when sensors are open",
    area_limit: "Areas",
    area_limit_hint: "None selected: every area",
    u_arm_disarm: "Arms and disarms",
    u_arm: "Arms only",
    u_disarm: "Disarms only",
    u_none: "No rights",
    u_override: "Override",
    // Actions
    notifications: "Notifications",
    new_notification: "New notification",
    actions: "Actions",
    new_action: "New action",
    no_notifications: "No notification yet.",
    no_actions: "No action yet.",
    name: "Name",
    event: "Event",
    ev_armed: "Armed",
    ev_disarmed: "Disarmed",
    ev_triggered: "Triggered",
    ev_untriggered: "No longer triggered",
    ev_arm_failure: "Failed to arm",
    ev_arming: "Exit delay started",
    ev_pending: "Entry delay started",
    action_modes: "Modes",
    action_modes_hint: "None selected: every mode",
    target: "Target",
    notif_title: "Title",
    message: "Message",
    message_hint: "Wildcards: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entity",
    action: "Action",
    turn_on: "Turn on",
    turn_off: "Turn off",
    // Settings
    display: "Panel display",
    panel_title: "Sidebar title",
    hide_header: "Hide the top bar",
    hide_header_hint: "The tabs and the menu button stay",
    hh_off: "Never",
    hh_non_admin: "Non-admins",
    hh_all: "Everyone",
    panel_tabs: "Tabs shown",
    sidebar_badge: "Sidebar badge",
    sidebar_badge_hint: "Sensors keeping the alarm from arming; red while it is triggered",
    enabled: "On",
    disabled: "Off",
    alarm: "Alarm",
    header_entity: "Alarm shown in the header",
    header_entity_auto: "Automatic (Alarmo master)",
    illustration_theme: "Illustration theme",
    illustration_theme_hint: "Auto follows Home Assistant's theme",
    th_auto: "Auto",
    th_day: "Day",
    th_night: "Night",
    admin_note: "This panel is for administrators. Alarmo keeps the configuration: its entities, cards and automations keep working.",
    t_timeline: "Timeline",
    all_rooms: "All rooms",
    no_room: "No room",
    tl_motion: "Motion",
    tl_clear: "Clear",
    tl_detected: "Detected",
    tl_ok: "OK",
    tl_now: "now",
    tl_events: "Events",
    tl_tracked: "Sensors tracked: {n}",
    tl_triggers: "Triggers",
    tl_none: "None",
    tl_calm: "All calm",
    tl_most: "Most active",
    tl_times: "{n}×",
    tl_longest: "Longest opening",
    tl_alarm_at: "Alarm: {state}",
    tl_last: "last activity {ago}",
    tl_no_activity: "No activity",
    tl_n_sensors: "Sensors: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 days",
    tl_armed: "Alarm armed",
    tl_marks: "Delay / trigger",
    tl_by_room: "Activity by room",
    tl_by_type: "Activity by sensor type",
    tl_by_sensor: "Activity by sensor",
    g_room: "By room",
    g_type: "By type",
    g_none: "Ungrouped",
    so_label: "Sort",
    so_recent: "Recent activity",
    so_count: "Most active",
    so_name: "Name",
    tl_no_history: "No history for this period: is the recorder on?",
    tl_duration: "Duration: {d}",
  },
  fr: {
    title: "Alarme",
    t_general: "Général",
    t_sensors: "Capteurs",
    t_codes: "Codes",
    t_actions: "Actions",
    t_settings: "Réglages",
    loading: "Chargement…",
    no_alarmo: "Alarmo n'est pas installé",
    no_alarmo_hint: "Ce panneau configure Alarmo. Installez Alarmo depuis le Marketplace, ajoutez-le dans Paramètres → Appareils et services, puis revenez.",
    saved: "Enregistré",
    error: "Échec de l'enregistrement : {error}",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    remove: "Retirer",
    add: "Ajouter",
    test: "Tester",
    confirm_delete: "Supprimer « {name} » ?",
    none: "Aucun",
    all_areas: "Toutes les zones",
    search: "Rechercher",
    sec: "s",
    s_disarmed: "Désarmée",
    s_armed_home: "Armée domicile",
    s_armed_away: "Armée absent",
    s_armed_night: "Armée nuit",
    s_armed_vacation: "Armée vacances",
    s_armed_custom_bypass: "Armée personnalisé",
    s_arming: "Délai de sortie",
    s_pending: "Délai d'entrée",
    s_triggered: "Déclenchée",
    s_disarming: "Désarmement",
    s_unavailable: "Indisponible",
    sub_ready: "{n} capteurs prêts",
    sub_blocking: "Pas prête : {names}",
    sub_since: "Depuis {time}",
    sub_triggered: "Cause : {names}",
    sub_none: "Aucune alarme trouvée",
    m_disarm: "Désarmer",
    m_armed_home: "Domicile",
    m_armed_away: "Absent",
    m_armed_night: "Nuit",
    m_armed_vacation: "Vacances",
    m_armed_custom_bypass: "Personnalisé",
    code_title: "Code",
    code_hint: "Saisissez le code pour continuer",
    modes: "Modes",
    modes_hint: "Les modes activés apparaissent sur les cartes et dans les commandes ; chacun a ses délais.",
    mode_off: "Désactivé",
    mode_line: "Sortie {exit} · Entrée {entry} · Alarme {trigger}",
    unlimited: "illimitée",
    exit_time: "Délai de sortie",
    exit_time_hint: "Temps pour partir une fois l'alarme armée",
    entry_time: "Délai d'entrée",
    entry_time_hint: "Temps pour désarmer après une détection",
    trigger_time: "Durée de l'alarme",
    trigger_time_hint: "0 = sans limite",
    areas: "Zones",
    add_area: "Ajouter une zone",
    area_name: "Nom",
    area_line: "{n} capteurs",
    delete_area: "Supprimer la zone",
    behaviour: "Comportement",
    master: "Alarme maître",
    master_hint: "Une entité qui pilote toutes les zones ensemble",
    master_name: "Nom de l'alarme maître",
    disarm_after_trigger: "Désarmer après déclenchement",
    disarm_after_trigger_hint: "Sinon l'alarme revient dans le mode où elle était",
    ignore_blocking: "Ignorer les capteurs bloquants après déclenchement",
    ignore_blocking_hint: "Se réarme même si des capteurs sont encore ouverts",
    mqtt: "MQTT",
    mqtt_hint: "Publie l'état et accepte des commandes (claviers, panneaux muraux).",
    state_topic: "Sujet d'état",
    command_topic: "Sujet de commande",
    event_topic: "Sujet d'événement",
    require_code: "Code requis",
    require_code_hint: "Pour les commandes MQTT",
    sensors: "Capteurs",
    no_sensors: "Aucun capteur pour l'instant : ajoutez-en ci-dessous.",
    st_ready: "Prêt",
    st_open: "Empêche l'armement",
    st_bypassed: "Contourné",
    st_unavailable: "Indisponible",
    st_disabled: "Désactivé",
    st_open_ok: "Ouvert autorisé",
    on: "Ouvert",
    off: "Fermé",
    type: "Type",
    ty_door: "Porte",
    ty_window: "Fenêtre",
    ty_motion: "Mouvement",
    ty_tamper: "Sabotage",
    ty_environmental: "Environnement",
    ty_other: "Autre",
    area: "Zone",
    group: "Groupe",
    sensor_modes: "Modes",
    sensor_modes_hint: "Le capteur surveille dans ces modes",
    use_exit_delay: "Utiliser le délai de sortie",
    use_entry_delay: "Utiliser le délai d'entrée",
    use_entry_delay_hint: "Sinon il déclenche immédiatement",
    arm_on_close: "Armer à la fermeture",
    arm_on_close_hint: "Arme quand le capteur se ferme pendant le délai de sortie",
    allow_open: "Autoriser ouvert à l'armement",
    auto_bypass: "Contourner automatiquement",
    auto_bypass_hint: "S'il est ouvert à l'armement",
    trigger_unavailable: "Déclencher si indisponible",
    always_on: "Toujours actif",
    always_on_hint: "Même désarmée (fumée, eau)",
    f_immediate: "Immédiat",
    f_entry: "Délai d'entrée",
    f_always: "Toujours actif",
    f_bypass: "Contournement auto",
    f_unavailable: "Déclenche si indisponible",
    add_sensors: "Ajouter des capteurs",
    add_sensors_hint: "Entités pas encore utilisées par l'alarme.",
    add_n: "Ajouter ({n})",
    no_candidates: "Tous les capteurs sont déjà dans l'alarme.",
    groups: "Groupes de capteurs",
    groups_hint: "Déclenche seulement si plusieurs capteurs du groupe détectent dans la fenêtre de temps.",
    new_group: "Nouveau groupe",
    group_line: "{events} événements en {timeout} s · {n} capteurs",
    event_count: "Événements",
    timeout: "Fenêtre de temps",
    group_sensors: "Capteurs",
    code_usage: "Utilisation des codes",
    code_arm_required: "Code pour armer",
    code_disarm_required: "Code pour désarmer",
    code_mode_change_required: "Code pour changer de mode",
    code_mode_change_hint: "Armée → autre mode",
    code_format: "Format du code",
    code_format_hint: "Clavier numérique ou texte libre",
    cf_number: "Numérique",
    cf_text: "Texte",
    users: "Utilisateurs",
    new_user: "Nouvel utilisateur",
    user_name: "Nom",
    code: "Code",
    code_keep: "Laisser vide pour le garder",
    old_code: "Code actuel",
    can_arm: "Peut armer",
    can_disarm: "Peut désarmer",
    is_override_code: "Code prioritaire",
    is_override_code_hint: "Arme même si des capteurs sont ouverts",
    area_limit: "Zones",
    area_limit_hint: "Aucune sélectionnée : toutes les zones",
    u_arm_disarm: "Arme et désarme",
    u_arm: "Arme seulement",
    u_disarm: "Désarme seulement",
    u_none: "Aucun droit",
    u_override: "Prioritaire",
    notifications: "Notifications",
    new_notification: "Nouvelle notification",
    actions: "Actions",
    new_action: "Nouvelle action",
    no_notifications: "Aucune notification pour l'instant.",
    no_actions: "Aucune action pour l'instant.",
    name: "Nom",
    event: "Événement",
    ev_armed: "Armée",
    ev_disarmed: "Désarmée",
    ev_triggered: "Déclenchée",
    ev_untriggered: "Fin du déclenchement",
    ev_arm_failure: "Échec de l'armement",
    ev_arming: "Délai de sortie lancé",
    ev_pending: "Délai d'entrée lancé",
    action_modes: "Modes",
    action_modes_hint: "Aucun sélectionné : tous les modes",
    target: "Cible",
    notif_title: "Titre",
    message: "Message",
    message_hint: "Variables : {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entité",
    action: "Action",
    turn_on: "Allumer",
    turn_off: "Éteindre",
    display: "Affichage du panneau",
    panel_title: "Titre dans la barre latérale",
    hide_header: "Masquer la barre du haut",
    hide_header_hint: "Les onglets et le bouton menu restent",
    hh_off: "Jamais",
    hh_non_admin: "Non-admins",
    hh_all: "Tout le monde",
    panel_tabs: "Onglets affichés",
    sidebar_badge: "Pastille de la barre latérale",
    sidebar_badge_hint: "Capteurs qui empêchent l'armement ; rouge quand l'alarme est déclenchée",
    enabled: "Activée",
    disabled: "Désactivée",
    alarm: "Alarme",
    header_entity: "Alarme affichée dans l'en-tête",
    header_entity_auto: "Automatique (maître Alarmo)",
    illustration_theme: "Thème de l'illustration",
    illustration_theme_hint: "Auto suit le thème de Home Assistant",
    th_auto: "Auto",
    th_day: "Jour",
    th_night: "Nuit",
    admin_note: "Ce panneau est réservé aux administrateurs. Alarmo garde la configuration : ses entités, cartes et automatisations continuent de fonctionner.",
    t_timeline: "Timeline",
    all_rooms: "Toutes les pièces",
    no_room: "Sans pièce",
    tl_motion: "Mouvement",
    tl_clear: "Calme",
    tl_detected: "Détecté",
    tl_ok: "OK",
    tl_now: "maintenant",
    tl_events: "Événements",
    tl_tracked: "Capteurs suivis : {n}",
    tl_triggers: "Déclenchements",
    tl_none: "Aucun",
    tl_calm: "Tout est calme",
    tl_most: "Le plus actif",
    tl_times: "{n}×",
    tl_longest: "Ouverture la plus longue",
    tl_alarm_at: "Alarme : {state}",
    tl_last: "dernière activité {ago}",
    tl_no_activity: "Aucune activité",
    tl_n_sensors: "Capteurs : {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 jours",
    tl_armed: "Alarme armée",
    tl_marks: "Délai / déclenchement",
    tl_by_room: "Activité par pièce",
    tl_by_type: "Activité par type de capteur",
    tl_by_sensor: "Activité par capteur",
    g_room: "Par pièce",
    g_type: "Par type",
    g_none: "Sans regroupement",
    so_label: "Tri",
    so_recent: "Activité récente",
    so_count: "Plus actifs",
    so_name: "Nom",
    tl_no_history: "Aucun historique sur cette période : l'enregistreur est-il actif ?",
    tl_duration: "Durée : {d}",
  },
  de: {
    title: "Alarm",
    t_general: "Allgemein",
    t_sensors: "Sensoren",
    t_codes: "Codes",
    t_actions: "Aktionen",
    t_settings: "Einstellungen",
    loading: "Wird geladen…",
    no_alarmo: "Alarmo ist nicht installiert",
    no_alarmo_hint: "Dieses Panel richtet Alarmo ein. Installiere Alarmo aus dem Marketplace, füge es unter Einstellungen → Geräte & Dienste hinzu und komm dann zurück.",
    saved: "Gespeichert",
    error: "Speichern fehlgeschlagen: {error}",
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    remove: "Entfernen",
    add: "Hinzufügen",
    test: "Testen",
    confirm_delete: "„{name}“ löschen?",
    none: "Keine",
    all_areas: "Alle Bereiche",
    search: "Suchen",
    sec: "s",
    s_disarmed: "Unscharf",
    s_armed_home: "Scharf (Zuhause)",
    s_armed_away: "Scharf (Abwesend)",
    s_armed_night: "Scharf (Nacht)",
    s_armed_vacation: "Scharf (Urlaub)",
    s_armed_custom_bypass: "Scharf (Benutzerdefiniert)",
    s_arming: "Ausgangsverzögerung",
    s_pending: "Eingangsverzögerung",
    s_triggered: "Ausgelöst",
    s_disarming: "Wird unscharf geschaltet",
    s_unavailable: "Nicht verfügbar",
    sub_ready: "{n} Sensoren bereit",
    sub_blocking: "Nicht bereit: {names}",
    sub_since: "Seit {time}",
    sub_triggered: "Ursache: {names}",
    sub_none: "Kein Alarm gefunden",
    m_disarm: "Unscharf",
    m_armed_home: "Zuhause",
    m_armed_away: "Abwesend",
    m_armed_night: "Nacht",
    m_armed_vacation: "Urlaub",
    m_armed_custom_bypass: "Benutzerdefiniert",
    code_title: "Code",
    code_hint: "Gib den Code ein, um fortzufahren",
    modes: "Modi",
    modes_hint: "Die aktivierten Modi erscheinen auf den Karten und in den Befehlen; jeder hat eigene Verzögerungen.",
    mode_off: "Deaktiviert",
    mode_line: "Ausgang {exit} · Eingang {entry} · Alarm {trigger}",
    unlimited: "unbegrenzt",
    exit_time: "Ausgangsverzögerung",
    exit_time_hint: "Zeit zum Verlassen, nachdem der Alarm scharf ist",
    entry_time: "Eingangsverzögerung",
    entry_time_hint: "Zeit zum Unscharfschalten nach einer Erkennung",
    trigger_time: "Alarmdauer",
    trigger_time_hint: "0 = ohne Begrenzung",
    areas: "Bereiche",
    add_area: "Bereich hinzufügen",
    area_name: "Name",
    area_line: "{n} Sensoren",
    delete_area: "Bereich löschen",
    behaviour: "Verhalten",
    master: "Master-Alarm",
    master_hint: "Eine Entität, die alle Bereiche gemeinsam steuert",
    master_name: "Name des Master-Alarms",
    disarm_after_trigger: "Nach Auslösung unscharf schalten",
    disarm_after_trigger_hint: "Sonst kehrt der Alarm in seinen vorherigen Modus zurück",
    ignore_blocking: "Blockierende Sensoren nach Auslösung ignorieren",
    ignore_blocking_hint: "Schaltet wieder scharf, auch wenn Sensoren noch offen sind",
    mqtt: "MQTT",
    mqtt_hint: "Veröffentlicht den Status und nimmt Befehle an (Tastaturen, Wandpanels).",
    state_topic: "Status-Topic",
    command_topic: "Befehls-Topic",
    event_topic: "Ereignis-Topic",
    require_code: "Code erforderlich",
    require_code_hint: "Für MQTT-Befehle",
    sensors: "Sensoren",
    no_sensors: "Noch kein Sensor: füge unten welche hinzu.",
    st_ready: "Bereit",
    st_open: "Verhindert das Scharfschalten",
    st_bypassed: "Überbrückt",
    st_unavailable: "Nicht verfügbar",
    st_disabled: "Deaktiviert",
    st_open_ok: "Offen erlaubt",
    on: "Offen",
    off: "Geschlossen",
    type: "Typ",
    ty_door: "Tür",
    ty_window: "Fenster",
    ty_motion: "Bewegung",
    ty_tamper: "Sabotage",
    ty_environmental: "Umwelt",
    ty_other: "Sonstiges",
    area: "Bereich",
    group: "Gruppe",
    sensor_modes: "Modi",
    sensor_modes_hint: "Der Sensor überwacht in diesen Modi",
    use_exit_delay: "Ausgangsverzögerung verwenden",
    use_entry_delay: "Eingangsverzögerung verwenden",
    use_entry_delay_hint: "Sonst löst er sofort aus",
    arm_on_close: "Beim Schließen scharf schalten",
    arm_on_close_hint: "Schaltet scharf, wenn der Sensor während der Ausgangsverzögerung schließt",
    allow_open: "Offen beim Scharfschalten erlauben",
    auto_bypass: "Automatisch überbrücken",
    auto_bypass_hint: "Wenn er beim Scharfschalten offen ist",
    trigger_unavailable: "Bei Nichtverfügbarkeit auslösen",
    always_on: "Immer aktiv",
    always_on_hint: "Auch unscharf (Rauch, Wasser)",
    f_immediate: "Sofort",
    f_entry: "Eingangsverzögerung",
    f_always: "Immer aktiv",
    f_bypass: "Auto-Überbrückung",
    f_unavailable: "Löst bei Nichtverfügbarkeit aus",
    add_sensors: "Sensoren hinzufügen",
    add_sensors_hint: "Entitäten, die der Alarm noch nicht nutzt.",
    add_n: "Hinzufügen ({n})",
    no_candidates: "Alle Sensoren sind bereits im Alarm.",
    groups: "Sensorgruppen",
    groups_hint: "Löst nur aus, wenn mehrere Sensoren der Gruppe im Zeitfenster erkennen.",
    new_group: "Neue Gruppe",
    group_line: "{events} Ereignisse in {timeout} s · {n} Sensoren",
    event_count: "Ereignisse",
    timeout: "Zeitfenster",
    group_sensors: "Sensoren",
    code_usage: "Code-Verwendung",
    code_arm_required: "Code zum Scharfschalten",
    code_disarm_required: "Code zum Unscharfschalten",
    code_mode_change_required: "Code zum Moduswechsel",
    code_mode_change_hint: "Scharf → anderer Modus",
    code_format: "Code-Format",
    code_format_hint: "Ziffernblock oder freier Text",
    cf_number: "Zahlen",
    cf_text: "Text",
    users: "Benutzer",
    new_user: "Neuer Benutzer",
    user_name: "Name",
    code: "Code",
    code_keep: "Leer lassen, um ihn zu behalten",
    old_code: "Aktueller Code",
    can_arm: "Darf scharf schalten",
    can_disarm: "Darf unscharf schalten",
    is_override_code: "Übersteuerungscode",
    is_override_code_hint: "Schaltet scharf, auch wenn Sensoren offen sind",
    area_limit: "Bereiche",
    area_limit_hint: "Keiner gewählt: alle Bereiche",
    u_arm_disarm: "Scharf und unscharf",
    u_arm: "Nur scharf",
    u_disarm: "Nur unscharf",
    u_none: "Keine Rechte",
    u_override: "Übersteuerung",
    notifications: "Benachrichtigungen",
    new_notification: "Neue Benachrichtigung",
    actions: "Aktionen",
    new_action: "Neue Aktion",
    no_notifications: "Noch keine Benachrichtigung.",
    no_actions: "Noch keine Aktion.",
    name: "Name",
    event: "Ereignis",
    ev_armed: "Scharf",
    ev_disarmed: "Unscharf",
    ev_triggered: "Ausgelöst",
    ev_untriggered: "Nicht mehr ausgelöst",
    ev_arm_failure: "Scharfschalten fehlgeschlagen",
    ev_arming: "Ausgangsverzögerung gestartet",
    ev_pending: "Eingangsverzögerung gestartet",
    action_modes: "Modi",
    action_modes_hint: "Keiner gewählt: alle Modi",
    target: "Ziel",
    notif_title: "Titel",
    message: "Nachricht",
    message_hint: "Platzhalter: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entität",
    action: "Aktion",
    turn_on: "Einschalten",
    turn_off: "Ausschalten",
    display: "Panel-Anzeige",
    panel_title: "Titel in der Seitenleiste",
    hide_header: "Obere Leiste ausblenden",
    hide_header_hint: "Die Tabs und die Menütaste bleiben",
    hh_off: "Nie",
    hh_non_admin: "Nicht-Admins",
    hh_all: "Alle",
    panel_tabs: "Angezeigte Tabs",
    sidebar_badge: "Badge in der Seitenleiste",
    sidebar_badge_hint: "Sensoren, die das Scharfschalten verhindern; rot, wenn der Alarm ausgelöst ist",
    enabled: "An",
    disabled: "Aus",
    alarm: "Alarm",
    header_entity: "Im Kopfbereich angezeigter Alarm",
    header_entity_auto: "Automatisch (Alarmo-Master)",
    illustration_theme: "Thema der Illustration",
    illustration_theme_hint: "Auto folgt dem Thema von Home Assistant",
    th_auto: "Auto",
    th_day: "Tag",
    th_night: "Nacht",
    admin_note: "Dieses Panel ist Administratoren vorbehalten. Alarmo behält die Konfiguration: seine Entitäten, Karten und Automationen funktionieren weiter.",
    t_timeline: "Zeitleiste",
    all_rooms: "Alle Räume",
    no_room: "Ohne Raum",
    tl_motion: "Bewegung",
    tl_clear: "Ruhig",
    tl_detected: "Erkannt",
    tl_ok: "OK",
    tl_now: "jetzt",
    tl_events: "Ereignisse",
    tl_tracked: "Überwachte Sensoren: {n}",
    tl_triggers: "Auslösungen",
    tl_none: "Keine",
    tl_calm: "Alles ruhig",
    tl_most: "Am aktivsten",
    tl_times: "{n}×",
    tl_longest: "Längste Öffnung",
    tl_alarm_at: "Alarm: {state}",
    tl_last: "letzte Aktivität {ago}",
    tl_no_activity: "Keine Aktivität",
    tl_n_sensors: "Sensoren: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 Tage",
    tl_armed: "Alarm scharf",
    tl_marks: "Verzögerung / Auslösung",
    tl_by_room: "Aktivität nach Raum",
    tl_by_type: "Aktivität nach Sensortyp",
    tl_by_sensor: "Aktivität nach Sensor",
    g_room: "Nach Raum",
    g_type: "Nach Typ",
    g_none: "Ohne Gruppierung",
    so_label: "Sortierung",
    so_recent: "Letzte Aktivität",
    so_count: "Am aktivsten",
    so_name: "Name",
    tl_no_history: "Kein Verlauf für diesen Zeitraum: ist der Recorder aktiv?",
    tl_duration: "Dauer: {d}",
  },
  es: {
    title: "Alarma",
    t_general: "General",
    t_sensors: "Sensores",
    t_codes: "Códigos",
    t_actions: "Acciones",
    t_settings: "Ajustes",
    loading: "Cargando…",
    no_alarmo: "Alarmo no está instalado",
    no_alarmo_hint: "Este panel configura Alarmo. Instala Alarmo desde el Marketplace, añádelo en Ajustes → Dispositivos y servicios y vuelve.",
    saved: "Guardado",
    error: "No se pudo guardar: {error}",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    remove: "Quitar",
    add: "Añadir",
    test: "Probar",
    confirm_delete: "¿Eliminar «{name}»?",
    none: "Ninguno",
    all_areas: "Todas las zonas",
    search: "Buscar",
    sec: "s",
    s_disarmed: "Desarmada",
    s_armed_home: "Armada en casa",
    s_armed_away: "Armada ausente",
    s_armed_night: "Armada noche",
    s_armed_vacation: "Armada vacaciones",
    s_armed_custom_bypass: "Armada personalizada",
    s_arming: "Retardo de salida",
    s_pending: "Retardo de entrada",
    s_triggered: "Disparada",
    s_disarming: "Desarmando",
    s_unavailable: "No disponible",
    sub_ready: "{n} sensores listos",
    sub_blocking: "No lista: {names}",
    sub_since: "Desde las {time}",
    sub_triggered: "Causa: {names}",
    sub_none: "No se encontró ninguna alarma",
    m_disarm: "Desarmar",
    m_armed_home: "En casa",
    m_armed_away: "Ausente",
    m_armed_night: "Noche",
    m_armed_vacation: "Vacaciones",
    m_armed_custom_bypass: "Personalizado",
    code_title: "Código",
    code_hint: "Introduce el código para continuar",
    modes: "Modos",
    modes_hint: "Los modos activados aparecen en las tarjetas y en los comandos; cada uno tiene sus retardos.",
    mode_off: "Desactivado",
    mode_line: "Salida {exit} · Entrada {entry} · Alarma {trigger}",
    unlimited: "ilimitada",
    exit_time: "Retardo de salida",
    exit_time_hint: "Tiempo para salir una vez armada la alarma",
    entry_time: "Retardo de entrada",
    entry_time_hint: "Tiempo para desarmar tras una detección",
    trigger_time: "Duración de la alarma",
    trigger_time_hint: "0 = sin límite",
    areas: "Zonas",
    add_area: "Añadir una zona",
    area_name: "Nombre",
    area_line: "{n} sensores",
    delete_area: "Eliminar la zona",
    behaviour: "Comportamiento",
    master: "Alarma maestra",
    master_hint: "Una entidad que controla todas las zonas a la vez",
    master_name: "Nombre de la alarma maestra",
    disarm_after_trigger: "Desarmar tras dispararse",
    disarm_after_trigger_hint: "Si no, la alarma vuelve al modo en que estaba",
    ignore_blocking: "Ignorar sensores bloqueantes tras dispararse",
    ignore_blocking_hint: "Se rearma aunque haya sensores abiertos",
    mqtt: "MQTT",
    mqtt_hint: "Publica el estado y acepta comandos (teclados, paneles de pared).",
    state_topic: "Tema de estado",
    command_topic: "Tema de comando",
    event_topic: "Tema de eventos",
    require_code: "Código requerido",
    require_code_hint: "Para los comandos MQTT",
    sensors: "Sensores",
    no_sensors: "Aún no hay sensores: añade algunos abajo.",
    st_ready: "Listo",
    st_open: "Impide armar",
    st_bypassed: "Omitido",
    st_unavailable: "No disponible",
    st_disabled: "Desactivado",
    st_open_ok: "Abierto permitido",
    on: "Abierto",
    off: "Cerrado",
    type: "Tipo",
    ty_door: "Puerta",
    ty_window: "Ventana",
    ty_motion: "Movimiento",
    ty_tamper: "Sabotaje",
    ty_environmental: "Ambiental",
    ty_other: "Otro",
    area: "Zona",
    group: "Grupo",
    sensor_modes: "Modos",
    sensor_modes_hint: "El sensor vigila en estos modos",
    use_exit_delay: "Usar el retardo de salida",
    use_entry_delay: "Usar el retardo de entrada",
    use_entry_delay_hint: "Si no, se dispara al instante",
    arm_on_close: "Armar al cerrar",
    arm_on_close_hint: "Arma cuando el sensor se cierra durante el retardo de salida",
    allow_open: "Permitir abierto al armar",
    auto_bypass: "Omitir automáticamente",
    auto_bypass_hint: "Si está abierto al armar",
    trigger_unavailable: "Disparar si no está disponible",
    always_on: "Siempre activo",
    always_on_hint: "Incluso desarmada (humo, agua)",
    f_immediate: "Inmediato",
    f_entry: "Retardo de entrada",
    f_always: "Siempre activo",
    f_bypass: "Omisión auto",
    f_unavailable: "Dispara si no está disponible",
    add_sensors: "Añadir sensores",
    add_sensors_hint: "Entidades que la alarma aún no usa.",
    add_n: "Añadir ({n})",
    no_candidates: "Todos los sensores ya están en la alarma.",
    groups: "Grupos de sensores",
    groups_hint: "Solo se dispara si varios sensores del grupo detectan en la ventana de tiempo.",
    new_group: "Nuevo grupo",
    group_line: "{events} eventos en {timeout} s · {n} sensores",
    event_count: "Eventos",
    timeout: "Ventana de tiempo",
    group_sensors: "Sensores",
    code_usage: "Uso de los códigos",
    code_arm_required: "Código para armar",
    code_disarm_required: "Código para desarmar",
    code_mode_change_required: "Código para cambiar de modo",
    code_mode_change_hint: "Armada → otro modo",
    code_format: "Formato del código",
    code_format_hint: "Teclado numérico o texto libre",
    cf_number: "Numérico",
    cf_text: "Texto",
    users: "Usuarios",
    new_user: "Nuevo usuario",
    user_name: "Nombre",
    code: "Código",
    code_keep: "Déjalo vacío para conservarlo",
    old_code: "Código actual",
    can_arm: "Puede armar",
    can_disarm: "Puede desarmar",
    is_override_code: "Código prioritario",
    is_override_code_hint: "Arma aunque haya sensores abiertos",
    area_limit: "Zonas",
    area_limit_hint: "Ninguna seleccionada: todas las zonas",
    u_arm_disarm: "Arma y desarma",
    u_arm: "Solo arma",
    u_disarm: "Solo desarma",
    u_none: "Sin permisos",
    u_override: "Prioritario",
    notifications: "Notificaciones",
    new_notification: "Nueva notificación",
    actions: "Acciones",
    new_action: "Nueva acción",
    no_notifications: "Aún no hay notificaciones.",
    no_actions: "Aún no hay acciones.",
    name: "Nombre",
    event: "Evento",
    ev_armed: "Armada",
    ev_disarmed: "Desarmada",
    ev_triggered: "Disparada",
    ev_untriggered: "Ya no disparada",
    ev_arm_failure: "Fallo al armar",
    ev_arming: "Retardo de salida iniciado",
    ev_pending: "Retardo de entrada iniciado",
    action_modes: "Modos",
    action_modes_hint: "Ninguno seleccionado: todos los modos",
    target: "Destino",
    notif_title: "Título",
    message: "Mensaje",
    message_hint: "Comodines: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entidad",
    action: "Acción",
    turn_on: "Encender",
    turn_off: "Apagar",
    display: "Visualización del panel",
    panel_title: "Título en la barra lateral",
    hide_header: "Ocultar la barra superior",
    hide_header_hint: "Las pestañas y el botón de menú se mantienen",
    hh_off: "Nunca",
    hh_non_admin: "No administradores",
    hh_all: "Todos",
    panel_tabs: "Pestañas mostradas",
    sidebar_badge: "Insignia de la barra lateral",
    sidebar_badge_hint: "Sensores que impiden armar; en rojo cuando la alarma está disparada",
    enabled: "Activada",
    disabled: "Desactivada",
    alarm: "Alarma",
    header_entity: "Alarma mostrada en el encabezado",
    header_entity_auto: "Automática (maestra de Alarmo)",
    illustration_theme: "Tema de la ilustración",
    illustration_theme_hint: "Auto sigue el tema de Home Assistant",
    th_auto: "Auto",
    th_day: "Día",
    th_night: "Noche",
    admin_note: "Este panel está reservado a los administradores. Alarmo guarda la configuración: sus entidades, tarjetas y automatizaciones siguen funcionando.",
    t_timeline: "Cronología",
    all_rooms: "Todas las estancias",
    no_room: "Sin estancia",
    tl_motion: "Movimiento",
    tl_clear: "Despejado",
    tl_detected: "Detectado",
    tl_ok: "OK",
    tl_now: "ahora",
    tl_events: "Eventos",
    tl_tracked: "Sensores seguidos: {n}",
    tl_triggers: "Disparos",
    tl_none: "Ninguno",
    tl_calm: "Todo tranquilo",
    tl_most: "El más activo",
    tl_times: "{n}×",
    tl_longest: "Apertura más larga",
    tl_alarm_at: "Alarma: {state}",
    tl_last: "última actividad {ago}",
    tl_no_activity: "Sin actividad",
    tl_n_sensors: "Sensores: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 días",
    tl_armed: "Alarma armada",
    tl_marks: "Retardo / disparo",
    tl_by_room: "Actividad por estancia",
    tl_by_type: "Actividad por tipo de sensor",
    tl_by_sensor: "Actividad por sensor",
    g_room: "Por estancia",
    g_type: "Por tipo",
    g_none: "Sin agrupar",
    so_label: "Orden",
    so_recent: "Actividad reciente",
    so_count: "Más activos",
    so_name: "Nombre",
    tl_no_history: "Sin historial en este periodo: ¿está activo el registro?",
    tl_duration: "Duración: {d}",
  },
  it: {
    title: "Allarme",
    t_general: "Generale",
    t_sensors: "Sensori",
    t_codes: "Codici",
    t_actions: "Azioni",
    t_settings: "Impostazioni",
    loading: "Caricamento…",
    no_alarmo: "Alarmo non è installato",
    no_alarmo_hint: "Questo pannello configura Alarmo. Installa Alarmo dal Marketplace, aggiungilo in Impostazioni → Dispositivi e servizi, poi torna qui.",
    saved: "Salvato",
    error: "Impossibile salvare: {error}",
    save: "Salva",
    cancel: "Annulla",
    delete: "Elimina",
    remove: "Rimuovi",
    add: "Aggiungi",
    test: "Prova",
    confirm_delete: "Eliminare «{name}»?",
    none: "Nessuno",
    all_areas: "Tutte le aree",
    search: "Cerca",
    sec: "s",
    s_disarmed: "Disinserito",
    s_armed_home: "Inserito in casa",
    s_armed_away: "Inserito fuori casa",
    s_armed_night: "Inserito notte",
    s_armed_vacation: "Inserito vacanza",
    s_armed_custom_bypass: "Inserito personalizzato",
    s_arming: "Ritardo di uscita",
    s_pending: "Ritardo di ingresso",
    s_triggered: "Scattato",
    s_disarming: "Disinserimento",
    s_unavailable: "Non disponibile",
    sub_ready: "{n} sensori pronti",
    sub_blocking: "Non pronto: {names}",
    sub_since: "Dalle {time}",
    sub_triggered: "Causa: {names}",
    sub_none: "Nessun allarme trovato",
    m_disarm: "Disinserisci",
    m_armed_home: "In casa",
    m_armed_away: "Fuori casa",
    m_armed_night: "Notte",
    m_armed_vacation: "Vacanza",
    m_armed_custom_bypass: "Personalizzato",
    code_title: "Codice",
    code_hint: "Inserisci il codice per continuare",
    modes: "Modalità",
    modes_hint: "Le modalità attive compaiono sulle schede e nei comandi; ognuna ha i suoi ritardi.",
    mode_off: "Disattivata",
    mode_line: "Uscita {exit} · Ingresso {entry} · Allarme {trigger}",
    unlimited: "illimitato",
    exit_time: "Ritardo di uscita",
    exit_time_hint: "Tempo per uscire una volta inserito l'allarme",
    entry_time: "Ritardo di ingresso",
    entry_time_hint: "Tempo per disinserire dopo un rilevamento",
    trigger_time: "Durata dell'allarme",
    trigger_time_hint: "0 = nessun limite",
    areas: "Aree",
    add_area: "Aggiungi un'area",
    area_name: "Nome",
    area_line: "{n} sensori",
    delete_area: "Elimina l'area",
    behaviour: "Comportamento",
    master: "Allarme principale",
    master_hint: "Un'entità che controlla tutte le aree insieme",
    master_name: "Nome dell'allarme principale",
    disarm_after_trigger: "Disinserisci dopo lo scatto",
    disarm_after_trigger_hint: "Altrimenti l'allarme torna nella modalità precedente",
    ignore_blocking: "Ignora i sensori bloccanti dopo lo scatto",
    ignore_blocking_hint: "Si reinserisce anche con sensori ancora aperti",
    mqtt: "MQTT",
    mqtt_hint: "Pubblica lo stato e accetta comandi (tastierini, pannelli a muro).",
    state_topic: "Topic di stato",
    command_topic: "Topic di comando",
    event_topic: "Topic degli eventi",
    require_code: "Codice richiesto",
    require_code_hint: "Per i comandi MQTT",
    sensors: "Sensori",
    no_sensors: "Ancora nessun sensore: aggiungine qui sotto.",
    st_ready: "Pronto",
    st_open: "Impedisce l'inserimento",
    st_bypassed: "Escluso",
    st_unavailable: "Non disponibile",
    st_disabled: "Disattivato",
    st_open_ok: "Aperto consentito",
    on: "Aperto",
    off: "Chiuso",
    type: "Tipo",
    ty_door: "Porta",
    ty_window: "Finestra",
    ty_motion: "Movimento",
    ty_tamper: "Manomissione",
    ty_environmental: "Ambientale",
    ty_other: "Altro",
    area: "Area",
    group: "Gruppo",
    sensor_modes: "Modalità",
    sensor_modes_hint: "Il sensore sorveglia in queste modalità",
    use_exit_delay: "Usa il ritardo di uscita",
    use_entry_delay: "Usa il ritardo di ingresso",
    use_entry_delay_hint: "Altrimenti scatta subito",
    arm_on_close: "Inserisci alla chiusura",
    arm_on_close_hint: "Inserisce quando il sensore si chiude durante il ritardo di uscita",
    allow_open: "Consenti aperto all'inserimento",
    auto_bypass: "Escludi automaticamente",
    auto_bypass_hint: "Se è aperto all'inserimento",
    trigger_unavailable: "Scatta se non disponibile",
    always_on: "Sempre attivo",
    always_on_hint: "Anche disinserito (fumo, acqua)",
    f_immediate: "Immediato",
    f_entry: "Ritardo di ingresso",
    f_always: "Sempre attivo",
    f_bypass: "Esclusione auto",
    f_unavailable: "Scatta se non disponibile",
    add_sensors: "Aggiungi sensori",
    add_sensors_hint: "Entità non ancora usate dall'allarme.",
    add_n: "Aggiungi ({n})",
    no_candidates: "Tutti i sensori sono già nell'allarme.",
    groups: "Gruppi di sensori",
    groups_hint: "Scatta solo se più sensori del gruppo rilevano nella finestra di tempo.",
    new_group: "Nuovo gruppo",
    group_line: "{events} eventi in {timeout} s · {n} sensori",
    event_count: "Eventi",
    timeout: "Finestra di tempo",
    group_sensors: "Sensori",
    code_usage: "Uso dei codici",
    code_arm_required: "Codice per inserire",
    code_disarm_required: "Codice per disinserire",
    code_mode_change_required: "Codice per cambiare modalità",
    code_mode_change_hint: "Inserito → altra modalità",
    code_format: "Formato del codice",
    code_format_hint: "Tastierino numerico o testo libero",
    cf_number: "Numerico",
    cf_text: "Testo",
    users: "Utenti",
    new_user: "Nuovo utente",
    user_name: "Nome",
    code: "Codice",
    code_keep: "Lascia vuoto per mantenerlo",
    old_code: "Codice attuale",
    can_arm: "Può inserire",
    can_disarm: "Può disinserire",
    is_override_code: "Codice prioritario",
    is_override_code_hint: "Inserisce anche con sensori aperti",
    area_limit: "Aree",
    area_limit_hint: "Nessuna selezionata: tutte le aree",
    u_arm_disarm: "Inserisce e disinserisce",
    u_arm: "Solo inserisce",
    u_disarm: "Solo disinserisce",
    u_none: "Nessun diritto",
    u_override: "Prioritario",
    notifications: "Notifiche",
    new_notification: "Nuova notifica",
    actions: "Azioni",
    new_action: "Nuova azione",
    no_notifications: "Ancora nessuna notifica.",
    no_actions: "Ancora nessuna azione.",
    name: "Nome",
    event: "Evento",
    ev_armed: "Inserito",
    ev_disarmed: "Disinserito",
    ev_triggered: "Scattato",
    ev_untriggered: "Non più scattato",
    ev_arm_failure: "Inserimento fallito",
    ev_arming: "Ritardo di uscita avviato",
    ev_pending: "Ritardo di ingresso avviato",
    action_modes: "Modalità",
    action_modes_hint: "Nessuna selezionata: tutte le modalità",
    target: "Destinazione",
    notif_title: "Titolo",
    message: "Messaggio",
    message_hint: "Segnaposto: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entità",
    action: "Azione",
    turn_on: "Accendi",
    turn_off: "Spegni",
    display: "Visualizzazione del pannello",
    panel_title: "Titolo nella barra laterale",
    hide_header: "Nascondi la barra superiore",
    hide_header_hint: "Le schede e il pulsante menu restano",
    hh_off: "Mai",
    hh_non_admin: "Non amministratori",
    hh_all: "Tutti",
    panel_tabs: "Schede mostrate",
    sidebar_badge: "Badge della barra laterale",
    sidebar_badge_hint: "Sensori che impediscono l'inserimento; rosso quando l'allarme è scattato",
    enabled: "Attivo",
    disabled: "Disattivo",
    alarm: "Allarme",
    header_entity: "Allarme mostrato nell'intestazione",
    header_entity_auto: "Automatico (principale di Alarmo)",
    illustration_theme: "Tema dell'illustrazione",
    illustration_theme_hint: "Auto segue il tema di Home Assistant",
    th_auto: "Auto",
    th_day: "Giorno",
    th_night: "Notte",
    admin_note: "Questo pannello è riservato agli amministratori. Alarmo conserva la configurazione: le sue entità, schede e automazioni continuano a funzionare.",
    t_timeline: "Cronologia",
    all_rooms: "Tutte le stanze",
    no_room: "Senza stanza",
    tl_motion: "Movimento",
    tl_clear: "Libero",
    tl_detected: "Rilevato",
    tl_ok: "OK",
    tl_now: "adesso",
    tl_events: "Eventi",
    tl_tracked: "Sensori seguiti: {n}",
    tl_triggers: "Scatti",
    tl_none: "Nessuno",
    tl_calm: "Tutto tranquillo",
    tl_most: "Il più attivo",
    tl_times: "{n}×",
    tl_longest: "Apertura più lunga",
    tl_alarm_at: "Allarme: {state}",
    tl_last: "ultima attività {ago}",
    tl_no_activity: "Nessuna attività",
    tl_n_sensors: "Sensori: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 giorni",
    tl_armed: "Allarme inserito",
    tl_marks: "Ritardo / scatto",
    tl_by_room: "Attività per stanza",
    tl_by_type: "Attività per tipo di sensore",
    tl_by_sensor: "Attività per sensore",
    g_room: "Per stanza",
    g_type: "Per tipo",
    g_none: "Senza raggruppamento",
    so_label: "Ordine",
    so_recent: "Attività recente",
    so_count: "Più attivi",
    so_name: "Nome",
    tl_no_history: "Nessuno storico per questo periodo: il registratore è attivo?",
    tl_duration: "Durata: {d}",
  },
  nl: {
    title: "Alarm",
    t_general: "Algemeen",
    t_sensors: "Sensoren",
    t_codes: "Codes",
    t_actions: "Acties",
    t_settings: "Instellingen",
    loading: "Laden…",
    no_alarmo: "Alarmo is niet geïnstalleerd",
    no_alarmo_hint: "Dit paneel stelt Alarmo in. Installeer Alarmo via de Marketplace, voeg het toe in Instellingen → Apparaten en diensten en kom dan terug.",
    saved: "Opgeslagen",
    error: "Opslaan mislukt: {error}",
    save: "Opslaan",
    cancel: "Annuleren",
    delete: "Verwijderen",
    remove: "Weghalen",
    add: "Toevoegen",
    test: "Testen",
    confirm_delete: "“{name}” verwijderen?",
    none: "Geen",
    all_areas: "Alle gebieden",
    search: "Zoeken",
    sec: "s",
    s_disarmed: "Uitgeschakeld",
    s_armed_home: "Ingeschakeld thuis",
    s_armed_away: "Ingeschakeld afwezig",
    s_armed_night: "Ingeschakeld nacht",
    s_armed_vacation: "Ingeschakeld vakantie",
    s_armed_custom_bypass: "Ingeschakeld aangepast",
    s_arming: "Vertrekvertraging",
    s_pending: "Binnenkomstvertraging",
    s_triggered: "Afgegaan",
    s_disarming: "Uitschakelen",
    s_unavailable: "Niet beschikbaar",
    sub_ready: "{n} sensoren gereed",
    sub_blocking: "Niet gereed: {names}",
    sub_since: "Sinds {time}",
    sub_triggered: "Oorzaak: {names}",
    sub_none: "Geen alarm gevonden",
    m_disarm: "Uitschakelen",
    m_armed_home: "Thuis",
    m_armed_away: "Afwezig",
    m_armed_night: "Nacht",
    m_armed_vacation: "Vakantie",
    m_armed_custom_bypass: "Aangepast",
    code_title: "Code",
    code_hint: "Voer de code in om door te gaan",
    modes: "Modi",
    modes_hint: "De ingeschakelde modi verschijnen op de kaarten en in de opdrachten; elk heeft eigen vertragingen.",
    mode_off: "Uitgeschakeld",
    mode_line: "Vertrek {exit} · Binnenkomst {entry} · Alarm {trigger}",
    unlimited: "onbeperkt",
    exit_time: "Vertrekvertraging",
    exit_time_hint: "Tijd om te vertrekken zodra het alarm is ingeschakeld",
    entry_time: "Binnenkomstvertraging",
    entry_time_hint: "Tijd om uit te schakelen na een detectie",
    trigger_time: "Alarmduur",
    trigger_time_hint: "0 = geen limiet",
    areas: "Gebieden",
    add_area: "Gebied toevoegen",
    area_name: "Naam",
    area_line: "{n} sensoren",
    delete_area: "Gebied verwijderen",
    behaviour: "Gedrag",
    master: "Hoofdalarm",
    master_hint: "Eén entiteit die alle gebieden samen bestuurt",
    master_name: "Naam van het hoofdalarm",
    disarm_after_trigger: "Uitschakelen na afgaan",
    disarm_after_trigger_hint: "Anders keert het alarm terug naar de vorige modus",
    ignore_blocking: "Blokkerende sensoren negeren na afgaan",
    ignore_blocking_hint: "Schakelt opnieuw in, ook als sensoren nog open zijn",
    mqtt: "MQTT",
    mqtt_hint: "Publiceert de status en neemt opdrachten aan (keypads, wandpanelen).",
    state_topic: "Status-topic",
    command_topic: "Opdracht-topic",
    event_topic: "Gebeurtenis-topic",
    require_code: "Code vereist",
    require_code_hint: "Voor MQTT-opdrachten",
    sensors: "Sensoren",
    no_sensors: "Nog geen sensor: voeg er hieronder toe.",
    st_ready: "Gereed",
    st_open: "Houdt inschakelen tegen",
    st_bypassed: "Overbrugd",
    st_unavailable: "Niet beschikbaar",
    st_disabled: "Uitgeschakeld",
    st_open_ok: "Open toegestaan",
    on: "Open",
    off: "Dicht",
    type: "Type",
    ty_door: "Deur",
    ty_window: "Raam",
    ty_motion: "Beweging",
    ty_tamper: "Sabotage",
    ty_environmental: "Omgeving",
    ty_other: "Overig",
    area: "Gebied",
    group: "Groep",
    sensor_modes: "Modi",
    sensor_modes_hint: "De sensor bewaakt in deze modi",
    use_exit_delay: "Vertrekvertraging gebruiken",
    use_entry_delay: "Binnenkomstvertraging gebruiken",
    use_entry_delay_hint: "Anders gaat hij meteen af",
    arm_on_close: "Inschakelen bij sluiten",
    arm_on_close_hint: "Schakelt in wanneer de sensor sluit tijdens de vertrekvertraging",
    allow_open: "Open toestaan bij inschakelen",
    auto_bypass: "Automatisch overbruggen",
    auto_bypass_hint: "Als hij open is bij inschakelen",
    trigger_unavailable: "Afgaan bij onbeschikbaarheid",
    always_on: "Altijd actief",
    always_on_hint: "Ook uitgeschakeld (rook, water)",
    f_immediate: "Direct",
    f_entry: "Binnenkomstvertraging",
    f_always: "Altijd actief",
    f_bypass: "Auto-overbrugging",
    f_unavailable: "Gaat af bij onbeschikbaarheid",
    add_sensors: "Sensoren toevoegen",
    add_sensors_hint: "Entiteiten die het alarm nog niet gebruikt.",
    add_n: "Toevoegen ({n})",
    no_candidates: "Alle sensoren zitten al in het alarm.",
    groups: "Sensorgroepen",
    groups_hint: "Gaat alleen af als meerdere sensoren van de groep binnen het tijdvenster detecteren.",
    new_group: "Nieuwe groep",
    group_line: "{events} gebeurtenissen in {timeout} s · {n} sensoren",
    event_count: "Gebeurtenissen",
    timeout: "Tijdvenster",
    group_sensors: "Sensoren",
    code_usage: "Gebruik van codes",
    code_arm_required: "Code om in te schakelen",
    code_disarm_required: "Code om uit te schakelen",
    code_mode_change_required: "Code om van modus te wisselen",
    code_mode_change_hint: "Ingeschakeld → andere modus",
    code_format: "Codeformaat",
    code_format_hint: "Cijfertoetsen of vrije tekst",
    cf_number: "Cijfers",
    cf_text: "Tekst",
    users: "Gebruikers",
    new_user: "Nieuwe gebruiker",
    user_name: "Naam",
    code: "Code",
    code_keep: "Leeg laten om te behouden",
    old_code: "Huidige code",
    can_arm: "Mag inschakelen",
    can_disarm: "Mag uitschakelen",
    is_override_code: "Overbruggingscode",
    is_override_code_hint: "Schakelt in, ook als sensoren open zijn",
    area_limit: "Gebieden",
    area_limit_hint: "Geen gekozen: alle gebieden",
    u_arm_disarm: "Schakelt in en uit",
    u_arm: "Alleen inschakelen",
    u_disarm: "Alleen uitschakelen",
    u_none: "Geen rechten",
    u_override: "Overbrugging",
    notifications: "Meldingen",
    new_notification: "Nieuwe melding",
    actions: "Acties",
    new_action: "Nieuwe actie",
    no_notifications: "Nog geen melding.",
    no_actions: "Nog geen actie.",
    name: "Naam",
    event: "Gebeurtenis",
    ev_armed: "Ingeschakeld",
    ev_disarmed: "Uitgeschakeld",
    ev_triggered: "Afgegaan",
    ev_untriggered: "Niet meer afgegaan",
    ev_arm_failure: "Inschakelen mislukt",
    ev_arming: "Vertrekvertraging gestart",
    ev_pending: "Binnenkomstvertraging gestart",
    action_modes: "Modi",
    action_modes_hint: "Geen gekozen: alle modi",
    target: "Doel",
    notif_title: "Titel",
    message: "Bericht",
    message_hint: "Plaatshouders: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entiteit",
    action: "Actie",
    turn_on: "Aanzetten",
    turn_off: "Uitzetten",
    display: "Weergave van het paneel",
    panel_title: "Titel in de zijbalk",
    hide_header: "Bovenbalk verbergen",
    hide_header_hint: "De tabbladen en de menuknop blijven",
    hh_off: "Nooit",
    hh_non_admin: "Niet-beheerders",
    hh_all: "Iedereen",
    panel_tabs: "Getoonde tabbladen",
    sidebar_badge: "Badge in de zijbalk",
    sidebar_badge_hint: "Sensoren die het inschakelen tegenhouden; rood als het alarm afgaat",
    enabled: "Aan",
    disabled: "Uit",
    alarm: "Alarm",
    header_entity: "Alarm in de koptekst",
    header_entity_auto: "Automatisch (Alarmo-hoofdalarm)",
    illustration_theme: "Thema van de illustratie",
    illustration_theme_hint: "Auto volgt het thema van Home Assistant",
    th_auto: "Auto",
    th_day: "Dag",
    th_night: "Nacht",
    admin_note: "Dit paneel is voor beheerders. Alarmo bewaart de configuratie: zijn entiteiten, kaarten en automatiseringen blijven werken.",
    t_timeline: "Tijdlijn",
    all_rooms: "Alle ruimtes",
    no_room: "Zonder ruimte",
    tl_motion: "Beweging",
    tl_clear: "Rustig",
    tl_detected: "Gedetecteerd",
    tl_ok: "OK",
    tl_now: "nu",
    tl_events: "Gebeurtenissen",
    tl_tracked: "Gevolgde sensoren: {n}",
    tl_triggers: "Alarmen",
    tl_none: "Geen",
    tl_calm: "Alles rustig",
    tl_most: "Meest actief",
    tl_times: "{n}×",
    tl_longest: "Langste opening",
    tl_alarm_at: "Alarm: {state}",
    tl_last: "laatste activiteit {ago}",
    tl_no_activity: "Geen activiteit",
    tl_n_sensors: "Sensoren: {n}",
    p_6h: "6 u",
    p_24h: "24 u",
    p_3d: "3 dagen",
    tl_armed: "Alarm ingeschakeld",
    tl_marks: "Vertraging / alarm",
    tl_by_room: "Activiteit per ruimte",
    tl_by_type: "Activiteit per sensortype",
    tl_by_sensor: "Activiteit per sensor",
    g_room: "Per ruimte",
    g_type: "Per type",
    g_none: "Niet gegroepeerd",
    so_label: "Sortering",
    so_recent: "Recente activiteit",
    so_count: "Meest actief",
    so_name: "Naam",
    tl_no_history: "Geen geschiedenis voor deze periode: staat de recorder aan?",
    tl_duration: "Duur: {d}",
  },
  pt: {
    title: "Alarme",
    t_general: "Geral",
    t_sensors: "Sensores",
    t_codes: "Códigos",
    t_actions: "Ações",
    t_settings: "Definições",
    loading: "A carregar…",
    no_alarmo: "O Alarmo não está instalado",
    no_alarmo_hint: "Este painel configura o Alarmo. Instale o Alarmo a partir do Marketplace, adicione-o em Definições → Dispositivos e serviços e volte.",
    saved: "Guardado",
    error: "Não foi possível guardar: {error}",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    remove: "Retirar",
    add: "Adicionar",
    test: "Experimentar",
    confirm_delete: "Eliminar «{name}»?",
    none: "Nenhum",
    all_areas: "Todas as zonas",
    search: "Pesquisar",
    sec: "s",
    s_disarmed: "Desarmado",
    s_armed_home: "Armado em casa",
    s_armed_away: "Armado ausente",
    s_armed_night: "Armado noite",
    s_armed_vacation: "Armado férias",
    s_armed_custom_bypass: "Armado personalizado",
    s_arming: "Atraso de saída",
    s_pending: "Atraso de entrada",
    s_triggered: "Disparado",
    s_disarming: "A desarmar",
    s_unavailable: "Indisponível",
    sub_ready: "{n} sensores prontos",
    sub_blocking: "Não pronto: {names}",
    sub_since: "Desde as {time}",
    sub_triggered: "Causa: {names}",
    sub_none: "Nenhum alarme encontrado",
    m_disarm: "Desarmar",
    m_armed_home: "Em casa",
    m_armed_away: "Ausente",
    m_armed_night: "Noite",
    m_armed_vacation: "Férias",
    m_armed_custom_bypass: "Personalizado",
    code_title: "Código",
    code_hint: "Introduza o código para continuar",
    modes: "Modos",
    modes_hint: "Os modos ativos aparecem nos cartões e nos comandos; cada um tem os seus atrasos.",
    mode_off: "Desativado",
    mode_line: "Saída {exit} · Entrada {entry} · Alarme {trigger}",
    unlimited: "ilimitado",
    exit_time: "Atraso de saída",
    exit_time_hint: "Tempo para sair depois de o alarme estar armado",
    entry_time: "Atraso de entrada",
    entry_time_hint: "Tempo para desarmar após uma deteção",
    trigger_time: "Duração do alarme",
    trigger_time_hint: "0 = sem limite",
    areas: "Zonas",
    add_area: "Adicionar uma zona",
    area_name: "Nome",
    area_line: "{n} sensores",
    delete_area: "Eliminar a zona",
    behaviour: "Comportamento",
    master: "Alarme principal",
    master_hint: "Uma entidade que controla todas as zonas em conjunto",
    master_name: "Nome do alarme principal",
    disarm_after_trigger: "Desarmar após disparar",
    disarm_after_trigger_hint: "Caso contrário, o alarme volta ao modo em que estava",
    ignore_blocking: "Ignorar sensores bloqueantes após disparar",
    ignore_blocking_hint: "Rearma mesmo com sensores ainda abertos",
    mqtt: "MQTT",
    mqtt_hint: "Publica o estado e aceita comandos (teclados, painéis de parede).",
    state_topic: "Tópico de estado",
    command_topic: "Tópico de comando",
    event_topic: "Tópico de eventos",
    require_code: "Código obrigatório",
    require_code_hint: "Para os comandos MQTT",
    sensors: "Sensores",
    no_sensors: "Ainda nenhum sensor: adicione alguns abaixo.",
    st_ready: "Pronto",
    st_open: "Impede o armar",
    st_bypassed: "Ignorado",
    st_unavailable: "Indisponível",
    st_disabled: "Desativado",
    st_open_ok: "Aberto permitido",
    on: "Aberto",
    off: "Fechado",
    type: "Tipo",
    ty_door: "Porta",
    ty_window: "Janela",
    ty_motion: "Movimento",
    ty_tamper: "Sabotagem",
    ty_environmental: "Ambiental",
    ty_other: "Outro",
    area: "Zona",
    group: "Grupo",
    sensor_modes: "Modos",
    sensor_modes_hint: "O sensor vigia nestes modos",
    use_exit_delay: "Usar o atraso de saída",
    use_entry_delay: "Usar o atraso de entrada",
    use_entry_delay_hint: "Caso contrário, dispara de imediato",
    arm_on_close: "Armar ao fechar",
    arm_on_close_hint: "Arma quando o sensor fecha durante o atraso de saída",
    allow_open: "Permitir aberto ao armar",
    auto_bypass: "Ignorar automaticamente",
    auto_bypass_hint: "Se estiver aberto ao armar",
    trigger_unavailable: "Disparar se indisponível",
    always_on: "Sempre ativo",
    always_on_hint: "Mesmo desarmado (fumo, água)",
    f_immediate: "Imediato",
    f_entry: "Atraso de entrada",
    f_always: "Sempre ativo",
    f_bypass: "Ignorar auto",
    f_unavailable: "Dispara se indisponível",
    add_sensors: "Adicionar sensores",
    add_sensors_hint: "Entidades ainda não usadas pelo alarme.",
    add_n: "Adicionar ({n})",
    no_candidates: "Todos os sensores já estão no alarme.",
    groups: "Grupos de sensores",
    groups_hint: "Só dispara se vários sensores do grupo detetarem dentro da janela de tempo.",
    new_group: "Novo grupo",
    group_line: "{events} eventos em {timeout} s · {n} sensores",
    event_count: "Eventos",
    timeout: "Janela de tempo",
    group_sensors: "Sensores",
    code_usage: "Uso dos códigos",
    code_arm_required: "Código para armar",
    code_disarm_required: "Código para desarmar",
    code_mode_change_required: "Código para mudar de modo",
    code_mode_change_hint: "Armado → outro modo",
    code_format: "Formato do código",
    code_format_hint: "Teclado numérico ou texto livre",
    cf_number: "Numérico",
    cf_text: "Texto",
    users: "Utilizadores",
    new_user: "Novo utilizador",
    user_name: "Nome",
    code: "Código",
    code_keep: "Deixe vazio para o manter",
    old_code: "Código atual",
    can_arm: "Pode armar",
    can_disarm: "Pode desarmar",
    is_override_code: "Código prioritário",
    is_override_code_hint: "Arma mesmo com sensores abertos",
    area_limit: "Zonas",
    area_limit_hint: "Nenhuma selecionada: todas as zonas",
    u_arm_disarm: "Arma e desarma",
    u_arm: "Só arma",
    u_disarm: "Só desarma",
    u_none: "Sem permissões",
    u_override: "Prioritário",
    notifications: "Notificações",
    new_notification: "Nova notificação",
    actions: "Ações",
    new_action: "Nova ação",
    no_notifications: "Ainda nenhuma notificação.",
    no_actions: "Ainda nenhuma ação.",
    name: "Nome",
    event: "Evento",
    ev_armed: "Armado",
    ev_disarmed: "Desarmado",
    ev_triggered: "Disparado",
    ev_untriggered: "Já não disparado",
    ev_arm_failure: "Falha ao armar",
    ev_arming: "Atraso de saída iniciado",
    ev_pending: "Atraso de entrada iniciado",
    action_modes: "Modos",
    action_modes_hint: "Nenhum selecionado: todos os modos",
    target: "Destino",
    notif_title: "Título",
    message: "Mensagem",
    message_hint: "Marcadores: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entidade",
    action: "Ação",
    turn_on: "Ligar",
    turn_off: "Desligar",
    display: "Apresentação do painel",
    panel_title: "Título na barra lateral",
    hide_header: "Ocultar a barra superior",
    hide_header_hint: "Os separadores e o botão de menu mantêm-se",
    hh_off: "Nunca",
    hh_non_admin: "Não administradores",
    hh_all: "Todos",
    panel_tabs: "Separadores mostrados",
    sidebar_badge: "Distintivo da barra lateral",
    sidebar_badge_hint: "Sensores que impedem o armar; a vermelho quando o alarme disparou",
    enabled: "Ligado",
    disabled: "Desligado",
    alarm: "Alarme",
    header_entity: "Alarme mostrado no cabeçalho",
    header_entity_auto: "Automático (principal do Alarmo)",
    illustration_theme: "Tema da ilustração",
    illustration_theme_hint: "Auto segue o tema do Home Assistant",
    th_auto: "Auto",
    th_day: "Dia",
    th_night: "Noite",
    admin_note: "Este painel é reservado aos administradores. O Alarmo guarda a configuração: as suas entidades, cartões e automatizações continuam a funcionar.",
    t_timeline: "Cronologia",
    all_rooms: "Todas as divisões",
    no_room: "Sem divisão",
    tl_motion: "Movimento",
    tl_clear: "Livre",
    tl_detected: "Detetado",
    tl_ok: "OK",
    tl_now: "agora",
    tl_events: "Eventos",
    tl_tracked: "Sensores seguidos: {n}",
    tl_triggers: "Disparos",
    tl_none: "Nenhum",
    tl_calm: "Tudo calmo",
    tl_most: "O mais ativo",
    tl_times: "{n}×",
    tl_longest: "Abertura mais longa",
    tl_alarm_at: "Alarme: {state}",
    tl_last: "última atividade {ago}",
    tl_no_activity: "Sem atividade",
    tl_n_sensors: "Sensores: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 dias",
    tl_armed: "Alarme armado",
    tl_marks: "Atraso / disparo",
    tl_by_room: "Atividade por divisão",
    tl_by_type: "Atividade por tipo de sensor",
    tl_by_sensor: "Atividade por sensor",
    g_room: "Por divisão",
    g_type: "Por tipo",
    g_none: "Sem agrupar",
    so_label: "Ordenação",
    so_recent: "Atividade recente",
    so_count: "Mais ativos",
    so_name: "Nome",
    tl_no_history: "Sem histórico neste período: o gravador está ativo?",
    tl_duration: "Duração: {d}",
  },
  pl: {
    title: "Alarm",
    t_general: "Ogólne",
    t_sensors: "Czujniki",
    t_codes: "Kody",
    t_actions: "Akcje",
    t_settings: "Ustawienia",
    loading: "Wczytywanie…",
    no_alarmo: "Alarmo nie jest zainstalowane",
    no_alarmo_hint: "Ten panel konfiguruje Alarmo. Zainstaluj Alarmo z Marketplace, dodaj je w Ustawienia → Urządzenia i usługi, a potem wróć.",
    saved: "Zapisano",
    error: "Nie udało się zapisać: {error}",
    save: "Zapisz",
    cancel: "Anuluj",
    delete: "Usuń",
    remove: "Odłącz",
    add: "Dodaj",
    test: "Wypróbuj",
    confirm_delete: "Usunąć „{name}”?",
    none: "Brak",
    all_areas: "Wszystkie strefy",
    search: "Szukaj",
    sec: "s",
    s_disarmed: "Rozbrojony",
    s_armed_home: "Uzbrojony (dom)",
    s_armed_away: "Uzbrojony (poza domem)",
    s_armed_night: "Uzbrojony (noc)",
    s_armed_vacation: "Uzbrojony (urlop)",
    s_armed_custom_bypass: "Uzbrojony (własny)",
    s_arming: "Czas na wyjście",
    s_pending: "Czas na wejście",
    s_triggered: "Wyzwolony",
    s_disarming: "Rozbrajanie",
    s_unavailable: "Niedostępny",
    sub_ready: "Gotowe czujniki: {n}",
    sub_blocking: "Niegotowy: {names}",
    sub_since: "Od {time}",
    sub_triggered: "Przyczyna: {names}",
    sub_none: "Nie znaleziono alarmu",
    m_disarm: "Rozbrój",
    m_armed_home: "Dom",
    m_armed_away: "Poza domem",
    m_armed_night: "Noc",
    m_armed_vacation: "Urlop",
    m_armed_custom_bypass: "Własny",
    code_title: "Kod",
    code_hint: "Wpisz kod, aby kontynuować",
    modes: "Tryby",
    modes_hint: "Włączone tryby pojawiają się na kartach i w poleceniach; każdy ma własne opóźnienia.",
    mode_off: "Wyłączony",
    mode_line: "Wyjście {exit} · Wejście {entry} · Alarm {trigger}",
    unlimited: "bez limitu",
    exit_time: "Czas na wyjście",
    exit_time_hint: "Czas na wyjście po uzbrojeniu alarmu",
    entry_time: "Czas na wejście",
    entry_time_hint: "Czas na rozbrojenie po wykryciu",
    trigger_time: "Czas trwania alarmu",
    trigger_time_hint: "0 = bez limitu",
    areas: "Strefy",
    add_area: "Dodaj strefę",
    area_name: "Nazwa",
    area_line: "Czujniki: {n}",
    delete_area: "Usuń strefę",
    behaviour: "Zachowanie",
    master: "Alarm główny",
    master_hint: "Jedna encja sterująca wszystkimi strefami naraz",
    master_name: "Nazwa alarmu głównego",
    disarm_after_trigger: "Rozbrój po wyzwoleniu",
    disarm_after_trigger_hint: "W przeciwnym razie alarm wraca do poprzedniego trybu",
    ignore_blocking: "Ignoruj blokujące czujniki po wyzwoleniu",
    ignore_blocking_hint: "Uzbraja ponownie, nawet gdy czujniki są otwarte",
    mqtt: "MQTT",
    mqtt_hint: "Publikuje stan i przyjmuje polecenia (klawiatury, panele ścienne).",
    state_topic: "Temat stanu",
    command_topic: "Temat poleceń",
    event_topic: "Temat zdarzeń",
    require_code: "Wymagany kod",
    require_code_hint: "Dla poleceń MQTT",
    sensors: "Czujniki",
    no_sensors: "Brak czujników: dodaj je poniżej.",
    st_ready: "Gotowy",
    st_open: "Blokuje uzbrojenie",
    st_bypassed: "Pominięty",
    st_unavailable: "Niedostępny",
    st_disabled: "Wyłączony",
    st_open_ok: "Otwarcie dozwolone",
    on: "Otwarty",
    off: "Zamknięty",
    type: "Typ",
    ty_door: "Drzwi",
    ty_window: "Okno",
    ty_motion: "Ruch",
    ty_tamper: "Sabotaż",
    ty_environmental: "Środowisko",
    ty_other: "Inny",
    area: "Strefa",
    group: "Grupa",
    sensor_modes: "Tryby",
    sensor_modes_hint: "Czujnik czuwa w tych trybach",
    use_exit_delay: "Użyj czasu na wyjście",
    use_entry_delay: "Użyj czasu na wejście",
    use_entry_delay_hint: "W przeciwnym razie wyzwala od razu",
    arm_on_close: "Uzbrój po zamknięciu",
    arm_on_close_hint: "Uzbraja, gdy czujnik zamknie się w czasie na wyjście",
    allow_open: "Pozwól na otwarcie przy uzbrajaniu",
    auto_bypass: "Pomijaj automatycznie",
    auto_bypass_hint: "Gdy jest otwarty przy uzbrajaniu",
    trigger_unavailable: "Wyzwalaj, gdy niedostępny",
    always_on: "Zawsze aktywny",
    always_on_hint: "Także rozbrojony (dym, woda)",
    f_immediate: "Natychmiast",
    f_entry: "Czas na wejście",
    f_always: "Zawsze aktywny",
    f_bypass: "Auto-pomijanie",
    f_unavailable: "Wyzwala, gdy niedostępny",
    add_sensors: "Dodaj czujniki",
    add_sensors_hint: "Encje jeszcze nieużywane przez alarm.",
    add_n: "Dodaj ({n})",
    no_candidates: "Wszystkie czujniki są już w alarmie.",
    groups: "Grupy czujników",
    groups_hint: "Wyzwala tylko, gdy kilka czujników grupy wykryje w oknie czasowym.",
    new_group: "Nowa grupa",
    group_line: "Zdarzenia: {events} w {timeout} s · czujniki: {n}",
    event_count: "Zdarzenia",
    timeout: "Okno czasowe",
    group_sensors: "Czujniki",
    code_usage: "Użycie kodów",
    code_arm_required: "Kod do uzbrojenia",
    code_disarm_required: "Kod do rozbrojenia",
    code_mode_change_required: "Kod do zmiany trybu",
    code_mode_change_hint: "Uzbrojony → inny tryb",
    code_format: "Format kodu",
    code_format_hint: "Klawiatura numeryczna lub dowolny tekst",
    cf_number: "Liczbowy",
    cf_text: "Tekst",
    users: "Użytkownicy",
    new_user: "Nowy użytkownik",
    user_name: "Nazwa",
    code: "Kod",
    code_keep: "Zostaw puste, aby zachować",
    old_code: "Obecny kod",
    can_arm: "Może uzbrajać",
    can_disarm: "Może rozbrajać",
    is_override_code: "Kod nadrzędny",
    is_override_code_hint: "Uzbraja nawet przy otwartych czujnikach",
    area_limit: "Strefy",
    area_limit_hint: "Żadna nie wybrana: wszystkie strefy",
    u_arm_disarm: "Uzbraja i rozbraja",
    u_arm: "Tylko uzbraja",
    u_disarm: "Tylko rozbraja",
    u_none: "Brak uprawnień",
    u_override: "Nadrzędny",
    notifications: "Powiadomienia",
    new_notification: "Nowe powiadomienie",
    actions: "Akcje",
    new_action: "Nowa akcja",
    no_notifications: "Brak powiadomień.",
    no_actions: "Brak akcji.",
    name: "Nazwa",
    event: "Zdarzenie",
    ev_armed: "Uzbrojony",
    ev_disarmed: "Rozbrojony",
    ev_triggered: "Wyzwolony",
    ev_untriggered: "Już niewyzwolony",
    ev_arm_failure: "Nieudane uzbrojenie",
    ev_arming: "Rozpoczęto czas na wyjście",
    ev_pending: "Rozpoczęto czas na wejście",
    action_modes: "Tryby",
    action_modes_hint: "Żaden nie wybrany: wszystkie tryby",
    target: "Cel",
    notif_title: "Tytuł",
    message: "Wiadomość",
    message_hint: "Symbole: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Encja",
    action: "Akcja",
    turn_on: "Włącz",
    turn_off: "Wyłącz",
    display: "Wygląd panelu",
    panel_title: "Tytuł na pasku bocznym",
    hide_header: "Ukryj górny pasek",
    hide_header_hint: "Karty i przycisk menu pozostają",
    hh_off: "Nigdy",
    hh_non_admin: "Nieadministratorzy",
    hh_all: "Wszyscy",
    panel_tabs: "Wyświetlane karty",
    sidebar_badge: "Plakietka na pasku bocznym",
    sidebar_badge_hint: "Czujniki blokujące uzbrojenie; czerwona, gdy alarm jest wyzwolony",
    enabled: "Wł.",
    disabled: "Wył.",
    alarm: "Alarm",
    header_entity: "Alarm w nagłówku",
    header_entity_auto: "Automatycznie (główny Alarmo)",
    illustration_theme: "Motyw ilustracji",
    illustration_theme_hint: "Auto podąża za motywem Home Assistant",
    th_auto: "Auto",
    th_day: "Dzień",
    th_night: "Noc",
    admin_note: "Ten panel jest tylko dla administratorów. Alarmo przechowuje konfigurację: jego encje, karty i automatyzacje nadal działają.",
    t_timeline: "Oś czasu",
    all_rooms: "Wszystkie pomieszczenia",
    no_room: "Bez pomieszczenia",
    tl_motion: "Ruch",
    tl_clear: "Spokój",
    tl_detected: "Wykryto",
    tl_ok: "OK",
    tl_now: "teraz",
    tl_events: "Zdarzenia",
    tl_tracked: "Śledzone czujniki: {n}",
    tl_triggers: "Wyzwolenia",
    tl_none: "Brak",
    tl_calm: "Spokojnie",
    tl_most: "Najbardziej aktywny",
    tl_times: "{n}×",
    tl_longest: "Najdłuższe otwarcie",
    tl_alarm_at: "Alarm: {state}",
    tl_last: "ostatnia aktywność {ago}",
    tl_no_activity: "Brak aktywności",
    tl_n_sensors: "Czujniki: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 dni",
    tl_armed: "Alarm uzbrojony",
    tl_marks: "Opóźnienie / wyzwolenie",
    tl_by_room: "Aktywność według pomieszczeń",
    tl_by_type: "Aktywność według typu czujnika",
    tl_by_sensor: "Aktywność według czujnika",
    g_room: "Według pomieszczeń",
    g_type: "Według typu",
    g_none: "Bez grupowania",
    so_label: "Sortowanie",
    so_recent: "Ostatnia aktywność",
    so_count: "Najbardziej aktywne",
    so_name: "Nazwa",
    tl_no_history: "Brak historii w tym okresie: czy rejestrator jest włączony?",
    tl_duration: "Czas trwania: {d}",
  },
  sr: {
    title: "Аларм",
    t_general: "Опште",
    t_sensors: "Сензори",
    t_codes: "Кодови",
    t_actions: "Акције",
    t_settings: "Подешавања",
    loading: "Учитавање…",
    no_alarmo: "Alarmo није инсталиран",
    no_alarmo_hint: "Овај панел подешава Alarmo. Инсталирајте Alarmo из Marketplace-а, додајте га у Подешавања → Уређаји и услуге, па се вратите.",
    saved: "Сачувано",
    error: "Чување није успело: {error}",
    save: "Сачувај",
    cancel: "Откажи",
    delete: "Обриши",
    remove: "Уклони",
    add: "Додај",
    test: "Испробај",
    confirm_delete: "Обрисати „{name}”?",
    none: "Ништа",
    all_areas: "Све зоне",
    search: "Претрага",
    sec: "s",
    s_disarmed: "Искључен",
    s_armed_home: "Укључен (кућа)",
    s_armed_away: "Укључен (одсутни)",
    s_armed_night: "Укључен (ноћ)",
    s_armed_vacation: "Укључен (одмор)",
    s_armed_custom_bypass: "Укључен (прилагођено)",
    s_arming: "Кашњење за излазак",
    s_pending: "Кашњење за улазак",
    s_triggered: "Активиран",
    s_disarming: "Искључивање",
    s_unavailable: "Недоступан",
    sub_ready: "Спремни сензори: {n}",
    sub_blocking: "Није спреман: {names}",
    sub_since: "Од {time}",
    sub_triggered: "Узрок: {names}",
    sub_none: "Аларм није пронађен",
    m_disarm: "Искључи",
    m_armed_home: "Кућа",
    m_armed_away: "Одсутни",
    m_armed_night: "Ноћ",
    m_armed_vacation: "Одмор",
    m_armed_custom_bypass: "Прилагођено",
    code_title: "Код",
    code_hint: "Унесите код да наставите",
    modes: "Режими",
    modes_hint: "Укључени режими се приказују на картицама и у командама; сваки има своја кашњења.",
    mode_off: "Искључен",
    mode_line: "Излазак {exit} · Улазак {entry} · Аларм {trigger}",
    unlimited: "неограничено",
    exit_time: "Кашњење за излазак",
    exit_time_hint: "Време за излазак када се аларм укључи",
    entry_time: "Кашњење за улазак",
    entry_time_hint: "Време за искључивање после детекције",
    trigger_time: "Трајање аларма",
    trigger_time_hint: "0 = без ограничења",
    areas: "Зоне",
    add_area: "Додај зону",
    area_name: "Назив",
    area_line: "Сензори: {n}",
    delete_area: "Обриши зону",
    behaviour: "Понашање",
    master: "Главни аларм",
    master_hint: "Један ентитет који заједно управља свим зонама",
    master_name: "Назив главног аларма",
    disarm_after_trigger: "Искључи после активирања",
    disarm_after_trigger_hint: "Иначе се аларм враћа у претходни режим",
    ignore_blocking: "Занемари блокирајуће сензоре после активирања",
    ignore_blocking_hint: "Поново се укључује и када су сензори отворени",
    mqtt: "MQTT",
    mqtt_hint: "Објављује стање и прима команде (тастатуре, зидни панели).",
    state_topic: "Тема стања",
    command_topic: "Тема команди",
    event_topic: "Тема догађаја",
    require_code: "Код је обавезан",
    require_code_hint: "За MQTT команде",
    sensors: "Сензори",
    no_sensors: "Још нема сензора: додајте их испод.",
    st_ready: "Спреман",
    st_open: "Спречава укључивање",
    st_bypassed: "Заобиђен",
    st_unavailable: "Недоступан",
    st_disabled: "Искључен",
    st_open_ok: "Отворено дозвољено",
    on: "Отворено",
    off: "Затворено",
    type: "Тип",
    ty_door: "Врата",
    ty_window: "Прозор",
    ty_motion: "Покрет",
    ty_tamper: "Саботажа",
    ty_environmental: "Окружење",
    ty_other: "Остало",
    area: "Зона",
    group: "Група",
    sensor_modes: "Режими",
    sensor_modes_hint: "Сензор надгледа у овим режимима",
    use_exit_delay: "Користи кашњење за излазак",
    use_entry_delay: "Користи кашњење за улазак",
    use_entry_delay_hint: "Иначе се активира одмах",
    arm_on_close: "Укључи при затварању",
    arm_on_close_hint: "Укључује када се сензор затвори током кашњења за излазак",
    allow_open: "Дозволи отворено при укључивању",
    auto_bypass: "Аутоматски заобиђи",
    auto_bypass_hint: "Ако је отворен при укључивању",
    trigger_unavailable: "Активирај ако је недоступан",
    always_on: "Увек активан",
    always_on_hint: "И када је искључен (дим, вода)",
    f_immediate: "Одмах",
    f_entry: "Кашњење за улазак",
    f_always: "Увек активан",
    f_bypass: "Ауто заобилажење",
    f_unavailable: "Активира се ако је недоступан",
    add_sensors: "Додај сензоре",
    add_sensors_hint: "Ентитети које аларм још не користи.",
    add_n: "Додај ({n})",
    no_candidates: "Сви сензори су већ у аларму.",
    groups: "Групе сензора",
    groups_hint: "Активира се само ако више сензора групе открије у временском прозору.",
    new_group: "Нова група",
    group_line: "Догађаји: {events} за {timeout} s · сензори: {n}",
    event_count: "Догађаји",
    timeout: "Временски прозор",
    group_sensors: "Сензори",
    code_usage: "Употреба кодова",
    code_arm_required: "Код за укључивање",
    code_disarm_required: "Код за искључивање",
    code_mode_change_required: "Код за промену режима",
    code_mode_change_hint: "Укључен → други режим",
    code_format: "Формат кода",
    code_format_hint: "Нумеричка тастатура или слободан текст",
    cf_number: "Бројеви",
    cf_text: "Текст",
    users: "Корисници",
    new_user: "Нови корисник",
    user_name: "Име",
    code: "Код",
    code_keep: "Оставите празно да задржите",
    old_code: "Тренутни код",
    can_arm: "Може да укључи",
    can_disarm: "Може да искључи",
    is_override_code: "Приоритетни код",
    is_override_code_hint: "Укључује и када су сензори отворени",
    area_limit: "Зоне",
    area_limit_hint: "Ниједна изабрана: све зоне",
    u_arm_disarm: "Укључује и искључује",
    u_arm: "Само укључује",
    u_disarm: "Само искључује",
    u_none: "Без права",
    u_override: "Приоритетни",
    notifications: "Обавештења",
    new_notification: "Ново обавештење",
    actions: "Акције",
    new_action: "Нова акција",
    no_notifications: "Још нема обавештења.",
    no_actions: "Још нема акција.",
    name: "Назив",
    event: "Догађај",
    ev_armed: "Укључен",
    ev_disarmed: "Искључен",
    ev_triggered: "Активиран",
    ev_untriggered: "Више није активиран",
    ev_arm_failure: "Укључивање није успело",
    ev_arming: "Почело кашњење за излазак",
    ev_pending: "Почело кашњење за улазак",
    action_modes: "Режими",
    action_modes_hint: "Ниједан изабран: сви режими",
    target: "Одредиште",
    notif_title: "Наслов",
    message: "Порука",
    message_hint: "Ознаке: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Ентитет",
    action: "Акција",
    turn_on: "Укључи",
    turn_off: "Искључи",
    display: "Приказ панела",
    panel_title: "Наслов у бочној траци",
    hide_header: "Сакриј горњу траку",
    hide_header_hint: "Картице и дугме менија остају",
    hh_off: "Никад",
    hh_non_admin: "Не-администратори",
    hh_all: "Сви",
    panel_tabs: "Приказане картице",
    sidebar_badge: "Значка у бочној траци",
    sidebar_badge_hint: "Сензори који спречавају укључивање; црвена када је аларм активиран",
    enabled: "Укључено",
    disabled: "Искључено",
    alarm: "Аларм",
    header_entity: "Аларм приказан у заглављу",
    header_entity_auto: "Аутоматски (главни Alarmo)",
    illustration_theme: "Тема илустрације",
    illustration_theme_hint: "Ауто прати тему Home Assistant",
    th_auto: "Ауто",
    th_day: "Дан",
    th_night: "Ноћ",
    admin_note: "Овај панел је намењен администраторима. Alarmo чува подешавања: његови ентитети, картице и аутоматизације и даље раде.",
    t_timeline: "Временска линија",
    all_rooms: "Све просторије",
    no_room: "Без просторије",
    tl_motion: "Покрет",
    tl_clear: "Мирно",
    tl_detected: "Откривено",
    tl_ok: "ОК",
    tl_now: "сада",
    tl_events: "Догађаји",
    tl_tracked: "Праћени сензори: {n}",
    tl_triggers: "Активирања",
    tl_none: "Нема",
    tl_calm: "Све је мирно",
    tl_most: "Најактивнији",
    tl_times: "{n}×",
    tl_longest: "Најдуже отварање",
    tl_alarm_at: "Аларм: {state}",
    tl_last: "последња активност {ago}",
    tl_no_activity: "Нема активности",
    tl_n_sensors: "Сензори: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 дана",
    tl_armed: "Аларм укључен",
    tl_marks: "Кашњење / активирање",
    tl_by_room: "Активност по просторији",
    tl_by_type: "Активност по типу сензора",
    tl_by_sensor: "Активност по сензору",
    g_room: "По просторији",
    g_type: "По типу",
    g_none: "Без груписања",
    so_label: "Редослед",
    so_recent: "Недавна активност",
    so_count: "Најактивнији",
    so_name: "Назив",
    tl_no_history: "Нема историје за овај период: да ли је снимач укључен?",
    tl_duration: "Трајање: {d}",
  },
  "sr-Latn": {
    title: "Alarm",
    t_general: "Opšte",
    t_sensors: "Senzori",
    t_codes: "Kodovi",
    t_actions: "Akcije",
    t_settings: "Podešavanja",
    loading: "Učitavanje…",
    no_alarmo: "Alarmo nije instaliran",
    no_alarmo_hint: "Ovaj panel podešava Alarmo. Instalirajte Alarmo iz Marketplace-a, dodajte ga u Podešavanja → Uređaji i usluge, pa se vratite.",
    saved: "Sačuvano",
    error: "Čuvanje nije uspelo: {error}",
    save: "Sačuvaj",
    cancel: "Otkaži",
    delete: "Obriši",
    remove: "Ukloni",
    add: "Dodaj",
    test: "Isprobaj",
    confirm_delete: "Obrisati „{name}”?",
    none: "Ništa",
    all_areas: "Sve zone",
    search: "Pretraga",
    sec: "s",
    s_disarmed: "Isključen",
    s_armed_home: "Uključen (kuća)",
    s_armed_away: "Uključen (odsutni)",
    s_armed_night: "Uključen (noć)",
    s_armed_vacation: "Uključen (odmor)",
    s_armed_custom_bypass: "Uključen (prilagođeno)",
    s_arming: "Kašnjenje za izlazak",
    s_pending: "Kašnjenje za ulazak",
    s_triggered: "Aktiviran",
    s_disarming: "Isključivanje",
    s_unavailable: "Nedostupan",
    sub_ready: "Spremni senzori: {n}",
    sub_blocking: "Nije spreman: {names}",
    sub_since: "Od {time}",
    sub_triggered: "Uzrok: {names}",
    sub_none: "Alarm nije pronađen",
    m_disarm: "Isključi",
    m_armed_home: "Kuća",
    m_armed_away: "Odsutni",
    m_armed_night: "Noć",
    m_armed_vacation: "Odmor",
    m_armed_custom_bypass: "Prilagođeno",
    code_title: "Kod",
    code_hint: "Unesite kod da nastavite",
    modes: "Režimi",
    modes_hint: "Uključeni režimi se prikazuju na karticama i u komandama; svaki ima svoja kašnjenja.",
    mode_off: "Isključen",
    mode_line: "Izlazak {exit} · Ulazak {entry} · Alarm {trigger}",
    unlimited: "neograničeno",
    exit_time: "Kašnjenje za izlazak",
    exit_time_hint: "Vreme za izlazak kada se alarm uključi",
    entry_time: "Kašnjenje za ulazak",
    entry_time_hint: "Vreme za isključivanje posle detekcije",
    trigger_time: "Trajanje alarma",
    trigger_time_hint: "0 = bez ograničenja",
    areas: "Zone",
    add_area: "Dodaj zonu",
    area_name: "Naziv",
    area_line: "Senzori: {n}",
    delete_area: "Obriši zonu",
    behaviour: "Ponašanje",
    master: "Glavni alarm",
    master_hint: "Jedan entitet koji zajedno upravlja svim zonama",
    master_name: "Naziv glavnog alarma",
    disarm_after_trigger: "Isključi posle aktiviranja",
    disarm_after_trigger_hint: "Inače se alarm vraća u prethodni režim",
    ignore_blocking: "Zanemari blokirajuće senzore posle aktiviranja",
    ignore_blocking_hint: "Ponovo se uključuje i kada su senzori otvoreni",
    mqtt: "MQTT",
    mqtt_hint: "Objavljuje stanje i prima komande (tastature, zidni paneli).",
    state_topic: "Tema stanja",
    command_topic: "Tema komandi",
    event_topic: "Tema događaja",
    require_code: "Kod je obavezan",
    require_code_hint: "Za MQTT komande",
    sensors: "Senzori",
    no_sensors: "Još nema senzora: dodajte ih ispod.",
    st_ready: "Spreman",
    st_open: "Sprečava uključivanje",
    st_bypassed: "Zaobiđen",
    st_unavailable: "Nedostupan",
    st_disabled: "Isključen",
    st_open_ok: "Otvoreno dozvoljeno",
    on: "Otvoreno",
    off: "Zatvoreno",
    type: "Tip",
    ty_door: "Vrata",
    ty_window: "Prozor",
    ty_motion: "Pokret",
    ty_tamper: "Sabotaža",
    ty_environmental: "Okruženje",
    ty_other: "Ostalo",
    area: "Zona",
    group: "Grupa",
    sensor_modes: "Režimi",
    sensor_modes_hint: "Senzor nadgleda u ovim režimima",
    use_exit_delay: "Koristi kašnjenje za izlazak",
    use_entry_delay: "Koristi kašnjenje za ulazak",
    use_entry_delay_hint: "Inače se aktivira odmah",
    arm_on_close: "Uključi pri zatvaranju",
    arm_on_close_hint: "Uključuje kada se senzor zatvori tokom kašnjenja za izlazak",
    allow_open: "Dozvoli otvoreno pri uključivanju",
    auto_bypass: "Automatski zaobiđi",
    auto_bypass_hint: "Ako je otvoren pri uključivanju",
    trigger_unavailable: "Aktiviraj ako je nedostupan",
    always_on: "Uvek aktivan",
    always_on_hint: "I kada je isključen (dim, voda)",
    f_immediate: "Odmah",
    f_entry: "Kašnjenje za ulazak",
    f_always: "Uvek aktivan",
    f_bypass: "Auto zaobilaženje",
    f_unavailable: "Aktivira se ako je nedostupan",
    add_sensors: "Dodaj senzore",
    add_sensors_hint: "Entiteti koje alarm još ne koristi.",
    add_n: "Dodaj ({n})",
    no_candidates: "Svi senzori su već u alarmu.",
    groups: "Grupe senzora",
    groups_hint: "Aktivira se samo ako više senzora grupe otkrije u vremenskom prozoru.",
    new_group: "Nova grupa",
    group_line: "Događaji: {events} za {timeout} s · senzori: {n}",
    event_count: "Događaji",
    timeout: "Vremenski prozor",
    group_sensors: "Senzori",
    code_usage: "Upotreba kodova",
    code_arm_required: "Kod za uključivanje",
    code_disarm_required: "Kod za isključivanje",
    code_mode_change_required: "Kod za promenu režima",
    code_mode_change_hint: "Uključen → drugi režim",
    code_format: "Format koda",
    code_format_hint: "Numerička tastatura ili slobodan tekst",
    cf_number: "Brojevi",
    cf_text: "Tekst",
    users: "Korisnici",
    new_user: "Novi korisnik",
    user_name: "Ime",
    code: "Kod",
    code_keep: "Ostavite prazno da zadržite",
    old_code: "Trenutni kod",
    can_arm: "Može da uključi",
    can_disarm: "Može da isključi",
    is_override_code: "Prioritetni kod",
    is_override_code_hint: "Uključuje i kada su senzori otvoreni",
    area_limit: "Zone",
    area_limit_hint: "Nijedna izabrana: sve zone",
    u_arm_disarm: "Uključuje i isključuje",
    u_arm: "Samo uključuje",
    u_disarm: "Samo isključuje",
    u_none: "Bez prava",
    u_override: "Prioritetni",
    notifications: "Obaveštenja",
    new_notification: "Novo obaveštenje",
    actions: "Akcije",
    new_action: "Nova akcija",
    no_notifications: "Još nema obaveštenja.",
    no_actions: "Još nema akcija.",
    name: "Naziv",
    event: "Događaj",
    ev_armed: "Uključen",
    ev_disarmed: "Isključen",
    ev_triggered: "Aktiviran",
    ev_untriggered: "Više nije aktiviran",
    ev_arm_failure: "Uključivanje nije uspelo",
    ev_arming: "Počelo kašnjenje za izlazak",
    ev_pending: "Počelo kašnjenje za ulazak",
    action_modes: "Režimi",
    action_modes_hint: "Nijedan izabran: svi režimi",
    target: "Odredište",
    notif_title: "Naslov",
    message: "Poruka",
    message_hint: "Oznake: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entitet",
    action: "Akcija",
    turn_on: "Uključi",
    turn_off: "Isključi",
    display: "Prikaz panela",
    panel_title: "Naslov u bočnoj traci",
    hide_header: "Sakrij gornju traku",
    hide_header_hint: "Kartice i dugme menija ostaju",
    hh_off: "Nikad",
    hh_non_admin: "Ne-administratori",
    hh_all: "Svi",
    panel_tabs: "Prikazane kartice",
    sidebar_badge: "Značka u bočnoj traci",
    sidebar_badge_hint: "Senzori koji sprečavaju uključivanje; crvena kada je alarm aktiviran",
    enabled: "Uključeno",
    disabled: "Isključeno",
    alarm: "Alarm",
    header_entity: "Alarm prikazan u zaglavlju",
    header_entity_auto: "Automatski (glavni Alarmo)",
    illustration_theme: "Tema ilustracije",
    illustration_theme_hint: "Auto prati temu Home Assistant",
    th_auto: "Auto",
    th_day: "Dan",
    th_night: "Noć",
    admin_note: "Ovaj panel je namenjen administratorima. Alarmo čuva podešavanja: njegovi entiteti, kartice i automatizacije i dalje rade.",
    t_timeline: "Vremenska linija",
    all_rooms: "Sve prostorije",
    no_room: "Bez prostorije",
    tl_motion: "Pokret",
    tl_clear: "Mirno",
    tl_detected: "Otkriveno",
    tl_ok: "OK",
    tl_now: "sada",
    tl_events: "Događaji",
    tl_tracked: "Praćeni senzori: {n}",
    tl_triggers: "Aktiviranja",
    tl_none: "Nema",
    tl_calm: "Sve je mirno",
    tl_most: "Najaktivniji",
    tl_times: "{n}×",
    tl_longest: "Najduže otvaranje",
    tl_alarm_at: "Alarm: {state}",
    tl_last: "poslednja aktivnost {ago}",
    tl_no_activity: "Nema aktivnosti",
    tl_n_sensors: "Senzori: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 dana",
    tl_armed: "Alarm uključen",
    tl_marks: "Kašnjenje / aktiviranje",
    tl_by_room: "Aktivnost po prostoriji",
    tl_by_type: "Aktivnost po tipu senzora",
    tl_by_sensor: "Aktivnost po senzoru",
    g_room: "Po prostoriji",
    g_type: "Po tipu",
    g_none: "Bez grupisanja",
    so_label: "Redosled",
    so_recent: "Nedavna aktivnost",
    so_count: "Najaktivniji",
    so_name: "Naziv",
    tl_no_history: "Nema istorije za ovaj period: da li je snimač uključen?",
    tl_duration: "Trajanje: {d}",
  },
  ro: {
    title: "Alarmă",
    t_general: "General",
    t_sensors: "Senzori",
    t_codes: "Coduri",
    t_actions: "Acțiuni",
    t_settings: "Setări",
    loading: "Se încarcă…",
    no_alarmo: "Alarmo nu este instalat",
    no_alarmo_hint: "Acest panou configurează Alarmo. Instalează Alarmo din Marketplace, adaugă-l în Setări → Dispozitive și servicii, apoi revino.",
    saved: "Salvat",
    error: "Nu s-a putut salva: {error}",
    save: "Salvează",
    cancel: "Anulează",
    delete: "Șterge",
    remove: "Elimină",
    add: "Adaugă",
    test: "Încearcă",
    confirm_delete: "Ștergi „{name}”?",
    none: "Niciunul",
    all_areas: "Toate zonele",
    search: "Caută",
    sec: "s",
    s_disarmed: "Dezarmată",
    s_armed_home: "Armată acasă",
    s_armed_away: "Armată plecat",
    s_armed_night: "Armată noapte",
    s_armed_vacation: "Armată vacanță",
    s_armed_custom_bypass: "Armată personalizat",
    s_arming: "Întârziere la ieșire",
    s_pending: "Întârziere la intrare",
    s_triggered: "Declanșată",
    s_disarming: "Se dezarmează",
    s_unavailable: "Indisponibilă",
    sub_ready: "Senzori pregătiți: {n}",
    sub_blocking: "Nepregătită: {names}",
    sub_since: "De la {time}",
    sub_triggered: "Cauză: {names}",
    sub_none: "Nicio alarmă găsită",
    m_disarm: "Dezarmează",
    m_armed_home: "Acasă",
    m_armed_away: "Plecat",
    m_armed_night: "Noapte",
    m_armed_vacation: "Vacanță",
    m_armed_custom_bypass: "Personalizat",
    code_title: "Cod",
    code_hint: "Introdu codul pentru a continua",
    modes: "Moduri",
    modes_hint: "Modurile activate apar pe carduri și în comenzi; fiecare are propriile întârzieri.",
    mode_off: "Dezactivat",
    mode_line: "Ieșire {exit} · Intrare {entry} · Alarmă {trigger}",
    unlimited: "nelimitat",
    exit_time: "Întârziere la ieșire",
    exit_time_hint: "Timp pentru a pleca după armarea alarmei",
    entry_time: "Întârziere la intrare",
    entry_time_hint: "Timp pentru dezarmare după o detecție",
    trigger_time: "Durata alarmei",
    trigger_time_hint: "0 = fără limită",
    areas: "Zone",
    add_area: "Adaugă o zonă",
    area_name: "Nume",
    area_line: "Senzori: {n}",
    delete_area: "Șterge zona",
    behaviour: "Comportament",
    master: "Alarmă principală",
    master_hint: "O entitate care controlează toate zonele împreună",
    master_name: "Numele alarmei principale",
    disarm_after_trigger: "Dezarmează după declanșare",
    disarm_after_trigger_hint: "Altfel alarma revine în modul anterior",
    ignore_blocking: "Ignoră senzorii care blochează după declanșare",
    ignore_blocking_hint: "Se rearmează chiar dacă senzorii sunt încă deschiși",
    mqtt: "MQTT",
    mqtt_hint: "Publică starea și acceptă comenzi (tastaturi, panouri de perete).",
    state_topic: "Subiect de stare",
    command_topic: "Subiect de comandă",
    event_topic: "Subiect de evenimente",
    require_code: "Cod necesar",
    require_code_hint: "Pentru comenzile MQTT",
    sensors: "Senzori",
    no_sensors: "Niciun senzor încă: adaugă mai jos.",
    st_ready: "Pregătit",
    st_open: "Împiedică armarea",
    st_bypassed: "Ocolit",
    st_unavailable: "Indisponibil",
    st_disabled: "Dezactivat",
    st_open_ok: "Deschis permis",
    on: "Deschis",
    off: "Închis",
    type: "Tip",
    ty_door: "Ușă",
    ty_window: "Fereastră",
    ty_motion: "Mișcare",
    ty_tamper: "Sabotaj",
    ty_environmental: "Mediu",
    ty_other: "Altul",
    area: "Zonă",
    group: "Grup",
    sensor_modes: "Moduri",
    sensor_modes_hint: "Senzorul supraveghează în aceste moduri",
    use_exit_delay: "Folosește întârzierea la ieșire",
    use_entry_delay: "Folosește întârzierea la intrare",
    use_entry_delay_hint: "Altfel declanșează imediat",
    arm_on_close: "Armează la închidere",
    arm_on_close_hint: "Armează când senzorul se închide în timpul întârzierii la ieșire",
    allow_open: "Permite deschis la armare",
    auto_bypass: "Ocolește automat",
    auto_bypass_hint: "Dacă este deschis la armare",
    trigger_unavailable: "Declanșează dacă e indisponibil",
    always_on: "Mereu activ",
    always_on_hint: "Chiar și dezarmată (fum, apă)",
    f_immediate: "Imediat",
    f_entry: "Întârziere la intrare",
    f_always: "Mereu activ",
    f_bypass: "Ocolire auto",
    f_unavailable: "Declanșează dacă e indisponibil",
    add_sensors: "Adaugă senzori",
    add_sensors_hint: "Entități încă nefolosite de alarmă.",
    add_n: "Adaugă ({n})",
    no_candidates: "Toți senzorii sunt deja în alarmă.",
    groups: "Grupuri de senzori",
    groups_hint: "Declanșează doar dacă mai mulți senzori ai grupului detectează în fereastra de timp.",
    new_group: "Grup nou",
    group_line: "Evenimente: {events} în {timeout} s · senzori: {n}",
    event_count: "Evenimente",
    timeout: "Fereastră de timp",
    group_sensors: "Senzori",
    code_usage: "Folosirea codurilor",
    code_arm_required: "Cod pentru armare",
    code_disarm_required: "Cod pentru dezarmare",
    code_mode_change_required: "Cod pentru schimbarea modului",
    code_mode_change_hint: "Armată → alt mod",
    code_format: "Formatul codului",
    code_format_hint: "Tastatură numerică sau text liber",
    cf_number: "Numeric",
    cf_text: "Text",
    users: "Utilizatori",
    new_user: "Utilizator nou",
    user_name: "Nume",
    code: "Cod",
    code_keep: "Lasă gol pentru a-l păstra",
    old_code: "Codul actual",
    can_arm: "Poate arma",
    can_disarm: "Poate dezarma",
    is_override_code: "Cod prioritar",
    is_override_code_hint: "Armează chiar dacă senzorii sunt deschiși",
    area_limit: "Zone",
    area_limit_hint: "Niciuna selectată: toate zonele",
    u_arm_disarm: "Armează și dezarmează",
    u_arm: "Doar armează",
    u_disarm: "Doar dezarmează",
    u_none: "Fără drepturi",
    u_override: "Prioritar",
    notifications: "Notificări",
    new_notification: "Notificare nouă",
    actions: "Acțiuni",
    new_action: "Acțiune nouă",
    no_notifications: "Nicio notificare încă.",
    no_actions: "Nicio acțiune încă.",
    name: "Nume",
    event: "Eveniment",
    ev_armed: "Armată",
    ev_disarmed: "Dezarmată",
    ev_triggered: "Declanșată",
    ev_untriggered: "Nu mai este declanșată",
    ev_arm_failure: "Armare eșuată",
    ev_arming: "Întârzierea la ieșire a început",
    ev_pending: "Întârzierea la intrare a început",
    action_modes: "Moduri",
    action_modes_hint: "Niciunul selectat: toate modurile",
    target: "Destinație",
    notif_title: "Titlu",
    message: "Mesaj",
    message_hint: "Variabile: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entitate",
    action: "Acțiune",
    turn_on: "Pornește",
    turn_off: "Oprește",
    display: "Afișarea panoului",
    panel_title: "Titlu în bara laterală",
    hide_header: "Ascunde bara de sus",
    hide_header_hint: "Filele și butonul de meniu rămân",
    hh_off: "Niciodată",
    hh_non_admin: "Non-administratori",
    hh_all: "Toți",
    panel_tabs: "File afișate",
    sidebar_badge: "Insignă în bara laterală",
    sidebar_badge_hint: "Senzori care împiedică armarea; roșie când alarma este declanșată",
    enabled: "Pornit",
    disabled: "Oprit",
    alarm: "Alarmă",
    header_entity: "Alarma afișată în antet",
    header_entity_auto: "Automat (principala Alarmo)",
    illustration_theme: "Tema ilustrației",
    illustration_theme_hint: "Auto urmează tema Home Assistant",
    th_auto: "Auto",
    th_day: "Zi",
    th_night: "Noapte",
    admin_note: "Acest panou este rezervat administratorilor. Alarmo păstrează configurația: entitățile, cardurile și automatizările sale continuă să funcționeze.",
    t_timeline: "Cronologie",
    all_rooms: "Toate camerele",
    no_room: "Fără cameră",
    tl_motion: "Mișcare",
    tl_clear: "Liniște",
    tl_detected: "Detectat",
    tl_ok: "OK",
    tl_now: "acum",
    tl_events: "Evenimente",
    tl_tracked: "Senzori urmăriți: {n}",
    tl_triggers: "Declanșări",
    tl_none: "Niciuna",
    tl_calm: "Totul e liniștit",
    tl_most: "Cel mai activ",
    tl_times: "{n}×",
    tl_longest: "Cea mai lungă deschidere",
    tl_alarm_at: "Alarmă: {state}",
    tl_last: "ultima activitate {ago}",
    tl_no_activity: "Nicio activitate",
    tl_n_sensors: "Senzori: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 zile",
    tl_armed: "Alarmă armată",
    tl_marks: "Întârziere / declanșare",
    tl_by_room: "Activitate pe cameră",
    tl_by_type: "Activitate pe tip de senzor",
    tl_by_sensor: "Activitate pe senzor",
    g_room: "Pe cameră",
    g_type: "Pe tip",
    g_none: "Fără grupare",
    so_label: "Sortare",
    so_recent: "Activitate recentă",
    so_count: "Cei mai activi",
    so_name: "Nume",
    tl_no_history: "Niciun istoric pentru această perioadă: înregistrarea este activă?",
    tl_duration: "Durată: {d}",
  },
  da: {
    title: "Alarm",
    t_general: "Generelt",
    t_sensors: "Sensorer",
    t_codes: "Koder",
    t_actions: "Handlinger",
    t_settings: "Indstillinger",
    loading: "Indlæser…",
    no_alarmo: "Alarmo er ikke installeret",
    no_alarmo_hint: "Dette panel opsætter Alarmo. Installér Alarmo fra Marketplace, tilføj det under Indstillinger → Enheder og tjenester, og kom så tilbage.",
    saved: "Gemt",
    error: "Kunne ikke gemme: {error}",
    save: "Gem",
    cancel: "Annullér",
    delete: "Slet",
    remove: "Fjern",
    add: "Tilføj",
    test: "Prøv",
    confirm_delete: "Slet “{name}”?",
    none: "Ingen",
    all_areas: "Alle områder",
    search: "Søg",
    sec: "s",
    s_disarmed: "Frakoblet",
    s_armed_home: "Tilkoblet hjemme",
    s_armed_away: "Tilkoblet ude",
    s_armed_night: "Tilkoblet nat",
    s_armed_vacation: "Tilkoblet ferie",
    s_armed_custom_bypass: "Tilkoblet tilpasset",
    s_arming: "Udgangsforsinkelse",
    s_pending: "Indgangsforsinkelse",
    s_triggered: "Udløst",
    s_disarming: "Frakobler",
    s_unavailable: "Utilgængelig",
    sub_ready: "{n} sensorer klar",
    sub_blocking: "Ikke klar: {names}",
    sub_since: "Siden {time}",
    sub_triggered: "Årsag: {names}",
    sub_none: "Ingen alarm fundet",
    m_disarm: "Frakobl",
    m_armed_home: "Hjemme",
    m_armed_away: "Ude",
    m_armed_night: "Nat",
    m_armed_vacation: "Ferie",
    m_armed_custom_bypass: "Tilpasset",
    code_title: "Kode",
    code_hint: "Indtast koden for at fortsætte",
    modes: "Tilstande",
    modes_hint: "De aktiverede tilstande vises på kortene og i kommandoerne; hver har sine egne forsinkelser.",
    mode_off: "Deaktiveret",
    mode_line: "Udgang {exit} · Indgang {entry} · Alarm {trigger}",
    unlimited: "ubegrænset",
    exit_time: "Udgangsforsinkelse",
    exit_time_hint: "Tid til at gå, når alarmen er tilkoblet",
    entry_time: "Indgangsforsinkelse",
    entry_time_hint: "Tid til at frakoble efter en registrering",
    trigger_time: "Alarmvarighed",
    trigger_time_hint: "0 = ingen grænse",
    areas: "Områder",
    add_area: "Tilføj et område",
    area_name: "Navn",
    area_line: "{n} sensorer",
    delete_area: "Slet området",
    behaviour: "Adfærd",
    master: "Masteralarm",
    master_hint: "Én enhed, der styrer alle områder samlet",
    master_name: "Masteralarmens navn",
    disarm_after_trigger: "Frakobl efter udløsning",
    disarm_after_trigger_hint: "Ellers vender alarmen tilbage til den tidligere tilstand",
    ignore_blocking: "Ignorér blokerende sensorer efter udløsning",
    ignore_blocking_hint: "Tilkobler igen, selv om sensorer stadig er åbne",
    mqtt: "MQTT",
    mqtt_hint: "Udgiver tilstanden og modtager kommandoer (tastaturer, vægpaneler).",
    state_topic: "Tilstandsemne",
    command_topic: "Kommandoemne",
    event_topic: "Hændelsesemne",
    require_code: "Kode påkrævet",
    require_code_hint: "Til MQTT-kommandoer",
    sensors: "Sensorer",
    no_sensors: "Ingen sensorer endnu: tilføj nogle nedenfor.",
    st_ready: "Klar",
    st_open: "Forhindrer tilkobling",
    st_bypassed: "Forbigået",
    st_unavailable: "Utilgængelig",
    st_disabled: "Deaktiveret",
    st_open_ok: "Åben tilladt",
    on: "Åben",
    off: "Lukket",
    type: "Type",
    ty_door: "Dør",
    ty_window: "Vindue",
    ty_motion: "Bevægelse",
    ty_tamper: "Sabotage",
    ty_environmental: "Miljø",
    ty_other: "Andet",
    area: "Område",
    group: "Gruppe",
    sensor_modes: "Tilstande",
    sensor_modes_hint: "Sensoren overvåger i disse tilstande",
    use_exit_delay: "Brug udgangsforsinkelsen",
    use_entry_delay: "Brug indgangsforsinkelsen",
    use_entry_delay_hint: "Ellers udløser den med det samme",
    arm_on_close: "Tilkobl ved lukning",
    arm_on_close_hint: "Tilkobler, når sensoren lukker under udgangsforsinkelsen",
    allow_open: "Tillad åben ved tilkobling",
    auto_bypass: "Forbigå automatisk",
    auto_bypass_hint: "Hvis den er åben ved tilkobling",
    trigger_unavailable: "Udløs ved utilgængelighed",
    always_on: "Altid aktiv",
    always_on_hint: "Også frakoblet (røg, vand)",
    f_immediate: "Øjeblikkelig",
    f_entry: "Indgangsforsinkelse",
    f_always: "Altid aktiv",
    f_bypass: "Auto-forbigåelse",
    f_unavailable: "Udløser ved utilgængelighed",
    add_sensors: "Tilføj sensorer",
    add_sensors_hint: "Enheder, som alarmen endnu ikke bruger.",
    add_n: "Tilføj ({n})",
    no_candidates: "Alle sensorer er allerede i alarmen.",
    groups: "Sensorgrupper",
    groups_hint: "Udløser kun, når flere sensorer i gruppen registrerer inden for tidsvinduet.",
    new_group: "Ny gruppe",
    group_line: "{events} hændelser på {timeout} s · {n} sensorer",
    event_count: "Hændelser",
    timeout: "Tidsvindue",
    group_sensors: "Sensorer",
    code_usage: "Brug af koder",
    code_arm_required: "Kode for at tilkoble",
    code_disarm_required: "Kode for at frakoble",
    code_mode_change_required: "Kode for at skifte tilstand",
    code_mode_change_hint: "Tilkoblet → anden tilstand",
    code_format: "Kodeformat",
    code_format_hint: "Taltastatur eller fri tekst",
    cf_number: "Tal",
    cf_text: "Tekst",
    users: "Brugere",
    new_user: "Ny bruger",
    user_name: "Navn",
    code: "Kode",
    code_keep: "Lad stå tom for at beholde den",
    old_code: "Nuværende kode",
    can_arm: "Må tilkoble",
    can_disarm: "Må frakoble",
    is_override_code: "Tilsidesættelseskode",
    is_override_code_hint: "Tilkobler, selv om sensorer er åbne",
    area_limit: "Områder",
    area_limit_hint: "Ingen valgt: alle områder",
    u_arm_disarm: "Til- og frakobler",
    u_arm: "Kun tilkobling",
    u_disarm: "Kun frakobling",
    u_none: "Ingen rettigheder",
    u_override: "Tilsidesættelse",
    notifications: "Notifikationer",
    new_notification: "Ny notifikation",
    actions: "Handlinger",
    new_action: "Ny handling",
    no_notifications: "Ingen notifikationer endnu.",
    no_actions: "Ingen handlinger endnu.",
    name: "Navn",
    event: "Hændelse",
    ev_armed: "Tilkoblet",
    ev_disarmed: "Frakoblet",
    ev_triggered: "Udløst",
    ev_untriggered: "Ikke længere udløst",
    ev_arm_failure: "Tilkobling mislykkedes",
    ev_arming: "Udgangsforsinkelse startet",
    ev_pending: "Indgangsforsinkelse startet",
    action_modes: "Tilstande",
    action_modes_hint: "Ingen valgt: alle tilstande",
    target: "Mål",
    notif_title: "Titel",
    message: "Besked",
    message_hint: "Pladsholdere: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Enhed",
    action: "Handling",
    turn_on: "Tænd",
    turn_off: "Sluk",
    display: "Panelvisning",
    panel_title: "Titel i sidebjælken",
    hide_header: "Skjul topbjælken",
    hide_header_hint: "Fanerne og menuknappen bliver",
    hh_off: "Aldrig",
    hh_non_admin: "Ikke-administratorer",
    hh_all: "Alle",
    panel_tabs: "Viste faner",
    sidebar_badge: "Mærke i sidebjælken",
    sidebar_badge_hint: "Sensorer, der forhindrer tilkobling; rød, når alarmen er udløst",
    enabled: "Til",
    disabled: "Fra",
    alarm: "Alarm",
    header_entity: "Alarm vist i overskriften",
    header_entity_auto: "Automatisk (Alarmo-master)",
    illustration_theme: "Illustrationens tema",
    illustration_theme_hint: "Auto følger Home Assistants tema",
    th_auto: "Auto",
    th_day: "Dag",
    th_night: "Nat",
    admin_note: "Dette panel er for administratorer. Alarmo beholder konfigurationen: dets enheder, kort og automatiseringer virker fortsat.",
    t_timeline: "Tidslinje",
    all_rooms: "Alle rum",
    no_room: "Uden rum",
    tl_motion: "Bevægelse",
    tl_clear: "Roligt",
    tl_detected: "Registreret",
    tl_ok: "OK",
    tl_now: "nu",
    tl_events: "Hændelser",
    tl_tracked: "Fulgte sensorer: {n}",
    tl_triggers: "Udløsninger",
    tl_none: "Ingen",
    tl_calm: "Alt roligt",
    tl_most: "Mest aktiv",
    tl_times: "{n}×",
    tl_longest: "Længste åbning",
    tl_alarm_at: "Alarm: {state}",
    tl_last: "seneste aktivitet {ago}",
    tl_no_activity: "Ingen aktivitet",
    tl_n_sensors: "Sensorer: {n}",
    p_6h: "6 t",
    p_24h: "24 t",
    p_3d: "3 dage",
    tl_armed: "Alarm tilkoblet",
    tl_marks: "Forsinkelse / udløsning",
    tl_by_room: "Aktivitet pr. rum",
    tl_by_type: "Aktivitet pr. sensortype",
    tl_by_sensor: "Aktivitet pr. sensor",
    g_room: "Pr. rum",
    g_type: "Pr. type",
    g_none: "Ikke grupperet",
    so_label: "Sortering",
    so_recent: "Seneste aktivitet",
    so_count: "Mest aktive",
    so_name: "Navn",
    tl_no_history: "Ingen historik for denne periode: er optageren slået til?",
    tl_duration: "Varighed: {d}",
  },
  sv: {
    title: "Larm",
    t_general: "Allmänt",
    t_sensors: "Sensorer",
    t_codes: "Koder",
    t_actions: "Åtgärder",
    t_settings: "Inställningar",
    loading: "Laddar…",
    no_alarmo: "Alarmo är inte installerat",
    no_alarmo_hint: "Den här panelen ställer in Alarmo. Installera Alarmo från Marketplace, lägg till det under Inställningar → Enheter och tjänster och kom sedan tillbaka.",
    saved: "Sparat",
    error: "Kunde inte spara: {error}",
    save: "Spara",
    cancel: "Avbryt",
    delete: "Radera",
    remove: "Ta bort",
    add: "Lägg till",
    test: "Prova",
    confirm_delete: "Radera ”{name}”?",
    none: "Ingen",
    all_areas: "Alla områden",
    search: "Sök",
    sec: "s",
    s_disarmed: "Frånkopplat",
    s_armed_home: "Tillkopplat hemma",
    s_armed_away: "Tillkopplat borta",
    s_armed_night: "Tillkopplat natt",
    s_armed_vacation: "Tillkopplat semester",
    s_armed_custom_bypass: "Tillkopplat anpassat",
    s_arming: "Utpasseringstid",
    s_pending: "Inpasseringstid",
    s_triggered: "Utlöst",
    s_disarming: "Kopplar från",
    s_unavailable: "Otillgängligt",
    sub_ready: "{n} sensorer redo",
    sub_blocking: "Inte redo: {names}",
    sub_since: "Sedan {time}",
    sub_triggered: "Orsak: {names}",
    sub_none: "Inget larm hittades",
    m_disarm: "Koppla från",
    m_armed_home: "Hemma",
    m_armed_away: "Borta",
    m_armed_night: "Natt",
    m_armed_vacation: "Semester",
    m_armed_custom_bypass: "Anpassat",
    code_title: "Kod",
    code_hint: "Ange koden för att fortsätta",
    modes: "Lägen",
    modes_hint: "De aktiverade lägena visas på korten och i kommandona; vart och ett har egna fördröjningar.",
    mode_off: "Inaktiverat",
    mode_line: "Ut {exit} · In {entry} · Larm {trigger}",
    unlimited: "obegränsat",
    exit_time: "Utpasseringstid",
    exit_time_hint: "Tid att gå när larmet har kopplats till",
    entry_time: "Inpasseringstid",
    entry_time_hint: "Tid att koppla från efter en detektering",
    trigger_time: "Larmets längd",
    trigger_time_hint: "0 = ingen gräns",
    areas: "Områden",
    add_area: "Lägg till ett område",
    area_name: "Namn",
    area_line: "{n} sensorer",
    delete_area: "Radera området",
    behaviour: "Beteende",
    master: "Huvudlarm",
    master_hint: "En entitet som styr alla områden tillsammans",
    master_name: "Huvudlarmets namn",
    disarm_after_trigger: "Koppla från efter utlösning",
    disarm_after_trigger_hint: "Annars återgår larmet till föregående läge",
    ignore_blocking: "Ignorera blockerande sensorer efter utlösning",
    ignore_blocking_hint: "Kopplar till igen även om sensorer fortfarande är öppna",
    mqtt: "MQTT",
    mqtt_hint: "Publicerar läget och tar emot kommandon (knappsatser, väggpaneler).",
    state_topic: "Lägesämne",
    command_topic: "Kommandoämne",
    event_topic: "Händelseämne",
    require_code: "Kod krävs",
    require_code_hint: "För MQTT-kommandon",
    sensors: "Sensorer",
    no_sensors: "Inga sensorer ännu: lägg till några nedan.",
    st_ready: "Redo",
    st_open: "Hindrar tillkoppling",
    st_bypassed: "Förbikopplad",
    st_unavailable: "Otillgänglig",
    st_disabled: "Inaktiverad",
    st_open_ok: "Öppen tillåten",
    on: "Öppen",
    off: "Stängd",
    type: "Typ",
    ty_door: "Dörr",
    ty_window: "Fönster",
    ty_motion: "Rörelse",
    ty_tamper: "Sabotage",
    ty_environmental: "Miljö",
    ty_other: "Annat",
    area: "Område",
    group: "Grupp",
    sensor_modes: "Lägen",
    sensor_modes_hint: "Sensorn bevakar i dessa lägen",
    use_exit_delay: "Använd utpasseringstiden",
    use_entry_delay: "Använd inpasseringstiden",
    use_entry_delay_hint: "Annars utlöser den direkt",
    arm_on_close: "Koppla till vid stängning",
    arm_on_close_hint: "Kopplar till när sensorn stängs under utpasseringstiden",
    allow_open: "Tillåt öppen vid tillkoppling",
    auto_bypass: "Förbikoppla automatiskt",
    auto_bypass_hint: "Om den är öppen vid tillkoppling",
    trigger_unavailable: "Utlös vid otillgänglighet",
    always_on: "Alltid aktiv",
    always_on_hint: "Även frånkopplat (rök, vatten)",
    f_immediate: "Direkt",
    f_entry: "Inpasseringstid",
    f_always: "Alltid aktiv",
    f_bypass: "Auto-förbikoppling",
    f_unavailable: "Utlöser vid otillgänglighet",
    add_sensors: "Lägg till sensorer",
    add_sensors_hint: "Entiteter som larmet inte använder ännu.",
    add_n: "Lägg till ({n})",
    no_candidates: "Alla sensorer finns redan i larmet.",
    groups: "Sensorgrupper",
    groups_hint: "Utlöser bara när flera sensorer i gruppen detekterar inom tidsfönstret.",
    new_group: "Ny grupp",
    group_line: "{events} händelser på {timeout} s · {n} sensorer",
    event_count: "Händelser",
    timeout: "Tidsfönster",
    group_sensors: "Sensorer",
    code_usage: "Användning av koder",
    code_arm_required: "Kod för att koppla till",
    code_disarm_required: "Kod för att koppla från",
    code_mode_change_required: "Kod för att byta läge",
    code_mode_change_hint: "Tillkopplat → annat läge",
    code_format: "Kodformat",
    code_format_hint: "Sifferknappsats eller fritext",
    cf_number: "Siffror",
    cf_text: "Text",
    users: "Användare",
    new_user: "Ny användare",
    user_name: "Namn",
    code: "Kod",
    code_keep: "Lämna tomt för att behålla den",
    old_code: "Nuvarande kod",
    can_arm: "Får koppla till",
    can_disarm: "Får koppla från",
    is_override_code: "Åsidosättningskod",
    is_override_code_hint: "Kopplar till även om sensorer är öppna",
    area_limit: "Områden",
    area_limit_hint: "Inget valt: alla områden",
    u_arm_disarm: "Kopplar till och från",
    u_arm: "Endast tillkoppling",
    u_disarm: "Endast frånkoppling",
    u_none: "Inga rättigheter",
    u_override: "Åsidosättning",
    notifications: "Aviseringar",
    new_notification: "Ny avisering",
    actions: "Åtgärder",
    new_action: "Ny åtgärd",
    no_notifications: "Inga aviseringar ännu.",
    no_actions: "Inga åtgärder ännu.",
    name: "Namn",
    event: "Händelse",
    ev_armed: "Tillkopplat",
    ev_disarmed: "Frånkopplat",
    ev_triggered: "Utlöst",
    ev_untriggered: "Inte längre utlöst",
    ev_arm_failure: "Tillkoppling misslyckades",
    ev_arming: "Utpasseringstid startad",
    ev_pending: "Inpasseringstid startad",
    action_modes: "Lägen",
    action_modes_hint: "Inget valt: alla lägen",
    target: "Mål",
    notif_title: "Titel",
    message: "Meddelande",
    message_hint: "Platshållare: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entitet",
    action: "Åtgärd",
    turn_on: "Slå på",
    turn_off: "Stäng av",
    display: "Panelens visning",
    panel_title: "Titel i sidofältet",
    hide_header: "Dölj toppfältet",
    hide_header_hint: "Flikarna och menyknappen finns kvar",
    hh_off: "Aldrig",
    hh_non_admin: "Icke-administratörer",
    hh_all: "Alla",
    panel_tabs: "Visade flikar",
    sidebar_badge: "Märke i sidofältet",
    sidebar_badge_hint: "Sensorer som hindrar tillkoppling; röd när larmet har utlösts",
    enabled: "På",
    disabled: "Av",
    alarm: "Larm",
    header_entity: "Larm som visas i sidhuvudet",
    header_entity_auto: "Automatiskt (Alarmos huvudlarm)",
    illustration_theme: "Illustrationens tema",
    illustration_theme_hint: "Auto följer Home Assistants tema",
    th_auto: "Auto",
    th_day: "Dag",
    th_night: "Natt",
    admin_note: "Den här panelen är för administratörer. Alarmo behåller konfigurationen: dess entiteter, kort och automationer fortsätter att fungera.",
    t_timeline: "Tidslinje",
    all_rooms: "Alla rum",
    no_room: "Utan rum",
    tl_motion: "Rörelse",
    tl_clear: "Lugnt",
    tl_detected: "Upptäckt",
    tl_ok: "OK",
    tl_now: "nu",
    tl_events: "Händelser",
    tl_tracked: "Följda sensorer: {n}",
    tl_triggers: "Utlösningar",
    tl_none: "Inga",
    tl_calm: "Allt lugnt",
    tl_most: "Mest aktiv",
    tl_times: "{n}×",
    tl_longest: "Längsta öppning",
    tl_alarm_at: "Larm: {state}",
    tl_last: "senaste aktivitet {ago}",
    tl_no_activity: "Ingen aktivitet",
    tl_n_sensors: "Sensorer: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 dagar",
    tl_armed: "Larm tillkopplat",
    tl_marks: "Fördröjning / utlösning",
    tl_by_room: "Aktivitet per rum",
    tl_by_type: "Aktivitet per sensortyp",
    tl_by_sensor: "Aktivitet per sensor",
    g_room: "Per rum",
    g_type: "Per typ",
    g_none: "Ogrupperat",
    so_label: "Sortering",
    so_recent: "Senaste aktivitet",
    so_count: "Mest aktiva",
    so_name: "Namn",
    tl_no_history: "Ingen historik för perioden: är inspelaren på?",
    tl_duration: "Varaktighet: {d}",
  },
  bg: {
    title: "Аларма",
    t_general: "Общи",
    t_sensors: "Сензори",
    t_codes: "Кодове",
    t_actions: "Действия",
    t_settings: "Настройки",
    loading: "Зареждане…",
    no_alarmo: "Alarmo не е инсталиран",
    no_alarmo_hint: "Този панел настройва Alarmo. Инсталирайте Alarmo от Marketplace, добавете го в Настройки → Устройства и услуги и се върнете.",
    saved: "Запазено",
    error: "Неуспешно запазване: {error}",
    save: "Запази",
    cancel: "Отказ",
    delete: "Изтрий",
    remove: "Премахни",
    add: "Добави",
    test: "Пробвай",
    confirm_delete: "Да се изтрие ли „{name}“?",
    none: "Няма",
    all_areas: "Всички зони",
    search: "Търсене",
    sec: "s",
    s_disarmed: "Изключена",
    s_armed_home: "Включена (вкъщи)",
    s_armed_away: "Включена (отсъствие)",
    s_armed_night: "Включена (нощ)",
    s_armed_vacation: "Включена (почивка)",
    s_armed_custom_bypass: "Включена (персонално)",
    s_arming: "Закъснение при излизане",
    s_pending: "Закъснение при влизане",
    s_triggered: "Задействана",
    s_disarming: "Изключване",
    s_unavailable: "Недостъпна",
    sub_ready: "Готови сензори: {n}",
    sub_blocking: "Не е готова: {names}",
    sub_since: "От {time}",
    sub_triggered: "Причина: {names}",
    sub_none: "Няма намерена аларма",
    m_disarm: "Изключи",
    m_armed_home: "Вкъщи",
    m_armed_away: "Отсъствие",
    m_armed_night: "Нощ",
    m_armed_vacation: "Почивка",
    m_armed_custom_bypass: "Персонално",
    code_title: "Код",
    code_hint: "Въведете кода, за да продължите",
    modes: "Режими",
    modes_hint: "Включените режими се показват на картите и в командите; всеки има свои закъснения.",
    mode_off: "Изключен",
    mode_line: "Излизане {exit} · Влизане {entry} · Аларма {trigger}",
    unlimited: "без ограничение",
    exit_time: "Закъснение при излизане",
    exit_time_hint: "Време за излизане след включване на алармата",
    entry_time: "Закъснение при влизане",
    entry_time_hint: "Време за изключване след засичане",
    trigger_time: "Продължителност на алармата",
    trigger_time_hint: "0 = без ограничение",
    areas: "Зони",
    add_area: "Добави зона",
    area_name: "Име",
    area_line: "Сензори: {n}",
    delete_area: "Изтрий зоната",
    behaviour: "Поведение",
    master: "Главна аларма",
    master_hint: "Един обект, който управлява всички зони заедно",
    master_name: "Име на главната аларма",
    disarm_after_trigger: "Изключване след задействане",
    disarm_after_trigger_hint: "Иначе алармата се връща в предишния режим",
    ignore_blocking: "Пренебрегване на блокиращите сензори след задействане",
    ignore_blocking_hint: "Включва се отново, дори ако сензори са още отворени",
    mqtt: "MQTT",
    mqtt_hint: "Публикува състоянието и приема команди (клавиатури, стенни панели).",
    state_topic: "Тема за състояние",
    command_topic: "Тема за команди",
    event_topic: "Тема за събития",
    require_code: "Изисква се код",
    require_code_hint: "За MQTT командите",
    sensors: "Сензори",
    no_sensors: "Още няма сензори: добавете отдолу.",
    st_ready: "Готов",
    st_open: "Пречи на включването",
    st_bypassed: "Пропуснат",
    st_unavailable: "Недостъпен",
    st_disabled: "Изключен",
    st_open_ok: "Отворен разрешен",
    on: "Отворен",
    off: "Затворен",
    type: "Тип",
    ty_door: "Врата",
    ty_window: "Прозорец",
    ty_motion: "Движение",
    ty_tamper: "Саботаж",
    ty_environmental: "Среда",
    ty_other: "Друг",
    area: "Зона",
    group: "Група",
    sensor_modes: "Режими",
    sensor_modes_hint: "Сензорът наблюдава в тези режими",
    use_exit_delay: "Използвай закъснението при излизане",
    use_entry_delay: "Използвай закъснението при влизане",
    use_entry_delay_hint: "Иначе се задейства веднага",
    arm_on_close: "Включване при затваряне",
    arm_on_close_hint: "Включва, когато сензорът се затвори по време на закъснението при излизане",
    allow_open: "Разреши отворен при включване",
    auto_bypass: "Автоматично пропускане",
    auto_bypass_hint: "Ако е отворен при включване",
    trigger_unavailable: "Задействане при недостъпност",
    always_on: "Винаги активен",
    always_on_hint: "Дори изключена (дим, вода)",
    f_immediate: "Незабавно",
    f_entry: "Закъснение при влизане",
    f_always: "Винаги активен",
    f_bypass: "Авто пропускане",
    f_unavailable: "Задейства при недостъпност",
    add_sensors: "Добави сензори",
    add_sensors_hint: "Обекти, които алармата още не използва.",
    add_n: "Добави ({n})",
    no_candidates: "Всички сензори вече са в алармата.",
    groups: "Групи сензори",
    groups_hint: "Задейства се само ако няколко сензора от групата засекат в рамките на времевия прозорец.",
    new_group: "Нова група",
    group_line: "Събития: {events} за {timeout} s · сензори: {n}",
    event_count: "Събития",
    timeout: "Времеви прозорец",
    group_sensors: "Сензори",
    code_usage: "Използване на кодове",
    code_arm_required: "Код за включване",
    code_disarm_required: "Код за изключване",
    code_mode_change_required: "Код за смяна на режим",
    code_mode_change_hint: "Включена → друг режим",
    code_format: "Формат на кода",
    code_format_hint: "Цифрова клавиатура или свободен текст",
    cf_number: "Цифри",
    cf_text: "Текст",
    users: "Потребители",
    new_user: "Нов потребител",
    user_name: "Име",
    code: "Код",
    code_keep: "Оставете празно, за да го запазите",
    old_code: "Текущ код",
    can_arm: "Може да включва",
    can_disarm: "Може да изключва",
    is_override_code: "Приоритетен код",
    is_override_code_hint: "Включва дори при отворени сензори",
    area_limit: "Зони",
    area_limit_hint: "Нищо избрано: всички зони",
    u_arm_disarm: "Включва и изключва",
    u_arm: "Само включва",
    u_disarm: "Само изключва",
    u_none: "Без права",
    u_override: "Приоритетен",
    notifications: "Известия",
    new_notification: "Ново известие",
    actions: "Действия",
    new_action: "Ново действие",
    no_notifications: "Още няма известия.",
    no_actions: "Още няма действия.",
    name: "Име",
    event: "Събитие",
    ev_armed: "Включена",
    ev_disarmed: "Изключена",
    ev_triggered: "Задействана",
    ev_untriggered: "Вече не е задействана",
    ev_arm_failure: "Неуспешно включване",
    ev_arming: "Започна закъснението при излизане",
    ev_pending: "Започна закъснението при влизане",
    action_modes: "Режими",
    action_modes_hint: "Нищо избрано: всички режими",
    target: "Цел",
    notif_title: "Заглавие",
    message: "Съобщение",
    message_hint: "Заместители: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Обект",
    action: "Действие",
    turn_on: "Включи",
    turn_off: "Изключи",
    display: "Изглед на панела",
    panel_title: "Заглавие в страничната лента",
    hide_header: "Скриване на горната лента",
    hide_header_hint: "Разделите и бутонът за меню остават",
    hh_off: "Никога",
    hh_non_admin: "Неадминистратори",
    hh_all: "Всички",
    panel_tabs: "Показани раздели",
    sidebar_badge: "Значка в страничната лента",
    sidebar_badge_hint: "Сензори, които пречат на включването; червена при задействана аларма",
    enabled: "Вкл.",
    disabled: "Изкл.",
    alarm: "Аларма",
    header_entity: "Аларма в заглавката",
    header_entity_auto: "Автоматично (главна на Alarmo)",
    illustration_theme: "Тема на илюстрацията",
    illustration_theme_hint: "Авто следва темата на Home Assistant",
    th_auto: "Авто",
    th_day: "Ден",
    th_night: "Нощ",
    admin_note: "Този панел е само за администратори. Alarmo пази настройките: неговите обекти, карти и автоматизации продължават да работят.",
    t_timeline: "Времева линия",
    all_rooms: "Всички стаи",
    no_room: "Без стая",
    tl_motion: "Движение",
    tl_clear: "Спокойно",
    tl_detected: "Засечено",
    tl_ok: "OK",
    tl_now: "сега",
    tl_events: "Събития",
    tl_tracked: "Следени сензори: {n}",
    tl_triggers: "Задействания",
    tl_none: "Няма",
    tl_calm: "Всичко е спокойно",
    tl_most: "Най-активен",
    tl_times: "{n}×",
    tl_longest: "Най-дълго отваряне",
    tl_alarm_at: "Аларма: {state}",
    tl_last: "последна активност {ago}",
    tl_no_activity: "Няма активност",
    tl_n_sensors: "Сензори: {n}",
    p_6h: "6 ч",
    p_24h: "24 ч",
    p_3d: "3 дни",
    tl_armed: "Включена аларма",
    tl_marks: "Закъснение / задействане",
    tl_by_room: "Активност по стаи",
    tl_by_type: "Активност по тип сензор",
    tl_by_sensor: "Активност по сензор",
    g_room: "По стаи",
    g_type: "По тип",
    g_none: "Без групиране",
    so_label: "Подреждане",
    so_recent: "Скорошна активност",
    so_count: "Най-активни",
    so_name: "Име",
    tl_no_history: "Няма история за този период: включен ли е записът?",
    tl_duration: "Продължителност: {d}",
  },
  ru: {
    title: "Сигнализация",
    t_general: "Общие",
    t_sensors: "Датчики",
    t_codes: "Коды",
    t_actions: "Действия",
    t_settings: "Настройки",
    loading: "Загрузка…",
    no_alarmo: "Alarmo не установлен",
    no_alarmo_hint: "Эта панель настраивает Alarmo. Установите Alarmo из Marketplace, добавьте его в Настройки → Устройства и службы и вернитесь.",
    saved: "Сохранено",
    error: "Не удалось сохранить: {error}",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    remove: "Убрать",
    add: "Добавить",
    test: "Проверить",
    confirm_delete: "Удалить «{name}»?",
    none: "Нет",
    all_areas: "Все зоны",
    search: "Поиск",
    sec: "s",
    s_disarmed: "Снята с охраны",
    s_armed_home: "Под охраной (дома)",
    s_armed_away: "Под охраной (нет дома)",
    s_armed_night: "Под охраной (ночь)",
    s_armed_vacation: "Под охраной (отпуск)",
    s_armed_custom_bypass: "Под охраной (свой режим)",
    s_arming: "Задержка на выход",
    s_pending: "Задержка на вход",
    s_triggered: "Сработала",
    s_disarming: "Снятие с охраны",
    s_unavailable: "Недоступна",
    sub_ready: "Готовых датчиков: {n}",
    sub_blocking: "Не готова: {names}",
    sub_since: "С {time}",
    sub_triggered: "Причина: {names}",
    sub_none: "Сигнализация не найдена",
    m_disarm: "Снять",
    m_armed_home: "Дома",
    m_armed_away: "Нет дома",
    m_armed_night: "Ночь",
    m_armed_vacation: "Отпуск",
    m_armed_custom_bypass: "Свой режим",
    code_title: "Код",
    code_hint: "Введите код, чтобы продолжить",
    modes: "Режимы",
    modes_hint: "Включённые режимы показываются на карточках и в командах; у каждого свои задержки.",
    mode_off: "Выключен",
    mode_line: "Выход {exit} · Вход {entry} · Тревога {trigger}",
    unlimited: "без ограничения",
    exit_time: "Задержка на выход",
    exit_time_hint: "Время, чтобы уйти после постановки на охрану",
    entry_time: "Задержка на вход",
    entry_time_hint: "Время, чтобы снять с охраны после обнаружения",
    trigger_time: "Длительность тревоги",
    trigger_time_hint: "0 = без ограничения",
    areas: "Зоны",
    add_area: "Добавить зону",
    area_name: "Название",
    area_line: "Датчиков: {n}",
    delete_area: "Удалить зону",
    behaviour: "Поведение",
    master: "Главная сигнализация",
    master_hint: "Одна сущность, управляющая всеми зонами сразу",
    master_name: "Название главной сигнализации",
    disarm_after_trigger: "Снимать с охраны после срабатывания",
    disarm_after_trigger_hint: "Иначе сигнализация возвращается в прежний режим",
    ignore_blocking: "Игнорировать блокирующие датчики после срабатывания",
    ignore_blocking_hint: "Снова встаёт на охрану, даже если датчики открыты",
    mqtt: "MQTT",
    mqtt_hint: "Публикует состояние и принимает команды (клавиатуры, настенные панели).",
    state_topic: "Топик состояния",
    command_topic: "Топик команд",
    event_topic: "Топик событий",
    require_code: "Нужен код",
    require_code_hint: "Для команд MQTT",
    sensors: "Датчики",
    no_sensors: "Пока нет датчиков: добавьте их ниже.",
    st_ready: "Готов",
    st_open: "Мешает постановке",
    st_bypassed: "Обойдён",
    st_unavailable: "Недоступен",
    st_disabled: "Выключен",
    st_open_ok: "Открытый разрешён",
    on: "Открыт",
    off: "Закрыт",
    type: "Тип",
    ty_door: "Дверь",
    ty_window: "Окно",
    ty_motion: "Движение",
    ty_tamper: "Вскрытие",
    ty_environmental: "Среда",
    ty_other: "Другое",
    area: "Зона",
    group: "Группа",
    sensor_modes: "Режимы",
    sensor_modes_hint: "Датчик следит в этих режимах",
    use_exit_delay: "Использовать задержку на выход",
    use_entry_delay: "Использовать задержку на вход",
    use_entry_delay_hint: "Иначе срабатывает сразу",
    arm_on_close: "Ставить на охрану при закрытии",
    arm_on_close_hint: "Ставит на охрану, когда датчик закрывается во время задержки на выход",
    allow_open: "Разрешить открытым при постановке",
    auto_bypass: "Обходить автоматически",
    auto_bypass_hint: "Если он открыт при постановке",
    trigger_unavailable: "Срабатывать при недоступности",
    always_on: "Всегда активен",
    always_on_hint: "Даже без охраны (дым, вода)",
    f_immediate: "Мгновенно",
    f_entry: "Задержка на вход",
    f_always: "Всегда активен",
    f_bypass: "Автообход",
    f_unavailable: "Срабатывает при недоступности",
    add_sensors: "Добавить датчики",
    add_sensors_hint: "Сущности, которые сигнализация ещё не использует.",
    add_n: "Добавить ({n})",
    no_candidates: "Все датчики уже в сигнализации.",
    groups: "Группы датчиков",
    groups_hint: "Срабатывает, только если несколько датчиков группы обнаружат в пределах временного окна.",
    new_group: "Новая группа",
    group_line: "Событий: {events} за {timeout} s · датчиков: {n}",
    event_count: "События",
    timeout: "Временное окно",
    group_sensors: "Датчики",
    code_usage: "Использование кодов",
    code_arm_required: "Код для постановки",
    code_disarm_required: "Код для снятия",
    code_mode_change_required: "Код для смены режима",
    code_mode_change_hint: "Под охраной → другой режим",
    code_format: "Формат кода",
    code_format_hint: "Цифровая клавиатура или любой текст",
    cf_number: "Цифры",
    cf_text: "Текст",
    users: "Пользователи",
    new_user: "Новый пользователь",
    user_name: "Имя",
    code: "Код",
    code_keep: "Оставьте пустым, чтобы сохранить",
    old_code: "Текущий код",
    can_arm: "Может ставить на охрану",
    can_disarm: "Может снимать с охраны",
    is_override_code: "Приоритетный код",
    is_override_code_hint: "Ставит на охрану даже при открытых датчиках",
    area_limit: "Зоны",
    area_limit_hint: "Ничего не выбрано: все зоны",
    u_arm_disarm: "Ставит и снимает",
    u_arm: "Только ставит",
    u_disarm: "Только снимает",
    u_none: "Нет прав",
    u_override: "Приоритет",
    notifications: "Уведомления",
    new_notification: "Новое уведомление",
    actions: "Действия",
    new_action: "Новое действие",
    no_notifications: "Пока нет уведомлений.",
    no_actions: "Пока нет действий.",
    name: "Название",
    event: "Событие",
    ev_armed: "Под охраной",
    ev_disarmed: "Снята с охраны",
    ev_triggered: "Сработала",
    ev_untriggered: "Тревога окончена",
    ev_arm_failure: "Не удалось поставить",
    ev_arming: "Началась задержка на выход",
    ev_pending: "Началась задержка на вход",
    action_modes: "Режимы",
    action_modes_hint: "Ничего не выбрано: все режимы",
    target: "Получатель",
    notif_title: "Заголовок",
    message: "Сообщение",
    message_hint: "Подстановки: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Сущность",
    action: "Действие",
    turn_on: "Включить",
    turn_off: "Выключить",
    display: "Вид панели",
    panel_title: "Заголовок в боковой панели",
    hide_header: "Скрыть верхнюю панель",
    hide_header_hint: "Вкладки и кнопка меню остаются",
    hh_off: "Никогда",
    hh_non_admin: "Не-администраторы",
    hh_all: "Все",
    panel_tabs: "Показанные вкладки",
    sidebar_badge: "Значок в боковой панели",
    sidebar_badge_hint: "Датчики, мешающие постановке; красный при срабатывании",
    enabled: "Вкл.",
    disabled: "Выкл.",
    alarm: "Сигнализация",
    header_entity: "Сигнализация в заголовке",
    header_entity_auto: "Автоматически (главная Alarmo)",
    illustration_theme: "Тема иллюстрации",
    illustration_theme_hint: "Авто следует теме Home Assistant",
    th_auto: "Авто",
    th_day: "День",
    th_night: "Ночь",
    admin_note: "Эта панель только для администраторов. Alarmo хранит настройки: его сущности, карточки и автоматизации продолжают работать.",
    t_timeline: "Хронология",
    all_rooms: "Все комнаты",
    no_room: "Без комнаты",
    tl_motion: "Движение",
    tl_clear: "Спокойно",
    tl_detected: "Обнаружено",
    tl_ok: "OK",
    tl_now: "сейчас",
    tl_events: "События",
    tl_tracked: "Отслеживаемых датчиков: {n}",
    tl_triggers: "Срабатывания",
    tl_none: "Нет",
    tl_calm: "Всё спокойно",
    tl_most: "Самый активный",
    tl_times: "{n}×",
    tl_longest: "Самое долгое открытие",
    tl_alarm_at: "Сигнализация: {state}",
    tl_last: "последняя активность {ago}",
    tl_no_activity: "Нет активности",
    tl_n_sensors: "Датчиков: {n}",
    p_6h: "6 ч",
    p_24h: "24 ч",
    p_3d: "3 дня",
    tl_armed: "Под охраной",
    tl_marks: "Задержка / срабатывание",
    tl_by_room: "Активность по комнатам",
    tl_by_type: "Активность по типу датчика",
    tl_by_sensor: "Активность по датчикам",
    g_room: "По комнатам",
    g_type: "По типу",
    g_none: "Без группировки",
    so_label: "Сортировка",
    so_recent: "Недавняя активность",
    so_count: "Самые активные",
    so_name: "Название",
    tl_no_history: "Нет истории за этот период: включён ли регистратор?",
    tl_duration: "Длительность: {d}",
  },
  uk: {
    title: "Сигналізація",
    t_general: "Загальні",
    t_sensors: "Датчики",
    t_codes: "Коди",
    t_actions: "Дії",
    t_settings: "Налаштування",
    loading: "Завантаження…",
    no_alarmo: "Alarmo не встановлено",
    no_alarmo_hint: "Ця панель налаштовує Alarmo. Встановіть Alarmo з Marketplace, додайте його в Налаштування → Пристрої та служби й поверніться.",
    saved: "Збережено",
    error: "Не вдалося зберегти: {error}",
    save: "Зберегти",
    cancel: "Скасувати",
    delete: "Видалити",
    remove: "Прибрати",
    add: "Додати",
    test: "Перевірити",
    confirm_delete: "Видалити «{name}»?",
    none: "Немає",
    all_areas: "Усі зони",
    search: "Пошук",
    sec: "s",
    s_disarmed: "Знято з охорони",
    s_armed_home: "Під охороною (вдома)",
    s_armed_away: "Під охороною (немає вдома)",
    s_armed_night: "Під охороною (ніч)",
    s_armed_vacation: "Під охороною (відпустка)",
    s_armed_custom_bypass: "Під охороною (свій режим)",
    s_arming: "Затримка на вихід",
    s_pending: "Затримка на вхід",
    s_triggered: "Спрацювала",
    s_disarming: "Зняття з охорони",
    s_unavailable: "Недоступна",
    sub_ready: "Готових датчиків: {n}",
    sub_blocking: "Не готова: {names}",
    sub_since: "З {time}",
    sub_triggered: "Причина: {names}",
    sub_none: "Сигналізацію не знайдено",
    m_disarm: "Зняти",
    m_armed_home: "Вдома",
    m_armed_away: "Немає вдома",
    m_armed_night: "Ніч",
    m_armed_vacation: "Відпустка",
    m_armed_custom_bypass: "Свій режим",
    code_title: "Код",
    code_hint: "Введіть код, щоб продовжити",
    modes: "Режими",
    modes_hint: "Увімкнені режими показуються на картках і в командах; кожен має свої затримки.",
    mode_off: "Вимкнено",
    mode_line: "Вихід {exit} · Вхід {entry} · Тривога {trigger}",
    unlimited: "без обмеження",
    exit_time: "Затримка на вихід",
    exit_time_hint: "Час, щоб піти після постановки на охорону",
    entry_time: "Затримка на вхід",
    entry_time_hint: "Час, щоб зняти з охорони після виявлення",
    trigger_time: "Тривалість тривоги",
    trigger_time_hint: "0 = без обмеження",
    areas: "Зони",
    add_area: "Додати зону",
    area_name: "Назва",
    area_line: "Датчиків: {n}",
    delete_area: "Видалити зону",
    behaviour: "Поведінка",
    master: "Головна сигналізація",
    master_hint: "Одна сутність, що керує всіма зонами разом",
    master_name: "Назва головної сигналізації",
    disarm_after_trigger: "Знімати з охорони після спрацювання",
    disarm_after_trigger_hint: "Інакше сигналізація повертається в попередній режим",
    ignore_blocking: "Ігнорувати блокувальні датчики після спрацювання",
    ignore_blocking_hint: "Знову стає на охорону, навіть якщо датчики відкриті",
    mqtt: "MQTT",
    mqtt_hint: "Публікує стан і приймає команди (клавіатури, настінні панелі).",
    state_topic: "Топік стану",
    command_topic: "Топік команд",
    event_topic: "Топік подій",
    require_code: "Потрібен код",
    require_code_hint: "Для команд MQTT",
    sensors: "Датчики",
    no_sensors: "Ще немає датчиків: додайте їх нижче.",
    st_ready: "Готовий",
    st_open: "Заважає постановці",
    st_bypassed: "Обійдено",
    st_unavailable: "Недоступний",
    st_disabled: "Вимкнено",
    st_open_ok: "Відкритий дозволено",
    on: "Відкрито",
    off: "Закрито",
    type: "Тип",
    ty_door: "Двері",
    ty_window: "Вікно",
    ty_motion: "Рух",
    ty_tamper: "Саботаж",
    ty_environmental: "Середовище",
    ty_other: "Інше",
    area: "Зона",
    group: "Група",
    sensor_modes: "Режими",
    sensor_modes_hint: "Датчик стежить у цих режимах",
    use_exit_delay: "Використовувати затримку на вихід",
    use_entry_delay: "Використовувати затримку на вхід",
    use_entry_delay_hint: "Інакше спрацьовує одразу",
    arm_on_close: "Ставити на охорону при закритті",
    arm_on_close_hint: "Ставить на охорону, коли датчик закривається під час затримки на вихід",
    allow_open: "Дозволити відкритим при постановці",
    auto_bypass: "Обходити автоматично",
    auto_bypass_hint: "Якщо він відкритий при постановці",
    trigger_unavailable: "Спрацьовувати при недоступності",
    always_on: "Завжди активний",
    always_on_hint: "Навіть без охорони (дим, вода)",
    f_immediate: "Миттєво",
    f_entry: "Затримка на вхід",
    f_always: "Завжди активний",
    f_bypass: "Автообхід",
    f_unavailable: "Спрацьовує при недоступності",
    add_sensors: "Додати датчики",
    add_sensors_hint: "Сутності, які сигналізація ще не використовує.",
    add_n: "Додати ({n})",
    no_candidates: "Усі датчики вже в сигналізації.",
    groups: "Групи датчиків",
    groups_hint: "Спрацьовує, лише якщо кілька датчиків групи виявлять у межах часового вікна.",
    new_group: "Нова група",
    group_line: "Подій: {events} за {timeout} s · датчиків: {n}",
    event_count: "Події",
    timeout: "Часове вікно",
    group_sensors: "Датчики",
    code_usage: "Використання кодів",
    code_arm_required: "Код для постановки",
    code_disarm_required: "Код для зняття",
    code_mode_change_required: "Код для зміни режиму",
    code_mode_change_hint: "Під охороною → інший режим",
    code_format: "Формат коду",
    code_format_hint: "Цифрова клавіатура або будь-який текст",
    cf_number: "Цифри",
    cf_text: "Текст",
    users: "Користувачі",
    new_user: "Новий користувач",
    user_name: "Ім'я",
    code: "Код",
    code_keep: "Залиште порожнім, щоб зберегти",
    old_code: "Поточний код",
    can_arm: "Може ставити на охорону",
    can_disarm: "Може знімати з охорони",
    is_override_code: "Пріоритетний код",
    is_override_code_hint: "Ставить на охорону навіть при відкритих датчиках",
    area_limit: "Зони",
    area_limit_hint: "Нічого не вибрано: усі зони",
    u_arm_disarm: "Ставить і знімає",
    u_arm: "Лише ставить",
    u_disarm: "Лише знімає",
    u_none: "Без прав",
    u_override: "Пріоритет",
    notifications: "Сповіщення",
    new_notification: "Нове сповіщення",
    actions: "Дії",
    new_action: "Нова дія",
    no_notifications: "Ще немає сповіщень.",
    no_actions: "Ще немає дій.",
    name: "Назва",
    event: "Подія",
    ev_armed: "Під охороною",
    ev_disarmed: "Знято з охорони",
    ev_triggered: "Спрацювала",
    ev_untriggered: "Тривогу завершено",
    ev_arm_failure: "Не вдалося поставити",
    ev_arming: "Почалася затримка на вихід",
    ev_pending: "Почалася затримка на вхід",
    action_modes: "Режими",
    action_modes_hint: "Нічого не вибрано: усі режими",
    target: "Одержувач",
    notif_title: "Заголовок",
    message: "Повідомлення",
    message_hint: "Підстановки: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Сутність",
    action: "Дія",
    turn_on: "Увімкнути",
    turn_off: "Вимкнути",
    display: "Вигляд панелі",
    panel_title: "Заголовок у бічній панелі",
    hide_header: "Сховати верхню панель",
    hide_header_hint: "Вкладки та кнопка меню залишаються",
    hh_off: "Ніколи",
    hh_non_admin: "Не-адміністратори",
    hh_all: "Усі",
    panel_tabs: "Показані вкладки",
    sidebar_badge: "Значок у бічній панелі",
    sidebar_badge_hint: "Датчики, що заважають постановці; червоний при спрацюванні",
    enabled: "Увімк.",
    disabled: "Вимк.",
    alarm: "Сигналізація",
    header_entity: "Сигналізація в заголовку",
    header_entity_auto: "Автоматично (головна Alarmo)",
    illustration_theme: "Тема ілюстрації",
    illustration_theme_hint: "Авто слідує темі Home Assistant",
    th_auto: "Авто",
    th_day: "День",
    th_night: "Ніч",
    admin_note: "Ця панель лише для адміністраторів. Alarmo зберігає налаштування: його сутності, картки та автоматизації продовжують працювати.",
    t_timeline: "Хронологія",
    all_rooms: "Усі кімнати",
    no_room: "Без кімнати",
    tl_motion: "Рух",
    tl_clear: "Спокійно",
    tl_detected: "Виявлено",
    tl_ok: "OK",
    tl_now: "зараз",
    tl_events: "Події",
    tl_tracked: "Відстежуваних датчиків: {n}",
    tl_triggers: "Спрацювання",
    tl_none: "Немає",
    tl_calm: "Усе спокійно",
    tl_most: "Найактивніший",
    tl_times: "{n}×",
    tl_longest: "Найдовше відкриття",
    tl_alarm_at: "Сигналізація: {state}",
    tl_last: "остання активність {ago}",
    tl_no_activity: "Немає активності",
    tl_n_sensors: "Датчиків: {n}",
    p_6h: "6 год",
    p_24h: "24 год",
    p_3d: "3 дні",
    tl_armed: "Під охороною",
    tl_marks: "Затримка / спрацювання",
    tl_by_room: "Активність за кімнатами",
    tl_by_type: "Активність за типом датчика",
    tl_by_sensor: "Активність за датчиками",
    g_room: "За кімнатами",
    g_type: "За типом",
    g_none: "Без групування",
    so_label: "Сортування",
    so_recent: "Нещодавня активність",
    so_count: "Найактивніші",
    so_name: "Назва",
    tl_no_history: "Немає історії за цей період: чи увімкнено реєстратор?",
    tl_duration: "Тривалість: {d}",
  },
  hu: {
    title: "Riasztó",
    t_general: "Általános",
    t_sensors: "Érzékelők",
    t_codes: "Kódok",
    t_actions: "Műveletek",
    t_settings: "Beállítások",
    loading: "Betöltés…",
    no_alarmo: "Az Alarmo nincs telepítve",
    no_alarmo_hint: "Ez a panel az Alarmót állítja be. Telepítsd az Alarmót a Marketplace-ről, add hozzá a Beállítások → Eszközök és szolgáltatások alatt, majd gyere vissza.",
    saved: "Mentve",
    error: "A mentés nem sikerült: {error}",
    save: "Mentés",
    cancel: "Mégse",
    delete: "Törlés",
    remove: "Eltávolítás",
    add: "Hozzáadás",
    test: "Kipróbálás",
    confirm_delete: "Törlöd: „{name}”?",
    none: "Nincs",
    all_areas: "Minden zóna",
    search: "Keresés",
    sec: "s",
    s_disarmed: "Hatástalanítva",
    s_armed_home: "Élesítve (otthon)",
    s_armed_away: "Élesítve (távol)",
    s_armed_night: "Élesítve (éjszaka)",
    s_armed_vacation: "Élesítve (szabadság)",
    s_armed_custom_bypass: "Élesítve (egyéni)",
    s_arming: "Kilépési késleltetés",
    s_pending: "Belépési késleltetés",
    s_triggered: "Riaszt",
    s_disarming: "Hatástalanítás",
    s_unavailable: "Nem elérhető",
    sub_ready: "Kész érzékelők: {n}",
    sub_blocking: "Nem kész: {names}",
    sub_since: "{time} óta",
    sub_triggered: "Ok: {names}",
    sub_none: "Nem található riasztó",
    m_disarm: "Hatástalanítás",
    m_armed_home: "Otthon",
    m_armed_away: "Távol",
    m_armed_night: "Éjszaka",
    m_armed_vacation: "Szabadság",
    m_armed_custom_bypass: "Egyéni",
    code_title: "Kód",
    code_hint: "A folytatáshoz add meg a kódot",
    modes: "Módok",
    modes_hint: "A bekapcsolt módok megjelennek a kártyákon és a parancsokban; mindegyiknek saját késleltetése van.",
    mode_off: "Kikapcsolva",
    mode_line: "Kilépés {exit} · Belépés {entry} · Riasztás {trigger}",
    unlimited: "korlátlan",
    exit_time: "Kilépési késleltetés",
    exit_time_hint: "Idő a távozásra az élesítés után",
    entry_time: "Belépési késleltetés",
    entry_time_hint: "Idő a hatástalanításra egy észlelés után",
    trigger_time: "Riasztás időtartama",
    trigger_time_hint: "0 = korlát nélkül",
    areas: "Zónák",
    add_area: "Zóna hozzáadása",
    area_name: "Név",
    area_line: "Érzékelők: {n}",
    delete_area: "Zóna törlése",
    behaviour: "Működés",
    master: "Fő riasztó",
    master_hint: "Egy entitás, amely az összes zónát együtt vezérli",
    master_name: "A fő riasztó neve",
    disarm_after_trigger: "Hatástalanítás riasztás után",
    disarm_after_trigger_hint: "Különben a riasztó visszatér az előző módba",
    ignore_blocking: "Blokkoló érzékelők figyelmen kívül hagyása riasztás után",
    ignore_blocking_hint: "Újra élesít, akkor is, ha érzékelők még nyitva vannak",
    mqtt: "MQTT",
    mqtt_hint: "Közzéteszi az állapotot és parancsokat fogad (billentyűzetek, fali panelek).",
    state_topic: "Állapot téma",
    command_topic: "Parancs téma",
    event_topic: "Esemény téma",
    require_code: "Kód szükséges",
    require_code_hint: "Az MQTT-parancsokhoz",
    sensors: "Érzékelők",
    no_sensors: "Még nincs érzékelő: adj hozzá lent.",
    st_ready: "Kész",
    st_open: "Akadályozza az élesítést",
    st_bypassed: "Kiiktatva",
    st_unavailable: "Nem elérhető",
    st_disabled: "Kikapcsolva",
    st_open_ok: "Nyitva engedélyezett",
    on: "Nyitva",
    off: "Zárva",
    type: "Típus",
    ty_door: "Ajtó",
    ty_window: "Ablak",
    ty_motion: "Mozgás",
    ty_tamper: "Szabotázs",
    ty_environmental: "Környezeti",
    ty_other: "Egyéb",
    area: "Zóna",
    group: "Csoport",
    sensor_modes: "Módok",
    sensor_modes_hint: "Az érzékelő ezekben a módokban figyel",
    use_exit_delay: "Kilépési késleltetés használata",
    use_entry_delay: "Belépési késleltetés használata",
    use_entry_delay_hint: "Különben azonnal riaszt",
    arm_on_close: "Élesítés záráskor",
    arm_on_close_hint: "Élesít, amikor az érzékelő a kilépési késleltetés alatt bezárul",
    allow_open: "Nyitva hagyás engedélyezése élesítéskor",
    auto_bypass: "Automatikus kiiktatás",
    auto_bypass_hint: "Ha élesítéskor nyitva van",
    trigger_unavailable: "Riasztás, ha nem elérhető",
    always_on: "Mindig aktív",
    always_on_hint: "Hatástalanítva is (füst, víz)",
    f_immediate: "Azonnali",
    f_entry: "Belépési késleltetés",
    f_always: "Mindig aktív",
    f_bypass: "Auto kiiktatás",
    f_unavailable: "Riaszt, ha nem elérhető",
    add_sensors: "Érzékelők hozzáadása",
    add_sensors_hint: "A riasztó által még nem használt entitások.",
    add_n: "Hozzáadás ({n})",
    no_candidates: "Minden érzékelő már a riasztóban van.",
    groups: "Érzékelőcsoportok",
    groups_hint: "Csak akkor riaszt, ha a csoport több érzékelője észlel az időablakon belül.",
    new_group: "Új csoport",
    group_line: "Események: {events} / {timeout} s · érzékelők: {n}",
    event_count: "Események",
    timeout: "Időablak",
    group_sensors: "Érzékelők",
    code_usage: "Kódok használata",
    code_arm_required: "Kód az élesítéshez",
    code_disarm_required: "Kód a hatástalanításhoz",
    code_mode_change_required: "Kód a módváltáshoz",
    code_mode_change_hint: "Élesítve → másik mód",
    code_format: "Kód formátuma",
    code_format_hint: "Számbillentyűzet vagy szabad szöveg",
    cf_number: "Szám",
    cf_text: "Szöveg",
    users: "Felhasználók",
    new_user: "Új felhasználó",
    user_name: "Név",
    code: "Kód",
    code_keep: "Hagyd üresen a megtartáshoz",
    old_code: "Jelenlegi kód",
    can_arm: "Élesíthet",
    can_disarm: "Hatástalaníthat",
    is_override_code: "Felülíró kód",
    is_override_code_hint: "Akkor is élesít, ha érzékelők nyitva vannak",
    area_limit: "Zónák",
    area_limit_hint: "Nincs kiválasztva: minden zóna",
    u_arm_disarm: "Élesít és hatástalanít",
    u_arm: "Csak élesít",
    u_disarm: "Csak hatástalanít",
    u_none: "Nincs jogosultság",
    u_override: "Felülíró",
    notifications: "Értesítések",
    new_notification: "Új értesítés",
    actions: "Műveletek",
    new_action: "Új művelet",
    no_notifications: "Még nincs értesítés.",
    no_actions: "Még nincs művelet.",
    name: "Név",
    event: "Esemény",
    ev_armed: "Élesítve",
    ev_disarmed: "Hatástalanítva",
    ev_triggered: "Riaszt",
    ev_untriggered: "Már nem riaszt",
    ev_arm_failure: "Sikertelen élesítés",
    ev_arming: "Kilépési késleltetés elindult",
    ev_pending: "Belépési késleltetés elindult",
    action_modes: "Módok",
    action_modes_hint: "Nincs kiválasztva: minden mód",
    target: "Cél",
    notif_title: "Cím",
    message: "Üzenet",
    message_hint: "Helyettesítők: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entitás",
    action: "Művelet",
    turn_on: "Bekapcsolás",
    turn_off: "Kikapcsolás",
    display: "A panel megjelenése",
    panel_title: "Cím az oldalsávban",
    hide_header: "Felső sáv elrejtése",
    hide_header_hint: "A lapok és a menügomb megmaradnak",
    hh_off: "Soha",
    hh_non_admin: "Nem rendszergazdák",
    hh_all: "Mindenki",
    panel_tabs: "Megjelenített lapok",
    sidebar_badge: "Jelvény az oldalsávban",
    sidebar_badge_hint: "Az élesítést akadályozó érzékelők; piros, ha a riasztó jelez",
    enabled: "Be",
    disabled: "Ki",
    alarm: "Riasztó",
    header_entity: "A fejlécben megjelenő riasztó",
    header_entity_auto: "Automatikus (Alarmo fő riasztó)",
    illustration_theme: "Az illusztráció témája",
    illustration_theme_hint: "Az Auto a Home Assistant témáját követi",
    th_auto: "Auto",
    th_day: "Nappal",
    th_night: "Éjszaka",
    admin_note: "Ez a panel csak rendszergazdáknak szól. Az Alarmo megőrzi a beállításokat: entitásai, kártyái és automatizálásai tovább működnek.",
    t_timeline: "Idővonal",
    all_rooms: "Minden helyiség",
    no_room: "Helyiség nélkül",
    tl_motion: "Mozgás",
    tl_clear: "Nyugalom",
    tl_detected: "Észlelve",
    tl_ok: "OK",
    tl_now: "most",
    tl_events: "Események",
    tl_tracked: "Követett érzékelők: {n}",
    tl_triggers: "Riasztások",
    tl_none: "Nincs",
    tl_calm: "Minden nyugodt",
    tl_most: "Legaktívabb",
    tl_times: "{n}×",
    tl_longest: "Leghosszabb nyitás",
    tl_alarm_at: "Riasztó: {state}",
    tl_last: "utolsó aktivitás {ago}",
    tl_no_activity: "Nincs aktivitás",
    tl_n_sensors: "Érzékelők: {n}",
    p_6h: "6 ó",
    p_24h: "24 ó",
    p_3d: "3 nap",
    tl_armed: "Élesített riasztó",
    tl_marks: "Késleltetés / riasztás",
    tl_by_room: "Aktivitás helyiségenként",
    tl_by_type: "Aktivitás érzékelőtípusonként",
    tl_by_sensor: "Aktivitás érzékelőnként",
    g_room: "Helyiségenként",
    g_type: "Típusonként",
    g_none: "Csoportosítás nélkül",
    so_label: "Rendezés",
    so_recent: "Legutóbbi aktivitás",
    so_count: "Legaktívabbak",
    so_name: "Név",
    tl_no_history: "Nincs előzmény erre az időszakra: be van kapcsolva a rögzítő?",
    tl_duration: "Időtartam: {d}",
  },
  sk: {
    title: "Alarm",
    t_general: "Všeobecné",
    t_sensors: "Senzory",
    t_codes: "Kódy",
    t_actions: "Akcie",
    t_settings: "Nastavenia",
    loading: "Načítava sa…",
    no_alarmo: "Alarmo nie je nainštalované",
    no_alarmo_hint: "Tento panel nastavuje Alarmo. Nainštalujte Alarmo z Marketplace, pridajte ho v Nastavenia → Zariadenia a služby a potom sa vráťte.",
    saved: "Uložené",
    error: "Uloženie zlyhalo: {error}",
    save: "Uložiť",
    cancel: "Zrušiť",
    delete: "Odstrániť",
    remove: "Odobrať",
    add: "Pridať",
    test: "Vyskúšať",
    confirm_delete: "Odstrániť „{name}“?",
    none: "Žiadne",
    all_areas: "Všetky zóny",
    search: "Hľadať",
    sec: "s",
    s_disarmed: "Deaktivovaný",
    s_armed_home: "Aktivovaný (doma)",
    s_armed_away: "Aktivovaný (preč)",
    s_armed_night: "Aktivovaný (noc)",
    s_armed_vacation: "Aktivovaný (dovolenka)",
    s_armed_custom_bypass: "Aktivovaný (vlastný)",
    s_arming: "Oneskorenie odchodu",
    s_pending: "Oneskorenie príchodu",
    s_triggered: "Spustený",
    s_disarming: "Deaktivácia",
    s_unavailable: "Nedostupný",
    sub_ready: "Pripravené senzory: {n}",
    sub_blocking: "Nepripravený: {names}",
    sub_since: "Od {time}",
    sub_triggered: "Príčina: {names}",
    sub_none: "Nenašiel sa žiadny alarm",
    m_disarm: "Deaktivovať",
    m_armed_home: "Doma",
    m_armed_away: "Preč",
    m_armed_night: "Noc",
    m_armed_vacation: "Dovolenka",
    m_armed_custom_bypass: "Vlastný",
    code_title: "Kód",
    code_hint: "Zadajte kód na pokračovanie",
    modes: "Režimy",
    modes_hint: "Zapnuté režimy sa zobrazujú na kartách a v príkazoch; každý má vlastné oneskorenia.",
    mode_off: "Vypnutý",
    mode_line: "Odchod {exit} · Príchod {entry} · Alarm {trigger}",
    unlimited: "neobmedzene",
    exit_time: "Oneskorenie odchodu",
    exit_time_hint: "Čas na odchod po aktivácii alarmu",
    entry_time: "Oneskorenie príchodu",
    entry_time_hint: "Čas na deaktiváciu po detekcii",
    trigger_time: "Trvanie alarmu",
    trigger_time_hint: "0 = bez obmedzenia",
    areas: "Zóny",
    add_area: "Pridať zónu",
    area_name: "Názov",
    area_line: "Senzory: {n}",
    delete_area: "Odstrániť zónu",
    behaviour: "Správanie",
    master: "Hlavný alarm",
    master_hint: "Jedna entita, ktorá ovláda všetky zóny naraz",
    master_name: "Názov hlavného alarmu",
    disarm_after_trigger: "Deaktivovať po spustení",
    disarm_after_trigger_hint: "Inak sa alarm vráti do predchádzajúceho režimu",
    ignore_blocking: "Ignorovať blokujúce senzory po spustení",
    ignore_blocking_hint: "Znovu aktivuje, aj keď sú senzory stále otvorené",
    mqtt: "MQTT",
    mqtt_hint: "Zverejňuje stav a prijíma príkazy (klávesnice, nástenné panely).",
    state_topic: "Téma stavu",
    command_topic: "Téma príkazov",
    event_topic: "Téma udalostí",
    require_code: "Vyžaduje sa kód",
    require_code_hint: "Pre príkazy MQTT",
    sensors: "Senzory",
    no_sensors: "Zatiaľ žiadne senzory: pridajte ich nižšie.",
    st_ready: "Pripravený",
    st_open: "Bráni aktivácii",
    st_bypassed: "Obídený",
    st_unavailable: "Nedostupný",
    st_disabled: "Vypnutý",
    st_open_ok: "Otvorený povolený",
    on: "Otvorené",
    off: "Zatvorené",
    type: "Typ",
    ty_door: "Dvere",
    ty_window: "Okno",
    ty_motion: "Pohyb",
    ty_tamper: "Sabotáž",
    ty_environmental: "Prostredie",
    ty_other: "Iné",
    area: "Zóna",
    group: "Skupina",
    sensor_modes: "Režimy",
    sensor_modes_hint: "Senzor stráži v týchto režimoch",
    use_exit_delay: "Použiť oneskorenie odchodu",
    use_entry_delay: "Použiť oneskorenie príchodu",
    use_entry_delay_hint: "Inak spustí okamžite",
    arm_on_close: "Aktivovať pri zatvorení",
    arm_on_close_hint: "Aktivuje, keď sa senzor zatvorí počas oneskorenia odchodu",
    allow_open: "Povoliť otvorený pri aktivácii",
    auto_bypass: "Automaticky obísť",
    auto_bypass_hint: "Ak je pri aktivácii otvorený",
    trigger_unavailable: "Spustiť pri nedostupnosti",
    always_on: "Vždy aktívny",
    always_on_hint: "Aj deaktivovaný (dym, voda)",
    f_immediate: "Okamžite",
    f_entry: "Oneskorenie príchodu",
    f_always: "Vždy aktívny",
    f_bypass: "Auto obídenie",
    f_unavailable: "Spustí pri nedostupnosti",
    add_sensors: "Pridať senzory",
    add_sensors_hint: "Entity, ktoré alarm ešte nepoužíva.",
    add_n: "Pridať ({n})",
    no_candidates: "Všetky senzory už sú v alarme.",
    groups: "Skupiny senzorov",
    groups_hint: "Spustí sa len vtedy, keď viac senzorov skupiny zachytí v časovom okne.",
    new_group: "Nová skupina",
    group_line: "Udalosti: {events} za {timeout} s · senzory: {n}",
    event_count: "Udalosti",
    timeout: "Časové okno",
    group_sensors: "Senzory",
    code_usage: "Používanie kódov",
    code_arm_required: "Kód na aktiváciu",
    code_disarm_required: "Kód na deaktiváciu",
    code_mode_change_required: "Kód na zmenu režimu",
    code_mode_change_hint: "Aktivovaný → iný režim",
    code_format: "Formát kódu",
    code_format_hint: "Číselná klávesnica alebo voľný text",
    cf_number: "Čísla",
    cf_text: "Text",
    users: "Používatelia",
    new_user: "Nový používateľ",
    user_name: "Meno",
    code: "Kód",
    code_keep: "Nechajte prázdne na zachovanie",
    old_code: "Súčasný kód",
    can_arm: "Môže aktivovať",
    can_disarm: "Môže deaktivovať",
    is_override_code: "Prioritný kód",
    is_override_code_hint: "Aktivuje aj pri otvorených senzoroch",
    area_limit: "Zóny",
    area_limit_hint: "Nič nevybraté: všetky zóny",
    u_arm_disarm: "Aktivuje a deaktivuje",
    u_arm: "Len aktivuje",
    u_disarm: "Len deaktivuje",
    u_none: "Bez práv",
    u_override: "Prioritný",
    notifications: "Upozornenia",
    new_notification: "Nové upozornenie",
    actions: "Akcie",
    new_action: "Nová akcia",
    no_notifications: "Zatiaľ žiadne upozornenia.",
    no_actions: "Zatiaľ žiadne akcie.",
    name: "Názov",
    event: "Udalosť",
    ev_armed: "Aktivovaný",
    ev_disarmed: "Deaktivovaný",
    ev_triggered: "Spustený",
    ev_untriggered: "Už nie je spustený",
    ev_arm_failure: "Aktivácia zlyhala",
    ev_arming: "Začalo oneskorenie odchodu",
    ev_pending: "Začalo oneskorenie príchodu",
    action_modes: "Režimy",
    action_modes_hint: "Nič nevybraté: všetky režimy",
    target: "Cieľ",
    notif_title: "Nadpis",
    message: "Správa",
    message_hint: "Zástupné znaky: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entita",
    action: "Akcia",
    turn_on: "Zapnúť",
    turn_off: "Vypnúť",
    display: "Zobrazenie panela",
    panel_title: "Názov v bočnom paneli",
    hide_header: "Skryť horný pruh",
    hide_header_hint: "Záložky a tlačidlo ponuky zostávajú",
    hh_off: "Nikdy",
    hh_non_admin: "Neadministrátori",
    hh_all: "Všetci",
    panel_tabs: "Zobrazené záložky",
    sidebar_badge: "Odznak v bočnom paneli",
    sidebar_badge_hint: "Senzory, ktoré bránia aktivácii; červený, keď je alarm spustený",
    enabled: "Zap.",
    disabled: "Vyp.",
    alarm: "Alarm",
    header_entity: "Alarm zobrazený v hlavičke",
    header_entity_auto: "Automaticky (hlavný Alarmo)",
    illustration_theme: "Téma ilustrácie",
    illustration_theme_hint: "Auto sleduje tému Home Assistant",
    th_auto: "Auto",
    th_day: "Deň",
    th_night: "Noc",
    admin_note: "Tento panel je určený administrátorom. Alarmo uchováva nastavenia: jeho entity, karty a automatizácie naďalej fungujú.",
    t_timeline: "Časová os",
    all_rooms: "Všetky miestnosti",
    no_room: "Bez miestnosti",
    tl_motion: "Pohyb",
    tl_clear: "Pokoj",
    tl_detected: "Zistené",
    tl_ok: "OK",
    tl_now: "teraz",
    tl_events: "Udalosti",
    tl_tracked: "Sledované senzory: {n}",
    tl_triggers: "Spustenia",
    tl_none: "Žiadne",
    tl_calm: "Všetko pokojné",
    tl_most: "Najaktívnejší",
    tl_times: "{n}×",
    tl_longest: "Najdlhšie otvorenie",
    tl_alarm_at: "Alarm: {state}",
    tl_last: "posledná aktivita {ago}",
    tl_no_activity: "Žiadna aktivita",
    tl_n_sensors: "Senzory: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 dni",
    tl_armed: "Alarm aktivovaný",
    tl_marks: "Oneskorenie / spustenie",
    tl_by_room: "Aktivita podľa miestnosti",
    tl_by_type: "Aktivita podľa typu senzora",
    tl_by_sensor: "Aktivita podľa senzora",
    g_room: "Podľa miestnosti",
    g_type: "Podľa typu",
    g_none: "Bez zoskupenia",
    so_label: "Zoradenie",
    so_recent: "Nedávna aktivita",
    so_count: "Najaktívnejšie",
    so_name: "Názov",
    tl_no_history: "Žiadna história za toto obdobie: je zapisovač zapnutý?",
    tl_duration: "Trvanie: {d}",
  },
  cs: {
    title: "Alarm",
    t_general: "Obecné",
    t_sensors: "Senzory",
    t_codes: "Kódy",
    t_actions: "Akce",
    t_settings: "Nastavení",
    loading: "Načítání…",
    no_alarmo: "Alarmo není nainstalováno",
    no_alarmo_hint: "Tento panel nastavuje Alarmo. Nainstalujte Alarmo z Marketplace, přidejte ho v Nastavení → Zařízení a služby a pak se vraťte.",
    saved: "Uloženo",
    error: "Uložení se nezdařilo: {error}",
    save: "Uložit",
    cancel: "Zrušit",
    delete: "Smazat",
    remove: "Odebrat",
    add: "Přidat",
    test: "Vyzkoušet",
    confirm_delete: "Smazat „{name}“?",
    none: "Žádné",
    all_areas: "Všechny zóny",
    search: "Hledat",
    sec: "s",
    s_disarmed: "Deaktivován",
    s_armed_home: "Aktivován (doma)",
    s_armed_away: "Aktivován (pryč)",
    s_armed_night: "Aktivován (noc)",
    s_armed_vacation: "Aktivován (dovolená)",
    s_armed_custom_bypass: "Aktivován (vlastní)",
    s_arming: "Zpoždění odchodu",
    s_pending: "Zpoždění příchodu",
    s_triggered: "Spuštěn",
    s_disarming: "Deaktivace",
    s_unavailable: "Nedostupný",
    sub_ready: "Připravené senzory: {n}",
    sub_blocking: "Nepřipraven: {names}",
    sub_since: "Od {time}",
    sub_triggered: "Příčina: {names}",
    sub_none: "Nebyl nalezen žádný alarm",
    m_disarm: "Deaktivovat",
    m_armed_home: "Doma",
    m_armed_away: "Pryč",
    m_armed_night: "Noc",
    m_armed_vacation: "Dovolená",
    m_armed_custom_bypass: "Vlastní",
    code_title: "Kód",
    code_hint: "Zadejte kód pro pokračování",
    modes: "Režimy",
    modes_hint: "Zapnuté režimy se zobrazují na kartách a v příkazech; každý má vlastní zpoždění.",
    mode_off: "Vypnutý",
    mode_line: "Odchod {exit} · Příchod {entry} · Alarm {trigger}",
    unlimited: "neomezeně",
    exit_time: "Zpoždění odchodu",
    exit_time_hint: "Čas na odchod po aktivaci alarmu",
    entry_time: "Zpoždění příchodu",
    entry_time_hint: "Čas na deaktivaci po detekci",
    trigger_time: "Délka alarmu",
    trigger_time_hint: "0 = bez omezení",
    areas: "Zóny",
    add_area: "Přidat zónu",
    area_name: "Název",
    area_line: "Senzory: {n}",
    delete_area: "Smazat zónu",
    behaviour: "Chování",
    master: "Hlavní alarm",
    master_hint: "Jedna entita, která ovládá všechny zóny najednou",
    master_name: "Název hlavního alarmu",
    disarm_after_trigger: "Deaktivovat po spuštění",
    disarm_after_trigger_hint: "Jinak se alarm vrátí do předchozího režimu",
    ignore_blocking: "Ignorovat blokující senzory po spuštění",
    ignore_blocking_hint: "Znovu aktivuje, i když jsou senzory stále otevřené",
    mqtt: "MQTT",
    mqtt_hint: "Zveřejňuje stav a přijímá příkazy (klávesnice, nástěnné panely).",
    state_topic: "Téma stavu",
    command_topic: "Téma příkazů",
    event_topic: "Téma událostí",
    require_code: "Vyžadován kód",
    require_code_hint: "Pro příkazy MQTT",
    sensors: "Senzory",
    no_sensors: "Zatím žádné senzory: přidejte je níže.",
    st_ready: "Připraven",
    st_open: "Brání aktivaci",
    st_bypassed: "Obejit",
    st_unavailable: "Nedostupný",
    st_disabled: "Vypnutý",
    st_open_ok: "Otevřený povolen",
    on: "Otevřeno",
    off: "Zavřeno",
    type: "Typ",
    ty_door: "Dveře",
    ty_window: "Okno",
    ty_motion: "Pohyb",
    ty_tamper: "Sabotáž",
    ty_environmental: "Prostředí",
    ty_other: "Jiné",
    area: "Zóna",
    group: "Skupina",
    sensor_modes: "Režimy",
    sensor_modes_hint: "Senzor hlídá v těchto režimech",
    use_exit_delay: "Použít zpoždění odchodu",
    use_entry_delay: "Použít zpoždění příchodu",
    use_entry_delay_hint: "Jinak spustí okamžitě",
    arm_on_close: "Aktivovat při zavření",
    arm_on_close_hint: "Aktivuje, když se senzor zavře během zpoždění odchodu",
    allow_open: "Povolit otevřený při aktivaci",
    auto_bypass: "Automaticky obejít",
    auto_bypass_hint: "Pokud je při aktivaci otevřený",
    trigger_unavailable: "Spustit při nedostupnosti",
    always_on: "Vždy aktivní",
    always_on_hint: "I deaktivovaný (kouř, voda)",
    f_immediate: "Okamžitě",
    f_entry: "Zpoždění příchodu",
    f_always: "Vždy aktivní",
    f_bypass: "Auto obejití",
    f_unavailable: "Spustí při nedostupnosti",
    add_sensors: "Přidat senzory",
    add_sensors_hint: "Entity, které alarm zatím nepoužívá.",
    add_n: "Přidat ({n})",
    no_candidates: "Všechny senzory už jsou v alarmu.",
    groups: "Skupiny senzorů",
    groups_hint: "Spustí se jen tehdy, když více senzorů skupiny zachytí v časovém okně.",
    new_group: "Nová skupina",
    group_line: "Události: {events} za {timeout} s · senzory: {n}",
    event_count: "Události",
    timeout: "Časové okno",
    group_sensors: "Senzory",
    code_usage: "Používání kódů",
    code_arm_required: "Kód pro aktivaci",
    code_disarm_required: "Kód pro deaktivaci",
    code_mode_change_required: "Kód pro změnu režimu",
    code_mode_change_hint: "Aktivován → jiný režim",
    code_format: "Formát kódu",
    code_format_hint: "Číselná klávesnice nebo volný text",
    cf_number: "Čísla",
    cf_text: "Text",
    users: "Uživatelé",
    new_user: "Nový uživatel",
    user_name: "Jméno",
    code: "Kód",
    code_keep: "Nechte prázdné pro zachování",
    old_code: "Současný kód",
    can_arm: "Může aktivovat",
    can_disarm: "Může deaktivovat",
    is_override_code: "Prioritní kód",
    is_override_code_hint: "Aktivuje i při otevřených senzorech",
    area_limit: "Zóny",
    area_limit_hint: "Nic nevybráno: všechny zóny",
    u_arm_disarm: "Aktivuje i deaktivuje",
    u_arm: "Jen aktivuje",
    u_disarm: "Jen deaktivuje",
    u_none: "Bez práv",
    u_override: "Prioritní",
    notifications: "Oznámení",
    new_notification: "Nové oznámení",
    actions: "Akce",
    new_action: "Nová akce",
    no_notifications: "Zatím žádná oznámení.",
    no_actions: "Zatím žádné akce.",
    name: "Název",
    event: "Událost",
    ev_armed: "Aktivován",
    ev_disarmed: "Deaktivován",
    ev_triggered: "Spuštěn",
    ev_untriggered: "Už není spuštěn",
    ev_arm_failure: "Aktivace selhala",
    ev_arming: "Začalo zpoždění odchodu",
    ev_pending: "Začalo zpoždění příchodu",
    action_modes: "Režimy",
    action_modes_hint: "Nic nevybráno: všechny režimy",
    target: "Cíl",
    notif_title: "Nadpis",
    message: "Zpráva",
    message_hint: "Zástupné znaky: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entita",
    action: "Akce",
    turn_on: "Zapnout",
    turn_off: "Vypnout",
    display: "Zobrazení panelu",
    panel_title: "Název v postranním panelu",
    hide_header: "Skrýt horní lištu",
    hide_header_hint: "Záložky a tlačítko nabídky zůstávají",
    hh_off: "Nikdy",
    hh_non_admin: "Neadministrátoři",
    hh_all: "Všichni",
    panel_tabs: "Zobrazené záložky",
    sidebar_badge: "Odznak v postranním panelu",
    sidebar_badge_hint: "Senzory, které brání aktivaci; červený, když je alarm spuštěn",
    enabled: "Zap.",
    disabled: "Vyp.",
    alarm: "Alarm",
    header_entity: "Alarm zobrazený v záhlaví",
    header_entity_auto: "Automaticky (hlavní Alarmo)",
    illustration_theme: "Téma ilustrace",
    illustration_theme_hint: "Auto sleduje téma Home Assistant",
    th_auto: "Auto",
    th_day: "Den",
    th_night: "Noc",
    admin_note: "Tento panel je určen administrátorům. Alarmo uchovává nastavení: jeho entity, karty a automatizace nadále fungují.",
    t_timeline: "Časová osa",
    all_rooms: "Všechny místnosti",
    no_room: "Bez místnosti",
    tl_motion: "Pohyb",
    tl_clear: "Klid",
    tl_detected: "Zjištěno",
    tl_ok: "OK",
    tl_now: "nyní",
    tl_events: "Události",
    tl_tracked: "Sledované senzory: {n}",
    tl_triggers: "Spuštění",
    tl_none: "Žádné",
    tl_calm: "Vše v klidu",
    tl_most: "Nejaktivnější",
    tl_times: "{n}×",
    tl_longest: "Nejdelší otevření",
    tl_alarm_at: "Alarm: {state}",
    tl_last: "poslední aktivita {ago}",
    tl_no_activity: "Žádná aktivita",
    tl_n_sensors: "Senzory: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 dny",
    tl_armed: "Alarm aktivován",
    tl_marks: "Zpoždění / spuštění",
    tl_by_room: "Aktivita podle místnosti",
    tl_by_type: "Aktivita podle typu senzoru",
    tl_by_sensor: "Aktivita podle senzoru",
    g_room: "Podle místnosti",
    g_type: "Podle typu",
    g_none: "Bez seskupení",
    so_label: "Řazení",
    so_recent: "Nedávná aktivita",
    so_count: "Nejaktivnější",
    so_name: "Název",
    tl_no_history: "Žádná historie za toto období: je záznam zapnutý?",
    tl_duration: "Trvání: {d}",
  },
  sl: {
    title: "Alarm",
    t_general: "Splošno",
    t_sensors: "Senzorji",
    t_codes: "Kode",
    t_actions: "Dejanja",
    t_settings: "Nastavitve",
    loading: "Nalaganje…",
    no_alarmo: "Alarmo ni nameščen",
    no_alarmo_hint: "Ta plošča nastavlja Alarmo. Namestite Alarmo iz Marketplace, ga dodajte v Nastavitve → Naprave in storitve, nato se vrnite.",
    saved: "Shranjeno",
    error: "Shranjevanje ni uspelo: {error}",
    save: "Shrani",
    cancel: "Prekliči",
    delete: "Izbriši",
    remove: "Odstrani",
    add: "Dodaj",
    test: "Preizkusi",
    confirm_delete: "Izbrišem »{name}«?",
    none: "Brez",
    all_areas: "Vsa območja",
    search: "Iskanje",
    sec: "s",
    s_disarmed: "Izklopljen",
    s_armed_home: "Vklopljen (doma)",
    s_armed_away: "Vklopljen (odsoten)",
    s_armed_night: "Vklopljen (noč)",
    s_armed_vacation: "Vklopljen (dopust)",
    s_armed_custom_bypass: "Vklopljen (po meri)",
    s_arming: "Zakasnitev odhoda",
    s_pending: "Zakasnitev prihoda",
    s_triggered: "Sprožen",
    s_disarming: "Izklapljanje",
    s_unavailable: "Ni na voljo",
    sub_ready: "Pripravljeni senzorji: {n}",
    sub_blocking: "Ni pripravljen: {names}",
    sub_since: "Od {time}",
    sub_triggered: "Vzrok: {names}",
    sub_none: "Ni najdenega alarma",
    m_disarm: "Izklopi",
    m_armed_home: "Doma",
    m_armed_away: "Odsoten",
    m_armed_night: "Noč",
    m_armed_vacation: "Dopust",
    m_armed_custom_bypass: "Po meri",
    code_title: "Koda",
    code_hint: "Vnesite kodo za nadaljevanje",
    modes: "Načini",
    modes_hint: "Vklopljeni načini so prikazani na karticah in v ukazih; vsak ima svoje zakasnitve.",
    mode_off: "Izklopljen",
    mode_line: "Odhod {exit} · Prihod {entry} · Alarm {trigger}",
    unlimited: "neomejeno",
    exit_time: "Zakasnitev odhoda",
    exit_time_hint: "Čas za odhod, ko je alarm vklopljen",
    entry_time: "Zakasnitev prihoda",
    entry_time_hint: "Čas za izklop po zaznavi",
    trigger_time: "Trajanje alarma",
    trigger_time_hint: "0 = brez omejitve",
    areas: "Območja",
    add_area: "Dodaj območje",
    area_name: "Ime",
    area_line: "Senzorji: {n}",
    delete_area: "Izbriši območje",
    behaviour: "Vedenje",
    master: "Glavni alarm",
    master_hint: "Ena entiteta, ki upravlja vsa območja skupaj",
    master_name: "Ime glavnega alarma",
    disarm_after_trigger: "Izklopi po sprožitvi",
    disarm_after_trigger_hint: "Sicer se alarm vrne v prejšnji način",
    ignore_blocking: "Prezri blokirne senzorje po sprožitvi",
    ignore_blocking_hint: "Znova vklopi, tudi če so senzorji še odprti",
    mqtt: "MQTT",
    mqtt_hint: "Objavlja stanje in sprejema ukaze (tipkovnice, stenske plošče).",
    state_topic: "Tema stanja",
    command_topic: "Tema ukazov",
    event_topic: "Tema dogodkov",
    require_code: "Koda je obvezna",
    require_code_hint: "Za ukaze MQTT",
    sensors: "Senzorji",
    no_sensors: "Še ni senzorjev: dodajte jih spodaj.",
    st_ready: "Pripravljen",
    st_open: "Preprečuje vklop",
    st_bypassed: "Obiden",
    st_unavailable: "Ni na voljo",
    st_disabled: "Izklopljen",
    st_open_ok: "Odprto dovoljeno",
    on: "Odprto",
    off: "Zaprto",
    type: "Vrsta",
    ty_door: "Vrata",
    ty_window: "Okno",
    ty_motion: "Gibanje",
    ty_tamper: "Sabotaža",
    ty_environmental: "Okolje",
    ty_other: "Drugo",
    area: "Območje",
    group: "Skupina",
    sensor_modes: "Načini",
    sensor_modes_hint: "Senzor nadzira v teh načinih",
    use_exit_delay: "Uporabi zakasnitev odhoda",
    use_entry_delay: "Uporabi zakasnitev prihoda",
    use_entry_delay_hint: "Sicer sproži takoj",
    arm_on_close: "Vklopi ob zaprtju",
    arm_on_close_hint: "Vklopi, ko se senzor zapre med zakasnitvijo odhoda",
    allow_open: "Dovoli odprto ob vklopu",
    auto_bypass: "Samodejno obidi",
    auto_bypass_hint: "Če je ob vklopu odprt",
    trigger_unavailable: "Sproži, ko ni na voljo",
    always_on: "Vedno aktiven",
    always_on_hint: "Tudi izklopljen (dim, voda)",
    f_immediate: "Takoj",
    f_entry: "Zakasnitev prihoda",
    f_always: "Vedno aktiven",
    f_bypass: "Samodejni obhod",
    f_unavailable: "Sproži, ko ni na voljo",
    add_sensors: "Dodaj senzorje",
    add_sensors_hint: "Entitete, ki jih alarm še ne uporablja.",
    add_n: "Dodaj ({n})",
    no_candidates: "Vsi senzorji so že v alarmu.",
    groups: "Skupine senzorjev",
    groups_hint: "Sproži le, če več senzorjev skupine zazna v časovnem oknu.",
    new_group: "Nova skupina",
    group_line: "Dogodki: {events} v {timeout} s · senzorji: {n}",
    event_count: "Dogodki",
    timeout: "Časovno okno",
    group_sensors: "Senzorji",
    code_usage: "Uporaba kod",
    code_arm_required: "Koda za vklop",
    code_disarm_required: "Koda za izklop",
    code_mode_change_required: "Koda za spremembo načina",
    code_mode_change_hint: "Vklopljen → drug način",
    code_format: "Oblika kode",
    code_format_hint: "Številčna tipkovnica ali prosto besedilo",
    cf_number: "Številke",
    cf_text: "Besedilo",
    users: "Uporabniki",
    new_user: "Nov uporabnik",
    user_name: "Ime",
    code: "Koda",
    code_keep: "Pustite prazno, da jo ohranite",
    old_code: "Trenutna koda",
    can_arm: "Lahko vklopi",
    can_disarm: "Lahko izklopi",
    is_override_code: "Prednostna koda",
    is_override_code_hint: "Vklopi tudi pri odprtih senzorjih",
    area_limit: "Območja",
    area_limit_hint: "Nič izbrano: vsa območja",
    u_arm_disarm: "Vklaplja in izklaplja",
    u_arm: "Samo vklaplja",
    u_disarm: "Samo izklaplja",
    u_none: "Brez pravic",
    u_override: "Prednostna",
    notifications: "Obvestila",
    new_notification: "Novo obvestilo",
    actions: "Dejanja",
    new_action: "Novo dejanje",
    no_notifications: "Še ni obvestil.",
    no_actions: "Še ni dejanj.",
    name: "Ime",
    event: "Dogodek",
    ev_armed: "Vklopljen",
    ev_disarmed: "Izklopljen",
    ev_triggered: "Sprožen",
    ev_untriggered: "Ni več sprožen",
    ev_arm_failure: "Vklop ni uspel",
    ev_arming: "Začela se je zakasnitev odhoda",
    ev_pending: "Začela se je zakasnitev prihoda",
    action_modes: "Načini",
    action_modes_hint: "Nič izbrano: vsi načini",
    target: "Cilj",
    notif_title: "Naslov",
    message: "Sporočilo",
    message_hint: "Nadomestne oznake: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Entiteta",
    action: "Dejanje",
    turn_on: "Vklopi",
    turn_off: "Izklopi",
    display: "Prikaz plošče",
    panel_title: "Naslov v stranski vrstici",
    hide_header: "Skrij zgornjo vrstico",
    hide_header_hint: "Zavihki in gumb menija ostanejo",
    hh_off: "Nikoli",
    hh_non_admin: "Neskrbniki",
    hh_all: "Vsi",
    panel_tabs: "Prikazani zavihki",
    sidebar_badge: "Značka v stranski vrstici",
    sidebar_badge_hint: "Senzorji, ki preprečujejo vklop; rdeča, ko je alarm sprožen",
    enabled: "Vkl.",
    disabled: "Izkl.",
    alarm: "Alarm",
    header_entity: "Alarm v glavi",
    header_entity_auto: "Samodejno (glavni Alarmo)",
    illustration_theme: "Tema ilustracije",
    illustration_theme_hint: "Samodejno sledi temi Home Assistant",
    th_auto: "Samodejno",
    th_day: "Dan",
    th_night: "Noč",
    admin_note: "Ta plošča je namenjena skrbnikom. Alarmo hrani nastavitve: njegove entitete, kartice in avtomatizacije še naprej delujejo.",
    t_timeline: "Časovnica",
    all_rooms: "Vsi prostori",
    no_room: "Brez prostora",
    tl_motion: "Gibanje",
    tl_clear: "Mirno",
    tl_detected: "Zaznano",
    tl_ok: "OK",
    tl_now: "zdaj",
    tl_events: "Dogodki",
    tl_tracked: "Spremljani senzorji: {n}",
    tl_triggers: "Sprožitve",
    tl_none: "Brez",
    tl_calm: "Vse mirno",
    tl_most: "Najbolj dejaven",
    tl_times: "{n}×",
    tl_longest: "Najdaljše odprtje",
    tl_alarm_at: "Alarm: {state}",
    tl_last: "zadnja dejavnost {ago}",
    tl_no_activity: "Brez dejavnosti",
    tl_n_sensors: "Senzorji: {n}",
    p_6h: "6 h",
    p_24h: "24 h",
    p_3d: "3 dni",
    tl_armed: "Alarm vklopljen",
    tl_marks: "Zakasnitev / sprožitev",
    tl_by_room: "Dejavnost po prostorih",
    tl_by_type: "Dejavnost po vrsti senzorja",
    tl_by_sensor: "Dejavnost po senzorjih",
    g_room: "Po prostorih",
    g_type: "Po vrsti",
    g_none: "Brez združevanja",
    so_label: "Razvrščanje",
    so_recent: "Nedavna dejavnost",
    so_count: "Najbolj dejavni",
    so_name: "Ime",
    tl_no_history: "Za to obdobje ni zgodovine: je snemalnik vklopljen?",
    tl_duration: "Trajanje: {d}",
  },
  lv: {
    title: "Signalizācija",
    t_general: "Vispārīgi",
    t_sensors: "Sensori",
    t_codes: "Kodi",
    t_actions: "Darbības",
    t_settings: "Iestatījumi",
    loading: "Ielādē…",
    no_alarmo: "Alarmo nav instalēts",
    no_alarmo_hint: "Šis panelis iestata Alarmo. Instalējiet Alarmo no Marketplace, pievienojiet to sadaļā Iestatījumi → Ierīces un pakalpojumi un atgriezieties.",
    saved: "Saglabāts",
    error: "Neizdevās saglabāt: {error}",
    save: "Saglabāt",
    cancel: "Atcelt",
    delete: "Dzēst",
    remove: "Noņemt",
    add: "Pievienot",
    test: "Izmēģināt",
    confirm_delete: "Dzēst “{name}”?",
    none: "Nav",
    all_areas: "Visas zonas",
    search: "Meklēt",
    sec: "s",
    s_disarmed: "Izslēgta",
    s_armed_home: "Ieslēgta (mājās)",
    s_armed_away: "Ieslēgta (prom)",
    s_armed_night: "Ieslēgta (nakts)",
    s_armed_vacation: "Ieslēgta (atvaļinājums)",
    s_armed_custom_bypass: "Ieslēgta (pielāgots)",
    s_arming: "Izejas aizture",
    s_pending: "Ieejas aizture",
    s_triggered: "Nostrādājusi",
    s_disarming: "Izslēdz",
    s_unavailable: "Nav pieejama",
    sub_ready: "Gatavi sensori: {n}",
    sub_blocking: "Nav gatava: {names}",
    sub_since: "Kopš {time}",
    sub_triggered: "Iemesls: {names}",
    sub_none: "Signalizācija nav atrasta",
    m_disarm: "Izslēgt",
    m_armed_home: "Mājās",
    m_armed_away: "Prom",
    m_armed_night: "Nakts",
    m_armed_vacation: "Atvaļinājums",
    m_armed_custom_bypass: "Pielāgots",
    code_title: "Kods",
    code_hint: "Ievadiet kodu, lai turpinātu",
    modes: "Režīmi",
    modes_hint: "Ieslēgtie režīmi tiek rādīti kartītēs un komandās; katram ir savas aiztures.",
    mode_off: "Izslēgts",
    mode_line: "Izeja {exit} · Ieeja {entry} · Trauksme {trigger}",
    unlimited: "neierobežoti",
    exit_time: "Izejas aizture",
    exit_time_hint: "Laiks, lai aizietu pēc signalizācijas ieslēgšanas",
    entry_time: "Ieejas aizture",
    entry_time_hint: "Laiks izslēgšanai pēc noteikšanas",
    trigger_time: "Trauksmes ilgums",
    trigger_time_hint: "0 = bez ierobežojuma",
    areas: "Zonas",
    add_area: "Pievienot zonu",
    area_name: "Nosaukums",
    area_line: "Sensori: {n}",
    delete_area: "Dzēst zonu",
    behaviour: "Darbība",
    master: "Galvenā signalizācija",
    master_hint: "Viena vienība, kas vada visas zonas kopā",
    master_name: "Galvenās signalizācijas nosaukums",
    disarm_after_trigger: "Izslēgt pēc nostrādāšanas",
    disarm_after_trigger_hint: "Citādi signalizācija atgriežas iepriekšējā režīmā",
    ignore_blocking: "Ignorēt bloķējošos sensorus pēc nostrādāšanas",
    ignore_blocking_hint: "Ieslēdzas atkal, pat ja sensori vēl ir atvērti",
    mqtt: "MQTT",
    mqtt_hint: "Publicē stāvokli un pieņem komandas (tastatūras, sienas paneļi).",
    state_topic: "Stāvokļa tēma",
    command_topic: "Komandu tēma",
    event_topic: "Notikumu tēma",
    require_code: "Nepieciešams kods",
    require_code_hint: "MQTT komandām",
    sensors: "Sensori",
    no_sensors: "Vēl nav sensoru: pievienojiet tos zemāk.",
    st_ready: "Gatavs",
    st_open: "Neļauj ieslēgt",
    st_bypassed: "Apiets",
    st_unavailable: "Nav pieejams",
    st_disabled: "Izslēgts",
    st_open_ok: "Atvērts atļauts",
    on: "Atvērts",
    off: "Aizvērts",
    type: "Tips",
    ty_door: "Durvis",
    ty_window: "Logs",
    ty_motion: "Kustība",
    ty_tamper: "Sabotāža",
    ty_environmental: "Vide",
    ty_other: "Cits",
    area: "Zona",
    group: "Grupa",
    sensor_modes: "Režīmi",
    sensor_modes_hint: "Sensors uzrauga šajos režīmos",
    use_exit_delay: "Izmantot izejas aizturi",
    use_entry_delay: "Izmantot ieejas aizturi",
    use_entry_delay_hint: "Citādi nostrādā uzreiz",
    arm_on_close: "Ieslēgt pie aizvēršanas",
    arm_on_close_hint: "Ieslēdz, kad sensors aizveras izejas aiztures laikā",
    allow_open: "Atļaut atvērtu ieslēgšanas brīdī",
    auto_bypass: "Apiet automātiski",
    auto_bypass_hint: "Ja ieslēgšanas brīdī tas ir atvērts",
    trigger_unavailable: "Nostrādāt, ja nav pieejams",
    always_on: "Vienmēr aktīvs",
    always_on_hint: "Arī izslēgtā stāvoklī (dūmi, ūdens)",
    f_immediate: "Uzreiz",
    f_entry: "Ieejas aizture",
    f_always: "Vienmēr aktīvs",
    f_bypass: "Auto apiešana",
    f_unavailable: "Nostrādā, ja nav pieejams",
    add_sensors: "Pievienot sensorus",
    add_sensors_hint: "Vienības, ko signalizācija vēl neizmanto.",
    add_n: "Pievienot ({n})",
    no_candidates: "Visi sensori jau ir signalizācijā.",
    groups: "Sensoru grupas",
    groups_hint: "Nostrādā tikai tad, ja vairāki grupas sensori konstatē laika logā.",
    new_group: "Jauna grupa",
    group_line: "Notikumi: {events} {timeout} s laikā · sensori: {n}",
    event_count: "Notikumi",
    timeout: "Laika logs",
    group_sensors: "Sensori",
    code_usage: "Kodu izmantošana",
    code_arm_required: "Kods ieslēgšanai",
    code_disarm_required: "Kods izslēgšanai",
    code_mode_change_required: "Kods režīma maiņai",
    code_mode_change_hint: "Ieslēgta → cits režīms",
    code_format: "Koda formāts",
    code_format_hint: "Ciparu tastatūra vai brīvs teksts",
    cf_number: "Cipari",
    cf_text: "Teksts",
    users: "Lietotāji",
    new_user: "Jauns lietotājs",
    user_name: "Vārds",
    code: "Kods",
    code_keep: "Atstājiet tukšu, lai saglabātu",
    old_code: "Pašreizējais kods",
    can_arm: "Var ieslēgt",
    can_disarm: "Var izslēgt",
    is_override_code: "Prioritārais kods",
    is_override_code_hint: "Ieslēdz pat ar atvērtiem sensoriem",
    area_limit: "Zonas",
    area_limit_hint: "Nekas nav atlasīts: visas zonas",
    u_arm_disarm: "Ieslēdz un izslēdz",
    u_arm: "Tikai ieslēdz",
    u_disarm: "Tikai izslēdz",
    u_none: "Nav tiesību",
    u_override: "Prioritārais",
    notifications: "Paziņojumi",
    new_notification: "Jauns paziņojums",
    actions: "Darbības",
    new_action: "Jauna darbība",
    no_notifications: "Vēl nav paziņojumu.",
    no_actions: "Vēl nav darbību.",
    name: "Nosaukums",
    event: "Notikums",
    ev_armed: "Ieslēgta",
    ev_disarmed: "Izslēgta",
    ev_triggered: "Nostrādājusi",
    ev_untriggered: "Vairs nav nostrādājusi",
    ev_arm_failure: "Ieslēgšana neizdevās",
    ev_arming: "Sākusies izejas aizture",
    ev_pending: "Sākusies ieejas aizture",
    action_modes: "Režīmi",
    action_modes_hint: "Nekas nav atlasīts: visi režīmi",
    target: "Mērķis",
    notif_title: "Virsraksts",
    message: "Ziņojums",
    message_hint: "Aizstājēji: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Vienība",
    action: "Darbība",
    turn_on: "Ieslēgt",
    turn_off: "Izslēgt",
    display: "Paneļa attēlojums",
    panel_title: "Virsraksts sānjoslā",
    hide_header: "Paslēpt augšējo joslu",
    hide_header_hint: "Cilnes un izvēlnes poga paliek",
    hh_off: "Nekad",
    hh_non_admin: "Ne-administratori",
    hh_all: "Visi",
    panel_tabs: "Rādītās cilnes",
    sidebar_badge: "Žetons sānjoslā",
    sidebar_badge_hint: "Sensori, kas neļauj ieslēgt; sarkans, kad signalizācija nostrādājusi",
    enabled: "Iesl.",
    disabled: "Izsl.",
    alarm: "Signalizācija",
    header_entity: "Galvenē rādītā signalizācija",
    header_entity_auto: "Automātiski (Alarmo galvenā)",
    illustration_theme: "Ilustrācijas tēma",
    illustration_theme_hint: "Auto seko Home Assistant tēmai",
    th_auto: "Auto",
    th_day: "Diena",
    th_night: "Nakts",
    admin_note: "Šis panelis paredzēts administratoriem. Alarmo glabā iestatījumus: tā vienības, kartītes un automatizācijas turpina darboties.",
    t_timeline: "Laika josla",
    all_rooms: "Visas telpas",
    no_room: "Bez telpas",
    tl_motion: "Kustība",
    tl_clear: "Mierīgi",
    tl_detected: "Konstatēts",
    tl_ok: "OK",
    tl_now: "tagad",
    tl_events: "Notikumi",
    tl_tracked: "Uzraudzītie sensori: {n}",
    tl_triggers: "Nostrādes",
    tl_none: "Nav",
    tl_calm: "Viss mierīgi",
    tl_most: "Aktīvākais",
    tl_times: "{n}×",
    tl_longest: "Garākā atvēršana",
    tl_alarm_at: "Signalizācija: {state}",
    tl_last: "pēdējā darbība {ago}",
    tl_no_activity: "Nav darbību",
    tl_n_sensors: "Sensori: {n}",
    p_6h: "6 st.",
    p_24h: "24 st.",
    p_3d: "3 dienas",
    tl_armed: "Signalizācija ieslēgta",
    tl_marks: "Aizture / nostrāde",
    tl_by_room: "Darbība pa telpām",
    tl_by_type: "Darbība pa sensoru tipiem",
    tl_by_sensor: "Darbība pa sensoriem",
    g_room: "Pa telpām",
    g_type: "Pa tipiem",
    g_none: "Bez grupēšanas",
    so_label: "Kārtošana",
    so_recent: "Nesenā darbība",
    so_count: "Aktīvākie",
    so_name: "Nosaukums",
    tl_no_history: "Šim periodam nav vēstures: vai ierakstītājs ir ieslēgts?",
    tl_duration: "Ilgums: {d}",
  },
  el: {
    title: "Συναγερμός",
    t_general: "Γενικά",
    t_sensors: "Αισθητήρες",
    t_codes: "Κωδικοί",
    t_actions: "Ενέργειες",
    t_settings: "Ρυθμίσεις",
    loading: "Φόρτωση…",
    no_alarmo: "Το Alarmo δεν είναι εγκατεστημένο",
    no_alarmo_hint: "Αυτός ο πίνακας ρυθμίζει το Alarmo. Εγκαταστήστε το Alarmo από το Marketplace, προσθέστε το στις Ρυθμίσεις → Συσκευές και υπηρεσίες και επιστρέψτε.",
    saved: "Αποθηκεύτηκε",
    error: "Η αποθήκευση απέτυχε: {error}",
    save: "Αποθήκευση",
    cancel: "Ακύρωση",
    delete: "Διαγραφή",
    remove: "Αφαίρεση",
    add: "Προσθήκη",
    test: "Δοκιμή",
    confirm_delete: "Διαγραφή του «{name}»;",
    none: "Κανένα",
    all_areas: "Όλες οι ζώνες",
    search: "Αναζήτηση",
    sec: "s",
    s_disarmed: "Αφοπλισμένος",
    s_armed_home: "Οπλισμένος (σπίτι)",
    s_armed_away: "Οπλισμένος (εκτός)",
    s_armed_night: "Οπλισμένος (νύχτα)",
    s_armed_vacation: "Οπλισμένος (διακοπές)",
    s_armed_custom_bypass: "Οπλισμένος (προσαρμοσμένο)",
    s_arming: "Καθυστέρηση εξόδου",
    s_pending: "Καθυστέρηση εισόδου",
    s_triggered: "Ενεργοποιήθηκε",
    s_disarming: "Αφοπλισμός",
    s_unavailable: "Μη διαθέσιμος",
    sub_ready: "Έτοιμοι αισθητήρες: {n}",
    sub_blocking: "Όχι έτοιμος: {names}",
    sub_since: "Από τις {time}",
    sub_triggered: "Αιτία: {names}",
    sub_none: "Δεν βρέθηκε συναγερμός",
    m_disarm: "Αφοπλισμός",
    m_armed_home: "Σπίτι",
    m_armed_away: "Εκτός",
    m_armed_night: "Νύχτα",
    m_armed_vacation: "Διακοπές",
    m_armed_custom_bypass: "Προσαρμοσμένο",
    code_title: "Κωδικός",
    code_hint: "Εισαγάγετε τον κωδικό για να συνεχίσετε",
    modes: "Λειτουργίες",
    modes_hint: "Οι ενεργές λειτουργίες εμφανίζονται στις κάρτες και στις εντολές· η καθεμία έχει τις δικές της καθυστερήσεις.",
    mode_off: "Ανενεργή",
    mode_line: "Έξοδος {exit} · Είσοδος {entry} · Συναγερμός {trigger}",
    unlimited: "απεριόριστα",
    exit_time: "Καθυστέρηση εξόδου",
    exit_time_hint: "Χρόνος για αποχώρηση μετά την όπλιση",
    entry_time: "Καθυστέρηση εισόδου",
    entry_time_hint: "Χρόνος για αφοπλισμό μετά από ανίχνευση",
    trigger_time: "Διάρκεια συναγερμού",
    trigger_time_hint: "0 = χωρίς όριο",
    areas: "Ζώνες",
    add_area: "Προσθήκη ζώνης",
    area_name: "Όνομα",
    area_line: "Αισθητήρες: {n}",
    delete_area: "Διαγραφή της ζώνης",
    behaviour: "Συμπεριφορά",
    master: "Κύριος συναγερμός",
    master_hint: "Μία οντότητα που ελέγχει όλες τις ζώνες μαζί",
    master_name: "Όνομα κύριου συναγερμού",
    disarm_after_trigger: "Αφοπλισμός μετά την ενεργοποίηση",
    disarm_after_trigger_hint: "Αλλιώς ο συναγερμός επιστρέφει στην προηγούμενη λειτουργία",
    ignore_blocking: "Αγνόηση αισθητήρων που μπλοκάρουν μετά την ενεργοποίηση",
    ignore_blocking_hint: "Οπλίζει ξανά ακόμη κι αν αισθητήρες είναι ανοιχτοί",
    mqtt: "MQTT",
    mqtt_hint: "Δημοσιεύει την κατάσταση και δέχεται εντολές (πληκτρολόγια, επιτοίχια πάνελ).",
    state_topic: "Θέμα κατάστασης",
    command_topic: "Θέμα εντολών",
    event_topic: "Θέμα συμβάντων",
    require_code: "Απαιτείται κωδικός",
    require_code_hint: "Για εντολές MQTT",
    sensors: "Αισθητήρες",
    no_sensors: "Δεν υπάρχουν ακόμη αισθητήρες: προσθέστε παρακάτω.",
    st_ready: "Έτοιμος",
    st_open: "Εμποδίζει την όπλιση",
    st_bypassed: "Παρακάμφθηκε",
    st_unavailable: "Μη διαθέσιμος",
    st_disabled: "Ανενεργός",
    st_open_ok: "Επιτρέπεται ανοιχτός",
    on: "Ανοιχτό",
    off: "Κλειστό",
    type: "Τύπος",
    ty_door: "Πόρτα",
    ty_window: "Παράθυρο",
    ty_motion: "Κίνηση",
    ty_tamper: "Δολιοφθορά",
    ty_environmental: "Περιβάλλον",
    ty_other: "Άλλο",
    area: "Ζώνη",
    group: "Ομάδα",
    sensor_modes: "Λειτουργίες",
    sensor_modes_hint: "Ο αισθητήρας επιτηρεί σε αυτές τις λειτουργίες",
    use_exit_delay: "Χρήση καθυστέρησης εξόδου",
    use_entry_delay: "Χρήση καθυστέρησης εισόδου",
    use_entry_delay_hint: "Αλλιώς ενεργοποιείται αμέσως",
    arm_on_close: "Όπλιση στο κλείσιμο",
    arm_on_close_hint: "Οπλίζει όταν ο αισθητήρας κλείσει κατά την καθυστέρηση εξόδου",
    allow_open: "Να επιτρέπεται ανοιχτός στην όπλιση",
    auto_bypass: "Αυτόματη παράκαμψη",
    auto_bypass_hint: "Αν είναι ανοιχτός στην όπλιση",
    trigger_unavailable: "Ενεργοποίηση όταν δεν είναι διαθέσιμος",
    always_on: "Πάντα ενεργός",
    always_on_hint: "Ακόμη και αφοπλισμένος (καπνός, νερό)",
    f_immediate: "Άμεσα",
    f_entry: "Καθυστέρηση εισόδου",
    f_always: "Πάντα ενεργός",
    f_bypass: "Αυτόματη παράκαμψη",
    f_unavailable: "Ενεργοποιείται όταν δεν είναι διαθέσιμος",
    add_sensors: "Προσθήκη αισθητήρων",
    add_sensors_hint: "Οντότητες που δεν χρησιμοποιεί ακόμη ο συναγερμός.",
    add_n: "Προσθήκη ({n})",
    no_candidates: "Όλοι οι αισθητήρες είναι ήδη στον συναγερμό.",
    groups: "Ομάδες αισθητήρων",
    groups_hint: "Ενεργοποιείται μόνο αν πολλοί αισθητήρες της ομάδας ανιχνεύσουν μέσα στο χρονικό παράθυρο.",
    new_group: "Νέα ομάδα",
    group_line: "Συμβάντα: {events} σε {timeout} s · αισθητήρες: {n}",
    event_count: "Συμβάντα",
    timeout: "Χρονικό παράθυρο",
    group_sensors: "Αισθητήρες",
    code_usage: "Χρήση κωδικών",
    code_arm_required: "Κωδικός για όπλιση",
    code_disarm_required: "Κωδικός για αφοπλισμό",
    code_mode_change_required: "Κωδικός για αλλαγή λειτουργίας",
    code_mode_change_hint: "Οπλισμένος → άλλη λειτουργία",
    code_format: "Μορφή κωδικού",
    code_format_hint: "Αριθμητικό πληκτρολόγιο ή ελεύθερο κείμενο",
    cf_number: "Αριθμοί",
    cf_text: "Κείμενο",
    users: "Χρήστες",
    new_user: "Νέος χρήστης",
    user_name: "Όνομα",
    code: "Κωδικός",
    code_keep: "Αφήστε κενό για να τον κρατήσετε",
    old_code: "Τρέχων κωδικός",
    can_arm: "Μπορεί να οπλίσει",
    can_disarm: "Μπορεί να αφοπλίσει",
    is_override_code: "Κωδικός προτεραιότητας",
    is_override_code_hint: "Οπλίζει ακόμη και με ανοιχτούς αισθητήρες",
    area_limit: "Ζώνες",
    area_limit_hint: "Καμία επιλεγμένη: όλες οι ζώνες",
    u_arm_disarm: "Οπλίζει και αφοπλίζει",
    u_arm: "Μόνο όπλιση",
    u_disarm: "Μόνο αφοπλισμός",
    u_none: "Χωρίς δικαιώματα",
    u_override: "Προτεραιότητα",
    notifications: "Ειδοποιήσεις",
    new_notification: "Νέα ειδοποίηση",
    actions: "Ενέργειες",
    new_action: "Νέα ενέργεια",
    no_notifications: "Δεν υπάρχουν ακόμη ειδοποιήσεις.",
    no_actions: "Δεν υπάρχουν ακόμη ενέργειες.",
    name: "Όνομα",
    event: "Συμβάν",
    ev_armed: "Οπλισμένος",
    ev_disarmed: "Αφοπλισμένος",
    ev_triggered: "Ενεργοποιήθηκε",
    ev_untriggered: "Δεν είναι πλέον ενεργοποιημένος",
    ev_arm_failure: "Αποτυχία όπλισης",
    ev_arming: "Ξεκίνησε η καθυστέρηση εξόδου",
    ev_pending: "Ξεκίνησε η καθυστέρηση εισόδου",
    action_modes: "Λειτουργίες",
    action_modes_hint: "Καμία επιλεγμένη: όλες οι λειτουργίες",
    target: "Προορισμός",
    notif_title: "Τίτλος",
    message: "Μήνυμα",
    message_hint: "Μεταβλητές: {{open_sensors}}, {{arm_mode}}, {{changed_by}}",
    entity: "Οντότητα",
    action: "Ενέργεια",
    turn_on: "Ενεργοποίηση",
    turn_off: "Απενεργοποίηση",
    display: "Εμφάνιση του πίνακα",
    panel_title: "Τίτλος στην πλαϊνή μπάρα",
    hide_header: "Απόκρυψη της επάνω μπάρας",
    hide_header_hint: "Οι καρτέλες και το κουμπί μενού παραμένουν",
    hh_off: "Ποτέ",
    hh_non_admin: "Μη διαχειριστές",
    hh_all: "Όλοι",
    panel_tabs: "Εμφανιζόμενες καρτέλες",
    sidebar_badge: "Σήμα στην πλαϊνή μπάρα",
    sidebar_badge_hint: "Αισθητήρες που εμποδίζουν την όπλιση· κόκκινο όταν ο συναγερμός έχει ενεργοποιηθεί",
    enabled: "Ενεργό",
    disabled: "Ανενεργό",
    alarm: "Συναγερμός",
    header_entity: "Συναγερμός στην κεφαλίδα",
    header_entity_auto: "Αυτόματα (κύριος του Alarmo)",
    illustration_theme: "Θέμα της εικονογράφησης",
    illustration_theme_hint: "Το Αυτόματο ακολουθεί το θέμα του Home Assistant",
    th_auto: "Αυτόματο",
    th_day: "Ημέρα",
    th_night: "Νύχτα",
    admin_note: "Αυτός ο πίνακας είναι για διαχειριστές. Το Alarmo κρατά τις ρυθμίσεις: οι οντότητες, οι κάρτες και οι αυτοματισμοί του συνεχίζουν να λειτουργούν.",
    t_timeline: "Χρονολόγιο",
    all_rooms: "Όλα τα δωμάτια",
    no_room: "Χωρίς δωμάτιο",
    tl_motion: "Κίνηση",
    tl_clear: "Ήσυχα",
    tl_detected: "Ανιχνεύθηκε",
    tl_ok: "OK",
    tl_now: "τώρα",
    tl_events: "Συμβάντα",
    tl_tracked: "Παρακολουθούμενοι αισθητήρες: {n}",
    tl_triggers: "Ενεργοποιήσεις",
    tl_none: "Καμία",
    tl_calm: "Όλα ήσυχα",
    tl_most: "Ο πιο ενεργός",
    tl_times: "{n}×",
    tl_longest: "Μεγαλύτερο άνοιγμα",
    tl_alarm_at: "Συναγερμός: {state}",
    tl_last: "τελευταία δραστηριότητα {ago}",
    tl_no_activity: "Καμία δραστηριότητα",
    tl_n_sensors: "Αισθητήρες: {n}",
    p_6h: "6 ώρ.",
    p_24h: "24 ώρ.",
    p_3d: "3 ημέρες",
    tl_armed: "Οπλισμένος συναγερμός",
    tl_marks: "Καθυστέρηση / ενεργοποίηση",
    tl_by_room: "Δραστηριότητα ανά δωμάτιο",
    tl_by_type: "Δραστηριότητα ανά τύπο αισθητήρα",
    tl_by_sensor: "Δραστηριότητα ανά αισθητήρα",
    g_room: "Ανά δωμάτιο",
    g_type: "Ανά τύπο",
    g_none: "Χωρίς ομαδοποίηση",
    so_label: "Ταξινόμηση",
    so_recent: "Πρόσφατη δραστηριότητα",
    so_count: "Πιο ενεργοί",
    so_name: "Όνομα",
    tl_no_history: "Κανένα ιστορικό για αυτή την περίοδο: είναι ενεργή η καταγραφή;",
    tl_duration: "Διάρκεια: {d}",
  },
};

const PANEL_TABS = ["general", "sensors", "codes", "actions", "timeline", "settings"];
// The tabs that can be hidden (Settings always shows).
const CONTENT_TABS = PANEL_TABS.slice(0, -1);
const TL_KEY = "alarm-card-panel-timeline";
const TL_SPANS = { "6h": 6, "24h": 24, "3d": 72 };
const TL_COLOR = { door: "c-blue", window: "c-cyan", motion: "c-violet", tamper: "c-amber", environmental: "c-red", other: "c-grey" };
const ALARM_MODES = ["armed_home", "armed_away", "armed_night", "armed_vacation", "armed_custom_bypass"];
// The card's state classes, for each Alarmo arm mode.
const MODE_CLASS = { armed_home: "home", armed_away: "away", armed_night: "night", armed_vacation: "vacation", armed_custom_bypass: "custom" };
// The service and the supported-feature bit of each mode button.
const MODE_SERVICE = {
  armed_home: ["alarm_arm_home", 1],
  armed_away: ["alarm_arm_away", 2],
  armed_night: ["alarm_arm_night", 4],
  armed_vacation: ["alarm_arm_vacation", 32],
  armed_custom_bypass: ["alarm_arm_custom_bypass", 16],
};
const SENSOR_TYPES = ["door", "window", "motion", "tamper", "environmental", "other"];
const EVENTS = ["armed", "disarmed", "triggered", "untriggered", "arm_failure", "arming", "pending"];
const ACTION_DOMAINS = ["switch", "light", "siren", "input_boolean", "script", "scene", "fan", "cover", "lock"];
const SETTINGS_KEY = "alarm-card-panel-settings";

// Material Design Icons used by the panel (the card's own icons come from AlarmCardKit.ICONS).
const PI = {
  menu: "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z",
  chev: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
  list: "M3,13H5V11H3V13M3,17H5V15H3V17M3,9H5V7H3V9M7,13H21V11H7V13M7,17H21V15H7V17M7,7V9H21V7H7Z",
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  del: "M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z",
  search: "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  info: "M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z",
  home: "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
  group: "M5,3H7V5H5V10A2,2 0 0,1 3,12A2,2 0 0,1 5,14V19H7V21H5C3.93,20.73 3,20.1 3,19V15A2,2 0 0,0 1,13H0V11H1A2,2 0 0,0 3,9V5A2,2 0 0,1 5,3M19,3A2,2 0 0,1 21,5V9A2,2 0 0,0 23,11H24V13H23A2,2 0 0,0 21,15V19A2,2 0 0,1 19,21H17V19H19V14A2,2 0 0,1 21,12A2,2 0 0,1 19,10V5H17V3H19M12,15A1,1 0 0,1 13,16A1,1 0 0,1 12,17A1,1 0 0,1 11,16A1,1 0 0,1 12,15M8,15A1,1 0 0,1 9,16A1,1 0 0,1 8,17A1,1 0 0,1 7,16A1,1 0 0,1 8,15M16,15A1,1 0 0,1 17,16A1,1 0 0,1 16,17A1,1 0 0,1 15,16A1,1 0 0,1 16,15Z",
  account: "M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z",
  key: "M7,14A2,2 0 0,1 5,12A2,2 0 0,1 7,10A2,2 0 0,1 9,12A2,2 0 0,1 7,14M12.65,10C11.83,7.67 9.61,6 7,6A6,6 0 0,0 1,12A6,6 0 0,0 7,18C9.61,18 11.83,16.33 12.65,14H17V18H21V14H23V10H12.65Z",
  bell: "M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21",
  flash: "M7,2V13H10V22L17,10H13L17,2H7Z",
  door: "M8,3C6.89,3 6,3.89 6,5V21H18V5C18,3.89 17.11,3 16,3H8M8,5H16V19H8V5M13,11V13H15V11H13Z",
  window: "M4 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V4C2 2.9 2.9 2 4 2M4 4V11H11V4H4M4 20H11V13H4V20M20 20V13H13V20H20M20 4H13V11H20V4Z",
  motion:
    "M10,0.2C9,0.2 8.2,1 8.2,2C8.2,3 9,3.8 10,3.8C11,3.8 11.8,3 11.8,2C11.8,1 11,0.2 10,0.2M15.67,1A7.33,7.33 0 0,0 23,8.33V7A6,6 0 0,1 17,1H15.67M18.33,1C18.33,3.58 20.42,5.67 23,5.67V4.33C21.16,4.33 19.67,2.84 19.67,1H18.33M21,1A2,2 0 0,0 23,3V1H21M7.92,4.03C7.75,4.03 7.58,4.06 7.42,4.11L2,5.8V11H3.8V7.33L5.91,6.67L2,22H3.8L6.67,13.89L9,17V22H10.8V15.59L8.31,11.05L9.04,8.18L10.12,10H15V8.2H11.38L9.38,4.87C9.08,4.37 8.54,4.03 7.92,4.03Z",
  tamper: "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M11,7H13V13H11V7M11,15H13V17H11V15Z",
  environmental: "M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25M14.47,9.97L15.53,11.03L9.53,17.03L8.47,15.97M9.75,10A1.25,1.25 0 0,1 11,11.25A1.25,1.25 0 0,1 9.75,12.5A1.25,1.25 0 0,1 8.5,11.25A1.25,1.25 0 0,1 9.75,10M14.25,14.5A1.25,1.25 0 0,1 15.5,15.75A1.25,1.25 0 0,1 14.25,17A1.25,1.25 0 0,1 13,15.75A1.25,1.25 0 0,1 14.25,14.5Z",
  other: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z",
};
const TYPE_COLOR = { door: "c-blue", window: "c-blue", motion: "c-violet", tamper: "c-amber", environmental: "c-red", other: "c-grey" };

const pesc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const picon = (p) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`;
const isOpenState = (s) => ["on", "open", "unlocked", "opening", "detected"].includes(s);
// A sensor type guessed from the device class, and its default settings in Alarmo's spirit.
const guessType = (dc) => {
  if (["door", "garage_door", "opening"].includes(dc)) return "door";
  if (dc === "window") return "window";
  if (["motion", "occupancy", "presence", "moving"].includes(dc)) return "motion";
  if (["tamper", "vibration"].includes(dc)) return "tamper";
  if (["smoke", "gas", "moisture", "carbon_monoxide", "heat", "safety", "problem", "cold"].includes(dc)) return "environmental";
  return "other";
};

// ── Folded top bar ──
// As on the dashboards' illustrated headers (ha-dashboard-header): past 24 px of scroll the 90 px top bar and the
// text tabs fold into one 64 px bar — the panel's icon, title and line, the tabs as round icon pills, the status pill
// and the round buttons — sticky at the top; back under 8 px they unfold. The content does not move: the folded bar
// keeps the room of the top bar and tabs under it. On a narrow panel the pills get a row of their own under the bar,
// the status pill turns to a dot and only the first round button is kept. The folded bar mirrors the top bar and the
// tabs (their text, counts, active tab and buttons): a click on a pill or a button clicks the original.
const alarmPanel_FOLD_CSS = `
  .pf-sense { position:relative; height:0; }
  .pf-sense, .pf-fold, .pf-top, .pf-tabs { overflow-anchor:none; }
  .pf-sense > i { position:absolute; left:0; width:1px; height:1px; pointer-events:none; visibility:hidden; }
  .pf-sense > .pf-s1 { top:24px; } .pf-sense > .pf-s2 { top:8px; }
  .pf-fold { display:none; position:sticky; top:0; z-index:6; container-type:inline-size; color:var(--primary-text-color);
             background:var(--card-background-color, #fff); border-bottom:1px solid var(--divider-color, rgba(0,0,0,.12));
             box-shadow:0 2px 8px rgba(0,0,0,.08); }
  :host([pf-folded]) .pf-fold { display:block; }
  .pf-fold.pf-measure { display:block; position:absolute; visibility:hidden; }
  :host([pf-folded]) .pf-top, :host([pf-folded]) .pf-tabs { display:none !important; }
  .pf-bar { display:flex; flex-wrap:wrap; align-items:center; column-gap:12px; min-height:64px; padding:0 16px; box-sizing:border-box; }
  .pf-menu { flex:none; margin-inline:-8px -4px; color:var(--primary-text-color); }
  .pf-menu[hidden] { display:none; }
  .pf-ic { flex:none; width:40px; height:40px; border-radius:50%; display:grid; place-items:center; color:var(--pf-accent);
           background:color-mix(in srgb, currentColor 14%, transparent); }
  .pf-ic svg, .pf-ic img { width:22px; height:22px; fill:currentColor; }
  .pf-ic ha-icon, .pf-ic ha-svg-icon { --mdc-icon-size:22px; }
  .pf-names { display:flex; flex-direction:column; flex:0 1 auto; min-width:0; max-width:260px; }
  .pf-t { font-size:17px; font-weight:700; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pf-s { font-size:12.5px; line-height:1.3; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pf-s:empty { display:none; }
  .pf-pills { display:flex; gap:6px; flex:1 1 0; min-width:0; overflow-x:auto; scrollbar-width:none; padding:8px 6px 6px 2px; }
  .pf-pills::-webkit-scrollbar { display:none; }
  .pf-pill { all:unset; position:relative; flex:none; width:48px; height:40px; box-sizing:border-box; border-radius:999px; cursor:pointer;
             display:grid; place-items:center; color:var(--primary-text-color); border:1px solid var(--divider-color, rgba(0,0,0,.12)); }
  .pf-pill:hover { background:color-mix(in srgb, currentColor 6%, transparent); }
  .pf-pill[aria-selected="true"] { color:var(--pf-accent); border:1.5px solid var(--pf-accent); background:color-mix(in srgb, var(--pf-accent) 14%, transparent); }
  .pf-pill:focus-visible { outline:2px solid var(--pf-accent); outline-offset:2px; }
  .pf-pill svg { width:20px; height:20px; fill:currentColor; }
  .pf-pill ha-icon { --mdc-icon-size:20px; display:flex; }
  .pf-pill .pf-l { font-size:14px; font-weight:700; }
  .pf-pill b { position:absolute; top:-5px; right:-5px; min-width:18px; height:18px; padding:0 4px; box-sizing:border-box; border-radius:999px;
               font-size:11px; font-weight:700; line-height:14px; text-align:center; color:#fff; background:var(--pf-accent);
               border:2px solid var(--card-background-color, #fff); }
  .pf-end { display:flex; align-items:center; gap:8px; flex:0 1 auto; min-width:0; margin-inline-start:auto; }
  .pf-end > :not(.pf-stat):not(.pf-acts) { min-width:0; max-width:220px; }
  .pf-stat { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; font-size:12px; font-weight:600;
             white-space:nowrap; color:var(--pf-c); background:color-mix(in srgb, var(--pf-c) 14%, transparent); }
  .pf-stat > i { width:8px; height:8px; border-radius:50%; background:currentColor; flex:none; }
  .pf-stat:empty, .pf-stat[hidden] { display:none; }
  .pf-acts { display:flex; gap:8px; }
  .pf-acts > * { all:unset; box-sizing:border-box; cursor:pointer; width:40px; height:40px; border-radius:50%; display:grid; place-items:center;
                 color:var(--primary-text-color); border:1px solid var(--divider-color, rgba(0,0,0,.12)); }
  .pf-acts > *:hover { background:color-mix(in srgb, currentColor 6%, transparent); }
  .pf-acts > *:focus-visible { outline:2px solid var(--pf-accent); outline-offset:2px; }
  .pf-acts > *[disabled] { opacity:.6; cursor:default; }
  .pf-acts svg { width:20px; height:20px; fill:currentColor; }
  .pf-acts > .on { color:var(--pf-on, var(--pf-accent)); border:1.5px solid currentColor; background:color-mix(in srgb, currentColor 14%, transparent); }
  .pf-acts ha-icon { --mdc-icon-size:20px; display:flex; }
  .pf-acts .spin svg, .pf-acts .spinning svg { animation:pf-spin 1s linear infinite; }
  @keyframes pf-spin { to { transform:rotate(360deg); } }
  .pf-extra:empty { display:none; }
  .pf-subs { position:absolute; left:0; right:0; top:100%; display:flex; gap:4px; padding:0 12px; overflow-x:auto; scrollbar-width:none;
             background:var(--card-background-color, #fff); border-bottom:1px solid var(--divider-color, rgba(0,0,0,.12));
             box-shadow:0 2px 8px rgba(0,0,0,.08); }
  .pf-subs[hidden] { display:none; }
  .pf-subs::-webkit-scrollbar { display:none; }
  .pf-sub { all:unset; flex:none; display:inline-flex; align-items:center; gap:6px; padding:9px 10px 7px; cursor:pointer; font-size:13px;
            font-weight:500; color:var(--secondary-text-color); border-bottom:2px solid transparent; white-space:nowrap; --mdc-icon-size:18px; }
  .pf-sub:hover { color:var(--primary-text-color); }
  .pf-sub[aria-selected="true"] { color:var(--primary-text-color); border-bottom-color:var(--pf-accent); }
  .pf-sub[aria-selected="true"] ha-icon { color:var(--pf-accent); }
  .pf-sub:focus-visible { outline:2px solid var(--pf-accent); outline-offset:-2px; }
  @container (max-width: 600px) {
    .pf-bar { min-height:0; padding:12px 12px 0 16px; column-gap:10px; row-gap:2px; }
    .pf-names { flex:1 1 0; max-width:none; }
    .pf-t { font-size:17px; }
    .pf-pills { order:9; flex:1 0 100%; margin:0 -12px 0 -16px; padding:6px 12px 10px; }
    .pf-stat { width:26px; height:26px; padding:0; justify-content:center; }
    .pf-stat > span { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
    .pf-acts > *:not(:first-child) { display:none; }
    .pf-end > :not(.pf-stat):not(.pf-acts) { max-width:120px; }
    .pf-amenu .pf-acts > *, .pf-amenu .pf-acts > *:not(:first-child) { display:none; }
    .pf-amenu .pf-acts > .on { display:grid; position:relative; }
    .pf-amenu .pf-acts > .on::after { content:""; position:absolute; right:-3px; bottom:-3px; width:14px; height:14px; border-radius:50%;
      background:var(--card-background-color, #fff) no-repeat center / 12px
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      box-shadow:0 0 0 1px var(--divider-color, rgba(0,0,0,.12)); }
    .pf-amenu.pf-open .pf-acts { position:absolute; z-index:3; right:8px; top:8px; flex-direction:column; padding:6px; border-radius:26px;
      background:var(--card-background-color, #fff); box-shadow:0 6px 18px rgba(0,0,0,.18); }
    .pf-amenu.pf-open .pf-acts > * { display:grid; }
    .pf-amenu.pf-open .pf-acts > .on::after { display:none; }
  }
`;

/**
 * Folds the panel's top bar on scroll. `o`: `top` and `tabs` (the top bar and the tab row), `tab` (a tab, in the
 * row), `key` (a tab's id, from the button), `icons` (id → SVG path), `badge` (a tab's count, in it), `name`, `sub`,
 * `icon`, `status` (in the top bar), `acts` (its round buttons), `accent` (CSS colour), `extra` (an element shown
 * under the bar when folded, such as a sub-tab row: moved there while folded), `side` (an element moved before the
 * status pill while folded, such as an account picker), `subtab` (the sub-tabs of the tab shown, in the page:
 * mirrored in a row under the folded bar), `mount` (the node the folded bar goes before, when not the top bar), `menu` (() => ({ hass, narrow,
 * show })) for Home Assistant's menu button, `css` (the panel's own rules while folded; the folded bar's height is
 * `--pf-h` on the panel), `actsMenu` (narrow: only the active button `.on`, which opens the others, such as alarm
 * modes), `folded` (start folded: the page was drawn again while folded), `badgeColors` (the counts take the colours of the tabs' own badges), `skip` (() => true while the top bar must not fold). Returns { sync, detach }, or null when the panel has no top bar.
 */
function alarmPanelFold(host, o) {
  const root = host.shadowRoot;
  const q = (sel) => (sel ? root?.querySelector?.(sel) : null);
  const top = q(o.top);
  const tabs = q(o.tabs);
  host.removeAttribute?.("pf-folded");
  if (!root || !top || !tabs || typeof root.querySelector !== "function") return null;
  if (!root.getElementById?.("pf-style")) {
    const style = document.createElement("style");
    style.id = "pf-style";
    style.textContent = alarmPanel_FOLD_CSS + (o.css || "");
    root.appendChild(style);
  }
  top.classList.add("pf-top");
  tabs.classList.add("pf-tabs");
  const sense = document.createElement("div");
  sense.className = "pf-sense";
  sense.setAttribute("aria-hidden", "true");
  sense.innerHTML = '<i class="pf-s1"></i><i class="pf-s2"></i>';
  const fold = document.createElement("div");
  fold.className = "pf-fold";
  fold.style.setProperty("--pf-accent", o.accent);
  if (o.actsMenu) fold.classList.add("pf-amenu");
  fold.innerHTML = `<div class="pf-bar"><ha-menu-button class="pf-menu" hidden></ha-menu-button><span class="pf-ic" aria-hidden="true"></span>
    <div class="pf-names"><span class="pf-t"></span><span class="pf-s"></span></div>
    <div class="pf-pills" role="tablist"></div>
    <div class="pf-end"><span class="pf-stat" role="status"></span><div class="pf-acts"></div></div></div><div class="pf-extra"></div><div class="pf-subs" role="tablist" hidden></div>`;
  const at = o.mount || top;
  at.parentNode.insertBefore(sense, at);
  at.parentNode.insertBefore(fold, at);
  const el = (c) => fold.querySelector(c);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  let folded = false;
  let queued = false;
  let extraHome = null;
  let sideHome = null;

  const tabButtons = () => [...tabs.querySelectorAll(o.tab)];
  const tabLabel = (b) => {
    const clone = b.cloneNode(true);
    for (const n of clone.querySelectorAll?.(`${o.badge || ".badge"}, ha-menu-button, svg`) || []) n.remove();
    return (b.getAttribute("aria-label") || clone.textContent || "").trim();
  };
  const isActive = (b) => b.classList.contains("active") || b.getAttribute("aria-selected") === "true";

  const sync = () => {
    queued = false;
    if (!folded) return;
    const iconBox = q(o.icon);
    const icon = iconBox?.querySelector("svg, ha-icon, ha-svg-icon, img");
    el(".pf-ic").replaceChildren(...(icon ? [icon.cloneNode(true)] : []));
    // The icon keeps the colour of its state, as in the top bar
    el(".pf-ic").style.color = iconBox && !o.iconAccent ? getComputedStyle(iconBox).color : "";
    el(".pf-t").textContent = (q(o.name)?.textContent || "").trim();
    el(".pf-s").textContent = (q(o.sub)?.textContent || "").trim();
    const st = q(o.status);
    const stat = el(".pf-stat");
    const text = (st?.textContent || "").trim();
    stat.hidden = !text;
    if (text) {
      stat.style.setProperty("--pf-c", getComputedStyle(st).color || "var(--pf-accent)");
      stat.setAttribute("aria-label", text);
      stat.innerHTML = `<i></i><span>${esc(text)}</span>`;
    }
    const focused = root.activeElement?.closest?.(".pf-pill")?.dataset.i;
    const shown = tabs.hidden ? [] : tabButtons();
    el(".pf-pills").innerHTML = (shown.length > 1 ? shown : [])
      .map((b, i) => {
        const id = o.key(b);
        const label = tabLabel(b);
        const badgeEl = b.querySelector(o.badge || ".badge");
        const count = (badgeEl?.textContent || "").trim();
        // The count in the colour of its tab's own badge (its tone), where the panel colours them
        let tone = "";
        if (count && o.badgeColors) {
          const cs = getComputedStyle(badgeEl);
          tone = ` style="background:${cs.backgroundColor};color:${cs.color}"`;
        }
        const path = o.icons[id];
        const glyph = !path
          ? `<span class="pf-l" aria-hidden="true">${esc(label.slice(0, 1))}</span>`
          : path.startsWith("mdi:")
            ? `<ha-icon icon="${esc(path)}" aria-hidden="true"></ha-icon>`
            : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
        const on = isActive(b);
        return `<button class="pf-pill" role="tab" data-i="${i}" aria-selected="${on}" tabindex="${on ? 0 : -1}" title="${esc(label)}" aria-label="${esc(count ? `${label} (${count})` : label)}">${glyph}${count ? `<b aria-hidden="true"${tone}>${esc(count)}</b>` : ""}</button>`;
      })
      .join("");
    if (focused !== undefined) el(`.pf-pill[data-i="${focused}"]`)?.focus({ preventScroll: true });
    // The active pill in sight in a scrolling row, without scrolling the page
    const row = el(".pf-pills");
    const act = el(".pf-pill[aria-selected=true]");
    if (act && (act.offsetLeft < row.scrollLeft || act.offsetLeft + act.offsetWidth > row.scrollLeft + row.clientWidth)) {
      row.scrollLeft = Math.max(0, act.offsetLeft - 16);
    }
    // The sub-tabs of the tab shown (in the page, under the top bar), mirrored in a row under the folded bar
    const subs = o.subtab ? [...root.querySelectorAll(o.subtab)].filter((b) => !fold.contains(b)) : [];
    const subRow = el(".pf-subs");
    subRow.hidden = subs.length < 2;
    subRow.innerHTML = subs.length < 2 ? "" : subs
      .map((b, i) => {
        const on = isActive(b);
        const ic = b.querySelector("ha-icon")?.getAttribute("icon");
        return `<button class="pf-sub" role="tab" data-s="${i}" aria-selected="${on}" tabindex="${on ? 0 : -1}">${ic ? `<ha-icon icon="${esc(ic)}" aria-hidden="true"></ha-icon>` : ""}${esc(tabLabel(b))}</button>`;
      })
      .join("");
    subRow.onclick = (ev) => {
      const sb = ev.target.closest?.(".pf-sub");
      if (sb) subs[Number(sb.dataset.s)]?.click();
    };
    const acts = el(".pf-acts");
    acts.textContent = "";
    for (const a of o.acts ? root.querySelectorAll(o.acts) : []) {
      if (a.offsetParent === null && !top.contains(a)) continue;
      const c = a.cloneNode(true);
      c.removeAttribute("id");
      // An active button (`.on`) keeps the colour of its state
      if (c.classList.contains("on")) c.style.setProperty("--pf-on", getComputedStyle(a).color);
      if (c.tagName !== "A") {
        // The panel's own click handlers see the original only (its data-* stay off the copy)
        for (const n of [c, ...c.querySelectorAll("*")]) for (const at of [...n.attributes]) if (at.name.startsWith("data-")) n.removeAttribute(at.name);
        c.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          // Narrow, with `actsMenu`: the active button opens the list of the others first
          if (o.actsMenu && fold.clientWidth <= 600 && (!fold.classList.contains("pf-open") || c.classList.contains("on"))) {
            fold.classList.toggle("pf-open");
            return;
          }
          fold.classList.remove("pf-open");
          a.click();
        });
      }
      acts.appendChild(c);
    }
    const m = o.menu?.();
    const menu = el(".pf-menu");
    menu.hidden = !m?.show;
    if (m) {
      menu.hass = m.hass;
      menu.narrow = m.narrow;
    }
  };
  const queue = () => {
    if (queued || !folded) return;
    queued = true;
    requestAnimationFrame(sync);
  };

  const setFolded = (v) => {
    if (v === folded) return;
    if (v) {
      const t = top.getBoundingClientRect();
      const b = tabs.getBoundingClientRect();
      if (!t.height || o.skip?.()) return; // top bar hidden (Settings): the tabs alone stay sticky
      const extra = q(o.extra);
      const room = (extra?.getBoundingClientRect().bottom || (b.height ? b.bottom : t.bottom)) - t.top;
      folded = true;
      sync();
      if (extra) {
        extraHome = [extra.parentNode, extra.nextSibling];
        el(".pf-extra").appendChild(extra);
      }
      const side = q(o.side);
      if (side) {
        sideHome = [side.parentNode, side.nextSibling];
        el(".pf-end").prepend(side);
      }
      // Measured out of the flow first, so that the content never moves (nor the browser's scroll anchoring with it)
      fold.style.width = `${t.width}px`;
      fold.classList.add("pf-measure");
      const h = fold.offsetHeight;
      fold.classList.remove("pf-measure");
      fold.style.width = "";
      fold.style.marginBottom = `${Math.round(room - h)}px`;
      host.style.setProperty("--pf-h", `${h}px`);
      host.setAttribute("pf-folded", "");
    } else {
      folded = false;
      const extra = el(".pf-extra").firstElementChild;
      if (extra && extraHome) extraHome[0].insertBefore(extra, extraHome[1] && extraHome[1].parentNode === extraHome[0] ? extraHome[1] : null);
      extraHome = null;
      const side = sideHome && el(".pf-end").firstElementChild;
      if (side && !side.matches(".pf-stat")) sideHome[0].insertBefore(side, sideHome[1] && sideHome[1].parentNode === sideHome[0] ? sideHome[1] : null);
      sideHome = null;
      host.removeAttribute("pf-folded");
      fold.style.marginBottom = "";
    }
  };

  el(".pf-pills").addEventListener("click", (ev) => {
    const p = ev.target.closest?.(".pf-pill");
    if (p) tabButtons()[Number(p.dataset.i)]?.click();
  });
  el(".pf-pills").addEventListener("keydown", (ev) => {
    const step = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
    const p = ev.target.closest?.(".pf-pill");
    if (!step || !p) return;
    ev.preventDefault();
    const all = [...el(".pf-pills").children];
    all[(Number(p.dataset.i) + step + all.length) % all.length]?.focus();
  });

  // The list of buttons opened (narrow, `actsMenu`) closes at a click elsewhere
  const closeMenu = (ev) => {
    if (fold.classList.contains("pf-open") && !ev.composedPath().includes(el(".pf-acts"))) fold.classList.remove("pf-open");
  };
  if (o.actsMenu) root.addEventListener("click", closeMenu, true);
  let io = null;
  if (typeof IntersectionObserver === "function") {
    const [s1, s2] = sense.children;
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const above = !e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0);
        if (e.target === s1 && above) setFolded(true);
        if (e.target === s2 && e.isIntersecting) setFolded(false);
      }
    });
    io.observe(s1);
    io.observe(s2);
  }
  const mo = typeof MutationObserver === "function" ? new MutationObserver(queue) : null;
  mo?.observe(top, { subtree: true, childList: true, characterData: true, attributes: true });
  mo?.observe(tabs, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "aria-selected", "hidden"] });
  // Drawn again while folded (a panel that rewrites its page): folded straight away, without a frame unfolded
  if (o.folded) setFolded(true);
  return {
    sync: queue,
    detach() {
      root.removeEventListener?.("click", closeMenu, true);
      io?.disconnect();
      mo?.disconnect();
      setFolded(false);
      sense.remove();
      fold.remove();
      host.removeAttribute("pf-folded");
    },
  };
}
// ── End of the folded top bar ──

class AlarmCardPanel extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._d = null; // Alarmo's data
    this._set = null; // the panel's settings (integration options)
    this._open = new Set();
    this._draft = {};
    this._filter = "all";
    this._areaSel = null;
    this._query = "";
    this._picked = new Set();
    this._toast = "";
    this._popup = null;
    this._tab = this._tabFromUrl();
    try {
      this._set = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    } catch (_err) {
      this._set = null;
    }
    // Home Assistant may create the element and set its properties before it is defined (the definition waits
    // for the language file, scripts/i18n-split.mjs): they are then plain fields hiding the setters. Replay them.
    for (const key of ["panel", "narrow", "hass"]) {
      if (Object.hasOwn(this, key)) {
        const value = this[key];
        delete this[key];
        this[key] = value;
      }
    }
  }

  // Redrawn when a language file has loaded (scripts/i18n-split.mjs calls setConfig on the bundle's elements).
  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set panel(p) {
    this._panel = p;
  }

  set narrow(n) {
    this._narrow = n;
    this._syncMenu();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._start();
    this._syncMenu();
    const sig = this._signature();
    if (sig !== this._sig) {
      this._sig = sig;
      this._renderBanner();
      if (!this._busyEditing()) this._renderPage();
    }
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.addEventListener("click", (e) => this._onClick(e));
      this.shadowRoot.addEventListener("input", (e) => this._onInput(e));
      this.shadowRoot.addEventListener("change", (e) => this._onInput(e));
      this.shadowRoot.addEventListener("keydown", (e) => this._onKey(e));
      this.shadowRoot.addEventListener("mouseover", (e) => this._tlTip(e));
      this.shadowRoot.addEventListener("mouseout", (e) => {
        if (e.target.closest?.("[data-tip]")) this.shadowRoot.querySelector(".tip")?.remove();
      });
    }
    // Back on the panel after leaving it: Alarmo's changes made meanwhile were not followed, so its data is read
    // again before following them anew.
    if (this._hass && this._unsub === undefined && this._d) {
      this._subscribe();
      if (this._left) this._load().then(() => this._render());
    }
    this._left = false;
    this._render();
  }

  disconnectedCallback() {
    this._fold?.detach();
    this._fold = null;
    this._unsubscribe();
    this._left = true;
    // A popup left open (the arming code, a delete to confirm) closes without acting.
    this._popup = null;
  }

  // ── Data ──
  _t(key, vars = {}) {
    const l = this._hass?.locale?.language || this._hass?.language || "en";
    const table = PANEL_STRINGS[l] ? PANEL_STRINGS[l] : PANEL_STRINGS[l.split("-")[0]] || PANEL_STRINGS.en;
    return String(table[key] ?? PANEL_STRINGS.en[key] ?? key).replace(/(?<!\{)\{(\w+)\}(?!\})/g, (_, k) => vars[k] ?? "");
  }

  async _start() {
    await Promise.resolve(); // Home Assistant sets hass, panel and narrow together: panel (card_url) may come after hass
    // The card (header picture), the panel's settings and Alarmo's data load together; each redraws when it is in.
    const kitUrl = this._panel?.config?.card_url;
    if (kitUrl && !window.AlarmCardKit) {
      import(kitUrl).then(
        () => this._render(),
        (err) => console.warn("alarm-panel: card not loaded", err),
      );
    }
    const data = this._load();
    try {
      const set = await this._hass.callWS({ type: "alarm_card/settings" });
      this._set = set;
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(set));
      } catch (_err) {
        /* kept for this page only */
      }
    } catch (err) {
      console.warn("alarm-panel: settings not loaded", err);
      this._set ??= { options: {}, admin: true, alarmo: true };
    }
    if (!this._shownTabs().includes(this._tab)) this._tab = this._shownTabs()[0];
    this._render();
    await data;
    if (!this._d) this._set.alarmo = false;
    else this._subscribe();
    this._render();
  }

  async _load() {
    const ws = (type) => this._hass.callWS({ type });
    try {
      const [config, areas, sensors, users, automations, groups, entities] = await Promise.all([
        ws("alarmo/config"),
        ws("alarmo/areas"),
        ws("alarmo/sensors"),
        ws("alarmo/users"),
        ws("alarmo/automations"),
        ws("alarmo/sensor_groups"),
        ws("alarmo/entities"),
      ]);
      this._d = { config, areas, sensors, users, automations, groups, entities };
    } catch (err) {
      console.warn("alarm-panel: Alarmo data not loaded", err);
      this._d = null;
      if (this._set) this._set.alarmo = false;
    }
  }

  _subscribe() {
    if (this._unsub !== undefined || !this._hass?.connection) return;
    this._unsub = null;
    this._hass.connection
      .subscribeMessage(
        async () => {
          await this._load();
          this._render();
        },
        { type: "alarmo_config_updated" },
      )
      .then((u) => {
        if (this.isConnected) this._unsub = u;
        else u();
      })
      .catch(() => {
        this._unsub = undefined;
      });
  }

  _unsubscribe() {
    if (typeof this._unsub === "function") this._unsub();
    this._unsub = undefined;
  }

  _opts() {
    return this._set?.options || {};
  }

  _shownTabs() {
    const tabs = this._opts().panel_tabs;
    const shown = Array.isArray(tabs) && tabs.length ? PANEL_TABS.filter((t) => tabs.includes(t)) : CONTENT_TABS;
    return [...shown, "settings"];
  }

  _tabFromUrl() {
    const seg = (location.pathname.split("/")[2] || "").toLowerCase();
    return PANEL_TABS.includes(seg) ? seg : "general";
  }

  _setTab(tab) {
    this._tab = tab;
    this._open.clear();
    this._draft = {};
    this._query = "";
    this._picked.clear();
    const base = location.pathname.split("/")[1] || "alarm-panel";
    try {
      history.replaceState(history.state, "", `/${base}/${tab}`);
    } catch (_err) {
      /* the tab stays without the address */
    }
    this._renderPage();
    this._renderTabs();
  }

  // The alarm entity of the header: the chosen one, else Alarmo's master, else its first area, else any alarm.
  _entityId() {
    const chosen = this._opts().entity;
    if (chosen && this._hass?.states[chosen]) return chosen;
    const ents = this._d?.entities || [];
    const master = ents.find((e) => !e.area_id);
    const pick = master || ents[0];
    if (pick && this._hass?.states[pick.entity_id]) return pick.entity_id;
    return Object.keys(this._hass?.states || {}).find((id) => id.startsWith("alarm_control_panel.")) || null;
  }

  _areaEntity(areaId) {
    return (this._d?.entities || []).find((e) => e.area_id === areaId)?.entity_id;
  }

  _name(id) {
    return this._hass?.states[id]?.attributes?.friendly_name || id;
  }

  _areaName(id) {
    return this._d?.areas?.[id]?.name || (id ? id : this._t("all_areas"));
  }

  // What the page shows of the states: redrawn only when it changes.
  _signature() {
    const st = this._hass?.states || {};
    const ids = [this._entityId(), ...Object.keys(this._d?.sensors || {}), ...(this._d?.entities || []).map((e) => e.entity_id)];
    return ids.map((id) => `${id}=${st[id]?.state}`).join("|") + (this._hass?.themes?.darkMode ? "D" : "L");
  }

  // A field being typed in: the page is not redrawn under it (drafts keep what was typed anyway).
  _busyEditing() {
    const a = this.shadowRoot?.activeElement;
    return !!a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName);
  }

  _blocking() {
    const st = this._hass?.states || {};
    return Object.values(this._d?.sensors || {}).filter(
      (s) => s.enabled !== false && isOpenState(st[s.entity_id]?.state) && !s.allow_open && !s.auto_bypass && (s.modes || []).length,
    );
  }

  // ── API ──
  async _post(path, data, okText = this._t("saved")) {
    try {
      const res = await this._hass.callApi("POST", `alarmo/${path}`, data);
      if (res && res.success === false) throw new Error(res.error || "error");
      this._flash(okText);
      await this._load();
      return true;
    } catch (err) {
      this._flash(this._t("error", { error: err?.body?.message || err?.message || err }), true);
      return false;
    } finally {
      this._render();
    }
  }

  async _saveSettings(options) {
    try {
      const res = await this._hass.callWS({ type: "alarm_card/update_settings", options });
      this._set = { ...this._set, options: res.options };
      window.dispatchEvent(new Event("alarm-card-settings"));
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this._set));
      } catch (_err) {
        /* kept for this page only */
      }
      this._flash(this._t("saved"));
    } catch (err) {
      this._flash(this._t("error", { error: err?.message || err }), true);
    }
    if (!this._shownTabs().includes(this._tab)) this._tab = "settings";
    this._render();
  }

  _flash(text, bad = false) {
    this._toast = text;
    this._toastBad = bad;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toast = "";
      this.shadowRoot?.querySelector(".toast")?.remove();
    }, 3000);
  }

  // ── Events ──
  _onInput(e) {
    const el = e.target;
    if (el.matches("select[data-tl-sort]")) {
      if (e.type === "change") {
        this._tlState().sort = el.value;
        this._tlSave();
        this._renderPage();
      }
      return;
    }
    // The select of the Settings tab saves on change (a click on a <select> only opens it).
    if (el.matches("select[data-a='set']")) {
      if (e.type === "change") this._act_set(null, el.dataset.v, el);
      return;
    }
    if (el.dataset.q !== undefined) {
      this._query = el.value;
      if (e.type === "input") {
        clearTimeout(this._qTimer);
        this._qTimer = setTimeout(() => this._renderPage(true), 150);
      }
      return;
    }
    const f = el.dataset.f;
    const tile = el.closest("[data-id]")?.dataset.id;
    if (!f || !tile) return;
    (this._draft[tile] ||= {})[f] = el.type === "number" ? (el.value === "" ? "" : Number(el.value)) : el.value;
    if (el.tagName === "SELECT" && el.dataset.live !== undefined) this._renderPage(true);
  }

  _onKey(e) {
    if (e.key === "Enter" && e.target.closest(".popup") && e.target.tagName === "INPUT") this._popupOk();
    if (e.key === "Escape" && this._popup) {
      this._popup = null;
      this._render();
    }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".trow,[role='switch'],[role='button']") && e.target === e.composedPath()[0]) {
      e.preventDefault();
      e.target.click();
    }
  }

  _onClick(e) {
    // On a touch screen a tap on a bar of the timeline shows its tooltip.
    if (e.target.closest("[data-tip]") && matchMedia("(hover: none)").matches) return this._tlTip(e);
    const el = e.target.closest("[data-a]");
    if (!el || el.tagName === "SELECT") return;
    const a = el.dataset.a;
    const id = el.closest("[data-id]")?.dataset.id;
    const v = el.dataset.v;
    if (a === "tab") return this._setTab(v);
    if (a === "toggle-tile") {
      if (e.target.closest(".tg,input,select,button:not(.trow)")) return;
      this._open.has(id) ? this._open.delete(id) : this._open.add(id);
      return this._renderPage();
    }
    if (a === "mode") return this._arm(v);
    if (a === "popup-ok") return this._popupOk();
    if (a === "popup-cancel") {
      this._popup = null;
      return this._render();
    }
    if (a === "filter") {
      this._filter = v;
      return this._renderPage();
    }
    if (a === "area-sel") {
      this._areaSel = v;
      this._open.clear();
      return this._renderPage();
    }
    if (a === "chip") {
      const d = (this._draft[id] ||= {});
      const f = el.dataset.f;
      const cur = new Set(d[f] ?? this._current(id, f) ?? []);
      cur.has(v) ? cur.delete(v) : cur.add(v);
      d[f] = [...cur];
      return this._renderPage(true);
    }
    if (a === "dtg") {
      const d = (this._draft[id] ||= {});
      const f = el.dataset.f;
      d[f] = !(d[f] ?? this._current(id, f));
      return this._renderPage(true);
    }
    if (a === "pick") {
      this._picked.has(v) ? this._picked.delete(v) : this._picked.add(v);
      return this._renderPage(true);
    }
    const handler = this[`_act_${a.replace(/-/g, "_")}`];
    if (handler) handler.call(this, id, v, el);
  }

  // The value a field had before editing, for drafts started from chips and toggles.
  _current(id, f) {
    // Alarmo returns the users' hashed codes: never shown, never sent back.
    if (f === "code" || f === "old_code") return undefined;
    const [kind, key] = id.split(":");
    const d = this._d || {};
    const src =
      kind === "sensor"
        ? d.sensors?.[key]
        : kind === "user"
          ? d.users?.[key]
          : kind === "group"
            ? d.groups?.[key]
            : kind === "auto"
              ? this._autoFlat(d.automations?.[key])
              : kind === "mode"
                ? d.areas?.[this._curArea()]?.modes?.[key]
                : kind === "area"
                  ? d.areas?.[key]
                  : kind === "master"
                    ? d.config?.master
                : kind === "new-user"
                  ? { can_arm: true, can_disarm: true, is_override_code: false, area_limit: [] }
                  : kind === "new-auto"
                    ? { modes: [], event: "triggered", area: "0", service_action: "turn_on" }
                    : kind === "new-group"
                      ? { name: "", entities: [], timeout: 10, event_count: 2 }
                      : kind === "mqtt"
                        ? d.config?.mqtt
                        : null;
    return src?.[f];
  }

  _val(id, f, fallback) {
    const v = this._draft[id]?.[f];
    if (v !== undefined) return v;
    const c = this._current(id, f);
    return c === undefined || c === null ? fallback : c;
  }

  // An automation flattened for the editor: its first trigger and first action.
  _autoFlat(a) {
    if (!a) return null;
    const tr = a.triggers?.[0] || {};
    const ac = a.actions?.[0] || {};
    return {
      name: a.name,
      event: tr.event,
      area: tr.area === undefined || tr.area === null ? "0" : String(tr.area),
      modes: tr.modes || [],
      service: ac.service,
      entity_id: ac.entity_id || "",
      title: ac.data?.title || "",
      message: ac.data?.message || "",
      service_action: ac.service?.split(".")[1] || "turn_on",
      enabled: a.enabled,
    };
  }

  // ── Arming from the header ──
  _arm(mode) {
    const id = this._entityId();
    const st = this._hass.states[id];
    if (!st) return;
    const disarm = mode === "disarm";
    const cfg = this._d?.config || {};
    const needs = st.attributes.code_format && (disarm ? cfg.code_disarm_required !== false : st.attributes.code_arm_required !== false);
    if (needs) {
      this._popup = { kind: "code", mode, format: st.attributes.code_format };
      this._render();
      this.shadowRoot.querySelector(".popup input")?.focus();
      return;
    }
    this._callArm(mode);
  }

  _callArm(mode, code) {
    const service = mode === "disarm" ? "alarm_disarm" : MODE_SERVICE[mode][0];
    const data = { entity_id: this._entityId() };
    if (code) data.code = code;
    this._hass.callService("alarm_control_panel", service, data).catch((err) => this._flash(this._t("error", { error: err?.message || err }), true));
  }

  _popupOk() {
    const p = this._popup;
    if (!p) return;
    if (p.kind === "code") {
      const code = this.shadowRoot.querySelector(".popup input")?.value || "";
      this._popup = null;
      this._render();
      this._callArm(p.mode, code);
    } else if (p.kind === "confirm") {
      this._popup = null;
      this._render();
      p.run();
    }
  }

  _confirm(name, run) {
    this._popup = { kind: "confirm", name, run };
    this._render();
  }

  // ── Actions of the tiles ──
  _curArea() {
    const ids = Object.keys(this._d?.areas || {});
    return ids.includes(this._areaSel) ? this._areaSel : ids[0];
  }

  _num(v, fallback = null) {
    if (v === "" || v === null || v === undefined) return fallback;
    const n = Math.max(0, Math.round(Number(v)));
    return Number.isFinite(n) ? n : fallback;
  }

  _modePayload(mode, patch = {}) {
    const m = { ...(this._d.areas[this._curArea()]?.modes?.[mode] || {}), ...patch };
    return {
      area_id: this._curArea(),
      modes: { [mode]: { enabled: !!m.enabled, exit_time: this._num(m.exit_time, 0), entry_time: this._num(m.entry_time, 0), trigger_time: this._num(m.trigger_time, 0) } },
    };
  }

  _act_mode_enable(id) {
    const mode = id.split(":")[1];
    const cur = this._d.areas[this._curArea()]?.modes?.[mode];
    this._post("area", this._modePayload(mode, { enabled: !cur?.enabled }));
  }

  _act_mode_save(id) {
    const mode = id.split(":")[1];
    const d = this._draft[id] || {};
    this._post("area", this._modePayload(mode, d)).then((ok) => ok && this._done(id));
  }

  _done(id) {
    delete this._draft[id];
    this._open.delete(id);
    this._renderPage();
  }

  _act_area_add() {
    const name = String(this._draft["new-area"]?.name || "").trim();
    if (!name) return;
    this._post("area", { name }).then((ok) => ok && this._done("new-area"));
  }

  _act_area_save(id) {
    const areaId = id.split(":")[1];
    const name = String(this._draft[id]?.name ?? "").trim();
    if (!name) return;
    this._post("area", { area_id: areaId, name }).then((ok) => ok && this._done(id));
  }

  _act_area_delete(id) {
    const areaId = id.split(":")[1];
    this._confirm(this._areaName(areaId), () => this._post("area", { area_id: areaId, remove: true }));
  }

  _act_config(_id, v) {
    const cfg = this._d.config;
    if (v === "master") return this._post("config", { master: { enabled: !cfg.master?.enabled, name: cfg.master?.name || "master" } });
    if (v === "number" || v === "text") return this._post("config", { code_format: v });
    this._post("config", { [v]: !cfg[v] });
  }

  _act_master_save(id) {
    const name = String(this._draft[id]?.name ?? "").trim();
    if (!name) return;
    this._post("config", { master: { enabled: true, name } }).then((ok) => ok && this._done(id));
  }

  _mqttPayload(patch = {}) {
    const m = { ...(this._d.config.mqtt || {}), ...patch };
    const out = {
      enabled: !!m.enabled,
      state_topic: m.state_topic || "alarmo/state",
      command_topic: m.command_topic || "alarmo/command",
      event_topic: m.event_topic || "alarmo/event",
      require_code: m.require_code !== false,
    };
    if (m.state_payload && Object.keys(m.state_payload).length) out.state_payload = m.state_payload;
    if (m.command_payload && Object.keys(m.command_payload).length) out.command_payload = m.command_payload;
    return { mqtt: out };
  }

  _act_mqtt_enable() {
    this._post("config", this._mqttPayload({ enabled: !this._d.config.mqtt?.enabled }));
  }

  _act_mqtt_save(id) {
    this._post("config", this._mqttPayload(this._draft[id] || {})).then((ok) => ok && this._done(id));
  }

  _act_sensor_enable(id) {
    const s = this._d.sensors[id.split(":")[1]];
    this._post("sensors", { entity_id: s.entity_id, enabled: s.enabled === false });
  }

  _act_sensor_save(id) {
    const eid = id.split(":")[1];
    const s = { ...this._d.sensors[eid], ...(this._draft[id] || {}) };
    const data = {
      entity_id: eid,
      type: s.type,
      modes: s.modes || [],
      use_exit_delay: !!s.use_exit_delay,
      use_entry_delay: !!s.use_entry_delay,
      arm_on_close: !!s.arm_on_close,
      allow_open: !!s.allow_open,
      auto_bypass: !!s.auto_bypass,
      auto_bypass_modes: s.auto_bypass ? s.auto_bypass_modes || [] : [],
      trigger_unavailable: !!s.trigger_unavailable,
      always_on: !!s.always_on,
      area: s.area,
      group: s.group || null,
    };
    this._post("sensors", data).then((ok) => ok && this._done(id));
  }

  _act_sensor_remove(id) {
    const eid = id.split(":")[1];
    this._confirm(this._name(eid), () => this._post("sensors", { entity_id: eid, remove: true }));
  }

  async _act_sensors_add() {
    const area = this._draft["add-sensors"]?.area || this._curArea();
    const modes = Object.entries(this._d.areas[area]?.modes || {})
      .filter(([, m]) => m.enabled)
      .map(([k]) => k);
    const ids = [...this._picked];
    let ok = true;
    for (const eid of ids) {
      const type = guessType(this._hass.states[eid]?.attributes?.device_class);
      const env = type === "environmental";
      const data = {
        entity_id: eid,
        type,
        area,
        enabled: true,
        modes: env ? [] : type === "motion" ? modes.filter((m) => m !== "armed_home") : modes,
        always_on: env,
        use_exit_delay: !env && type !== "tamper",
        use_entry_delay: type === "door" || type === "motion",
      };
      try {
        await this._hass.callApi("POST", "alarmo/sensors", data);
      } catch (err) {
        ok = false;
        this._flash(this._t("error", { error: err?.message || err }), true);
      }
    }
    this._picked.clear();
    if (ok) this._flash(this._t("saved"));
    await this._load();
    this._render();
  }

  _act_group_save(id) {
    const gid = id.split(":")[1];
    const g = { ...(this._d.groups[gid] || {}), ...(this._draft[id] || {}) };
    const name = String(g.name || "").trim();
    if (!name) return;
    const data = { name, entities: g.entities || [], timeout: this._num(g.timeout, 0), event_count: Math.max(2, this._num(g.event_count, 2)) };
    if (gid && gid !== "new") data.group_id = gid;
    this._post("sensor_groups", data).then((ok) => ok && this._done(id));
  }

  _act_group_delete(id) {
    const gid = id.split(":")[1];
    this._confirm(this._d.groups[gid]?.name || gid, () => this._post("sensor_groups", { group_id: gid, remove: true }));
  }

  _act_new(_id, v) {
    this._open.add(v);
    this._renderPage();
    this.shadowRoot.querySelector(`[data-id="${v}"] input`)?.focus();
  }

  _act_close_new(_id, v) {
    this._done(v);
  }

  _act_user_enable(id) {
    const u = this._d.users[id.split(":")[1]];
    this._post("users", { user_id: u.user_id, enabled: !u.enabled });
  }

  _act_user_save(id) {
    const [kind, uid] = id.split(":");
    const fresh = kind === "new-user";
    const u = { ...(fresh ? {} : this._d.users[uid]), ...(this._draft[id] || {}) };
    const name = String(u.name || "").trim();
    const code = String(this._draft[id]?.code || "");
    if (!name || (fresh && !code)) return;
    const data = {
      name,
      can_arm: this._val(id, "can_arm", false),
      can_disarm: this._val(id, "can_disarm", false),
      is_override_code: this._val(id, "is_override_code", false),
      area_limit: this._val(id, "area_limit", []),
    };
    if (fresh) Object.assign(data, { code, enabled: true });
    else {
      data.user_id = uid;
      if (code) Object.assign(data, { code, old_code: String(this._draft[id]?.old_code || "") });
    }
    this._post("users", data).then((ok) => ok && this._done(id));
  }

  _act_user_delete(id) {
    const uid = id.split(":")[1];
    this._confirm(this._d.users[uid]?.name || uid, () => this._post("users", { user_id: uid, remove: true }));
  }

  _act_auto_enable(id) {
    const a = this._d.automations[id.split(":")[1]];
    this._post("automations", { automation_id: a.automation_id, enabled: !a.enabled });
  }

  _autoPayload(id, type) {
    const g = (f, d) => this._val(id, f, d);
    const event = g("event", "triggered");
    const areaRaw = String(g("area", "0"));
    const trigger = { event, area: areaRaw === "0" ? 0 : areaRaw, modes: g("modes", []) };
    const name = String(g("name", "")).trim();
    if (type === "notification") {
      const service = g("service", "");
      if (!service) return null;
      return {
        type,
        name: name || `${this._t(`ev_${event}`)} → ${service.replace(/^notify\./, "")}`,
        triggers: [trigger],
        actions: [{ service, data: { title: g("title", ""), message: g("message", "") } }],
      };
    }
    const entity = g("entity_id", "");
    if (!entity) return null;
    const service = `${entity.split(".")[0]}.${g("service_action", "turn_on")}`;
    return { type, name: name || `${this._name(entity)} · ${this._t(`ev_${event}`)}`, triggers: [trigger], actions: [{ service, entity_id: entity }] };
  }

  _act_auto_save(id, type) {
    const [kind, aid] = id.split(":");
    const data = this._autoPayload(id, type);
    if (!data) return;
    if (kind === "auto") data.automation_id = aid;
    else data.enabled = true;
    this._post("automations", data).then((ok) => ok && this._done(id));
  }

  _act_auto_delete(id) {
    const aid = id.split(":")[1];
    this._confirm(this._d.automations[aid]?.name || aid, () => this._post("automations", { automation_id: aid, remove: true }));
  }

  _act_auto_test(id) {
    const service = this._val(id, "service", "");
    if (!service) return;
    const [domain, name] = service.split(".");
    this._hass
      .callService(domain, name, { title: this._val(id, "title", ""), message: String(this._val(id, "message", "")).replace(/\{\{\s*\w+\s*\}\}/g, "…") || "Alarm" })
      .catch((err) => this._flash(this._t("error", { error: err?.message || err }), true));
  }

  _act_set(_id, v, el) {
    const [key, value] = v.split("=");
    if (key === "panel_tabs") {
      const cur = new Set(this._opts().panel_tabs || CONTENT_TABS);
      cur.has(value) ? cur.delete(value) : cur.add(value);
      if (!cur.size) return;
      return this._saveSettings({ panel_tabs: PANEL_TABS.filter((t) => cur.has(t)) });
    }
    if (key === "sidebar_badge") return this._saveSettings({ sidebar_badge: value === "true" });
    if (key === "panel_title") {
      const title = this.shadowRoot.querySelector("[data-set-title]")?.value?.trim();
      if (title) this._saveSettings({ panel_title: title });
      return;
    }
    if (key === "entity") return this._saveSettings({ entity: el.value || "" });
    this._saveSettings({ [key]: value });
  }

  // ── Rendering ──
  _render() {
    const root = this.shadowRoot;
    if (!root) return;
    const kit = window.AlarmCardKit;
    const bare = this._bare();
    this.toggleAttribute("bare", bare);
    this.classList.toggle("dark", !!this._hass?.themes?.darkMode);
    const folded = Boolean(this.hasAttribute?.("pf-folded"));
    root.innerHTML = `<style>${kit ? kit.BASE_STYLE + kit.SCENE_STYLE : ""}${PANEL_STYLE}</style>
      <div class="bannerwrap"></div>
      <div class="tabbar"><ha-menu-button class="tmenu"></ha-menu-button><div class="tabs" role="tablist"></div></div>
      <div class="page"></div><div class="overlay"></div>`;
    this._renderBanner();
    this._renderTabs();
    this._renderPage();
    this._syncMenu();
    this._attachFold(folded);
  }

  /** The top bar folds on scroll into one bar with the tabs as icon pills (see alarmPanelFold). */
  _attachFold(folded = false) {
    this._fold?.detach();
    this._fold = alarmPanelFold(this, {
      top: ".bannerwrap",
      tabs: ".tabbar",
      tab: ".tab",
      key: (b) => b.dataset.v,
      icons: {
        general: "mdi:tune",
        sensors: "mdi:motion-sensor",
        codes: "mdi:dialpad",
        actions: "mdi:flash-outline",
        timeline: "mdi:timeline-clock-outline",
        settings: "mdi:cog",
      },
      badge: ".cnt",
      name: ".bannerwrap .name",
      sub: ".bannerwrap .sub",
      icon: ".bannerwrap .ibadge",
      status: ".bannerwrap .chip",
      acts: ".bannerwrap .banner .hbtns > *",
      actsMenu: true,
      accent: "#e5484d",
      folded,
      menu: () => ({ hass: this._hass, narrow: this._narrow, show: Boolean(this._narrow) }),
    });
  }

  _bare() {
    const h = this._opts().hide_header;
    return h === "all" || (h === "non_admin" && this._set?.admin === false);
  }

  _syncMenu() {
    for (const m of this.shadowRoot?.querySelectorAll("ha-menu-button") || []) {
      m.hass = this._hass;
      m.narrow = this._narrow;
    }
  }

  _stateSub(st) {
    if (!st) return this._t("sub_none");
    const s = st.state;
    if (s === "triggered") {
      const open = st.attributes.open_sensors ? Object.keys(st.attributes.open_sensors).map((id) => this._name(id)) : [];
      return open.length ? this._t("sub_triggered", { names: open.join(", ") }) : this._t("s_triggered");
    }
    if (s === "disarmed") {
      const b = this._blocking();
      return b.length ? this._t("sub_blocking", { names: b.map((x) => this._name(x.entity_id)).join(", ") }) : this._t("sub_ready", { n: Object.keys(this._d?.sensors || {}).length });
    }
    if (s.startsWith("armed_")) {
      const time = new Date(st.last_changed).toLocaleTimeString(this._hass.locale?.language || undefined, { hour: "2-digit", minute: "2-digit" });
      return this._t("sub_since", { time });
    }
    return this._t(`s_${s}`);
  }

  _renderBanner() {
    const wrap = this.shadowRoot?.querySelector(".bannerwrap");
    const kit = window.AlarmCardKit;
    if (!wrap || !this._hass) return;
    if (!kit) {
      wrap.innerHTML = `<div class="plainbar"><ha-menu-button></ha-menu-button><div class="name">${pesc(this._opts().panel_title || this._t("title"))}</div></div>`;
      return this._syncMenu();
    }
    const id = this._entityId();
    const st = id ? this._hass.states[id] : null;
    const cls = st ? kit.stateClass(st.state) : "idle";
    const theme = this._opts().illustration_theme;
    const dark = kit.isNight(this._hass, { illustration_theme: theme === "auto" ? undefined : theme });
    const feats = st?.attributes?.supported_features || 0;
    const modes = ["disarm", ...ALARM_MODES.filter((m) => feats & MODE_SERVICE[m][1])];
    const curMode = st?.state === "disarmed" ? "disarm" : st?.state;
    const label = st ? this._t(`s_${st.state}`) : this._t("s_unavailable");
    const btns = st
      ? modes
          .map((m) => {
            const c = m === "disarm" ? "off" : MODE_CLASS[m];
            const icon = m === "disarm" ? kit.STATE_ICON.off : kit.STATE_ICON[c];
            const name = this._t(m === "disarm" ? "m_disarm" : `m_${m}`);
            return `<button class="mbtn ${c}${curMode === m ? " on" : ""}" data-a="mode" data-v="${m}" title="${pesc(name)}" aria-label="${pesc(name)}">${picon(icon)}</button>`;
          })
          .join("")
      : "";
    wrap.innerHTML = `<div class="banner ${cls}${dark ? " dark" : ""}">
        <div class="al-ground" aria-hidden="true"></div>${kit.alarmRadar("panel")}
        <div class="al-shield" aria-hidden="true">${kit.shield(st?.state, "panel")}</div>
        <div class="header htext"><ha-menu-button></ha-menu-button>
          <div class="ibadge">${picon(kit.STATE_ICON[cls] || kit.ICONS.shield)}</div>
          <div class="titles"><div class="tline"><div class="name">${pesc(this._opts().panel_title || this._t("title"))}</div>
            <span class="chip ${cls}"><span class="dot"></span><span class="chip-text">${pesc(label)}</span></span></div>
            <div class="sub">${pesc(this._stateSub(st))}</div></div>
        </div>
        <div class="hbtns">${btns}</div>
      </div>
      ${btns ? `<div class="modes-row">${btns}</div>` : ""}`;
    this._syncMenu();
  }

  _renderTabs() {
    const el = this.shadowRoot?.querySelector(".tabs");
    if (!el) return;
    const n = this._blocking().length;
    el.innerHTML = this._shownTabs()
      .map(
        (t) =>
          `<button class="tab${t === this._tab ? " on" : ""}" role="tab" aria-selected="${t === this._tab}" data-a="tab" data-v="${t}">${pesc(this._t(`t_${t}`))}${
            t === "sensors" && n ? `<span class="cnt">${n}</span>` : ""
          }</button>`,
      )
      .join("");
  }

  // keepFocus: redrawn while a field has the focus (a chip or a select): the focus goes back to the same field.
  _renderPage(keepFocus = false) {
    const page = this.shadowRoot?.querySelector(".page");
    if (!page || !this._hass) return;
    const focus = keepFocus ? this._focusKey() : null;
    let html;
    if (!this._set) html = `<div class="empty">${pesc(this._t("loading"))}</div>`;
    else if (this._tab === "settings") html = this._pageSettings();
    else if (this._set.alarmo === false) html = this._noAlarmo();
    else if (!this._d) html = `<div class="empty">${pesc(this._t("loading"))}</div>`;
    else html = this[`_page_${this._tab}`]();
    page.innerHTML = html;
    const ov = this.shadowRoot.querySelector(".overlay");
    if (ov) ov.innerHTML = this._popupHtml() + (this._toast ? `<div class="toast${this._toastBad ? " bad" : ""}" role="status">${pesc(this._toast)}</div>` : "");
    if (focus) this._restoreFocus(focus);
  }

  _focusKey() {
    const a = this.shadowRoot?.activeElement;
    if (!a) return null;
    return { id: a.closest("[data-id]")?.dataset.id, f: a.dataset.f, q: a.dataset.q !== undefined, pos: a.selectionStart };
  }

  _restoreFocus(k) {
    const sel = k.q ? "[data-q]" : k.f && k.id ? `[data-id="${CSS.escape(k.id)}"] [data-f="${CSS.escape(k.f)}"]` : null;
    const el = sel && this.shadowRoot.querySelector(sel);
    if (!el) return;
    el.focus();
    try {
      if (k.pos != null) el.setSelectionRange(k.pos, k.pos);
    } catch (_err) {
      /* not a text field */
    }
  }

  _noAlarmo() {
    return `<div class="box empty-box"><div class="ti c-grey big">${picon(PI.info)}</div><h3>${pesc(this._t("no_alarmo"))}</h3><p>${pesc(this._t("no_alarmo_hint"))}</p></div>`;
  }

  _popupHtml() {
    const p = this._popup;
    if (!p) return "";
    const body =
      p.kind === "code"
        ? `<h3>${pesc(this._t("code_title"))}</h3><p>${pesc(this._t("code_hint"))}</p><input class="txt" type="password" autocomplete="off" ${p.format === "number" ? 'inputmode="numeric"' : ""}>`
        : `<h3>${pesc(this._t("confirm_delete", { name: p.name }))}</h3>`;
    return `<div class="backdrop"><div class="popup" role="dialog" aria-modal="true">${body}
      <div class="actions"><button class="btn" data-a="popup-cancel">${pesc(this._t("cancel"))}</button>
      <button class="btn ${p.kind === "confirm" ? "danger" : "acc"}" data-a="popup-ok">${pesc(p.kind === "confirm" ? this._t("delete") : "OK")}</button></div></div></div>`;
  }

  // Building blocks.
  _tile(id, { icon, c = "c-grey", name, line, lineMuted = false, pill, pillC = "c-grey", right = "", body = "", tags = [] }) {
    const open = this._open.has(id);
    return `<div class="tile${open ? " open" : ""}" data-id="${pesc(id)}">
      <div class="trow"${body ? ` data-a="toggle-tile" role="button" tabindex="0" aria-expanded="${open}"` : ""}><div class="ti ${c}">${picon(icon)}</div>
        <div class="tx ${c}"><div class="tn">${pesc(name)}</div><div class="ts${lineMuted ? " muted" : ""}">${pesc(line)}</div>${
          tags.length ? `<div class="mini-tags">${tags.map((t) => `<span class="tag">${pesc(t)}</span>`).join("")}</div>` : ""
        }${pill ? `<span class="pill inline ${pillC}"><span class="dot"></span>${pesc(pill)}</span>` : ""}</div>
        ${pill ? `<span class="pill side ${pillC}"><span class="dot"></span>${pesc(pill)}</span>` : ""}${right}${body ? `<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="${PI.chev}"/></svg>` : ""}</div>
      ${body && open ? `<div class="tbody">${body}</div>` : ""}</div>`;
  }

  _tg(on, a, v = "", label = "") {
    return `<span class="tg${on ? " on" : ""}" role="switch" tabindex="0" aria-checked="${!!on}" aria-label="${pesc(label)}" data-a="${a}" data-v="${pesc(v)}"></span>`;
  }

  _row(label, hint, ctl) {
    return `<div class="frow"><div class="fl"><b>${pesc(label)}</b>${hint ? `<small>${pesc(hint)}</small>` : ""}</div>${ctl}</div>`;
  }

  _dtg(id, f, label, hint = "") {
    const on = !!this._val(id, f, false);
    return this._row(label, hint, `<span class="tg${on ? " on" : ""}" role="switch" tabindex="0" aria-checked="${on}" aria-label="${pesc(label)}" data-a="dtg" data-f="${f}"></span>`);
  }

  _numIn(id, f, label, hint, unit = this._t("sec")) {
    const v = this._val(id, f, "");
    return this._row(label, hint, `<span class="num"><input type="number" min="0" data-f="${f}" value="${pesc(v ?? "")}" aria-label="${pesc(label)}"><span>${pesc(unit)}</span></span>`);
  }

  _txtIn(id, f, label, hint = "", type = "text", width = 200) {
    return this._row(
      label,
      hint,
      `<input class="txt" style="width:min(${width}px,100%)" type="${type}" data-f="${f}" value="${pesc(this._val(id, f, ""))}" aria-label="${pesc(label)}"${type === "password" ? ' autocomplete="new-password"' : ""}>`,
    );
  }

  _sel(id, f, label, options, hint = "", live = false) {
    // A field with no value yet shows its first option: the draft holds it, so that saving sends what is shown.
    if (this._val(id, f, undefined) === undefined && options.length) (this._draft[id] ||= {})[f] = options[0][0];
    const cur = String(this._val(id, f, ""));
    return this._row(
      label,
      hint,
      `<select class="sel" data-f="${f}"${live ? " data-live" : ""} aria-label="${pesc(label)}">${options
        .map(([v, l]) => `<option value="${pesc(v)}"${String(v) === cur ? " selected" : ""}>${pesc(l)}</option>`)
        .join("")}</select>`,
    );
  }

  _chips(id, f, label, hint, options, colorOf = () => "c-acc") {
    const cur = new Set(this._val(id, f, []));
    return `<div class="frow col"><div class="fl"><b>${pesc(label)}</b>${hint ? `<small>${pesc(hint)}</small>` : ""}</div><div class="chips">${options
      .map(
        ([v, l]) =>
          `<button class="mchip ${colorOf(v)}${cur.has(v) ? " on" : ""}" aria-pressed="${cur.has(v)}" data-a="chip" data-f="${f}" data-v="${pesc(v)}">${pesc(l)}</button>`,
      )
      .join("")}</div></div>`;
  }

  _btns(...b) {
    return `<div class="actions">${b.join("")}</div>`;
  }

  _btn(label, a, { cls = "", v = "", icon = "" } = {}) {
    return `<button class="btn ${cls}" data-a="${a}" data-v="${pesc(v)}">${icon ? picon(icon) : ""}${pesc(label)}</button>`;
  }

  _box(title, body, { head = "", hint = "", wide = false } = {}) {
    return `<section class="box${wide ? " wide" : ""}"><div class="bh"><h2>${pesc(title)}</h2>${head}</div>${hint ? `<p class="hint">${pesc(hint)}</p>` : ""}${body}</section>`;
  }

  _areaChips(action, current, withAll) {
    const areas = Object.values(this._d.areas || {});
    if (areas.length < 2 && !withAll) return "";
    const items = [...(withAll ? [["all", this._t("all_areas")]] : []), ...areas.map((a) => [a.area_id, a.name])];
    return items.map(([v, l]) => `<button class="fchip${current === v ? " on" : ""}" data-a="${action}" data-v="${pesc(v)}">${pesc(l)}</button>`).join("");
  }

  _modeColor(m) {
    return MODE_CLASS[m] || "c-acc";
  }

  _modeOptions() {
    return ALARM_MODES.map((m) => [m, this._t(`m_${m}`)]);
  }

  // ── General ──
  _page_general() {
    const area = this._curArea();
    const modes = this._d.areas[area]?.modes || {};
    const kit = window.AlarmCardKit;
    const fmt = (s) => (s ? `${s} ${this._t("sec")}` : `0 ${this._t("sec")}`);
    const modeTiles = ALARM_MODES.map((m) => {
      const cfg = modes[m] || {};
      const id = `mode:${m}`;
      const c = MODE_CLASS[m];
      return this._tile(id, {
        icon: kit?.STATE_ICON[c] || PI.home,
        c: cfg.enabled ? `c-${c}` : "c-grey",
        name: this._t(`m_${m}`),
        line: cfg.enabled ? this._t("mode_line", { exit: fmt(cfg.exit_time), entry: fmt(cfg.entry_time), trigger: cfg.trigger_time ? fmt(cfg.trigger_time) : this._t("unlimited") }) : this._t("mode_off"),
        lineMuted: !cfg.enabled,
        right: this._tg(cfg.enabled, "mode-enable", "", this._t(`m_${m}`)),
        body:
          this._numIn(id, "exit_time", this._t("exit_time"), this._t("exit_time_hint")) +
          this._numIn(id, "entry_time", this._t("entry_time"), this._t("entry_time_hint")) +
          this._numIn(id, "trigger_time", this._t("trigger_time"), this._t("trigger_time_hint")) +
          this._btns(this._btn(this._t("save"), "mode-save", { cls: "acc" })),
      });
    }).join("");
    const st = this._hass.states;
    const areaTiles = Object.values(this._d.areas)
      .map((a) => {
        const id = `area:${a.area_id}`;
        const ent = this._areaEntity(a.area_id);
        const s = st[ent];
        const cls = s ? kit?.stateClass(s.state) || "idle" : "idle";
        const n = Object.values(this._d.sensors).filter((x) => x.area === a.area_id).length;
        return this._tile(id, {
          icon: PI.home,
          c: `c-${cls}`,
          name: a.name,
          line: `${this._t("area_line", { n })}${ent ? ` · ${ent}` : ""}`,
          pill: s ? this._t(`s_${s.state}`) : "",
          pillC: `c-${cls}`,
          body:
            this._txtIn(id, "name", this._t("area_name")) +
            this._btns(
              Object.keys(this._d.areas).length > 1 ? this._btn(this._t("delete_area"), "area-delete", { cls: "danger", icon: PI.del }) : "",
              this._btn(this._t("save"), "area-save", { cls: "acc" }),
            ),
        });
      })
      .join("");
    const newArea = this._open.has("new-area")
      ? `<div class="tile open new" data-id="new-area"><div class="tbody">${this._txtIn("new-area", "name", this._t("area_name"))}${this._btns(
          this._btn(this._t("cancel"), "close-new", { v: "new-area" }),
          this._btn(this._t("add"), "area-add", { cls: "acc" }),
        )}</div></div>`
      : "";
    const cfg = this._d.config;
    const mq = cfg.mqtt || {};
    const masterBody = cfg.master?.enabled
      ? `<div data-id="master">${this._txtIn("master", "name", this._t("master_name"))}${
          this._draft.master?.name !== undefined ? this._btns(this._btn(this._t("save"), "master-save", { cls: "acc" })) : ""
        }</div>`
      : "";
    const mqttBody = mq.enabled
      ? `<div data-id="mqtt">${this._txtIn("mqtt", "state_topic", this._t("state_topic"))}${this._txtIn("mqtt", "command_topic", this._t("command_topic"))}${this._txtIn(
          "mqtt",
          "event_topic",
          this._t("event_topic"),
        )}${this._dtg("mqtt", "require_code", this._t("require_code"), this._t("require_code_hint"))}${this._btns(this._btn(this._t("save"), "mqtt-save", { cls: "acc" }))}</div>`
      : "";
    const chips = this._areaChips("area-sel", area, false);
    return `${chips ? `<div class="filters">${chips}</div>` : ""}<div class="grid">
      ${this._box(this._t("modes"), `<div class="list">${modeTiles}</div>`, { hint: this._t("modes_hint") })}
      <div class="col">
        ${this._box(this._t("areas"), `<div class="list">${newArea}${areaTiles}</div>`, { head: this._btn(this._t("add_area"), "new", { cls: "acc", v: "new-area", icon: PI.plus }) })}
        ${this._box(
          this._t("behaviour"),
          this._row(this._t("master"), this._t("master_hint"), this._tg(cfg.master?.enabled, "config", "master", this._t("master"))) +
            masterBody +
            this._row(this._t("disarm_after_trigger"), this._t("disarm_after_trigger_hint"), this._tg(cfg.disarm_after_trigger, "config", "disarm_after_trigger", this._t("disarm_after_trigger"))) +
            this._row(
              this._t("ignore_blocking"),
              this._t("ignore_blocking_hint"),
              this._tg(cfg.ignore_blocking_sensors_after_trigger, "config", "ignore_blocking_sensors_after_trigger", this._t("ignore_blocking")),
            ),
        )}
        ${this._box(this._t("mqtt"), mqttBody, { head: this._tg(mq.enabled, "mqtt-enable", "", this._t("mqtt")), hint: this._t("mqtt_hint") })}
      </div></div>`;
  }

  // ── Sensors ──
  _sensorStatus(s) {
    const state = this._hass.states[s.entity_id]?.state;
    if (s.enabled === false) return [this._t("st_disabled"), "c-grey"];
    if (state === undefined || state === "unavailable" || state === "unknown") return [this._t("st_unavailable"), "c-red"];
    if (isOpenState(state)) {
      if (s.auto_bypass) return [this._t("st_bypassed"), "c-grey"];
      if (s.allow_open) return [this._t("st_open_ok"), "c-blue"];
      if ((s.modes || []).length) return [this._t("st_open"), "c-amber"];
    }
    return [this._t("st_ready"), "c-off"];
  }

  _page_sensors() {
    const q = this._query.trim().toLowerCase();
    const match = (id) => !q || id.toLowerCase().includes(q) || this._name(id).toLowerCase().includes(q);
    const groups = this._d.groups || {};
    const sensors = Object.values(this._d.sensors)
      .filter((s) => (this._filter === "all" || s.area === this._filter) && match(s.entity_id))
      .sort((a, b) => this._name(a.entity_id).localeCompare(this._name(b.entity_id)));
    const typeOpts = SENSOR_TYPES.map((t) => [t, this._t(`ty_${t}`)]);
    const areaOpts = Object.values(this._d.areas).map((a) => [a.area_id, a.name]);
    const groupOpts = [["", this._t("none")], ...Object.values(groups).map((g) => [g.group_id, g.name])];
    const tiles = sensors
      .map((s) => {
        const id = `sensor:${s.entity_id}`;
        const st = this._hass.states[s.entity_id];
        const [pill, pillC] = this._sensorStatus(s);
        const open = isOpenState(st?.state);
        const tags = [
          ...(s.modes || []).map((m) => this._t(`m_${m}`)),
          ...(s.always_on ? [this._t("f_always")] : []),
          ...(s.use_entry_delay ? [this._t("f_entry")] : (s.modes || []).length ? [this._t("f_immediate")] : []),
          ...(s.auto_bypass ? [this._t("f_bypass")] : []),
          ...(s.trigger_unavailable ? [this._t("f_unavailable")] : []),
        ];
        const autoBypass = this._val(id, "auto_bypass", false);
        return this._tile(id, {
          icon: PI[s.type] || PI.other,
          c: s.enabled === false ? "c-grey" : open ? "c-blue" : pillC === "c-red" ? "c-red" : "c-off",
          name: this._name(s.entity_id),
          line: `${st ? (open ? this._t("on") : st.state === "off" ? this._t("off") : (this._hass.formatEntityState?.(st) ?? st.state)) : this._t("st_unavailable")} · ${this._areaName(s.area)}`,
          pill,
          pillC,
          tags,
          right: this._tg(s.enabled !== false, "sensor-enable", "", this._name(s.entity_id)),
          body: `<div class="two"><div>${this._sel(id, "type", this._t("type"), typeOpts)}${areaOpts.length > 1 ? this._sel(id, "area", this._t("area"), areaOpts) : ""}${this._sel(
            id,
            "group",
            this._t("group"),
            groupOpts,
          )}${this._chips(id, "modes", this._t("sensor_modes"), this._t("sensor_modes_hint"), this._modeOptions(), (m) => this._modeColor(m))}</div><div>${this._dtg(
            id,
            "use_exit_delay",
            this._t("use_exit_delay"),
          )}${this._dtg(id, "use_entry_delay", this._t("use_entry_delay"), this._t("use_entry_delay_hint"))}${this._dtg(id, "arm_on_close", this._t("arm_on_close"), this._t("arm_on_close_hint"))}${this._dtg(
            id,
            "allow_open",
            this._t("allow_open"),
          )}${this._dtg(id, "auto_bypass", this._t("auto_bypass"), this._t("auto_bypass_hint"))}${
            autoBypass ? this._chips(id, "auto_bypass_modes", this._t("sensor_modes"), "", this._modeOptions(), (m) => this._modeColor(m)) : ""
          }${this._dtg(id, "trigger_unavailable", this._t("trigger_unavailable"))}${this._dtg(id, "always_on", this._t("always_on"), this._t("always_on_hint"))}</div></div>${this._btns(
            this._btn(this._t("remove"), "sensor-remove", { cls: "danger", icon: PI.del }),
            this._btn(this._t("save"), "sensor-save", { cls: "acc" }),
          )}`,
        });
      })
      .join("");
    // Candidates: binary sensors (and a few other open/closed entities) not in the alarm yet.
    const used = new Set(Object.keys(this._d.sensors));
    const cands = Object.keys(this._hass.states)
      .filter((id) => id.startsWith("binary_sensor.") && !used.has(id) && match(id))
      .sort((a, b) => this._name(a).localeCompare(this._name(b)));
    const candTiles = cands
      .slice(0, 60)
      .map((eid) => {
        const type = guessType(this._hass.states[eid]?.attributes?.device_class);
        const on = this._picked.has(eid);
        return `<div class="tile"><div class="trow" data-a="pick" data-v="${pesc(eid)}" role="checkbox" tabindex="0" aria-checked="${on}"><span class="check${on ? " on" : ""}"></span><div class="ti ${
          TYPE_COLOR[type]
        }">${picon(PI[type])}</div><div class="tx"><div class="tn">${pesc(this._name(eid))}</div><div class="ts muted">${pesc(eid)}</div></div></div></div>`;
      })
      .join("");
    const addHead = `<div class="hgroup">${
      areaOpts.length > 1
        ? `<span data-id="add-sensors"><select class="sel" data-f="area" aria-label="${pesc(this._t("area"))}">${areaOpts
            .map(([v, l]) => `<option value="${pesc(v)}"${(this._draft["add-sensors"]?.area || this._curArea()) === v ? " selected" : ""}>${pesc(l)}</option>`)
            .join("")}</select></span>`
        : ""
    }${this._picked.size ? this._btn(this._t("add_n", { n: this._picked.size }), "sensors-add", { cls: "acc", icon: PI.plus }) : ""}</div>`;
    const groupTiles = Object.values(groups)
      .map((g) => this._groupTile(`group:${g.group_id}`, g))
      .join("");
    const newGroup = this._open.has("new-group") ? this._groupTile("new-group", {}, true) : "";
    return `<div class="filters">${this._areaChips("filter", this._filter, true)}<label class="search">${picon(PI.search)}<input data-q placeholder="${pesc(this._t("search"))}" value="${pesc(
      this._query,
    )}"></label></div>
      <div class="grid">
        ${this._box(`${this._t("sensors")} · ${sensors.length}`, sensors.length ? `<div class="list">${tiles}</div>` : `<p class="hint">${pesc(this._t("no_sensors"))}</p>`, { wide: true })}
        ${this._box(this._t("add_sensors"), cands.length ? `<div class="list">${candTiles}</div>` : `<p class="hint">${pesc(this._t("no_candidates"))}</p>`, {
          head: addHead,
          hint: this._t("add_sensors_hint"),
        })}
        ${this._box(this._t("groups"), `<div class="list">${newGroup}${groupTiles}</div>`, {
          head: this._btn(this._t("new_group"), "new", { cls: "acc", v: "new-group", icon: PI.plus }),
          hint: this._t("groups_hint"),
        })}
      </div>`;
  }

  _groupTile(id, g, fresh = false) {
    const sensorOpts = Object.keys(this._d.sensors).map((eid) => [eid, this._name(eid)]);
    const body =
      this._txtIn(id, "name", this._t("name")) +
      this._numIn(id, "event_count", this._t("event_count"), "", "") +
      this._numIn(id, "timeout", this._t("timeout"), "") +
      this._chips(id, "entities", this._t("group_sensors"), "", sensorOpts) +
      this._btns(
        fresh ? this._btn(this._t("cancel"), "close-new", { v: id }) : this._btn(this._t("delete"), "group-delete", { cls: "danger", icon: PI.del }),
        this._btn(this._t("save"), "group-save", { cls: "acc" }),
      );
    if (fresh) return `<div class="tile open new" data-id="${id}"><div class="tbody">${body}</div></div>`;
    return this._tile(id, {
      icon: PI.group,
      c: "c-acc",
      name: g.name,
      line: this._t("group_line", { events: g.event_count, timeout: g.timeout, n: (g.entities || []).length }),
      body,
    });
  }

  // ── Codes ──
  _page_codes() {
    const cfg = this._d.config;
    const areaOpts = Object.values(this._d.areas).map((a) => [a.area_id, a.name]);
    const userBody = (id, fresh) =>
      this._txtIn(id, "name", this._t("user_name")) +
      (fresh ? this._txtIn(id, "code", this._t("code"), "", "password", 140) : this._txtIn(id, "code", this._t("code"), this._t("code_keep"), "password", 140)) +
      (!fresh && this._draft[id]?.code ? this._txtIn(id, "old_code", this._t("old_code"), "", "password", 140) : "") +
      this._dtg(id, "can_arm", this._t("can_arm")) +
      this._dtg(id, "can_disarm", this._t("can_disarm")) +
      this._dtg(id, "is_override_code", this._t("is_override_code"), this._t("is_override_code_hint")) +
      (areaOpts.length > 1 ? this._chips(id, "area_limit", this._t("area_limit"), this._t("area_limit_hint"), areaOpts) : "") +
      this._btns(
        fresh ? this._btn(this._t("cancel"), "close-new", { v: id }) : this._btn(this._t("delete"), "user-delete", { cls: "danger", icon: PI.del }),
        this._btn(this._t("save"), "user-save", { cls: "acc" }),
      );
    const users = Object.values(this._d.users || {})
      .map((u) => {
        const id = `user:${u.user_id}`;
        const rights = u.can_arm && u.can_disarm ? "u_arm_disarm" : u.can_arm ? "u_arm" : u.can_disarm ? "u_disarm" : "u_none";
        const areas = (u.area_limit || []).length ? u.area_limit.map((a) => this._areaName(a)).join(", ") : this._t("all_areas");
        return this._tile(id, {
          icon: u.is_override_code ? PI.key : PI.account,
          c: u.enabled ? "c-off" : "c-grey",
          name: u.name,
          line: `${this._t(rights)} · ${areas}`,
          lineMuted: !u.enabled,
          pill: u.is_override_code ? this._t("u_override") : "",
          pillC: "c-home",
          right: this._tg(u.enabled, "user-enable", "", u.name),
          body: userBody(id, false),
        });
      })
      .join("");
    const newUser = this._open.has("new-user") ? `<div class="tile open new" data-id="new-user"><div class="tbody">${userBody("new-user", true)}</div></div>` : "";
    const fmt = cfg.code_format === "text" ? "text" : "number";
    return `<div class="grid">
      ${this._box(
        this._t("code_usage"),
        this._row(this._t("code_arm_required"), "", this._tg(cfg.code_arm_required, "config", "code_arm_required", this._t("code_arm_required"))) +
          this._row(this._t("code_disarm_required"), "", this._tg(cfg.code_disarm_required, "config", "code_disarm_required", this._t("code_disarm_required"))) +
          this._row(
            this._t("code_mode_change_required"),
            this._t("code_mode_change_hint"),
            this._tg(cfg.code_mode_change_required, "config", "code_mode_change_required", this._t("code_mode_change_required")),
          ) +
          this._row(
            this._t("code_format"),
            this._t("code_format_hint"),
            `<span class="seg">${["number", "text"].map((f) => `<button class="${fmt === f ? "on" : ""}" aria-pressed="${fmt === f}" data-a="config" data-v="${f}">${pesc(this._t(`cf_${f}`))}</button>`).join("")}</span>`,
          ),
      )}
      ${this._box(`${this._t("users")} · ${Object.keys(this._d.users || {}).length}`, `<div class="list">${newUser}${users}</div>`, {
        head: this._btn(this._t("new_user"), "new", { cls: "acc", v: "new-user", icon: PI.plus }),
      })}
    </div>`;
  }

  // ── Actions ──
  _page_actions() {
    const autos = Object.values(this._d.automations || {});
    const areaOpts = [["0", this._t("all_areas")], ...Object.values(this._d.areas).map((a) => [a.area_id, a.name])];
    const evOpts = EVENTS.map((e) => [e, this._t(`ev_${e}`)]);
    const notifyOpts = Object.keys(this._hass.services?.notify || {})
      .sort()
      .map((s) => [`notify.${s}`, `notify.${s}`]);
    const entityOpts = Object.keys(this._hass.states)
      .filter((id) => ACTION_DOMAINS.includes(id.split(".")[0]))
      .sort((a, b) => this._name(a).localeCompare(this._name(b)))
      .map((id) => [id, `${this._name(id)} (${id})`]);
    const editor = (id, type, fresh) => {
      const common =
        this._txtIn(id, "name", this._t("name"), "", "text", 260) +
        this._sel(id, "event", this._t("event"), evOpts) +
        (areaOpts.length > 2 ? this._sel(id, "area", this._t("area"), areaOpts) : "") +
        this._chips(id, "modes", this._t("action_modes"), this._t("action_modes_hint"), this._modeOptions(), (m) => this._modeColor(m));
      const specific =
        type === "notification"
          ? this._sel(id, "service", this._t("target"), notifyOpts.length ? notifyOpts : [["", this._t("none")]]) +
            this._txtIn(id, "title", this._t("notif_title"), "", "text", 260) +
            this._txtIn(id, "message", this._t("message"), this._t("message_hint"), "text", 260)
          : this._sel(id, "entity_id", this._t("entity"), [["", this._t("none")], ...entityOpts]) +
            this._sel(id, "service_action", this._t("action"), [
              ["turn_on", this._t("turn_on")],
              ["turn_off", this._t("turn_off")],
            ]);
      return (
        common +
        specific +
        this._btns(
          type === "notification" ? this._btn(this._t("test"), "auto-test") : "",
          fresh ? this._btn(this._t("cancel"), "close-new", { v: id }) : this._btn(this._t("delete"), "auto-delete", { cls: "danger", icon: PI.del }),
          this._btn(this._t("save"), "auto-save", { cls: "acc", v: type }),
        )
      );
    };
    const list = (type) =>
      autos
        .filter((a) => (type === "notification" ? a.type === "notification" : a.type !== "notification"))
        .map((a) => {
          const id = `auto:${a.automation_id}`;
          const f = this._autoFlat(a);
          const ev = f.event ? this._t(`ev_${f.event}`) : "";
          const target = type === "notification" ? f.service : `${f.service || ""}${f.entity_id ? ` · ${this._name(f.entity_id)}` : ""}`;
          const color = !a.enabled ? "c-grey" : f.event === "triggered" ? "c-alarm" : f.event === "arm_failure" ? "c-home" : f.event === "disarmed" ? "c-off" : "c-acc";
          return this._tile(id, {
            icon: type === "notification" ? PI.bell : PI.flash,
            c: color,
            name: a.name || ev,
            line: [ev, target, f.area !== "0" ? this._areaName(f.area) : ""].filter(Boolean).join(" · "),
            lineMuted: !a.enabled,
            right: this._tg(a.enabled, "auto-enable", "", a.name),
            body: editor(id, type, false),
          });
        })
        .join("");
    const fresh = (type) => {
      const id = `new-auto:${type}`;
      return this._open.has(id) ? `<div class="tile open new" data-id="${id}"><div class="tbody">${editor(id, type, true)}</div></div>` : "";
    };
    const nl = list("notification");
    const al = list("action");
    return `<div class="grid">
      ${this._box(this._t("notifications"), `<div class="list">${fresh("notification")}${nl || `<p class="hint">${pesc(this._t("no_notifications"))}</p>`}</div>`, {
        head: this._btn(this._t("new_notification"), "new", { cls: "acc", v: "new-auto:notification", icon: PI.plus }),
      })}
      ${this._box(this._t("actions"), `<div class="list">${fresh("action")}${al || `<p class="hint">${pesc(this._t("no_actions"))}</p>`}</div>`, {
        head: this._btn(this._t("new_action"), "new", { cls: "acc", v: "new-auto:action", icon: PI.plus }),
      })}
    </div>`;
  }

  // ── Timeline ──
  // The activity of the alarm's sensors over 6 h, 24 h or 3 days, from Home Assistant's history: the alarm's state on
  // top, then one row per room, sensor type or sensor (the choice, the sort and the filters are kept by the browser).
  _tlState() {
    if (!this._tl) {
      let saved = {};
      try {
        saved = JSON.parse(localStorage.getItem(TL_KEY) || "{}") || {};
      } catch (_err) {
        saved = {};
      }
      this._tl = {
        room: saved.room || "all",
        period: TL_SPANS[saved.period] ? saved.period : "24h",
        group: ["room", "type", "none"].includes(saved.group) ? saved.group : "room",
        sort: ["recent", "count", "name"].includes(saved.sort) ? saved.sort : "recent",
        hidden: new Set(Array.isArray(saved.hidden) ? saved.hidden : []),
        open: new Set(),
        data: null,
        key: "",
        at: 0,
      };
    }
    return this._tl;
  }

  _tlSave() {
    const s = this._tl;
    try {
      localStorage.setItem(TL_KEY, JSON.stringify({ room: s.room, period: s.period, group: s.group, sort: s.sort, hidden: [...s.hidden] }));
    } catch (_err) {
      /* kept for this page only */
    }
  }

  _tlIds() {
    return [this._entityId(), ...Object.keys(this._d?.sensors || {})].filter(Boolean);
  }

  // The history of the window, read again when the period or the sensors change, and every 5 minutes.
  async _tlLoad(force = false) {
    const s = this._tlState();
    const ids = this._tlIds();
    const key = `${s.period}|${ids.join(",")}`;
    if (!force && s.key === key && Date.now() - s.at < 300000) return;
    if (s.loading) return;
    s.loading = true;
    s.key = key;
    s.at = Date.now();
    const start = new Date(Date.now() - TL_SPANS[s.period] * 3600e3).toISOString();
    try {
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start,
        entity_ids: ids,
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: false,
      });
      s.data = res || {};
    } catch (err) {
      console.warn("alarm-panel: history not loaded", err);
      s.data = {};
    }
    s.loading = false;
    if (this._tab === "timeline") this._renderPage();
  }

  // [start ms, end ms, state] of an entity over the window; its live state extends the history to now.
  _tlSegs(id, t0, now) {
    const pts = (this._tl.data?.[id] || []).map((p) => [((p.lc ?? p.lu) || 0) * 1000, p.s]);
    const live = this._hass.states[id];
    if (live) {
      const t = Date.parse(live.last_changed);
      if (!pts.length || t > pts[pts.length - 1][0]) pts.push([Math.max(t, t0), live.state]);
    }
    return pts.map(([t, st], i) => [Math.max(t, t0), i + 1 < pts.length ? pts[i + 1][0] : now, st]).filter(([a, b]) => b > a);
  }

  _tlRoom(id) {
    const ent = this._hass.entities?.[id];
    const area = ent?.area_id || this._hass.devices?.[ent?.device_id]?.area_id;
    return area ? { id: area, name: this._hass.areas?.[area]?.name || area } : { id: "_none", name: this._t("no_room") };
  }

  _tlWord(type, on) {
    if (type === "motion") return this._t(on ? "tl_motion" : "tl_clear");
    if (type === "environmental" || type === "tamper") return this._t(on ? "tl_detected" : "tl_ok");
    return this._t(on ? "on" : "off");
  }

  _page_timeline() {
    const s = this._tlState();
    this._tlLoad();
    if (!s.data) return `<div class="empty">${pesc(this._t("loading"))}</div>`;
    const now = Date.now();
    const span = TL_SPANS[s.period] * 3600e3;
    const t0 = now - span;
    const pct = (t) => ((t - t0) / span) * 100;
    const lang = this._hass.locale?.language || this._hass.language || "en";
    const fmt = (t) => new Date(t).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    const ago = (t) => {
      const m = Math.round((t - now) / 60000);
      return Math.abs(m) < 60 ? rtf.format(m, "minute") : Math.abs(m) < 2880 ? rtf.format(Math.round(m / 60), "hour") : rtf.format(Math.round(m / 1440), "day");
    };
    const dur = (a, b) => {
      const m = Math.max(1, Math.round((b - a) / 60000));
      return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
    };
    const kit = window.AlarmCardKit;
    const tip = (o) => `data-tip="${pesc(JSON.stringify(o))}"`;
    // The alarm's segments, its delays and its triggers.
    const alarmId = this._entityId();
    const alarm = alarmId ? this._tlSegs(alarmId, t0, now) : [];
    const stateAt = (t) => alarm.find(([a, b]) => t >= a && t < b)?.[2] || "";
    // The sensors, with their room, type and open / unavailable intervals.
    const all = Object.values(this._d.sensors).map((x) => {
      const segs = this._tlSegs(x.entity_id, t0, now);
      return {
        id: x.entity_id,
        name: this._name(x.entity_id),
        type: SENSOR_TYPES.includes(x.type) ? x.type : "other",
        room: this._tlRoom(x.entity_id),
        on: segs.filter(([, , st]) => isOpenState(st)),
        unav: segs.filter(([, , st]) => st === "unavailable" || st === "unknown"),
        live: this._hass.states[x.entity_id]?.state,
      };
    });
    const rooms = [...new Map(all.map((x) => [x.room.id, x.room])).values()].sort((a, b) => (a.id === "_none") - (b.id === "_none") || a.name.localeCompare(b.name));
    if (s.room !== "all" && !rooms.some((r) => r.id === s.room)) s.room = "all";
    const types = SENSOR_TYPES.filter((ty) => all.some((x) => x.type === ty));
    const shown = all.filter((x) => (s.room === "all" || x.room.id === s.room) && !s.hidden.has(x.type));
    const last = (x) => x.on.at(-1)?.[1] ?? 0;
    const sortFn = { recent: (a, b) => last(b) - last(a), count: (a, b) => b.on.length - a.on.length, name: (a, b) => a.name.localeCompare(b.name) }[s.sort];
    const sorted = (l) => [...l].sort(sortFn);
    // Summary tiles.
    const events = shown.flatMap((x) => x.on.map((iv) => ({ x, iv })));
    const most = [...shown].sort((a, b) => b.on.length - a.on.length)[0];
    const longest = [...events].sort((a, b) => b.iv[1] - b.iv[0] - (a.iv[1] - a.iv[0]))[0];
    const triggers = alarm.filter(([, , st]) => st === "triggered");
    const lastTrigger = triggers.at(-1);
    const culprit = lastTrigger && events.filter((e) => e.iv[0] <= lastTrigger[0] && e.iv[0] >= lastTrigger[0] - 300000).sort((a, b) => b.iv[0] - a.iv[0])[0];
    const tile = (c, icon, label, value, sub) =>
      `<div class="sum"><div class="ti ${c}">${picon(icon)}</div><div class="tx"><div class="sl">${pesc(label)}</div><div class="sv">${pesc(value)}</div><div class="ts muted">${pesc(sub)}</div></div></div>`;
    const sums = `<div class="sums">
      ${tile("c-acc", PI.list, this._t("tl_events"), String(events.length), this._t("tl_tracked", { n: shown.length }))}
      ${tile(triggers.length ? "c-alarm" : "c-off", kit?.STATE_ICON.alarm || PI.bell, this._t("tl_triggers"), triggers.length ? String(triggers.length) : this._t("tl_none"), lastTrigger ? `${fmt(lastTrigger[0])}${culprit ? ` · ${culprit.x.name}` : ""}` : this._t("tl_calm"))}
      ${most?.on.length ? tile(TL_COLOR[most.type], PI[most.type], this._t("tl_most"), most.name, `${this._t("tl_times", { n: most.on.length })} · ${most.room.name}`) : ""}
      ${longest ? tile(TL_COLOR[longest.x.type], PI[longest.x.type], this._t("tl_longest"), dur(longest.iv[0], longest.iv[1]), `${longest.x.name} · ${fmt(longest.iv[0])}`) : ""}
    </div>`;
    // Grid lines, armed periods and the delay / trigger marks drawn in every track.
    const step = TL_SPANS[s.period] > 24 ? 6 : TL_SPANS[s.period] > 6 ? 3 : 1;
    const ticks = [];
    const first = new Date(t0);
    first.setMinutes(0, 0, 0);
    for (let t = first.getTime() + 3600e3; t < now; t += 3600e3) {
      const h = new Date(t).getHours();
      if (h % step === 0 && pct(t) < 93) ticks.push([t, h === 0, h !== 0 && (TL_SPANS[s.period] > 24 || h % (step * 2) !== 0)]);
    }
    const under =
      ticks.map(([t, mid]) => `<i class="gl${mid ? " mid" : ""}" style="left:${pct(t)}%"></i>`).join("") +
      alarm
        .filter(([, , st]) => st.startsWith("armed_"))
        .map(([a, b, st]) => `<i class="armed ${MODE_CLASS[st] || "away"}" style="left:${pct(a)}%;width:${pct(b) - pct(a)}%"></i>`)
        .join("");
    const marks = alarm
      .filter(([a, , st]) => (st === "pending" || st === "triggered") && a > t0)
      .map(([a, , st]) => `<i class="mk ${st === "triggered" ? "alarm" : "wait"}" style="left:${pct(a)}%"></i>`)
      .join("");
    const stLabel = (st) => this._t(`s_${st}`);
    const alarmTrack = alarm
      .map(([a, b, st]) => {
        const c = kit ? kit.stateClass(st) : "idle";
        const w = pct(b) - pct(a);
        return `<i class="seg-a ${c}" ${tip({ t: stLabel(st), c: `c-${c}`, l: `${fmt(a)} → ${b >= now - 1000 ? this._t("tl_now") : fmt(b)}`, d: dur(a, b) })} style="left:${pct(a)}%;width:${Math.max(0.4, w)}%"><span>${w > 10 ? pesc(stLabel(st)) : ""}</span></i>`;
      })
      .join("");
    const alarmSt = alarmId ? this._hass.states[alarmId] : null;
    const alarmCls = alarmSt && kit ? kit.stateClass(alarmSt.state) : "idle";
    const alarmRow = `<div class="tl-row alarm"><div class="tl-lab"><div class="ti c-${alarmCls}">${picon(kit?.STATE_ICON[alarmCls] || PI.home)}</div><div class="tx c-${alarmCls}"><div class="tn">${pesc(
      alarmSt?.attributes?.friendly_name || this._t("alarm"),
    )}</div><div class="ts">${pesc(alarmSt ? this._stateSub(alarmSt) : "")}</div></div></div><div class="tl-track">${alarmTrack}<i class="nowdot c-${alarmCls}"></i></div></div>`;
    const bars = (x, cls = "") =>
      x.on
        .map(
          ([a, b]) =>
            `<i class="seg-s ${TL_COLOR[x.type]} ${cls}" ${tip({ t: x.name, r: x.room.name, c: TL_COLOR[x.type], l: `${this._tlWord(x.type, true)} · ${fmt(a)} → ${b >= now - 1000 ? this._t("tl_now") : fmt(b)}`, d: dur(a, b), w: stateAt(a) ? this._t("tl_alarm_at", { state: stLabel(stateAt(a)) }) : "" })} style="left:${pct(a)}%;width:${Math.max(0.4, pct(b) - pct(a))}%"></i>`,
        )
        .join("") +
      x.unav
        .map(([a, b]) => `<i class="seg-u ${cls}" ${tip({ t: x.name, r: x.room.name, c: "c-red", l: `${this._t("st_unavailable")} · ${fmt(a)} → ${fmt(b)}`, d: dur(a, b) })} style="left:${pct(a)}%;width:${pct(b) - pct(a)}%"></i>`)
        .join("");
    const sensorRow = (x, showRoom) => {
      const l = x.on.at(-1);
      // Open now: since when; otherwise its last activity.
      const openNow = isOpenState(x.live) && l && l[1] >= now - 1000;
      const when = openNow ? this._t("sub_since", { time: fmt(l[0]) }) : l ? this._t("tl_last", { ago: ago(l[1]) }) : this._t("tl_no_activity");
      const line = `${showRoom ? `${x.room.name} · ` : ""}${this._tlWord(x.type, isOpenState(x.live))} · ${when}`;
      return `<div class="tl-row"><div class="tl-lab"><div class="ti ${TL_COLOR[x.type]}">${picon(PI[x.type])}</div><div class="tx"><div class="tn">${pesc(x.name)}</div><div class="ts muted">${pesc(line)}</div></div><span class="tcnt">${x.on.length}</span></div>
        <div class="tl-track">${under}${bars(x)}${marks}</div></div>`;
    };
    // Rows: by room, by type, or one row per sensor.
    let groups;
    if (s.group === "type") groups = types.map((ty) => ({ id: `t-${ty}`, name: this._t(`ty_${ty}`), c: TL_COLOR[ty], icon: PI[ty], l: sorted(shown.filter((x) => x.type === ty)) }));
    else if (s.group === "room") groups = rooms.map((r) => ({ id: `r-${r.id}`, name: r.name, c: "c-acc", icon: PI.home, l: sorted(shown.filter((x) => x.room.id === r.id)) }));
    groups = (groups || []).filter((g) => g.l.length);
    const body =
      s.group === "none"
        ? sorted(shown)
            .map((x) => sensorRow(x, true))
            .join("")
        : groups
            .map((g) => {
              const n = g.l.reduce((acc, x) => acc + x.on.length, 0);
              const open = s.open.has(g.id) || (s.group === "room" && s.room !== "all");
              return `<div class="tl-row grp${open ? " open" : ""}" data-a="tl-toggle" data-v="${pesc(g.id)}" role="button" tabindex="0" aria-expanded="${open}"><div class="tl-lab"><div class="ti ${g.c}">${picon(g.icon)}</div><div class="tx"><div class="tn">${pesc(g.name)}</div><div class="ts muted">${pesc(
                `${this._t("tl_n_sensors", { n: g.l.length })} · ${g.l.map((x) => x.name).join(", ")}`,
              )}</div></div><span class="tcnt">${n}</span><svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="${PI.chev}"/></svg></div>
                <div class="tl-track lanes" style="--n:${g.l.length}">${under}${g.l.map((x) => `<div class="lane">${bars(x, "thin")}</div>`).join("")}${marks}</div></div>
                ${open ? `<div class="tl-sub">${g.l.map((x) => sensorRow(x, s.group !== "room")).join("")}</div>` : ""}`;
            })
            .join("");
    const axis = `<div class="tl-axis"><div></div><div class="tl-track">${ticks
      .map(
        ([t, mid, minor]) =>
          `<span class="${mid ? "mid" : ""}${minor ? " minor" : ""}" style="left:${pct(t)}%">${pesc(mid ? new Date(t).toLocaleDateString(lang, { weekday: "short", day: "numeric" }) : `${new Date(t).getHours()} h`)}</span>`,
      )
      .join("")}<span class="now" style="left:100%">${fmt(now)}</span></div></div>`;
    const seg = (a, values, cur) =>
      `<span class="seg">${values.map(([v, l]) => `<button class="${cur === v ? "on" : ""}" aria-pressed="${cur === v}" data-a="${a}" data-v="${v}">${pesc(l)}</button>`).join("")}</span>`;
    const filters = `<div class="filters">${[["all", this._t("all_rooms")], ...rooms.map((r) => [r.id, r.name])]
      .map(([v, l]) => `<button class="fchip${s.room === v ? " on" : ""}" data-a="tl-room" data-v="${pesc(v)}">${pesc(l)}</button>`)
      .join("")}<span class="grow"></span>${seg(
      "tl-period",
      Object.keys(TL_SPANS).map((p) => [p, this._t(`p_${p}`)]),
      s.period,
    )}</div>`;
    const legend = `<div class="legend">${types
      .map(
        (ty) =>
          `<button class="lchip ${TL_COLOR[ty]}${s.hidden.has(ty) ? "" : " on"}" aria-pressed="${!s.hidden.has(ty)}" data-a="tl-type" data-v="${ty}"><i></i>${pesc(this._t(`ty_${ty}`))}</button>`,
      )
      .join("")}<span class="lkey"><i class="u"></i>${pesc(this._t("st_unavailable"))}</span><span class="lkey"><i class="arm"></i>${pesc(this._t("tl_armed"))}</span><span class="lkey"><i class="mk"></i>${pesc(
      this._t("tl_marks"),
    )}</span></div>`;
    const title = this._t({ room: "tl_by_room", type: "tl_by_type", none: "tl_by_sensor" }[s.group]);
    const controls = `<div class="hgroup">${seg(
      "tl-group",
      [
        ["room", this._t("g_room")],
        ["type", this._t("g_type")],
        ["none", this._t("g_none")],
      ],
      s.group,
    )}<select class="sel" data-tl-sort aria-label="${pesc(this._t("so_label"))}">${[
      ["recent", this._t("so_recent")],
      ["count", this._t("so_count")],
      ["name", this._t("so_name")],
    ]
      .map(([v, l]) => `<option value="${v}"${s.sort === v ? " selected" : ""}>${pesc(l)}</option>`)
      .join("")}</select></div>`;
    const empty = !Object.keys(s.data).length ? `<p class="hint">${pesc(this._t("tl_no_history"))}</p>` : "";
    return `${filters}${sums}<section class="box wide"><div class="bh"><h2>${pesc(title)}</h2>${controls}</div>${legend}${empty}<div class="tl">${alarmRow}${body}${axis}</div></section>`;
  }

  _act_tl_room(_id, v) {
    this._tl.room = v;
    this._tlSave();
    this._renderPage();
  }

  _act_tl_period(_id, v) {
    this._tl.period = v;
    this._tlSave();
    this._tl.data = null;
    this._renderPage();
  }

  _act_tl_group(_id, v) {
    this._tl.group = v;
    this._tl.open.clear();
    this._tlSave();
    this._renderPage();
  }

  _act_tl_type(_id, v) {
    const h = this._tl.hidden;
    // At least one type stays shown.
    if (h.has(v)) h.delete(v);
    else if (h.size + 1 < SENSOR_TYPES.length) h.add(v);
    this._tlSave();
    this._renderPage();
  }

  _act_tl_toggle(_id, v) {
    const o = this._tl.open;
    o.has(v) ? o.delete(v) : o.add(v);
    this._renderPage();
  }

  // The tooltip of a bar of the timeline, under it, inside the panel.
  _tlTip(e) {
    const el = e.target.closest?.("[data-tip]");
    this.shadowRoot.querySelector(".tip")?.remove();
    if (!el) return;
    let o;
    try {
      o = JSON.parse(el.dataset.tip);
    } catch (_err) {
      return;
    }
    const host = this.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const d = document.createElement("div");
    d.className = `tip ${o.c || ""}`;
    d.setAttribute("role", "tooltip");
    d.innerHTML = `<b><i></i>${pesc(o.t)}</b>${o.r ? `<div class="m">${pesc(o.r)}</div>` : ""}<div>${pesc(o.l)}</div><div class="m">${pesc(this._t("tl_duration", { d: o.d }))}</div>${o.w ? `<div class="m">${pesc(o.w)}</div>` : ""}`;
    this.shadowRoot.appendChild(d);
    d.style.left = `${Math.min(Math.max(8, b.left - host.left + b.width / 2 - 100), host.width - d.offsetWidth - 8)}px`;
    d.style.top = `${b.bottom - host.top + 8}px`;
  }

  // ── Settings ──
  _pageSettings() {
    const o = this._opts();
    const seg = (key, values, cur) =>
      `<span class="seg">${values
        .map(([v, l]) => `<button class="${String(cur) === String(v) ? "on" : ""}" aria-pressed="${String(cur) === String(v)}" data-a="set" data-v="${key}=${v}">${pesc(l)}</button>`)
        .join("")}</span>`;
    const tabs = o.panel_tabs?.length ? o.panel_tabs : CONTENT_TABS;
    const alarms = Object.keys(this._hass.states).filter((id) => id.startsWith("alarm_control_panel."));
    return `<div class="grid">
      ${this._box(
        this._t("display"),
        this._row(
          this._t("panel_title"),
          "",
          `<span class="hgroup"><input class="txt" style="width:160px" data-set-title maxlength="50" value="${pesc(o.panel_title || "")}" aria-label="${pesc(this._t("panel_title"))}">${this._btn(this._t("save"), "set", {
            v: "panel_title=",
          })}</span>`,
        ) +
          this._row(
            this._t("hide_header"),
            this._t("hide_header_hint"),
            seg(
              "hide_header",
              [
                ["off", this._t("hh_off")],
                ["non_admin", this._t("hh_non_admin")],
                ["all", this._t("hh_all")],
              ],
              o.hide_header || "off",
            ),
          ) +
          `<div class="frow col"><div class="fl"><b>${pesc(this._t("panel_tabs"))}</b></div><div class="chips">${CONTENT_TABS
            .map((t) => `<button class="mchip c-acc${tabs.includes(t) ? " on" : ""}" aria-pressed="${tabs.includes(t)}" data-a="set" data-v="panel_tabs=${t}">${pesc(this._t(`t_${t}`))}</button>`)
            .join("")}</div></div>` +
          this._row(
            this._t("sidebar_badge"),
            this._t("sidebar_badge_hint"),
            seg(
              "sidebar_badge",
              [
                ["true", this._t("enabled")],
                ["false", this._t("disabled")],
              ],
              o.sidebar_badge !== false,
            ),
          ),
      )}
      ${this._box(
        this._t("alarm"),
        this._row(
          this._t("header_entity"),
          "",
          `<select class="sel" data-a="set" data-v="entity=" aria-label="${pesc(this._t("header_entity"))}"><option value="">${pesc(this._t("header_entity_auto"))}</option>${alarms
            .map((id) => `<option value="${pesc(id)}"${o.entity === id ? " selected" : ""}>${pesc(this._name(id))}</option>`)
            .join("")}</select>`,
        ) +
          this._row(
            this._t("illustration_theme"),
            this._t("illustration_theme_hint"),
            seg(
              "illustration_theme",
              [
                ["auto", this._t("th_auto")],
                ["day", this._t("th_day")],
                ["night", this._t("th_night")],
              ],
              o.illustration_theme || "auto",
            ),
          ) +
          `<div class="note">${picon(PI.info)}<span>${pesc(this._t("admin_note"))}</span></div>`,
      )}
    </div>`;
  }
}

const PANEL_STYLE = `
  :host { display: block; min-height: 100vh; background: var(--primary-background-color); color: var(--primary-text-color);
          font-family: var(--paper-font-body1_-_font-family, inherit); font-size: 14px; container: al-panel / inline-size;
          --A: #e5484d; --tile: rgba(127,127,127,.07); }
  :host(.dark) { --tile: rgba(255,255,255,.05); }
  * { box-sizing: border-box; }
  .icon { width: 20px; height: 20px; fill: currentColor; flex: none; }
  /* The card's banner across the page: the whole radar at the right, the text and the mode buttons at its left. */
  .banner { container-type: inline-size; --al-scene-w: 260px; }
  .banner .htext { left: 8px; right: calc(var(--al-scene-w) + 238px); gap: 10px; }
  .banner .name { font-size: 20px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .banner .ibadge { width: 44px; height: 44px; } .banner .ibadge .icon { width: 26px; height: 26px; }
  .banner ha-menu-button { flex: none; color: inherit; margin-right: -6px; }
  .hbtns { position: absolute; z-index: 3; top: 24px; right: calc(var(--al-scene-w) + 12px); display: flex; gap: 6px; }
  .mbtn { all: unset; box-sizing: border-box; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; color: #33506b;
          background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  .mbtn .icon { width: 18px; height: 18px; }
  .banner.dark .mbtn { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .mbtn:hover { background: rgba(255,255,255,.78); } .banner.dark .mbtn:hover { background: rgba(255,255,255,.22); }
  .banner .mbtn.on, .banner.dark .mbtn.on { color: var(--c); box-shadow: inset 0 0 0 1.5px var(--c); }
  .banner.dark .mbtn.on { color: color-mix(in srgb, var(--c) 70%, #fff); }
  .mbtn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .modes-row { display: none; gap: 6px; flex-wrap: wrap; padding: 10px 16px 0; max-width: 1100px; margin: 0 auto; }
  .modes-row .mbtn { background: var(--secondary-background-color, rgba(127,127,127,.12)); box-shadow: none; color: var(--secondary-text-color); }
  .modes-row .mbtn.on { color: var(--c); box-shadow: inset 0 0 0 1.5px var(--c); }
  @container al-panel (max-width: 780px) { .banner { --al-scene-w: 84px; } .banner .al-scene, .banner .al-grid { display: none; } }
  @container al-panel (max-width: 600px) { .hbtns { display: none; } .banner .htext { right: 84px; } .modes-row { display: flex; } }
  .plainbar { display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 12px; border-bottom: 1px solid var(--divider-color); }
  .plainbar .name { font-size: 20px; }
  /* Tabs under the header, as on the other ha-* panels. */
  :host([bare]) .bannerwrap { display: none; }
  .tabbar { display: flex; align-items: center; gap: 8px; padding: 0 12px; border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); background: var(--primary-background-color);
            position: sticky; top: 0; z-index: 4; }
  .tmenu { display: none; margin-left: -8px; color: var(--primary-text-color); } :host([bare]) .tmenu { display: block; }
  .tabs { flex: 1; min-width: 0; display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
  .tab { all: unset; cursor: pointer; padding: 12px 10px 10px; font-size: 14px; font-weight: 500; white-space: nowrap; color: var(--secondary-text-color); border-bottom: 2px solid transparent; }
  .tab.on { color: var(--primary-text-color); border-bottom-color: var(--A); }
  .tab:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
  .cnt { display: inline-block; min-width: 18px; padding: 1px 5px; margin-left: 4px; border-radius: 9px; font-size: 11px; text-align: center;
         color: color-mix(in srgb, var(--al-home) 45%, var(--primary-text-color)); background: color-mix(in srgb, var(--al-home) 18%, transparent); }
  .page { max-width: 1100px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr)); gap: 14px; align-items: start; }
  .col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  .box { background: var(--card-background-color, #fff); border-radius: var(--ha-card-border-radius, 12px); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
         padding: 12px 16px 14px; min-width: 0; }
  .box.wide { grid-column: 1 / -1; }
  .bh { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; min-height: 32px; }
  .bh h2 { margin: 0; font-size: 14px; font-weight: 500; color: var(--secondary-text-color); }
  .hgroup { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
  .hint { font-size: 12px; color: var(--secondary-text-color); margin: -4px 0 10px; line-height: 1.4; }
  .empty { padding: 48px 16px; text-align: center; color: var(--secondary-text-color); }
  .empty-box { text-align: center; padding: 32px 16px; } .empty-box h3 { margin: 12px 0 4px; font-weight: 500; } .empty-box p { margin: 0 auto; max-width: 460px; color: var(--secondary-text-color); line-height: 1.5; }
  .ti.big { margin: 0 auto; width: 48px; height: 48px; }
  /* Tiles: the ha-* card look (neutral tile, round tinted icon, bold name, coloured state line, state pill). */
  .list { display: flex; flex-direction: column; gap: 6px; }
  .tile { border-radius: 12px; background: var(--tile); }
  .trow { display: flex; align-items: center; gap: 10px; padding: 8px 10px; min-height: 52px; border-radius: 12px; }
  .trow[data-a] { cursor: pointer; }
  .trow:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
  .ti { --c: var(--al-idle); width: 36px; height: 36px; border-radius: 50%; flex: none; display: grid; place-items: center; color: var(--c); background: color-mix(in srgb, var(--c) 16%, transparent); }
  .tx { flex: 1; min-width: 0; }
  .tn { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ts { font-size: 12px; margin-top: 1px; color: color-mix(in srgb, var(--c, var(--al-idle)) 45%, var(--primary-text-color)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ts.muted { color: var(--secondary-text-color); }
  .pill { --c: var(--al-idle); display: inline-flex; align-items: center; gap: 5px; flex: none; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 12px; white-space: nowrap;
          background: color-mix(in srgb, var(--c) 15%, transparent); color: color-mix(in srgb, var(--c) 40%, var(--primary-text-color)); }
  .pill .dot { width: 6px; height: 6px; }
  /* On a phone the state pill goes under the name, which keeps the room beside the switch. */
  .pill.inline { display: none; margin-top: 4px; }
  @container al-panel (max-width: 560px) {
    .pill.side { display: none; } .pill.inline { display: inline-flex; }
    .tbody { padding-left: 12px; }
    .sel { max-width: 55%; }
  }
  .chev { width: 18px; height: 18px; fill: var(--secondary-text-color); transition: transform .15s; flex: none; }
  .tile.open .chev { transform: rotate(90deg); }
  .tbody { padding: 4px 12px 12px 56px; }
  .tile.new .tbody { padding: 10px 12px 12px; }
  .two { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: 0 20px; }
  .c-off { --c: var(--al-off); } .c-home { --c: var(--al-home); } .c-away { --c: var(--al-away); } .c-night { --c: var(--al-night); } .c-vacation { --c: var(--al-vacation); }
  .c-custom { --c: var(--al-custom); } .c-wait { --c: var(--al-wait); } .c-alarm, .c-red { --c: var(--al-alarm); } .c-idle, .c-grey { --c: var(--al-idle); }
  .c-amber { --c: var(--al-home); } .c-blue { --c: var(--info-color, #2f80ed); } .c-violet { --c: var(--al-night); } .c-acc { --c: var(--A); }
  /* Form rows. */
  .frow { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 42px; padding: 4px 0; border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent); }
  .frow:last-child { border-bottom: 0; }
  .frow.col { display: block; padding: 8px 0; } .frow.col .fl { margin-bottom: 6px; }
  .fl { min-width: 0; } .fl b { display: block; font-weight: 500; font-size: 13px; } .fl small { display: block; font-size: 12px; color: var(--secondary-text-color); margin-top: 1px; }
  .num { display: inline-flex; align-items: center; gap: 6px; flex: none; }
  .num input, .txt, .sel { font: inherit; font-size: 13px; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--card-background-color, #fff); color: var(--primary-text-color); }
  .num input { width: 76px; text-align: right; } .num span { font-size: 12px; color: var(--secondary-text-color); }
  .sel { max-width: 60%; }
  .txt:focus, .sel:focus, .num input:focus { outline: 2px solid color-mix(in srgb, var(--A) 50%, transparent); outline-offset: 0; }
  .tg { position: relative; width: 36px; height: 20px; border-radius: 10px; flex: none; cursor: pointer; background: color-mix(in srgb, var(--secondary-text-color) 40%, transparent); transition: background .15s; }
  .tg::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.3); transition: transform .15s; }
  .tg.on { background: var(--A); } .tg.on::after { transform: translateX(16px); }
  .tg:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .seg { display: inline-flex; border: 1px solid var(--divider-color); border-radius: 18px; overflow: hidden; flex: none; }
  .seg button { all: unset; cursor: pointer; padding: 5px 12px; font-size: 12px; color: var(--secondary-text-color); }
  .seg button + button { border-left: 1px solid var(--divider-color); }
  .seg button.on { color: color-mix(in srgb, var(--A) 55%, var(--primary-text-color)); background: color-mix(in srgb, var(--A) 14%, transparent); }
  .seg button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .mchip { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 4px 10px; border-radius: 14px; border: 1px solid var(--divider-color); color: var(--secondary-text-color); }
  .mchip.on { color: color-mix(in srgb, var(--c) 45%, var(--primary-text-color)); background: color-mix(in srgb, var(--c) 14%, transparent); border-color: color-mix(in srgb, var(--c) 45%, transparent); }
  .mchip:focus-visible { outline: 2px solid var(--primary-color); }
  .mini-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
  .tag { font-size: 10.5px; padding: 1px 6px; border-radius: 8px; background: color-mix(in srgb, var(--secondary-text-color) 14%, transparent); color: var(--secondary-text-color); }
  /* Buttons: never filled (tinted, as on the cards). */
  .btn { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; padding: 6px 12px; border-radius: 18px;
         background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); white-space: nowrap; }
  .btn .icon { width: 16px; height: 16px; }
  .btn.acc { background: color-mix(in srgb, var(--A) 14%, transparent); color: color-mix(in srgb, var(--A) 55%, var(--primary-text-color)); }
  .btn.danger { background: color-mix(in srgb, var(--al-alarm) 12%, transparent); color: color-mix(in srgb, var(--al-alarm) 55%, var(--primary-text-color)); }
  .btn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; flex-wrap: wrap; }
  .filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .fchip { all: unset; cursor: pointer; display: inline-flex; align-items: center; min-height: 32px; padding: 0 12px; border-radius: 18px; font-size: 13px; box-sizing: border-box;
           color: var(--secondary-text-color); background: var(--card-background-color, #fff); border: 1px solid var(--divider-color); }
  .fchip.on { color: var(--primary-text-color); border: 1.5px solid var(--A); }
  .fchip:focus-visible { outline: 2px solid var(--primary-color); }
  .search { flex: 1; min-width: 180px; display: flex; align-items: center; gap: 6px; padding: 0 10px; height: 34px; border-radius: 18px; border: 1px solid var(--divider-color);
            background: var(--card-background-color, #fff); color: var(--secondary-text-color); }
  .search input { all: unset; flex: 1; font-size: 13px; color: var(--primary-text-color); }
  .check { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid var(--secondary-text-color); flex: none; display: grid; place-items: center; }
  .check.on { background: color-mix(in srgb, var(--A) 18%, transparent); border-color: var(--A); }
  .check.on::after { content: ""; width: 5px; height: 9px; border: solid var(--A); border-width: 0 2px 2px 0; transform: rotate(45deg) translate(-1px, -1px); }
  .note { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--secondary-text-color); padding: 8px 10px; border-radius: 10px; background: var(--tile); margin-top: 10px; line-height: 1.4; }
  .note .icon { width: 16px; height: 16px; }
  /* Popups at the top of the panel (code, delete), and a short toast. */
  .backdrop { position: fixed; inset: 0; z-index: 10; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center; padding-top: 96px; }
  .popup { background: var(--card-background-color, #fff); color: var(--primary-text-color); width: min(92%, 360px); border-radius: 16px; padding: 16px 18px; box-shadow: 0 10px 40px rgba(0,0,0,.3); }
  .popup h3 { margin: 0 0 6px; font-size: 16px; font-weight: 500; } .popup p { margin: 0 0 10px; font-size: 13px; color: var(--secondary-text-color); }
  .popup .txt { width: 100%; font-size: 16px; }
  .toast { position: fixed; z-index: 11; left: 50%; bottom: 24px; transform: translateX(-50%); padding: 8px 16px; border-radius: 18px; font-size: 13px;
           background: var(--primary-text-color); color: var(--primary-background-color); box-shadow: 0 4px 16px rgba(0,0,0,.25); }
  .toast.bad { background: var(--al-alarm); color: #fff; }
  /* Timeline: summary tiles, then the alarm's band and the rows of the sensors over the window. */
  .c-cyan { --c: var(--al-vacation); }
  .grow { flex: 1; }
  .bh { flex-wrap: wrap; } .bh .sel { max-width: none; }
  .sums { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
  .sum { display: flex; gap: 10px; align-items: center; padding: 12px; border-radius: 12px; background: var(--card-background-color, #fff); border: 1px solid var(--divider-color); min-width: 0; }
  .sum .sl { font-size: 12px; color: var(--secondary-text-color); }
  .sum .sv { font-size: 17px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tl { display: flex; flex-direction: column; position: relative; }
  .tl-row { display: grid; grid-template-columns: minmax(170px, 250px) minmax(0, 1fr); align-items: center; gap: 12px; min-height: 46px; border-top: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent); }
  .tl-row.alarm { min-height: 54px; border-top: 0; }
  .tl-lab { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .tl-lab .ti { width: 30px; height: 30px; } .tl-lab .icon { width: 17px; height: 17px; }
  .tcnt { margin-left: auto; flex: none; font-size: 11px; font-weight: 600; color: var(--secondary-text-color); background: var(--tile); border-radius: 9px; padding: 1px 7px; }
  .tl-track { position: relative; height: 24px; border-radius: 6px; background: var(--tile); overflow: hidden; }
  .tl-row.alarm .tl-track { height: 28px; overflow: visible; }
  .tl-track > i, .lane > i { position: absolute; top: 0; bottom: 0; }
  .gl { width: 1px; background: color-mix(in srgb, var(--divider-color) 70%, transparent); }
  .gl.mid { width: 0; border-left: 1.5px dashed color-mix(in srgb, var(--secondary-text-color) 50%, transparent); }
  .armed { --c: var(--al-away); background: color-mix(in srgb, var(--c) 8%, transparent); }
  .armed.home { --c: var(--al-home); } .armed.night { --c: var(--al-night); } .armed.vacation { --c: var(--al-vacation); } .armed.custom { --c: var(--al-custom); }
  .mk { width: 0; border-left: 2px dotted var(--al-wait); z-index: 2; } .mk.alarm { border-left: 2px solid var(--al-alarm); }
  .seg-a { background: color-mix(in srgb, var(--c, var(--al-idle)) 72%, transparent); display: flex; align-items: center; overflow: hidden; cursor: pointer; }
  .seg-a:first-child { border-radius: 6px 0 0 6px; }
  .seg-a.off { background: color-mix(in srgb, var(--c) 28%, transparent); }
  .seg-a.alarm { background: var(--c); box-shadow: 0 0 0 2px color-mix(in srgb, var(--c) 35%, transparent); z-index: 2; }
  .seg-a span { font-size: 11px; font-weight: 500; color: #fff; padding-left: 7px; white-space: nowrap; }
  .seg-a.off span, .seg-a.idle span { color: color-mix(in srgb, var(--c) 45%, var(--primary-text-color)); }
  .nowdot { left: calc(100% - 5px) !important; top: 9px !important; bottom: auto !important; width: 10px; height: 10px; border-radius: 50%; background: var(--c); z-index: 3;
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 30%, transparent); animation: tl-pulse 2s ease-in-out infinite; }
  @keyframes tl-pulse { 50% { box-shadow: 0 0 0 6px transparent; } }
  .seg-s { top: 5px !important; bottom: 5px !important; border-radius: 4px; background: var(--c); min-width: 3px; cursor: pointer; z-index: 1; }
  .seg-u { background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--al-alarm) 55%, transparent) 0 4px, transparent 4px 8px); cursor: pointer; z-index: 1; }
  .seg-s:hover, .seg-a:hover, .seg-u:hover { filter: brightness(1.12); }
  .lanes { height: calc(var(--n) * 7px + 8px); padding: 4px 0; display: flex; flex-direction: column; gap: 1px; }
  .lane { position: relative; flex: 1; }
  .seg-s.thin, .seg-u.thin { top: 0 !important; bottom: 0 !important; border-radius: 2px; }
  .tl-row.grp { cursor: pointer; } .tl-row.grp .chev { margin-left: 6px; } .tl-row.grp.open .chev { transform: rotate(90deg); }
  .tl-row.grp:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
  .tl-sub { padding-left: 16px; border-left: 2px solid color-mix(in srgb, var(--A) 30%, transparent); margin: 0 0 6px 14px; }
  .tl-axis { display: grid; grid-template-columns: minmax(170px, 250px) minmax(0, 1fr); gap: 12px; margin-top: 6px; }
  .tl-axis .tl-track { background: none; height: 16px; overflow: visible; }
  .tl-axis span { position: absolute; transform: translateX(-50%); font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; }
  .tl-axis span.mid { font-weight: 600; color: var(--primary-text-color); }
  .tl-axis span.now { transform: translateX(-100%); color: var(--A); font-weight: 600; }
  .legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; font-size: 12px; color: var(--secondary-text-color); margin: -2px 0 12px; }
  .lchip { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 14px; border: 1px solid var(--divider-color); }
  .lchip:focus-visible { outline: 2px solid var(--primary-color); }
  .lchip i, .lkey i { width: 14px; height: 8px; border-radius: 3px; background: var(--c); display: inline-block; }
  .lchip:not(.on) { opacity: .5; } .lchip:not(.on) i { background: transparent; box-shadow: inset 0 0 0 1.5px var(--c); }
  .lchip.on { color: var(--primary-text-color); }
  .lkey { display: inline-flex; align-items: center; gap: 6px; }
  .lkey i.u { background: repeating-linear-gradient(135deg, var(--al-alarm) 0 3px, transparent 3px 6px); }
  .lkey i.arm { background: color-mix(in srgb, var(--al-away) 22%, transparent); }
  .lkey i.mk { width: 0; height: 12px; border-left: 2px dotted var(--al-wait); background: none; border-radius: 0; }
  .tip { position: absolute; z-index: 30; pointer-events: none; min-width: 180px; max-width: 260px; padding: 10px 12px; border-radius: 12px; background: var(--card-background-color, #fff);
         color: var(--primary-text-color); box-shadow: 0 8px 28px rgba(0,0,0,.22); border: 1px solid var(--divider-color); font-size: 12px; line-height: 1.45; }
  .tip b { display: flex; align-items: center; gap: 6px; font-size: 13px; } .tip b i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
  .tip .m { color: var(--secondary-text-color); }
  @container al-panel (max-width: 600px) {
    .tl-row, .tl-axis { grid-template-columns: minmax(0, 1fr); gap: 6px; padding: 8px 0; }
    .tl-axis > div:first-child { display: none; }
    .tl-axis span.minor { display: none; }
    .sums { grid-template-columns: 1fr 1fr; } .sum { padding: 10px; } .sum .ti { display: none; }
  }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;

if (!customElements.get("alarm-card-panel")) customElements.define("alarm-card-panel", AlarmCardPanel);
console.info(`%c ALARM-PANEL %c v${PANEL_VERSION} `, "color: white; background: #e5484d; font-weight: 700;", "color: #e5484d; background: white; font-weight: 700;");
