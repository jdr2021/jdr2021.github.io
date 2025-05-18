(function () {
  const ENCRYPTED_CONTENT_ID = 'encrypt-blog';
  const UNENCRYPTED_CONTENT_SELECTOR = '#post-content';
  const TOC_CONTAINER_SELECTOR = '.sidebar-toc__content';

  // 初始化变量
  var initTop = 0;
  $('.toc-child').hide(); // 默认隐藏子目录

  // 节流函数
  function throttle(fn, delay, debounce) {
    var timer = null;
    return function () {
      var context = this,
          args = arguments;
      if (debounce) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(context, args), delay);
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          fn.apply(context, args);
        }, delay);
      }
    };
  }

  // 滚动方向判断
  function scrollDirection(currentTop) {
    var result = currentTop > initTop; // true: 向下, false: 向上
    initTop = currentTop;
    return result;
  }

  // 滚动到标题
  function scrollToHead(anchor) {
    var item;
    try {
      item = $(anchor);
    } catch (e) {
      item = $(decodeURI(anchor));
    }

    if (item.length === 0) {
      console.warn(`未找到锚点元素：${anchor}`);
      return;
    }

    try {
      // 使用 Velocity.js 平滑滚动
      $('html, body').velocity('stop').velocity('scroll', {
        duration: 500,
        easing: 'easeInOutQuart',
        offset: item.offset().top
      });
    } catch (error) {
      console.error('Velocity.js 未正确加载或调用失败', error);
      // 回退方案：使用原生 JS 滚动
      window.scrollTo({
        top: item.offset().top,
        behavior: 'smooth'
      });
    }
  }

  // 展开 toc-child
  function expandToc($item) {
    if ($item.is(':visible')) return;
    $item.velocity('stop').velocity('transition.fadeIn', {
      duration: 500,
      easing: 'easeInQuart'
    });
  }

  // 更新锚点
  function updateAnchor(anchor) {
    if (window.history.replaceState && anchor !== window.location.hash) {
      window.history.replaceState(undefined, undefined, anchor);
    }
  }

  // 查找当前滚动位置对应的标题
  function findHeadPosition(top) {
    if ($('.toc-link').length === 0) return;

    var list = $('#post-content').find('h1,h2,h3,h4,h5,h6');
    var currentId = '';

    list.each(function () {
      var head = $(this);
      if (top > head.offset().top - 25) {
        currentId = '#' + this.id;
      }
    });

    if (currentId === '') {
      $('.toc-link').removeClass('active');
      $('.toc-child').hide();
      return;
    }

    $('.toc-link').removeClass('active');
    var _this = $('.toc-link[href="' + currentId + '"]');
    _this.addClass('active');

    var parents = _this.parents('.toc-child');
    var topLink = parents.length > 0 ? parents.last() : _this;
    expandToc(topLink.closest('.toc-item').find('.toc-child'));

    topLink
        .closest('.toc-item')
        .siblings('.toc-item')
        .find('.toc-child')
        .hide();
  }

  // 滚动百分比
  function scrollPercent(currentTop) {
    var docHeight = $('#content-outer').height();
    var winHeight = $(window).height();
    var contentMath = (docHeight > winHeight) ? (docHeight - winHeight) : ($(document).height() - winHeight);
    var scrollPercent = (currentTop) / (contentMath);
    var scrollPercentRounded = Math.round(scrollPercent * 100);
    var percentage = (scrollPercentRounded > 100) ? 100 : (scrollPercentRounded <= 0) ? 0 : scrollPercentRounded;

    $('.progress-num').text(percentage);
    $('.sidebar-toc__progress-bar').velocity('stop')
        .velocity({
          width: percentage + '%'
        }, {
          duration: 100,
          easing: 'easeInOutQuart'
        });
  }

  // 主滚动事件
  function onScroll() {
    var currentTop = $(window).scrollTop();

    if (!isMobile()) {
      scrollPercent(currentTop);
      findHeadPosition(currentTop);
    }

    var isUp = scrollDirection(currentTop);

    if (currentTop > 56) {
      if (isUp) {
        $('#page-header').hasClass('visible') ? $('#page-header').removeClass('visible') : '';
      } else {
        $('#page-header').hasClass('visible') ? '' : $('#page-header').addClass('visible');
      }

      $('#page-header').addClass('fixed');

      if ($('#go-up').css('opacity') === '0') {
        $('#go-up').velocity('stop').velocity({
          translateX: -30,
          rotateZ: 360,
          opacity: 1
        }, {
          easing: 'easeOutQuart',
          duration: 200
        });
      }
    } else {
      if (currentTop === 0) {
        $('#page-header').removeClass('fixed').removeClass('visible');
      }

      $('#go-up').velocity('stop').velocity({
        translateX: 0,
        rotateZ: 180,
        opacity: 0
      }, {
        easing: 'linear',
        duration: 200
      });
    }
  }

  // 事件绑定（支持动态内容）
  function bindScrollEvents() {
    $(window).off('scroll', onScroll);
    $(window).on('scroll', throttle(onScroll, 50, 100));
    $(window).trigger('scroll'); // 初始化 active 状态
  }

  function bindTocLinkEvents() {
    $(document).off('click', '.toc-link', handleTocLinkClick);
    $(document).off('click', '#post-content h1,#post-content h2,#post-content h3,#post-content h4,#post-content h5,#post-content h6', handleHeadClick);
    $(document).on('click', '.toc-link', handleTocLinkClick);
    $(document).on('click', '#post-content h1,#post-content h2,#post-content h3,#post-content h4,#post-content h5,#post-content h6', handleHeadClick);
  }

  function handleTocLinkClick(e) {
    e.preventDefault();
    var href = $(this).attr('href');
    scrollToHead(href);
  }

  function handleHeadClick(e) {
    var id = $(this).attr('id');
    scrollToHead('#' + id);
  }

  // 生成目录（支持嵌套）
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

  // 初始化目录
  function initTOC() {
    const contentElement = document.getElementById(ENCRYPTED_CONTENT_ID) || document.querySelector(UNENCRYPTED_CONTENT_SELECTOR);
    const tocContainer = document.querySelector(TOC_CONTAINER_SELECTOR);

    if (!contentElement || !tocContainer) return;

    const htmlContent = contentElement.innerHTML.trim();
    if (htmlContent === '') return;

    // 清空旧目录
    tocContainer.innerHTML = '';

    // 生成新目录
    tocContainer.innerHTML = generateTOCFromHTML(htmlContent);

    // 绑定点击事件：展开/折叠子目录
    $(document).on('click', '.toc-link[data-toggle="collapse"]', function (e) {
      e.preventDefault();
      const parentLi = $(this).closest('.toc-item');
      const childOl = parentLi.find('> ol.toc-child');
      childOl.toggle();
    });

    // 默认展开所有子目录
    $('.toc-child').show();

    // 绑定事件
    bindScrollEvents();
    bindTocLinkEvents();

    // 初始化 active 状态
    $(window).trigger('scroll');
  }

  // 监听加密文章内容变化
  function setupMutationObserverForEncrypted() {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const contentElement = document.getElementById(ENCRYPTED_CONTENT_ID);
          const tocContainer = document.querySelector(TOC_CONTAINER_SELECTOR);

          if (contentElement && tocContainer && contentElement.innerHTML.trim() !== '') {
            observer.disconnect(); // 停止监听
            initTOC(); // 手动初始化
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

  // 页面加载时初始化
  $(function () {
    // 未加密文章直接初始化
    if (!document.getElementById(ENCRYPTED_CONTENT_ID)) {
      initTOC();
    }

    // 加密文章监听内容变化
    if (document.getElementById(ENCRYPTED_CONTENT_ID)) {
      setupMutationObserverForEncrypted();
    }

    // 提供一个全局函数，供解密后调用
    window.generateTOCAfterDecrypt = function () {
      initTOC();
    };
  });
})();