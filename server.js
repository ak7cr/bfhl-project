const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


app.post("/bfhl", (req, res) => {
  const data = Array.isArray(req.body?.data) ? req.body.data : [];

  const invalidEntries = [];
  const validEdges = [];

  for (const raw of data) {
    if (typeof raw !== "string") {
      invalidEntries.push(String(raw));
      continue;
    }

    const trimmed = raw.trim();


    if (!/^[A-Z]->[A-Z]$/.test(trimmed)) {
      invalidEntries.push(raw);
      continue;
    }

    const [parent, child] = trimmed.split("->");


    if (parent === child) {
      invalidEntries.push(raw);
      continue;
    }

    validEdges.push(trimmed);
  }


  const seenEdges = new Set();
  const duplicateEdgesSet = new Set();
  const uniqueEdges = [];

  for (const edge of validEdges) {
    if (seenEdges.has(edge)) {
      duplicateEdgesSet.add(edge);
    } else {
      seenEdges.add(edge);
      uniqueEdges.push(edge);
    }
  }

  const duplicateEdges = [...duplicateEdgesSet];


  const adj = {};
  const undirected = {};
  const childSet = new Set();
  const allNodes = new Set();
  const nodeInsertionOrder = new Map();
  let orderIdx = 0;

  for (const edge of uniqueEdges) {
    const [p, c] = edge.split("->");

    if (!nodeInsertionOrder.has(p)) nodeInsertionOrder.set(p, orderIdx++);
    if (!nodeInsertionOrder.has(c)) nodeInsertionOrder.set(c, orderIdx++);


    if (childSet.has(c)) continue;
    childSet.add(c);

    if (!adj[p]) adj[p] = [];
    adj[p].push(c);

    if (!undirected[p]) undirected[p] = new Set();
    if (!undirected[c]) undirected[c] = new Set();
    undirected[p].add(c);
    undirected[c].add(p);

    allNodes.add(p);
    allNodes.add(c);
  }


  const visited = new Set();
  const components = [];
  const orderedNodes = [...allNodes].sort(
    (a, b) => nodeInsertionOrder.get(a) - nodeInsertionOrder.get(b)
  );

  for (const start of orderedNodes) {
    if (visited.has(start)) continue;

    const queue = [start];
    visited.add(start);
    const comp = [];

    while (queue.length) {
      const cur = queue.shift();
      comp.push(cur);
      for (const nb of undirected[cur] || []) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }

    components.push(comp);
  }

  function detectCycle(nodes) {
    const inComp = new Set(nodes);
    const state = {};

    function dfs(node) {
      if (state[node] === 1) return true;
      if (state[node] === 2) return false;
      state[node] = 1;
      for (const child of adj[node] || []) {
        if (inComp.has(child) && dfs(child)) return true;
      }
      state[node] = 2;
      return false;
    }

    for (const n of nodes) {
      if (dfs(n)) return true;
    }
    return false;
  }


  function buildTree(node, inComp) {
    const children = (adj[node] || []).filter((c) => inComp.has(c));
    const subtree = {};
    let maxChildDepth = 0;

    for (const c of children) {
      const result = buildTree(c, inComp);
      subtree[c] = result.tree;
      maxChildDepth = Math.max(maxChildDepth, result.depth);
    }

    return { tree: subtree, depth: 1 + maxChildDepth };
  }


  const hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let bestRoot = "";
  let bestDepth = 0;

  for (const comp of components) {
    const inComp = new Set(comp);


    const roots = comp.filter((n) => !childSet.has(n)).sort();
    const root = roots.length > 0 ? roots[0] : [...comp].sort()[0];

    if (detectCycle(comp)) {
      totalCycles++;
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      totalTrees++;
      const built = buildTree(root, inComp);
      hierarchies.push({ root, tree: { [root]: built.tree }, depth: built.depth });

      if (
        built.depth > bestDepth ||
        (built.depth === bestDepth && (bestRoot === "" || root < bestRoot))
      ) {
        bestDepth = built.depth;
        bestRoot = root;
      }
    }
  }

  res.json({
    user_id: process.env.USER_ID || "johndoe_17091999",
    email_id: process.env.EMAIL_ID || "john.doe@college.edu",
    college_roll_number: process.env.COLLEGE_ROLL_NUMBER || "21CS1001",
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: bestRoot,
    },
  });
});

// Export for Vercel serverless
module.exports = app;

// Start server for local dev / Render / Railway
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}