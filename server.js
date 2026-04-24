const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

app.post("/bfhl", (req, res) => {
  const data = Array.isArray(req.body?.data) ? req.body.data : []
  const invalid = []
  const valid = []

  for (let raw of data) {
    const str = raw.trim()

    if (!/^[A-Z]->[A-Z]$/.test(str)) {
      invalid.push(raw)
      continue
    }

    const [p, c] = str.split("->")

    if (p === c) {
      invalid.push(raw)
      continue
    }

    valid.push(str)
  }

  const seen = new Set()
  const duplicates = []
  const unique = []

  for (let edge of valid) {
    if (seen.has(edge)) {
      if (!duplicates.includes(edge)) duplicates.push(edge)
    } else {
      seen.add(edge)
      unique.push(edge)
    }
  }

  const adj = {}
  const childSet = new Set()
  const parentUsed = {}

  for (let edge of unique) {
    const [p, c] = edge.split("->")

    if (parentUsed[c]) continue
    parentUsed[c] = true

    if (!adj[p]) adj[p] = []
    adj[p].push(c)

    childSet.add(c)
  }

  res.json({
    message: "API working",
    data,
    valid,
    unique,
    duplicates,
    invalid_entries: invalid,
    adj,
    child_set: [...childSet],
    parent_used: parentUsed,
  })
})

app.listen(3000, () => console.log("Server running on 3000"))