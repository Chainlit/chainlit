# Changelog

All notable changes to Chainlit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

Nothing unreleased yet!

## [0.4.0] - 2023-06-16

### Added

- Pyplot chart element
- Config option `default_expand_messages` to enable the default expand message settings by default in the UI (breaking change)

### Fixed

- Scoped elements sharing names are now correctly displayed
- Clickable Element refs are now correctly displayed, even if another ref being a substring of it exists

## [0.3.0] - 2023-06-13

### Added

- Moving from sync to async runtime (breaking change):
  - Support async implementation (eg openai, langchain)
  - Performance improvements
  - Removed patching of different libraries
- Elements:
  - Merged LocalImage and RemoteImage to Image (breaking change)
  - New Avatar element to display avatars in messages
- AskFileMessage now supports multi file uploads (small breaking change)
- New settings interface including a new "Expand all" messages setting
- The element sidebar is resizable

### Fixed

- Secure origin issues when running on HTTP
- Updated the callback handler to langchain 0.0.198 latest changes
- Filewatcher issues
- Blank screen issues
- Port option in the CLI does not fail anymore because of os import

## [0.2.111] - 2023-06-09

### Fixed

- Pdf element reloading issue
- CI is more stable

## [0.2.110] - 2023-06-08

### Added

- `AskFileMessage`'s accept parameter can now can take a Dict to allow more fine grained rules. More infos here https://react-dropzone.org/#!/Accepting%20specific%20file%20types.
- The PDF viewer element helps you display local or remote PDF files ([documentation](https://docs.chainlit.io/api-reference/elements/pdf-viewer)).

### Fixed

- When running the tests, the chainlit cli is installed is installed in editable mode to run faster.

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
- `cl.send_message(...)` becomes `cl.Message(...).send()`
- `cl.send_ask_user(...)` becomes `cl.AskUserMessage(...).send()`
- `cl.send_ask_file(...)` becomes `cl.AskFileMessage(...).send()`
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
