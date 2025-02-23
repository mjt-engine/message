export const parseSubject = (subject) => {
    const segments = subject.split(".");
    const root = segments.shift();
    const subpath = segments.join(".");
    return {
        root,
        segments,
        subpath,
    };
};
//# sourceMappingURL=ParsedSubject.js.map