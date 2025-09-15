from importlib import metadata

try:
	__version__ = metadata.version(__package__)
except metadata.PackageNotFoundError:
	# Package metadata not available (editable dev or source tree). Fallback to local fork version.
	__version__ = "2.7.3"
