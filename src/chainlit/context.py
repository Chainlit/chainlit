import contextvars

emitter_var = contextvars.ContextVar("emitter")

loop_var = contextvars.ContextVar("loop")
