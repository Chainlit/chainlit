# Contribute to Chainlit

To contribute to Chainlit, you first need to set up the project on your local machine.

## Table of Contents

<!--
Generated using https://ecotrust-canada.github.io/markdown-toc/.
I've copy/pasted the whole document there, and then formatted it with prettier.
-->

- [Contribute to Chainlit](#contribute-to-chainlit)
  - [Table of Contents](#table-of-contents)
  - [Local setup](#local-setup)
    - [Requirements](#requirements)
    - [Set up the repo](#set-up-the-repo)
    - [Install dependencies](#install-dependencies)
    - [Build Frontend](#build-frontend)
  - [Start the Chainlit server from source](#start-the-chainlit-server-from-source)
  - [Start the UI from source](#start-the-ui-from-source)
  - [Run the tests](#run-the-tests)
    - [Backend unit tests](#backend-unit-tests)
    - [E2E tests](#e2e-tests)
    - [Headed/debugging](#headeddebugging)

## Local setup

### Requirements

1. Python >= `3.10`
2. uv ([See how to install](https://docs.astral.sh/uv/getting-started/installation/))
3. NodeJS >= `24` ([See how to install](https://nodejs.org/en/download))
4. Pnpm ([See how to install](https://pnpm.io/installation))

> **Note**
> If you are on windows, some pnpm commands like `pnpm run formatPython` won't work. You can fix this by changing the pnpm script-shell to bash: `pnpm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"` (default x64 install location, [Info](https://pnpm.io/cli/run#script-shell))

### Set up the repo

With this setup you can easily code in your fork and fetch updates from the main repository.

1. Go to [https://github.com/Chainlit/chainlit/fork](https://github.com/Chainlit/chainlit/fork) to fork the chainlit code into your own repository.
2. Clone your fork locally

```sh
git clone https://github.com/YOUR_USERNAME/YOUR_FORK.git
```

3. Go into your fork and list the current configured remote repository.

```sh
$ git remote -v
> origin  https://github.com/YOUR_USERNAME/YOUR_FORK.git (fetch)
> origin  https://github.com/YOUR_USERNAME/YOUR_FORK.git (push)
```

4. Specify the new remote upstream repository that will be synced with the fork.

```sh
git remote add upstream https://github.com/Chainlit/chainlit.git
```

5. Verify the new upstream repository you've specified for your fork.

```sh
$ git remote -v
> origin    https://github.com/YOUR_USERNAME/YOUR_FORK.git (fetch)
> origin    https://github.com/YOUR_USERNAME/YOUR_FORK.git (push)
> upstream  https://github.com/Chainlit/chainlit.git (fetch)
> upstream  https://github.com/Chainlit/chainlit.git (push)
```

### Install dependencies

The following command will install Python dependencies, Node (pnpm) dependencies and build the frontend.

```sh
cd backend
uv sync --extra tests --extra mypy --extra dev --extra custom-data
```

### Build Frontend

The following will build the frontend distributions locally. From the root of the repo:

```sh
pnpm run buildUi
```

## Start the Chainlit server from source

Start by running `backend/hello.py` as an example.

```sh
cd backend
uv run chainlit run chainlit/hello.py
```

You should now be able to access the Chainlit app you just launched on `http://127.0.0.1:8000`.

If you've made it this far, you can now replace `chainlit/hello.py` by your own target. 😎

## Start the UI from source

First, you will have to start the server either [from source](#start-the-chainlit-server-from-source) or with `chainlit run...`. Since we are starting the UI from source, you can start the server with the `-h` (headless) option.

Then, start the UI.

```sh
cd frontend
pnpm run dev
```

If you visit `http://localhost:5173/`, it should connect to your local server. If the local server is not running, it should say that it can't connect to the server.

## Run the tests

### Backend unit tests

This will run the backend's unit tests.

```sh
cd backend
uv run pytest --cov=chainlit
```

### E2E tests

You may need additional configuration or dependency installation to run Cypress. See the [Cypress system requirements](https://docs.cypress.io/app/get-started/install-cypress#System-requirements) for details.

This will run end to end tests, assessing both the frontend, the backend and their interaction. First install cypress with `pnpm exec cypress install`, and then run:

```sh
// from root
pnpm test // will do cypress run
pnpm test -- --spec cypress/e2e/copilot // will run single test with the name copilot
pnpm test -- --spec "cypress/e2e/copilot,cypress/e2e/data_layer" // will run two tests with the names copilot and data_layer
pnpm test -- --spec "cypress/e2e/**/async-*" // will run all async tests
pnpm test -- --spec "cypress/e2e/**/sync-*" // will run all sync tests
pnpm test -- --spec "cypress/e2e/**/spec.cy.ts" // will run all usual tests
```

(Go grab a cup of something, this will take a while.)

For debugging purposes, you can use the **interactive mode** (Cypress UI). Run:

```
pnpm test:interactive // runs `cypress open`
```

Once you create a pull request, the tests will automatically run. It is a good practice to run the tests locally before pushing.

Make sure to run `uv sync` again whenever you've updated the frontend!

### Headed/debugging

Causes the Electron browser to be shown on screen and keeps it open after tests are done.
Extremely useful for debugging!

```sh
SINGLE_TEST=password_auth CYPRESS_OPTIONS='--headed --no-exit' pnpm test
```