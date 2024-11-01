import secrets

# Generate a random API key
api_key = secrets.token_hex(16)  # This generates a 32-character hex string
print(api_key)  # Print the API key for reference
