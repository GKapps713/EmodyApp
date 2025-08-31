// import app from "./app.js";

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`🚀 Emody server running on http://localhost:${PORT}`);
// });

import app from "./app.js";

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`✅ Emody server running on port ${port}`);
});
