// Parses Indian bank transaction SMSes into structured money movements.
//
// Generic by design: instead of a per-bank whitelist, a message qualifies when
// it has the *structure* of a bank alert — a DLT sender header, an amount, a
// debit/credit keyword, and an account/card reference. Bank-specific patterns
// only refine extraction (counterparty, refs); they never gate it, so banks we
// have never seen still parse. Everything runs on-device; nothing is uploaded.

export type ParsedSms = {
  /** Amount in the currency's smallest unit (paise), always > 0. */
  amount: number;
  /** Direction of money for the user's account. */
  type: "income" | "expense";
  /** Last digits of the account/card mentioned by the bank (e.g. "6913"). */
  accountLast4: string | null;
  /** Normalized bank group from the sender header (e.g. "HDFC", "SBI"). */
  bankCode: string | null;
  /** Merchant / person on the other side, as printed in the SMS. */
  counterparty: string | null;
  refNo: string | null;
};

// ---------------------------------------------------------------------------
// Sender classification
// ---------------------------------------------------------------------------

// Indian DLT alert headers look like "VM-HDFCBK" / "AD-SBIUPI-S". The trailing
// route suffix marks S(ervice)/T(ransactional)/P(romotional) — P is never a
// money alert. Plain 5-8 digit shortcodes are also used by some banks.
// Personal numbers (+91…, 10-digit) can never be bank alerts.
const DLT_SENDER = /^[A-Z]{2}-([A-Z0-9]{3,9})(?:-([A-Z]))?$/i;

const BRAND_GROUPS: [RegExp, string][] = [
  [/^HDFC/i, "HDFC"],
  [/^SBI/i, "SBI"],
  [/^ICICI/i, "ICICI"],
  [/^AXIS/i, "AXIS"],
  [/^KOTAK|^KKBK/i, "KOTAK"],
  [/^PNB/i, "PNB"],
  [/^BOB|^BARODA|^BOBTXN/i, "BOB"],
  [/^CANBNK|^CANARA/i, "CANARA"],
  [/^UNION|^UBIN/i, "UNION"],
  [/^IDFCFB|^IDFC/i, "IDFC"],
  [/^YESBNK|^YESB/i, "YES"],
  [/^INDUSB|^INDUS/i, "INDUSIND"],
  [/^AUBANK/i, "AU"],
  [/^FEDBNK|^FEDERA/i, "FEDERAL"],
  [/^IOB/i, "IOB"],
  [/^CENTBK/i, "CENTRAL"],
  [/^IDBI/i, "IDBI"],
  [/^INDBNK/i, "INDIAN"],
  [/^RBL/i, "RBL"],
  [/^PYTM|^PAYTM/i, "PAYTM"],
  [/^JIOPAY|^JioPay/i, "JIOPAY"],
];

const BANK_NAMES: Record<string, string> = {
  HDFC: "HDFC Bank",
  SBI: "SBI",
  ICICI: "ICICI Bank",
  AXIS: "Axis Bank",
  KOTAK: "Kotak Bank",
  PNB: "PNB",
  BOB: "Bank of Baroda",
  CANARA: "Canara Bank",
  UNION: "Union Bank",
  IDFC: "IDFC First",
  YES: "Yes Bank",
  INDUSIND: "IndusInd Bank",
  AU: "AU Bank",
  FEDERAL: "Federal Bank",
  IOB: "IOB",
  CENTRAL: "Central Bank",
  IDBI: "IDBI Bank",
  INDIAN: "Indian Bank",
  RBL: "RBL Bank",
  PAYTM: "Paytm",
  JIOPAY: "JioPay",
};

export function classifySender(sender: string): {
  transactional: boolean;
  bankCode: string | null;
} {
  const s = sender.trim();
  const m = DLT_SENDER.exec(s);
  if (m) {
    if ((m[2] ?? "").toUpperCase() === "P") {
      return { transactional: false, bankCode: null }; // promotional route
    }
    const brand = m[1]!.toUpperCase();
    for (const [re, group] of BRAND_GROUPS) {
      if (re.test(brand)) return { transactional: true, bankCode: group };
    }
    return { transactional: true, bankCode: brand };
  }
  if (/^\d{5,8}$/.test(s)) return { transactional: true, bankCode: null };
  return { transactional: false, bankCode: null };
}

/** Human name for a bank group code; falls back to the code itself. */
export function bankDisplayName(code: string | null): string | null {
  if (!code) return null;
  return BANK_NAMES[code] ?? code;
}

// ---------------------------------------------------------------------------
// Body gates — things that mention money but are NOT completed transactions
// ---------------------------------------------------------------------------

const REJECT_PATTERNS: RegExp[] = [
  // A message ABOUT an OTP ("123456 is your OTP to…"), not one that merely
  // mentions the word ("…spent without PIN/OTP" is a real transaction).
  /is (?:your|the)[^\n]{0,24}\bOTP\b|\bOTP\b[^\n]{0,12}\bis\b|one[\s-]?time password|verification code|never share/i,
  // E-mandate pre-alerts & collect requests describe a FUTURE movement.
  /will be (?:debited|deducted|charged)|has requested|payment request|collect request/i,
  /\bdeclined\b|\bfailed\b|unsuccessful|could not be processed/i,
  /payment reminder|\bis due\b|\bdue on\b|overdue/i,
  /\bvoucher\b|\boffer\b|apply now|congratulations|lucky draw|pre-?approved loan/i,
  // Wallet/telecom balance & usage chatter.
  /data (?:pack|quota|usage)|recharge (?:plan|now|using)/i,
];

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

const DEBIT_RE = /\b(?:debited|withdrawn|spent|sent|deducted|paid|purchased?)\b/i;
const CREDIT_RE = /\b(?:credited|deposited|received|refund(?:ed)?|reversed)\b/i;

// "Rs.60.00" / "Rs 60" / "INR 86,992.00" / "₹1,247.50"
const CURRENCY_AMOUNT = /(?:₹|\brs\.?|\binr\.?)\s*(\d[\d,]*(?:\.\d{1,2})?)/i;
// SBI-style with no currency token: "debited by 100.00 on"
const KEYWORD_AMOUNT =
  /\b(?:debited|credited)\s*(?:by|with|for)?\s*(\d[\d,]*(?:\.\d{1,2})?)/i;

// "A/C *6913" · "A/C x6913" · "A/c XXXX6913" · "A/cX2352" · "a/c no. XXXXXXXX2352"
// · "Card x6381" · "Debit Card xx6381"
const ACCOUNT_TAIL =
  /(?:a\/?c(?:count)?(?:\s+no\.?)?|card)[\s.:#-]*[x*]{0,14}(\d{3,8})/i;

// Ordered, most-specific first. First hit wins.
const COUNTERPARTY_PATTERNS: RegExp[] = [
  /(?:^|\n)\s*To[:\s]+([^\n]{2,45})/m, // HDFC UPI "To NAME" line
  /\btrf to\s+(.{2,35}?)\s+Refno/i, // SBI UPI debit
  /\btransfer (?:to|from)\s+(.{2,35}?)\s+Ref\s?No/i, // older SBI wording
  /\bAt\s+(.{2,40}?)\s+On\b/i, // HDFC card "At GOOGLE *Play On"
  /\bspent\b.{0,40}?\bat\s+(.{2,40}?)\s+on\s/i, // "spent via … at IND*LinkedIn on"
  /(?:from|to)\s+VPA\s+([\w.-]+)@/i, // UPI VPA handle
  /linked to mobile\s+\S+?-\s*([A-Za-z][A-Za-z .]{2,35})/i, // IMPS "…-NAME"
  /\bNEFT\s+Cr-[A-Z0-9]+-(.+?)-/i, // NEFT "Cr-IFSC-REMITTER-…"
  /\btowards\s+([A-Za-z][\w &.*'-]{2,35})/i,
];

const REF_PATTERNS: RegExp[] = [
  /\(UPI\s+(\d{6,18})\)/i,
  /\bUPI\s*Ref\W{0,3}(\d{6,18})/i,
  /\bRefno\s+(\d{6,18})/i,
  /\bref(?:erence)?\s*(?:no\.?)?\s*[:.\s-]\s*(\d{6,18})/i,
  /(?:^|\n)\s*Ref\s+(\d{6,18})/im,
  /\bUTR\W{0,3}([A-Z0-9]{10,22})/i,
];

function parseAmountToSmallestUnit(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0 || n > 1e9) return null;
  return Math.round(n * 100);
}

function cleanCounterparty(raw: string): string | null {
  const s = raw
    .replace(/\s+/g, " ")
    .replace(/[.,:;\-–]+$/g, "")
    .trim();
  if (s.length < 2) return null;
  return s.slice(0, 40);
}

/**
 * Parse one SMS. Returns null when the message is not a completed bank
 * transaction (promos, OTPs, reminders, wallet receipts, chat, …).
 */
export function parseTransactionSms(input: {
  sender: string;
  body: string;
}): ParsedSms | null {
  const { transactional, bankCode } = classifySender(input.sender);
  if (!transactional) return null;

  const body = input.body.replace(/\r/g, "");
  for (const re of REJECT_PATTERNS) if (re.test(body)) return null;

  // Direction: the first debit/credit keyword refers to the user's account in
  // every real format we've seen ("Sent…", "debited by… trf to", "credited…").
  const debitAt = body.search(DEBIT_RE);
  const creditAt = body.search(CREDIT_RE);
  if (debitAt < 0 && creditAt < 0) return null;
  const type: ParsedSms["type"] =
    debitAt >= 0 && (creditAt < 0 || debitAt < creditAt) ? "expense" : "income";

  // Amount: the first currency-prefixed number (txn amount always precedes the
  // balance in bank formats), else the keyword-adjacent bare number.
  const amtMatch = CURRENCY_AMOUNT.exec(body) ?? KEYWORD_AMOUNT.exec(body);
  if (!amtMatch) return null;
  const amount = parseAmountToSmallestUnit(amtMatch[1]!);
  if (amount == null) return null;

  // Structure gate: a real bank alert always references the account/card.
  // Merchant receipts (e.g. "Recharge successful") have no such token — they
  // would double-count the bank's own debit SMS, so they must not qualify.
  const tail = ACCOUNT_TAIL.exec(body);
  if (!tail) return null;
  const accountLast4 = tail[1]!.slice(-4);

  let counterparty: string | null = null;
  for (const re of COUNTERPARTY_PATTERNS) {
    const m = re.exec(body);
    if (m) {
      counterparty = cleanCounterparty(m[1]!);
      if (counterparty) break;
    }
  }

  let refNo: string | null = null;
  for (const re of REF_PATTERNS) {
    const m = re.exec(body);
    if (m) {
      refNo = m[1]!;
      break;
    }
  }

  return { amount, type, accountLast4, bankCode, counterparty, refNo };
}

// ---------------------------------------------------------------------------
// Dedupe hash
// ---------------------------------------------------------------------------

/**
 * Deterministic digest of an SMS identity, so rescans never re-import the same
 * message. djb2 over the identity string, in two passes for fewer collisions.
 */
export function computeSmsHash(
  sender: string,
  body: string,
  receivedAtMs: number,
): string {
  const s = `${sender} ${body} ${receivedAtMs}`;
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 33) ^ (c + i);
  }
  return ((h1 >>> 0).toString(36) + (h2 >>> 0).toString(36)).padEnd(14, "0");
}
