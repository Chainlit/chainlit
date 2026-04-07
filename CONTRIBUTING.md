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
  - [Start the Chainlit server from source](#start-the-chainlit-server-from-source)
  - [Start the UI from source](#start-the-ui-from-source)
  - [Lint \& Format](#lint--format)
  - [Run the tests](#run-the-tests)
    - [Backend unit tests](#backend-unit-tests)
    - [Frontend unit tests](#frontend-unit-tests)
    - [E2E tests](#e2e-tests)

## Local setup

### Requirements

1. Python >= `3.10`
2. uv ([See how to install](https://docs.astral.sh/uv/getting-started/installation/))
3. NodeJS >= `24` ([See how to install](https://nodejs.org/en/download))
4. Pnpm ([See how to install](https://pnpm.io/installation))

> **Note**
> If you are on Windows, some pnpm commands won't work out of the box. You can fix this by changing the pnpm script-shell to bash: `pnpm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"` (default x64 install location, [Info](https://pnpm.io/cli/run#script-shell))

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
uv sync --all-packages --all-extras --dev
```

## Start the Chainlit server from source

Start by running `backend/chainlit/sample/hello.py` as an example.

```sh
cd backend
uv run chainlit run chainlit/sample/hello.py
```

You should now be able to access the Chainlit app you just launched on `http://127.0.0.1:8000`.

If you've made it this far, you can now replace `chainlit/sample/hello.py` by your own target. 😎

## Start the UI from source

First, you will have to start the server either [from source](#start-the-chainlit-server-from-source) or with `chainlit run...`. Since we are starting the UI from source, you can start the server with the `-h` (headless) option.

Then, start the UI.

```sh
cd frontend
pnpm run dev
```

If you visit `http://localhost:5173/`, it should connect to your local server. If the local server is not running, it should say that it can't connect to the server.

## Lint & Format

Linting and formatting run from the **repo root** (not from individual packages). This ensures CI, lint-staged, and local commands all use the same tool invocation.

```sh
# Lint (CI uses this)
pnpm lint

# Lint and auto-fix
pnpm lint:fix

# Check formatting (CI uses this)
pnpm format-check

# Fix formatting
pnpm format

# Type check (TypeScript)
pnpm type-check

# Scope to specific files or directories
pnpm lint frontend/src/App.tsx
pnpm lint:fix frontend/
pnpm format-check:files frontend/
pnpm format:files frontend/src/App.tsx

# Python (wrapper scripts for linting, formatting, and type checking)
uv run scripts/lint.py                              # lint all
uv run scripts/lint.py backend/chainlit/server.py   # lint single file
uv run scripts/lint.py --fix                        # automatically fix linting issues
uv run scripts/format.py                            # format all
uv run scripts/format.py backend/chainlit/server.py # format single file
uv run scripts/format.py --check                    # check formatting
uv run scripts/type_check.py                        # check types (whole project, no per-file mode)
```

> **Note**
> Linting and formatting scripts are defined only at the workspace root. Running `pnpm lint` from a sub-package directory won't work — always run from the repo root, passing a path argument to scope: `pnpm lint frontend/`.

## Run the tests

### Backend unit tests

This will run the backend's unit tests.

```sh
cd backend
uv run pytest --cov=chainlit
```

### Frontend unit tests

This will run the frontend's unit tests.

```
pnpm test
```

### E2E tests

You may need additional configuration or dependency installation to run Cypress. See the [Cypress system requirements](https://docs.cypress.io/app/get-started/install-cypress#System-requirements) for details.

This will run end to end tests, assessing both the frontend, the backend and their interaction. First install cypress with `pnpm exec cypress install`, and then run:

```sh
// from root
pnpm test:e2e // will do cypress run
pnpm test:e2e --spec cypress/e2e/copilot // will run single test with the name copilot
pnpm test:e2e --spec "cypress/e2e/copilot,cypress/e2e/data_layer" // will run two tests with the names copilot and data_layer
pnpm test:e2e --spec "cypress/e2e/**/async-*" // will run all async tests
pnpm test:e2e --spec "cypress/e2e/**/sync-*" // will run all sync tests
pnpm test:e2e --spec "cypress/e2e/**/spec.cy.ts" // will run all usual tests
```

(Go grab a cup of something, this will take a while.)

For debugging purposes, you can use the **interactive mode** (Cypress UI). Run:

```
pnpm test:e2e:interactive // runs `cypress open`
```

Once you create a pull request, the tests will automatically run. It is a good practice to run the tests locally before pushing.
