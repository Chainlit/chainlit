# Changelog

All notable changes to Chainlit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

Nothing unreleased yet.

## [0.2.107] - 2023-05-28

### Added

- Rework of the Message, AskUserMessage and AskFileMessage APIs:
    -`cl.send_message(...)` becomes `cl.Message(...).send()`
    -`cl.send_ask_user(...)` becomes `cl.AskUserMessage(...).send()`
    -`cl.send_ask_file(...)` becomes `cl.AskFileMessage(...).send()`
- `update` and `remove` methods to the `cl.Message` class

### Fixed

- Blank screen for windows users (https://github.com/Chainlit/chainlit/issues/3)
- Header navigation for mobile (https://github.com/Chainlit/chainlit/issues/12)

## [0.2.106] - 2023-05-26

### Added

- Starting to log changes in CHANGELOG.md
- Port and hostname are now configurable through the `CHAINLIT_HOST` and `CHAINLIT_PORT` env variables. You can also use `--host` and `--port` when running `chainlit run ...`.
- A label attribute to Actions to facilitate localization.

### Fixed

- Clicks on inlined `RemoteImage` now opens the image in a NEW tab.