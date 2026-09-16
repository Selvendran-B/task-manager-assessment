from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


def verify_google_token(credential: str, client_id: str):
    """
    Verify a Google ID token and return the decoded user information.
    """
    return id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        client_id
    )