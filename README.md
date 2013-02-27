picl-keyserver
==============

Key management for PICL users

## API

You can currently create a new user account, add additional devices, and bump the class A key version.

All API calls take a JSON payload of an email address. E.g.:

    {
      email: bob@example.com
    }

or, for GET requests: `?email=bob@example.com`.

Eventuall, they might take an assertion:

    {
      assertion: <persona generated assertion>
    }

### NULL security model
Clients can safely ignore `version` and `deviceId` in API responses. These are intended for key revocation, but they won't be used in early prototypes.

### POST /user
Creates a new user account and generates a class A key.

*Returns*:

    {
      success: true,
      kA: <32 random bytes in hex>,
      version: 1,
      deviceId: <32 random bytes in hex>
    }

### POST /device
Registers a new device with the user account.

*Returns*

    {
      success: true,
      kA: <user's current kA>,
      version: <kA version>
      deviceId: <newly generated deviceId>
    }

### GET /user[/deviceId]
Fetches the user's current key. `deviceId` is not required.

*Returns*

    {
      success: true,
      kA: <user's current kA>,
      version: <kA version>
    }

### POST /user/bump/{deviceId}
**Not used in NULL authentication model**

This creates a new class A key for the user and bumps the version number.
All devices besides the device that initiated the call will be marked as having
an outdated key.

*Returns*

    {
      success: true,
      kA: <newly generated kA>,
      version: <kA version>
    }

