import {expect} from "chai"

import {replace_placeholders} from "core/util/templating"

import {ColumnDataSource} from "models/sources/column_data_source"
import {CustomJSHover} from "models/tools/inspectors/customjs_hover"

describe("templating module", () => {

  describe("replace_placeholders", () => {

    const source = new ColumnDataSource({data: {foo: [10, 1.002], bar: ["a", "<div>b</div>"], baz: [1492890671885, 1290460671885]}})

    it("should replace unknown field names with ???", () => {
      const s = replace_placeholders("stuff @junk", source, 0)
      expect(s).to.be.equal("stuff ???")
    })

    it("should replace field names with escaped values by default", () => {
      let s = replace_placeholders("stuff @foo", source, 0)
      expect(s).to.be.equal("stuff 10")

      s = replace_placeholders("stuff @foo", source, 1)
      expect(s).to.be.equal("stuff 1.002")

      s = replace_placeholders("stuff @bar", source, 0)
      expect(s).to.be.equal("stuff a")

      s = replace_placeholders("stuff @bar", source, 1)
      expect(s).to.be.equal("stuff &lt;div&gt;b&lt;/div&gt;")
    })

    it("should replace field names with values as-is with safe format", () => {
      let s = replace_placeholders("stuff @foo{safe}", source, 0)
      expect(s).to.be.equal("stuff 10")

      s = replace_placeholders("stuff @foo{safe}", source, 1)
      expect(s).to.be.equal("stuff 1.002")

      s = replace_placeholders("stuff @bar{safe}", source, 0)
      expect(s).to.be.equal("stuff a")

      s = replace_placeholders("stuff @bar{safe}", source, 1)
      expect(s).to.be.equal("stuff <div>b</div>")
    })

    it("should ignore extra/unused formatters", () => {
      let s = replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {"quux": "numeral"})
      expect(s).to.be.equal("stuff 1000.000 %")

      s = replace_placeholders("stuff @foo{(0.000 %)}", source, 1, {"quux": "numeral"})
      expect(s).to.be.equal("stuff 100.200 %")
    })

    it("should throw an error on unrecognized formatters", () => {
      const fn = () => replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {"foo": "junk"} as any)
      expect(fn).to.throw(Error)
    })

    it("should default to numeral formatter", () => {
      // just picking a random and uniquely numbro format to test with
      let s = replace_placeholders("stuff @foo{(0.000 %)}", source, 0)
      expect(s).to.be.equal("stuff 1000.000 %")

      s = replace_placeholders("stuff @foo{(0.000 %)}", source, 1)
      expect(s).to.be.equal("stuff 100.200 %")
    })

    it("should use the numeral formatter if specified", () => {
      // just picking a random and uniquely numbro format to test with
      let s = replace_placeholders("stuff @foo{(0.000 %)}", source, 0, {"foo": "numeral"})
      expect(s).to.be.equal("stuff 1000.000 %")

      s = replace_placeholders("stuff @foo{(0.000 %)}", source, 1, {"foo": "numeral"})
      expect(s).to.be.equal("stuff 100.200 %")
    })

    it("should use a customjs hover formatter if specified", () => {
      const custom = new CustomJSHover({code:"return format + ' ' + special_vars.special + ' ' + value"})
      const s = replace_placeholders("stuff @foo{custom}", source, 0, {"foo": custom}, {special: "vars"})
      expect(s).to.be.equal("stuff custom vars 10")
    })

    it("should replace field names with tz formatted values with datetime formatter", () => {
      // just picking a random and uniquely tz format to test with
      let s = replace_placeholders("stuff @baz{%F %T}", source, 0, {"baz": "datetime"})
      expect(s).to.be.equal("stuff 2017-04-22 19:51:11")

      s = replace_placeholders("stuff @baz{%F %T}", source, 1, {"baz": "datetime"})
      expect(s).to.be.equal("stuff 2010-11-22 21:17:51")
    })

    it("should replace field names with Sprintf formatted values with printf formatter", () => {
      // just picking a random and uniquely Sprintf formats to test with
      let s = replace_placeholders("stuff @foo{%x}", source, 0, {"foo": "printf"})
      expect(s).to.be.equal("stuff a")

      s = replace_placeholders("stuff @foo{%0.4f}", source, 1, {"foo": "printf"})
      expect(s).to.be.equal("stuff 1.0020")
    })

    it("should replace special vars with supplied values", () => {
      const s = replace_placeholders("stuff $foo", source, 0, {}, {"foo": "special"})
      expect(s).to.be.equal("stuff special")
    })

    it("should replace combinations and duplicates", () => {
      const s = replace_placeholders("stuff $foo @foo @foo @foo{(0.000 %)} @baz{%F %T}", source, 0, {"baz": "datetime"}, {"foo": "special"})
      expect(s).to.be.equal("stuff special 10 10 1000.000 % 2017-04-22 19:51:11")
    })
  })
})
