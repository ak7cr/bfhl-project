const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))

app.post("/bfhl", (req, res) => {
  const data = Array.isArray(req.body?.data) ? req.body.data : []
  const invalid = []
  const valid = []

  for (let raw of data) {
    if (typeof raw !== "string") {
      invalid.push(raw)
      continue
    }

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

  const nodes = new Set([...Object.keys(adj), ...childSet])
  let roots = [...nodes].filter((n) => !childSet.has(n))

  if (roots.length === 0 && nodes.size > 0) {
    roots = [Array.from(nodes).sort()[0]]
  }

  function dfs(node, visiting) {
    if (visiting.has(node)) return { cycle: true }
    visiting.add(node)

    const children = adj[node] || []
    const tree = {}
    let maxDepth = 0

    for (const c of children) {
      const res = dfs(c, new Set(visiting))
      if (res.cycle) return { cycle: true }

      tree[c] = res.tree
      maxDepth = Math.max(maxDepth, res.depth)
    }

    return {
      tree,
      depth: 1 + maxDepth,
    }
  }

  const hierarchies = []
  let totalTrees = 0
  let totalCycles = 0
  let bestRoot = ""
  let bestDepth = 0

  for (const r of roots) {
    const res = dfs(r, new Set())

    if (res.cycle) {
      totalCycles++
      hierarchies.push({
        root: r,
        tree: {},
        has_cycle: true,
      })
      continue
    }

    totalTrees++
    hierarchies.push({
      root: r,
      tree: { [r]: res.tree },
      depth: res.depth,
    })

    if (res.depth > bestDepth || (res.depth === bestDepth && r < bestRoot)) {
      bestDepth = res.depth
      bestRoot = r
    }
  }

  res.json({
    user_id: "yourname_ddmmyyyy",
    email_id: "your_email",
    college_roll_number: "your_roll",
    hierarchies,
    invalid_entries: invalid,
    duplicate_edges: duplicates,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: bestRoot,
    },
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on ${PORT}`))