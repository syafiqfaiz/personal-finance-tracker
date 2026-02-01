---
name: create_user_license
description: Create a production user license for the Personal Finance Tracker using the Admin API.
---

# Create User License

This skill documents the process for creating a new user license in the production environment of the Personal Finance Tracker (`belanja.syafiqfaiz.com`).

## Prerequisites

- **Admin Secret**: You must have the `ADMIN_SECRET`. This is typically found in the `.dev.vars` file in the root of the project.
- **Endpoint**: The production API endpoint is `https://belanja.syafiqfaiz.com/api/admin/licenses`.

## Instructions

1.  **Retrieve Admin Secret**
    - Check the `.dev.vars` file for the `ADMIN_SECRET` variable.
    - If not found locally, request it from the user.

2.  **Prepare the Command**
    - You will use `curl` to send a POST request.
    - **Method**: `POST`
    - **URL**: `https://belanja.syafiqfaiz.com/api/admin/licenses`
    - **Headers**:
        - `Content-Type: application/json`
        - `X-Admin-Secret`: The value retrieved in step 1.
    - **Payload**:
        ```json
        {
          "email": "<TARGET_EMAIL>",
          "tier": "pro" 
        }
        ```
        *(Note: `tier` defaults to 'pro', but can be 'basic' or 'enterprise' if specified)*

3.  **Execute and Verify**
    - Run the command.
    - **Success Response**: You should receive a JSON response with the new License ID and Key.
    - **Output**: Present the **License Key** to the user.

## Example Usage

```bash
# Example assuming ADMIN_SECRET is 'my_secret_key'
curl -X POST https://belanja.syafiqfaiz.com/api/admin/licenses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: my_secret_key" \
  -d '{
    "email": "new_user@example.com",
    "tier": "pro"
  }'
```
