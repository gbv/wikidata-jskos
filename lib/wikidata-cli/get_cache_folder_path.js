const fs = require("./fs")
const cacheFolder = require("./get_folder_path")("cache", "cache")

module.exports = function (subfolder) {
  const subfolderPath = `${cacheFolder}/${subfolder}`
  return fs.exists(subfolderPath)
    .catch(function (err) {
      if (err.code === "ENOENT") {
        return fs.createFolder(subfolderPath)
      } else {
        throw err
      }
    })
    .then(() => subfolderPath)
}
