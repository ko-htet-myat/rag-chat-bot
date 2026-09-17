import { describe, expect, it, vi } from "vitest";

vi.mock("@/ai/runtime/embeddings", () => ({
  embedText: vi.fn(),
}));

vi.mock("@/ai/runtime/generate", () => ({
  generateResponse: vi.fn(),
}));

import { buildQueryVariants, extractKeywords } from "@/ai/rag/retrieval/retriever";

describe("retriever Burmese query bridging", () => {
  it("keeps the Burmese place root when stripping grammar suffixes", () => {
    expect(extractKeywords("နွားထိုးကြီးမြို့ရဲ့ လူဦးရေဘယ်လောက်ရှိလဲ")).toContain(
      "နွားထိုးကြီး",
    );
  });

  it("adds English bridge terms for Burmese population questions about Natogyi", () => {
    const variants = buildQueryVariants({
      retrievalQuery: "နွားထိုးကြီးမြို့ရဲ့ လူဦးရေဘယ်လောက်ရှိလဲ",
      historyEntities: [],
      threshold: 0.5,
      isFollowUp: false,
      generatedBridgeQueries: [
        "Natogyi Township population",
        "population of Natogyi",
      ],
    });

    const bridge = variants.find((variant) => variant.label === "english-bridge");
    const generatedBridge = variants.find(
      (variant) => variant.label === "generated-bridge",
    );

    expect(bridge?.keywords).toEqual(
      expect.arrayContaining(["population", "Natogyi", "Natogyi Township"]),
    );
    expect(generatedBridge?.query).toBe("Natogyi Township population");
    expect(generatedBridge?.keywords).toEqual(
      expect.arrayContaining(["Natogyi", "Township", "population"]),
    );
    expect(bridge?.enrichedQuery).toContain("နွားထိုးကြီးမြို့ရဲ့");
  });
});
