import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export type ReceiptExtraction = {
  amount: number | null;
  date: string | null;
  merchant: string | null;
  category_hint: string | null;
};

export type ExtractionResult = {
  fields: ReceiptExtraction;
  raw: unknown;
};

const MODEL = "claude-haiku-4-5-20251001";

const SUPPORTED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

type SupportedMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

function normalizeMediaType(mime: string): SupportedMediaType {
  const lower = mime.toLowerCase();
  if (lower === "image/jpg") return "image/jpeg";
  if ((SUPPORTED_MEDIA_TYPES as readonly string[]).includes(lower)) {
    return lower as SupportedMediaType;
  }
  // Receipt photos from cameras are jpeg by default; fall back rather than fail.
  return "image/jpeg";
}

const TOOL = {
  name: "record_receipt",
  description:
    "Record the fields you read from a receipt photo. Return null for any field you can't read confidently rather than guessing.",
  input_schema: {
    type: "object" as const,
    properties: {
      amount: {
        type: ["number", "null"],
        description:
          "Final total paid, in MAD. Pick the grand total, not the subtotal or VAT line. Null if not legible.",
      },
      date: {
        type: ["string", "null"],
        description:
          "Purchase date in ISO format (YYYY-MM-DD). Null if not legible.",
      },
      merchant: {
        type: ["string", "null"],
        description:
          "Merchant / store name as printed on the receipt. Null if not legible.",
      },
      category_hint: {
        type: ["string", "null"],
        description:
          "A short free-text guess at the kind of expense (e.g. 'Groceries', 'Restaurant', 'Pharmacy'). Null if unclear.",
      },
    },
    required: ["amount", "date", "merchant", "category_hint"],
  },
};

const INSTRUCTIONS = `You are extracting fields from a receipt photo for a personal expense tracker.

Rules:
- Currency is MAD (Moroccan Dirham). Ignore other currency markers.
- Receipts may be in Arabic, French, or English — read whichever appears.
- Pick the GRAND TOTAL paid, not subtotals, VAT lines, or tip suggestions.
- Dates may appear as DD/MM/YYYY, DD-MM-YYYY, or with month names; normalize to YYYY-MM-DD.
- If a field is unreadable, faded, or ambiguous, return null. Do NOT guess.

Call the record_receipt tool with the extracted fields.`;

export async function extractReceiptFields(
  bytes: ArrayBuffer,
  mimeType: string
): Promise<ExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }

  const client = new Anthropic({ apiKey });
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = normalizeMediaType(mimeType);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64,
            },
          },
          { type: "text", text: INSTRUCTIONS },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("Claude did not return a tool_use block.");
  }

  const fields = toolUse.input as ReceiptExtraction;

  return { fields, raw: response };
}
