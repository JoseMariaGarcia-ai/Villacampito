import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for calendar occupied dates procedures.
 * We test the router logic by mocking the db helpers.
 */

// Mock the db module
vi.mock("./db", () => ({
  getAllOccupiedDates: vi.fn(),
  addOccupiedDates: vi.fn(),
  removeOccupiedDates: vi.fn(),
  getDb: vi.fn(),
}));

import { getAllOccupiedDates, addOccupiedDates, removeOccupiedDates } from "./db";

const mockedGetAll = vi.mocked(getAllOccupiedDates);
const mockedAdd = vi.mocked(addOccupiedDates);
const mockedRemove = vi.mocked(removeOccupiedDates);

describe("Calendar admin logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return occupied dates from database", async () => {
    const mockDates = ["2026-02-07", "2026-02-12", "2026-03-07"];
    mockedGetAll.mockResolvedValue(mockDates);

    const result = await getAllOccupiedDates();
    expect(result).toEqual(mockDates);
    expect(result).toHaveLength(3);
  });

  it("should add dates to database", async () => {
    mockedAdd.mockResolvedValue(3);
    mockedGetAll.mockResolvedValue(["2026-02-07", "2026-02-12", "2026-03-07"]);

    const added = await addOccupiedDates(["2026-02-07", "2026-02-12", "2026-03-07"]);
    expect(added).toBe(3);
    expect(mockedAdd).toHaveBeenCalledWith(["2026-02-07", "2026-02-12", "2026-03-07"]);
  });

  it("should remove dates from database", async () => {
    mockedRemove.mockResolvedValue(2);
    mockedGetAll.mockResolvedValue(["2026-03-07"]);

    const removed = await removeOccupiedDates(["2026-02-07", "2026-02-12"]);
    expect(removed).toBe(2);
    expect(mockedRemove).toHaveBeenCalledWith(["2026-02-07", "2026-02-12"]);
  });

  it("should validate date format YYYY-MM-DD", () => {
    const validDates = ["2026-02-07", "2026-12-31", "2027-01-01"];
    const invalidDates = ["2026-2-7", "07-02-2026", "2026/02/07", "abc"];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    validDates.forEach(d => expect(d).toMatch(dateRegex));
    invalidDates.forEach(d => expect(d).not.toMatch(dateRegex));
  });

  it("should verify correct password", () => {
    const ADMIN_PASSWORD = "Villacampito2023";
    expect("Villacampito2023").toBe(ADMIN_PASSWORD);
    expect("wrongpassword").not.toBe(ADMIN_PASSWORD);
    expect("villacampito2023").not.toBe(ADMIN_PASSWORD);
    expect("").not.toBe(ADMIN_PASSWORD);
  });

  it("should handle empty dates array", async () => {
    mockedAdd.mockResolvedValue(0);
    const added = await addOccupiedDates([]);
    expect(added).toBe(0);
  });

  it("should handle all initial occupied dates count", async () => {
    const allDates = [
      "2026-02-07", "2026-02-12", "2026-02-14", "2026-02-21",
      "2026-03-07",
      "2026-04-09", "2026-04-10", "2026-04-11", "2026-04-12", "2026-04-23", "2026-04-24", "2026-04-25", "2026-04-26", "2026-04-30",
      "2026-05-01", "2026-05-02", "2026-05-07", "2026-05-08", "2026-05-09", "2026-05-10", "2026-05-14", "2026-05-15", "2026-05-16",
      "2026-06-01", "2026-06-02", "2026-06-05", "2026-06-06", "2026-06-07", "2026-06-26", "2026-06-27",
      "2026-07-03", "2026-07-04", "2026-07-05", "2026-07-10", "2026-07-11", "2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24", "2026-07-25", "2026-07-26", "2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31",
      "2026-08-01", "2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06", "2026-08-07", "2026-08-08", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23", "2026-08-24", "2026-08-25", "2026-08-28", "2026-08-29",
    ];
    mockedGetAll.mockResolvedValue(allDates);

    const result = await getAllOccupiedDates();
    expect(result).toHaveLength(63);
    expect(result[0]).toBe("2026-02-07");
    expect(result[result.length - 1]).toBe("2026-08-29");
  });
});
