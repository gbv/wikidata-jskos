require("should")

const getPropertyUses = require("../lib/queries/get-property-uses")

describe("getPropertyUses", () => {
  it("returns an object with property counts", () => {
    return getPropertyUses()
      .then(uses => {
        uses.should.be.Object()
        should(uses["P31"]).be.greaterThan(55500000)
      })
  })
})
