import os
from watchdog_gevent.observers import GeventObserver
from watchdog.events import FileSystemEventHandler
from chainlit.config import config, load_module
from chainlit.server import socketio
from chainlit.logger import logger

last_modified_time = 0
is_watching = False


class ChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        global last_modified_time

        # Get the modified time of the file
        statbuf = os.stat(event.src_path)
        current_modified_time = statbuf.st_mtime

        file_ext = os.path.splitext(event.src_path)[1]

        if not file_ext in [".py", ".md"]:
            return

        # Check if the file was modified more than 0.5 seconds ago
        if (current_modified_time - last_modified_time) > 0.5:
            logger.info(f"event type: {event.event_type} path : {event.src_path}")

            # Load the module if the module name is specified in the config
            if config.module_name:
                load_module(config.module_name)

            # Emit a "reload" event to the socket
            socketio.emit("reload", {})

        last_modified_time = current_modified_time


def watch_directory():
    global is_watching

    # Return if already watching
    if is_watching:
        return

    is_watching = True
    event_handler = ChangeHandler()
    observer = GeventObserver()

    # Schedule the observer to watch the directory recursively
    observer.schedule(event_handler, config.root, recursive=True)

    # Start the observer
    observer.start()
