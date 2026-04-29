import test from "node:test";
import assert from "node:assert/strict";
import { asciiSlugFromHumanLabel, isValidMysqlVarchar32Id } from "./identifiable-varchar32.ts";

test("asciiSlugFromHumanLabel: latin", () => {
  assert.equal(asciiSlugFromHumanLabel("  Hello World  "), "hello_world");
});

test("asciiSlugFromHumanLabel: chinese to pinyin stem", () => {
  const s = asciiSlugFromHumanLabel("一年级");
  assert.ok(s.length > 0);
  assert.ok(/^[a-z0-9_]+$/.test(s));
});

test("isValidMysqlVarchar32Id", () => {
  assert.equal(isValidMysqlVarchar32Id("ab_12"), true);
  assert.equal(isValidMysqlVarchar32Id("no-dash"), false);
  assert.equal(isValidMysqlVarchar32Id(""), false);
  assert.equal(isValidMysqlVarchar32Id("a".repeat(33)), false);
});
