/* eslint-disable import/no-dynamic-require */
/* global describe, it */

import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { expect } from "chai"; // eslint-disable-line import/no-extraneous-dependencies

const rootDir = path.resolve(__dirname, "../..");

describe("CommonJS build", () => {
  const libPath = path.resolve(
    rootDir,
    "lib/react-input-mask.production.min.js"
  );
  const InputElement = require(libPath);

  it("should return a string", () => {
    const result = ReactDOMServer.renderToString(
      <InputElement value="some" mask="799" />
    );
    expect(typeof result).to.equal("string");
  });
});

describe("UMD build", () => {
  const libPath = path.resolve(rootDir, "dist/react-input-mask.min.js");
  const InputElement = require(libPath);

  it("should return a string", () => {
    const result = ReactDOMServer.renderToString(
      <InputElement value="some" mask="799" />
    );
    expect(typeof result).to.equal("string");
  });
});
