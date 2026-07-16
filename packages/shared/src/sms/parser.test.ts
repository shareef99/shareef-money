// Fixture-based tests for the SMS transaction parser. Every fixture is a
// SYNTHESIZED message following a real Indian bank template — names, amounts,
// account digits, and refs are fake. Run with: npx tsx src/sms/parser.test.ts
import assert from "node:assert/strict";
import { parseTransactionSms, classifySender, computeSmsHash } from "./parser";

type Case = {
  name: string;
  sender: string;
  body: string;
  expect: null | {
    amount: number; // paise
    type: "income" | "expense";
    accountLast4?: string;
    counterparty?: string;
    refNo?: string;
  };
};

const CASES: Case[] = [
  {
    name: "HDFC UPI debit (multi-line Sent)",
    sender: "VM-HDFCBK-T",
    body: "Sent Rs.245.00\nFrom HDFC Bank A/C *4321\nTo RAVI KIRANA STORE\nOn 03/07/26\nRef 111222333444\nNot You?\nCall 18002586161/SMS BLOCK UPI to 7308080808",
    expect: {
      amount: 24500,
      type: "expense",
      accountLast4: "4321",
      counterparty: "RAVI KIRANA STORE",
      refNo: "111222333444",
    },
  },
  {
    name: "HDFC UPI credit (Credit Alert + VPA)",
    sender: "VM-HDFCBK-S",
    body: "Credit Alert!\nRs.900.00 credited to HDFC Bank A/c XX4321 on 15-12-25 from VPA sample-user1@okhdfc (UPI 555666777888)",
    expect: {
      amount: 90000,
      type: "income",
      accountLast4: "4321",
      counterparty: "sample-user1",
      refNo: "555666777888",
    },
  },
  {
    name: "SBI UPI debit (no currency prefix)",
    sender: "JD-SBIUPI-S",
    body: "Dear UPI user A/C X9876 debited by 155.00 on date 13Jul26 trf to Sample Pan Shop Refno 999888777666 If not u? call-1800111109 for other services-18001234-SBI",
    expect: {
      amount: 15500,
      type: "expense",
      accountLast4: "9876",
      counterparty: "Sample Pan Shop",
      refNo: "999888777666",
    },
  },
  {
    name: "SBI UPI credit (compact A/c)",
    sender: "AD-SBIUPI",
    body: "Dear SBI UPI User, ur A/cX9876 credited by Rs320 on 02Mar23 by  (Ref no 121212343456)",
    expect: { amount: 32000, type: "income", accountLast4: "9876", refNo: "121212343456" },
  },
  {
    name: "SBI old wording (transfer from, credit)",
    sender: "AX-SBIUPI",
    body: "Dear SBI User, your A/c X9876-credited by Rs.8000 on 10Apr26 transfer from SAMPLE SENDER Ref No 646600000000 -SBI",
    expect: {
      amount: 800000,
      type: "income",
      accountLast4: "9876",
      counterparty: "SAMPLE SENDER",
      refNo: "646600000000",
    },
  },
  {
    name: "SBI IMPS credit (a/c linked to mobile)",
    sender: "BP-SBIINB",
    body: "Dear Customer, Your a/c no. XXXXXXXX9876 is credited by Rs.2000.00 on 24-08-23 by a/c linked to mobile 9XXXXXX000-SAMPLE PERSON (IMPS Ref no 121200001111).If not done by you, call 1800111109. -SBI",
    expect: {
      amount: 200000,
      type: "income",
      accountLast4: "9876",
      counterparty: "SAMPLE PERSON",
      refNo: "121200001111",
    },
  },
  {
    name: "HDFC NEFT deposit (salary, lakh commas)",
    sender: "AX-HDFCBK-S",
    body: "Update! INR 86,992.00 deposited in HDFC Bank A/c XX4321 on 13-JUL-26 for NEFT Cr-SCBL0036001-ACME WORKS LLC-SAMPLE NAME-SCBLH26194002915.Avl bal INR 2,30,171.87. Cheque deposits in A/C are subject to clearing",
    expect: {
      amount: 8699200,
      type: "income",
      accountLast4: "4321",
      counterparty: "ACME WORKS LLC",
    },
  },
  {
    name: "HDFC card spend (At … On …, balance present)",
    sender: "JD-HDFCBK-S",
    body: "Spent Rs.2373.13 From HDFC Bank Card x8765 At GOOGLE *Play On 2026-06-24:05:13:27 Bal Rs.150807.71 Not You? Call 18002586161/SMS BLOCK DC  8765 to 7308080808",
    expect: {
      amount: 237313,
      type: "expense",
      accountLast4: "8765",
      counterparty: "GOOGLE *Play",
    },
  },
  {
    name: "HDFC card spend ALERT variant (contains 'without PIN/OTP')",
    sender: "AX-HDFCBK-S",
    body: "ALERT:Rs.499.49 spent via HDFC BANK Debit Card xx8765 at IND*SampleSite (PGSI) on Aug 31 2025 3:39AM without PIN/OTP.Not you?Call 18001600 / 18002600.",
    expect: { amount: 49949, type: "expense", accountLast4: "8765" },
  },
  {
    name: "ATM withdrawal",
    sender: "AD-HDFCBK-S",
    body: "Withdrawn Rs.15000 From HDFC Bank Card x8765 At +SAMPLE COMPLEX OATM On 2026-06-21:19:02:57 Bal Rs.163985.84 Not You? Call 18002586161/SMS BLOCK DC  8765 to 7308080808",
    expect: { amount: 1500000, type: "expense", accountLast4: "8765" },
  },
  {
    name: "Unknown bank still parses (generic structure)",
    sender: "VK-FINOBK-S",
    body: "Rs.750.00 debited from A/c XX5555 on 12-07-26 to SAMPLE MART. Ref no 787878787878. Avl bal Rs.1,234.56",
    expect: { amount: 75000, type: "expense", accountLast4: "5555", refNo: "787878787878" },
  },
  // ---- must-reject cases ----
  {
    name: "OTP message with amount (rejected)",
    sender: "JM-HDFCBK",
    body: "577732 is your SECRET 6-digit OTP to complete your ATM withdrawal of Rs. 2000 via Card XX8765 at HDFC Bank ATM.",
    expect: null,
  },
  {
    name: "Collect request / future debit (rejected)",
    sender: "VA-SBIUPI-S",
    body: "SWIGGY has requested Rs249 frm u on Google Pay app. Once approved, money will be debited frm ur a/c -SBI",
    expect: null,
  },
  {
    name: "E-mandate pre-alert (rejected)",
    sender: "JX-HDFCBK-S",
    body: "E-Mandate!\nRs.149.00 will be deducted on 24/06/26, 00:00:00\nFor SAMPLE ENTERTAINMENT mandate\nUMN abc@pz\nMaintain Balance\n-HDFC Bank",
    expect: null,
  },
  {
    name: "Declined transaction (rejected)",
    sender: "JD-HDFCBK-S",
    body: "TXN DECLINED: Rs. 749.00 on 02-11-25 at 18:26:28 | On HDFC Bank Debit Card 8765 | Reason: Technical failure | Please retry the transaction.",
    expect: null,
  },
  {
    name: "Promo voucher (rejected)",
    sender: "VM-HDFCBK",
    body: "Dear Customer, Grab Rs.1500 voucher with Lifetime Free Credit Card. Apply now: https://example.test T&C",
    expect: null,
  },
  {
    name: "Merchant receipt without account token (rejected)",
    sender: "JZ-JioPay",
    body: "Recharge of Rs. 209.00 is successful for your Jio number 0000000000. Transaction ID: BR000AAAAA",
    expect: null,
  },
  {
    name: "Personal number never parses",
    sender: "+919000000000",
    body: "bro I debited Rs.500 from A/c 1234 lol",
    expect: null,
  },
];

let pass = 0;
for (const c of CASES) {
  const got = parseTransactionSms({ sender: c.sender, body: c.body });
  try {
    if (c.expect === null) {
      assert.equal(got, null, `${c.name}: expected reject, got ${JSON.stringify(got)}`);
    } else {
      assert.ok(got, `${c.name}: expected parse, got null`);
      assert.equal(got.amount, c.expect.amount, `${c.name}: amount`);
      assert.equal(got.type, c.expect.type, `${c.name}: type`);
      if (c.expect.accountLast4 !== undefined)
        assert.equal(got.accountLast4, c.expect.accountLast4, `${c.name}: last4`);
      if (c.expect.counterparty !== undefined)
        assert.equal(got.counterparty, c.expect.counterparty, `${c.name}: counterparty`);
      if (c.expect.refNo !== undefined)
        assert.equal(got.refNo, c.expect.refNo, `${c.name}: refNo`);
    }
    pass++;
  } catch (e) {
    console.error("FAIL:", (e as Error).message);
  }
}

// Sender classification + hash determinism.
assert.equal(classifySender("VM-HDFCBK-P").transactional, false, "promo route rejected");
assert.equal(classifySender("AD-SBIUPI").bankCode, "SBI", "SBI group");
assert.equal(classifySender("59029414").transactional, true, "shortcode allowed");
assert.equal(
  computeSmsHash("A", "b", 1),
  computeSmsHash("A", "b", 1),
  "hash deterministic",
);
assert.notEqual(computeSmsHash("A", "b", 1), computeSmsHash("A", "b", 2), "hash varies");

console.log(`${pass}/${CASES.length} fixture cases passed`);
if (pass !== CASES.length) process.exit(1);
