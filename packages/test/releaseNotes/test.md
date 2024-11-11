# @labkey/test
Utilities and configurations for running JavaScript tests with LabKey Server.

### version 1.6.3
*Released* 11 November 2024
* Fix parseVerificationToken() helper to reflect verification URL change

### version 1.6.2
*Released* 30 September 2024
* Add helper util for random/shuffle and ExperimentCRUDUtils

### version 1.6.1
*Released* 17 September 2024
* Add helper util for random/shuffle and ExperimentCRUDUtils

### version 1.6.0
*Released* 26 July 2024
* Add ExperimentCRUDUtils

### version 1.5.0
*Released* 24 July 2024
* Package updates

### version 1.4.0
*Released* 19 March 2024
* change default context for integration tests to `/` instead of `/labkey` in support of more use of embedded Tomcat

### version 1.3.0
*Released*: 7 Sept 2023
* Use standard password for `integrationUtils.createUser()`

### version 1.2.0
*Released*: 17 July 2023
* Remove `SecurityRole`. Use `PermissionRoles` provided by `@labkey/api` instead.
* Package updates

### version 1.1.3
*Released*: 14 April 2023
* Package updates

### version 1.1.2
*Released*: 14 December 2022
* Initialize sessionId for RequestContext created via `createRequestContext()`

### version 1.1.1
*Released*: 26 May 2022
* handle htmlErrors response from CreateNewUsersAction

### version 1.1.0
*Released*: 24 March 2022
* support JSESSIONID cookie for same session requests

### version 1.0.1
*Released*: 4 November 2021
* Regenerate lockfile so TC doesn't fail during install

### version 1.0.0
*Released*: 1 June 2021
* Package updates

### version 0.0.6
*Released*: 22 April 2021
* Dependabot package updates

### version 0.0.5
*Released*: 22 December 2020
* Dependabot package updates

### version 0.0.4
*Released*: 23 September 2020
* Expose default request context

### version 0.0.3
*Released*: 17 September 2020
* Expose additional test user metadata

### version 0.0.2
*Released*: 14 September 2020
* Support multiple containers and users
* See https://github.com/LabKey/labkey-ui-components/pull/341

### version 0.0.1
*Released*: 31 August 2020
* Initial module.
