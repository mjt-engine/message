# Changelog


## 2025-02-16
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
