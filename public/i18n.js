/**
 * TrackPhoneNow - Global Internationalization (i18n) Engine
 * Supports: English (en - Default), Français (fr), العربية (ar - RTL), Español (es), Deutsch (de)
 * Includes GeoIP automatic detection, local storage persistence, and manual switcher UI
 */

const I18N_TRANSLATIONS = {
  en: {
    dir: 'ltr',
    name: 'English',
    flag: '🇺🇸',
    nav: {
      stolenRecovery: 'Stolen Phone Recovery',
      howItWorks: 'How It Works',
      transparency: 'Transparency',
      pricing: 'Pricing',
      faq: 'FAQ',
      signIn: 'Sign In',
      register: 'Register',
      memberConsole: 'Member Console',
      audioOn: 'Audio: ON',
      audioOff: 'Audio: OFF'
    },
    hero: {
      badge: '160+ COUNTRIES · ALL CELLULAR OPERATORS · REAL-TIME GPS',
      title: 'Locate any mobile phone,',
      titleHighlight: 'from a single search input',
      subtitle: 'Receive direct GPS coordinates on high-resolution Google Satellite Maps in under 2 minutes. Compatible with all iPhone and Android handsets with zero app download required.',
      placeholder: '6 12 34 56 78',
      button: 'Locate Mobile',
      locatingBtn: 'Scanning GSM...',
      trustNotice: 'Zero App or APK Download Required · 100% Cloud-Based Telemetry · GDPR Compliant',
      guarantee: 'Instant Activation via Secure Crypto Settlement (USDT, BTC, ETH, SOL) · No KYC Required'
    },
    scanModal: {
      locating: 'LOCATING MOBILE DEVICE...',
      step1Title: 'Connecting to Cellular Network...',
      step1Detail: 'Querying carrier gateway & active cell routing...',
      step2Title: 'Carrier & Network Confirmed',
      step2Detail: 'Status: Online & Ready for Positioning',
      step3Title: 'Connecting to GPS Satellites...',
      step3Detail: 'Pinging cellular base transceiver stations...',
      step4Title: 'Phone Location Found! Coordinates Ready',
      step4Detail: 'GPS satellite match verified: Accuracy within ±3.5 meters.'
    },
    paywallModal: {
      targetLocked: 'Target GPS Signal Locked',
      reservedTime: 'RESERVED TIME',
      title: 'Pay with Crypto to Access Map',
      passBadge: 'Pro Unlimited Pass',
      subtitle: 'Select your preferred cryptocurrency below. 100% private, verified on blockchain.',
      amountDue: 'AMOUNT DUE',
      depositAddress: 'OFFICIAL RECEIVING ADDRESS',
      viewExplorer: 'View Address on Explorer',
      txLabel: 'AUTOMATIC MEMPOOL SCANNER (NO TXID REQUIRED)',
      txPlaceholder: 'Scanning incoming transfers or paste optional TxID...',
      confirmBtn: 'I Have Sent Payment (Verify Blockchain)',
      footerNotice: 'Transactions are monitored 24/7 via blockchain explorers. Access unlocks once verified on-chain.'
    },
    pricing: {
      eyebrow: 'CLEAR PASS PRICING',
      title: 'Simple, transparent access',
      subtitle: 'No recurring hidden commitments. Choose the pass duration that fits your investigation.',
      plan1Name: 'Pro 1-Month Pass',
      plan1Price: '$24.99',
      plan1Duration: '/ 30 days',
      plan1Desc: 'Standard Single Investigation',
      plan2Badge: 'MOST POPULAR · SAVE 33%',
      plan2Name: 'Pro 3-Month Pass',
      plan2Price: '$49.99',
      plan2Duration: '/ 90 days',
      plan2Desc: 'Only $16.66/month · Best for Extended Recovery',
      plan3Badge: 'BEST VALUE · SAVE 40%',
      plan3Name: 'Pro 6-Month Pass',
      plan3Price: '$89.99',
      plan3Duration: '/ 180 days',
      plan3Desc: 'Only $14.99/month · Full Forensic Dossiers Included',
      buyBtn: 'Activate Pass Now',
      feature1: 'Unlimited simultaneous phone tracking',
      feature2: 'Pinpoint GPS accuracy (±3.5m on Satellite Maps)',
      feature3: 'Offline Auto-Wake Watchdog + WhatsApp alarms',
      feature4: 'Multi-operator SS7 routing (194 countries)',
      feature5: 'SHA-256 Forensic Audit Dossier (Police & Insurance)'
    },
    footer: {
      copyright: '© 2026 TrackPhoneNow Telecom Systems. GSMA & 3GPP Compliant Protocol Infrastructure. All rights reserved.'
    }
  },

  fr: {
    dir: 'ltr',
    name: 'Français',
    flag: '🇫🇷',
    nav: {
      stolenRecovery: 'Récupération Téléphone Volé',
      howItWorks: 'Comment ça marche',
      transparency: 'Transparence',
      pricing: 'Tarifs',
      faq: 'FAQ',
      signIn: 'Connexion',
      register: 'Inscription',
      memberConsole: 'Espace Membre',
      audioOn: 'Audio: ACTIF',
      audioOff: 'Audio: MUET'
    },
    hero: {
      badge: '160+ PAYS · TOUS OPÉRATEURS TÉLÉCOM · GPS TEMPS RÉEL',
      title: 'Localisez n’importe quel téléphone,',
      titleHighlight: 'à partir d’un simple numéro',
      subtitle: 'Obtenez les coordonnées GPS exactes sur Google Maps Satellite en moins de 2 minutes. Compatible avec tous les smartphones iPhone et Android sans aucune application à installer.',
      placeholder: '6 12 34 56 78',
      button: 'Localiser le Mobile',
      locatingBtn: 'Connexion GSM...',
      trustNotice: 'Aucune application requise · 100% Basé sur le réseau télécom · Conforme RGPD',
      guarantee: 'Activation immédiate par règlement Crypto sécurisé (USDT, BTC, ETH, SOL) · Aucun KYC requis'
    },
    scanModal: {
      locating: 'LOCALISATION DU MOBILE EN COURS...',
      step1Title: 'Connexion au réseau cellulaire...',
      step1Detail: 'Interrogation de la passerelle opérateur et du routage BTS...',
      step2Title: 'Opérateur & Réseau confirmés',
      step2Detail: 'Statut: En ligne et prêt pour le positionnement',
      step3Title: 'Connexion aux satellites GPS...',
      step3Detail: 'Triangulation par les antennes relais de transmission...',
      step4Title: 'Téléphone localisé ! Coordonnées prêtes',
      step4Detail: 'Correspondance satellite vérifiée: Précision à ±3.5 mètres.'
    },
    paywallModal: {
      targetLocked: 'Signal GPS Verrouillé avec Succès',
      reservedTime: 'TEMPS RÉSERVÉ',
      title: 'Réglez en Crypto pour Accéder à la Carte',
      passBadge: 'Pass Pro Illimité',
      subtitle: 'Sélectionnez votre cryptomonnaie ci-dessous. 100% confidentiel, vérifié sur la blockchain.',
      amountDue: 'MONTANT À PAYER',
      depositAddress: 'ADRESSE OFFICIELLE DE DÉPÔT',
      viewExplorer: 'Voir l’adresse sur l’Explorer',
      txLabel: 'DÉTECTION AUTOMATIQUE BLOCKCHAIN (AUCUN TXID REQUIS)',
      txPlaceholder: 'Scan automatique des transferts ou collez un TxID facultatif...',
      confirmBtn: "J'ai effectué le paiement (Vérifier la Blockchain)",
      footerNotice: 'Surveillance continue 24/7 sur la blockchain. L’accès s’active dès confirmation sur le réseau.'
    },
    pricing: {
      eyebrow: 'TARIFS TRANSPARENTS',
      title: 'Accès simple et sans surprise',
      subtitle: 'Aucun engagement caché. Choisissez la durée de pass adaptée à votre recherche.',
      plan1Name: 'Pass Pro 1 Mois',
      plan1Price: '$24.99',
      plan1Duration: '/ 30 jours',
      plan1Desc: 'Recherche Ponctuelle Standard',
      plan2Badge: 'LE PLUS POPULAIRE · REMISE 33%',
      plan2Name: 'Pass Pro 3 Mois',
      plan2Price: '$49.99',
      plan2Duration: '/ 90 jours',
      plan2Desc: 'Seulement $16.66/mois · Recommandé pour Téléphones Perdus',
      plan3Badge: 'MEILLEURE RENTABILITÉ · REMISE 40%',
      plan3Name: 'Pass Pro 6 Mois',
      plan3Price: '$89.99',
      plan3Duration: '/ 180 jours',
      plan3Desc: 'Seulement $14.99/mois · Dossiers Forensics Certifiés Inclus',
      buyBtn: 'Activer le Pass Maintenant',
      feature1: 'Localisations illimitées simultanées',
      feature2: 'Précision GPS extrême (±3.5m sur Satellite)',
      feature3: 'Veilleur Automatique Hors-Ligne + Alertes WhatsApp',
      feature4: 'Routage SS7 multi-opérateurs (194 pays)',
      feature5: 'Dossier Forensic SHA-256 (Police & Assurances)'
    },
    footer: {
      copyright: '© 2026 TrackPhoneNow Telecom Systems. Conforme aux protocoles GSMA & 3GPP. Tous droits réservés.'
    }
  },

  ar: {
    dir: 'rtl',
    name: 'العربية',
    flag: '🇲🇦',
    nav: {
      stolenRecovery: 'استرجاع الهاتف المسروق',
      howItWorks: 'كيف يعمل',
      transparency: 'الشفافية',
      pricing: 'الأسعار',
      faq: 'الأسئلة الشائعة',
      signIn: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      memberConsole: 'لوحة المشترك',
      audioOn: 'الصوت: مشغل',
      audioOff: 'الصوت: مكتوم'
    },
    hero: {
      badge: 'أكثر من 160 دولة · جميع شركات الاتصالات · تحديد موقع GPS فوري',
      title: 'حدد موقع أي هاتف بدقة،',
      titleHighlight: 'من خلال إدخال الرقم فقط',
      subtitle: 'احصل على إحداثيات GPS المباشرة على خرائط الأقمار الصناعية عالية الدقة في أقل من دقيقتين. متوافق مع جميع هواتف iPhone و Android دون الحاجة لتثبيت أي تطبيق.',
      placeholder: '6 12 34 56 78',
      button: 'تحديد موقع الهاتف',
      locatingBtn: 'جاري الاتصال بالأبراج...',
      trustNotice: 'لا يتطلب تحميل أي تطبيق أو ملف · يعتمد بالكامل على شبكة الاتصالات · متوافق مع معايير الأمان الدولية',
      guarantee: 'تفعيل فوري وآمن عبر الدفع بالعملات الرقمية (USDT, BTC, ETH, SOL) · دون الحاجة لأي وثائق شخصية'
    },
    scanModal: {
      locating: 'جاري تتبع وتحديد موقع الهاتف...',
      step1Title: 'الاتصال بشبكة الاتصالات الخلوية...',
      step1Detail: 'فحص بوابة المشغل الخلوي وتوجيه أبراج الإرسال...',
      step2Title: 'تم تأكيد المشغل والشبكة الخلوية',
      step2Detail: 'الحالة: متصل وجاهز لتحديد الإحداثيات',
      step3Title: 'الاتصال بالأقمار الصناعية GPS...',
      step3Detail: 'تثليث الإشارة عبر 3 أبراج إرسال مركزية...',
      step4Title: 'تم العثور على موقع الهاتف! الإحداثيات جاهزة',
      step4Detail: 'تطابق القمر الصناعي مؤكد: الدقة ضمن نطاق ±3.5 أمتار.'
    },
    paywallModal: {
      targetLocked: 'تم قفل إشارة GPS للهدف بنجاح',
      reservedTime: 'الوقت المحجوز',
      title: 'ادفع بالكريبتو للوصول الفوري للخريطة',
      passBadge: 'اشتراك Pro غير محدود',
      subtitle: 'اختر العملة الرقمية المفضلة لديك أدناه. خصوصية 100% وتحقق مباشر عبر البلوكشين.',
      amountDue: 'المبلغ المطلوب',
      depositAddress: 'عنوان المحفظة الرسمي للإيداع',
      viewExplorer: 'معاينة المحفظة على مستكشف البلوكشين',
      txLabel: 'الكشف التلقائي عبر البلوكشين (بدون إدخال رمز المعاملة)',
      txPlaceholder: 'جاري فحص المعاملات الواردة تلقائياً أو الصق كود اختياري...',
      confirmBtn: 'لقد قمت بالتحويل (فحص البلوكشين وتفعيل الحساب)',
      footerNotice: 'مراقبة المعاملات مستمرة على مدار الساعة. يتم فتح التتبع تلقائياً فور تأكيد الشبكة.'
    },
    pricing: {
      eyebrow: 'أسعار واضحة وشفافة',
      title: 'اشتراكات مباشرة بدون التزامات خفية',
      subtitle: 'لا توجد أي اشتراكات دورية مفاجئة. اختر مدة الاشتراك التي تناسب احتياجاتك.',
      plan1Name: 'اشتراك Pro لمدة شهر',
      plan1Price: '$24.99',
      plan1Duration: '/ 30 يوماً',
      plan1Desc: 'مناسب لعمليات البحث الفردية',
      plan2Badge: 'الأكثر طلباً · خصم 33%',
      plan2Name: 'اشتراك Pro لمدة 3 أشهر',
      plan2Price: '$49.99',
      plan2Duration: '/ 90 يوماً',
      plan2Desc: 'فقط $16.66 شهرياً · الأفضل لاسترجاع الهواتف المفقودة',
      plan3Badge: 'أفضل توفير · خصم 40%',
      plan3Name: 'اشتراك Pro لمدة 6 أشهر',
      plan3Price: '$89.99',
      plan3Duration: '/ 180 يوماً',
      plan3Desc: 'فقط $14.99 شهرياً · يتضمن تقارير جنائية معتمدة',
      buyBtn: 'تفعيل الاشتراك الآن',
      feature1: 'تتبع غير محدود لعدة أرقام في نفس الوقت',
      feature2: 'دقة فائقة (±3.5 متر على صور الأقمار الصناعية)',
      feature3: 'حارس الاستيقاظ التلقائي + تنبيهات واتساب عند التشغيل',
      feature4: 'توجيه SS7 عبر 194 دولة وجميع المشغلين',
      feature5: 'ملف تقرير جنائي مشفر SHA-256 معتمد للشرطة والتأمين'
    },
    footer: {
      copyright: '© 2026 TrackPhoneNow Telecom Systems. متوافق مع معايير GSMA و 3GPP الدولية. جميع الحقوق محفوظة.'
    }
  },

  es: {
    dir: 'ltr',
    name: 'Español',
    flag: '🇪🇸',
    nav: {
      stolenRecovery: 'Recuperar Móvil Robado',
      howItWorks: 'Cómo Funciona',
      transparency: 'Transparencia',
      pricing: 'Precios',
      faq: 'Preguntas',
      signIn: 'Iniciar Sesión',
      register: 'Registrarse',
      memberConsole: 'Consola de Usuario',
      audioOn: 'Audio: ACTIVADO',
      audioOff: 'Audio: SILENCIO'
    },
    hero: {
      badge: 'MÁS DE 160 PAÍSES · TODOS LOS OPERADORES · GPS EN TIEMPO REAL',
      title: 'Localice cualquier teléfono móvil,',
      titleHighlight: 'con una sola búsqueda',
      subtitle: 'Obtenga coordenadas GPS exactas en Google Maps Satélite en menos de 2 minutos. Compatible con todos los teléfonos iPhone y Android sin necesidad de descargar aplicaciones.',
      placeholder: '612 345 678',
      button: 'Localizar Teléfono',
      locatingBtn: 'Conectando a red...',
      trustNotice: 'Sin descargas de APK · 100% Basado en red de telecomunicaciones · Cumple con RGPD',
      guarantee: 'Activación inmediata mediante pago seguro en Cripto (USDT, BTC, ETH, SOL) · Sin verificación KYC'
    },
    scanModal: {
      locating: 'LOCALIZANDO DISPOSITIVO MÓVIL...',
      step1Title: 'Conectando con la red celular...',
      step1Detail: 'Consultando pasarela de operador y enrutamiento BTS...',
      step2Title: 'Operador y red confirmados',
      step2Detail: 'Estado: En línea y listo para posicionamiento',
      step3Title: 'Conectando con satélites GPS...',
      step3Detail: 'Triangulando señal mediante antenas celulares...',
      step4Title: '¡Teléfono localizado! Coordenadas listas',
      step4Detail: 'Precisión satelital verificada: Dentro de ±3.5 metros.'
    },
    paywallModal: {
      targetLocked: 'Señal GPS del Objetivo Bloqueada',
      reservedTime: 'TIEMPO RESERVADO',
      title: 'Pague con Cripto para Acceder al Mapa',
      passBadge: 'Pase Pro Ilimitado',
      subtitle: 'Seleccione su criptomoneda a continuación. 100% privado y verificado en blockchain.',
      amountDue: 'TOTAL A PAGAR',
      depositAddress: 'DIRECCIÓN OFICIAL DE DEPÓSITO',
      viewExplorer: 'Ver dirección en el explorador',
      txLabel: 'DETECCIÓN AUTOMÁTICA EN BLOCKCHAIN (NO SE REQUIERE TXID)',
      txPlaceholder: 'Escaneo automático de transferencias o pegue TxID opcional...',
      confirmBtn: 'He realizado el pago (Verificar Blockchain)',
      footerNotice: 'Monitoreo 24/7 en la blockchain. El acceso se desbloquea al confirmar en red.'
    },
    pricing: {
      eyebrow: 'TARIFAS TRANSPARENTES',
      title: 'Acceso directo y sin sorpresas',
      subtitle: 'Sin cargos recurrentes ocultos. Elija el pase que mejor se adapte a su caso.',
      plan1Name: 'Pase Pro 1 Mes',
      plan1Price: '$24.99',
      plan1Duration: '/ 30 días',
      plan1Desc: 'Ideal para Búsqueda Única',
      plan2Badge: 'MÁS POPULAR · AHORRE 33%',
      plan2Name: 'Pase Pro 3 Meses',
      plan2Price: '$49.99',
      plan2Duration: '/ 90 días',
      plan2Desc: 'Solo $16.66/mes · Recomendado para Recuperación',
      plan3Badge: 'MEJOR VALOR · AHORRE 40%',
      plan3Name: 'Pase Pro 6 Meses',
      plan3Price: '$89.99',
      plan3Duration: '/ 180 días',
      plan3Desc: 'Solo $14.99/mes · Incluye Informes Periciales',
      buyBtn: 'Activar Pase Ahora',
      feature1: 'Rastreo ilimitado de varios números a la vez',
      feature2: 'Precisión GPS de alta fidelidad (±3.5m en satélite)',
      feature3: 'Vigilante Automático Fuera de Línea + Avisos WhatsApp',
      feature4: 'Enrutamiento SS7 multired (194 países)',
      feature5: 'Dossier Pericial SHA-256 para Policía y Seguros'
    },
    footer: {
      copyright: '© 2026 TrackPhoneNow Telecom Systems. Conforme con estándares GSMA y 3GPP. Todos los derechos reservados.'
    }
  },

  de: {
    dir: 'ltr',
    name: 'Deutsch',
    flag: '🇩🇪',
    nav: {
      stolenRecovery: 'Gestohlenes Handy Orten',
      howItWorks: 'Wie es funktioniert',
      transparency: 'Transparenz',
      pricing: 'Preise',
      faq: 'FAQ',
      signIn: 'Anmelden',
      register: 'Registrieren',
      memberConsole: 'Mitgliederbereich',
      audioOn: 'Audio: AN',
      audioOff: 'Audio: AUS'
    },
    hero: {
      badge: '160+ LÄNDER · ALLE MOBILFUNKANBIETER · ECHTZEIT-GPS',
      title: 'Jedes Mobiltelefon orten,',
      titleHighlight: 'mit nur einer Eingabe',
      subtitle: 'Erhalten Sie präzise GPS-Koordinaten auf hochauflösenden Google Satellitenkarten in unter 2 Minuten. Kompatibel mit allen iPhone- und Android-Geräten ohne App-Download.',
      placeholder: '151 23456789',
      button: 'Handy Jetzt Orten',
      locatingBtn: 'Verbinde mit Mobilfunk...',
      trustNotice: 'Kein APK- oder App-Download erforderlich · 100% Netzwerbasiert · DSGVO-konform',
      guarantee: 'Sofortige Aktivierung via Krypto (USDT, BTC, ETH, SOL) · Keine Identitätsprüfung (KYC)'
    },
    scanModal: {
      locating: 'GERÄTESTANDORT WIRD ERMITTELT...',
      step1Title: 'Verbindung zum Mobilfunknetz...',
      step1Detail: 'Abfrage des Carrier-Gateways und BTS-Routing...',
      step2Title: 'Netzbetreiber bestätigt',
      step2Detail: 'Status: Online und bereit zur Positionsbestimmung',
      step3Title: 'Verbindung zu GPS-Satelliten...',
      step3Detail: 'Signal-Triangulation über Basisstationen...',
      step4Title: 'Standort gefunden! Koordinaten bereit',
      step4Detail: 'Satellitenabgleich erfolgreich: Genauigkeit innerhalb von ±3,5 Metern.'
    },
    paywallModal: {
      targetLocked: 'GPS-Zielsignal Erfolgreich Gesperrt',
      reservedTime: 'RESERVIERTE ZEIT',
      title: 'Mit Krypto Bezahlen für Kartenzugriff',
      passBadge: 'Pro Unlimited Pass',
      subtitle: 'Wählen Sie Ihre Kryptowährung. 100% diskret, verifiziert auf der Blockchain.',
      amountDue: 'FÄLLIGER BETRAG',
      depositAddress: 'OFFIZIELLE EMPFANGSADRESSE',
      viewExplorer: 'Adresse im Explorer ansehen',
      txLabel: 'AUTOMATISCHER BLOCKCHAIN-SCAN (KEINE TXID ERFORDERLICH)',
      txPlaceholder: 'Automatischer Scan eingehender Transfers oder optionale TxID einfügen...',
      confirmBtn: 'Zahlung gesendet (Blockchain überprüfen)',
      footerNotice: '24/7 Blockchain-Überwachung. Freischaltung erfolgt sofort nach Block-Bestätigung.'
    },
    pricing: {
      eyebrow: 'TRANSPARENTE PREISE',
      title: 'Einfacher, klarer Zugang',
      subtitle: 'Keine versteckten Abonnements. Wählen Sie den passenden Ermittlungspass.',
      plan1Name: 'Pro 1-Monats-Pass',
      plan1Price: '$24.99',
      plan1Duration: '/ 30 Tage',
      plan1Desc: 'Standard für Einzelfälle',
      plan2Badge: 'BELIEBTESTE WAHL · 33% RABATT',
      plan2Name: 'Pro 3-Monats-Pass',
      plan2Price: '$49.99',
      plan2Duration: '/ 90 Tage',
      plan2Desc: 'Nur $16.66/Monat · Ideal zur Wiederbeschaffung',
      plan3Badge: 'BESTER WERT · 40% RABATT',
      plan3Name: 'Pro 6-Monats-Pass',
      plan3Price: '$89.99',
      plan3Duration: '/ 180 Tage',
      plan3Desc: 'Nur $14.99/Monat · Inklusive Forensik-Gutachten',
      buyBtn: 'Pass Jetzt Aktivieren',
      feature1: 'Unbegrenzte gleichzeitige Ortungen',
      feature2: 'Präzise GPS-Ortung (±3,5m auf Satellit)',
      feature3: 'Offline Auto-Wake Watchdog + WhatsApp Alarme',
      feature4: 'Multi-Betreiber SS7-Routing (194 Länder)',
      feature5: 'SHA-256 Forensik-Zertifikat für Polizei & Versicherung'
    },
    footer: {
      copyright: '© 2026 TrackPhoneNow Telecom Systems. GSMA & 3GPP konforme Infrastruktur. Alle Rechte vorbehalten.'
    }
  }
};

class I18nManager {
  constructor() {
    this.currentLang = 'en';
    this.translations = I18N_TRANSLATIONS;
  }

  init() {
    // 1. Check saved user preference
    const saved = localStorage.getItem('TrackPhoneNow_lang');
    if (saved && this.translations[saved]) {
      this.setLanguage(saved, false);
      return;
    }

    // 2. Check URL parameter ?lang=...
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && this.translations[urlLang]) {
      this.setLanguage(urlLang, true);
      return;
    }

    // 3. Fallback to browser navigator language
    const navLang = (navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase();
    if (this.translations[navLang]) {
      this.setLanguage(navLang, false);
    } else {
      this.setLanguage('en', false);
    }

    // 4. Async GeoIP refinement from server
    this.detectFromGeoIP();
  }

  async detectFromGeoIP() {
    // Only detect if user hasn't explicitly chosen yet
    if (localStorage.getItem('TrackPhoneNow_lang_explicit')) return;
    try {
      const res = await fetch('/api/geo-ip');
      const data = await res.json();
      if (data && data.success && data.lang && this.translations[data.lang]) {
        this.setLanguage(data.lang, false);
      }
    } catch (e) {}
  }

  setLanguage(langCode, isExplicit = true) {
    if (!this.translations[langCode]) langCode = 'en';
    this.currentLang = langCode;
    localStorage.setItem('TrackPhoneNow_lang', langCode);
    if (isExplicit) {
      localStorage.setItem('TrackPhoneNow_lang_explicit', 'true');
    }

    const dict = this.translations[langCode];

    // Document Direction & Lang Tag
    document.documentElement.lang = langCode;
    document.documentElement.dir = dict.dir || 'ltr';

    // Update active state in switcher UI
    this.updateSwitcherUI();

    // Translate DOM elements
    this.applyTranslations(dict);
  }

  updateSwitcherUI() {
    const curFlag = document.getElementById('langCurrentFlag');
    const curName = document.getElementById('langCurrentName');
    const dict = this.translations[this.currentLang];
    if (curFlag) curFlag.textContent = dict.flag;
    if (curName) curName.textContent = dict.name;

    document.querySelectorAll('.lang-opt-btn').forEach(btn => {
      const code = btn.getAttribute('data-lang');
      const check = btn.querySelector('.lang-check-icon');
      if (code === this.currentLang) {
        btn.classList.add('bg-blue-50', 'text-blue-700', 'font-bold');
        if (check) check.classList.remove('invisible');
      } else {
        btn.classList.remove('bg-blue-50', 'text-blue-700', 'font-bold');
        if (check) check.classList.add('invisible');
      }
    });
  }

  applyTranslations(dict) {
    // Navigation
    this.setText('navStolenRecovery', dict.nav.stolenRecovery);
    this.setText('navHowItWorks', dict.nav.howItWorks);
    this.setText('navTransparency', dict.nav.transparency);
    this.setText('navPricing', dict.nav.pricing);
    this.setText('navFaq', dict.nav.faq);
    this.setText('navSignInText', dict.nav.signIn);
    this.setText('navRegisterText', dict.nav.register);
    this.setText('navConsoleBtnText', dict.nav.memberConsole);

    // Hero
    this.setText('heroEyebrowText', dict.hero.badge);
    this.setText('heroTitleLine1', dict.hero.title);
    this.setText('heroTitleLine2', dict.hero.titleHighlight);
    this.setText('heroSubtitleText', dict.hero.subtitle);
    this.setText('heroLocateBtnText', dict.hero.button);
    this.setText('heroTrustNotice', dict.hero.trustNotice);
    this.setText('heroPaymentAssurance', dict.hero.guarantee);

    const phoneInp = document.getElementById('phoneNumberInput');
    if (phoneInp && !phoneInp.value) {
      phoneInp.placeholder = dict.hero.placeholder;
    }

    // Pricing
    this.setText('pricingEyebrow', dict.pricing.eyebrow);
    this.setText('pricingTitle', dict.pricing.title);
    this.setText('pricingSubtitle', dict.pricing.subtitle);
    this.setText('plan1Title', dict.pricing.plan1Name);
    this.setText('plan1PriceTag', dict.pricing.plan1Price);
    this.setText('plan1DurationTag', dict.pricing.plan1Duration);
    this.setText('plan2Title', dict.pricing.plan2Name);
    this.setText('plan2PriceTag', dict.pricing.plan2Price);
    this.setText('plan2DurationTag', dict.pricing.plan2Duration);
    this.setText('plan3Title', dict.pricing.plan3Name);
    this.setText('plan3PriceTag', dict.pricing.plan3Price);
    this.setText('plan3DurationTag', dict.pricing.plan3Duration);

    // Modals
    this.setText('scanModalLocating', dict.scanModal.locating);
    this.setText('paywallModalTitle', dict.paywallModal.title);
    this.setText('paywallModalSubtitle', dict.paywallModal.subtitle);
    this.setText('paywallTxLabel', dict.paywallModal.txLabel);
    this.setText('confirmCryptoBtnText', dict.paywallModal.confirmBtn);

    const txInp = document.getElementById('cryptoTxHashInput');
    if (txInp) txInp.placeholder = dict.paywallModal.txPlaceholder;

    // Footer
    this.setText('footerCopyrightText', dict.footer.copyright);
  }

  setText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el && text) {
      el.textContent = text;
    }
  }
}

// Global instance
window.i18n = new I18nManager();
