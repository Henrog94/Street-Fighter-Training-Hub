import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import TrainingPlan from "../models/TrainingPlan.js";
import User from "../models/User.js";

const base = () => ({ user: new mongoose.Types.ObjectId(), fighter: "Ryu", focus: "Neutral", goal: "Practice anti-airs", scheduledDate: "2026-11-20", startTime: "18:00", duration: 60 });
const errorFor = (data) => new TrainingPlan(data).validateSync();

test("valid training plan passes schema validation", () => { assert.equal(errorFor(base()), undefined); });
test("training plan requires owner", () => { const {user,...rest}=base(); assert.ok(errorFor(rest)?.errors.user); });
test("training plan requires fighter", () => { assert.ok(errorFor({...base(),fighter:""})?.errors.fighter); });
test("training plan requires focus", () => { assert.ok(errorFor({...base(),focus:""})?.errors.focus); });
test("training plan requires goal", () => { assert.ok(errorFor({...base(),goal:""})?.errors.goal); });
test("training plan rejects invalid date format", () => { assert.ok(errorFor({...base(),scheduledDate:"20/11/2026"})?.errors.scheduledDate); });
test("training plan rejects invalid time", () => { assert.ok(errorFor({...base(),startTime:"25:90"})?.errors.startTime); });
test("training plan rejects duration below minimum", () => { assert.ok(errorFor({...base(),duration:5})?.errors.duration); });
test("training plan rejects duration above maximum", () => { assert.ok(errorFor({...base(),duration:300})?.errors.duration); });
test("training plan rejects invalid status", () => { assert.ok(errorFor({...base(),status:"pending"})?.errors.status); });
test("training plan defaults to scheduled", () => { assert.equal(new TrainingPlan(base()).status,"scheduled"); });
test("user requires a password", () => { assert.ok(new User({username:"tester",email:"test@example.com"}).validateSync()?.errors.password); });
test("user rejects too-short password", () => { assert.ok(new User({username:"tester",email:"test@example.com",password:"short"}).validateSync()?.errors.password); });
