# Changelog


## 2025-07-11
- publish returns response now ([90b292d](https://github.com/mjt-engine/message/commit/90b292df351c396c6069477b84af89a238fafa9c)) by Matt Taylor
- clear timeout on recieving good response ([b12a0a5](https://github.com/mjt-engine/message/commit/b12a0a512859038ce64ae36eaa83ee71a0c00a8e)) by Matt Taylor
- added publish chunking ([9e5e633](https://github.com/mjt-engine/message/commit/9e5e6338b26d2f39499d545d8284d168cf134643)) by Matt Taylor
- added chunking to messages ([3941a8a](https://github.com/mjt-engine/message/commit/3941a8a33ae33884669f182d4160d4b6a3e9a824)) by Matt Taylor

## 2025-06-26
- remove Errors, include dep on mjt-engine/error ([7bf5fcd](https://github.com/mjt-engine/message/commit/7bf5fcdaf0a5df657522d6e68e044987c91948bc)) by Matt Taylor

## 2025-03-04
- log for unsub of listener ([8012c09](https://github.com/mjt-engine/message/commit/8012c09cdd3b96c1359e36d803ab76782557b054)) by Matt Taylor
- log for unsub of listener ([fbc5075](https://github.com/mjt-engine/message/commit/fbc5075d161095d975a0bfd32adee5aab69a925c)) by Matt Taylor

## 2025-02-23
- export parseSubject under Messages ([ad35cb2](https://github.com/mjt-engine/message/commit/ad35cb2526309d278dac8832e456c7f7030ad828)) by Matt Taylor
- export ParsedSubject ([f9ad397](https://github.com/mjt-engine/message/commit/f9ad39744b564f1643373f66197667762ab84b9d)) by Matt Taylor
- add subject to EventListener params ([35e865a](https://github.com/mjt-engine/message/commit/35e865a7dad46facf8a2d0202b6fe3b6620fcb48)) by Matt Taylor
- oops, changed wrong funciton name, connectEventListenerToSubjectRoot is the correct name ([5d80a8e](https://github.com/mjt-engine/message/commit/5d80a8e92e0ac46c0f6a83af582074e1c127dc17)) by Matt Taylor
- oops, changed wrong funciton name, connectEventListenerToSubjectRoot is the correct name ([b46b7f4](https://github.com/mjt-engine/message/commit/b46b7f4fc256e1aa4af0ab7c82d6cde9ae8c0cc0)) by Matt Taylor
- changed connect connection listener function name to reflect subjectRoot as the connection point ([078de12](https://github.com/mjt-engine/message/commit/078de1207b3dc4883cfc067ccad4a47c71080bce)) by Matt Taylor
- subect -> subjectRoot on event listener and use correct pattern matching ([9753624](https://github.com/mjt-engine/message/commit/975362447aadd0510d958b529edd0d1c856cd7e2)) by Matt Taylor
- concrete type for MessageConnectionInstance ([0f7824e](https://github.com/mjt-engine/message/commit/0f7824edd5df6440ae947b528e3ce5f91bf8ec92)) by Matt Taylor
- default env on connectEventListnerToSubject ([4caf276](https://github.com/mjt-engine/message/commit/4caf2767fa685f8eb7d0998a96da3e1b952caba3)) by Matt Taylor
- addition of ParsedSubject and rework of PartialSubject to include root only as valid ([275f600](https://github.com/mjt-engine/message/commit/275f60025232468d9ac9dc61802dc90e399105b6)) by Matt Taylor

## 2025-02-22
- added event types and function to connect event-listeners ([57bb149](https://github.com/mjt-engine/message/commit/57bb1494ab7c23eedad6fe44f7a4666fe56b0590)) by Matt Taylor

## 2025-02-21
- don't return on error inside of message subscription for...await, an error is not the end here ([606882a](https://github.com/mjt-engine/message/commit/606882a8b0161b9f8ff3c3275dc1a4c940c1216b)) by Matt Taylor
- added abort signal to listener connector ([6a83fac](https://github.com/mjt-engine/message/commit/6a83fac773e61773ae7307c36be302828eaeecaa)) by Matt Taylor
- codequake change! Error handling reworked to encapsulate ErrorDetail inside of message as ValueOrError type. Added unsubscribe param function to listeners ([253f77f](https://github.com/mjt-engine/message/commit/253f77f2509350facf2537ae64eb263f97f82e2c)) by Matt Taylor

## 2025-02-18
- DRY up sending message errors, possible bugfix to default exception handling on listeners ([35db18a](https://github.com/mjt-engine/message/commit/35db18a77fbdc03b8f78d5af7333495230329bab)) by Matt Taylor

## 2025-02-16
- log conforms more to console.log and also handles errors a touch better ([6fd9984](https://github.com/mjt-engine/message/commit/6fd99840482ed19c6daa9ee288606a4eeb14461e)) by Matt Taylor
- fix bug with msgToResponseData not returning data ([e05ff91](https://github.com/mjt-engine/message/commit/e05ff910779f91efe5691caae913fa0f971923d0)) by Matt Taylor
- more detailed errorText ([b64acf5](https://github.com/mjt-engine/message/commit/b64acf5883f03649829533d46d43d0829922ea6f)) by Matt Taylor
- await errors because we allow Response type for errors that need to be awated to get text ([8f3eeb4](https://github.com/mjt-engine/message/commit/8f3eeb44b0fa3c8544afbec02eb0caa03abb1470)) by Matt Taylor
- export Errors sub-module, refactor error handling to be more DRY and correct ([22d8540](https://github.com/mjt-engine/message/commit/22d854067ccac56469dc66eb05a20b6f30f0487d)) by Matt Taylor
- return undefined on empty resp data. re-order error handling to happen sooner, and return request as cause for response errors ([582934c](https://github.com/mjt-engine/message/commit/582934c4ae3be64089bc13324af293f719757827)) by Matt Taylor

## 2025-02-07
- attempt to make createConnection portable by not retuning status and instead logging ([2b2f0cd](https://github.com/mjt-engine/message/commit/2b2f0cd2b14ccfa5835f5dd998414c5bf6634532)) by Matt Taylor
- attempt to make createConnection portable by exporting Nats status types type aliases ([21553bc](https://github.com/mjt-engine/message/commit/21553bc88c4126c918afda10446c47e83efe5626)) by Matt Taylor
- attempt to make createConnection portable by exporting NatsConnection type alias ([3282507](https://github.com/mjt-engine/message/commit/32825078521f6acb0237f0882a40ca775f5d4ac4)) by Matt Taylor

## 2025-01-14
- use byte module for msgpack ([0ad88c4](https://github.com/mjt-engine/message/commit/0ad88c4410e341d06b7b1f03142438e3aedce585)) by Matt Taylor

## 2025-01-12
- added token auth option ([ae29374](https://github.com/mjt-engine/message/commit/ae293741bce6f1d8bb3e419ec861c84612253454)) by Matt Taylor

## 2025-01-11
- removed token added creds for MQ auth ([ab2f3e0](https://github.com/mjt-engine/message/commit/ab2f3e05a3f1ef36612dd1b78485c09fe2100109)) by Matt Taylor
- added token to connection config ([89a9ffb](https://github.com/mjt-engine/message/commit/89a9ffb4e4b3bcb5b0d696b01fb56421eb4dd586)) by Matt Taylor

## 2025-01-09
- fix typo in version.sh ([363144b](https://github.com/mjt-engine/message/commit/363144b35fe39fb76a63c54e924921571158c604)) by Matt Taylor
- use tsc instead of esbuild ([4831a02](https://github.com/mjt-engine/message/commit/4831a026cd528819aa00232962b62c00980503fc)) by Matt Taylor
- update build scripts ([db76515](https://github.com/mjt-engine/message/commit/db76515a64bcd4566be8bc47678f89b8d6a4bf4f)) by Matt Taylor
- update mjtdev->mjt-engine in project name ([1fc6879](https://github.com/mjt-engine/message/commit/1fc687928574b4654a281068d4630422667cbc44)) by Matt Taylor

## 2025-01-08
- include doc assets ([4b9bd6f](https://github.com/mjt-engine/message/commit/4b9bd6f6ad07e21b5e857493ae66f2e2a5ce63ee)) by Matt Taylor
- updated README to include doc link ([e560017](https://github.com/mjt-engine/message/commit/e560017fdb79b66beebae7902c1625d407ac04e2)) by Matt Taylor
- added typedoc docs ([8f5cfca](https://github.com/mjt-engine/message/commit/8f5cfcad2b4cbd81e0965ca6388d8e9032d646dd)) by Matt Taylor
- initial-commit ([72864db](https://github.com/mjt-engine/message/commit/72864db36206d501966af068a54ae7ff996ae5d7)) by Matt Taylor
