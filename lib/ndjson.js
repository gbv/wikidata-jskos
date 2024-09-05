import fs from "fs"

const read = (file) => {
  return fs.readFileSync(file).toString().split(/\n/).filter(s => s).map(JSON.parse)
}

const write = (data, file) => {
  const stream = file ? fs.createWriteStream(file) : process.stdout
  const objects = Array.isArray(data) ? data : [data]
  objects.forEach(obj => stream.write(JSON.stringify(obj) + "\n"))
}

export {
  read,
  write,
}
