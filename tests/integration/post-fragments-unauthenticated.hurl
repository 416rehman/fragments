# tests/integration/post-fragments-json.hurl
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# We're sending a JSON fragment
Content-Type: application/json
# Include HTTP Basic Auth credentials
[BasicAuth]
wronguser:wrongpassword
# The fragment data
{
"key": "value"
}

# 1. We expect to get back an HTTP 201
HTTP/1.1 401