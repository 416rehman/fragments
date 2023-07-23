# tests/integration/post-unsupported-type.hurl
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# We're sending an unsupported Content-Type
Content-Type: application/xml
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# The fragment data
{
"key": "value"
}

# 1. We expect to get back an HTTP 201
HTTP/1.1 415