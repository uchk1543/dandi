import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isSitesPathHost,
  siteLabelFromHost,
  siteLabelFromPath,
  siteLabelFromReferer,
  sitesPathOrigin,
} from "../src/app/site-serve/host.ts";

// 경로형 사이트 주소(SITES_ORIGIN): https://<사이트 호스트>/<label>/<경로>

function withSitesOrigin(value: string | undefined, fn: () => void): void {
  const prev = process.env.SITES_ORIGIN;
  if (value === undefined) delete process.env.SITES_ORIGIN;
  else process.env.SITES_ORIGIN = value;
  try {
    fn();
  } finally {
    if (prev === undefined) delete process.env.SITES_ORIGIN;
    else process.env.SITES_ORIGIN = prev;
  }
}

test("SITES_ORIGIN: origin만 받고 경로가 있으면 쓰지 않는다", () => {
  withSitesOrigin("https://dandi-sites.vercel.app/", () => {
    assert.equal(sitesPathOrigin(), "https://dandi-sites.vercel.app");
    assert.equal(isSitesPathHost("dandi-sites.vercel.app"), true);
    assert.equal(isSitesPathHost("DANDI-SITES.vercel.app"), true);
    assert.equal(isSitesPathHost("dandi-gold.vercel.app"), false);
    assert.equal(isSitesPathHost(null), false);
  });
  withSitesOrigin("https://dandi-sites.vercel.app/sites", () => assert.equal(sitesPathOrigin(), null));
  withSitesOrigin("ftp://dandi-sites.vercel.app", () => assert.equal(sitesPathOrigin(), null));
  withSitesOrigin(undefined, () => assert.equal(isSitesPathHost("dandi-sites.vercel.app"), false));
});

test("siteLabelFromPath: 첫 조각이 공개·미리보기 label 형식일 때만", () => {
  assert.deepEqual(siteLabelFromPath("/site-prt04y"), { label: "site-prt04y", rest: "/" });
  assert.deepEqual(siteLabelFromPath("/site-prt04y/"), { label: "site-prt04y", rest: "/" });
  assert.deepEqual(siteLabelFromPath("/site-prt04y--3wvhkwmgr6/a/b.js"), {
    label: "site-prt04y--3wvhkwmgr6",
    rest: "/a/b.js",
  });
  assert.equal(siteLabelFromPath("/"), null);
  assert.equal(siteLabelFromPath("/index.html"), null);
  assert.equal(siteLabelFromPath("/_next/static/x.js"), null);
  assert.equal(siteLabelFromPath("/Quiz/"), null);
  assert.equal(siteLabelFromPath("/ab/"), null);
});

test("siteLabelFromReferer: 같은 사이트 호스트의 Referer만", () => {
  const host = "dandi-sites.vercel.app";
  assert.equal(siteLabelFromReferer("https://dandi-sites.vercel.app/site-prt04y/", host), "site-prt04y");
  assert.equal(siteLabelFromReferer("https://dandi-sites.vercel.app/site-prt04y/page/2", host), "site-prt04y");
  assert.equal(siteLabelFromReferer("https://evil.example/site-prt04y/", host), null);
  assert.equal(siteLabelFromReferer("https://dandi-sites.vercel.app/", host), null);
  assert.equal(siteLabelFromReferer("not a url", host), null);
  assert.equal(siteLabelFromReferer(null, host), null);
});

test("경로형 호스트는 하위 도메인형 사이트 호스트로 보지 않는다", () => {
  withSitesOrigin("https://dandi-sites.vercel.app", () => {
    assert.equal(siteLabelFromHost("dandi-sites.vercel.app"), null);
    assert.equal(siteLabelFromHost("quiz.localhost:3000"), "quiz");
  });
});
