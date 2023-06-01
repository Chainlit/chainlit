# Changelog

All notable changes to Chainlit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- `AskFileMessage`'s accept parameter can now can take a Dict to allow more fine grained rules. More infos here https://react-dropzone.org/#!/Accepting%20specific%20file%20types.

## [0.2.109] - 2023-05-31

### Added

- URL preview for social media share

### Fixed

- `max_http_buffer_size` is now set to 100mb, fixing the `max_size_mb` parameter of `AskFileMessage`

## [0.2.108] - 2023-05-30

### Fixed

- Enhanced security
- Global element display
- Display elements with display `page` based on their ids instead of their names

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