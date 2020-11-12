const xml2js = require('xml2js')
const fs = require('fs')
const parser = new xml2js.Parser({ attrkey: "ATTR" })

module.exports = {
    app_version: async function (path) {
        try {
            let xml_string = fs.readFileSync(path, "utf8")
            let version
            parser.parseString(xml_string, function (error, result) {
                if (error === null) {
                    version = result.project.version[0]
                }
            })
            return version
        } catch (e) {
            console.log(e)
            return null
        }
    }
}
