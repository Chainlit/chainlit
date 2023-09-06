import secrets
import string


def random_secret(length: int = 32):
    return "".join(
        (
            secrets.choice(string.ascii_letters + string.digits + string.punctuation)
            for i in range(length)
        )
    )
