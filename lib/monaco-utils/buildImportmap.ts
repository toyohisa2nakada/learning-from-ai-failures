/**
 */
// filenameをキー、コードをvalueとしたjson
// ファイル名はjsだけが対応する。
export function buildImportmap(files: Record<string, string>) {
    const imports = Object.entries(files).filter(([k]) => k.endsWith(".js")).
        reduce((a, e) => ({ ...a, [e[0]]: 'data:text/javascript;charset=utf-8,' + encodeURIComponent(e[1]) }), {});
    return Object.keys(imports).length === 0 ? "" :
        `<script type="importmap">${JSON.stringify({ imports })}</script>`;
}
