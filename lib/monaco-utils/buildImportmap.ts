/**
 */
// filenameをキー、コードをvalueとしたjson
// ファイル名はjsだけが対応する。
export function buildImportmap(files: Record<string, string | object>, targetObject?: any) {
    const imports = Object.entries(files).reduce((a, [filename, content]) => {
        if (!filename.endsWith(".js")) return a;

        if (typeof content === 'string') {
            return {
                ...a,
                [filename]: 'data:text/javascript;charset=utf-8,' + encodeURIComponent(content)
            }
        } else if (typeof content === 'object' && content !== null && targetObject) {
            const key = `__import_${filename.replace(/\W/g, '_')}_${Math.random().toString(36).slice(2)}`;
            targetObject[key] = content;
            const keys = Object.keys(content);
            const shim = `
const m = (window.frameElement || window)['${key}'];
export const { ${keys.join(", ")} } = m;
export default m;
            `.trim();
            return {
                ...a,
                [filename]: 'data:text/javascript;charset=utf-8,' + encodeURIComponent(shim)
            }
        }
        return a;
    }, {});

    return Object.keys(imports).length === 0 ? "" :
        `<script type="importmap">${JSON.stringify({ imports })}</script>`;
}
