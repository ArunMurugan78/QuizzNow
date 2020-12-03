document.addEventListener('DOMContentLoaded', function () {
    var menuCollapsed = false, mobileMenu = document.getElementById('mobile-menu');
    var localContextInUrl = '';
    if (COMPODOC_CURRENT_PAGE_CONTEXT !== '') {
        localContextInUrl = localContextInUrl;
        switch (COMPODOC_CURRENT_PAGE_CONTEXT) {
            case 'additional-page':
                localContextInUrl = 'additional-documentation';
                break;
            case 'class':
                localContextInUrl = 'classes';
                break;
            case 'miscellaneous-functions':
            case 'miscellaneous-variables':
            case 'miscellaneous-typealiases':
            case 'miscellaneous-enumerations':
                localContextInUrl = 'miscellaneous';
            default:
                break;
        }
    }
    function hasClass(el, cls) {
        return el.className && new RegExp('(\\s|^)' + cls + '(\\s|$)').test(el.className);
    }
    var processLink = function (link, url) {
        if (url.charAt(0) !== '.') {
            var prefix = '';
            switch (COMPODOC_CURRENT_PAGE_DEPTH) {
                case 5:
                    prefix = '../../../../../';
                    break;
                case 4:
                    prefix = '../../../../';
                    break;
                case 3:
                    prefix = '../../../';
                    break;
                case 2:
                    prefix = '../../';
                    break;
                case 1:
                    prefix = '../';
                    break;
                case 0:
                    prefix = './';
                    break;
            }
            link.setAttribute('href', prefix + url);
        }
    };
    var processMenuLinks = function (links, dontAddClass) {
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var linkHref = link.getAttribute('href');
            if (linkHref) {
                var linkHrefFile = linkHref.substr(linkHref.lastIndexOf('/') + 1, linkHref.length);
                if (linkHrefFile.toLowerCase() === COMPODOC_CURRENT_PAGE_URL.toLowerCase() &&
                    link.innerHTML.indexOf('Getting started') == -1 &&
                    !dontAddClass &&
                    linkHref.toLowerCase().indexOf(localContextInUrl.toLowerCase()) !== -1) {
                    link.classList.add('active');
                }
                processLink(link, linkHref);
            }
        }
    };
    var chapterLinks = document.querySelectorAll('[data-type="chapter-link"]');
    processMenuLinks(chapterLinks);
    var entityLinks = document.querySelectorAll('[data-type="entity-link"]');
    processMenuLinks(entityLinks);
    var indexLinks = document.querySelectorAll('[data-type="index-link"]');
    processMenuLinks(indexLinks, true);
    var entityLogos = document.querySelectorAll('[data-type="compodoc-logo"]');
    var processLogos = function (entityLogo) {
        for (var i = 0; i < entityLogos.length; i++) {
            var entityLogo = entityLogos[i];
            if (entityLogo) {
                var url = entityLogo.getAttribute('data-src');
                if (url.charAt(0) !== '.') {
                    var prefix = '';
                    switch (COMPODOC_CURRENT_PAGE_DEPTH) {
                        case 5:
                            prefix = '../../../../../';
                            break;
                        case 4:
                            prefix = '../../../../';
                            break;
                        case 3:
                            prefix = '../../../';
                            break;
                        case 2:
                            prefix = '../../';
                            break;
                        case 1:
                            prefix = '../';
                            break;
                        case 0:
                            prefix = './';
                            break;
                    }
                    entityLogo.src = prefix + url;
                }
            }
        }
    };
    processLogos(entityLogos);
    setTimeout(function () {
        document.getElementById('btn-menu').addEventListener('click', function () {
            if (menuCollapsed) {
                mobileMenu.style.display = 'none';
            }
            else {
                mobileMenu.style.display = 'block';
                document.getElementsByTagName('body')[0].style['overflow-y'] = 'hidden';
            }
            menuCollapsed = !menuCollapsed;
        });
        var Collapses = document.querySelectorAll('[data-toggle="collapse"]');
        for (var o = 0, cll = Collapses.length; o < cll; o++) {
            var collapse = Collapses[o], options = {};
            options.duration = collapse.getAttribute('data-duration');
            new Collapse(collapse, options);
        }
        var classnameMenuToggler = document.getElementsByClassName('menu-toggler'), faAngleUpClass = 'ion-ios-arrow-up', faAngleDownClass = 'ion-ios-arrow-down', toggleItemMenu = function (e) {
            var element = $(e.target), parent = element[0].parentNode, parentLink, elementIconChild;
            if (parent) {
                if (!$(parent).hasClass('linked')) {
                    e.preventDefault();
                }
                else {
                    parentLink = parent.parentNode;
                    if (parentLink && element.hasClass('link-name')) {
                        $(parentLink).trigger('click');
                    }
                }
                elementIconChild = parent.getElementsByClassName(faAngleUpClass)[0];
                if (!elementIconChild) {
                    elementIconChild = parent.getElementsByClassName(faAngleDownClass)[0];
                }
                if (elementIconChild) {
                    elementIconChild = $(elementIconChild);
                    if (elementIconChild.hasClass(faAngleUpClass)) {
                        elementIconChild.addClass(faAngleDownClass);
                        elementIconChild.removeClass(faAngleUpClass);
                    }
                    else {
                        elementIconChild.addClass(faAngleUpClass);
                        elementIconChild.removeClass(faAngleDownClass);
                    }
                }
            }
        };
        for (var i = 0; i < classnameMenuToggler.length; i++) {
            classnameMenuToggler[i].addEventListener('click', toggleItemMenu, false);
        }
        var menus = document.querySelectorAll('.menu'), i = 0, len = menus.length, activeMenu, activeMenuClass, activeLink;
        for (i; i < len; i++) {
            if (getComputedStyle(menus[i]).display != 'none') {
                activeMenu = menus[i];
                activeMenuClass = activeMenu.getAttribute('class').split(' ')[0];
            }
        }
        if (activeMenu) {
            activeLink = document.querySelector('.' + activeMenuClass + ' .active');
            if (activeLink) {
                var linkType = activeLink.getAttribute('data-type');
                var linkContext = activeLink.getAttribute('data-context');
                if (linkType === 'entity-link') {
                    var parentLi = activeLink.parentNode, parentUl, parentChapterMenu;
                    if (parentLi) {
                        parentUl = parentLi.parentNode;
                        if (parentUl) {
                            parentChapterMenu = parentUl.parentNode;
                            if (parentChapterMenu) {
                                var toggler = parentChapterMenu.querySelector('.menu-toggler'), elementIconChild = toggler.getElementsByClassName(faAngleUpClass)[0];
                                if (toggler && !elementIconChild) {
                                    toggler.click();
                                }
                            }
                        }
                    }
                    if (linkContext && linkContext === 'sub-entity') {
                        var linkContextId = activeLink.getAttribute('data-context-id');
                        var toggler = activeMenu.querySelector('.chapter.' + linkContextId + ' a .menu-toggler');
                        if (toggler) {
                            toggler.click();
                        }
                        if (linkContextId === 'additional') {
                            var mainToggler = activeMenu.querySelector('.chapter.' + linkContextId + ' div.menu-toggler');
                            if (mainToggler) {
                                mainToggler.click();
                            }
                        }
                    }
                }
                else if (linkType === 'chapter-link') {
                    var linkContextId = activeLink.getAttribute('data-context-id');
                    var toggler = activeLink.querySelector('.menu-toggler');
                    if (toggler) {
                        toggler.click();
                    }
                    if (linkContextId === 'additional') {
                        var mainToggler = activeMenu.querySelector('.chapter.' + linkContextId + ' div.menu-toggler');
                        if (mainToggler) {
                            mainToggler.click();
                        }
                    }
                }
                setTimeout(function () {
                    activeMenu.scrollTop = activeLink.offsetTop;
                    if (activeLink.innerHTML.toLowerCase().indexOf('readme') != -1 ||
                        activeLink.innerHTML.toLowerCase().indexOf('overview') != -1) {
                        activeMenu.scrollTop = 0;
                    }
                }, 300);
            }
        }
    }, 0);
});
//# sourceMappingURL=menu.js.map