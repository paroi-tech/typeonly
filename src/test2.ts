type Color = "red" | "blue"
const colors = ["red", "blue"]

const data = JSON.parse(`{"col": "red"}`)

if (!colors.includes(data.col))
  throw new Error(`Invalid color: ${data.col}`)

const color: Color = data.col

const processors = {
  red() {
    console.log("c'est rouge")
  },
  blue() {
    console.log("c'est bleu")
  }
}

processors[color]()

console.log(color)

export { }