# Contribute to Chainlit
To contribute to Chainlit, you first need to setup the project on your local machine.

## Local setup

### Requirements

1. Python >= `3.8` 
2. Poetry ([See how to install](https://python-poetry.org/docs/#installation))
3. NodeJS >= `16` ([See how to install](https://nodejs.org/en/download))


### Clone the repo

```sh
git clone https://github.com/Chainlit/chainlit.git
cd chainlit
```

### Install JS dependencies

```sh
npm install
npm run installUiDeps
```

### Install python env

```sh
cd src
poetry install
```

Make sure you have the Python code formatter `black` installed as it is used in a pre-commit hook. Run `pip install black` if needed.

## Setup the UI

The source code of the UI is in [src/chainlit/frontend](/src/chainlit/frontend).

Before anything, go to [src/chainlit/frontend/src/api/index.ts](/src/chainlit/frontend/src/api/index.ts). Find the definition of `const server` and inverse the comment:

```ts
export const server = 'http://127.0.0.1:8000';
// export const server = '';
```

Don't forget to revert that change before pushing.

### Start the UI

```sh
cd src/chainlit/frontend
npm run buildUi
npm run dev -- --port 5174
```

The `buildUi` step is currently needed by the server.

If you visit `http://127.0.0.1:5174/`, it should say that it can't connect to the server.
## Setup the server

### Install from local sources

```sh
pip install -e PATH_TO_CHAINLIT_REPO/src
```

This installs your project in editable mode, which means you only need to do this once.

### Start the server

```sh
chainlit run target.py -h
```

The `-h` parameter (headless) means the UI will not automatically open.

## Run the tests

1. Create an `.env` file at the root of the repo following the model of `.env.example`
2. Run `npm test`

Once you create a pull request, the tests will automatically run. It is a good practice to run the tests locally before pushing.

## Only contribute to one side of the project

This is the easiest solution if you want to only make a change in the UI or the server.

Start with following the steps from the [Local setup](#local-setup).

### Only contribute to frontend

1. Follow the steps from [Setup the UI](#setup-the-ui).
2. Change the server configuration in [src/chainlit/frontend/src/api/index.ts](/src/chainlit/frontend/src/api/index.ts) to match your target chainlit server. 

```js
export const server = 'https://img-gen.chainlit.app/';
```
3. Follow the steps from [Start the UI](#start-the-ui).

### Only contribute to the server

1. Build the UI.

```sh
cd src/chainlit/frontend
npm run buildUi
```

2. Follow the instruction from [Install from local sources](#install-from-local-sources).

3. Run the server without the `-h` flag.

```sh
chainlit run target.py
```

4. Any time you've made a change, restart the server from the previous step.