import logging

logging.getLogger("socketio").setLevel(logging.ERROR)
logging.getLogger("engineio").setLevel(logging.ERROR)
logging.getLogger("numexpr").setLevel(logging.ERROR)


logger = logging.getLogger("chainlit")
