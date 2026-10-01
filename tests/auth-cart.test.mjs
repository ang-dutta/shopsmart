import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal browser stubs so the localStorage-based modules can run under Node.
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
globalThis.window = { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} };
const { register, login, logout, getUser } = await import('../lib/auth.js');
const cart = await import('../lib/client-store.js');

test('register, logout, wrong password, login', async () => {
  await register({ name: 'Ada', email: 'Ada@Example.com', password: 'secret1' });
  assert.equal(getUser().email, 'ada@example.com');
  assert.ok(![...mem.values()].some((v) => v.includes('secret1')), 'password must not be stored in plain text');
  logout(); assert.equal(getUser(), null);
  await assert.rejects(() => login({ email: 'ada@example.com', password: 'nope' }), /Incorrect/);
  assert.equal((await login({ email: 'ada@example.com', password: 'secret1' })).name, 'Ada');
  await assert.rejects(() => register({ name: 'Ada', email: 'ada@example.com', password: 'secret1' }), /already exists/);
});

test('cart is per user and supports qty / remove / clear', async () => {
  cart.addToCart('P1'); cart.addToCart('P1'); cart.addToCart('P2'); cart.setQty('P2', 5);
  assert.deepEqual(cart.getCartItems(), [{ id: 'P1', qty: 2 }, { id: 'P2', qty: 5 }]);
  assert.equal(cart.cartCount(), 7);
  logout(); assert.deepEqual(cart.getCartItems(), [], 'signed-out visitors have no cart');
  await register({ name: 'Bob', email: 'bob@example.com', password: 'secret2' });
  assert.deepEqual(cart.getCartItems(), [], 'another user starts with an empty cart');
  logout(); await login({ email: 'ada@example.com', password: 'secret1' });
  cart.removeFromCart('P1'); assert.deepEqual(cart.getCart(), ['P2']);
  cart.clearCart(); assert.equal(cart.cartCount(), 0);
});
