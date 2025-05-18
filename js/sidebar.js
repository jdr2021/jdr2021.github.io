$(function () {
  // 切换 TOC 与作者信息的文本和状态
  $('.toggle-sidebar-info > span').on('click', function () {
    var toggleText = $(this).attr('data-toggle');
    $(this).attr('data-toggle', $(this).text());
    $(this).text(toggleText);
    changeSideBarInfo();
  });

  // 控制侧边栏展开/收起（仅桌面）
  $('#toggle-sidebar').on('click', function () {
    if (!isMobile() && $('#sidebar').is(':visible')) {
      var isOpen = $(this).hasClass('on');
      isOpen ? $(this).removeClass('on') : $(this).addClass('on');

      if (isOpen) {
        $('#page-header').removeClass('open-sidebar');
        $('body').velocity({ paddingLeft: '0px' }, { duration: 200 });
        $('#sidebar').velocity({ translateX: '0px' }, { duration: 200 });
        $('#toggle-sidebar').velocity({
          rotateZ: '0deg',
          color: '#1F2D3D'
        }, { duration: 200 });
      } else {
        $('#page-header').addClass('open-sidebar');
        $('body').velocity({ paddingLeft: '300px' }, { duration: 200 });
        $('#sidebar').velocity({ translateX: '300px' }, { duration: 200 });
        $('#toggle-sidebar').velocity({
          rotateZ: '180deg',
          color: '#99a9bf'
        }, { duration: 200 });
      }
    }
  });

  // 动画切换 TOC 与作者信息
  function changeSideBarInfo() {
    const $authorInfo = $('.author-info');
    const $sidebarToc = $('.sidebar-toc');

    if ($authorInfo.is(':visible')) {
      $authorInfo.velocity('stop')
          .velocity('transition.slideLeftOut', {
            duration: 300,
            complete: function () {
              $sidebarToc.velocity('stop')
                  .velocity('transition.slideRightIn', { duration: 500 });
            }
          });
    } else {
      $sidebarToc.velocity('stop')
          .velocity('transition.slideRightOut', {
            duration: 300,
            complete: function () {
              $authorInfo.velocity('stop')
                  .velocity('transition.slideLeftIn', { duration: 500 });
            }
          });
    }
  }
});