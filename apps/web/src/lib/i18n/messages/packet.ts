import { defineMessages } from "../define";

export interface PacketStrings {
  title: string;
  expires: string;
  deadline: string;
  whatsapp: string;
  email: string;
  subject: string;
  body: string;
  portal: string;
  bank: string;
  portalHelp: string;
  links: string;
  nextSteps: string;
  language: { en: string; hi: string };
  copy: string;
  copied: string;
  unsaved: { title: string; body: string };
  expired: { title: string; body: string; cta: string };
}

/** Text for the stopgap packet page. Milestone 4 replaces the page and reuses or rewrites these. */
export const packetMessages = defineMessages<PacketStrings>(
  {
    title: "Your complaint is ready",
    expires: "This link works until {date}. Copy what you need before then.",
    deadline: "Reply deadline you are giving them: {date}",
    whatsapp: "WhatsApp message",
    email: "Email",
    subject: "Subject",
    body: "Message",
    portal: "Answers for the complaint portal form",
    bank: "Answers for the bank complaint form",
    portalHelp: "Paste these into the matching boxes on the portal. The portal is in English.",
    links: "Official links",
    nextSteps: "What to do next",
    language: { en: "English", hi: "Hindi" },
    copy: "Copy",
    copied: "Copied ✓",
    unsaved: {
      title: "We could not save a link to your letter",
      body: "Your letter is below and is ready to use. Copy it now, because this page will not be here later.",
    },
    expired: {
      title: "This letter link has expired",
      body: "Letter links work for {days} days and are then deleted. You can make a new letter in a couple of minutes.",
      cta: "Make a new letter",
    },
  },
  {
    title: "आपकी शिकायत तैयार है",
    expires: "यह लिंक {date} तक चलेगा। उससे पहले ज़रूरी चीज़ें कॉपी कर लें।",
    deadline: "आप उन्हें जवाब के लिए यह तारीख़ दे रहे हैं: {date}",
    whatsapp: "व्हाट्सऐप संदेश",
    email: "ईमेल",
    subject: "विषय",
    body: "संदेश",
    portal: "पोर्टल फ़ॉर्म के जवाब",
    bank: "बैंक शिकायत फ़ॉर्म के जवाब",
    portalHelp: "पोर्टल पर इन्हें संबंधित खानों में पेस्ट करें। पोर्टल अंग्रेज़ी में है।",
    links: "आधिकारिक लिंक",
    nextSteps: "आगे क्या करें",
    language: { en: "अंग्रेज़ी", hi: "हिन्दी" },
    copy: "कॉपी करें",
    copied: "कॉपी हो गया ✓",
    unsaved: {
      title: "हम आपके पत्र का लिंक सहेज नहीं पाए",
      body: "आपका पत्र नीचे तैयार है। अभी कॉपी कर लें, क्योंकि यह पेज बाद में उपलब्ध नहीं होगा।",
    },
    expired: {
      title: "इस पत्र का लिंक समाप्त हो गया",
      body: "पत्र के लिंक {days} दिन चलते हैं, फिर मिटा दिए जाते हैं। आप कुछ ही मिनटों में नया पत्र बना सकते हैं।",
      cta: "नया पत्र बनाएँ",
    },
  }
);
