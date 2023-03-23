from setuptools import setup, find_packages
from setuptools.command.install import install

VERSION = '0.0.1'
DESCRIPTION = ''
LONG_DESCRIPTION = ''


class PostInstallCommand(install):
    """Post-installation for installation mode."""

    def run(self):
        from subprocess import call
        import os
        install.run(self)
        fpath = os.path.join(self.install_lib, "chainlit")
        call(["prisma", 'db', 'push'],
             cwd=fpath)


setup(
    name="chainlit",
    version=VERSION,
    author="Willy Douhard",
    author_email="willy.douhard@gmail.com",
    description=DESCRIPTION,
    long_description=LONG_DESCRIPTION,
    packages=find_packages(),
    entry_points={
        'console_scripts': ['chainlit=chainlit.cli:main'],
    },
    cmdclass={
        'install': PostInstallCommand,
    },
    install_requires=[
        "langchain>=0.0.109",
        "dataclasses_json>=0.5.7",
        "flask>=2.2.3",
        "flask_socketio>=5.3.3",
        "flask_cors>=3.0.10",
        "prisma>=0.8.2",
    ],  # add any additional packages that
    # needs to be installed along with your package. Eg: 'caer'
    python_requires='>=3.7',
    keywords=['langchain', 'ui', 'gen ai', 'chat ui'],
    classifiers=[],
    package_data={
        'chainlit': ['frontend/dist/*', 'frontend/dist/assets/*', 'schema.prisma'],
    },
    include_package_data=True,
)
