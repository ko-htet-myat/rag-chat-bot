import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges class names without dropping valid values", () => {
    expect(cn("text-sm", undefined, null, false, "text-lg")).toContain(
      "text-lg",
    );
    expect(cn("rounded", "rounded-md")).toContain("rounded-md");
  });
});
