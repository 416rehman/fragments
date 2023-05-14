# Fragments

Entrypoint is `src/server.js` which uses `stoppable` to create an instance of Express, defined in `src/app.js`. `src/logger.js` is a wrapper around `pino` to provide a logger instance. 

## How to use
To install the dependencies, run the following command:
```bash
npm install
```

To run in development mode, run the following command:
```bash
npm run dev
```

To run in debug mode, run the following command:
```bash
npm run debug
```

