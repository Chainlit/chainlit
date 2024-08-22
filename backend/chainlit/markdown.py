import os

from chainlit.logger import logger

# Default chainlit.md file created if none exists
DEFAULT_MARKDOWN_STR = """# It worked!
I apparently successfuly built chainlit and runned it.
"""


def init_markdown(root: str):
    """Initialize the chainlit.md file if it doesn't exist."""
    chainlit_md_file = os.path.join(root, "chainlit.md")

    if not os.path.exists(chainlit_md_file):
        with open(chainlit_md_file, "w", encoding="utf-8") as f:
            f.write(DEFAULT_MARKDOWN_STR)
            logger.info(f"Created default chainlit markdown file at {chainlit_md_file}")


def get_markdown_str(root: str, language: str):
    """Get the chainlit.md file as a string."""
    translated_chainlit_md_path = os.path.join(root, f"chainlit_{language}.md")
    default_chainlit_md_path = os.path.join(root, "chainlit.md")

    if os.path.exists(translated_chainlit_md_path):
        chainlit_md_path = translated_chainlit_md_path
    else:
        chainlit_md_path = default_chainlit_md_path
        logger.warning(
            f"Translated markdown file for {language} not found. Defaulting to chainlit.md."
        )

    if os.path.exists(chainlit_md_path):
        with open(chainlit_md_path, "r", encoding="utf-8") as f:
            chainlit_md = f.read()
            return chainlit_md
    else:
        return None
