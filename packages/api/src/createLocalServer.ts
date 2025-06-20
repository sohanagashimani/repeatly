import createServer from "./createServer";

const app = createServer();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3003;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Repeatly API listening on http://localhost:${PORT}`);
});

export default app;
