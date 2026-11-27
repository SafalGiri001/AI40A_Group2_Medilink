from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password):
    return generate_password_hash(password)

def verify_password(hashed, entered):
    return check_password_hash(hashed, entered)


import logging

logging.basicConfig(filename="auth.log", level=logging.INFO)

MAX_ATTEMPTS = 5
failed_attempts = {}  # username -> number of failures

def try_login(username, password, users):
    # users is a dict like {"alice": "<hashed password>"}
    if failed_attempts.get(username, 0) >= MAX_ATTEMPTS:
        logging.warning(f"Blocked locked account: {username}")
        return "Account locked"

    if username in users and verify_password(users[username], password):
        failed_attempts[username] = 0
        return "Success"

    failed_attempts[username] = failed_attempts.get(username, 0) + 1
    logging.info(f"Failed login for {username}")
    return "Wrong username or password"
