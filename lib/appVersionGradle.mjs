
const g2js = require('gradle-to-js/lib/parser')
module.exports = {
    app_version: async function (path) {
        try {
            const properties = await g2js.parseFile(path)
            return properties.version
        } catch (e) {
            return null
        }
    }
}
