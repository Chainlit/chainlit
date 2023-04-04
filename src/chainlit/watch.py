from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from chainlit.config import config
from chainlit.server import socketio
import os

old = 0
watching = False


class ChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        global old

        statbuf = os.stat(event.src_path)
        new = statbuf.st_mtime

        if (new - old) > 0.5:
            print(f'event type: {event.event_type}  path : {event.src_path}')
            socketio.emit("reload", {})

        old = new


def watch_dir():
    global watching

    if watching:
        return
    watching = True
    event_handler = ChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, config.root, recursive=False)
    observer.start()
