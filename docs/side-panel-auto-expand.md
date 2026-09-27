# Controlling automatic side-panel opening

Side elements open the panel by default. Set `auto_expand=False` on an element
when it should remain available through its message reference without reopening
a panel the user has closed:

```python
sources = cl.Text(
    name="Sources",
    content="Reference material",
    display="side",
    auto_expand=False,
)
await cl.Message(content="See Sources for details.", elements=[sources]).send()
```

The option also works on `CustomElement`. An already open panel still receives
content updates. Clicking an element reference explicitly opens it regardless of
`auto_expand`; inline and page display modes are unaffected.

`auto_expand` is a live presentation hint, not persisted element data. It does
not require database migrations, and it does not change how restored historical
threads are displayed. Apply it to each new or updated element whose arrival
should not automatically open the panel. A batch containing a changed element
with the default `auto_expand=True` may still open the panel.
