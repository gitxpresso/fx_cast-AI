export function getNextEllipsis(ellipsis: string): string {
    if (ellipsis === "") return ".";
    if (ellipsis === ".") return "..";
    if (ellipsis === "..") return "...";
    if (ellipsis === "...") return "";

    return "";
}

export function loadScript(
    scriptUrl: string,
    doc: Document = document
): Promise<HTMLScriptElement> {
    return new Promise((resolve, reject) => {
        const scriptEl = doc.createElement("script");
        scriptEl.src = scriptUrl;
        (doc.head || doc.documentElement).append(scriptEl);

        scriptEl.addEventListener("load", () => resolve(scriptEl));
        scriptEl.addEventListener("error", () => reject());
    });
}
