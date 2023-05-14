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

## Contribute to the UI

The source code of the UI is in [src/chainlit/frontend](src/chainlit/frontend).

Before anything, go to [src/chainlit/frontend/api/index.ts](src/chainlit/frontend/api/index.ts). Find the definition of `const server` and inverse the comment:

```ts
// export const server = 'http://127.0.0.1:8000';
export const server = '';
```

Don't forget to revert that change before pushing.

### Start the UI

```sh
cd src/chainlit/frontend
npm run dev -- --port 5174
```

If you visit `http://127.0.0.1:5174/`, it should say that it can't connect to the server.

### Start the server
- If you only wish to contribute to the UI, you can use any Chainlit installation
- If your contribution impacts both the UI and the Python package, you need to start the server from your [local installation](#contribute-to-the-python-package)

Starting the chainlit server in headless mode (since we manually started the UI)
```sh
chainlit run target.py -h
```

## Contribute to the Python package

- If you only wish to contribute to the Python package, run:
```sh
npm run buildUi
```

- If your contribution impacts both the Python package and the UI, check the section above

### Install from local sources

```sh
pip install PATH_TO_CHAINLIT_REPO/src
```

You need to repeat that step everytime you make a change in the Python codebase

### Start the server

```sh
chainlit run target.py [-h]
```

The `-h` parameter (headless) means the UI will not automatically open. Only use this if you are already running the UI yourself.

## Run the tests

1. Create an `.env` file at the root of the repo following the model of `.env.example`
2. Run `npm test`

Once you create a pull request, the tests will automatically run. It is a good practice to run the tests locally before pushing.
 



