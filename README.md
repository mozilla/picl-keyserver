picl-keyserver
==============

Key management for PICL users

## API

You can currently create a new user account, add additional devices, and bump the class A key version.

All API calls take a JSON payload of an email address. E.g.:

    {
      email: bob@example.com
    }

Eventuall, they might take an assertion:

    {
      assertion: <persona generated assertion>
    }

### PUT /user/create
Creates a new user account and generates a class A key.

*Returns*:

    {
      success: true,
      kA: <32 random bytes in hex>,
      version: 1,
      deviceId: <32 random bytes in hex>
    }

### PUT /device/create
Registers a new device with the user account.

*Returns*
    {
      success: true,
      kA: <user's current kA>,
      version: <kA version>
      deviceId: <newly generated deviceId>
    }

### PUT /user/get/{deviceId}
Fetches the user's current key.

*Returns*
    {
      success: true,
      kA: <user's current kA>,
      version: <kA version>
    }

### PUT /user/bump/{deviceId}
This creates a new class A key for the user and bumps the version number.
All devices besides the device that initiated the call will be marked as having
an outdated key.

*Returns*
    {
      success: true,
      kA: <newly generated kA>,
      version: <kA version>
    }

