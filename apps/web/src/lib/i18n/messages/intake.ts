import type { DesiredRemedy } from "@nyaypatra/core";
import type { FieldError } from "@/lib/intake/fields";
import { defineMessages } from "../define";

export interface IntakeStrings {
  page: {
    formKicker: string;
    change: string;
    formIntro: string;
    listTitle: string;
    listHint: string;
    back: string;
  };
  labels: {
    platformEcommerce: string;
    platformUpi: string;
    platformFood: string;
    platformHiddenFee: string;
    platformOther: string;
    companyName: string;
    paidTo: string;
    orderId: string;
    amountInr: string;
    listedPriceInr: string;
    paidOn: string;
    deliveredOn: string;
    whatHappened: string;
    alreadyDid: string;
    desiredRemedy: string;
    remedyFixed: string;
    deadlineDays: string;
    city: string;
    userDisplayName: string;
  };
  hints: {
    orderId: string;
    amountInr: string;
    listedPriceInr: string;
    deliveredOn: string;
    whatHappened: string;
    /** Shown under "What happened?" for UPI situations only: the UTR has no field yet and must not end up in the stored text. */
    upiNoUtr: string;
    alreadyDid: string;
    deadlineDays: string;
    city: string;
    userDisplayName: string;
  };
  placeholders: {
    companyName: string;
    whatHappened: string;
    alreadyDid: string;
    city: string;
    userDisplayName: string;
  };
  optional: string;
  counter: string;
  remedies: Record<DesiredRemedy, string>;
  deadlines: { d2: string; d7: string; d15: string };
  errors: Record<FieldError, string>;
  form: {
    submit: string;
    submitting: string;
    fixErrors: string;
    rateLimited: string;
    serverError: string;
  };
}

export const intakeMessages = defineMessages<IntakeStrings>(
  {
    page: {
      formKicker: "Your letter",
      change: "Change situation",
      formIntro: "It takes about two minutes. Nothing is saved until you press the button.",
      listTitle: "Which one matches?",
      listHint: "Pick the closest match. You will describe what happened in your own words next.",
      back: "Back to all problems",
    },
    labels: {
      platformEcommerce: "Where did you order?",
      platformUpi: "Which app did you pay with?",
      platformFood: "Which app did you order from?",
      platformHiddenFee: "Which app or shop charged you?",
      platformOther: "Other",
      companyName: "Company or shop name",
      paidTo: "Who did you pay? (shop or person)",
      orderId: "Order ID",
      amountInr: "Amount you paid",
      listedPriceInr: "Price shown before you paid",
      paidOn: "Date you paid",
      deliveredOn: "Date it arrived",
      whatHappened: "What happened?",
      alreadyDid: "What have you already tried?",
      desiredRemedy: "What do you want them to do?",
      remedyFixed: "What you are asking for",
      deadlineDays: "Give them this long to reply",
      city: "Your city",
      userDisplayName: "Your name",
    },
    hints: {
      orderId: "Find it in the order email or app. Leave it blank if you cannot find it.",
      amountInr: "In whole rupees, for example 2499.",
      listedPriceInr: "The price on the product page or cart before the extra charges.",
      deliveredOn: "Leave blank if you are not sure.",
      whatHappened: "Facts only, in your own words. English or Hindi is fine.",
      upiNoUtr: "You do not need the UTR here. Please do not type it in: it is never needed on this page.",
      alreadyDid: "For example: chatted with support twice, no reply.",
      deadlineDays: "Two days is for urgent cases. Seven is the usual choice.",
      city: "Printed at the end of the letter.",
      userDisplayName: "Printed as the sender. You can also change it after copying.",
    },
    placeholders: {
      companyName: "For example: Sharma Electronics",
      whatHappened: "For example: I ordered a mixer and received a different product.",
      alreadyDid: "For example: called and chatted with customer care",
      city: "For example: Pune",
      userDisplayName: "For example: Asha Patil",
    },
    optional: "(optional)",
    counter: "{count} of {max} characters",
    remedies: {
      full_refund_original_mode: "Full refund to the original payment method",
      replacement: "A replacement item",
      pickup_and_refund: "Pick up the item and refund me",
      reverse_failed_upi: "Reverse the amount to my account",
      remove_hidden_fee: "Refund the hidden charge",
    },
    deadlines: { d2: "2 days (urgent)", d7: "7 days", d15: "15 days" },
    errors: {
      required: "This is needed.",
      tooShort: "Please write at least {min} characters so the letter makes sense.",
      tooLong: "Please keep this under {max} characters.",
      notNumber: "Use numbers only, for example 2499.",
      notWholeRupees: "Please round to the nearest rupee, for example 499.",
      notPositive: "The amount must be more than zero.",
      tooBig: "That amount is too large. Please check it.",
      badDate: "Pick a date from the calendar.",
      futureDate: "This date is in the future. Pick today or an earlier date.",
      tooOld: "This date is too old. Please check the year.",
      listedNotLess: "The price shown earlier must be lower than what you paid.",
      beforePaid: "This cannot be before the date you paid.",
      invalidChoice: "Please choose one of the options.",
      reservedText: "Please remove the text [[UTR]] from this field.",
      invalid: "Please check this field.",
    },
    form: {
      submit: "Make my letter",
      submitting: "Making your letter…",
      fixErrors: "Please check the fields marked below and try again.",
      rateLimited: "You have made several letters in the last hour. Please try again a little later.",
      serverError: "Something went wrong on our side and nothing was saved. Please try again.",
    },
  },
  {
    page: {
      formKicker: "आपका पत्र",
      change: "स्थिति बदलें",
      formIntro: "इसमें लगभग दो मिनट लगते हैं। बटन दबाने से पहले कुछ भी सहेजा नहीं जाता।",
      listTitle: "इनमें से कौन-सी स्थिति है?",
      listHint: "सबसे मिलती-जुलती स्थिति चुनें। क्या हुआ, यह आप अगले पेज पर अपने शब्दों में लिखेंगे।",
      back: "सभी समस्याओं पर वापस",
    },
    labels: {
      platformEcommerce: "आपने कहाँ से ऑर्डर किया?",
      platformUpi: "आपने किस ऐप से भुगतान किया?",
      platformFood: "आपने किस ऐप से ऑर्डर किया?",
      platformHiddenFee: "किस ऐप या दुकान ने शुल्क लिया?",
      platformOther: "कोई और",
      companyName: "कंपनी या दुकान का नाम",
      paidTo: "आपने किसे भुगतान किया? (दुकान या व्यक्ति)",
      orderId: "ऑर्डर आईडी",
      amountInr: "आपने कितनी राशि चुकाई",
      listedPriceInr: "भुगतान से पहले दिखी क़ीमत",
      paidOn: "भुगतान की तारीख़",
      deliveredOn: "सामान पहुँचने की तारीख़",
      whatHappened: "क्या हुआ?",
      alreadyDid: "आपने अब तक क्या कोशिश की?",
      desiredRemedy: "आप उनसे क्या चाहते हैं?",
      remedyFixed: "आप जो माँग रहे हैं",
      deadlineDays: "जवाब देने के लिए कितना समय दें",
      city: "आपका शहर",
      userDisplayName: "आपका नाम",
    },
    hints: {
      orderId: "ऑर्डर के ईमेल या ऐप में मिलेगी। न मिले तो खाली छोड़ दें।",
      amountInr: "पूरे रुपये में, जैसे 2499।",
      listedPriceInr: "प्रोडक्ट पेज या कार्ट में अतिरिक्त शुल्क से पहले दिखी क़ीमत।",
      deliveredOn: "पक्का न हो तो खाली छोड़ दें।",
      whatHappened: "सिर्फ़ तथ्य, अपने शब्दों में। हिंदी या अंग्रेज़ी, दोनों चलेंगी।",
      upiNoUtr: "यहाँ UTR लिखने की ज़रूरत नहीं है। कृपया उसे न लिखें: इस पेज पर उसकी कभी ज़रूरत नहीं पड़ती।",
      alreadyDid: "जैसे: सपोर्ट से दो बार चैट की, जवाब नहीं आया।",
      deadlineDays: "दो दिन जल्दी वाले मामलों के लिए हैं। सात दिन आम चुनाव है।",
      city: "पत्र के अंत में छपेगा।",
      userDisplayName: "भेजने वाले के रूप में छपेगा। कॉपी करने के बाद भी बदल सकते हैं।",
    },
    placeholders: {
      companyName: "जैसे: शर्मा इलेक्ट्रॉनिक्स",
      whatHappened: "जैसे: मैंने मिक्सर ऑर्डर किया था, पर दूसरा सामान मिला।",
      alreadyDid: "जैसे: कस्टमर केयर को कॉल और चैट किया",
      city: "जैसे: पुणे",
      userDisplayName: "जैसे: आशा पाटिल",
    },
    optional: "(ज़रूरी नहीं)",
    counter: "{max} में से {count} अक्षर",
    remedies: {
      full_refund_original_mode: "मूल भुगतान माध्यम में पूरा रिफंड",
      replacement: "नया सामान (रिप्लेसमेंट)",
      pickup_and_refund: "सामान वापस ले जाएँ और रिफंड दें",
      reverse_failed_upi: "राशि मेरे खाते में वापस करें",
      remove_hidden_fee: "छिपा हुआ शुल्क वापस करें",
    },
    deadlines: { d2: "2 दिन (जल्दी)", d7: "7 दिन", d15: "15 दिन" },
    errors: {
      required: "यह जानकारी ज़रूरी है।",
      tooShort: "कम से कम {min} अक्षर लिखें, ताकि पत्र समझ में आए।",
      tooLong: "इसे {max} अक्षरों से कम रखें।",
      notNumber: "सिर्फ़ अंक लिखें, जैसे 2499।",
      notWholeRupees: "कृपया नज़दीकी रुपये तक पूरा करें, जैसे 499।",
      notPositive: "राशि शून्य से ज़्यादा होनी चाहिए।",
      tooBig: "यह राशि बहुत बड़ी है। कृपया जाँच लें।",
      badDate: "कैलेंडर से तारीख़ चुनें।",
      futureDate: "यह तारीख़ आगे की है। आज या पहले की तारीख़ चुनें।",
      tooOld: "यह तारीख़ बहुत पुरानी है। साल जाँच लें।",
      listedNotLess: "पहले दिखी क़ीमत, चुकाई गई राशि से कम होनी चाहिए।",
      beforePaid: "यह भुगतान की तारीख़ से पहले की नहीं हो सकती।",
      invalidChoice: "कृपया दिए गए विकल्पों में से एक चुनें।",
      reservedText: "कृपया इस खाने से [[UTR]] हटा दें।",
      invalid: "कृपया इस खाने की जाँच करें।",
    },
    form: {
      submit: "मेरा पत्र बनाएँ",
      submitting: "आपका पत्र बन रहा है…",
      fixErrors: "कृपया नीचे चिह्नित खाने जाँचें और फिर कोशिश करें।",
      rateLimited: "आपने पिछले एक घंटे में कई पत्र बनाए हैं। कृपया थोड़ी देर बाद फिर कोशिश करें।",
      serverError: "हमारी तरफ़ से कुछ गड़बड़ हो गई और कुछ सहेजा नहीं गया। कृपया फिर कोशिश करें।",
    },
  }
);
