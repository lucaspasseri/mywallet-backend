import "./setup.js";
import app from "./app.js";

// eslint-disable-next-line no-undef
const port = process.env.PORT;

app.listen(4000, () => {
	console.log(`Running on port ${port}...`);
});