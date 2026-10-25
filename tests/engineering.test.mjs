import test from "node:test";
import assert from "node:assert/strict";
import {
  circumradius,
  resample,
  cleanPoints,
  headingChange,
  metersToFeet,
  scenarioSpeed,
  haversine,
  simulationStep,
} from "../src/engineering.mjs";
const point = (r, t) => [r * Math.cos(t), r * Math.sin(t)];
for (const radius of [25, 100, 500, 1000])
  test(`circumcircle recovers ${radius} meter circular arc`, () => {
    assert.ok(
      Math.abs(
        circumradius(point(radius, 0), point(radius, 0.2), point(radius, 0.4)) -
          radius,
      ) < 1e-8,
    );
  });
test("straight and near-collinear points yield no finite curvature", () => {
  assert.equal(circumradius([0, 0], [20, 0], [40, 0]), Infinity);
  assert.equal(circumradius([0, 0], [20, 1e-12], [40, 0]), Infinity);
});
test("duplicates and missing geometry are handled", () => {
  assert.equal(circumradius([0, 0], [0, 0], [20, 5]), Infinity);
  assert.equal(circumradius(null, [1, 2], [2, 3]), Infinity);
  assert.deepEqual(cleanPoints([[0, 0], [0, 0], [10, 0], null, [NaN, 3]]), [
    [0, 0],
    [10, 0],
  ]);
  assert.deepEqual(resample(null), []);
});
test("very short geometry yields no artificial candidate samples", () => {
  assert.equal(
    resample(
      [
        [0, 0],
        [1, 0],
      ],
      10,
    ).length,
    1,
  );
  assert.deepEqual(resample([[0, 0]], 10), []);
});
test("resampling preserves ten meter spacing despite irregular vertices", () => {
  const p = resample(
    [
      [0, 0],
      [3, 0],
      [27, 0],
      [101, 0],
    ],
    10,
  );
  assert.equal(p.length, 11);
  p.forEach((v, i) => assert.ok(Math.abs(v[0] - i * 10) < 1e-10));
});
test("reversal preserves radius and reverses signed turn", () => {
  const a = point(80, 0),
    b = point(80, 0.3),
    c = point(80, 0.6);
  assert.ok(Math.abs(circumradius(a, b, c) - circumradius(c, b, a)) < 1e-8);
  assert.ok(Math.abs(headingChange(a, b, c) + headingChange(c, b, a)) < 1e-10);
});
test("radius remains correct with irregular angular spacing", () => {
  assert.ok(
    Math.abs(
      circumradius(point(200, 0.01), point(200, 0.2), point(200, 0.9)) - 200,
    ) < 1e-8,
  );
});
test("metric to feet conversion and physics agree with imperial formula", () => {
  assert.equal(metersToFeet(0.3048), 1);
  assert.ok(
    Math.abs(scenarioSpeed(0.3048 * 100, "m", 0.04, 0.12) - Math.sqrt(240)) <
      1e-10,
  );
  assert.equal(scenarioSpeed(100, "ft", 0.04, 0.12), Math.sqrt(240));
});
test("physics rejects absent inputs, zero radius, invalid units and nonphysical values", () => {
  for (const values of [
    [null, "m", 0.04, 0.12],
    [100, "m", null, 0.12],
    [100, "m", 0.04, null],
    [0, "m", 0.04, 0.12],
    [-1, "m", 0.04, 0.12],
    [100, "km", 0.04, 0.12],
    [100, "m", -0.01, 0.12],
    [100, "m", 0.2, 0.12],
    [100, "m", 0.04, 0.8],
    ["", "m", 0.04, 0.12],
    [100, "m", 0, 0],
  ])
    assert.throws(() => scenarioSpeed(...values));
});
test("distance uses meters and remains zero for identical positions", () => {
  assert.equal(haversine([-94, 36], [-94, 36]), 0);
  assert.ok(Math.abs(haversine([0, 0], [0, 1]) - 111195) < 1);
});
test("simulation moves, reaches alert threshold and clamps to zero", () => {
  assert.deepEqual(simulationStep(200, 1), {
    remaining: 175,
    alert: false,
    complete: false,
  });
  assert.deepEqual(simulationStep(175, 1), {
    remaining: 150,
    alert: true,
    complete: false,
  });
  assert.deepEqual(simulationStep(10, 1), {
    remaining: 0,
    alert: true,
    complete: true,
  });
});
