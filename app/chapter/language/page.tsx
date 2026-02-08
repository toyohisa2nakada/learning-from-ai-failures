"use client";

import Editor from "@/components/Editor";

export default function Home() {
  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto] gap-1 bg-inherit">
      {/* Action Section */}
      <section className="action-section">
        指令：言語モデル
      </section>

      {/* Main Content */}
      <main className="flex bg-inherit overflow-hidden">
        {/* Container: Flex Row on MD screens to put Left and Right side-by-side */}
        <div className="container-panel md:flex-row h-full">

          {/* Left Panel: Merged Height (Full Height of container) */}
          <div className="left-panel h-full flex flex-col">
            <h3 className="text-base font-bold mb-3">Left Panel (Merged)</h3>
            <Editor />
          </div>

          {/* Right Column Wrapper: Stacks Upper and Lower panels */}
          <div className="flex flex-col flex-1 gap-6 h-full min-w-0">
            {/* Upper Right Panel */}
            <div className="right-panel h-auto flex-1 flex flex-col">
              <h3 className="text-base font-bold mb-3">Upper Right</h3>
            </div>
            {/* Lower Right Panel */}
            <div className="right-panel h-auto flex-1 flex flex-col">
              <h3 className="text-base font-bold mb-3">Lower Right</h3>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
