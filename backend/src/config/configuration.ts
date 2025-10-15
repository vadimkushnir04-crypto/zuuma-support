export default () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  qdrant: {
    url: process.env.QDRANT_URL || "http://localhost:6333",
  },
});
