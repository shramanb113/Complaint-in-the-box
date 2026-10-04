export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  slug: "disclaimer" | "privacy" | "terms";
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
}

/** Bump when any document changes. */
export const LEGAL_UPDATED = "4 October 2026";

// Draft text written by an AI, not a lawyer. It needs the legal review already scheduled in spec §11
// before wide distribution.

const disclaimer: LegalDocument = {
  slug: "disclaimer",
  title: "Disclaimer",
  updated: LEGAL_UPDATED,
  summary: "Nyay Patra helps you write a clear, dated complaint. It is a writing tool, and that is all it is.",
  sections: [
    {
      heading: "What this tool does",
      bullets: [
        "It drafts a chat message, a formal email and a list of portal fields from the facts you enter.",
        "It adds a reply date, worked out from the day you make the letter.",
        "It gives you links to the official complaint pages. It does not copy them.",
      ],
    },
    {
      heading: "What this tool does not do",
      bullets: [
        "It is not a lawyer and gives no legal advice.",
        "It is not the government or any regulator, and it is not connected to any shop, app, bank or payment company.",
        "It does not file cases or complaints for you. You send or file everything yourself.",
        "It does not promise that you will get a refund or any other result.",
      ],
    },
    {
      heading: "Before you send",
      paragraphs: [
        "Read the letter and check every name, amount and date against your own records. You are responsible for what you send. If your situation is serious or the amount is large, consider speaking to a lawyer or a consumer organisation.",
      ],
    },
  ],
};

const privacy: LegalDocument = {
  slug: "privacy",
  title: "Privacy",
  updated: LEGAL_UPDATED,
  summary: "We keep as little as we can, for as short a time as we can. Here is exactly what that means.",
  sections: [
    {
      heading: "What we keep",
      paragraphs: [
        "The facts you type into the form (order details, dates, amounts, your description, and optionally your city and the name you want on the letter), and the letters made from them. We keep these for 7 days on a private link, then delete them.",
      ],
    },
    {
      heading: "What we never receive",
      bullets: [
        "Your UTR. It is added to the letter in your own browser and is never sent to our servers.",
        "Photos or documents. This tool does not collect them.",
        "A login, a password or your phone number. None of these is needed.",
      ],
    },
    {
      heading: "Your private link",
      paragraphs: [
        "Each letter has a long, random link. Anyone who has the link can open the letter, so share it carefully. Letters are not listed anywhere and search engines are asked to ignore them.",
      ],
    },
    {
      heading: "How we protect it",
      bullets: [
        "The site only works over HTTPS, so what you type is encrypted on its way to us.",
        "Letters live in a managed database that only our own server can reach. There is no public list or search of letters.",
        "Letters are deleted automatically after 7 days. You can delete yours sooner with the \"Delete this letter now\" button on the letter page.",
        "After a deletion, a copy may stay for a short while in our database provider's own backup history before it is overwritten.",
        "We keep the form deliberately small, so there is less to protect. If you would rather not put your city or name in, leave them out and the letter still works.",
      ],
    },
    {
      heading: "Cookies and counting visits",
      paragraphs: [
        "We set one cookie, np_lang, to remember your language for a year. We count page views and button clicks in an anonymous way that does not follow you around the web. These counts never include the text of your letter.",
      ],
    },
    {
      heading: "Stopping abuse",
      paragraphs: [
        "To stop automated misuse we limit how many letters one network can make in an hour. For this we keep a scrambled (hashed) form of the network address, not the address itself.",
      ],
    },
    {
      heading: "Sharing",
      paragraphs: [
        "We do not sell your data and we do not send your letter to the company you are complaining about: you decide what to send. Our hosting and database providers handle data on our behalf so the site can run.",
      ],
    },
  ],
};

const terms: LegalDocument = {
  slug: "terms",
  title: "Terms of use",
  updated: LEGAL_UPDATED,
  summary: "Using Nyay Patra means you agree to these short terms.",
  sections: [
    {
      heading: "What this is",
      paragraphs: [
        "Nyay Patra drafts text from the facts you enter. It is provided free, as it is, and it is a writing tool only. It is not legal advice.",
      ],
    },
    {
      heading: "Your responsibility",
      bullets: [
        "Enter only facts that are true. Do not use the tool to make false or misleading complaints.",
        "Check the letter before you send it. You are responsible for what you send and to whom.",
        "Do not use the tool to harass anyone, or to make large numbers of letters with automated tools.",
      ],
    },
    {
      heading: "No guarantee",
      paragraphs: [
        "We do not guarantee any refund, reply or outcome. What happens next depends on the company, the bank or the authority you deal with.",
      ],
    },
    {
      heading: "Other companies and links",
      paragraphs: [
        "Company and platform names belong to their owners, and we are not connected to them. Links to official complaint pages go to sites we do not control.",
      ],
    },
    {
      heading: "Changes and availability",
      paragraphs: [
        "We may change or stop the service, and letters are deleted after 7 days. We may update these terms; the date at the top shows the latest version.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: ["These terms are governed by the laws of India."],
    },
  ],
};

export const LEGAL = { disclaimer, privacy, terms } as const;
