from setuptools import setup, find_packages

VERSION = '0.0.1' 
DESCRIPTION = ''
LONG_DESCRIPTION = ''

setup(
        name="rush", 
        version=VERSION,
        author="Willy Douhard",
        author_email="willy.douhard@gmail.com",
        description=DESCRIPTION,
        long_description=LONG_DESCRIPTION,
        packages=find_packages(),
        entry_points = {
            'console_scripts': ['rush=rush.cli:main'],
        },
        install_requires=[
            "langchain>=0.0.109",
        ], # add any additional packages that 
        # needs to be installed along with your package. Eg: 'caer'
        python_requires='>=3.7',
        keywords=['langchain', 'ui', 'gen ai'],
        classifiers= []
)