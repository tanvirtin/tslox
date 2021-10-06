test:
	deno test

compile:
	deno compile --allow-all --output ./bin/tin src/index.ts

fmt:
	deno fmt .