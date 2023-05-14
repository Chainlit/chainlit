from auth0.authentication.token_verifier import (
    TokenVerifier,
    AsymmetricSignatureVerifier,
)
from typing import Dict
from chainlit.logger import logger
import time
import requests
import sys
import time
import webbrowser
import os
import json


AUTH0_DOMAIN = "auth.chainlit.io"
AUTH0_CLIENT_ID = "ADo93BBXDn8Z35lEi8arCWiR7C0ncrjx"
ALGORITHMS = ["HS256"]


def get_credentials_path():
    """
    Returns the path to the credentials file
    """
    return os.path.join(os.path.expanduser("~"), ".chainlit", "credentials.json")


def store_credentials(credentials: Dict):
    """
    Stores the credentials in the credentials file

    :param credentials:
    """
    if not os.path.exists(os.path.dirname(get_credentials_path())):
        os.makedirs(os.path.dirname(get_credentials_path()))
    with open(get_credentials_path(), "w", encoding="utf-8") as f:
        f.write(json.dumps(credentials))


def is_logged_in():
    """
    Returns true if the user is logged in
    """
    if not os.path.exists(get_credentials_path()):
        return False
    with open(get_credentials_path(), "r", encoding="utf-8") as f:
        credentials = json.loads(f.read())
        if time.time() - credentials["created_at"] > credentials["expires_in"]:
            logger.info("Token expired.")
            return False
        return True


def get_access_token():
    """
    Returns the credentials from the credentials file
    """
    if not is_logged_in():
        login()
        return get_access_token()
    with open(get_credentials_path(), "r", encoding="utf-8") as f:
        credentials = json.loads(f.read())
        return credentials["access_token"]


def validate_token(token):
    """
    Verify the token and its precedence

    :param token:
    """
    jwks_url = "https://{}/.well-known/jwks.json".format(AUTH0_DOMAIN)
    issuer = "https://{}/".format(AUTH0_DOMAIN)
    sv = AsymmetricSignatureVerifier(jwks_url)
    tv = TokenVerifier(signature_verifier=sv, issuer=issuer, audience=AUTH0_CLIENT_ID)
    return tv.verify(token)


def logout():
    """
    Removes the user object from memory
    """
    if os.path.exists(get_credentials_path()):
        os.remove(get_credentials_path())
        logger.info("Logged out")
    else:
        logger.error("You are not logged in")


def login():
    """
    Runs the device authorization flow and stores the user object in memory
    """
    if is_logged_in():
        logger.info("You are already logged in")
        return

    device_code_payload = {
        "client_id": AUTH0_CLIENT_ID,
        "scope": "openid profile email",
        "audience": "chainlit-cloud",
    }
    device_code_response = requests.post(
        "https://{}/oauth/device/code".format(AUTH0_DOMAIN), data=device_code_payload
    )

    if device_code_response.status_code != 200:
        logger.error("Error generating the device code")
        logger.error(device_code_response.json())
        sys.exit(1)

    device_code_data = device_code_response.json()
    webbrowser.open(device_code_data["verification_uri_complete"])
    logger.info(f"Enter the following code: {device_code_data['user_code']}")

    token_payload = {
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        "device_code": device_code_data["device_code"],
        "client_id": AUTH0_CLIENT_ID,
    }

    authenticated = False
    while not authenticated:
        token_response = requests.post(
            "https://{}/oauth/token".format(AUTH0_DOMAIN), data=token_payload
        )

        token_data = token_response.json()
        if token_response.status_code == 200:
            user = validate_token(token_data["id_token"])
            token_data["created_at"] = time.time()
            store_credentials(token_data)
            logger.info(f"Logged in as {user['email']}")
            authenticated = True
        elif token_data["error"] not in ("authorization_pending", "slow_down"):
            logger.error(token_data["error_description"])
            sys.exit(1)
        else:
            time.sleep(device_code_data["interval"])
