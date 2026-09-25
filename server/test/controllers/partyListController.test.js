import { describe, test, expect, vi, beforeAll } from "vitest";

let controller;

beforeAll(async () => {

    process.env.SUPABASE_URL =
        "https://example.supabase.co";

    process.env.SUPABASE_SECRET_KEY =
        "test-secret-key";

    controller =
        await import("../../src/controllers/partyListController.js");
});


test("PASS - Party List controller loads with Supabase configuration", () => {

    expect(controller).toBeDefined();

    expect(
        typeof controller.createPartyList
    ).toBe("function");

});


test("PASS - createPartyList rejects missing election ID without database access", async () => {

    const req = {
        body: {
            name: "Unity Party"
        }
    };

    const res = {

        status: vi.fn(),

        json: vi.fn()

    };

    res.status.mockReturnValue(res);

    res.json.mockReturnValue(res);


    await controller.createPartyList(req, res);


    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
            success: false,
            message: "Election ID is required."
        })
    );

});
