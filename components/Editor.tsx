"use client";

import Editor from "@monaco-editor/react";

export default function App() {
    return (
        <Editor
            height="50vh"
            defaultLanguage="javascript"
            defaultValue="// hello world"
        />
    );
}
