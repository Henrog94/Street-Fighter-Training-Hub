import test from "node:test";
import assert from "node:assert/strict";
import { protect } from "../middleware/authMiddleware.js";

const response = () => ({ code:200, body:null, status(n){this.code=n;return this;}, json(v){this.body=v;return this;} });
test("missing bearer token returns 401", async () => { const res=response(); await protect({headers:{}},res,()=>{});assert.equal(res.code,401); });
test("empty bearer token returns 401", async () => { const res=response(); await protect({headers:{authorization:"Bearer "}},res,()=>{});assert.equal(res.code,401); });
test("malformed bearer token returns 401 when JWT secret is set", async () => { const old=process.env.JWT_SECRET;process.env.JWT_SECRET="capstone-test-secret";try{const res=response();await protect({headers:{authorization:"Bearer malformed.token.value"}},res,()=>{});assert.equal(res.code,401);}finally{if(old===undefined)delete process.env.JWT_SECRET;else process.env.JWT_SECRET=old;} });
