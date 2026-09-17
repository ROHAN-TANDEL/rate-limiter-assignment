import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app, db } from "../app.js";

describe("API Rate Limiter Verification", () => {
    before(async () => {
        await db.query("TRUNCATE TABLE rate_limit_states;");
    });

    after(async () => {
        await db.end();
    });

    it("client-alpha should succeed on /foo within limit and fail when exceeded (TokenBucket + Memory)", async () => {
        // client-alpha foo limit = 5
        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .get("/foo")
                .set("Authorization", "bearer client-alpha");
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { succes: true });
        }

        // 6th request triggers rate limit
        const blockedRes = await request(app)
            .get("/foo")
            .set("Authorization", "bearer client-alpha");
        assert.equal(blockedRes.status, 429);
        assert.deepEqual(blockedRes.body, { error: "rate limit exceeded" });
    });

    it("client-beta should succeed on /foo within limit and fail when exceeded (TokenBucket + Postgres)", async () => {
        // client-beta foo limit = 2
        for (let i = 0; i < 2; i++) {
            const res = await request(app)
                .get("/foo")
                .set("Authorization", "bearer client-beta");
            assert.equal(res.status, 200);
            assert.deepEqual(res.body, { succes: true });
        }

        const blockedRes = await request(app)
            .get("/foo")
            .set("Authorization", "bearer client-beta");
        assert.equal(blockedRes.status, 429);
        assert.deepEqual(blockedRes.body, { error: "rate limit exceeded" });
    });

    it("rejects unauthorized client tokens", async () => {
        const res = await request(app)
            .get("/foo")
            .set("Authorization", "bearer unknown-client");
        assert.equal(res.status, 401);
    });
});