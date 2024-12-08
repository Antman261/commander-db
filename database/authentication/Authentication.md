# Authentication & Authorization

tldr; 
* use JWTs, user supplies URL for database to retrieve public key to validate JWTs
* basic authentication only available in development mode, only admin access

## Authorization: Prescriptive Roles

* admin
* event migrator
* command processor
* command issuer
* workflow processor
* event reader