from setuptools import setup, find_packages

VERSION = '0.0.3'
DESCRIPTION = ''
LONG_DESCRIPTION = ''


setup(
    name="chainlit",
    version=VERSION,
    author="Willy Douhard",
    author_email="willy.douhard@gmail.com",
    description=DESCRIPTION,
    long_description=LONG_DESCRIPTION,
    packages=find_packages(),
    entry_points={
        'console_scripts': ['chainlit=chainlit.cli:cli'],
    },
    install_requires=[
        "dataclasses_json>=0.5.7",
        "flask>=2.2.3",
        "flask_socketio>=5.3.3",
        "flask_cors>=3.0.10",
        "click>=8.1.3",
        "openai>=0.27.2",
        "tomli>=2.0.1",
        "watchdog>=3.0.0",
        "watchdog_gevent>=0.1.1",
        "gevent>=22.10.2",
        "python-graphql-client>=0.4.3",
    ],
    python_requires='>=3.7',
    keywords=['langchain', 'ui', 'gen ai', 'chat ui', 'chatbot ui'],
    classifiers=[],
    package_data={
        'chainlit': ['frontend/dist/*', 'frontend/dist/assets/*', 'LICENSE'],
    },
    include_package_data=True,
)
