import request from "supertest";
import { app, db } from "../app.js";

// DO NOT import describe, it, before, after from "node:test"
// Jest provides describe, it, beforeAll, afterAll, and expect globally.

describe("API Rate Limiter Verification", () => {
    beforeAll(async () => {
        await db.query("TRUNCATE TABLE rate_limit_states;");
    });

    afterAll(async () => {
        await db.end();
    });

    it("client-1 should succeed on /foo within limit and fail when exceeded (TokenBucket + Memory)", async () => {
        // client-1 foo limit = 5
        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .get("/foo")
                .set("Authorization", "bearer client-1");
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
        }

        // 6th request triggers rate limit
        const blockedRes = await request(app)
            .get("/foo")
            .set("Authorization", "bearer client-1");
        expect(blockedRes.status).toBe(429);
        expect(blockedRes.body).toEqual({ error: "rate limit exceeded" });
    });

    it("client-2 should succeed on /foo within limit and fail when exceeded (TokenBucket + Postgres)", async () => {
        // client-2 foo limit = 2
        for (let i = 0; i < 2; i++) {
            const res = await request(app)
                .get("/foo")
                .set("Authorization", "bearer client-2");
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
        }

        const blockedRes = await request(app)
            .get("/foo")
            .set("Authorization", "bearer client-2");
        expect(blockedRes.status).toBe(429);
        expect(blockedRes.body).toEqual({ error: "rate limit exceeded" });
    });

    it("rejects unauthorized client tokens", async () => {
        const res = await request(app)
            .get("/foo")
            .set("Authorization", "bearer unknown-client");
        expect(res.status).toBe(401);
    });
});