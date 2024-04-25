# Contribute to Chainlit

To contribute to Chainlit, you first need to setup the project on your local machine.

## Table of Contents

<!--
Generated using https://ecotrust-canada.github.io/markdown-toc/.
I've copy/pasted the whole document there, without the previous two headings.
-->

- [Contribute to Chainlit](#contribute-to-chainlit)
  - [Table of Contents](#table-of-contents)
  - [Local setup](#local-setup)
    - [Requirements](#requirements)
    - [Setup the repo](#setup-the-repo)
    - [Install JS dependencies](#install-js-dependencies)
    - [Install python dependencies](#install-python-dependencies)
  - [Start the Chainlit server from source](#start-the-chainlit-server-from-source)
  - [Start the UI from source](#start-the-ui-from-source)
  - [Run the tests](#run-the-tests)
    - [Run one test](#run-one-test)

## Local setup

### Requirements

1. Python >= `3.8`
2. Poetry ([See how to install](https://python-poetry.org/docs/#installation))
3. NodeJS >= `16` ([See how to install](https://nodejs.org/en/download))
4. Pnpm ([See how to install](https://pnpm.io/installation))

> **Note**
> If you are on windows, some pnpm commands like `pnpm run formatPython` won't work. You can fix this by changing the pnpm script-shell to bash: `pnpm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"` (default x64 install location, [Info](https://pnpm.io/cli/run#script-shell))

### Setup the repo

With this setup you can easily code in your fork and fetch updates from the main repository.

1. Go to https://github.com/Chainlit/chainlit/fork to fork the chainlit code into your own repository.
2. Clone your fork locally

```sh
$ git clone https://github.com/YOUR_USERNAME/YOUR_FORK.git
```

3. Go into your fork and list the current configured remote repository.

```sh
$ git remote -v
> origin  https://github.com/YOUR_USERNAME/YOUR_FORK.git (fetch)
> origin  https://github.com/YOUR_USERNAME/YOUR_FORK.git (push)
```

4. Specify the new remote upstream repository that will be synced with the fork.

```sh
$ git remote add upstream https://github.com/Chainlit/chainlit.git
```

5. Verify the new upstream repository you've specified for your fork.

```sh
$ git remote -v
> origin    https://github.com/YOUR_USERNAME/YOUR_FORK.git (fetch)
> origin    https://github.com/YOUR_USERNAME/YOUR_FORK.git (push)
> upstream  https://github.com/Chainlit/chainlit.git (fetch)
> upstream  https://github.com/Chainlit/chainlit.git (push)
```

### Install JS dependencies

```sh
pnpm install
```

### Install python dependencies

```sh
cd backend
poetry install --with tests --with mypy
```

Make sure you have the Python code formatters `black` and `isort` installed as they are used in a pre-commit hook. Run `pip install black isort` if needed.

## Start the Chainlit server from source

You need to build the UI once before starting the server.

```sh
pnpm run buildUi
```

Start by running `backend/hello.py` as an example.

```sh
cd backend
poetry shell
chainlit run chainlit/hello.py
```

You should now be able to access the Chainlit app you just launched on `http://127.0.0.1:8000`.

If you've made it this far, you can now replace `chainlit/hello.py` by your own target. 😎

## Start the UI from source

First, you will have to start the server either [from source](#start-the-chainlit-server-from-source) or with `chainlit run... `. Since we are starting the UI from source, you can start the server with the `-h` (headless) option.

Then, start the UI.

```sh
cd frontend
pnpm run dev --port 5174
```

If you visit `http://127.0.0.1:5174/`, it should connect to your local server. If the local server is not running, it should say that it can't connect to the server.

## Run the tests

Run `pnpm test`

Once you create a pull request, the tests will automatically run. It is a good practice to run the tests locally before pushing.

You will need to rebuild the UI if you updated it between test runs.

```sh
pnpm run buildUi
```

### Run one test

1. Find the folder containing the e2e test that you're looking for in `cypress/e2e`.
2. Run `SINGLE_TEST=FOLDER pnpm test` and change FOLDER with the folder from the previous step (example: `SINGLE_TEST=scoped_elements pnpm run test`).
