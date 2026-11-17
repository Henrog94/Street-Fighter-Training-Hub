import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import TrainingPlan from '../models/TrainingPlan.js';
import authRoutes from '../routes/authRoutes.js';
import trainingPlanRoutes from '../routes/trainingPlanRoutes.js';

// HTTP integration tests with an in-memory model stub. No MongoDB writes occur.
// These verify real Express routing, authentication, validation responses, and CRUD handling.
test('authentication and training-plan HTTP routes', async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'fightlab-test-only-secret-not-for-production';
  const original = {
    userFind: User.findById,
    create: TrainingPlan.create,
    find: TrainingPlan.find,
    findOne: TrainingPlan.findOne,
    update: TrainingPlan.findOneAndUpdate,
    remove: TrainingPlan.findOneAndDelete,
  };
  const owner = new mongoose.Types.ObjectId().toString();
  const stranger = new mongoose.Types.ObjectId().toString();
  const plans = new Map();
  const fakeUser = { _id: owner, username: 'tester', email: 'tester@example.invalid', avatar: '' };
  User.findById = async (id) => String(id) === owner || String(id) === stranger
    ? { ...fakeUser, _id: id } : null;
  TrainingPlan.create = async (data) => {
    const item = { ...data, _id: new mongoose.Types.ObjectId().toString(), status: data.status ?? 'scheduled' };
    plans.set(item._id, item);
    return item;
  };
  TrainingPlan.find = (query) => ({ sort: async () => [...plans.values()].filter(p => String(p.user) === String(query.user)) });
  TrainingPlan.findOne = async (query) => {
    const item = plans.get(String(query._id));
    return item && String(item.user) === String(query.user) ? item : null;
  };
  TrainingPlan.findOneAndUpdate = async (query, update) => {
    const item = await TrainingPlan.findOne(query);
    if (!item) return null;
    Object.assign(item, update.$set);
    return item;
  };
  TrainingPlan.findOneAndDelete = async (query) => {
    const item = await TrainingPlan.findOne(query);
    if (item) plans.delete(String(item._id));
    return item;
  };
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/training-plans', trainingPlanRoutes);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = jwt.sign({ userId: owner }, process.env.JWT_SECRET);
  const otherToken = jwt.sign({ userId: stranger }, process.env.JWT_SECRET);
  const request = async (method, path, auth = token, body) => {
    const response = await fetch(base + path, {
      method,
      headers: { ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };
  try {
    await t.test('rejects unauthenticated planner access', async () => {
      assert.equal((await request('GET', '/api/training-plans', null)).status, 401);
    });
    await t.test('rejects malformed bearer tokens', async () => {
      assert.equal((await request('GET', '/api/training-plans', 'bad.token')).status, 401);
    });
    await t.test('returns authenticated user without password', async () => {
      const result = await request('GET', '/api/auth/me');
      assert.equal(result.status, 200);
      assert.equal(result.body.user.username, 'tester');
      assert.equal(result.body.user.password, undefined);
    });
    const data = { fighter: 'Ryu', focus: 'Neutral', goal: 'Improve spacing', scheduledDate: '2026-12-01', startTime: '18:30', duration: 60 };
    let id;
    await t.test('creates a session for the authenticated owner', async () => {
      const result = await request('POST', '/api/training-plans', token, data);
      assert.equal(result.status, 201);
      assert.equal(result.body.plan.user, owner);
      id = result.body.plan._id;
    });
    await t.test('lists only the owner’s sessions', async () => {
      const own = await request('GET', '/api/training-plans');
      const others = await request('GET', '/api/training-plans', otherToken);
      assert.equal(own.status, 200);
      assert.equal(own.body.length, 1);
      assert.deepEqual(others.body, []);
    });
    await t.test('retrieves a session by ID', async () => {
      const result = await request('GET', `/api/training-plans/${id}`);
      assert.equal(result.status, 200);
      assert.equal(result.body.fighter, 'Ryu');
    });
    await t.test('blocks another account from reading the session', async () => {
      assert.equal((await request('GET', `/api/training-plans/${id}`, otherToken)).status, 404);
    });
    await t.test('reschedules and updates a session', async () => {
      const result = await request('PATCH', `/api/training-plans/${id}`, token, { scheduledDate: '2026-12-02', startTime: '19:00' });
      assert.equal(result.status, 200);
      assert.equal(result.body.plan.scheduledDate, '2026-12-02');
    });
    await t.test('rejects empty updates and invalid IDs', async () => {
      assert.equal((await request('PATCH', `/api/training-plans/${id}`, token, { unknown: 'x' })).status, 400);
      assert.equal((await request('GET', '/api/training-plans/not-an-id')).status, 400);
    });
    await t.test('blocks another account from deleting the session', async () => {
      assert.equal((await request('DELETE', `/api/training-plans/${id}`, otherToken)).status, 404);
    });
    await t.test('deletes the session and confirms it is gone', async () => {
      assert.equal((await request('DELETE', `/api/training-plans/${id}`)).status, 200);
      assert.equal((await request('GET', `/api/training-plans/${id}`)).status, 404);
    });
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    User.findById = original.userFind;
    TrainingPlan.create = original.create;
    TrainingPlan.find = original.find;
    TrainingPlan.findOne = original.findOne;
    TrainingPlan.findOneAndUpdate = original.update;
    TrainingPlan.findOneAndDelete = original.remove;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});
