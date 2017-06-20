import "mocha";
import * as chai from "chai";

import index = require("../src/index");

const expect = chai.expect;

describe("index", () => {
    it("should provide FluxBulb", () => {
        expect(index.FluxBulb).to.not.be.undefined;
    });
    it("should provide FluxBulbState", () => {
        expect(index.FluxBulbState).to.not.be.undefined;
    });
});
