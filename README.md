# BFHL Node Hierarchy Visualizer

A full-stack application for parsing directed edges, detecting cycles, and visualizing tree hierarchies. Built with a Node.js/Express backend and an interactive, clean Vanilla JS frontend.

## Features

- **Directed Edges Parsing**: Upload or input directed edges (e.g., `A->B`) for processing.
- **Tree Hierarchy Building**: Parses the provided nodes and builds structured tree hierarchies with depth analysis.
- **Cycle Detection**: Robust cyclic dependency detection ensuring infinite loops are caught (e.g., `X->Y`, `Y->Z`, `Z->X`).
- **Validation Validation**: Tracks isolated duplicate entries and gracefully filters invalid raw values.
- **Rich Visualization**: Provides an interactive browser UI showing depth metrics, tree mapping, cycle warnings, and raw JSON toggle.

## Technologies Used

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3 (Glassmorphism & Custom Properties), Vanilla JavaScript
- **API Spec Core:** JSON payload structured interactions

## Project Structure

```bash
bfhl-project/
├── api/             # Vercel Serverless Function entry point
│   └── index.js
├── public/          # Static Frontend Assets
│   ├── index.html   # Main UI
│   ├── app.js       # Client-side API fetching & visualization logic
│   └── styles.css   # Styling 
├── server.js        # Main Express logic (POST /bfhl and logic routes)
├── package.json     # Node Dependencies
└── vercel.json      # Vercel hosting routing config
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository** (if applicable) or navigate to the directory:
   ```bash
   cd bfhl-project
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run the local development server:**
   ```bash
   npm start
   # or
   npm run dev
   ```

   The server will start locally (typically at `http://localhost:3000`), serving the frontend alongside the API.

## API Documentation

### POST `/bfhl`
Processes the directed edges.

**Request Body:**
```json
{
  "data": [
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "P->Q", "Q->R",
    "G->H", "G->H", "G->I",
    "hello", "1->2", "A->"
  ]
}
```

**Response Payload:**
```json
{
  "user_id": "johndoe_17091999",
  "email_id": "john.doe@college.edu",
  "college_roll_number": "21CS1001",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": { "E": { "F": {} } } } },
      "depth": 4
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    }
  ],
  "invalid_entries": ["hello", "1->2", "A->"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 3,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

## Deployment

This app includes a `vercel.json` config designed to deploy seamlessly to [Vercel](https://vercel.com).
- Vercel automatically maps the `api/index.js` to `/api/*` logic via rewrites to route logic as Serverless Functions.
- Your `public/` folder will be served automatically.
