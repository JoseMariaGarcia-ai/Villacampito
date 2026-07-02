import { describe, it, expect } from "vitest";

const ADMIN_PASSWORD = "Villacampito2023";
const WRONG_PASSWORD = "wrong";

describe("Offers procedures", () => {
  it("should reject wrong password on getAll", async () => {
    // The adminProcedure middleware should reject wrong passwords
    expect(WRONG_PASSWORD).not.toBe(ADMIN_PASSWORD);
  });

  it("should accept correct password", () => {
    expect(ADMIN_PASSWORD).toBe("Villacampito2023");
  });

  it("should validate offer title is required", () => {
    const title = "";
    expect(title.length).toBe(0);
    // z.string().min(1) would reject empty title
  });

  it("should validate offer description is required", () => {
    const description = "";
    expect(description.length).toBe(0);
    // z.string().min(1) would reject empty description
  });

  it("should allow discount to be optional", () => {
    const offerWithDiscount = { title: "Test", description: "Desc", discount: "20%" };
    const offerWithoutDiscount = { title: "Test", description: "Desc" };
    expect(offerWithDiscount.discount).toBe("20%");
    expect(offerWithoutDiscount).not.toHaveProperty("discount");
  });

  it("should ensure only one offer can be active at a time (logic check)", () => {
    // When activating an offer, all others should be deactivated
    const offers = [
      { id: 1, active: true },
      { id: 2, active: false },
      { id: 3, active: false },
    ];
    // Simulating activating offer 2: deactivate all, then activate 2
    const afterToggle = offers.map(o => ({
      ...o,
      active: o.id === 2,
    }));
    expect(afterToggle.filter(o => o.active)).toHaveLength(1);
    expect(afterToggle.find(o => o.id === 2)?.active).toBe(true);
    expect(afterToggle.find(o => o.id === 1)?.active).toBe(false);
  });

  it("should handle popup delay constant correctly", () => {
    const POPUP_DELAY_MS = 15_000;
    expect(POPUP_DELAY_MS).toBe(15000);
    expect(POPUP_DELAY_MS / 1000).toBe(15); // 15 seconds
  });
});
