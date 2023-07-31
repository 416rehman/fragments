POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

# JSON body
{
  "name": "s3",
  "content": "Hello S3!"
}

HTTP/1.1 201

[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 2. Try to GET the fragment we just posted by its URL
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.metadata.type" == "application/json"

# MARKDOWN
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1

# Markdown body
`DynamoDB is **great**.`

HTTP/1.1 201

[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 3. Try to GET the fragment we just posted by its URL
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.fragment.metadata.type" == "text/markdown"
jsonpath "$.fragment.metadata.size" == 22

# 4. Try to GET all fragments
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# Check that the fragments id array contains the two fragments we just posted
[Asserts]
jsonpath "$.fragments" includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}

# Delete the first fragment
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# 5. Try to GET first fragment again
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404

# 6. Try to GET all fragments again
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# Check that the fragments id array contains only the second fragment
[Asserts]
jsonpath "$.fragments" includes {{fragment2_id}}
jsonpath "$.fragments" not includes {{fragment1_id}}