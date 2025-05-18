(function () {
    const ENCRYPTED_CONTENT_ID = 'encrypt-blog';
    const UNENCRYPTED_CONTENT_SELECTOR = '#post-content'; // 未加密文章内容容器
    const TOC_CONTAINER_SELECTOR = '.sidebar-toc__content';

    function generateTOCFromHTML(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const headers = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        let tocHTML = '<ol class="toc">';
        const counters = [0, 0, 0, 0, 0, 0]; // h1~h6 的计数器
        let currentLevel = 0; // 当前层级（从 1 开始）

        headers.forEach((header, index) => {
            const level = parseInt(header.tagName.charAt(1), 10);
            const id = header.id || '';
            const text = header.textContent;

            // 更新计数器
            counters[level - 1]++;
            for (let i = level; i < counters.length; i++) {
                counters[i] = 0;
            }

            // 生成编号（如 1, 1.1, 1.1.1）
            const number = counters.slice(0, level).join('.');

            // 嵌套结构处理
            while (level > currentLevel) {
                tocHTML += `<ol class="toc-child">`;
                currentLevel++;
            }
            while (level < currentLevel) {
                tocHTML += `</ol></li>`;
                currentLevel--;
            }

            // 添加当前标题
            tocHTML += `<li class="toc-item toc-level-${level}">
                  <a class="toc-link" href="#${id}" ${level === 1 ? 'data-toggle="collapse"' : ''}>
                    <span class="toc-number">${number}.</span>
                    <span class="toc-text">${text}</span>
                  </a>`;

            // 如果是最后一个标题，补全闭合标签
            if (index === headers.length - 1) {
                while (currentLevel > 0) {
                    tocHTML += `</ol></li>`;
                    currentLevel--;
                }
            }
        });

        // 补全剩余闭合标签
        while (currentLevel > 0) {
            tocHTML += `</ol></li>`;
            currentLevel--;
        }

        tocHTML += `</ol>`;
        return tocHTML;
    }

    function bindTocCollapseEvents() {
        $(document).on('click', '.toc-link[data-toggle="collapse"]', function (e) {
            e.preventDefault();
            const parentLi = $(this).closest('.toc-item');
            const childOl = parentLi.find('> ol.toc-child');
            childOl.toggle();
        });
    }

    function initEncryptedTOC() {
        const contentElement = document.getElementById(ENCRYPTED_CONTENT_ID);
        const tocContainer = document.querySelector(TOC_CONTAINER_SELECTOR);

        if (!contentElement || !tocContainer) return;

        const decryptedHTML = contentElement.innerHTML.trim();
        if (decryptedHTML === '') return;

        // 清空旧目录
        tocContainer.innerHTML = '';

        // 生成新目录
        tocContainer.innerHTML = generateTOCFromHTML(decryptedHTML);

        // 绑定点击事件：展开/折叠子目录
        bindTocCollapseEvents();

        // 默认展开所有子目录
        $('.toc-child').show();
    }

    function setupMutationObserverForEncrypted() {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const contentElement = document.getElementById(ENCRYPTED_CONTENT_ID);
                    const tocContainer = document.querySelector(TOC_CONTAINER_SELECTOR);

                    if (contentElement && tocContainer && contentElement.innerHTML.trim() !== '') {
                        observer.disconnect(); // 停止监听
                        initEncryptedTOC(); // 手动初始化
                        break;
                    }
                }
            }
        });

        const targetNode = document.getElementById(ENCRYPTED_CONTENT_ID);
        if (targetNode) {
            observer.observe(targetNode, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true
            });
        }
    }

    // 页面加载时初始化加密文章目录
    $(document).ready(function () {
        if (document.getElementById(ENCRYPTED_CONTENT_ID)) {
            setupMutationObserverForEncrypted();
        }
    });

    // 提供一个全局函数，供解密后调用
    window.generateTOCAfterDecrypt = function () {
        initEncryptedTOC();
    };
})();