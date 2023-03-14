import logging
import sys
from typing import Dict, Union

from typing_extensions import Final

DEFAULT_LOG_MESSAGE: Final = "%(asctime)s %(levelname) -7s " "%(name)s: %(message)s"

# Loggers for each name are saved here.
_loggers: Dict[str, logging.Logger] = {}

# The global log level is set here across all names.
_global_log_level = logging.INFO


def set_log_level(level: Union[str, int]) -> None:
    """Set log level."""
    logger = get_logger(__name__)

    if isinstance(level, str):
        level = level.upper()
    if level == "CRITICAL" or level == logging.CRITICAL:
        log_level = logging.CRITICAL
    elif level == "ERROR" or level == logging.ERROR:
        log_level = logging.ERROR
    elif level == "WARNING" or level == logging.WARNING:
        log_level = logging.WARNING
    elif level == "INFO" or level == logging.INFO:
        log_level = logging.INFO
    elif level == "DEBUG" or level == logging.DEBUG:
        log_level = logging.DEBUG
    else:
        msg = 'undefined log level "%s"' % level
        logger.critical(msg)
        sys.exit(1)

    for log in _loggers.values():
        log.setLevel(log_level)

    global _global_log_level
    _global_log_level = log_level


def setup_formatter(logger: logging.Logger) -> None:
    """Set up the console formatter for a given logger."""
    # Deregister any previous console loggers.
    if hasattr(logger, "console_handler"):
        logger.removeHandler(logger.console_handler)

    # type: ignore[attr-defined]
    logger.console_handler = logging.StreamHandler()

    message_format = DEFAULT_LOG_MESSAGE
    formatter = logging.Formatter(fmt=message_format)
    formatter.default_msec_format = "%s.%03d"
    logger.console_handler.setFormatter(
        formatter)  # type: ignore[attr-defined]

    # Register the new console logger.
    logger.addHandler(logger.console_handler)  # type: ignore[attr-defined]


def update_formatter() -> None:
    for log in _loggers.values():
        setup_formatter(log)


def get_logger(name: str) -> logging.Logger:
    """Return a logger.

    Parameters
    ----------
    name : str
        The name of the logger to use. You should just pass in __name__.

    Returns
    -------
    Logger

    """
    if name in _loggers.keys():
        return _loggers[name]

    if name == "root":
        logger = logging.getLogger()
    else:
        logger = logging.getLogger(name)

    logger.setLevel(_global_log_level)
    logger.propagate = False
    setup_formatter(logger)

    _loggers[name] = logger

    return logger
