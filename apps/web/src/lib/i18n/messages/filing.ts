import { defineMessages } from "../define";

export interface FilingStrings {
  tab: string;
  intro: string;
  privacy: string;
  sections: { claim: string; company: string; you: string; evidence: string };
  fields: {
    amountClaimed: string;
    compensation: string;
    issueOn: string;
    issueOnHint: string;
    firstComplaintOn: string;
    lastReplyOn: string;
    ticketRef: string;
    replyReason: string;
    channel: string;
    legalName: string;
    registeredOffice: string;
    registeredOfficeHint: string;
    fullName: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    mobile: string;
    email: string;
    addressType: string;
    optional: string;
  };
  addressTypes: { present: string; permanent: string; business: string };
  evidence: { order_confirmation: string; payment_proof: string; photos_video: string; chat_email_trail: string };
  check: string;
  fixThese: string;
  watchOut: string;
  readyTitle: string;
  readyBody: string;
  nchTitle: string;
  nchHelp: string;
  jagritiTitle: string;
  jagritiHelp: string;
  forum: string;
  docsTitle: string;
  docsHelp: string;
  annexTitle: string;
  stepsTitle: string;
  print: string;
  printHeading: string;
  noGuarantee: string;
}

/** Text for the "File it" tab: the extra facts NCH and the Consumer Commission need. */
export const filingMessages = defineMessages<FilingStrings>(
  {
    tab: "File it",
    intro:
      "The letter is enough to start. If the company will not fix it, add the facts below. You get the exact answers for the National Consumer Helpline and a ready filing kit for e-Jagriti, the Consumer Commission portal.",
    privacy: "Your name, address and phone stay in this browser. They are never sent to us.",
    sections: { claim: "What you are claiming", company: "The company", you: "About you", evidence: "What you have" },
    fields: {
      amountClaimed: "Refund you are claiming",
      compensation: "Compensation for trouble caused",
      issueOn: "Date the problem happened",
      issueOnHint: "The day it went wrong, such as the day the wrong item arrived or the refund was refused.",
      firstComplaintOn: "Date you first complained to the company",
      lastReplyOn: "Date of the company's last reply",
      ticketRef: "Their ticket or complaint number",
      replyReason: "What reason did they give?",
      channel: "Where you complained",
      legalName: "Company's legal name",
      registeredOffice: "Company's registered office address",
      registeredOfficeHint: "It is on the company's website under Contact, Terms or Legal. Copy it exactly.",
      fullName: "Your full name",
      addressLine: "Your address",
      city: "City or district",
      state: "State",
      pincode: "PIN code",
      mobile: "Mobile number",
      email: "Email",
      addressType: "This address is your",
      optional: "(optional)",
    },
    addressTypes: { present: "Present address", permanent: "Permanent address", business: "Business address" },
    evidence: {
      order_confirmation: "Order confirmation",
      payment_proof: "Proof of payment",
      photos_video: "Photos or video",
      chat_email_trail: "Chat or email with the company",
    },
    check: "Check my filing",
    fixThese: "Fix these first",
    watchOut: "Worth knowing",
    readyTitle: "Your filing is complete",
    readyBody: "Nothing avoidable is missing. Copy each answer into the matching box.",
    nchTitle: "National Consumer Helpline",
    nchHelp: "Paste each answer into the matching box on the grievance form.",
    jagritiTitle: "e-Jagriti case details",
    jagritiHelp: "These are the Case Details boxes on e-Jagriti, in the order the portal asks.",
    forum: "Suggested commission",
    docsTitle: "Documents for e-Jagriti",
    docsHelp: "Print them as one PDF, or copy each one. The portal asks for these in this order.",
    annexTitle: "Annexures, in upload order",
    stepsTitle: "On the portal",
    print: "Print the filing kit",
    printHeading: "Filing kit for e-Jagriti",
    noGuarantee:
      "This is a drafting aid, not legal advice. A Commission can still raise its own questions, and the helpline cannot force a refund.",
  },
  {
    tab: "फ़ाइल करें",
    intro:
      "शुरुआत के लिए पत्र काफ़ी है। अगर कंपनी फिर भी हल नहीं करती, तो नीचे की जानकारी जोड़ें। आपको नेशनल कंज्यूमर हेल्पलाइन के सटीक जवाब और e-Jagriti (उपभोक्ता आयोग का पोर्टल) के लिए तैयार फ़ाइलिंग किट मिलेगी।",
    privacy: "आपका नाम, पता और फ़ोन इसी ब्राउज़र में रहते हैं। हमें कभी नहीं भेजे जाते।",
    sections: { claim: "आप क्या माँग रहे हैं", company: "कंपनी", you: "आपके बारे में", evidence: "आपके पास क्या है" },
    fields: {
      amountClaimed: "आप जो रिफ़ंड माँग रहे हैं",
      compensation: "हुई परेशानी का मुआवज़ा",
      issueOn: "समस्या की तारीख़",
      issueOnHint: "जिस दिन गड़बड़ हुई, जैसे गलत सामान आने का या रिफ़ंड से मना करने का दिन।",
      firstComplaintOn: "कंपनी से पहली शिकायत की तारीख़",
      lastReplyOn: "कंपनी के आख़िरी जवाब की तारीख़",
      ticketRef: "उनका टिकट या शिकायत नंबर",
      replyReason: "उन्होंने क्या कारण बताया?",
      channel: "आपने कहाँ शिकायत की",
      legalName: "कंपनी का कानूनी नाम",
      registeredOffice: "कंपनी का पंजीकृत कार्यालय पता",
      registeredOfficeHint: "यह कंपनी की वेबसाइट पर संपर्क, नियम या कानूनी पेज पर मिलता है। जैसा है वैसा कॉपी करें।",
      fullName: "आपका पूरा नाम",
      addressLine: "आपका पता",
      city: "शहर या ज़िला",
      state: "राज्य",
      pincode: "पिन कोड",
      mobile: "मोबाइल नंबर",
      email: "ईमेल",
      addressType: "यह पता आपका है",
      optional: "(वैकल्पिक)",
    },
    addressTypes: { present: "वर्तमान पता", permanent: "स्थायी पता", business: "व्यावसायिक पता" },
    evidence: {
      order_confirmation: "ऑर्डर की पुष्टि",
      payment_proof: "भुगतान का सबूत",
      photos_video: "फ़ोटो या वीडियो",
      chat_email_trail: "कंपनी से चैट या ईमेल",
    },
    check: "मेरी फ़ाइलिंग जाँचें",
    fixThese: "पहले ये ठीक करें",
    watchOut: "जानने लायक",
    readyTitle: "आपकी फ़ाइलिंग पूरी है",
    readyBody: "कोई ज़रूरी चीज़ छूटी नहीं है। हर जवाब को संबंधित खाने में कॉपी करें।",
    nchTitle: "नेशनल कंज्यूमर हेल्पलाइन",
    nchHelp: "शिकायत फ़ॉर्म के हर खाने में संबंधित जवाब पेस्ट करें।",
    jagritiTitle: "e-Jagriti के केस विवरण",
    jagritiHelp: "ये e-Jagriti के केस विवरण वाले खाने हैं, उसी क्रम में जिसमें पोर्टल पूछता है।",
    forum: "सुझाया गया आयोग",
    docsTitle: "e-Jagriti के दस्तावेज़",
    docsHelp: "इन्हें एक PDF के रूप में प्रिंट करें, या एक-एक कॉपी करें। पोर्टल इन्हें इसी क्रम में माँगता है।",
    annexTitle: "अनुलग्नक, अपलोड के क्रम में",
    stepsTitle: "पोर्टल पर",
    print: "फ़ाइलिंग किट प्रिंट करें",
    printHeading: "e-Jagriti के लिए फ़ाइलिंग किट",
    noGuarantee:
      "यह मसौदा बनाने में मदद है, कानूनी सलाह नहीं। आयोग अपने सवाल फिर भी उठा सकता है, और हेल्पलाइन रिफ़ंड के लिए बाध्य नहीं कर सकती।",
  },
);
