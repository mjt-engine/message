import { Bytes } from "@mjt-engine/byte";
import { Errors } from "@mjt-engine/error";
import { isDefined, isUndefined, toMany } from "@mjt-engine/object";
import { connect, createInbox, credsAuthenticator, RequestStrategy, } from "nats.ws";
import { connectConnectionListenerToSubject, DEFAULT_MAX_MESSAGE_SIZE, } from "./connectConnectionListenerToSubject";
import { msgsBufferToCombinedUint8Array } from "./msgsBufferToCombinedUint8Array";
import { msgToResponseData } from "./msgToResponseData";
import { recordToNatsHeaders } from "./recordToNatsHeaders";
import { ABORT_SUBJECT_HEADER, CHUNK_HEADER } from "./SPECIAL_HEADERS";
export const createConnection = async ({ server, creds, token, subscribers = {}, options = {}, env = {}, }) => {
    const { log = () => { }, maxMessageSize = DEFAULT_MAX_MESSAGE_SIZE } = options;
    log("createConnection: server: ", server);
    const connection = await connect({
        servers: [...toMany(server)],
        authenticator: isDefined(creds)
            ? credsAuthenticator(new TextEncoder().encode(creds))
            : undefined,
        token: token,
    });
    const entries = Object.entries(subscribers);
    log("createConnection: entries: ", entries);
    for (const [subject, listener] of entries) {
        if (isUndefined(listener)) {
            continue;
        }
        connectConnectionListenerToSubject({
            connection,
            subject,
            listener,
            options,
            env,
        });
    }
    return {
        connection,
        requestMany: async (props) => {
            const { request, subject, headers, options = {}, onResponse, signal, } = props;
            const { timeoutMs = 60 * 1000, maxMessageSize = DEFAULT_MAX_MESSAGE_SIZE, } = options;
            const requestMsg = Bytes.toMsgPack({ value: request });
            if (requestMsg.byteLength > maxMessageSize) {
            }
            const hs = recordToNatsHeaders(headers);
            if (isDefined(signal)) {
                const abortSubject = `abort.${Date.now()}.${crypto.randomUUID()}`;
                hs?.set(ABORT_SUBJECT_HEADER, abortSubject);
                signal.addEventListener("abort", () => {
                    connection.publish(abortSubject);
                });
            }
            const iterable = await connection.requestMany(subject, requestMsg, {
                maxWait: timeoutMs,
                headers: hs,
                strategy: RequestStrategy.SentinelMsg,
            });
            let buffer = [];
            for await (const resp of iterable) {
                iterable;
                if (signal?.aborted) {
                    return;
                }
                if (isUndefined(resp.data) || resp.data.byteLength === 0) {
                    break;
                }
                const chunkHeader = resp.headers?.get(CHUNK_HEADER);
                if (chunkHeader) {
                    const chunkParts = chunkHeader.split("/");
                    if (chunkParts.length !== 2) {
                        throw Errors.errorToErrorDetail({
                            error: new Error("Invalid chunk header format"),
                            extra: [{ subject, request, headers, options }],
                        });
                    }
                    if (resp.headers?.hasError) {
                        throw Errors.errorToErrorDetail({
                            error: new Error("Chunked response has error"),
                            extra: [{ subject, request, headers, options, resp }],
                        });
                    }
                    const [currentChunk, totalChunks] = chunkParts.map(Number);
                    if (buffer.length === 0) {
                        buffer = new Array(totalChunks).fill(undefined);
                    }
                    buffer[currentChunk - 1] = new Uint8Array(resp.data);
                    continue;
                }
                const responseData = await msgToResponseData({
                    msg: resp,
                    subject,
                    request,
                    log,
                });
                await onResponse(responseData);
            }
            if (buffer.length > 0) {
                //recombine the chunks
                const combined = msgsBufferToCombinedUint8Array(buffer);
                buffer.length = 0; // Clear the buffer after recombining
                const responseData = await msgToResponseData({
                    msg: { data: combined },
                    subject,
                    request,
                    log,
                });
                await onResponse(responseData);
            }
        },
        request: async (props) => {
            const { request, subject, headers, options = {} } = props;
            const requestMsg = Bytes.toMsgPack({ value: request });
            const { timeoutMs = 60 * 1000 } = options;
            const hs = recordToNatsHeaders(headers);
            const resp = await connection.request(subject, requestMsg, {
                timeout: timeoutMs,
                headers: hs,
            });
            if (isUndefined(resp.data) || resp.data.byteLength === 0) {
                return undefined;
            }
            if (resp.headers?.get(CHUNK_HEADER)) {
                throw Errors.errorToErrorDetail({
                    error: new Error("Chunked response recieved. Use requestMany instead."),
                    extra: [{ subject, request, headers, options }],
                });
            }
            return msgToResponseData({ msg: resp, subject, request, log });
        },
        publish: async (props) => {
            const { payload, request, subject, headers, onResponse, options = {}, signal, onError, } = props;
            const { timeoutMs = 60 * 1000 } = options;
            const value = isDefined(payload) ? payload : request;
            const msg = Bytes.toMsgPack({ value });
            const replySubject = createInbox();
            const hs = recordToNatsHeaders(headers);
            const subscription = connection.subscribe(replySubject);
            await connection.flush();
            const result = new Promise(async (resolve, reject) => {
                let buffer = [];
                const timeoutId = setTimeout(() => {
                    subscription.unsubscribe();
                    // reject(new Error("Request timed out"));
                }, timeoutMs);
                for await (const msg of subscription) {
                    if (signal?.aborted) {
                        clearTimeout(timeoutId);
                        subscription.unsubscribe();
                        return reject(new Error("Signal aborted"));
                    }
                    if (isUndefined(msg.data) || msg.data.byteLength === 0) {
                        if (buffer.length != 0) {
                            const combined = msgsBufferToCombinedUint8Array(buffer);
                            buffer.length = 0; // Clear the buffer after recombining
                            try {
                                const responseData = await msgToResponseData({
                                    msg: { data: combined },
                                    subject,
                                    request: payload,
                                    log,
                                });
                                clearTimeout(timeoutId);
                                subscription.unsubscribe();
                                await onResponse?.(responseData);
                                resolve(responseData);
                                return;
                            }
                            catch (e) {
                                onError?.(e);
                                reject(e);
                            }
                        }
                    }
                    if (msg.headers?.get(CHUNK_HEADER)) {
                        const chunkHeader = msg.headers.get(CHUNK_HEADER);
                        const chunkParts = chunkHeader.split("/");
                        if (chunkParts.length !== 2) {
                            onError?.(new Error("Invalid chunk header format: " + chunkHeader));
                            return;
                        }
                        const [currentChunk, totalChunks] = chunkParts.map(Number);
                        if (buffer.length === 0) {
                            buffer = new Array(totalChunks).fill(undefined);
                        }
                        buffer[currentChunk - 1] = new Uint8Array(msg.data);
                        return;
                    }
                    if (isUndefined(msg.data) || msg.data.byteLength === 0) {
                        console.log("connectConnectionListenerToSubject: No data in message ", msg);
                        resolve(undefined);
                        return;
                    }
                    clearTimeout(timeoutId);
                    subscription.unsubscribe();
                    const responseData = await msgToResponseData({
                        msg,
                        subject,
                        request: payload,
                        log,
                    });
                    await onResponse?.(responseData);
                    resolve(responseData);
                }
                if (signal) {
                    if (signal.aborted) {
                        clearTimeout(timeoutId);
                        subscription.unsubscribe();
                        return reject(new Error("Signal already in aborted state"));
                    }
                    signal.addEventListener("abort", () => {
                        clearTimeout(timeoutId);
                        subscription.unsubscribe();
                        reject(new Error("Signal aborted"));
                    });
                }
            });
            if (msg.byteLength < maxMessageSize) {
                return connection.publish(subject, msg, {
                    headers: hs,
                    reply: replySubject,
                });
            }
            const chunkCount = Math.ceil(msg.byteLength / maxMessageSize);
            const chunks = [];
            for (let i = 0; i < chunkCount; i++) {
                const start = i * maxMessageSize;
                const end = start + maxMessageSize;
                const chunk = new Uint8Array(msg.slice(start, end));
                chunks.push(chunk);
            }
            // Publish each chunk separately
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const chunkHeader = `${i + 1}/${chunkCount}`;
                const chunkHeaders = {
                    ...headers,
                    [CHUNK_HEADER]: chunkHeader,
                };
                connection.request(subject, chunk, {
                    headers: recordToNatsHeaders(chunkHeaders),
                    reply: replySubject,
                    timeout: timeoutMs,
                    noMux: true, // Ensure no multiplexing for chunked messages
                });
            }
            return result;
        },
    };
};
//# sourceMappingURL=createConnection.js.map