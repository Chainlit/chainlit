# Changelog

All notable changes to Chainlit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.3.2] - 2024-11-08

### Security Advisory
**IMPORTANT**:
- This release drops support for FastAPI versions before 0.115.3 and Starlette versions before 0.41.2 due to a severe security vulnerability (CVE-2024-47874). We strongly encourage all downstream dependencies to upgrade as well.
- This release still contains a known security vulnerability in the element feature that could allow unauthorized file access. We strongly recommend against using elements in production environments until a comprehensive fix is implemented in an upcoming release.

### Security
- **[breaking]** Updated dependencies to address critical issues (#1493):
  - Upgraded fastapi to 0.115.3 to address CVE-2024-47874 in Starlette
  - Upgraded starlette to 0.41.2 (required for security fix)
  - Upgraded werkzeug to 3.0.6

Note: This is a breaking change as older FastAPI versions are no longer supported.
To prioritize security, we opted to break with semver on this particular occasion.

### Fixed
- Resolved incorrect message ordering in UI (#1501)

## [2.0rc0] - 2024-11-08

### Security Advisory
**IMPORTANT**:
- The element feature currently contains a known security vulnerability that could allow unauthorized file access. We strongly recommend against using elements in production environments until a comprehensive fix is implemented in an upcoming release.

### Changed
- **[breaking]**: Completely revamped audio implementation (#1401, #1410):
  - Replaced `AudioChunk` with `InputAudioChunk` and `OutputAudioChunk`
  - Changed default audio sampling rate from 44100 to 24000
  - Removed several audio configuration options (`min_decibels`, `initial_silence_timeout`, `silence_timeout`, `chunk_duration`, `max_duration`)
  - Removed `RecordScreen` component
- Factored storage clients into separate modules (#1363)

### Added
- Realtime audio streaming and processing (#1401, #1406, #1410):
  - New `AudioPresence` component for visual representation
  - Implemented `WavRecorder` and `WavStreamPlayer` classes
  - Introduced new `on_audio_start` callback
  - Added audio interruption functionality
  - New audio connection signaling with `on` and `off` states
- Interactive DataFrame display with auto-fit content using MUI Data Grid (#1373, #1467)
- Optional websocket connection in react-client (#1379)
- Enhanced image interaction with popup view and download option (#1402)
- Current URL included in message payload (#1403)
- Allow empty chat input when submitting attachments (#1261)

### Fixes
- Various backend fixes and cleanup (#1432):
  - Use importlib.util.find_spec to check if a package is installed
  - Use `raise... from` to wrap exceptions
  - Fix error message in Discord integration
  - Several minor fixups/cleanup

### Development
- Implemented ruff for linting and formatting (#1495)
- Added mypy daemon for faster type-checking (#1495)
- Added GitHub Actions linting (#1445)
- Enabled direct installation from GitHub (#1423)
- Various build script improvements (#1462)

## [1.3.1] - 2024-10-25

### Security Advisory

- **IMPORTANT**: This release temporarily reverts the file access security improvements from 1.3.0 to restore element functionality. The element feature currently has a known security vulnerability that could allow unauthorized access to files. We strongly recommend against using elements in production environments until the next release.
- A comprehensive security fix will be implemented in an upcoming release.

### Changed

- Reverted authentication requirements for file access endpoints to restore element functionality (#1474)

### Development

- Work in progress on implementing HTTP-only cookie authentication for proper security (#1472)

## [1.3.0] - 2024-10-22

### Security

- Fixed critical endpoint security vulnerabilities (#1441)
- Enhanced authentication for file-related endpoints (#1431)
- Upgraded frontend and backend dependencies to address security issues (#1431)

### Added

- SQLite support in SQLAlchemy integration (#1319)
- Support for IETF BCP 47 language tags, enabling localized languages like es-419 (#1399)
- Environment variables `OAUTH_<PROVIDER>_PROMPT` and `OAUTH_PROMPT` to
override oauth prompt parameter. Enabling users to explicitly enable login/consent prompts for oauth, e.g. `OAUTH_PROMPT=consent` to prevent automatic re-login. (#1362, #1456).
- Added `get_element()` method to SQLAlchemyDataLayer (#1346)

### Changed

- Bumped LiteralAI dependency to version 0.0.625 (#1376)
- Optimized LiteralDataLayer for improved performance and consistency (#1376)
- Refactored context handling in SQLAlchemy data layer (#1319)
- Updated package metadata with correct authors, license, and documentation links (#1413)
- Enhanced GitHub Actions workflow with restricted permissions (#1349)

### Fixed

- Resolved dialog boxes extending beyond window bounds (#1446)
- Fixed tasklist functionality when Chainlit is submounted (#1433)
- Corrected handling of `display_name` in PersistentUser during authentication (#1425)
- Fixed SQLAlchemy identifier quoting (#1395)
- Improved spaces handling in avatar filenames (#1418)

### Development

- Implemented extensive test coverage for LiteralDataLayer and SQLAlchemyDataLayer
- Added comprehensive unit tests for file-related endpoints
- Enhanced code organization and import structure
- Improved Python code style and linting (#1353)
- Resolved various small text and documentation issues (#1347, #1348)

## [1.2.0] - 2024-09-16

### Security

- Fixed critical vulnerabilities allowing arbitrary file read access (#1326)
- Improved path traversal protection in various endpoints (#1326)

### Added

- Hebrew translation JSON (#1322)
- Translation files for Indian languages (#1321)
- Support for displaying function calls as tools in Chain of Thought for LlamaIndexCallbackHandler (#1285)
- Improved feedback UI with refined type handling (#1325)

### Changed

- Upgraded cryptography from 43.0.0 to 43.0.1 in backend dependencies (#1298)
- Improved GitHub Actions workflow (#1301)
- Enhanced data layer cleanup for better performance (#1288)
- Factored out callbacks with extensive test coverage (#1292)
- Adopted strict adherence to Semantic Versioning (SemVer)

### Fixed

- Websocket connection issues when submounting Chainlit (#1337)
- Show_input functionality on chat resume for SQLAlchemy (#1221)
- Negative feedback class incorrectness (#1332)
- Interaction issues with Chat Profile Description Popover (#1276)
- Centered steps within assistant messages (#1324)
- Minor spelling errors (#1341)

### Development

- Added documentation for release engineering process (#1293)
- Implemented testing for FastAPI version matrix (#1306)
- Removed wait statements from E2E tests for improved performance (#1270)
- Bumped dataclasses to latest version (#1291)
- Ensured environment loading before other imports (#1328)

## [1.1.404] - 2024-09-04

### Security

- **[breaking]**: Listen to 127.0.0.1 (localhost) instead on 0.0.0.0 (public) (#861).
- **[breaking]**: Dropped support for Python 3.8, solving dependency resolution, addressing vulnerable dependencies (#1192, #1236, #1250).

### Fixed

- Frontend connection resuming after connection loss (#828).
- Gracefully handle HTTP errors in data layers (#1232).
- AttributeError: 'ChatCompletionChunk' object has no attribute 'get' in llama_index (#1229).
- `edit_message` in correct place in default config, allowing users to edit messages (#1218).

### Added

- `CHAINLIT_APP_ROOT` environment variable to modify `APP_ROOT`, enabling the ability to set the location of `config.toml` and other setting files (#1259).
- Poetry lockfile in GIT repository for reproducible builds (#1191).
- pytest-based testing infrastructure, first unit tests of backend and testing on all supported Python versions (#1245 and #1271).
- Black and isort added to dev dependencies group (#1217).

## [1.1.403rc0] - 2024-08-13

### Fixed

- Langchain Callback handler IndexError
- Attempt to fix websocket issues

## [1.1.402] - 2024-08-07

### Added

- The `User` class now has a `display_name` field. It will not be persisted by the data layer.
- The logout button will now reload the page (needed for custom auth providers)

## [1.1.401] - 2024-08-02

### Changed

- Directly log step input args by name instead of wrapping them in "args" for readability.

### Fixed

- Langchain Callback handler ValueError('not enough values to unpack (expected 2, got 0)')

## [1.1.400] - 2024-07-29

### Changed

- hide_cot becomes cot and has three possible values: hidden, tool_call, full
- User feedback are now scoring an entire run instead of a specific message
- Slack/Teams/Discord DM threads are now split by day
- Slack DM now also use threads
- Avatars are always displayed at the root level of the conversation

### Removed

- disable_feedback has been removed
- root_message has been removed

## [1.1.306] - 2024-07-03

### Added

- Messages are now editable. You can disable this feature with `config.features.edit_message = false`
- `cl.chat_context` to help keeping track of the messages of the current thread
- You can now enable debug_mode when mounting Chainlit as a sub app by setting the `CHAINLIT_DEBUG` to `true`.

### Fixed

- Message are now collapsible if too long
- Only first level tool calls are displayed
- OAuth redirection when mounting Chainlit on a FastAPI app should now work
- The Langchain callback handler should better capture chain runs
- The Llama Index callback handler should now work with other decorators

## [1.1.305] - 2024-06-26

### Added

- Mistral AI instrumentation

## [1.1.304] - 2024-06-21

### Fixed

- OAuth final redirection should account for root path if provided

## [1.1.303] - 2024-06-20

### Fixed

- OAuth URL redirection should be correctly formed when using CHAINLIT_URL + submounted chainlit app

## [1.1.302] - 2024-06-16

### Added

- Width and height option for the copilot bubble

### Fixed

- Chat profile icon in copilot should load
- Theme should work with Copilot

### Removed

- Running toast when an action is running

## [1.1.301] - 2024-06-14

### Fixed

- Azure AD oauth get_user_info not implemented error

## [1.1.300] - 2024-06-13

### Added

- `@cl.set_starters` and `cl.Starter` to suggest conversation starters to the user
- Teams integration
- Expand copilot button
- Debug mode when starting with `-d`. Only available if the data layer supports it. This replaces the Prompt Playground.
- `default` theme config in `config.toml`
- If only one OAuth provider is set, automatically redirect the user to it
- Input streaming for tool calls

### Changed

- **[BREAKING]** Custom endpoints have been reworked. You should now mount your Chainlit app as a FastAPI subapp.
- **[BREAKING]** Avatars have been reworked. `cl.Avatar` has been removed, instead place your avatars by name in `/public/avatars/*`
- **[BREAKING]** The `running`, `took_one` and `took_other` translations have been replaced by `used`.
- **[BREAKING]** `root` attribute of `cl.Step` has been removed. Use `cl.Message` to send root level messages.
- Chain of Thought has been reworked. Only steps of type `tool` will be displayed if `hide_cot` is false
- The `show_readme_as_default` config has been removed
- No longer collapse root level messages
- The blue alert "Continuing chat" has been removed.

### Fix

- The Chat Profile description should now disappear when not hovered.
- Error handling of steps has been improved
- No longer stream the first token twice
- Copilot should now work as expected even if the user is closing/reopening it
- Copilot CSS should no longer leak/be impacted by the host website CSS
- Fix various `cl.Context` errors
- Reworked message padding and spacing
- Chat profile should now support non-ASCII characters (like chinese)

## [1.1.202] - 2024-05-22

### Added

- Support for video players like youtube or vimeo

### Fixed

- Fix audio capture on windows browsers

## [1.1.201] - 2024-05-21

### Fixed

- Intermediary steps button placement

## [1.1.200] - 2024-05-21

### Changed

- User message UI has been updated
- Loading indicator has been improved and visually updated
- Icons have been updated
- Dark theme is now the default

### Fixed

- Scroll issues on mobile browsers
- Github button now showing

## [1.1.101] - 2024-05-14

### Added

- The discord bot now shows "typing" while responding

### Fixed

- Discord and Slack bots should no longer fail to respond if the data layer fails

## [1.1.0] - 2024-05-13

### Added

- You can know serve your Chainlit app as a Slack bot
- You can know serve your Chainlit app as a Discord bot
- `cl.on_audio_chunk` decorator to process incoming the user incoming audio stream
- `cl.on_audio_end` decorator to react to the end of the user audio stream
- The `cl.Audio` element now has an `auto_play` property
- `layout` theme config, wide or default
- `http_referer` is now available in `cl.user_session`

### Changed

- The UI has been revamped, especially the navigation
- The arrow up button has been removed from the input bar, however pressing the arrow up key still opens the last inputs menu
- The user session will no longer be persisted as metadata if > 1mb
- **[breaking]** the `send()` method on `cl.Message` now returns the message instead of the message id
- **[breaking]** The `multi_modal` feature has been renamed `spontaneous_file_upload` in the config
- Element display property now defaults to `inline` instead of `side`
- The SQL Alchemy data layer logging has been improved

### Fixed

- Fixed a bug disconnecting the user when loading the chat history
- Elements based on an URL should now have a mime type
- Stopping a task should now work better (using asyncio task.cancel)

## [1.0.506] - 2024-04-30

### Added

- add support for multiline option in TextInput chat settings field - @kevinwmerritt

### Changed

- disable gzip middleware to prevent a compression issue on safari

### Fixed

- pasting from microsoft products generates text instead of an image
- do not prevent thread history revalidation - @kevinwmerritt
- display the label instead of the value for menu item - @kevinwmerritt

### Added

## [1.0.505] - 2024-04-23

### Added

- The user's browser language configuration is available in `cl.user_session.get("languages")`
- Allow html in text elements - @jdb78
- Allow for setting a ChatProfile default - @kevinwmerritt

### Changed

- The thread history refreshes right after a new thread is created.
- The thread auto-tagging feature is now opt-in using `auto_tag_thread` in the config.toml file

### Fixed

- Fixed incorrect step ancestor in the OpenAI instrumentation
- Enabled having a `storage_provider` set to `None` in SQLAlchemyDataLayer - @mohamedalani
- Correctly serialize `generation` in SQLAlchemyDataLayer - @mohamedalani

## [1.0.504] - 2024-04-16

### Changed

- Chainlit apps should function correctly even if the data layer is down

## [1.0.503] - 2024-04-15

### Added

- Enable persisting threads using a Custom Data Layer (through SQLAlchemy) - @hayescode

### Changed

- React-client: Expose `sessionId` in `useChatSession`
- Add chat profile as thread tag metadata

### Fixed

- Add quotes around the chainlit create-secret CLI output to avoid any issues with special characters

## [1.0.502] - 2024-04-08

### Added

- Actions now trigger conversation persistence

## [1.0.501] - 2024-04-08

### Added

- Messages and steps now accept tags and metadata (useful for the data layer)

### Changed

- The LLama Index callback handler should now show retrieved chunks in the intermadiary steps
- Renamed the Literal environment variable to `LITERAL_API_URL` (it used to be `LITERAL_SERVER`)

### Fixed

- Starting a new conversation should close the element side bar
- Resolved security issues by upgrading starlette dependency

## [1.0.500] - 2024-04-02

### Added

- Added a new command `chainlit lint-translations` to check that translations file are OK
- Added new sections to the translations, like signin page
- chainlit.md now supports translations based on the browser's language. Like chainlit_pt-BR.md
- A health check endpoint is now available through a HEAD http call at root
- You can now specify a custom frontend build path

### Fixed

- Translated will no longer flash at app load
- Llama Index callback handler has been updated
- File watcher should now properly refresh the app when the code changes
- Markdown titles should now have the correct line height

### Changed

- `multi_modal` is now under feature in the config.toml and has more granularity
- Feedback no longer has a -1 value. Instead a delete_feedback method has been added to the data layer
- ThreadDict no longer has the full User object. Instead it has user_id and user_identifier fields

## [1.0.400] - 2024-03-06

### Added

- OpenAI integration

### Fixed

- Langchain final answer streaming should work again
- Elements with public URLs should be correctly persisted by the data layer

### Changed

- Enforce UTC DateTimes

## [1.0.300] - 2024-02-19

### Added

- Custom js script injection
- First token and token throughput per second metrics

### Changed

- The `ChatGeneration` and `CompletionGeneration` has been reworked to better match the OpenAI semantics

## [1.0.200] - 2024-01-22

### Added

- Chainlit Copilot
- Translations
- Custom font

### Fixed

- Tasklist flickering

## [1.0.101] - 2024-01-12

### Fixed

- Llama index callback handler should now correctly nest the intermediary steps
- Toggling hide_cot parameter in the UI should correctly hide the `took n steps` buttons
- `running` loading button should only be displayed once when `hide_cot` is true and a message is being streamed

## [1.0.100] - 2024-01-10

### Added

- `on_logout` hook allowing to clear cookies when a user logs out

### Changed

- Chainlit apps won't crash anymore if the data layer is not reachable

### Fixed

- File upload now works when switching chat profiles
- Avatar with an image no longer have a background color
- If `hide_cot` is set to `true`, the UI will never get the intermediary steps (but they will still be persisted)
- Fixed a bug preventing to open past chats

## [1.0.0] - 2024-01-08

### Added

- Scroll down button
- If `hide_cot` is set to `true`, a `running` loader is displayed by default under the last message when a task is running.

### Changed

- Avatars are now always displayed
- Chat history sidebar has been revamped
- Stop task button has been moved to the input bar

### Fixed

- If `hide_cot` is set to `true`, the UI will never get the intermediary steps (but they will still be persisted)

## [1.0.0rc3] - 2023-12-21

### Fixed

- Elements are now working when authenticated
- First interaction is correctly set when resuming a chat

### Changed

- The copy button is hidden if `disable_feedback` is `true`

## [1.0.0rc2] - 2023-12-18

### Added

- Copy button under messages
- OAuth samesite cookie policy is now configurable through the `CHAINLIT_COOKIE_SAMESITE` env var

### Changed

- Relax Python version requirements
- If `hide_cot` is configured to `true`, steps will never be sent to the UI, but still persisted.
- Message buttons are now positioned below

## [1.0.0rc0] - 2023-12-12

### Added

- cl.Step

### Changed

- File upload uses HTTP instead of WS and no longer has size limitation
- `cl.AppUser` becomes `cl.User`
- `Prompt` has been split in `ChatGeneration` and `CompletionGeneration`
- `Action` now display a toaster in the UI while running

## [0.7.700] - 2023-11-28

### Added

- Support for custom HTML in message content is now an opt in feature in the config
- Uvicorn `ws_per_message_deflate` config param is now configurable like `UVICORN_WS_PER_MESSAGE_DEFLATE=false`

### Changed

- Latex support is no longer enabled by default and is now a feature in the config

### Fixed

- Fixed LCEL memory message order in the prompt playground
- Fixed a key error when using the file watcher (-w)
- Fixed several user experience issues with `on_chat_resume`
- `on_chat_end` is now always called when a chat ends
- Switching chat profiles correctly clears previous AskMessages

## [0.7.604] - 2023-11-15

### Fixed

- `on_chat_resume` now works properly with non json serializable objects
- `LangchainCallbackHandler` no longer send tokens to the wrong user under high concurrency
- Langchain cache should work when `cache` is to `true` in `config.toml`

## [0.7.603] - 2023-11-15

### Fixed

- Markdown links special characters are no longer encoded
- Collapsed messages no longer make the chat scroll
- Stringified Python objects are now displayed in a Python code block

## [0.7.602] - 2023-11-14

### Added

- Latex support (only supporting $$ notation)
- Go back button on element page

### Fixed

- Code blocks should no longer flicker or display `[object object]`.
- Now properly displaying empty messages with inlined elements
- Fixed `Too many values to unpack error` in langchain callback
- Langchain final streamed answer is now annotable with human feedback
- AzureOpenAI should now work properly in the Prompt Playground

### Changed

- Code blocks display has been enhanced
- Replaced aiohttp with httpx
- Prompt Playground has been updated to work with the new openai release (v1). Including tools
- Auth0 oauth provider has a new configurable env variable `OAUTH_AUTH0_ORIGINAL_DOMAIN`

## [0.7.500] - 2023-11-07

### Added

- `cl.on_chat_resume` decorator to enable users to continue a conversation.
- Support for OpenAI functions in the Prompt Playground
- Ability to add/remove messages in the Prompt Playground
- Plotly element to display interactive charts

### Fixed

- Langchain intermediate steps display are now much more readable
- Chat history loading latency has been enhanced
- UTF-8 characters are now correctly displayed in json code blocks
- Select widget `items` attribute is now working properly
- Chat profiles widget is no longer scrolling horizontally

## [0.7.400] - 2023-10-27

### Added

- Support for Langchain Expression Language. https://docs.chainlit.io/integrations/langchain
- UI rendering optimization to guarantee high framerate
- Chainlit Cloud latency optimization
- Speech recognition to type messages. https://docs.chainlit.io/backend/config/features
- Descope OAuth provider

### Changed

- `LangchainCallbackHandler` is now displaying inputs and outputs of intermediate steps.

### Fixed

- AskUserMessage now work properly with data persistence
- You can now use a custom okta authorization server for authentication

## [0.7.3] - 2023-10-17

### Added

- `ChatProfile` allows to configure different agents that the user can freely chose
- Multi modal support at the input bar level. Enabled by `features.multi_modal` in the config
- `cl.AskUserAction` allows to block code execution until the user clicked an action.
- Displaying readme when chat is empty is now configurable through `ui.show_readme_as_default` in the config

### Changed

- `cl.on_message` is no longer taking a string as parameter but rather a `cl.Message`

### Fixed

- Chat history is now correctly displayed on mobile
- Azure AD OAuth authentication should now correctly display the user profile picture

### Removed

- `@cl.on_file_upload` is replaced by true multi modal support at the input bar level

## [0.7.2] - 2023-10-10

### Added

- Logo is displayed in the UI header (works with custom logo)
- Azure AD single tenant is now supported
- `collapsed` attribute on the `Action` class
- Latency improvements when data persistence is enabled

### Changed

- Chat history has been entirely reworked
- Chat messages redesign
- `config.ui.base_url` becomes `CHAINLIT_URL` env variable

### Fixed

- File watcher (-w) is now working with nested module imports
- Unsupported character during OAuth authentication

## [0.7.1] - 2023-09-29

### Added

- Pydantic v2 support
- Okta auth provider
- Auth0 auth provider
- Prompt playground support for mix of template/formatted prompts
- `@cl.on_chat_end` decorator
- Textual comments to user feedback

### Fixed

- Langchain errors are now correctly indented
- Langchain nested chains prompts are now correctly displayed
- Langchain error TypeError: 'NoneType' object is not a mapping.
- Actions are now displayed on mobile
- Custom logo is now working as intended

## [0.7.0] - 2023-09-13

### Changed

- Authentication is now unopinionated:
  1. `@cl.password_auth_callback` for login/password auth
  2. `@cl.oauth_callback` for oAuth auth
  3. `@cl.header_auth_callback` for header auth
- Data persistence is now enabled through `CHAINLIT_API_KEY` env variable

### Removed

- `@cl.auth_client_factory` (see new authentication)
- `@cl.db_client_factory` (see new data persistence)

### Added

- `disable_human_feedback` parameter on `cl.Message`
- Configurable logo
- Configurable favicon
- Custom CSS injection
- GCP Vertex AI LLM provider
- Long message collpasing feature flag
- Enable Prompt Playground feature flag

### Fixed

- History page filters now work properly
- History page does not show empty conversations anymore
- Langchain callback handler Message errors

## [0.6.4] - 2023-08-30

### Added

- `@cl.on_file_upload` to enable spontaneous file uploads
- `LangchainGenericProvider` to add any Langchain LLM in the Prompt Playground
- `cl.Message` content now support dict (previously only supported string)
- Long messages are now collapsed by default

### Fixed

- Deadlock in the Llama Index callback handler
- Langchain MessagesPlaceholder and FunctionMessage are now correctly supported

## [0.6.3] - 2023-08-22

### Added

- Complete rework of the Prompt playground. Now supports custom LLMs, templates, variables and more
- Enhanced Langchain final answer streaming
- `remove_actions` method on the `Message` class
- Button to clear message history

### Fixed

- Chainlit CLI performance issue
- Llama Index v0.8+ callback handler. Now supports messages prompts
- Tasklist display, persistence and `.remove()`
- Custom headers growing infinitely large
- Action callback can now handle multiple actions
- Langflow integration load_flow_from_json
- Video and audio elements on Safari

## [0.6.2] - 2023-08-06

### Added

- Make the chat experience configurable with Chat Settings
- Authenticate users based on custom headers with the Custom Auth client

### Fixed

- Author rename now works with all kinds of messages
- Create message error with chainlit cloud (chenjuneking)

## [0.6.1] - 2023-07-24

### Added

- Security improvements
- Haystack callback handler
- Theme customizability

### Fixed

- Allow multiple browser tabs to connect to one Chainlit app
- Sidebar blocking the send button on mobile

## [0.6.0] - 2023-07-20

### Breaking changes

- Factories, run and post process decorators are removed.
- langchain_rename becomes author_rename and works globally
- Message.update signature changed

Migration guide available [here](https://docs.chainlit.io/guides/migration/0.6.0).

### Added

- Langchain final answer streaming
- Redesign of chainlit input elements
- Possibility to add custom endpoints to the fast api server
- New File Element
- Copy button in code blocks

### Fixed

- Persist session between websocket reconnection
- The UI is now more mobile friendly
- Avatar element Path parameter
- Increased web socket message max size to 100 mb
- Duplicated conversations in the history tab

## [0.5.2] - 2023-07-10

### Added

- Add the video element

### Fixed

- Fix the inline element flashing when scrolling the page, due to un-needed re-rendering
- Fix the orange flash effect on messages

## [0.5.1] - 2023-07-06

### Added

- Task list element
- Audio element
- All elements can use the `.remove()` method to remove themselves from the UI
- Can now use cloud auth with any data persistence mode (like local)
- Microsoft auth

### Fixed

- Files in app dir are now properly served (typical use case is displaying an image in the readme)
- Add missing attribute `size` to Pyplot element

## [0.5.0] - 2023-06-28

### Added

- Llama Index integration. Learn more [here](https://docs.chainlit.io/integrations/llama-index).
- Langflow integration. Learn more [here](https://docs.chainlit.io/integrations/langflow).

### Fixed

- AskUserMessage.remove() now works properly
- Avatar element cannot be referenced in messages anymore

## [0.4.2] - 2023-06-26

### Added

- New data persistence mode `local` and `custom` are available on top of the pre-existing `cloud` one. Learn more [here](https://docs.chainlit.io/data).

## [0.4.101] - 2023-06-24

### Fixed

- Performance improvements and bug fixes on run_sync and asyncify

## [0.4.1] - 2023-06-20

### Added

- File watcher now reloads the app when the config is updated
- cl.cache to avoid wasting time reloading expensive resources every time the app reloads

### Fixed

- Bug introduced by 0.4.0 preventing to run private apps
- Long line content breaking the sidebar with Text elements
- File watcher preventing to keyboard interrupt the chainlit process
- Updated socket io to fix a security issue
- Bug preventing config settings to be the default values for the settings in the UI

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
