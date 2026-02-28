/**
 * UnreadBadge Options Interface
 */
interface UnreadBadgeOptions {
    autoRemove?: boolean;
    dotColor?: string;
    badgeClass?: string;
}

/**
 * UnreadBadge Library
 * 指定したセレクタの要素に点滅する未読マークを付与するライブラリ
 */
const UnreadBadge = {
    /**
     * ライブラリに必要なスタイルをドキュメントに注入する
     */
    injectStyles: function (): void {
        if (document.getElementById('unread-badge-style')) return;

        const style = document.createElement('style');
        style.id = 'unread-badge-style';
        style.innerHTML = `
      .unread-dot-wrapper {
        position: relative !important;
      }
      .unread-dot {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 10;
        animation: unread-pulse 4.5s infinite;
      }
      @keyframes unread-pulse {
        0% { transform: scale(0.95); opacity: 0.8; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(0.95); opacity: 0.8; }
      }
    `;
        document.head.appendChild(style);
    },

    /**
     * 指定したセレクタの要素に未読マークを付与する
     * @param selector - CSSセレクタ
     * @param options - オプション
     */
    attach: function (
        selector: string,
        options: UnreadBadgeOptions = { autoRemove: true, dotColor: '#ff4d4d' }
    ): void {
        // スタイルの注入を確認
        this.injectStyles();

        const elements = document.querySelectorAll<HTMLElement>(selector);

        elements.forEach((el) => {
            // 既に付与済みならスキップ
            if (el.querySelector('.unread-dot')) return;

            // 親要素に相対配置を適用
            el.classList.add('unread-dot-wrapper');

            // ドット要素の作成
            const dot = document.createElement('div');
            dot.className = `unread-dot ${options.badgeClass || ''}`;

            const color = options.dotColor || '#ff4d4d';
            dot.style.backgroundColor = color;
            dot.style.boxShadow = `0 0 8px ${color}`;

            el.appendChild(dot);

            // クリックで削除する設定
            if (options.autoRemove) {
                const removeDot = (): void => {
                    dot.remove();
                    el.removeEventListener('click', removeDot);
                };
                el.addEventListener('click', removeDot);
            }
        });
    },
    detach: function (selector?: string): void {
        const dots = selector
            ? document.querySelectorAll(`${selector} .unread-dot`)
            : document.querySelectorAll('.unread-dot');

        dots.forEach((dot) => dot.remove());
    },
};

export default UnreadBadge;