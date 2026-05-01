from cryptography.fernet import Fernet
import os

KEY_FILE = "secret.key"

def loadOrCreateKey():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "rb") as f:
            return f.read()
        
    key = Fernet.generate_key()
    with open(KEY_FILE, "wb") as f:
        f.write(key)
    return key

key = loadOrCreateKey()
cipher = Fernet(key)

def encrypt(text: str) -> str:
    return cipher.encrypt(text.encode()).decode()

def decrypth(token: str) -> str:
    return cipher.decrypt(token.encode()).decode()