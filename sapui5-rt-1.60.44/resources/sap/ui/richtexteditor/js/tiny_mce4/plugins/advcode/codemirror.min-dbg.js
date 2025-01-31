tinymce.codeMirrorLazyLoader.define("ephox.wrap.CodeMirror", [], function() {
    var e = window.CodeMirror;
    window.CodeMirror = void 0, function(e) {
        (this || window).CodeMirror = e();
    }(function() {
        "use strict";
        var e = navigator.userAgent, t = navigator.platform, n = /gecko\/\d/i.test(e), r = /MSIE \d/.test(e), i = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(e), o = r || i, l = o && (r ? document.documentMode || 6 : i[1]), s = /WebKit\//.test(e), a = s && /Qt\/\d+\.\d+/.test(e), c = /Chrome\//.test(e), u = /Opera\//.test(e), f = /Apple Computer/.test(navigator.vendor), h = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(e), d = /PhantomJS/.test(e), p = /AppleWebKit/.test(e) && /Mobile\/\w+/.test(e), g = p || /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(e), m = p || /Mac/.test(t), v = /win/i.test(t), y = u && e.match(/Version\/(\d*\.\d*)/);
        y && (y = Number(y[1])), y && y >= 15 && (u = !1, s = !0);
        var b = m && (a || u && (null == y || y < 12.11)), w = n || o && l >= 9, x = !1, C = !1;
        function S(e, t) {
            if (!(this instanceof S)) return new S(e, t);
            this.options = t = t ? yo(t) : {}, yo($n, t, !1), D(t);
            var r = t.value;
            "string" == typeof r && (r = new di(r, t.mode, null, t.lineSeparator)), this.doc = r;
            var i = new S.inputStyles[t.inputStyle](this), a = this.display = new function(e, t, r) {
                var i = this;
                this.input = r, i.scrollbarFiller = To("div", null, "CodeMirror-scrollbar-filler"), 
                i.scrollbarFiller.setAttribute("cm-not-content", "true"), i.gutterFiller = To("div", null, "CodeMirror-gutter-filler"), 
                i.gutterFiller.setAttribute("cm-not-content", "true"), i.lineDiv = To("div", null, "CodeMirror-code"), 
                i.selectionDiv = To("div", null, null, "position: relative; z-index: 1"), i.cursorDiv = To("div", null, "CodeMirror-cursors"), 
                i.measure = To("div", null, "CodeMirror-measure"), i.lineMeasure = To("div", null, "CodeMirror-measure"), 
                i.lineSpace = To("div", [ i.measure, i.lineMeasure, i.selectionDiv, i.cursorDiv, i.lineDiv ], null, "position: relative; outline: none"), 
                i.mover = To("div", [ To("div", [ i.lineSpace ], "CodeMirror-lines") ], null, "position: relative"), 
                i.sizer = To("div", [ i.mover ], "CodeMirror-sizer"), i.sizerWidth = null, i.heightForcer = To("div", null, null, "position: absolute; height: " + to + "px; width: 1px;"), 
                i.gutters = To("div", null, "CodeMirror-gutters"), i.lineGutter = null, i.scroller = To("div", [ i.sizer, i.heightForcer, i.gutters ], "CodeMirror-scroll"), 
                i.scroller.setAttribute("tabIndex", "-1"), i.wrapper = To("div", [ i.scrollbarFiller, i.gutterFiller, i.scroller ], "CodeMirror"), 
                o && l < 8 && (i.gutters.style.zIndex = -1, i.scroller.style.paddingRight = 0);
                s || n && g || (i.scroller.draggable = !0);
                e && (e.appendChild ? e.appendChild(i.wrapper) : e(i.wrapper));
                i.viewFrom = i.viewTo = t.first, i.reportedViewFrom = i.reportedViewTo = t.first, 
                i.view = [], i.renderedView = null, i.externalMeasured = null, i.viewOffset = 0, 
                i.lastWrapHeight = i.lastWrapWidth = 0, i.updateLineNumbers = null, i.nativeBarWidth = i.barHeight = i.barWidth = 0, 
                i.scrollbarsClipped = !1, i.lineNumWidth = i.lineNumInnerWidth = i.lineNumChars = null, 
                i.alignWidgets = !1, i.cachedCharWidth = i.cachedTextHeight = i.cachedPaddingH = null, 
                i.maxLine = null, i.maxLineLength = 0, i.maxLineChanged = !1, i.wheelDX = i.wheelDY = i.wheelStartX = i.wheelStartY = null, 
                i.shift = !1, i.selForContextMenu = null, i.activeTouch = null, r.init(i);
            }(e, r, i);
            a.wrapper.CodeMirror = this, A(this), N(this), t.lineWrapping && (this.display.wrapper.className += " CodeMirror-wrap"), 
            t.autofocus && !g && a.input.focus(), z(this), this.state = {
                keyMaps: [],
                overlays: [],
                modeGen: 0,
                overwrite: !1,
                delayingBlurEvent: !1,
                focused: !1,
                suppressEdits: !1,
                pasteIncoming: !1,
                cutIncoming: !1,
                selectingText: !1,
                draggingText: !1,
                highlight: new lo(),
                keySeq: null,
                specialChars: null
            };
            var c = this;
            for (var h in o && l < 11 && setTimeout(function() {
                c.display.input.reset(!0);
            }, 20), function(e) {
                var t = e.display;
                Ki(t.scroller, "mousedown", _t(e, sn)), Ki(t.scroller, "dblclick", o && l < 11 ? _t(e, function(t) {
                    if (!Zi(e, t)) {
                        var n = ln(e, t);
                        if (n && !cn(e, t) && !on(e.display, t)) {
                            Ei(t);
                            var r = e.findWordAt(n);
                            Re(e.doc, r.anchor, r.head);
                        }
                    }
                }) : function(t) {
                    Zi(e, t) || Ei(t);
                });
                w || Ki(t.scroller, "contextmenu", function(t) {
                    On(e, t);
                });
                var n, r = {
                    end: 0
                };
                function i() {
                    t.activeTouch && (n = setTimeout(function() {
                        t.activeTouch = null;
                    }, 1e3), (r = t.activeTouch).end = +new Date());
                }
                function s(e, t) {
                    if (null == t.left) return !0;
                    var n = t.left - e.left, r = t.top - e.top;
                    return n * n + r * r > 400;
                }
                Ki(t.scroller, "touchstart", function(i) {
                    if (!Zi(e, i) && !function(e) {
                        if (1 != e.touches.length) return !1;
                        var t = e.touches[0];
                        return t.radiusX <= 1 && t.radiusY <= 1;
                    }(i)) {
                        clearTimeout(n);
                        var o = +new Date();
                        t.activeTouch = {
                            start: o,
                            moved: !1,
                            prev: o - r.end <= 300 ? r : null
                        }, 1 == i.touches.length && (t.activeTouch.left = i.touches[0].pageX, t.activeTouch.top = i.touches[0].pageY);
                    }
                }), Ki(t.scroller, "touchmove", function() {
                    t.activeTouch && (t.activeTouch.moved = !0);
                }), Ki(t.scroller, "touchend", function(n) {
                    var r = t.activeTouch;
                    if (r && !on(t, n) && null != r.left && !r.moved && new Date() - r.start < 300) {
                        var o, l = e.coordsChar(t.activeTouch, "page");
                        o = !r.prev || s(r, r.prev) ? new We(l, l) : !r.prev.prev || s(r, r.prev.prev) ? e.findWordAt(l) : new We(fe(l.line, 0), Pe(e.doc, fe(l.line + 1, 0))), 
                        e.setSelection(o.anchor, o.head), e.focus(), Ei(n);
                    }
                    i();
                }), Ki(t.scroller, "touchcancel", i), Ki(t.scroller, "scroll", function() {
                    t.scroller.clientHeight && (dn(e, t.scroller.scrollTop), pn(e, t.scroller.scrollLeft, !0), 
                    qi(e, "scroll", e));
                }), Ki(t.scroller, "mousewheel", function(t) {
                    yn(e, t);
                }), Ki(t.scroller, "DOMMouseScroll", function(t) {
                    yn(e, t);
                }), Ki(t.wrapper, "scroll", function() {
                    t.wrapper.scrollTop = t.wrapper.scrollLeft = 0;
                }), t.dragFunctions = {
                    enter: function(t) {
                        Zi(e, t) || Bi(t);
                    },
                    over: function(t) {
                        Zi(e, t) || (!function(e, t) {
                            var n = ln(e, t);
                            if (!n) return;
                            var r = document.createDocumentFragment();
                            et(e, n, r), e.display.dragCursor || (e.display.dragCursor = To("div", null, "CodeMirror-cursors CodeMirror-dragcursors"), 
                            e.display.lineSpace.insertBefore(e.display.dragCursor, e.display.cursorDiv));
                            Oo(e.display.dragCursor, r);
                        }(e, t), Bi(t));
                    },
                    start: function(t) {
                        !function(e, t) {
                            if (o && (!e.state.draggingText || +new Date() - un < 100)) return void Bi(t);
                            if (Zi(e, t) || on(e.display, t)) return;
                            if (t.dataTransfer.setData("Text", e.getSelection()), t.dataTransfer.setDragImage && !f) {
                                var n = To("img", null, null, "position: fixed; left: 0; top: 0;");
                                n.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", 
                                u && (n.width = n.height = 1, e.display.wrapper.appendChild(n), n._top = n.offsetTop), 
                                t.dataTransfer.setDragImage(n, 0, 0), u && n.parentNode.removeChild(n);
                            }
                        }(e, t);
                    },
                    drop: _t(e, fn),
                    leave: function(t) {
                        Zi(e, t) || hn(e);
                    }
                };
                var a = t.input.getField();
                Ki(a, "keyup", function(t) {
                    Ln.call(e, t);
                }), Ki(a, "keydown", _t(e, kn)), Ki(a, "keypress", _t(e, Mn)), Ki(a, "focus", bo(Tn, e)), 
                Ki(a, "blur", bo(Nn, e));
            }(this), function() {
                if (Eo) return;
                Ki(window, "resize", function() {
                    null == e && (e = setTimeout(function() {
                        e = null, Io(rn);
                    }, 100));
                }), Ki(window, "blur", function() {
                    Io(Nn);
                }), Eo = !0;
                var e;
            }(), Rt(this), this.curOp.forceUpdate = !0, vi(this, r), t.autofocus && !g || c.hasFocus() ? setTimeout(bo(Tn, this), 20) : Nn(this), 
            Zn) Zn.hasOwnProperty(h) && Zn[h](this, t[h], Jn);
            K(this), t.finishInit && t.finishInit(this);
            for (var d = 0; d < rr.length; ++d) rr[d](this);
            Bt(this), s && t.lineWrapping && "optimizelegibility" == getComputedStyle(a.lineDiv).textRendering && (a.lineDiv.style.textRendering = "auto");
        }
        function k(e) {
            e.doc.mode = S.getMode(e.options, e.doc.modeOption), L(e);
        }
        function L(e) {
            e.doc.iter(function(e) {
                e.stateAfter && (e.stateAfter = null), e.styles && (e.styles = null);
            }), e.doc.frontier = e.doc.first, rt(e, 100), e.state.modeGen++, e.curOp && Zt(e);
        }
        function M(e) {
            var t = Ht(e.display), n = e.options.lineWrapping, r = n && Math.max(5, e.display.scroller.clientWidth / Dt(e.display) - 3);
            return function(i) {
                if (Rr(e.doc, i)) return 0;
                var o = 0;
                if (i.widgets) for (var l = 0; l < i.widgets.length; l++) i.widgets[l].height && (o += i.widgets[l].height);
                return n ? o + (Math.ceil(i.text.length / r) || 1) * t : o + t;
            };
        }
        function T(e) {
            var t = e.doc, n = M(e);
            t.iter(function(e) {
                var t = n(e);
                t != e.height && xi(e, t);
            });
        }
        function N(e) {
            e.display.wrapper.className = e.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") + e.options.theme.replace(/(^|\s)\s*/g, " cm-s-"), 
            Ct(e);
        }
        function O(e) {
            A(e), Zt(e), setTimeout(function() {
                G(e);
            }, 20);
        }
        function A(e) {
            var t = e.display.gutters, n = e.options.gutters;
            No(t);
            for (var r = 0; r < n.length; ++r) {
                var i = n[r], o = t.appendChild(To("div", null, "CodeMirror-gutter " + i));
                "CodeMirror-linenumbers" == i && (e.display.lineGutter = o, o.style.width = (e.display.lineNumWidth || 1) + "px");
            }
            t.style.display = r ? "" : "none", W(e);
        }
        function W(e) {
            var t = e.display.gutters.offsetWidth;
            e.display.sizer.style.marginLeft = t + "px";
        }
        function F(e) {
            if (0 == e.height) return 0;
            for (var t, n = e.text.length, r = e; t = Hr(r); ) {
                r = (i = t.find(0, !0)).from.line, n += i.from.ch - i.to.ch;
            }
            for (r = e; t = Dr(r); ) {
                var i = t.find(0, !0);
                n -= r.text.length - i.from.ch, n += (r = i.to.line).text.length - i.to.ch;
            }
            return n;
        }
        function H(e) {
            var t = e.display, n = e.doc;
            t.maxLine = yi(n, n.first), t.maxLineLength = F(t.maxLine), t.maxLineChanged = !0, 
            n.iter(function(e) {
                var n = F(e);
                n > t.maxLineLength && (t.maxLineLength = n, t.maxLine = e);
            });
        }
        function D(e) {
            var t = po(e.gutters, "CodeMirror-linenumbers");
            -1 == t && e.lineNumbers ? e.gutters = e.gutters.concat([ "CodeMirror-linenumbers" ]) : t > -1 && !e.lineNumbers && (e.gutters = e.gutters.slice(0), 
            e.gutters.splice(t, 1));
        }
        function P(e) {
            var t = e.display, n = t.gutters.offsetWidth, r = Math.round(e.doc.height + st(e.display));
            return {
                clientHeight: t.scroller.clientHeight,
                viewHeight: t.wrapper.clientHeight,
                scrollWidth: t.scroller.scrollWidth,
                clientWidth: t.scroller.clientWidth,
                viewWidth: t.wrapper.clientWidth,
                barLeft: e.options.fixedGutter ? n : 0,
                docHeight: r,
                scrollHeight: r + ct(e) + t.barHeight,
                nativeBarWidth: t.nativeBarWidth,
                gutterWidth: n
            };
        }
        function I(e, t, n) {
            this.cm = n;
            var r = this.vert = To("div", [ To("div", null, null, "min-width: 1px") ], "CodeMirror-vscrollbar"), i = this.horiz = To("div", [ To("div", null, null, "height: 100%; min-height: 1px") ], "CodeMirror-hscrollbar");
            e(r), e(i), Ki(r, "scroll", function() {
                r.clientHeight && t(r.scrollTop, "vertical");
            }), Ki(i, "scroll", function() {
                i.clientWidth && t(i.scrollLeft, "horizontal");
            }), this.checkedZeroWidth = !1, o && l < 8 && (this.horiz.style.minHeight = this.vert.style.minWidth = "18px");
        }
        function E() {}
        function z(e) {
            e.display.scrollbars && (e.display.scrollbars.clear(), e.display.scrollbars.addClass && Ho(e.display.wrapper, e.display.scrollbars.addClass)), 
            e.display.scrollbars = new S.scrollbarModel[e.options.scrollbarStyle](function(t) {
                e.display.wrapper.insertBefore(t, e.display.scrollbarFiller), Ki(t, "mousedown", function() {
                    e.state.focused && setTimeout(function() {
                        e.display.input.focus();
                    }, 0);
                }), t.setAttribute("cm-not-content", "true");
            }, function(t, n) {
                "horizontal" == n ? pn(e, t) : dn(e, t);
            }, e), e.display.scrollbars.addClass && Do(e.display.wrapper, e.display.scrollbars.addClass);
        }
        function R(e, t) {
            t || (t = P(e));
            var n = e.display.barWidth, r = e.display.barHeight;
            B(e, t);
            for (var i = 0; i < 4 && n != e.display.barWidth || r != e.display.barHeight; i++) n != e.display.barWidth && e.options.lineWrapping && Z(e), 
            B(e, P(e)), n = e.display.barWidth, r = e.display.barHeight;
        }
        function B(e, t) {
            var n = e.display, r = n.scrollbars.update(t);
            n.sizer.style.paddingRight = (n.barWidth = r.right) + "px", n.sizer.style.paddingBottom = (n.barHeight = r.bottom) + "px", 
            n.heightForcer.style.borderBottom = r.bottom + "px solid transparent", r.right && r.bottom ? (n.scrollbarFiller.style.display = "block", 
            n.scrollbarFiller.style.height = r.bottom + "px", n.scrollbarFiller.style.width = r.right + "px") : n.scrollbarFiller.style.display = "", 
            r.bottom && e.options.coverGutterNextToScrollbar && e.options.fixedGutter ? (n.gutterFiller.style.display = "block", 
            n.gutterFiller.style.height = r.bottom + "px", n.gutterFiller.style.width = t.gutterWidth + "px") : n.gutterFiller.style.display = "";
        }
        function U(e, t, n) {
            var r = n && null != n.top ? Math.max(0, n.top) : e.scroller.scrollTop;
            r = Math.floor(r - lt(e));
            var i = n && null != n.bottom ? n.bottom : r + e.wrapper.clientHeight, o = Si(t, r), l = Si(t, i);
            if (n && n.ensure) {
                var s = n.ensure.from.line, a = n.ensure.to.line;
                s < o ? (o = s, l = Si(t, ki(yi(t, s)) + e.wrapper.clientHeight)) : Math.min(a, t.lastLine()) >= l && (o = Si(t, ki(yi(t, a)) - e.wrapper.clientHeight), 
                l = a);
            }
            return {
                from: o,
                to: Math.max(l, o + 1)
            };
        }
        function G(e) {
            var t = e.display, n = t.view;
            if (t.alignWidgets || t.gutters.firstChild && e.options.fixedGutter) {
                for (var r = j(t) - t.scroller.scrollLeft + e.doc.scrollLeft, i = t.gutters.offsetWidth, o = r + "px", l = 0; l < n.length; l++) if (!n[l].hidden) {
                    e.options.fixedGutter && n[l].gutter && (n[l].gutter.style.left = o);
                    var s = n[l].alignable;
                    if (s) for (var a = 0; a < s.length; a++) s[a].style.left = o;
                }
                e.options.fixedGutter && (t.gutters.style.left = r + i + "px");
            }
        }
        function K(e) {
            if (!e.options.lineNumbers) return !1;
            var t = e.doc, n = V(e.options, t.first + t.size - 1), r = e.display;
            if (n.length != r.lineNumChars) {
                var i = r.measure.appendChild(To("div", [ To("div", n) ], "CodeMirror-linenumber CodeMirror-gutter-elt")), o = i.firstChild.offsetWidth, l = i.offsetWidth - o;
                return r.lineGutter.style.width = "", r.lineNumInnerWidth = Math.max(o, r.lineGutter.offsetWidth - l) + 1, 
                r.lineNumWidth = r.lineNumInnerWidth + l, r.lineNumChars = r.lineNumInnerWidth ? n.length : -1, 
                r.lineGutter.style.width = r.lineNumWidth + "px", W(e), !0;
            }
            return !1;
        }
        function V(e, t) {
            return String(e.lineNumberFormatter(t + e.firstLineNumber));
        }
        function j(e) {
            return e.scroller.getBoundingClientRect().left - e.sizer.getBoundingClientRect().left;
        }
        function _(e, t, n) {
            var r = e.display;
            this.viewport = t, this.visible = U(r, e.doc, t), this.editorIsHidden = !r.wrapper.offsetWidth, 
            this.wrapperHeight = r.wrapper.clientHeight, this.wrapperWidth = r.wrapper.clientWidth, 
            this.oldDisplayWidth = ut(e), this.force = n, this.dims = J(e), this.events = [];
        }
        function q(e, t) {
            var n = e.display, r = e.doc;
            if (t.editorIsHidden) return Jt(e), !1;
            if (!t.force && t.visible.from >= n.viewFrom && t.visible.to <= n.viewTo && (null == n.updateLineNumbers || n.updateLineNumbers >= n.viewTo) && n.renderedView == n.view && 0 == nn(e)) return !1;
            K(e) && (Jt(e), t.dims = J(e));
            var i = r.first + r.size, o = Math.max(t.visible.from - e.options.viewportMargin, r.first), l = Math.min(i, t.visible.to + e.options.viewportMargin);
            n.viewFrom < o && o - n.viewFrom < 20 && (o = Math.max(r.first, n.viewFrom)), n.viewTo > l && n.viewTo - l < 20 && (l = Math.min(i, n.viewTo)), 
            C && (o = Er(e.doc, o), l = zr(e.doc, l));
            var a = o != n.viewFrom || l != n.viewTo || n.lastWrapHeight != t.wrapperHeight || n.lastWrapWidth != t.wrapperWidth;
            !function(e, t, n) {
                var r = e.display;
                0 == r.view.length || t >= r.viewTo || n <= r.viewFrom ? (r.view = $t(e, t, n), 
                r.viewFrom = t) : (r.viewFrom > t ? r.view = $t(e, t, r.viewFrom).concat(r.view) : r.viewFrom < t && (r.view = r.view.slice(en(e, t))), 
                r.viewFrom = t, r.viewTo < n ? r.view = r.view.concat($t(e, r.viewTo, n)) : r.viewTo > n && (r.view = r.view.slice(0, en(e, n))));
                r.viewTo = n;
            }(e, o, l), n.viewOffset = ki(yi(e.doc, n.viewFrom)), e.display.mover.style.top = n.viewOffset + "px";
            var c = nn(e);
            if (!a && 0 == c && !t.force && n.renderedView == n.view && (null == n.updateLineNumbers || n.updateLineNumbers >= n.viewTo)) return !1;
            var u = Wo();
            return c > 4 && (n.lineDiv.style.display = "none"), function(e, t, n) {
                var r = e.display, i = e.options.lineNumbers, o = r.lineDiv, l = o.firstChild;
                function a(t) {
                    var n = t.nextSibling;
                    return s && m && e.display.currentWheelTarget == t ? t.style.display = "none" : t.parentNode.removeChild(t), 
                    n;
                }
                for (var c = r.view, u = r.viewFrom, f = 0; f < c.length; f++) {
                    var h = c[f];
                    if (h.hidden) ; else if (h.node && h.node.parentNode == o) {
                        for (;l != h.node; ) l = a(l);
                        var d = i && null != t && t <= u && h.lineNumber;
                        h.changes && (po(h.changes, "gutter") > -1 && (d = !1), ee(e, h, u, n)), d && (No(h.lineNumber), 
                        h.lineNumber.appendChild(document.createTextNode(V(e.options, u)))), l = h.node.nextSibling;
                    } else {
                        var p = se(e, h, u, n);
                        o.insertBefore(p, l);
                    }
                    u += h.size;
                }
                for (;l; ) l = a(l);
            }(e, n.updateLineNumbers, t.dims), c > 4 && (n.lineDiv.style.display = ""), n.renderedView = n.view, 
            u && Wo() != u && u.offsetHeight && u.focus(), No(n.cursorDiv), No(n.selectionDiv), 
            n.gutters.style.height = n.sizer.style.minHeight = 0, a && (n.lastWrapHeight = t.wrapperHeight, 
            n.lastWrapWidth = t.wrapperWidth, rt(e, 400)), n.updateLineNumbers = null, !0;
        }
        function X(e, t) {
            for (var n = t.viewport, r = !0; (r && e.options.lineWrapping && t.oldDisplayWidth != ut(e) || (n && null != n.top && (n = {
                top: Math.min(e.doc.height + st(e.display) - ft(e), n.top)
            }), t.visible = U(e.display, e.doc, n), !(t.visible.from >= e.display.viewFrom && t.visible.to <= e.display.viewTo))) && q(e, t); r = !1) {
                Z(e);
                var i = P(e);
                Qe(e), R(e, i), $(e, i);
            }
            t.signal(e, "update", e), e.display.viewFrom == e.display.reportedViewFrom && e.display.viewTo == e.display.reportedViewTo || (t.signal(e, "viewportChange", e, e.display.viewFrom, e.display.viewTo), 
            e.display.reportedViewFrom = e.display.viewFrom, e.display.reportedViewTo = e.display.viewTo);
        }
        function Y(e, t) {
            var n = new _(e, t);
            if (q(e, n)) {
                Z(e), X(e, n);
                var r = P(e);
                Qe(e), R(e, r), $(e, r), n.finish();
            }
        }
        function $(e, t) {
            e.display.sizer.style.minHeight = t.docHeight + "px", e.display.heightForcer.style.top = t.docHeight + "px", 
            e.display.gutters.style.height = t.docHeight + e.display.barHeight + ct(e) + "px";
        }
        function Z(e) {
            for (var t = e.display, n = t.lineDiv.offsetTop, r = 0; r < t.view.length; r++) {
                var i, s = t.view[r];
                if (!s.hidden) {
                    if (o && l < 8) {
                        var a = s.node.offsetTop + s.node.offsetHeight;
                        i = a - n, n = a;
                    } else {
                        var c = s.node.getBoundingClientRect();
                        i = c.bottom - c.top;
                    }
                    var u = s.line.height - i;
                    if (i < 2 && (i = Ht(t)), (u > .001 || u < -.001) && (xi(s.line, i), Q(s.line), 
                    s.rest)) for (var f = 0; f < s.rest.length; f++) Q(s.rest[f]);
                }
            }
        }
        function Q(e) {
            if (e.widgets) for (var t = 0; t < e.widgets.length; ++t) e.widgets[t].height = e.widgets[t].node.parentNode.offsetHeight;
        }
        function J(e) {
            for (var t = e.display, n = {}, r = {}, i = t.gutters.clientLeft, o = t.gutters.firstChild, l = 0; o; o = o.nextSibling, 
            ++l) n[e.options.gutters[l]] = o.offsetLeft + o.clientLeft + i, r[e.options.gutters[l]] = o.clientWidth;
            return {
                fixedPos: j(t),
                gutterTotalWidth: t.gutters.offsetWidth,
                gutterLeft: n,
                gutterWidth: r,
                wrapperWidth: t.wrapper.clientWidth
            };
        }
        function ee(e, t, n, r) {
            for (var i = 0; i < t.changes.length; i++) {
                var o = t.changes[i];
                "text" == o ? re(e, t) : "gutter" == o ? oe(e, t, n, r) : "class" == o ? ie(t) : "widget" == o && le(e, t, r);
            }
            t.changes = null;
        }
        function te(e) {
            return e.node == e.text && (e.node = To("div", null, null, "position: relative"), 
            e.text.parentNode && e.text.parentNode.replaceChild(e.node, e.text), e.node.appendChild(e.text), 
            o && l < 8 && (e.node.style.zIndex = 2)), e.node;
        }
        function ne(e, t) {
            var n = e.display.externalMeasured;
            return n && n.line == t.line ? (e.display.externalMeasured = null, t.measure = n.measure, 
            n.built) : ni(e, t);
        }
        function re(e, t) {
            var n = t.text.className, r = ne(e, t);
            t.text == t.node && (t.node = r.pre), t.text.parentNode.replaceChild(r.pre, t.text), 
            t.text = r.pre, r.bgClass != t.bgClass || r.textClass != t.textClass ? (t.bgClass = r.bgClass, 
            t.textClass = r.textClass, ie(t)) : n && (t.text.className = n);
        }
        function ie(e) {
            !function(e) {
                var t = e.bgClass ? e.bgClass + " " + (e.line.bgClass || "") : e.line.bgClass;
                if (t && (t += " CodeMirror-linebackground"), e.background) t ? e.background.className = t : (e.background.parentNode.removeChild(e.background), 
                e.background = null); else if (t) {
                    var n = te(e);
                    e.background = n.insertBefore(To("div", null, t), n.firstChild);
                }
            }(e), e.line.wrapClass ? te(e).className = e.line.wrapClass : e.node != e.text && (e.node.className = "");
            var t = e.textClass ? e.textClass + " " + (e.line.textClass || "") : e.line.textClass;
            e.text.className = t || "";
        }
        function oe(e, t, n, r) {
            if (t.gutter && (t.node.removeChild(t.gutter), t.gutter = null), t.gutterBackground && (t.node.removeChild(t.gutterBackground), 
            t.gutterBackground = null), t.line.gutterClass) {
                var i = te(t);
                t.gutterBackground = To("div", null, "CodeMirror-gutter-background " + t.line.gutterClass, "left: " + (e.options.fixedGutter ? r.fixedPos : -r.gutterTotalWidth) + "px; width: " + r.gutterTotalWidth + "px"), 
                i.insertBefore(t.gutterBackground, t.text);
            }
            var o = t.line.gutterMarkers;
            if (e.options.lineNumbers || o) {
                i = te(t);
                var l = t.gutter = To("div", null, "CodeMirror-gutter-wrapper", "left: " + (e.options.fixedGutter ? r.fixedPos : -r.gutterTotalWidth) + "px");
                if (e.display.input.setUneditable(l), i.insertBefore(l, t.text), t.line.gutterClass && (l.className += " " + t.line.gutterClass), 
                !e.options.lineNumbers || o && o["CodeMirror-linenumbers"] || (t.lineNumber = l.appendChild(To("div", V(e.options, n), "CodeMirror-linenumber CodeMirror-gutter-elt", "left: " + r.gutterLeft["CodeMirror-linenumbers"] + "px; width: " + e.display.lineNumInnerWidth + "px"))), 
                o) for (var s = 0; s < e.options.gutters.length; ++s) {
                    var a = e.options.gutters[s], c = o.hasOwnProperty(a) && o[a];
                    c && l.appendChild(To("div", [ c ], "CodeMirror-gutter-elt", "left: " + r.gutterLeft[a] + "px; width: " + r.gutterWidth[a] + "px"));
                }
            }
        }
        function le(e, t, n) {
            t.alignable && (t.alignable = null);
            for (var r = t.node.firstChild; r; r = i) {
                var i = r.nextSibling;
                "CodeMirror-linewidget" == r.className && t.node.removeChild(r);
            }
            ae(e, t, n);
        }
        function se(e, t, n, r) {
            var i = ne(e, t);
            return t.text = t.node = i.pre, i.bgClass && (t.bgClass = i.bgClass), i.textClass && (t.textClass = i.textClass), 
            ie(t), oe(e, t, n, r), ae(e, t, r), t.node;
        }
        function ae(e, t, n) {
            if (ce(e, t.line, t, n, !0), t.rest) for (var r = 0; r < t.rest.length; r++) ce(e, t.rest[r], t, n, !1);
        }
        function ce(e, t, n, r, i) {
            if (t.widgets) for (var o = te(n), l = 0, s = t.widgets; l < s.length; ++l) {
                var a = s[l], c = To("div", [ a.node ], "CodeMirror-linewidget");
                a.handleMouseEvents || c.setAttribute("cm-ignore-events", "true"), ue(a, c, n, r), 
                e.display.input.setUneditable(c), i && a.above ? o.insertBefore(c, n.gutter || n.text) : o.appendChild(c), 
                Yi(a, "redraw");
            }
        }
        function ue(e, t, n, r) {
            if (e.noHScroll) {
                (n.alignable || (n.alignable = [])).push(t);
                var i = r.wrapperWidth;
                t.style.left = r.fixedPos + "px", e.coverGutter || (i -= r.gutterTotalWidth, t.style.paddingLeft = r.gutterTotalWidth + "px"), 
                t.style.width = i + "px";
            }
            e.coverGutter && (t.style.zIndex = 5, t.style.position = "relative", e.noHScroll || (t.style.marginLeft = -r.gutterTotalWidth + "px"));
        }
        I.prototype = yo({
            update: function(e) {
                var t = e.scrollWidth > e.clientWidth + 1, n = e.scrollHeight > e.clientHeight + 1, r = e.nativeBarWidth;
                if (n) {
                    this.vert.style.display = "block", this.vert.style.bottom = t ? r + "px" : "0";
                    var i = e.viewHeight - (t ? r : 0);
                    this.vert.firstChild.style.height = Math.max(0, e.scrollHeight - e.clientHeight + i) + "px";
                } else this.vert.style.display = "", this.vert.firstChild.style.height = "0";
                if (t) {
                    this.horiz.style.display = "block", this.horiz.style.right = n ? r + "px" : "0", 
                    this.horiz.style.left = e.barLeft + "px";
                    var o = e.viewWidth - e.barLeft - (n ? r : 0);
                    this.horiz.firstChild.style.width = e.scrollWidth - e.clientWidth + o + "px";
                } else this.horiz.style.display = "", this.horiz.firstChild.style.width = "0";
                return !this.checkedZeroWidth && e.clientHeight > 0 && (0 == r && this.zeroWidthHack(), 
                this.checkedZeroWidth = !0), {
                    right: n ? r : 0,
                    bottom: t ? r : 0
                };
            },
            setScrollLeft: function(e) {
                this.horiz.scrollLeft != e && (this.horiz.scrollLeft = e), this.disableHoriz && this.enableZeroWidthBar(this.horiz, this.disableHoriz);
            },
            setScrollTop: function(e) {
                this.vert.scrollTop != e && (this.vert.scrollTop = e), this.disableVert && this.enableZeroWidthBar(this.vert, this.disableVert);
            },
            zeroWidthHack: function() {
                var e = m && !h ? "12px" : "18px";
                this.horiz.style.height = this.vert.style.width = e, this.horiz.style.pointerEvents = this.vert.style.pointerEvents = "none", 
                this.disableHoriz = new lo(), this.disableVert = new lo();
            },
            enableZeroWidthBar: function(e, t) {
                e.style.pointerEvents = "auto", t.set(1e3, function n() {
                    var r = e.getBoundingClientRect();
                    document.elementFromPoint(r.left + 1, r.bottom - 1) != e ? e.style.pointerEvents = "none" : t.set(1e3, n);
                });
            },
            clear: function() {
                var e = this.horiz.parentNode;
                e.removeChild(this.horiz), e.removeChild(this.vert);
            }
        }, I.prototype), E.prototype = yo({
            update: function() {
                return {
                    bottom: 0,
                    right: 0
                };
            },
            setScrollLeft: function() {},
            setScrollTop: function() {},
            clear: function() {}
        }, E.prototype), S.scrollbarModel = {
            native: I,
            null: E
        }, _.prototype.signal = function(e, t) {
            Ji(e, t) && this.events.push(arguments);
        }, _.prototype.finish = function() {
            for (var e = 0; e < this.events.length; e++) qi.apply(null, this.events[e]);
        };
        var fe = S.Pos = function(e, t) {
            if (!(this instanceof fe)) return new fe(e, t);
            this.line = e, this.ch = t;
        }, he = S.cmpPos = function(e, t) {
            return e.line - t.line || e.ch - t.ch;
        };
        function de(e) {
            return fe(e.line, e.ch);
        }
        function pe(e, t) {
            return he(e, t) < 0 ? t : e;
        }
        function ge(e, t) {
            return he(e, t) < 0 ? e : t;
        }
        function me(e) {
            e.state.focused || (e.display.input.focus(), Tn(e));
        }
        var ve = null;
        function ye(e, t, n, r, i) {
            var o = e.doc;
            e.display.shift = !1, r || (r = o.sel);
            var l = e.state.pasteIncoming || "paste" == i, s = o.splitLines(t), a = null;
            if (l && r.ranges.length > 1) if (ve && ve.join("\n") == t) {
                if (r.ranges.length % ve.length == 0) {
                    a = [];
                    for (var c = 0; c < ve.length; c++) a.push(o.splitLines(ve[c]));
                }
            } else s.length == r.ranges.length && (a = go(s, function(e) {
                return [ e ];
            }));
            for (c = r.ranges.length - 1; c >= 0; c--) {
                var u = r.ranges[c], f = u.from(), h = u.to();
                u.empty() && (n && n > 0 ? f = fe(f.line, f.ch - n) : e.state.overwrite && !l && (h = fe(h.line, Math.min(yi(o, h.line).text.length, h.ch + fo(s).length))));
                var d = e.curOp.updateInput, p = {
                    from: f,
                    to: h,
                    text: a ? a[c % a.length] : s,
                    origin: i || (l ? "paste" : e.state.cutIncoming ? "cut" : "+input")
                };
                Pn(e.doc, p), Yi(e, "inputRead", e, p);
            }
            t && !l && we(e, t), Kn(e), e.curOp.updateInput = d, e.curOp.typing = !0, e.state.pasteIncoming = e.state.cutIncoming = !1;
        }
        function be(e, t) {
            var n = e.clipboardData && e.clipboardData.getData("text/plain");
            if (n) return e.preventDefault(), t.isReadOnly() || t.options.disableInput || jt(t, function() {
                ye(t, n, 0, null, "paste");
            }), !0;
        }
        function we(e, t) {
            if (e.options.electricChars && e.options.smartIndent) for (var n = e.doc.sel, r = n.ranges.length - 1; r >= 0; r--) {
                var i = n.ranges[r];
                if (!(i.head.ch > 100 || r && n.ranges[r - 1].head.line == i.head.line)) {
                    var o = e.getModeAt(i.head), l = !1;
                    if (o.electricChars) {
                        for (var s = 0; s < o.electricChars.length; s++) if (t.indexOf(o.electricChars.charAt(s)) > -1) {
                            l = jn(e, i.head.line, "smart");
                            break;
                        }
                    } else o.electricInput && o.electricInput.test(yi(e.doc, i.head.line).text.slice(0, i.head.ch)) && (l = jn(e, i.head.line, "smart"));
                    l && Yi(e, "electricInput", e, i.head.line);
                }
            }
        }
        function xe(e) {
            for (var t = [], n = [], r = 0; r < e.doc.sel.ranges.length; r++) {
                var i = e.doc.sel.ranges[r].head.line, o = {
                    anchor: fe(i, 0),
                    head: fe(i + 1, 0)
                };
                n.push(o), t.push(e.getRange(o.anchor, o.head));
            }
            return {
                text: t,
                ranges: n
            };
        }
        function Ce(e) {
            e.setAttribute("autocorrect", "off"), e.setAttribute("autocapitalize", "off"), e.setAttribute("spellcheck", "false");
        }
        function Se(e) {
            this.cm = e, this.prevInput = "", this.pollingFast = !1, this.polling = new lo(), 
            this.inaccurateSelection = !1, this.hasSelection = !1, this.composing = null;
        }
        function ke() {
            var e = To("textarea", null, null, "position: absolute; padding: 0; width: 1px; height: 1em; outline: none"), t = To("div", [ e ], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
            return s ? e.style.width = "1000px" : e.setAttribute("wrap", "off"), p && (e.style.border = "1px solid black"), 
            Ce(e), t;
        }
        function Le(e) {
            this.cm = e, this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null, 
            this.polling = new lo(), this.gracePeriod = !1;
        }
        function Me(e, t) {
            var n = pt(e, t.line);
            if (!n || n.hidden) return null;
            var r = yi(e.doc, t.line), i = ht(n, r, t.line), o = Li(r), l = "left";
            o && (l = nl(o, t.ch) % 2 ? "right" : "left");
            var s = bt(i.map, t.ch, l);
            return s.offset = "right" == s.collapse ? s.end : s.start, s;
        }
        function Te(e, t) {
            return t && (e.bad = !0), e;
        }
        function Ne(e, t, n) {
            var r;
            if (t == e.display.lineDiv) {
                if (!(r = e.display.lineDiv.childNodes[n])) return Te(e.clipPos(fe(e.display.viewTo - 1)), !0);
                t = null, n = 0;
            } else for (r = t; ;r = r.parentNode) {
                if (!r || r == e.display.lineDiv) return null;
                if (r.parentNode && r.parentNode == e.display.lineDiv) break;
            }
            for (var i = 0; i < e.display.view.length; i++) {
                var o = e.display.view[i];
                if (o.node == r) return Oe(o, t, n);
            }
        }
        function Oe(e, t, n) {
            var r = e.text.firstChild, i = !1;
            if (!t || !Ao(r, t)) return Te(fe(Ci(e.line), 0), !0);
            if (t == r && (i = !0, t = r.childNodes[n], n = 0, !t)) {
                var o = e.rest ? fo(e.rest) : e.line;
                return Te(fe(Ci(o), o.text.length), i);
            }
            var l = 3 == t.nodeType ? t : null, s = t;
            for (l || 1 != t.childNodes.length || 3 != t.firstChild.nodeType || (l = t.firstChild, 
            n && (n = l.nodeValue.length)); s.parentNode != r; ) s = s.parentNode;
            var a = e.measure, c = a.maps;
            function u(t, n, r) {
                for (var i = -1; i < (c ? c.length : 0); i++) for (var o = i < 0 ? a.map : c[i], l = 0; l < o.length; l += 3) {
                    var s = o[l + 2];
                    if (s == t || s == n) {
                        var u = Ci(i < 0 ? e.line : e.rest[i]), f = o[l] + r;
                        return (r < 0 || s != t) && (f = o[l + (r ? 1 : 0)]), fe(u, f);
                    }
                }
            }
            var f = u(l, s, n);
            if (f) return Te(f, i);
            for (var h = s.nextSibling, d = l ? l.nodeValue.length - n : 0; h; h = h.nextSibling) {
                if (f = u(h, h.firstChild, 0)) return Te(fe(f.line, f.ch - d), i);
                d += h.textContent.length;
            }
            var p = s.previousSibling;
            for (d = n; p; p = p.previousSibling) {
                if (f = u(p, p.firstChild, -1)) return Te(fe(f.line, f.ch + d), i);
                d += h.textContent.length;
            }
        }
        function Ae(e, t) {
            this.ranges = e, this.primIndex = t;
        }
        function We(e, t) {
            this.anchor = e, this.head = t;
        }
        function Fe(e, t) {
            var n = e[t];
            e.sort(function(e, t) {
                return he(e.from(), t.from());
            }), t = po(e, n);
            for (var r = 1; r < e.length; r++) {
                var i = e[r], o = e[r - 1];
                if (he(o.to(), i.from()) >= 0) {
                    var l = ge(o.from(), i.from()), s = pe(o.to(), i.to()), a = o.empty() ? i.from() == i.head : o.from() == o.head;
                    r <= t && --t, e.splice(--r, 2, new We(a ? s : l, a ? l : s));
                }
            }
            return new Ae(e, t);
        }
        function He(e, t) {
            return new Ae([ new We(e, t || e) ], 0);
        }
        function De(e, t) {
            return Math.max(e.first, Math.min(t, e.first + e.size - 1));
        }
        function Pe(e, t) {
            if (t.line < e.first) return fe(e.first, 0);
            var n, r, i, o = e.first + e.size - 1;
            return t.line > o ? fe(o, yi(e, o).text.length) : (n = t, r = yi(e, t.line).text.length, 
            null == (i = n.ch) || i > r ? fe(n.line, r) : i < 0 ? fe(n.line, 0) : n);
        }
        function Ie(e, t) {
            return t >= e.first && t < e.first + e.size;
        }
        function Ee(e, t) {
            for (var n = [], r = 0; r < t.length; r++) n[r] = Pe(e, t[r]);
            return n;
        }
        function ze(e, t, n, r) {
            if (e.cm && e.cm.display.shift || e.extend) {
                var i = t.anchor;
                if (r) {
                    var o = he(n, i) < 0;
                    o != he(r, i) < 0 ? (i = n, n = r) : o != he(n, r) < 0 && (n = r);
                }
                return new We(i, n);
            }
            return new We(r || n, n);
        }
        function Re(e, t, n, r) {
            Ve(e, new Ae([ ze(e, e.sel.primary(), t, n) ], 0), r);
        }
        function Be(e, t, n) {
            for (var r = [], i = 0; i < e.sel.ranges.length; i++) r[i] = ze(e, e.sel.ranges[i], t[i], null);
            Ve(e, Fe(r, e.sel.primIndex), n);
        }
        function Ue(e, t, n, r) {
            var i = e.sel.ranges.slice(0);
            i[t] = n, Ve(e, Fe(i, e.sel.primIndex), r);
        }
        function Ge(e, t, n, r) {
            Ve(e, He(t, n), r);
        }
        function Ke(e, t, n) {
            var r = e.history.done, i = fo(r);
            i && i.ranges ? (r[r.length - 1] = t, je(e, t, n)) : Ve(e, t, n);
        }
        function Ve(e, t, n) {
            je(e, t, n), function(e, t, n, r) {
                var i = e.history, o = r && r.origin;
                n == i.lastSelOp || o && i.lastSelOrigin == o && (i.lastModTime == i.lastSelTime && i.lastOrigin == o || (l = e, 
                s = o, a = fo(i.done), c = t, u = s.charAt(0), "*" == u || "+" == u && a.ranges.length == c.ranges.length && a.somethingSelected() == c.somethingSelected() && new Date() - l.history.lastSelTime <= (l.cm ? l.cm.options.historyEventDelay : 500))) ? i.done[i.done.length - 1] = t : Ai(t, i.done);
                var l, s, a, c, u;
                i.lastSelTime = +new Date(), i.lastSelOrigin = o, i.lastSelOp = n, r && !1 !== r.clearRedo && Ni(i.undone);
            }(e, e.sel, e.cm ? e.cm.curOp.id : NaN, n);
        }
        function je(e, t, n) {
            var r, i, o, l;
            (Ji(e, "beforeSelectionChange") || e.cm && Ji(e.cm, "beforeSelectionChange")) && (r = e, 
            o = n, l = {
                ranges: (i = t).ranges,
                update: function(e) {
                    this.ranges = [];
                    for (var t = 0; t < e.length; t++) this.ranges[t] = new We(Pe(r, e[t].anchor), Pe(r, e[t].head));
                },
                origin: o && o.origin
            }, qi(r, "beforeSelectionChange", r, l), r.cm && qi(r.cm, "beforeSelectionChange", r.cm, l), 
            t = l.ranges != i.ranges ? Fe(l.ranges, l.ranges.length - 1) : i), _e(e, Xe(e, t, n && n.bias || (he(t.primary().head, e.sel.primary().head) < 0 ? -1 : 1), !0)), 
            n && !1 === n.scroll || !e.cm || Kn(e.cm);
        }
        function _e(e, t) {
            t.equals(e.sel) || (e.sel = t, e.cm && (e.cm.curOp.updateInput = e.cm.curOp.selectionChanged = !0, 
            Qi(e.cm)), Yi(e, "cursorActivity", e));
        }
        function qe(e) {
            _e(e, Xe(e, e.sel, null, !1));
        }
        function Xe(e, t, n, r) {
            for (var i, o = 0; o < t.ranges.length; o++) {
                var l = t.ranges[o], s = t.ranges.length == e.sel.ranges.length && e.sel.ranges[o], a = $e(e, l.anchor, s && s.anchor, n, r), c = $e(e, l.head, s && s.head, n, r);
                (i || a != l.anchor || c != l.head) && (i || (i = t.ranges.slice(0, o)), i[o] = new We(a, c));
            }
            return i ? Fe(i, t.primIndex) : t;
        }
        function Ye(e, t, n, r, i) {
            var o = yi(e, t.line);
            if (o.markedSpans) for (var l = 0; l < o.markedSpans.length; ++l) {
                var s = o.markedSpans[l], a = s.marker;
                if ((null == s.from || (a.inclusiveLeft ? s.from <= t.ch : s.from < t.ch)) && (null == s.to || (a.inclusiveRight ? s.to >= t.ch : s.to > t.ch))) {
                    if (i && (qi(a, "beforeCursorEnter"), a.explicitlyCleared)) {
                        if (o.markedSpans) {
                            --l;
                            continue;
                        }
                        break;
                    }
                    if (!a.atomic) continue;
                    if (n) {
                        var c, u = a.find(r < 0 ? 1 : -1);
                        if ((r < 0 ? a.inclusiveRight : a.inclusiveLeft) && (u = Ze(e, u, -r, u && u.line == t.line ? o : null)), 
                        u && u.line == t.line && (c = he(u, n)) && (r < 0 ? c < 0 : c > 0)) return Ye(e, u, t, r, i);
                    }
                    var f = a.find(r < 0 ? -1 : 1);
                    return (r < 0 ? a.inclusiveLeft : a.inclusiveRight) && (f = Ze(e, f, r, f.line == t.line ? o : null)), 
                    f ? Ye(e, f, t, r, i) : null;
                }
            }
            return t;
        }
        function $e(e, t, n, r, i) {
            var o = r || 1, l = Ye(e, t, n, o, i) || !i && Ye(e, t, n, o, !0) || Ye(e, t, n, -o, i) || !i && Ye(e, t, n, -o, !0);
            return l || (e.cantEdit = !0, fe(e.first, 0));
        }
        function Ze(e, t, n, r) {
            return n < 0 && 0 == t.ch ? t.line > e.first ? Pe(e, fe(t.line - 1)) : null : n > 0 && t.ch == (r || yi(e, t.line)).text.length ? t.line < e.first + e.size - 1 ? fe(t.line + 1, 0) : null : new fe(t.line, t.ch + n);
        }
        function Qe(e) {
            e.display.input.showSelection(e.display.input.prepareSelection());
        }
        function Je(e, t) {
            for (var n = e.doc, r = {}, i = r.cursors = document.createDocumentFragment(), o = r.selection = document.createDocumentFragment(), l = 0; l < n.sel.ranges.length; l++) if (!1 !== t || l != n.sel.primIndex) {
                var s = n.sel.ranges[l];
                if (!(s.from().line >= e.display.viewTo || s.to().line < e.display.viewFrom)) {
                    var a = s.empty();
                    (a || e.options.showCursorWhenSelecting) && et(e, s.head, i), a || tt(e, s, o);
                }
            }
            return r;
        }
        function et(e, t, n) {
            var r = Nt(e, t, "div", null, null, !e.options.singleCursorHeightPerLine), i = n.appendChild(To("div", "\xa0", "CodeMirror-cursor"));
            if (i.style.left = r.left + "px", i.style.top = r.top + "px", i.style.height = Math.max(0, r.bottom - r.top) * e.options.cursorHeight + "px", 
            r.other) {
                var o = n.appendChild(To("div", "\xa0", "CodeMirror-cursor CodeMirror-secondarycursor"));
                o.style.display = "", o.style.left = r.other.left + "px", o.style.top = r.other.top + "px", 
                o.style.height = .85 * (r.other.bottom - r.other.top) + "px";
            }
        }
        function tt(e, t, n) {
            var r = e.display, i = e.doc, o = document.createDocumentFragment(), l = at(e.display), s = l.left, a = Math.max(r.sizerWidth, ut(e) - r.sizer.offsetLeft) - l.right;
            function c(e, t, n, r) {
                t < 0 && (t = 0), t = Math.round(t), r = Math.round(r), o.appendChild(To("div", null, "CodeMirror-selected", "position: absolute; left: " + e + "px; top: " + t + "px; width: " + (null == n ? a - e : n) + "px; height: " + (r - t) + "px"));
            }
            function u(t, n, r) {
                var o, l, u = yi(i, t), f = u.text.length;
                function h(n, r) {
                    return Tt(e, fe(t, n), "div", u, r);
                }
                return function(e, t, n, r) {
                    if (!e) return r(t, n, "ltr");
                    for (var i = !1, o = 0; o < e.length; ++o) {
                        var l = e[o];
                        (l.from < n && l.to > t || t == n && l.to == t) && (r(Math.max(l.from, t), Math.min(l.to, n), 1 == l.level ? "rtl" : "ltr"), 
                        i = !0);
                    }
                    i || r(t, n, "ltr");
                }(Li(u), n || 0, null == r ? f : r, function(e, t, i) {
                    var u, d, p, g = h(e, "left");
                    if (e == t) u = g, d = p = g.left; else {
                        if (u = h(t - 1, "right"), "rtl" == i) {
                            var m = g;
                            g = u, u = m;
                        }
                        d = g.left, p = u.right;
                    }
                    null == n && 0 == e && (d = s), u.top - g.top > 3 && (c(d, g.top, null, g.bottom), 
                    d = s, g.bottom < u.top && c(d, g.bottom, null, u.top)), null == r && t == f && (p = a), 
                    (!o || g.top < o.top || g.top == o.top && g.left < o.left) && (o = g), (!l || u.bottom > l.bottom || u.bottom == l.bottom && u.right > l.right) && (l = u), 
                    d < s + 1 && (d = s), c(d, u.top, p - d, u.bottom);
                }), {
                    start: o,
                    end: l
                };
            }
            var f = t.from(), h = t.to();
            if (f.line == h.line) u(f.line, f.ch, h.ch); else {
                var d = yi(i, f.line), p = yi(i, h.line), g = Ir(d) == Ir(p), m = u(f.line, f.ch, g ? d.text.length + 1 : null).end, v = u(h.line, g ? 0 : null, h.ch).start;
                g && (m.top < v.top - 2 ? (c(m.right, m.top, null, m.bottom), c(s, v.top, v.left, v.bottom)) : c(m.right, m.top, v.left - m.right, m.bottom)), 
                m.bottom < v.top && c(s, m.bottom, null, v.top);
            }
            n.appendChild(o);
        }
        function nt(e) {
            if (e.state.focused) {
                var t = e.display;
                clearInterval(t.blinker);
                var n = !0;
                t.cursorDiv.style.visibility = "", e.options.cursorBlinkRate > 0 ? t.blinker = setInterval(function() {
                    t.cursorDiv.style.visibility = (n = !n) ? "" : "hidden";
                }, e.options.cursorBlinkRate) : e.options.cursorBlinkRate < 0 && (t.cursorDiv.style.visibility = "hidden");
            }
        }
        function rt(e, t) {
            e.doc.mode.startState && e.doc.frontier < e.display.viewTo && e.state.highlight.set(t, bo(it, e));
        }
        function it(e) {
            var t = e.doc;
            if (t.frontier < t.first && (t.frontier = t.first), !(t.frontier >= e.display.viewTo)) {
                var n = +new Date() + e.options.workTime, r = or(t.mode, ot(e, t.frontier)), i = [];
                t.iter(t.frontier, Math.min(t.first + t.size, e.display.viewTo + 500), function(o) {
                    if (t.frontier >= e.display.viewFrom) {
                        var l = o.styles, s = o.text.length > e.options.maxHighlightLength, a = $r(e, o, s ? or(t.mode, r) : r, !0);
                        o.styles = a.styles;
                        var c = o.styleClasses, u = a.classes;
                        u ? o.styleClasses = u : c && (o.styleClasses = null);
                        for (var f = !l || l.length != o.styles.length || c != u && (!c || !u || c.bgClass != u.bgClass || c.textClass != u.textClass), h = 0; !f && h < l.length; ++h) f = l[h] != o.styles[h];
                        f && i.push(t.frontier), o.stateAfter = s ? r : or(t.mode, r);
                    } else o.text.length <= e.options.maxHighlightLength && Qr(e, o.text, r), o.stateAfter = t.frontier % 5 == 0 ? or(t.mode, r) : null;
                    if (++t.frontier, +new Date() > n) return rt(e, e.options.workDelay), !0;
                }), i.length && jt(e, function() {
                    for (var t = 0; t < i.length; t++) Qt(e, i[t], "text");
                });
            }
        }
        function ot(e, t, n) {
            var r = e.doc, i = e.display;
            if (!r.mode.startState) return !0;
            var o = function(e, t, n) {
                for (var r, i, o = e.doc, l = n ? -1 : t - (e.doc.mode.innerMode ? 1e3 : 100), s = t; s > l; --s) {
                    if (s <= o.first) return o.first;
                    var a = yi(o, s - 1);
                    if (a.stateAfter && (!n || s <= o.frontier)) return s;
                    var c = so(a.text, null, e.options.tabSize);
                    (null == i || r > c) && (i = s - 1, r = c);
                }
                return i;
            }(e, t, n), l = o > r.first && yi(r, o - 1).stateAfter;
            return l = l ? or(r.mode, l) : lr(r.mode), r.iter(o, t, function(n) {
                Qr(e, n.text, l);
                var s = o == t - 1 || o % 5 == 0 || o >= i.viewFrom && o < i.viewTo;
                n.stateAfter = s ? or(r.mode, l) : null, ++o;
            }), n && (r.frontier = o), l;
        }
        function lt(e) {
            return e.lineSpace.offsetTop;
        }
        function st(e) {
            return e.mover.offsetHeight - e.lineSpace.offsetHeight;
        }
        function at(e) {
            if (e.cachedPaddingH) return e.cachedPaddingH;
            var t = Oo(e.measure, To("pre", "x")), n = window.getComputedStyle ? window.getComputedStyle(t) : t.currentStyle, r = {
                left: parseInt(n.paddingLeft),
                right: parseInt(n.paddingRight)
            };
            return isNaN(r.left) || isNaN(r.right) || (e.cachedPaddingH = r), r;
        }
        function ct(e) {
            return to - e.display.nativeBarWidth;
        }
        function ut(e) {
            return e.display.scroller.clientWidth - ct(e) - e.display.barWidth;
        }
        function ft(e) {
            return e.display.scroller.clientHeight - ct(e) - e.display.barHeight;
        }
        function ht(e, t, n) {
            if (e.line == t) return {
                map: e.measure.map,
                cache: e.measure.cache
            };
            for (var r = 0; r < e.rest.length; r++) if (e.rest[r] == t) return {
                map: e.measure.maps[r],
                cache: e.measure.caches[r]
            };
            for (r = 0; r < e.rest.length; r++) if (Ci(e.rest[r]) > n) return {
                map: e.measure.maps[r],
                cache: e.measure.caches[r],
                before: !0
            };
        }
        function dt(e, t, n, r) {
            return mt(e, gt(e, t), n, r);
        }
        function pt(e, t) {
            if (t >= e.display.viewFrom && t < e.display.viewTo) return e.display.view[en(e, t)];
            var n = e.display.externalMeasured;
            return n && t >= n.lineN && t < n.lineN + n.size ? n : void 0;
        }
        function gt(e, t) {
            var n = Ci(t), r = pt(e, n);
            r && !r.text ? r = null : r && r.changes && (ee(e, r, n, J(e)), e.curOp.forceUpdate = !0), 
            r || (r = function(e, t) {
                var n = Ci(t = Ir(t)), r = e.display.externalMeasured = new Yt(e.doc, t, n);
                r.lineN = n;
                var i = r.built = ni(e, r);
                return r.text = i.pre, Oo(e.display.lineMeasure, i.pre), r;
            }(e, t));
            var i = ht(r, t, n);
            return {
                line: t,
                view: r,
                rect: null,
                map: i.map,
                cache: i.cache,
                before: i.before,
                hasHeights: !1
            };
        }
        function mt(e, t, n, r, i) {
            t.before && (n = -1);
            var s, a = n + (r || "");
            return t.cache.hasOwnProperty(a) ? s = t.cache[a] : (t.rect || (t.rect = t.view.text.getBoundingClientRect()), 
            t.hasHeights || (!function(e, t, n) {
                var r = e.options.lineWrapping, i = r && ut(e);
                if (!t.measure.heights || r && t.measure.width != i) {
                    var o = t.measure.heights = [];
                    if (r) {
                        t.measure.width = i;
                        for (var l = t.text.firstChild.getClientRects(), s = 0; s < l.length - 1; s++) {
                            var a = l[s], c = l[s + 1];
                            Math.abs(a.bottom - c.bottom) > 2 && o.push((a.bottom + c.top) / 2 - n.top);
                        }
                    }
                    o.push(n.bottom - n.top);
                }
            }(e, t.view, t.rect), t.hasHeights = !0), (s = function(e, t, n, r) {
                var i, s = bt(t.map, n, r), a = s.node, c = s.start, u = s.end, f = s.collapse;
                if (3 == a.nodeType) {
                    for (var h = 0; h < 4; h++) {
                        for (;c && Mo(t.line.text.charAt(s.coverStart + c)); ) --c;
                        for (;s.coverStart + u < s.coverEnd && Mo(t.line.text.charAt(s.coverStart + u)); ) ++u;
                        if (o && l < 9 && 0 == c && u == s.coverEnd - s.coverStart) i = a.parentNode.getBoundingClientRect(); else if (o && e.options.lineWrapping) {
                            var d = ko(a, c, u).getClientRects();
                            i = d.length ? d["right" == r ? d.length - 1 : 0] : yt;
                        } else i = ko(a, c, u).getBoundingClientRect() || yt;
                        if (i.left || i.right || 0 == c) break;
                        u = c, c -= 1, f = "right";
                    }
                    o && l < 11 && (i = function(e, t) {
                        if (!window.screen || null == screen.logicalXDPI || screen.logicalXDPI == screen.deviceXDPI || !function(e) {
                            if (null != qo) return qo;
                            var t = Oo(e, To("span", "x")), n = t.getBoundingClientRect(), r = ko(t, 0, 1).getBoundingClientRect();
                            return qo = Math.abs(n.left - r.left) > 1;
                        }(e)) return t;
                        var n = screen.logicalXDPI / screen.deviceXDPI, r = screen.logicalYDPI / screen.deviceYDPI;
                        return {
                            left: t.left * n,
                            right: t.right * n,
                            top: t.top * r,
                            bottom: t.bottom * r
                        };
                    }(e.display.measure, i));
                } else {
                    c > 0 && (f = r = "right"), i = e.options.lineWrapping && (d = a.getClientRects()).length > 1 ? d["right" == r ? d.length - 1 : 0] : a.getBoundingClientRect();
                }
                if (o && l < 9 && !c && (!i || !i.left && !i.right)) {
                    var p = a.parentNode.getClientRects()[0];
                    i = p ? {
                        left: p.left,
                        right: p.left + Dt(e.display),
                        top: p.top,
                        bottom: p.bottom
                    } : yt;
                }
                for (var g = i.top - t.rect.top, m = i.bottom - t.rect.top, v = (g + m) / 2, y = t.view.measure.heights, h = 0; h < y.length - 1 && !(v < y[h]); h++) ;
                var b = h ? y[h - 1] : 0, w = y[h], x = {
                    left: ("right" == f ? i.right : i.left) - t.rect.left,
                    right: ("left" == f ? i.left : i.right) - t.rect.left,
                    top: b,
                    bottom: w
                };
                i.left || i.right || (x.bogus = !0);
                e.options.singleCursorHeightPerLine || (x.rtop = g, x.rbottom = m);
                return x;
            }(e, t, n, r)).bogus || (t.cache[a] = s)), {
                left: s.left,
                right: s.right,
                top: i ? s.rtop : s.top,
                bottom: i ? s.rbottom : s.bottom
            };
        }
        Se.prototype = yo({
            init: function(e) {
                var t = this, n = this.cm, r = this.wrapper = ke(), i = this.textarea = r.firstChild;
                function s(e) {
                    if (!Zi(n, e)) {
                        if (n.somethingSelected()) ve = n.getSelections(), t.inaccurateSelection && (t.prevInput = "", 
                        t.inaccurateSelection = !1, i.value = ve.join("\n"), ho(i)); else {
                            if (!n.options.lineWiseCopyCut) return;
                            var r = xe(n);
                            ve = r.text, "cut" == e.type ? n.setSelections(r.ranges, null, ro) : (t.prevInput = "", 
                            i.value = r.text.join("\n"), ho(i));
                        }
                        "cut" == e.type && (n.state.cutIncoming = !0);
                    }
                }
                e.wrapper.insertBefore(r, e.wrapper.firstChild), p && (i.style.width = "0px"), Ki(i, "input", function() {
                    o && l >= 9 && t.hasSelection && (t.hasSelection = null), t.poll();
                }), Ki(i, "paste", function(e) {
                    Zi(n, e) || be(e, n) || (n.state.pasteIncoming = !0, t.fastPoll());
                }), Ki(i, "cut", s), Ki(i, "copy", s), Ki(e.scroller, "paste", function(r) {
                    on(e, r) || Zi(n, r) || (n.state.pasteIncoming = !0, t.focus());
                }), Ki(e.lineSpace, "selectstart", function(t) {
                    on(e, t) || Ei(t);
                }), Ki(i, "compositionstart", function() {
                    var e = n.getCursor("from");
                    t.composing && t.composing.range.clear(), t.composing = {
                        start: e,
                        range: n.markText(e, n.getCursor("to"), {
                            className: "CodeMirror-composing"
                        })
                    };
                }), Ki(i, "compositionend", function() {
                    t.composing && (t.poll(), t.composing.range.clear(), t.composing = null);
                });
            },
            prepareSelection: function() {
                var e = this.cm, t = e.display, n = e.doc, r = Je(e);
                if (e.options.moveInputWithCursor) {
                    var i = Nt(e, n.sel.primary().head, "div"), o = t.wrapper.getBoundingClientRect(), l = t.lineDiv.getBoundingClientRect();
                    r.teTop = Math.max(0, Math.min(t.wrapper.clientHeight - 10, i.top + l.top - o.top)), 
                    r.teLeft = Math.max(0, Math.min(t.wrapper.clientWidth - 10, i.left + l.left - o.left));
                }
                return r;
            },
            showSelection: function(e) {
                var t = this.cm.display;
                Oo(t.cursorDiv, e.cursors), Oo(t.selectionDiv, e.selection), null != e.teTop && (this.wrapper.style.top = e.teTop + "px", 
                this.wrapper.style.left = e.teLeft + "px");
            },
            reset: function(e) {
                if (!this.contextMenuPending) {
                    var t, n, r = this.cm, i = r.doc;
                    if (r.somethingSelected()) {
                        this.prevInput = "";
                        var s = i.sel.primary(), a = (t = _o && (s.to().line - s.from().line > 100 || (n = r.getSelection()).length > 1e3)) ? "-" : n || r.getSelection();
                        this.textarea.value = a, r.state.focused && ho(this.textarea), o && l >= 9 && (this.hasSelection = a);
                    } else e || (this.prevInput = this.textarea.value = "", o && l >= 9 && (this.hasSelection = null));
                    this.inaccurateSelection = t;
                }
            },
            getField: function() {
                return this.textarea;
            },
            supportsTouch: function() {
                return !1;
            },
            focus: function() {
                if ("nocursor" != this.cm.options.readOnly && (!g || Wo() != this.textarea)) try {
                    this.textarea.focus();
                } catch (e) {}
            },
            blur: function() {
                this.textarea.blur();
            },
            resetPosition: function() {
                this.wrapper.style.top = this.wrapper.style.left = 0;
            },
            receivedFocus: function() {
                this.slowPoll();
            },
            slowPoll: function() {
                var e = this;
                e.pollingFast || e.polling.set(this.cm.options.pollInterval, function() {
                    e.poll(), e.cm.state.focused && e.slowPoll();
                });
            },
            fastPoll: function() {
                var e = !1, t = this;
                t.pollingFast = !0, t.polling.set(20, function n() {
                    t.poll() || e ? (t.pollingFast = !1, t.slowPoll()) : (e = !0, t.polling.set(60, n));
                });
            },
            poll: function() {
                var e = this.cm, t = this.textarea, n = this.prevInput;
                if (this.contextMenuPending || !e.state.focused || jo(t) && !n && !this.composing || e.isReadOnly() || e.options.disableInput || e.state.keySeq) return !1;
                var r = t.value;
                if (r == n && !e.somethingSelected()) return !1;
                if (o && l >= 9 && this.hasSelection === r || m && /[\uf700-\uf7ff]/.test(r)) return e.display.input.reset(), 
                !1;
                if (e.doc.sel == e.display.selForContextMenu) {
                    var i = r.charCodeAt(0);
                    if (8203 != i || n || (n = "\u200b"), 8666 == i) return this.reset(), this.cm.execCommand("undo");
                }
                for (var s = 0, a = Math.min(n.length, r.length); s < a && n.charCodeAt(s) == r.charCodeAt(s); ) ++s;
                var c = this;
                return jt(e, function() {
                    ye(e, r.slice(s), n.length - s, null, c.composing ? "*compose" : null), r.length > 1e3 || r.indexOf("\n") > -1 ? t.value = c.prevInput = "" : c.prevInput = r, 
                    c.composing && (c.composing.range.clear(), c.composing.range = e.markText(c.composing.start, e.getCursor("to"), {
                        className: "CodeMirror-composing"
                    }));
                }), !0;
            },
            ensurePolled: function() {
                this.pollingFast && this.poll() && (this.pollingFast = !1);
            },
            onKeyPress: function() {
                o && l >= 9 && (this.hasSelection = null), this.fastPoll();
            },
            onContextMenu: function(e) {
                var t = this, n = t.cm, r = n.display, i = t.textarea, a = ln(n, e), c = r.scroller.scrollTop;
                if (a && !u) {
                    n.options.resetSelectionOnContextMenu && -1 == n.doc.sel.contains(a) && _t(n, Ve)(n.doc, He(a), ro);
                    var f = i.style.cssText, h = t.wrapper.style.cssText;
                    t.wrapper.style.cssText = "position: absolute";
                    var d = t.wrapper.getBoundingClientRect();
                    if (i.style.cssText = "position: absolute; width: 30px; height: 30px; top: " + (e.clientY - d.top - 5) + "px; left: " + (e.clientX - d.left - 5) + "px; z-index: 1000; background: " + (o ? "rgba(255, 255, 255, .05)" : "transparent") + "; outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);", 
                    s) var p = window.scrollY;
                    if (r.input.focus(), s && window.scrollTo(null, p), r.input.reset(), n.somethingSelected() || (i.value = t.prevInput = " "), 
                    t.contextMenuPending = !0, r.selForContextMenu = n.doc.sel, clearTimeout(r.detectingSelectAll), 
                    o && l >= 9 && m(), w) {
                        Bi(e);
                        var g = function() {
                            _i(window, "mouseup", g), setTimeout(v, 20);
                        };
                        Ki(window, "mouseup", g);
                    } else setTimeout(v, 50);
                }
                function m() {
                    if (null != i.selectionStart) {
                        var e = n.somethingSelected(), o = "\u200b" + (e ? i.value : "");
                        i.value = "\u21da", i.value = o, t.prevInput = e ? "" : "\u200b", i.selectionStart = 1, 
                        i.selectionEnd = o.length, r.selForContextMenu = n.doc.sel;
                    }
                }
                function v() {
                    if (t.contextMenuPending = !1, t.wrapper.style.cssText = h, i.style.cssText = f, 
                    o && l < 9 && r.scrollbars.setScrollTop(r.scroller.scrollTop = c), null != i.selectionStart) {
                        (!o || o && l < 9) && m();
                        var e = 0, s = function() {
                            r.selForContextMenu == n.doc.sel && 0 == i.selectionStart && i.selectionEnd > 0 && "\u200b" == t.prevInput ? _t(n, sr.selectAll)(n) : e++ < 10 ? r.detectingSelectAll = setTimeout(s, 500) : r.input.reset();
                        };
                        r.detectingSelectAll = setTimeout(s, 200);
                    }
                }
            },
            readOnlyChanged: function(e) {
                e || this.reset();
            },
            setUneditable: mo,
            needsContentAttribute: !1
        }, Se.prototype), Le.prototype = yo({
            init: function(e) {
                var t = this, n = t.cm, r = t.div = e.lineDiv;
                function i(e) {
                    if (!Zi(n, e)) {
                        if (n.somethingSelected()) ve = n.getSelections(), "cut" == e.type && n.replaceSelection("", null, "cut"); else {
                            if (!n.options.lineWiseCopyCut) return;
                            var t = xe(n);
                            ve = t.text, "cut" == e.type && n.operation(function() {
                                n.setSelections(t.ranges, 0, ro), n.replaceSelection("", null, "cut");
                            });
                        }
                        if (e.clipboardData && !p) e.preventDefault(), e.clipboardData.clearData(), e.clipboardData.setData("text/plain", ve.join("\n")); else {
                            var r = ke(), i = r.firstChild;
                            n.display.lineSpace.insertBefore(r, n.display.lineSpace.firstChild), i.value = ve.join("\n");
                            var o = document.activeElement;
                            ho(i), setTimeout(function() {
                                n.display.lineSpace.removeChild(r), o.focus();
                            }, 50);
                        }
                    }
                }
                Ce(r), Ki(r, "paste", function(e) {
                    Zi(n, e) || be(e, n);
                }), Ki(r, "compositionstart", function(e) {
                    var r = e.data;
                    if (t.composing = {
                        sel: n.doc.sel,
                        data: r,
                        startData: r
                    }, r) {
                        var i = n.doc.sel.primary(), o = n.getLine(i.head.line).indexOf(r, Math.max(0, i.head.ch - r.length));
                        o > -1 && o <= i.head.ch && (t.composing.sel = He(fe(i.head.line, o), fe(i.head.line, o + r.length)));
                    }
                }), Ki(r, "compositionupdate", function(e) {
                    t.composing.data = e.data;
                }), Ki(r, "compositionend", function(e) {
                    var n = t.composing;
                    n && (e.data == n.startData || /\u200b/.test(e.data) || (n.data = e.data), setTimeout(function() {
                        n.handled || t.applyComposition(n), t.composing == n && (t.composing = null);
                    }, 50));
                }), Ki(r, "touchstart", function() {
                    t.forceCompositionEnd();
                }), Ki(r, "input", function() {
                    t.composing || !n.isReadOnly() && t.pollContent() || jt(t.cm, function() {
                        Zt(n);
                    });
                }), Ki(r, "copy", i), Ki(r, "cut", i);
            },
            prepareSelection: function() {
                var e = Je(this.cm, !1);
                return e.focus = this.cm.state.focused, e;
            },
            showSelection: function(e) {
                e && this.cm.display.view.length && (e.focus && this.showPrimarySelection(), this.showMultipleSelections(e));
            },
            showPrimarySelection: function() {
                var e = window.getSelection(), t = this.cm.doc.sel.primary(), r = Ne(this.cm, e.anchorNode, e.anchorOffset), i = Ne(this.cm, e.focusNode, e.focusOffset);
                if (!r || r.bad || !i || i.bad || 0 != he(ge(r, i), t.from()) || 0 != he(pe(r, i), t.to())) {
                    var o = Me(this.cm, t.from()), l = Me(this.cm, t.to());
                    if (o || l) {
                        var s = this.cm.display.view, a = e.rangeCount && e.getRangeAt(0);
                        if (o) {
                            if (!l) {
                                var c = s[s.length - 1].measure, u = c.maps ? c.maps[c.maps.length - 1] : c.map;
                                l = {
                                    node: u[u.length - 1],
                                    offset: u[u.length - 2] - u[u.length - 3]
                                };
                            }
                        } else o = {
                            node: s[0].measure.map[2],
                            offset: 0
                        };
                        try {
                            var f = ko(o.node, o.offset, l.offset, l.node);
                        } catch (e) {}
                        f && (!n && this.cm.state.focused ? (e.collapse(o.node, o.offset), f.collapsed || e.addRange(f)) : (e.removeAllRanges(), 
                        e.addRange(f)), a && null == e.anchorNode ? e.addRange(a) : n && this.startGracePeriod()), 
                        this.rememberSelection();
                    }
                }
            },
            startGracePeriod: function() {
                var e = this;
                clearTimeout(this.gracePeriod), this.gracePeriod = setTimeout(function() {
                    e.gracePeriod = !1, e.selectionChanged() && e.cm.operation(function() {
                        e.cm.curOp.selectionChanged = !0;
                    });
                }, 20);
            },
            showMultipleSelections: function(e) {
                Oo(this.cm.display.cursorDiv, e.cursors), Oo(this.cm.display.selectionDiv, e.selection);
            },
            rememberSelection: function() {
                var e = window.getSelection();
                this.lastAnchorNode = e.anchorNode, this.lastAnchorOffset = e.anchorOffset, this.lastFocusNode = e.focusNode, 
                this.lastFocusOffset = e.focusOffset;
            },
            selectionInEditor: function() {
                var e = window.getSelection();
                if (!e.rangeCount) return !1;
                var t = e.getRangeAt(0).commonAncestorContainer;
                return Ao(this.div, t);
            },
            focus: function() {
                "nocursor" != this.cm.options.readOnly && this.div.focus();
            },
            blur: function() {
                this.div.blur();
            },
            getField: function() {
                return this.div;
            },
            supportsTouch: function() {
                return !0;
            },
            receivedFocus: function() {
                var e = this;
                this.selectionInEditor() ? this.pollSelection() : jt(this.cm, function() {
                    e.cm.curOp.selectionChanged = !0;
                }), this.polling.set(this.cm.options.pollInterval, function t() {
                    e.cm.state.focused && (e.pollSelection(), e.polling.set(e.cm.options.pollInterval, t));
                });
            },
            selectionChanged: function() {
                var e = window.getSelection();
                return e.anchorNode != this.lastAnchorNode || e.anchorOffset != this.lastAnchorOffset || e.focusNode != this.lastFocusNode || e.focusOffset != this.lastFocusOffset;
            },
            pollSelection: function() {
                if (!this.composing && !this.gracePeriod && this.selectionChanged()) {
                    var e = window.getSelection(), t = this.cm;
                    this.rememberSelection();
                    var n = Ne(t, e.anchorNode, e.anchorOffset), r = Ne(t, e.focusNode, e.focusOffset);
                    n && r && jt(t, function() {
                        Ve(t.doc, He(n, r), ro), (n.bad || r.bad) && (t.curOp.selectionChanged = !0);
                    });
                }
            },
            pollContent: function() {
                var e, t = this.cm, n = t.display, r = t.doc.sel.primary(), i = r.from(), o = r.to();
                if (i.line < n.viewFrom || o.line > n.viewTo - 1) return !1;
                if (i.line == n.viewFrom || 0 == (e = en(t, i.line))) var l = Ci(n.view[0].line), s = n.view[0].node; else l = Ci(n.view[e].line), 
                s = n.view[e - 1].node.nextSibling;
                var a = en(t, o.line);
                if (a == n.view.length - 1) var c = n.viewTo - 1, u = n.lineDiv.lastChild; else c = Ci(n.view[a + 1].line) - 1, 
                u = n.view[a + 1].node.previousSibling;
                for (var f = t.doc.splitLines(function(e, t, n, r, i) {
                    var o = "", l = !1, s = e.doc.lineSeparator();
                    function a(t) {
                        if (1 == t.nodeType) {
                            var n = t.getAttribute("cm-text");
                            if (null != n) return "" == n && (n = t.textContent.replace(/\u200b/g, "")), void (o += n);
                            var c, u = t.getAttribute("cm-marker");
                            if (u) {
                                var f = e.findMarks(fe(r, 0), fe(i + 1, 0), (p = +u, function(e) {
                                    return e.id == p;
                                }));
                                return void (f.length && (c = f[0].find()) && (o += bi(e.doc, c.from, c.to).join(s)));
                            }
                            if ("false" == t.getAttribute("contenteditable")) return;
                            for (var h = 0; h < t.childNodes.length; h++) a(t.childNodes[h]);
                            /^(pre|div|p)$/i.test(t.nodeName) && (l = !0);
                        } else if (3 == t.nodeType) {
                            var d = t.nodeValue;
                            if (!d) return;
                            l && (o += s, l = !1), o += d;
                        }
                        var p;
                    }
                    for (;a(t), t != n; ) t = t.nextSibling;
                    return o;
                }(t, s, u, l, c)), h = bi(t.doc, fe(l, 0), fe(c, yi(t.doc, c).text.length)); f.length > 1 && h.length > 1; ) if (fo(f) == fo(h)) f.pop(), 
                h.pop(), c--; else {
                    if (f[0] != h[0]) break;
                    f.shift(), h.shift(), l++;
                }
                for (var d = 0, p = 0, g = f[0], m = h[0], v = Math.min(g.length, m.length); d < v && g.charCodeAt(d) == m.charCodeAt(d); ) ++d;
                for (var y = fo(f), b = fo(h), w = Math.min(y.length - (1 == f.length ? d : 0), b.length - (1 == h.length ? d : 0)); p < w && y.charCodeAt(y.length - p - 1) == b.charCodeAt(b.length - p - 1); ) ++p;
                f[f.length - 1] = y.slice(0, y.length - p), f[0] = f[0].slice(d);
                var x = fe(l, d), C = fe(c, h.length ? fo(h).length - p : 0);
                return f.length > 1 || f[0] || he(x, C) ? (Bn(t.doc, f, x, C, "+input"), !0) : void 0;
            },
            ensurePolled: function() {
                this.forceCompositionEnd();
            },
            reset: function() {
                this.forceCompositionEnd();
            },
            forceCompositionEnd: function() {
                this.composing && !this.composing.handled && (this.applyComposition(this.composing), 
                this.composing.handled = !0, this.div.blur(), this.div.focus());
            },
            applyComposition: function(e) {
                this.cm.isReadOnly() ? _t(this.cm, Zt)(this.cm) : e.data && e.data != e.startData && _t(this.cm, ye)(this.cm, e.data, 0, e.sel);
            },
            setUneditable: function(e) {
                e.contentEditable = "false";
            },
            onKeyPress: function(e) {
                e.preventDefault(), this.cm.isReadOnly() || _t(this.cm, ye)(this.cm, String.fromCharCode(null == e.charCode ? e.keyCode : e.charCode), 0);
            },
            readOnlyChanged: function(e) {
                this.div.contentEditable = String("nocursor" != e);
            },
            onContextMenu: mo,
            resetPosition: mo,
            needsContentAttribute: !0
        }, Le.prototype), S.inputStyles = {
            textarea: Se,
            contenteditable: Le
        }, Ae.prototype = {
            primary: function() {
                return this.ranges[this.primIndex];
            },
            equals: function(e) {
                if (e == this) return !0;
                if (e.primIndex != this.primIndex || e.ranges.length != this.ranges.length) return !1;
                for (var t = 0; t < this.ranges.length; t++) {
                    var n = this.ranges[t], r = e.ranges[t];
                    if (0 != he(n.anchor, r.anchor) || 0 != he(n.head, r.head)) return !1;
                }
                return !0;
            },
            deepCopy: function() {
                for (var e = [], t = 0; t < this.ranges.length; t++) e[t] = new We(de(this.ranges[t].anchor), de(this.ranges[t].head));
                return new Ae(e, this.primIndex);
            },
            somethingSelected: function() {
                for (var e = 0; e < this.ranges.length; e++) if (!this.ranges[e].empty()) return !0;
                return !1;
            },
            contains: function(e, t) {
                t || (t = e);
                for (var n = 0; n < this.ranges.length; n++) {
                    var r = this.ranges[n];
                    if (he(t, r.from()) >= 0 && he(e, r.to()) <= 0) return n;
                }
                return -1;
            }
        }, We.prototype = {
            from: function() {
                return ge(this.anchor, this.head);
            },
            to: function() {
                return pe(this.anchor, this.head);
            },
            empty: function() {
                return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch;
            }
        };
        var vt, yt = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };
        function bt(e, t, n) {
            for (var r, i, o, l, s = 0; s < e.length; s += 3) {
                var a = e[s], c = e[s + 1];
                if (t < a ? (i = 0, o = 1, l = "left") : t < c ? o = (i = t - a) + 1 : (s == e.length - 3 || t == c && e[s + 3] > t) && (i = (o = c - a) - 1, 
                t >= c && (l = "right")), null != i) {
                    if (r = e[s + 2], a == c && n == (r.insertLeft ? "left" : "right") && (l = n), "left" == n && 0 == i) for (;s && e[s - 2] == e[s - 3] && e[s - 1].insertLeft; ) r = e[2 + (s -= 3)], 
                    l = "left";
                    if ("right" == n && i == c - a) for (;s < e.length - 3 && e[s + 3] == e[s + 4] && !e[s + 5].insertLeft; ) r = e[(s += 3) + 2], 
                    l = "right";
                    break;
                }
            }
            return {
                node: r,
                start: i,
                end: o,
                collapse: l,
                coverStart: a,
                coverEnd: c
            };
        }
        function wt(e) {
            if (e.measure && (e.measure.cache = {}, e.measure.heights = null, e.rest)) for (var t = 0; t < e.rest.length; t++) e.measure.caches[t] = {};
        }
        function xt(e) {
            e.display.externalMeasure = null, No(e.display.lineMeasure);
            for (var t = 0; t < e.display.view.length; t++) wt(e.display.view[t]);
        }
        function Ct(e) {
            xt(e), e.display.cachedCharWidth = e.display.cachedTextHeight = e.display.cachedPaddingH = null, 
            e.options.lineWrapping || (e.display.maxLineChanged = !0), e.display.lineNumChars = null;
        }
        function St() {
            return window.pageXOffset || (document.documentElement || document.body).scrollLeft;
        }
        function kt() {
            return window.pageYOffset || (document.documentElement || document.body).scrollTop;
        }
        function Lt(e, t, n, r) {
            if (t.widgets) for (var i = 0; i < t.widgets.length; ++i) if (t.widgets[i].above) {
                var o = Kr(t.widgets[i]);
                n.top += o, n.bottom += o;
            }
            if ("line" == r) return n;
            r || (r = "local");
            var l = ki(t);
            if ("local" == r ? l += lt(e.display) : l -= e.display.viewOffset, "page" == r || "window" == r) {
                var s = e.display.lineSpace.getBoundingClientRect();
                l += s.top + ("window" == r ? 0 : kt());
                var a = s.left + ("window" == r ? 0 : St());
                n.left += a, n.right += a;
            }
            return n.top += l, n.bottom += l, n;
        }
        function Mt(e, t, n) {
            if ("div" == n) return t;
            var r = t.left, i = t.top;
            if ("page" == n) r -= St(), i -= kt(); else if ("local" == n || !n) {
                var o = e.display.sizer.getBoundingClientRect();
                r += o.left, i += o.top;
            }
            var l = e.display.lineSpace.getBoundingClientRect();
            return {
                left: r - l.left,
                top: i - l.top
            };
        }
        function Tt(e, t, n, r, i) {
            return r || (r = yi(e.doc, t.line)), Lt(e, r, dt(e, r, t.ch, i), n);
        }
        function Nt(e, t, n, r, i, o) {
            function l(t, l) {
                var s = mt(e, i, t, l ? "right" : "left", o);
                return l ? s.left = s.right : s.right = s.left, Lt(e, r, s, n);
            }
            function s(e, t) {
                var n = a[t], r = n.level % 2;
                return e == $o(n) && t && n.level < a[t - 1].level ? (e = Zo(n = a[--t]) - (n.level % 2 ? 0 : 1), 
                r = !0) : e == Zo(n) && t < a.length - 1 && n.level < a[t + 1].level && (e = $o(n = a[++t]) - n.level % 2, 
                r = !1), r && e == n.to && e > n.from ? l(e - 1) : l(e, r);
            }
            r = r || yi(e.doc, t.line), i || (i = gt(e, r));
            var a = Li(r), c = t.ch;
            if (!a) return l(c);
            var u = s(c, nl(a, c));
            return null != Xo && (u.other = s(c, Xo)), u;
        }
        function Ot(e, t) {
            var n = 0;
            t = Pe(e.doc, t);
            e.options.lineWrapping || (n = Dt(e.display) * t.ch);
            var r = yi(e.doc, t.line), i = ki(r) + lt(e.display);
            return {
                left: n,
                right: n,
                top: i,
                bottom: i + r.height
            };
        }
        function At(e, t, n, r) {
            var i = fe(e, t);
            return i.xRel = r, n && (i.outside = !0), i;
        }
        function Wt(e, t, n) {
            var r = e.doc;
            if ((n += e.display.viewOffset) < 0) return At(r.first, 0, !0, -1);
            var i = Si(r, n), o = r.first + r.size - 1;
            if (i > o) return At(r.first + r.size - 1, yi(r, o).text.length, !0, 1);
            t < 0 && (t = 0);
            for (var l = yi(r, i); ;) {
                var s = Ft(e, l, i, t, n), a = Dr(l), c = a && a.find(0, !0);
                if (!a || !(s.ch > c.from.ch || s.ch == c.from.ch && s.xRel > 0)) return s;
                i = Ci(l = c.to.line);
            }
        }
        function Ft(e, t, n, r, i) {
            var o = i - ki(t), l = !1, s = 2 * e.display.wrapper.clientWidth, a = gt(e, t);
            function c(r) {
                var i = Nt(e, fe(n, r), "line", t, a);
                return l = !0, o > i.bottom ? i.left - s : o < i.top ? i.left + s : (l = !1, i.left);
            }
            var u = Li(t), f = t.text.length, h = Qo(t), d = Jo(t), p = c(h), g = l, m = c(d), v = l;
            if (r > m) return At(n, d, v, 1);
            for (;;) {
                if (u ? d == h || d == il(t, h, 1) : d - h <= 1) {
                    for (var y = r < p || r - p <= m - r ? h : d, b = r - (y == h ? p : m); Mo(t.text.charAt(y)); ) ++y;
                    return At(n, y, y == h ? g : v, b < -1 ? -1 : b > 1 ? 1 : 0);
                }
                var w = Math.ceil(f / 2), x = h + w;
                if (u) {
                    x = h;
                    for (var C = 0; C < w; ++C) x = il(t, x, 1);
                }
                var S = c(x);
                S > r ? (d = x, m = S, (v = l) && (m += 1e3), f = w) : (h = x, p = S, g = l, f -= w);
            }
        }
        function Ht(e) {
            if (null != e.cachedTextHeight) return e.cachedTextHeight;
            if (null == vt) {
                vt = To("pre");
                for (var t = 0; t < 49; ++t) vt.appendChild(document.createTextNode("x")), vt.appendChild(To("br"));
                vt.appendChild(document.createTextNode("x"));
            }
            Oo(e.measure, vt);
            var n = vt.offsetHeight / 50;
            return n > 3 && (e.cachedTextHeight = n), No(e.measure), n || 1;
        }
        function Dt(e) {
            if (null != e.cachedCharWidth) return e.cachedCharWidth;
            var t = To("span", "xxxxxxxxxx"), n = To("pre", [ t ]);
            Oo(e.measure, n);
            var r = t.getBoundingClientRect(), i = (r.right - r.left) / 10;
            return i > 2 && (e.cachedCharWidth = i), i || 10;
        }
        var Pt, It, Et = null, zt = 0;
        function Rt(e) {
            e.curOp = {
                cm: e,
                viewChanged: !1,
                startHeight: e.doc.height,
                forceUpdate: !1,
                updateInput: null,
                typing: !1,
                changeObjs: null,
                cursorActivityHandlers: null,
                cursorActivityCalled: 0,
                selectionChanged: !1,
                updateMaxLine: !1,
                scrollLeft: null,
                scrollTop: null,
                scrollToPos: null,
                focus: !1,
                id: ++zt
            }, Et ? Et.ops.push(e.curOp) : e.curOp.ownsGroup = Et = {
                ops: [ e.curOp ],
                delayedCallbacks: []
            };
        }
        function Bt(e) {
            var t = e.curOp.ownsGroup;
            if (t) try {
                !function(e) {
                    var t = e.delayedCallbacks, n = 0;
                    do {
                        for (;n < t.length; n++) t[n].call(null);
                        for (var r = 0; r < e.ops.length; r++) {
                            var i = e.ops[r];
                            if (i.cursorActivityHandlers) for (;i.cursorActivityCalled < i.cursorActivityHandlers.length; ) i.cursorActivityHandlers[i.cursorActivityCalled++].call(null, i.cm);
                        }
                    } while (n < t.length);
                }(t);
            } finally {
                Et = null;
                for (var n = 0; n < t.ops.length; n++) t.ops[n].cm.curOp = null;
                !function(e) {
                    for (var t = e.ops, n = 0; n < t.length; n++) Ut(t[n]);
                    for (var n = 0; n < t.length; n++) r = t[n], r.updatedDisplay = r.mustUpdate && q(r.cm, r.update);
                    var r;
                    for (var n = 0; n < t.length; n++) Gt(t[n]);
                    for (var n = 0; n < t.length; n++) Kt(t[n]);
                    for (var n = 0; n < t.length; n++) Vt(t[n]);
                }(t);
            }
        }
        function Ut(e) {
            var t, n, r = e.cm, i = r.display;
            !(n = (t = r).display).scrollbarsClipped && n.scroller.offsetWidth && (n.nativeBarWidth = n.scroller.offsetWidth - n.scroller.clientWidth, 
            n.heightForcer.style.height = ct(t) + "px", n.sizer.style.marginBottom = -n.nativeBarWidth + "px", 
            n.sizer.style.borderRightWidth = ct(t) + "px", n.scrollbarsClipped = !0), e.updateMaxLine && H(r), 
            e.mustUpdate = e.viewChanged || e.forceUpdate || null != e.scrollTop || e.scrollToPos && (e.scrollToPos.from.line < i.viewFrom || e.scrollToPos.to.line >= i.viewTo) || i.maxLineChanged && r.options.lineWrapping, 
            e.update = e.mustUpdate && new _(r, e.mustUpdate && {
                top: e.scrollTop,
                ensure: e.scrollToPos
            }, e.forceUpdate);
        }
        function Gt(e) {
            var t = e.cm, n = t.display;
            e.updatedDisplay && Z(t), e.barMeasure = P(t), n.maxLineChanged && !t.options.lineWrapping && (e.adjustWidthTo = dt(t, n.maxLine, n.maxLine.text.length).left + 3, 
            t.display.sizerWidth = e.adjustWidthTo, e.barMeasure.scrollWidth = Math.max(n.scroller.clientWidth, n.sizer.offsetLeft + e.adjustWidthTo + ct(t) + t.display.barWidth), 
            e.maxScrollLeft = Math.max(0, n.sizer.offsetLeft + e.adjustWidthTo - ut(t))), (e.updatedDisplay || e.selectionChanged) && (e.preparedSelection = n.input.prepareSelection());
        }
        function Kt(e) {
            var t = e.cm;
            null != e.adjustWidthTo && (t.display.sizer.style.minWidth = e.adjustWidthTo + "px", 
            e.maxScrollLeft < t.doc.scrollLeft && pn(t, Math.min(t.display.scroller.scrollLeft, e.maxScrollLeft), !0), 
            t.display.maxLineChanged = !1), e.preparedSelection && t.display.input.showSelection(e.preparedSelection), 
            (e.updatedDisplay || e.startHeight != t.doc.height) && R(t, e.barMeasure), e.updatedDisplay && $(t, e.barMeasure), 
            e.selectionChanged && nt(t), t.state.focused && e.updateInput && t.display.input.reset(e.typing), 
            !e.focus || e.focus != Wo() || document.hasFocus && !document.hasFocus() || me(e.cm);
        }
        function Vt(e) {
            var t = e.cm, n = t.display, r = t.doc;
            if (e.updatedDisplay && X(t, e.update), null == n.wheelStartX || null == e.scrollTop && null == e.scrollLeft && !e.scrollToPos || (n.wheelStartX = n.wheelStartY = null), 
            null == e.scrollTop || n.scroller.scrollTop == e.scrollTop && !e.forceScroll || (r.scrollTop = Math.max(0, Math.min(n.scroller.scrollHeight - n.scroller.clientHeight, e.scrollTop)), 
            n.scrollbars.setScrollTop(r.scrollTop), n.scroller.scrollTop = r.scrollTop), null == e.scrollLeft || n.scroller.scrollLeft == e.scrollLeft && !e.forceScroll || (r.scrollLeft = Math.max(0, Math.min(n.scroller.scrollWidth - n.scroller.clientWidth, e.scrollLeft)), 
            n.scrollbars.setScrollLeft(r.scrollLeft), n.scroller.scrollLeft = r.scrollLeft, 
            G(t)), e.scrollToPos) {
                var i = function(e, t, n, r) {
                    null == r && (r = 0);
                    for (var i = 0; i < 5; i++) {
                        var o = !1, l = Nt(e, t), s = n && n != t ? Nt(e, n) : l, a = Un(e, Math.min(l.left, s.left), Math.min(l.top, s.top) - r, Math.max(l.left, s.left), Math.max(l.bottom, s.bottom) + r), c = e.doc.scrollTop, u = e.doc.scrollLeft;
                        if (null != a.scrollTop && (dn(e, a.scrollTop), Math.abs(e.doc.scrollTop - c) > 1 && (o = !0)), 
                        null != a.scrollLeft && (pn(e, a.scrollLeft), Math.abs(e.doc.scrollLeft - u) > 1 && (o = !0)), 
                        !o) break;
                    }
                    return l;
                }(t, Pe(r, e.scrollToPos.from), Pe(r, e.scrollToPos.to), e.scrollToPos.margin);
                e.scrollToPos.isCursor && t.state.focused && function(e, t) {
                    if (Zi(e, "scrollCursorIntoView")) return;
                    var n = e.display, r = n.sizer.getBoundingClientRect(), i = null;
                    t.top + r.top < 0 ? i = !0 : t.bottom + r.top > (window.innerHeight || document.documentElement.clientHeight) && (i = !1);
                    if (null != i && !d) {
                        var o = To("div", "\u200b", null, "position: absolute; top: " + (t.top - n.viewOffset - lt(e.display)) + "px; height: " + (t.bottom - t.top + ct(e) + n.barHeight) + "px; left: " + t.left + "px; width: 2px;");
                        e.display.lineSpace.appendChild(o), o.scrollIntoView(i), e.display.lineSpace.removeChild(o);
                    }
                }(t, i);
            }
            var o = e.maybeHiddenMarkers, l = e.maybeUnhiddenMarkers;
            if (o) for (var s = 0; s < o.length; ++s) o[s].lines.length || qi(o[s], "hide");
            if (l) for (s = 0; s < l.length; ++s) l[s].lines.length && qi(l[s], "unhide");
            n.wrapper.offsetHeight && (r.scrollTop = t.display.scroller.scrollTop), e.changeObjs && qi(t, "changes", t, e.changeObjs), 
            e.update && e.update.finish();
        }
        function jt(e, t) {
            if (e.curOp) return t();
            Rt(e);
            try {
                return t();
            } finally {
                Bt(e);
            }
        }
        function _t(e, t) {
            return function() {
                if (e.curOp) return t.apply(e, arguments);
                Rt(e);
                try {
                    return t.apply(e, arguments);
                } finally {
                    Bt(e);
                }
            };
        }
        function qt(e) {
            return function() {
                if (this.curOp) return e.apply(this, arguments);
                Rt(this);
                try {
                    return e.apply(this, arguments);
                } finally {
                    Bt(this);
                }
            };
        }
        function Xt(e) {
            return function() {
                var t = this.cm;
                if (!t || t.curOp) return e.apply(this, arguments);
                Rt(t);
                try {
                    return e.apply(this, arguments);
                } finally {
                    Bt(t);
                }
            };
        }
        function Yt(e, t, n) {
            this.line = t, this.rest = function(e) {
                var t, n;
                for (;t = Dr(e); ) e = t.find(1, !0).line, (n || (n = [])).push(e);
                return n;
            }(t), this.size = this.rest ? Ci(fo(this.rest)) - n + 1 : 1, this.node = this.text = null, 
            this.hidden = Rr(e, t);
        }
        function $t(e, t, n) {
            for (var r, i = [], o = t; o < n; o = r) {
                var l = new Yt(e.doc, yi(e.doc, o), o);
                r = o + l.size, i.push(l);
            }
            return i;
        }
        function Zt(e, t, n, r) {
            null == t && (t = e.doc.first), null == n && (n = e.doc.first + e.doc.size), r || (r = 0);
            var i = e.display;
            if (r && n < i.viewTo && (null == i.updateLineNumbers || i.updateLineNumbers > t) && (i.updateLineNumbers = t), 
            e.curOp.viewChanged = !0, t >= i.viewTo) C && Er(e.doc, t) < i.viewTo && Jt(e); else if (n <= i.viewFrom) C && zr(e.doc, n + r) > i.viewFrom ? Jt(e) : (i.viewFrom += r, 
            i.viewTo += r); else if (t <= i.viewFrom && n >= i.viewTo) Jt(e); else if (t <= i.viewFrom) {
                (o = tn(e, n, n + r, 1)) ? (i.view = i.view.slice(o.index), i.viewFrom = o.lineN, 
                i.viewTo += r) : Jt(e);
            } else if (n >= i.viewTo) {
                var o;
                (o = tn(e, t, t, -1)) ? (i.view = i.view.slice(0, o.index), i.viewTo = o.lineN) : Jt(e);
            } else {
                var l = tn(e, t, t, -1), s = tn(e, n, n + r, 1);
                l && s ? (i.view = i.view.slice(0, l.index).concat($t(e, l.lineN, s.lineN)).concat(i.view.slice(s.index)), 
                i.viewTo += r) : Jt(e);
            }
            var a = i.externalMeasured;
            a && (n < a.lineN ? a.lineN += r : t < a.lineN + a.size && (i.externalMeasured = null));
        }
        function Qt(e, t, n) {
            e.curOp.viewChanged = !0;
            var r = e.display, i = e.display.externalMeasured;
            if (i && t >= i.lineN && t < i.lineN + i.size && (r.externalMeasured = null), !(t < r.viewFrom || t >= r.viewTo)) {
                var o = r.view[en(e, t)];
                if (null != o.node) {
                    var l = o.changes || (o.changes = []);
                    -1 == po(l, n) && l.push(n);
                }
            }
        }
        function Jt(e) {
            e.display.viewFrom = e.display.viewTo = e.doc.first, e.display.view = [], e.display.viewOffset = 0;
        }
        function en(e, t) {
            if (t >= e.display.viewTo) return null;
            if ((t -= e.display.viewFrom) < 0) return null;
            for (var n = e.display.view, r = 0; r < n.length; r++) if ((t -= n[r].size) < 0) return r;
        }
        function tn(e, t, n, r) {
            var i, o = en(e, t), l = e.display.view;
            if (!C || n == e.doc.first + e.doc.size) return {
                index: o,
                lineN: n
            };
            for (var s = 0, a = e.display.viewFrom; s < o; s++) a += l[s].size;
            if (a != t) {
                if (r > 0) {
                    if (o == l.length - 1) return null;
                    i = a + l[o].size - t, o++;
                } else i = a - t;
                t += i, n += i;
            }
            for (;Er(e.doc, n) != n; ) {
                if (o == (r < 0 ? 0 : l.length - 1)) return null;
                n += r * l[o - (r < 0 ? 1 : 0)].size, o += r;
            }
            return {
                index: o,
                lineN: n
            };
        }
        function nn(e) {
            for (var t = e.display.view, n = 0, r = 0; r < t.length; r++) {
                var i = t[r];
                i.hidden || i.node && !i.changes || ++n;
            }
            return n;
        }
        function rn(e) {
            var t = e.display;
            t.lastWrapHeight == t.wrapper.clientHeight && t.lastWrapWidth == t.wrapper.clientWidth || (t.cachedCharWidth = t.cachedTextHeight = t.cachedPaddingH = null, 
            t.scrollbarsClipped = !1, e.setSize());
        }
        function on(e, t) {
            for (var n = Ui(t); n != e.wrapper; n = n.parentNode) if (!n || 1 == n.nodeType && "true" == n.getAttribute("cm-ignore-events") || n.parentNode == e.sizer && n != e.mover) return !0;
        }
        function ln(e, t, n, r) {
            var i = e.display;
            if (!n && "true" == Ui(t).getAttribute("cm-not-content")) return null;
            var o, l, s = i.lineSpace.getBoundingClientRect();
            try {
                o = t.clientX - s.left, l = t.clientY - s.top;
            } catch (t) {
                return null;
            }
            var a, c = Wt(e, o, l);
            if (r && 1 == c.xRel && (a = yi(e.doc, c.line).text).length == c.ch) {
                var u = so(a, a.length, e.options.tabSize) - a.length;
                c = fe(c.line, Math.max(0, Math.round((o - at(e.display).left) / Dt(e.display)) - u));
            }
            return c;
        }
        function sn(e) {
            var t = this, n = t.display;
            if (!(Zi(t, e) || n.activeTouch && n.input.supportsTouch())) if (n.shift = e.shiftKey, 
            on(n, e)) s || (n.scroller.draggable = !1, setTimeout(function() {
                n.scroller.draggable = !0;
            }, 100)); else if (!cn(t, e)) {
                var r, i = ln(t, e);
                switch (window.focus(), Gi(e)) {
                  case 1:
                    t.state.selectingText ? t.state.selectingText(e) : i ? function(e, t, n) {
                        o ? setTimeout(bo(me, e), 0) : e.curOp.focus = Wo();
                        var r, i = +new Date();
                        It && It.time > i - 400 && 0 == he(It.pos, n) ? r = "triple" : Pt && Pt.time > i - 400 && 0 == he(Pt.pos, n) ? (r = "double", 
                        It = {
                            time: i,
                            pos: n
                        }) : (r = "single", Pt = {
                            time: i,
                            pos: n
                        });
                        var a, c = e.doc.sel, u = m ? t.metaKey : t.ctrlKey;
                        e.options.dragDrop && Bo && !e.isReadOnly() && "single" == r && (a = c.contains(n)) > -1 && (he((a = c.ranges[a]).from(), n) < 0 || n.xRel > 0) && (he(a.to(), n) > 0 || n.xRel < 0) ? function(e, t, n, r) {
                            var i = e.display, a = +new Date(), c = _t(e, function(u) {
                                s && (i.scroller.draggable = !1), e.state.draggingText = !1, _i(document, "mouseup", c), 
                                _i(i.scroller, "drop", c), Math.abs(t.clientX - u.clientX) + Math.abs(t.clientY - u.clientY) < 10 && (Ei(u), 
                                !r && +new Date() - 200 < a && Re(e.doc, n), s || o && 9 == l ? setTimeout(function() {
                                    document.body.focus(), i.input.focus();
                                }, 20) : i.input.focus());
                            });
                            s && (i.scroller.draggable = !0);
                            e.state.draggingText = c, i.scroller.dragDrop && i.scroller.dragDrop();
                            Ki(document, "mouseup", c), Ki(i.scroller, "drop", c);
                        }(e, t, n, u) : function(e, t, n, r, i) {
                            var o = e.display, l = e.doc;
                            Ei(t);
                            var s, a, c = l.sel, u = c.ranges;
                            i && !t.shiftKey ? (a = l.sel.contains(n), s = a > -1 ? u[a] : new We(n, n)) : (s = l.sel.primary(), 
                            a = l.sel.primIndex);
                            if (t.altKey) r = "rect", i || (s = new We(n, n)), n = ln(e, t, !0, !0), a = -1; else if ("double" == r) {
                                var f = e.findWordAt(n);
                                s = e.display.shift || l.extend ? ze(l, s, f.anchor, f.head) : f;
                            } else if ("triple" == r) {
                                var h = new We(fe(n.line, 0), Pe(l, fe(n.line + 1, 0)));
                                s = e.display.shift || l.extend ? ze(l, s, h.anchor, h.head) : h;
                            } else s = ze(l, s, n);
                            i ? -1 == a ? (a = u.length, Ve(l, Fe(u.concat([ s ]), a), {
                                scroll: !1,
                                origin: "*mouse"
                            })) : u.length > 1 && u[a].empty() && "single" == r && !t.shiftKey ? (Ve(l, Fe(u.slice(0, a).concat(u.slice(a + 1)), 0), {
                                scroll: !1,
                                origin: "*mouse"
                            }), c = l.sel) : Ue(l, a, s, io) : (a = 0, Ve(l, new Ae([ s ], 0), io), c = l.sel);
                            var d = n;
                            var p = o.wrapper.getBoundingClientRect(), g = 0;
                            function m(t) {
                                var i = ++g, u = ln(e, t, !0, "rect" == r);
                                if (u) if (0 != he(u, d)) {
                                    e.curOp.focus = Wo(), function(t) {
                                        if (0 == he(d, t)) return;
                                        if (d = t, "rect" == r) {
                                            for (var i = [], o = e.options.tabSize, u = so(yi(l, n.line).text, n.ch, o), f = so(yi(l, t.line).text, t.ch, o), h = Math.min(u, f), p = Math.max(u, f), g = Math.min(n.line, t.line), m = Math.min(e.lastLine(), Math.max(n.line, t.line)); g <= m; g++) {
                                                var v = yi(l, g).text, y = ao(v, h, o);
                                                h == p ? i.push(new We(fe(g, y), fe(g, y))) : v.length > y && i.push(new We(fe(g, y), fe(g, ao(v, p, o))));
                                            }
                                            i.length || i.push(new We(n, n)), Ve(l, Fe(c.ranges.slice(0, a).concat(i), a), {
                                                origin: "*mouse",
                                                scroll: !1
                                            }), e.scrollIntoView(t);
                                        } else {
                                            var b = s, w = b.anchor, x = t;
                                            if ("single" != r) {
                                                if ("double" == r) var C = e.findWordAt(t); else var C = new We(fe(t.line, 0), Pe(l, fe(t.line + 1, 0)));
                                                he(C.anchor, w) > 0 ? (x = C.head, w = ge(b.from(), C.anchor)) : (x = C.anchor, 
                                                w = pe(b.to(), C.head));
                                            }
                                            var i = c.ranges.slice(0);
                                            i[a] = new We(Pe(l, w), x), Ve(l, Fe(i, a), io);
                                        }
                                    }(u);
                                    var f = U(o, l);
                                    (u.line >= f.to || u.line < f.from) && setTimeout(_t(e, function() {
                                        g == i && m(t);
                                    }), 150);
                                } else {
                                    var h = t.clientY < p.top ? -20 : t.clientY > p.bottom ? 20 : 0;
                                    h && setTimeout(_t(e, function() {
                                        g == i && (o.scroller.scrollTop += h, m(t));
                                    }), 50);
                                }
                            }
                            function v(t) {
                                e.state.selectingText = !1, g = 1 / 0, Ei(t), o.input.focus(), _i(document, "mousemove", y), 
                                _i(document, "mouseup", b), l.history.lastSelOrigin = null;
                            }
                            var y = _t(e, function(e) {
                                Gi(e) ? m(e) : v(e);
                            }), b = _t(e, v);
                            e.state.selectingText = b, Ki(document, "mousemove", y), Ki(document, "mouseup", b);
                        }(e, t, n, r, u);
                    }(t, e, i) : Ui(e) == n.scroller && Ei(e);
                    break;

                  case 2:
                    s && (t.state.lastMiddleDown = +new Date()), i && Re(t.doc, i), setTimeout(function() {
                        n.input.focus();
                    }, 20), Ei(e);
                    break;

                  case 3:
                    w ? On(t, e) : ((r = t).state.delayingBlurEvent = !0, setTimeout(function() {
                        r.state.delayingBlurEvent && (r.state.delayingBlurEvent = !1, Nn(r));
                    }, 100));
                }
            }
        }
        function an(e, t, n, r) {
            try {
                var i = t.clientX, o = t.clientY;
            } catch (t) {
                return !1;
            }
            if (i >= Math.floor(e.display.gutters.getBoundingClientRect().right)) return !1;
            r && Ei(t);
            var l = e.display, s = l.lineDiv.getBoundingClientRect();
            if (o > s.bottom || !Ji(e, n)) return Ri(t);
            o -= s.top - l.viewOffset;
            for (var a = 0; a < e.options.gutters.length; ++a) {
                var c = l.gutters.childNodes[a];
                if (c && c.getBoundingClientRect().right >= i) {
                    var u = Si(e.doc, o), f = e.options.gutters[a];
                    return qi(e, n, e, u, f, t), Ri(t);
                }
            }
        }
        function cn(e, t) {
            return an(e, t, "gutterClick", !0);
        }
        var un = 0;
        function fn(e) {
            var t = this;
            if (hn(t), !Zi(t, e) && !on(t.display, e)) {
                Ei(e), o && (un = +new Date());
                var n = ln(t, e, !0), r = e.dataTransfer.files;
                if (n && !t.isReadOnly()) if (r && r.length && window.FileReader && window.File) for (var i = r.length, l = Array(i), s = 0, a = function(e, r) {
                    if (!t.options.allowDropFileTypes || -1 != po(t.options.allowDropFileTypes, e.type)) {
                        var o = new FileReader();
                        o.onload = _t(t, function() {
                            var e = o.result;
                            if (/[\x00-\x08\x0e-\x1f]{2}/.test(e) && (e = ""), l[r] = e, ++s == i) {
                                var a = {
                                    from: n = Pe(t.doc, n),
                                    to: n,
                                    text: t.doc.splitLines(l.join(t.doc.lineSeparator())),
                                    origin: "paste"
                                };
                                Pn(t.doc, a), Ke(t.doc, He(n, An(a)));
                            }
                        }), o.readAsText(e);
                    }
                }, c = 0; c < i; ++c) a(r[c], c); else {
                    if (t.state.draggingText && t.doc.sel.contains(n) > -1) return t.state.draggingText(e), 
                    void setTimeout(function() {
                        t.display.input.focus();
                    }, 20);
                    try {
                        if (l = e.dataTransfer.getData("Text")) {
                            if (t.state.draggingText && !(m ? e.altKey : e.ctrlKey)) var u = t.listSelections();
                            if (je(t.doc, He(n, n)), u) for (c = 0; c < u.length; ++c) Bn(t.doc, "", u[c].anchor, u[c].head, "drag");
                            t.replaceSelection(l, "around", "paste"), t.display.input.focus();
                        }
                    } catch (e) {}
                }
            }
        }
        function hn(e) {
            e.display.dragCursor && (e.display.lineSpace.removeChild(e.display.dragCursor), 
            e.display.dragCursor = null);
        }
        function dn(e, t) {
            Math.abs(e.doc.scrollTop - t) < 2 || (e.doc.scrollTop = t, n || Y(e, {
                top: t
            }), e.display.scroller.scrollTop != t && (e.display.scroller.scrollTop = t), e.display.scrollbars.setScrollTop(t), 
            n && Y(e), rt(e, 100));
        }
        function pn(e, t, n) {
            (n ? t == e.doc.scrollLeft : Math.abs(e.doc.scrollLeft - t) < 2) || (t = Math.min(t, e.display.scroller.scrollWidth - e.display.scroller.clientWidth), 
            e.doc.scrollLeft = t, G(e), e.display.scroller.scrollLeft != t && (e.display.scroller.scrollLeft = t), 
            e.display.scrollbars.setScrollLeft(t));
        }
        var gn = 0, mn = null;
        o ? mn = -.53 : n ? mn = 15 : c ? mn = -.7 : f && (mn = -1 / 3);
        var vn = function(e) {
            var t = e.wheelDeltaX, n = e.wheelDeltaY;
            return null == t && e.detail && e.axis == e.HORIZONTAL_AXIS && (t = e.detail), null == n && e.detail && e.axis == e.VERTICAL_AXIS ? n = e.detail : null == n && (n = e.wheelDelta), 
            {
                x: t,
                y: n
            };
        };
        function yn(e, t) {
            var r = vn(t), i = r.x, o = r.y, l = e.display, a = l.scroller, c = a.scrollWidth > a.clientWidth, f = a.scrollHeight > a.clientHeight;
            if (i && c || o && f) {
                if (o && m && s) e: for (var h = t.target, d = l.view; h != a; h = h.parentNode) for (var p = 0; p < d.length; p++) if (d[p].node == h) {
                    e.display.currentWheelTarget = h;
                    break e;
                }
                if (i && !n && !u && null != mn) return o && f && dn(e, Math.max(0, Math.min(a.scrollTop + o * mn, a.scrollHeight - a.clientHeight))), 
                pn(e, Math.max(0, Math.min(a.scrollLeft + i * mn, a.scrollWidth - a.clientWidth))), 
                (!o || o && f) && Ei(t), void (l.wheelStartX = null);
                if (o && null != mn) {
                    var g = o * mn, v = e.doc.scrollTop, y = v + l.wrapper.clientHeight;
                    g < 0 ? v = Math.max(0, v + g - 50) : y = Math.min(e.doc.height, y + g + 50), Y(e, {
                        top: v,
                        bottom: y
                    });
                }
                gn < 20 && (null == l.wheelStartX ? (l.wheelStartX = a.scrollLeft, l.wheelStartY = a.scrollTop, 
                l.wheelDX = i, l.wheelDY = o, setTimeout(function() {
                    if (null != l.wheelStartX) {
                        var e = a.scrollLeft - l.wheelStartX, t = a.scrollTop - l.wheelStartY, n = t && l.wheelDY && t / l.wheelDY || e && l.wheelDX && e / l.wheelDX;
                        l.wheelStartX = l.wheelStartY = null, n && (mn = (mn * gn + n) / (gn + 1), ++gn);
                    }
                }, 200)) : (l.wheelDX += i, l.wheelDY += o));
            }
        }
        function bn(e, t, n) {
            if ("string" == typeof t && !(t = sr[t])) return !1;
            e.display.input.ensurePolled();
            var r = e.display.shift, i = !1;
            try {
                e.isReadOnly() && (e.state.suppressEdits = !0), n && (e.display.shift = !1), i = t(e) != no;
            } finally {
                e.display.shift = r, e.state.suppressEdits = !1;
            }
            return i;
        }
        S.wheelEventPixels = function(e) {
            var t = vn(e);
            return t.x *= mn, t.y *= mn, t;
        };
        var wn = new lo();
        function xn(e, t, n, r) {
            var i = e.state.keySeq;
            if (i) {
                if (fr(t)) return "handled";
                wn.set(50, function() {
                    e.state.keySeq == i && (e.state.keySeq = null, e.display.input.reset());
                }), t = i + " " + t;
            }
            var o = function(e, t, n) {
                for (var r = 0; r < e.state.keyMaps.length; r++) {
                    var i = ur(t, e.state.keyMaps[r], n, e);
                    if (i) return i;
                }
                return e.options.extraKeys && ur(t, e.options.extraKeys, n, e) || ur(t, e.options.keyMap, n, e);
            }(e, t, r);
            return "multi" == o && (e.state.keySeq = t), "handled" == o && Yi(e, "keyHandled", e, t, n), 
            "handled" != o && "multi" != o || (Ei(n), nt(e)), i && !o && /\'$/.test(t) ? (Ei(n), 
            !0) : !!o;
        }
        function Cn(e, t) {
            var n = hr(t, !0);
            return !!n && (t.shiftKey && !e.state.keySeq ? xn(e, "Shift-" + n, t, function(t) {
                return bn(e, t, !0);
            }) || xn(e, n, t, function(t) {
                if ("string" == typeof t ? /^go[A-Z]/.test(t) : t.motion) return bn(e, t);
            }) : xn(e, n, t, function(t) {
                return bn(e, t);
            }));
        }
        var Sn = null;
        function kn(e) {
            var t = this;
            if (t.curOp.focus = Wo(), !Zi(t, e)) {
                o && l < 11 && 27 == e.keyCode && (e.returnValue = !1);
                var n = e.keyCode;
                t.display.shift = 16 == n || e.shiftKey;
                var r = Cn(t, e);
                u && (Sn = r ? n : null, !r && 88 == n && !_o && (m ? e.metaKey : e.ctrlKey) && t.replaceSelection("", null, "cut")), 
                18 != n || /\bCodeMirror-crosshair\b/.test(t.display.lineDiv.className) || function(e) {
                    var t = e.display.lineDiv;
                    function n(e) {
                        18 != e.keyCode && e.altKey || (Ho(t, "CodeMirror-crosshair"), _i(document, "keyup", n), 
                        _i(document, "mouseover", n));
                    }
                    Do(t, "CodeMirror-crosshair"), Ki(document, "keyup", n), Ki(document, "mouseover", n);
                }(t);
            }
        }
        function Ln(e) {
            16 == e.keyCode && (this.doc.sel.shift = !1), Zi(this, e);
        }
        function Mn(e) {
            var t = this;
            if (!(on(t.display, e) || Zi(t, e) || e.ctrlKey && !e.altKey || m && e.metaKey)) {
                var n = e.keyCode, r = e.charCode;
                if (u && n == Sn) return Sn = null, void Ei(e);
                if (!u || e.which && !(e.which < 10) || !Cn(t, e)) {
                    var i, o = String.fromCharCode(null == r ? n : r);
                    if (!xn(i = t, "'" + o + "'", e, function(e) {
                        return bn(i, e, !0);
                    })) t.display.input.onKeyPress(e);
                }
            }
        }
        function Tn(e) {
            e.state.delayingBlurEvent && (e.state.delayingBlurEvent = !1), "nocursor" != e.options.readOnly && (e.state.focused || (qi(e, "focus", e), 
            e.state.focused = !0, Do(e.display.wrapper, "CodeMirror-focused"), e.curOp || e.display.selForContextMenu == e.doc.sel || (e.display.input.reset(), 
            s && setTimeout(function() {
                e.display.input.reset(!0);
            }, 20)), e.display.input.receivedFocus()), nt(e));
        }
        function Nn(e) {
            e.state.delayingBlurEvent || (e.state.focused && (qi(e, "blur", e), e.state.focused = !1, 
            Ho(e.display.wrapper, "CodeMirror-focused")), clearInterval(e.display.blinker), 
            setTimeout(function() {
                e.state.focused || (e.display.shift = !1);
            }, 150));
        }
        function On(e, t) {
            var n, r;
            on(e.display, t) || (n = e, r = t, Ji(n, "gutterContextMenu") && an(n, r, "gutterContextMenu", !1)) || (Zi(e, t, "contextmenu") || e.display.input.onContextMenu(t));
        }
        var An = S.changeEnd = function(e) {
            return e.text ? fe(e.from.line + e.text.length - 1, fo(e.text).length + (1 == e.text.length ? e.from.ch : 0)) : e.to;
        };
        function Wn(e, t) {
            if (he(e, t.from) < 0) return e;
            if (he(e, t.to) <= 0) return An(t);
            var n = e.line + t.text.length - (t.to.line - t.from.line) - 1, r = e.ch;
            return e.line == t.to.line && (r += An(t).ch - t.to.ch), fe(n, r);
        }
        function Fn(e, t) {
            for (var n = [], r = 0; r < e.sel.ranges.length; r++) {
                var i = e.sel.ranges[r];
                n.push(new We(Wn(i.anchor, t), Wn(i.head, t)));
            }
            return Fe(n, e.sel.primIndex);
        }
        function Hn(e, t, n) {
            return e.line == t.line ? fe(n.line, e.ch - t.ch + n.ch) : fe(n.line + (e.line - t.line), e.ch);
        }
        function Dn(e, t, n) {
            var r = {
                canceled: !1,
                from: t.from,
                to: t.to,
                text: t.text,
                origin: t.origin,
                cancel: function() {
                    this.canceled = !0;
                }
            };
            return n && (r.update = function(t, n, r, i) {
                t && (this.from = Pe(e, t)), n && (this.to = Pe(e, n)), r && (this.text = r), void 0 !== i && (this.origin = i);
            }), qi(e, "beforeChange", e, r), e.cm && qi(e.cm, "beforeChange", e.cm, r), r.canceled ? null : {
                from: r.from,
                to: r.to,
                text: r.text,
                origin: r.origin
            };
        }
        function Pn(e, t, n) {
            if (e.cm) {
                if (!e.cm.curOp) return _t(e.cm, Pn)(e, t, n);
                if (e.cm.state.suppressEdits) return;
            }
            if (!(Ji(e, "beforeChange") || e.cm && Ji(e.cm, "beforeChange")) || (t = Dn(e, t, !0))) {
                var r = x && !n && function(e, t, n) {
                    var r = null;
                    if (e.iter(t.line, n.line + 1, function(e) {
                        if (e.markedSpans) for (var t = 0; t < e.markedSpans.length; ++t) {
                            var n = e.markedSpans[t].marker;
                            !n.readOnly || r && -1 != po(r, n) || (r || (r = [])).push(n);
                        }
                    }), !r) return null;
                    for (var i = [ {
                        from: t,
                        to: n
                    } ], o = 0; o < r.length; ++o) for (var l = r[o], s = l.find(0), a = 0; a < i.length; ++a) {
                        var c = i[a];
                        if (!(he(c.to, s.from) < 0 || he(c.from, s.to) > 0)) {
                            var u = [ a, 1 ], f = he(c.from, s.from), h = he(c.to, s.to);
                            (f < 0 || !l.inclusiveLeft && !f) && u.push({
                                from: c.from,
                                to: s.from
                            }), (h > 0 || !l.inclusiveRight && !h) && u.push({
                                from: s.to,
                                to: c.to
                            }), i.splice.apply(i, u), a += u.length - 1;
                        }
                    }
                    return i;
                }(e, t.from, t.to);
                if (r) for (var i = r.length - 1; i >= 0; --i) In(e, {
                    from: r[i].from,
                    to: r[i].to,
                    text: i ? [ "" ] : t.text
                }); else In(e, t);
            }
        }
        function In(e, t) {
            if (1 != t.text.length || "" != t.text[0] || 0 != he(t.from, t.to)) {
                var n = Fn(e, t);
                Oi(e, t, n, e.cm ? e.cm.curOp.id : NaN), Rn(e, t, n, kr(e, t));
                var r = [];
                mi(e, function(e, n) {
                    n || -1 != po(r, e.history) || (Ii(e.history, t), r.push(e.history)), Rn(e, t, null, kr(e, t));
                });
            }
        }
        function En(e, t, n) {
            if (!e.cm || !e.cm.state.suppressEdits) {
                for (var r, i = e.history, o = e.sel, l = "undo" == t ? i.done : i.undone, s = "undo" == t ? i.undone : i.done, a = 0; a < l.length && (r = l[a], 
                n ? !r.ranges || r.equals(e.sel) : r.ranges); a++) ;
                if (a != l.length) {
                    for (i.lastOrigin = i.lastSelOrigin = null; (r = l.pop()).ranges; ) {
                        if (Ai(r, s), n && !r.equals(e.sel)) return void Ve(e, r, {
                            clearRedo: !1
                        });
                        o = r;
                    }
                    var c = [];
                    Ai(o, s), s.push({
                        changes: c,
                        generation: i.generation
                    }), i.generation = r.generation || ++i.maxGeneration;
                    var u = Ji(e, "beforeChange") || e.cm && Ji(e.cm, "beforeChange");
                    for (a = r.changes.length - 1; a >= 0; --a) {
                        var f = r.changes[a];
                        if (f.origin = t, u && !Dn(e, f, !1)) return void (l.length = 0);
                        c.push(Ti(e, f));
                        var h = a ? Fn(e, f) : fo(l);
                        Rn(e, f, h, Mr(e, f)), !a && e.cm && e.cm.scrollIntoView({
                            from: f.from,
                            to: An(f)
                        });
                        var d = [];
                        mi(e, function(e, t) {
                            t || -1 != po(d, e.history) || (Ii(e.history, f), d.push(e.history)), Rn(e, f, null, Mr(e, f));
                        });
                    }
                }
            }
        }
        function zn(e, t) {
            if (0 != t && (e.first += t, e.sel = new Ae(go(e.sel.ranges, function(e) {
                return new We(fe(e.anchor.line + t, e.anchor.ch), fe(e.head.line + t, e.head.ch));
            }), e.sel.primIndex), e.cm)) {
                Zt(e.cm, e.first, e.first - t, t);
                for (var n = e.cm.display, r = n.viewFrom; r < n.viewTo; r++) Qt(e.cm, r, "gutter");
            }
        }
        function Rn(e, t, n, r) {
            if (e.cm && !e.cm.curOp) return _t(e.cm, Rn)(e, t, n, r);
            if (t.to.line < e.first) zn(e, t.text.length - 1 - (t.to.line - t.from.line)); else if (!(t.from.line > e.lastLine())) {
                if (t.from.line < e.first) {
                    var i = t.text.length - 1 - (e.first - t.from.line);
                    zn(e, i), t = {
                        from: fe(e.first, 0),
                        to: fe(t.to.line + i, t.to.ch),
                        text: [ fo(t.text) ],
                        origin: t.origin
                    };
                }
                var o = e.lastLine();
                t.to.line > o && (t = {
                    from: t.from,
                    to: fe(o, yi(e, o).text.length),
                    text: [ t.text[0] ],
                    origin: t.origin
                }), t.removed = bi(e, t.from, t.to), n || (n = Fn(e, t)), e.cm ? function(e, t, n) {
                    var r = e.doc, i = e.display, o = t.from, l = t.to, s = !1, a = o.line;
                    e.options.lineWrapping || (a = Ci(Ir(yi(r, o.line))), r.iter(a, l.line + 1, function(e) {
                        if (e == i.maxLine) return s = !0, !0;
                    }));
                    r.sel.contains(t.from, t.to) > -1 && Qi(e);
                    ci(r, t, n, M(e)), e.options.lineWrapping || (r.iter(a, o.line + t.text.length, function(e) {
                        var t = F(e);
                        t > i.maxLineLength && (i.maxLine = e, i.maxLineLength = t, i.maxLineChanged = !0, 
                        s = !1);
                    }), s && (e.curOp.updateMaxLine = !0));
                    r.frontier = Math.min(r.frontier, o.line), rt(e, 400);
                    var c = t.text.length - (l.line - o.line) - 1;
                    t.full ? Zt(e) : o.line != l.line || 1 != t.text.length || ai(e.doc, t) ? Zt(e, o.line, l.line + 1, c) : Qt(e, o.line, "text");
                    var u = Ji(e, "changes"), f = Ji(e, "change");
                    if (f || u) {
                        var h = {
                            from: o,
                            to: l,
                            text: t.text,
                            removed: t.removed,
                            origin: t.origin
                        };
                        f && Yi(e, "change", e, h), u && (e.curOp.changeObjs || (e.curOp.changeObjs = [])).push(h);
                    }
                    e.display.selForContextMenu = null;
                }(e.cm, t, r) : ci(e, t, r), je(e, n, ro);
            }
        }
        function Bn(e, t, n, r, i) {
            if (r || (r = n), he(r, n) < 0) {
                var o = r;
                r = n, n = o;
            }
            "string" == typeof t && (t = e.splitLines(t)), Pn(e, {
                from: n,
                to: r,
                text: t,
                origin: i
            });
        }
        function Un(e, t, n, r, i) {
            var o = e.display, l = Ht(e.display);
            n < 0 && (n = 0);
            var s = e.curOp && null != e.curOp.scrollTop ? e.curOp.scrollTop : o.scroller.scrollTop, a = ft(e), c = {};
            i - n > a && (i = n + a);
            var u = e.doc.height + st(o), f = n < l, h = i > u - l;
            if (n < s) c.scrollTop = f ? 0 : n; else if (i > s + a) {
                var d = Math.min(n, (h ? u : i) - a);
                d != s && (c.scrollTop = d);
            }
            var p = e.curOp && null != e.curOp.scrollLeft ? e.curOp.scrollLeft : o.scroller.scrollLeft, g = ut(e) - (e.options.fixedGutter ? o.gutters.offsetWidth : 0), m = r - t > g;
            return m && (r = t + g), t < 10 ? c.scrollLeft = 0 : t < p ? c.scrollLeft = Math.max(0, t - (m ? 0 : 10)) : r > g + p - 3 && (c.scrollLeft = r + (m ? 0 : 10) - g), 
            c;
        }
        function Gn(e, t, n) {
            null == t && null == n || Vn(e), null != t && (e.curOp.scrollLeft = (null == e.curOp.scrollLeft ? e.doc.scrollLeft : e.curOp.scrollLeft) + t), 
            null != n && (e.curOp.scrollTop = (null == e.curOp.scrollTop ? e.doc.scrollTop : e.curOp.scrollTop) + n);
        }
        function Kn(e) {
            Vn(e);
            var t = e.getCursor(), n = t, r = t;
            e.options.lineWrapping || (n = t.ch ? fe(t.line, t.ch - 1) : t, r = fe(t.line, t.ch + 1)), 
            e.curOp.scrollToPos = {
                from: n,
                to: r,
                margin: e.options.cursorScrollMargin,
                isCursor: !0
            };
        }
        function Vn(e) {
            var t = e.curOp.scrollToPos;
            if (t) {
                e.curOp.scrollToPos = null;
                var n = Ot(e, t.from), r = Ot(e, t.to), i = Un(e, Math.min(n.left, r.left), Math.min(n.top, r.top) - t.margin, Math.max(n.right, r.right), Math.max(n.bottom, r.bottom) + t.margin);
                e.scrollTo(i.scrollLeft, i.scrollTop);
            }
        }
        function jn(e, t, n, r) {
            var i, o = e.doc;
            null == n && (n = "add"), "smart" == n && (o.mode.indent ? i = ot(e, t) : n = "prev");
            var l = e.options.tabSize, s = yi(o, t), a = so(s.text, null, l);
            s.stateAfter && (s.stateAfter = null);
            var c, u = s.text.match(/^\s*/)[0];
            if (r || /\S/.test(s.text)) {
                if ("smart" == n && ((c = o.mode.indent(i, s.text.slice(u.length), s.text)) == no || c > 150)) {
                    if (!r) return;
                    n = "prev";
                }
            } else c = 0, n = "not";
            "prev" == n ? c = t > o.first ? so(yi(o, t - 1).text, null, l) : 0 : "add" == n ? c = a + e.options.indentUnit : "subtract" == n ? c = a - e.options.indentUnit : "number" == typeof n && (c = a + n), 
            c = Math.max(0, c);
            var f = "", h = 0;
            if (e.options.indentWithTabs) for (var d = Math.floor(c / l); d; --d) h += l, f += "\t";
            if (h < c && (f += uo(c - h)), f != u) return Bn(o, f, fe(t, 0), fe(t, u.length), "+input"), 
            s.stateAfter = null, !0;
            for (d = 0; d < o.sel.ranges.length; d++) {
                var p = o.sel.ranges[d];
                if (p.head.line == t && p.head.ch < u.length) {
                    Ue(o, d, new We(h = fe(t, u.length), h));
                    break;
                }
            }
        }
        function _n(e, t, n, r) {
            var i = t, o = t;
            return "number" == typeof t ? o = yi(e, De(e, t)) : i = Ci(t), null == i ? null : (r(o, i) && e.cm && Qt(e.cm, i, n), 
            o);
        }
        function qn(e, t) {
            for (var n = e.doc.sel.ranges, r = [], i = 0; i < n.length; i++) {
                for (var o = t(n[i]); r.length && he(o.from, fo(r).to) <= 0; ) {
                    var l = r.pop();
                    if (he(l.from, o.from) < 0) {
                        o.from = l.from;
                        break;
                    }
                }
                r.push(o);
            }
            jt(e, function() {
                for (var t = r.length - 1; t >= 0; t--) Bn(e.doc, "", r[t].from, r[t].to, "+delete");
                Kn(e);
            });
        }
        function Xn(e, t, n, r, i) {
            var o = t.line, l = t.ch, s = n, a = yi(e, o);
            function c(t) {
                var r, s = (i ? il : ol)(a, l, n, !0);
                if (null == s) {
                    if (t || (r = o + n) < e.first || r >= e.first + e.size || (o = r, !(a = yi(e, r)))) return !1;
                    l = i ? (n < 0 ? Jo : Qo)(a) : n < 0 ? a.text.length : 0;
                } else l = s;
                return !0;
            }
            if ("char" == r) c(); else if ("column" == r) c(!0); else if ("word" == r || "group" == r) for (var u = null, f = "group" == r, h = e.cm && e.cm.getHelper(t, "wordChars"), d = !0; !(n < 0) || c(!d); d = !1) {
                var p = a.text.charAt(l) || "\n", g = Co(p, h) ? "w" : f && "\n" == p ? "n" : !f || /\s/.test(p) ? null : "p";
                if (!f || d || g || (g = "s"), u && u != g) {
                    n < 0 && (n = 1, c());
                    break;
                }
                if (g && (u = g), n > 0 && !c(!d)) break;
            }
            var m = $e(e, fe(o, l), t, s, !0);
            return he(t, m) || (m.hitSide = !0), m;
        }
        function Yn(e, t, n, r) {
            var i, o = e.doc, l = t.left;
            if ("page" == r) {
                var s = Math.min(e.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
                i = t.top + n * (s - (n < 0 ? 1.5 : .5) * Ht(e.display));
            } else "line" == r && (i = n > 0 ? t.bottom + 3 : t.top - 3);
            for (;;) {
                var a = Wt(e, l, i);
                if (!a.outside) break;
                if (n < 0 ? i <= 0 : i >= o.height) {
                    a.hitSide = !0;
                    break;
                }
                i += 5 * n;
            }
            return a;
        }
        S.prototype = {
            constructor: S,
            focus: function() {
                window.focus(), this.display.input.focus();
            },
            setOption: function(e, t) {
                var n = this.options, r = n[e];
                n[e] == t && "mode" != e || (n[e] = t, Zn.hasOwnProperty(e) && _t(this, Zn[e])(this, t, r));
            },
            getOption: function(e) {
                return this.options[e];
            },
            getDoc: function() {
                return this.doc;
            },
            addKeyMap: function(e, t) {
                this.state.keyMaps[t ? "push" : "unshift"](dr(e));
            },
            removeKeyMap: function(e) {
                for (var t = this.state.keyMaps, n = 0; n < t.length; ++n) if (t[n] == e || t[n].name == e) return t.splice(n, 1), 
                !0;
            },
            addOverlay: qt(function(e, t) {
                var n = e.token ? e : S.getMode(this.options, e);
                if (n.startState) throw new Error("Overlays may not be stateful.");
                this.state.overlays.push({
                    mode: n,
                    modeSpec: e,
                    opaque: t && t.opaque
                }), this.state.modeGen++, Zt(this);
            }),
            removeOverlay: qt(function(e) {
                for (var t = this.state.overlays, n = 0; n < t.length; ++n) {
                    var r = t[n].modeSpec;
                    if (r == e || "string" == typeof e && r.name == e) return t.splice(n, 1), this.state.modeGen++, 
                    void Zt(this);
                }
            }),
            indentLine: qt(function(e, t, n) {
                "string" != typeof t && "number" != typeof t && (t = null == t ? this.options.smartIndent ? "smart" : "prev" : t ? "add" : "subtract"), 
                Ie(this.doc, e) && jn(this, e, t, n);
            }),
            indentSelection: qt(function(e) {
                for (var t = this.doc.sel.ranges, n = -1, r = 0; r < t.length; r++) {
                    var i = t[r];
                    if (i.empty()) i.head.line > n && (jn(this, i.head.line, e, !0), n = i.head.line, 
                    r == this.doc.sel.primIndex && Kn(this)); else {
                        var o = i.from(), l = i.to(), s = Math.max(n, o.line);
                        n = Math.min(this.lastLine(), l.line - (l.ch ? 0 : 1)) + 1;
                        for (var a = s; a < n; ++a) jn(this, a, e);
                        var c = this.doc.sel.ranges;
                        0 == o.ch && t.length == c.length && c[r].from().ch > 0 && Ue(this.doc, r, new We(o, c[r].to()), ro);
                    }
                }
            }),
            getTokenAt: function(e, t) {
                return Xr(this, e, t);
            },
            getLineTokens: function(e, t) {
                return Xr(this, fe(e), t, !0);
            },
            getTokenTypeAt: function(e) {
                e = Pe(this.doc, e);
                var t, n = Zr(this, yi(this.doc, e.line)), r = 0, i = (n.length - 1) / 2, o = e.ch;
                if (0 == o) t = n[2]; else for (;;) {
                    var l = r + i >> 1;
                    if ((l ? n[2 * l - 1] : 0) >= o) i = l; else {
                        if (!(n[2 * l + 1] < o)) {
                            t = n[2 * l + 2];
                            break;
                        }
                        r = l + 1;
                    }
                }
                var s = t ? t.indexOf("cm-overlay ") : -1;
                return s < 0 ? t : 0 == s ? null : t.slice(0, s - 1);
            },
            getModeAt: function(e) {
                var t = this.doc.mode;
                return t.innerMode ? S.innerMode(t, this.getTokenAt(e).state).mode : t;
            },
            getHelper: function(e, t) {
                return this.getHelpers(e, t)[0];
            },
            getHelpers: function(e, t) {
                var n = [];
                if (!ir.hasOwnProperty(t)) return n;
                var r = ir[t], i = this.getModeAt(e);
                if ("string" == typeof i[t]) r[i[t]] && n.push(r[i[t]]); else if (i[t]) for (var o = 0; o < i[t].length; o++) {
                    var l = r[i[t][o]];
                    l && n.push(l);
                } else i.helperType && r[i.helperType] ? n.push(r[i.helperType]) : r[i.name] && n.push(r[i.name]);
                for (o = 0; o < r._global.length; o++) {
                    var s = r._global[o];
                    s.pred(i, this) && -1 == po(n, s.val) && n.push(s.val);
                }
                return n;
            },
            getStateAfter: function(e, t) {
                var n = this.doc;
                return ot(this, (e = De(n, null == e ? n.first + n.size - 1 : e)) + 1, t);
            },
            cursorCoords: function(e, t) {
                var n = this.doc.sel.primary();
                return Nt(this, null == e ? n.head : "object" == typeof e ? Pe(this.doc, e) : e ? n.from() : n.to(), t || "page");
            },
            charCoords: function(e, t) {
                return Tt(this, Pe(this.doc, e), t || "page");
            },
            coordsChar: function(e, t) {
                return Wt(this, (e = Mt(this, e, t || "page")).left, e.top);
            },
            lineAtHeight: function(e, t) {
                return e = Mt(this, {
                    top: e,
                    left: 0
                }, t || "page").top, Si(this.doc, e + this.display.viewOffset);
            },
            heightAtLine: function(e, t) {
                var n, r = !1;
                if ("number" == typeof e) {
                    var i = this.doc.first + this.doc.size - 1;
                    e < this.doc.first ? e = this.doc.first : e > i && (e = i, r = !0), n = yi(this.doc, e);
                } else n = e;
                return Lt(this, n, {
                    top: 0,
                    left: 0
                }, t || "page").top + (r ? this.doc.height - ki(n) : 0);
            },
            defaultTextHeight: function() {
                return Ht(this.display);
            },
            defaultCharWidth: function() {
                return Dt(this.display);
            },
            setGutterMarker: qt(function(e, t, n) {
                return _n(this.doc, e, "gutter", function(e) {
                    var r = e.gutterMarkers || (e.gutterMarkers = {});
                    return r[t] = n, !n && So(r) && (e.gutterMarkers = null), !0;
                });
            }),
            clearGutter: qt(function(e) {
                var t = this, n = t.doc, r = n.first;
                n.iter(function(n) {
                    n.gutterMarkers && n.gutterMarkers[e] && (n.gutterMarkers[e] = null, Qt(t, r, "gutter"), 
                    So(n.gutterMarkers) && (n.gutterMarkers = null)), ++r;
                });
            }),
            lineInfo: function(e) {
                if ("number" == typeof e) {
                    if (!Ie(this.doc, e)) return null;
                    var t = e;
                    if (!(e = yi(this.doc, e))) return null;
                } else {
                    if (null == (t = Ci(e))) return null;
                }
                return {
                    line: t,
                    handle: e,
                    text: e.text,
                    gutterMarkers: e.gutterMarkers,
                    textClass: e.textClass,
                    bgClass: e.bgClass,
                    wrapClass: e.wrapClass,
                    widgets: e.widgets
                };
            },
            getViewport: function() {
                return {
                    from: this.display.viewFrom,
                    to: this.display.viewTo
                };
            },
            addWidget: function(e, t, n, r, i) {
                var o, l, s, a, c, u, f = this.display, h = (e = Nt(this, Pe(this.doc, e))).bottom, d = e.left;
                if (t.style.position = "absolute", t.setAttribute("cm-ignore-events", "true"), this.display.input.setUneditable(t), 
                f.sizer.appendChild(t), "over" == r) h = e.top; else if ("above" == r || "near" == r) {
                    var p = Math.max(f.wrapper.clientHeight, this.doc.height), g = Math.max(f.sizer.clientWidth, f.lineSpace.clientWidth);
                    ("above" == r || e.bottom + t.offsetHeight > p) && e.top > t.offsetHeight ? h = e.top - t.offsetHeight : e.bottom + t.offsetHeight <= p && (h = e.bottom), 
                    d + t.offsetWidth > g && (d = g - t.offsetWidth);
                }
                t.style.top = h + "px", t.style.left = t.style.right = "", "right" == i ? (d = f.sizer.clientWidth - t.offsetWidth, 
                t.style.right = "0px") : ("left" == i ? d = 0 : "middle" == i && (d = (f.sizer.clientWidth - t.offsetWidth) / 2), 
                t.style.left = d + "px"), n && (o = this, l = d, s = h, a = d + t.offsetWidth, c = h + t.offsetHeight, 
                null != (u = Un(o, l, s, a, c)).scrollTop && dn(o, u.scrollTop), null != u.scrollLeft && pn(o, u.scrollLeft));
            },
            triggerOnKeyDown: qt(kn),
            triggerOnKeyPress: qt(Mn),
            triggerOnKeyUp: Ln,
            execCommand: function(e) {
                if (sr.hasOwnProperty(e)) return sr[e].call(null, this);
            },
            triggerElectric: qt(function(e) {
                we(this, e);
            }),
            findPosH: function(e, t, n, r) {
                var i = 1;
                t < 0 && (i = -1, t = -t);
                for (var o = 0, l = Pe(this.doc, e); o < t && !(l = Xn(this.doc, l, i, n, r)).hitSide; ++o) ;
                return l;
            },
            moveH: qt(function(e, t) {
                var n = this;
                n.extendSelectionsBy(function(r) {
                    return n.display.shift || n.doc.extend || r.empty() ? Xn(n.doc, r.head, e, t, n.options.rtlMoveVisually) : e < 0 ? r.from() : r.to();
                }, oo);
            }),
            deleteH: qt(function(e, t) {
                var n = this.doc.sel, r = this.doc;
                n.somethingSelected() ? r.replaceSelection("", null, "+delete") : qn(this, function(n) {
                    var i = Xn(r, n.head, e, t, !1);
                    return e < 0 ? {
                        from: i,
                        to: n.head
                    } : {
                        from: n.head,
                        to: i
                    };
                });
            }),
            findPosV: function(e, t, n, r) {
                var i = 1, o = r;
                t < 0 && (i = -1, t = -t);
                for (var l = 0, s = Pe(this.doc, e); l < t; ++l) {
                    var a = Nt(this, s, "div");
                    if (null == o ? o = a.left : a.left = o, (s = Yn(this, a, i, n)).hitSide) break;
                }
                return s;
            },
            moveV: qt(function(e, t) {
                var n = this, r = this.doc, i = [], o = !n.display.shift && !r.extend && r.sel.somethingSelected();
                if (r.extendSelectionsBy(function(l) {
                    if (o) return e < 0 ? l.from() : l.to();
                    var s = Nt(n, l.head, "div");
                    null != l.goalColumn && (s.left = l.goalColumn), i.push(s.left);
                    var a = Yn(n, s, e, t);
                    return "page" == t && l == r.sel.primary() && Gn(n, null, Tt(n, a, "div").top - s.top), 
                    a;
                }, oo), i.length) for (var l = 0; l < r.sel.ranges.length; l++) r.sel.ranges[l].goalColumn = i[l];
            }),
            findWordAt: function(e) {
                var t = yi(this.doc, e.line).text, n = e.ch, r = e.ch;
                if (t) {
                    var i = this.getHelper(e, "wordChars");
                    (e.xRel < 0 || r == t.length) && n ? --n : ++r;
                    for (var o = t.charAt(n), l = Co(o, i) ? function(e) {
                        return Co(e, i);
                    } : /\s/.test(o) ? function(e) {
                        return /\s/.test(e);
                    } : function(e) {
                        return !/\s/.test(e) && !Co(e);
                    }; n > 0 && l(t.charAt(n - 1)); ) --n;
                    for (;r < t.length && l(t.charAt(r)); ) ++r;
                }
                return new We(fe(e.line, n), fe(e.line, r));
            },
            toggleOverwrite: function(e) {
                null != e && e == this.state.overwrite || ((this.state.overwrite = !this.state.overwrite) ? Do(this.display.cursorDiv, "CodeMirror-overwrite") : Ho(this.display.cursorDiv, "CodeMirror-overwrite"), 
                qi(this, "overwriteToggle", this, this.state.overwrite));
            },
            hasFocus: function() {
                return this.display.input.getField() == Wo();
            },
            isReadOnly: function() {
                return !(!this.options.readOnly && !this.doc.cantEdit);
            },
            scrollTo: qt(function(e, t) {
                null == e && null == t || Vn(this), null != e && (this.curOp.scrollLeft = e), null != t && (this.curOp.scrollTop = t);
            }),
            getScrollInfo: function() {
                var e = this.display.scroller;
                return {
                    left: e.scrollLeft,
                    top: e.scrollTop,
                    height: e.scrollHeight - ct(this) - this.display.barHeight,
                    width: e.scrollWidth - ct(this) - this.display.barWidth,
                    clientHeight: ft(this),
                    clientWidth: ut(this)
                };
            },
            scrollIntoView: qt(function(e, t) {
                if (null == e ? (e = {
                    from: this.doc.sel.primary().head,
                    to: null
                }, null == t && (t = this.options.cursorScrollMargin)) : "number" == typeof e ? e = {
                    from: fe(e, 0),
                    to: null
                } : null == e.from && (e = {
                    from: e,
                    to: null
                }), e.to || (e.to = e.from), e.margin = t || 0, null != e.from.line) Vn(this), this.curOp.scrollToPos = e; else {
                    var n = Un(this, Math.min(e.from.left, e.to.left), Math.min(e.from.top, e.to.top) - e.margin, Math.max(e.from.right, e.to.right), Math.max(e.from.bottom, e.to.bottom) + e.margin);
                    this.scrollTo(n.scrollLeft, n.scrollTop);
                }
            }),
            setSize: qt(function(e, t) {
                var n = this;
                function r(e) {
                    return "number" == typeof e || /^\d+$/.test(String(e)) ? e + "px" : e;
                }
                null != e && (n.display.wrapper.style.width = r(e)), null != t && (n.display.wrapper.style.height = r(t)), 
                n.options.lineWrapping && xt(this);
                var i = n.display.viewFrom;
                n.doc.iter(i, n.display.viewTo, function(e) {
                    if (e.widgets) for (var t = 0; t < e.widgets.length; t++) if (e.widgets[t].noHScroll) {
                        Qt(n, i, "widget");
                        break;
                    }
                    ++i;
                }), n.curOp.forceUpdate = !0, qi(n, "refresh", this);
            }),
            operation: function(e) {
                return jt(this, e);
            },
            refresh: qt(function() {
                var e = this.display.cachedTextHeight;
                Zt(this), this.curOp.forceUpdate = !0, Ct(this), this.scrollTo(this.doc.scrollLeft, this.doc.scrollTop), 
                W(this), (null == e || Math.abs(e - Ht(this.display)) > .5) && T(this), qi(this, "refresh", this);
            }),
            swapDoc: qt(function(e) {
                var t = this.doc;
                return t.cm = null, vi(this, e), Ct(this), this.display.input.reset(), this.scrollTo(e.scrollLeft, e.scrollTop), 
                this.curOp.forceScroll = !0, Yi(this, "swapDoc", this, t), t;
            }),
            getInputField: function() {
                return this.display.input.getField();
            },
            getWrapperElement: function() {
                return this.display.wrapper;
            },
            getScrollerElement: function() {
                return this.display.scroller;
            },
            getGutterElement: function() {
                return this.display.gutters;
            }
        }, eo(S);
        var $n = S.defaults = {}, Zn = S.optionHandlers = {};
        function Qn(e, t, n, r) {
            S.defaults[e] = t, n && (Zn[e] = r ? function(e, t, r) {
                r != Jn && n(e, t, r);
            } : n);
        }
        var Jn = S.Init = {
            toString: function() {
                return "CodeMirror.Init";
            }
        };
        Qn("value", "", function(e, t) {
            e.setValue(t);
        }, !0), Qn("mode", null, function(e, t) {
            e.doc.modeOption = t, k(e);
        }, !0), Qn("indentUnit", 2, k, !0), Qn("indentWithTabs", !1), Qn("smartIndent", !0), 
        Qn("tabSize", 4, function(e) {
            L(e), Ct(e), Zt(e);
        }, !0), Qn("lineSeparator", null, function(e, t) {
            if (e.doc.lineSep = t, t) {
                var n = [], r = e.doc.first;
                e.doc.iter(function(e) {
                    for (var i = 0; ;) {
                        var o = e.text.indexOf(t, i);
                        if (-1 == o) break;
                        i = o + t.length, n.push(fe(r, o));
                    }
                    r++;
                });
                for (var i = n.length - 1; i >= 0; i--) Bn(e.doc, t, n[i], fe(n[i].line, n[i].ch + t.length));
            }
        }), Qn("specialChars", /[\t\u0000-\u0019\u00ad\u200b-\u200f\u2028\u2029\ufeff]/g, function(e, t, n) {
            e.state.specialChars = new RegExp(t.source + (t.test("\t") ? "" : "|\t"), "g"), 
            n != S.Init && e.refresh();
        }), Qn("specialCharPlaceholder", function(e) {
            var t = To("span", "\u2022", "cm-invalidchar");
            return t.title = "\\u" + e.charCodeAt(0).toString(16), t.setAttribute("aria-label", t.title), 
            t;
        }, function(e) {
            e.refresh();
        }, !0), Qn("electricChars", !0), Qn("inputStyle", g ? "contenteditable" : "textarea", function() {
            throw new Error("inputStyle can not (yet) be changed in a running editor");
        }, !0), Qn("rtlMoveVisually", !v), Qn("wholeLineUpdateBefore", !0), Qn("theme", "default", function(e) {
            N(e), O(e);
        }, !0), Qn("keyMap", "default", function(e, t, n) {
            var r = dr(t), i = n != S.Init && dr(n);
            i && i.detach && i.detach(e, r), r.attach && r.attach(e, i || null);
        }), Qn("extraKeys", null), Qn("lineWrapping", !1, function(e) {
            e.options.lineWrapping ? (Do(e.display.wrapper, "CodeMirror-wrap"), e.display.sizer.style.minWidth = "", 
            e.display.sizerWidth = null) : (Ho(e.display.wrapper, "CodeMirror-wrap"), H(e)), 
            T(e), Zt(e), Ct(e), setTimeout(function() {
                R(e);
            }, 100);
        }, !0), Qn("gutters", [], function(e) {
            D(e.options), O(e);
        }, !0), Qn("fixedGutter", !0, function(e, t) {
            e.display.gutters.style.left = t ? j(e.display) + "px" : "0", e.refresh();
        }, !0), Qn("coverGutterNextToScrollbar", !1, function(e) {
            R(e);
        }, !0), Qn("scrollbarStyle", "native", function(e) {
            z(e), R(e), e.display.scrollbars.setScrollTop(e.doc.scrollTop), e.display.scrollbars.setScrollLeft(e.doc.scrollLeft);
        }, !0), Qn("lineNumbers", !1, function(e) {
            D(e.options), O(e);
        }, !0), Qn("firstLineNumber", 1, O, !0), Qn("lineNumberFormatter", function(e) {
            return e;
        }, O, !0), Qn("showCursorWhenSelecting", !1, Qe, !0), Qn("resetSelectionOnContextMenu", !0), 
        Qn("lineWiseCopyCut", !0), Qn("readOnly", !1, function(e, t) {
            "nocursor" == t ? (Nn(e), e.display.input.blur(), e.display.disabled = !0) : e.display.disabled = !1, 
            e.display.input.readOnlyChanged(t);
        }), Qn("disableInput", !1, function(e, t) {
            t || e.display.input.reset();
        }, !0), Qn("dragDrop", !0, function(e, t, n) {
            if (!t != !(n && n != S.Init)) {
                var r = e.display.dragFunctions, i = t ? Ki : _i;
                i(e.display.scroller, "dragstart", r.start), i(e.display.scroller, "dragenter", r.enter), 
                i(e.display.scroller, "dragover", r.over), i(e.display.scroller, "dragleave", r.leave), 
                i(e.display.scroller, "drop", r.drop);
            }
        }), Qn("allowDropFileTypes", null), Qn("cursorBlinkRate", 530), Qn("cursorScrollMargin", 0), 
        Qn("cursorHeight", 1, Qe, !0), Qn("singleCursorHeightPerLine", !0, Qe, !0), Qn("workTime", 100), 
        Qn("workDelay", 100), Qn("flattenSpans", !0, L, !0), Qn("addModeClass", !1, L, !0), 
        Qn("pollInterval", 100), Qn("undoDepth", 200, function(e, t) {
            e.doc.history.undoDepth = t;
        }), Qn("historyEventDelay", 1250), Qn("viewportMargin", 10, function(e) {
            e.refresh();
        }, !0), Qn("maxHighlightLength", 1e4, L, !0), Qn("moveInputWithCursor", !0, function(e, t) {
            t || e.display.input.resetPosition();
        }), Qn("tabindex", null, function(e, t) {
            e.display.input.getField().tabIndex = t || "";
        }), Qn("autofocus", null);
        var er = S.modes = {}, tr = S.mimeModes = {};
        S.defineMode = function(e, t) {
            S.defaults.mode || "null" == e || (S.defaults.mode = e), arguments.length > 2 && (t.dependencies = Array.prototype.slice.call(arguments, 2)), 
            er[e] = t;
        }, S.defineMIME = function(e, t) {
            tr[e] = t;
        }, S.resolveMode = function(e) {
            if ("string" == typeof e && tr.hasOwnProperty(e)) e = tr[e]; else if (e && "string" == typeof e.name && tr.hasOwnProperty(e.name)) {
                var t = tr[e.name];
                "string" == typeof t && (t = {
                    name: t
                }), (e = vo(t, e)).name = t.name;
            } else if ("string" == typeof e && /^[\w\-]+\/[\w\-]+\+xml$/.test(e)) return S.resolveMode("application/xml");
            return "string" == typeof e ? {
                name: e
            } : e || {
                name: "null"
            };
        }, S.getMode = function(e, t) {
            t = S.resolveMode(t);
            var n = er[t.name];
            if (!n) return S.getMode(e, "text/plain");
            var r = n(e, t);
            if (nr.hasOwnProperty(t.name)) {
                var i = nr[t.name];
                for (var o in i) i.hasOwnProperty(o) && (r.hasOwnProperty(o) && (r["_" + o] = r[o]), 
                r[o] = i[o]);
            }
            if (r.name = t.name, t.helperType && (r.helperType = t.helperType), t.modeProps) for (var o in t.modeProps) r[o] = t.modeProps[o];
            return r;
        }, S.defineMode("null", function() {
            return {
                token: function(e) {
                    e.skipToEnd();
                }
            };
        }), S.defineMIME("text/plain", "null");
        var nr = S.modeExtensions = {};
        S.extendMode = function(e, t) {
            yo(t, nr.hasOwnProperty(e) ? nr[e] : nr[e] = {});
        }, S.defineExtension = function(e, t) {
            S.prototype[e] = t;
        }, S.defineDocExtension = function(e, t) {
            di.prototype[e] = t;
        }, S.defineOption = Qn;
        var rr = [];
        S.defineInitHook = function(e) {
            rr.push(e);
        };
        var ir = S.helpers = {};
        S.registerHelper = function(e, t, n) {
            ir.hasOwnProperty(e) || (ir[e] = S[e] = {
                _global: []
            }), ir[e][t] = n;
        }, S.registerGlobalHelper = function(e, t, n, r) {
            S.registerHelper(e, t, r), ir[e]._global.push({
                pred: n,
                val: r
            });
        };
        var or = S.copyState = function(e, t) {
            if (!0 === t) return t;
            if (e.copyState) return e.copyState(t);
            var n = {};
            for (var r in t) {
                var i = t[r];
                i instanceof Array && (i = i.concat([])), n[r] = i;
            }
            return n;
        }, lr = S.startState = function(e, t, n) {
            return !e.startState || e.startState(t, n);
        };
        S.innerMode = function(e, t) {
            for (;e.innerMode; ) {
                var n = e.innerMode(t);
                if (!n || n.mode == e) break;
                t = n.state, e = n.mode;
            }
            return n || {
                mode: e,
                state: t
            };
        };
        var sr = S.commands = {
            selectAll: function(e) {
                e.setSelection(fe(e.firstLine(), 0), fe(e.lastLine()), ro);
            },
            singleSelection: function(e) {
                e.setSelection(e.getCursor("anchor"), e.getCursor("head"), ro);
            },
            killLine: function(e) {
                qn(e, function(t) {
                    if (t.empty()) {
                        var n = yi(e.doc, t.head.line).text.length;
                        return t.head.ch == n && t.head.line < e.lastLine() ? {
                            from: t.head,
                            to: fe(t.head.line + 1, 0)
                        } : {
                            from: t.head,
                            to: fe(t.head.line, n)
                        };
                    }
                    return {
                        from: t.from(),
                        to: t.to()
                    };
                });
            },
            deleteLine: function(e) {
                qn(e, function(t) {
                    return {
                        from: fe(t.from().line, 0),
                        to: Pe(e.doc, fe(t.to().line + 1, 0))
                    };
                });
            },
            delLineLeft: function(e) {
                qn(e, function(e) {
                    return {
                        from: fe(e.from().line, 0),
                        to: e.from()
                    };
                });
            },
            delWrappedLineLeft: function(e) {
                qn(e, function(t) {
                    var n = e.charCoords(t.head, "div").top + 5;
                    return {
                        from: e.coordsChar({
                            left: 0,
                            top: n
                        }, "div"),
                        to: t.from()
                    };
                });
            },
            delWrappedLineRight: function(e) {
                qn(e, function(t) {
                    var n = e.charCoords(t.head, "div").top + 5, r = e.coordsChar({
                        left: e.display.lineDiv.offsetWidth + 100,
                        top: n
                    }, "div");
                    return {
                        from: t.from(),
                        to: r
                    };
                });
            },
            undo: function(e) {
                e.undo();
            },
            redo: function(e) {
                e.redo();
            },
            undoSelection: function(e) {
                e.undoSelection();
            },
            redoSelection: function(e) {
                e.redoSelection();
            },
            goDocStart: function(e) {
                e.extendSelection(fe(e.firstLine(), 0));
            },
            goDocEnd: function(e) {
                e.extendSelection(fe(e.lastLine()));
            },
            goLineStart: function(e) {
                e.extendSelectionsBy(function(t) {
                    return el(e, t.head.line);
                }, {
                    origin: "+move",
                    bias: 1
                });
            },
            goLineStartSmart: function(e) {
                e.extendSelectionsBy(function(t) {
                    return tl(e, t.head);
                }, {
                    origin: "+move",
                    bias: 1
                });
            },
            goLineEnd: function(e) {
                e.extendSelectionsBy(function(t) {
                    return function(e, t) {
                        var n, r = yi(e.doc, t);
                        for (;n = Dr(r); ) r = n.find(1, !0).line, t = null;
                        var i = Li(r), o = i ? i[0].level % 2 ? Qo(r) : Jo(r) : r.text.length;
                        return fe(null == t ? Ci(r) : t, o);
                    }(e, t.head.line);
                }, {
                    origin: "+move",
                    bias: -1
                });
            },
            goLineRight: function(e) {
                e.extendSelectionsBy(function(t) {
                    var n = e.charCoords(t.head, "div").top + 5;
                    return e.coordsChar({
                        left: e.display.lineDiv.offsetWidth + 100,
                        top: n
                    }, "div");
                }, oo);
            },
            goLineLeft: function(e) {
                e.extendSelectionsBy(function(t) {
                    var n = e.charCoords(t.head, "div").top + 5;
                    return e.coordsChar({
                        left: 0,
                        top: n
                    }, "div");
                }, oo);
            },
            goLineLeftSmart: function(e) {
                e.extendSelectionsBy(function(t) {
                    var n = e.charCoords(t.head, "div").top + 5, r = e.coordsChar({
                        left: 0,
                        top: n
                    }, "div");
                    return r.ch < e.getLine(r.line).search(/\S/) ? tl(e, t.head) : r;
                }, oo);
            },
            goLineUp: function(e) {
                e.moveV(-1, "line");
            },
            goLineDown: function(e) {
                e.moveV(1, "line");
            },
            goPageUp: function(e) {
                e.moveV(-1, "page");
            },
            goPageDown: function(e) {
                e.moveV(1, "page");
            },
            goCharLeft: function(e) {
                e.moveH(-1, "char");
            },
            goCharRight: function(e) {
                e.moveH(1, "char");
            },
            goColumnLeft: function(e) {
                e.moveH(-1, "column");
            },
            goColumnRight: function(e) {
                e.moveH(1, "column");
            },
            goWordLeft: function(e) {
                e.moveH(-1, "word");
            },
            goGroupRight: function(e) {
                e.moveH(1, "group");
            },
            goGroupLeft: function(e) {
                e.moveH(-1, "group");
            },
            goWordRight: function(e) {
                e.moveH(1, "word");
            },
            delCharBefore: function(e) {
                e.deleteH(-1, "char");
            },
            delCharAfter: function(e) {
                e.deleteH(1, "char");
            },
            delWordBefore: function(e) {
                e.deleteH(-1, "word");
            },
            delWordAfter: function(e) {
                e.deleteH(1, "word");
            },
            delGroupBefore: function(e) {
                e.deleteH(-1, "group");
            },
            delGroupAfter: function(e) {
                e.deleteH(1, "group");
            },
            indentAuto: function(e) {
                e.indentSelection("smart");
            },
            indentMore: function(e) {
                e.indentSelection("add");
            },
            indentLess: function(e) {
                e.indentSelection("subtract");
            },
            insertTab: function(e) {
                e.replaceSelection("\t");
            },
            insertSoftTab: function(e) {
                for (var t = [], n = e.listSelections(), r = e.options.tabSize, i = 0; i < n.length; i++) {
                    var o = n[i].from(), l = so(e.getLine(o.line), o.ch, r);
                    t.push(new Array(r - l % r + 1).join(" "));
                }
                e.replaceSelections(t);
            },
            defaultTab: function(e) {
                e.somethingSelected() ? e.indentSelection("add") : e.execCommand("insertTab");
            },
            transposeChars: function(e) {
                jt(e, function() {
                    for (var t = e.listSelections(), n = [], r = 0; r < t.length; r++) {
                        var i = t[r].head, o = yi(e.doc, i.line).text;
                        if (o) if (i.ch == o.length && (i = new fe(i.line, i.ch - 1)), i.ch > 0) i = new fe(i.line, i.ch + 1), 
                        e.replaceRange(o.charAt(i.ch - 1) + o.charAt(i.ch - 2), fe(i.line, i.ch - 2), i, "+transpose"); else if (i.line > e.doc.first) {
                            var l = yi(e.doc, i.line - 1).text;
                            l && e.replaceRange(o.charAt(0) + e.doc.lineSeparator() + l.charAt(l.length - 1), fe(i.line - 1, l.length - 1), fe(i.line, 1), "+transpose");
                        }
                        n.push(new We(i, i));
                    }
                    e.setSelections(n);
                });
            },
            newlineAndIndent: function(e) {
                jt(e, function() {
                    for (var t = e.listSelections().length, n = 0; n < t; n++) {
                        var r = e.listSelections()[n];
                        e.replaceRange(e.doc.lineSeparator(), r.anchor, r.head, "+input"), e.indentLine(r.from().line + 1, null, !0);
                    }
                    Kn(e);
                });
            },
            toggleOverwrite: function(e) {
                e.toggleOverwrite();
            }
        }, ar = S.keyMap = {};
        function cr(e) {
            for (var t, n, r, i, o = e.split(/-(?!$)/), l = (e = o[o.length - 1], 0); l < o.length - 1; l++) {
                var s = o[l];
                if (/^(cmd|meta|m)$/i.test(s)) i = !0; else if (/^a(lt)?$/i.test(s)) t = !0; else if (/^(c|ctrl|control)$/i.test(s)) n = !0; else {
                    if (!/^s(hift)$/i.test(s)) throw new Error("Unrecognized modifier name: " + s);
                    r = !0;
                }
            }
            return t && (e = "Alt-" + e), n && (e = "Ctrl-" + e), i && (e = "Cmd-" + e), r && (e = "Shift-" + e), 
            e;
        }
        ar.basic = {
            Left: "goCharLeft",
            Right: "goCharRight",
            Up: "goLineUp",
            Down: "goLineDown",
            End: "goLineEnd",
            Home: "goLineStartSmart",
            PageUp: "goPageUp",
            PageDown: "goPageDown",
            Delete: "delCharAfter",
            Backspace: "delCharBefore",
            "Shift-Backspace": "delCharBefore",
            Tab: "defaultTab",
            "Shift-Tab": "indentAuto",
            Enter: "newlineAndIndent",
            Insert: "toggleOverwrite",
            Esc: "singleSelection"
        }, ar.pcDefault = {
            "Ctrl-A": "selectAll",
            "Ctrl-D": "deleteLine",
            "Ctrl-Z": "undo",
            "Shift-Ctrl-Z": "redo",
            "Ctrl-Y": "redo",
            "Ctrl-Home": "goDocStart",
            "Ctrl-End": "goDocEnd",
            "Ctrl-Up": "goLineUp",
            "Ctrl-Down": "goLineDown",
            "Ctrl-Left": "goGroupLeft",
            "Ctrl-Right": "goGroupRight",
            "Alt-Left": "goLineStart",
            "Alt-Right": "goLineEnd",
            "Ctrl-Backspace": "delGroupBefore",
            "Ctrl-Delete": "delGroupAfter",
            "Ctrl-S": "save",
            "Ctrl-F": "find",
            "Ctrl-G": "findNext",
            "Shift-Ctrl-G": "findPrev",
            "Shift-Ctrl-F": "replace",
            "Shift-Ctrl-R": "replaceAll",
            "Ctrl-[": "indentLess",
            "Ctrl-]": "indentMore",
            "Ctrl-U": "undoSelection",
            "Shift-Ctrl-U": "redoSelection",
            "Alt-U": "redoSelection",
            fallthrough: "basic"
        }, ar.emacsy = {
            "Ctrl-F": "goCharRight",
            "Ctrl-B": "goCharLeft",
            "Ctrl-P": "goLineUp",
            "Ctrl-N": "goLineDown",
            "Alt-F": "goWordRight",
            "Alt-B": "goWordLeft",
            "Ctrl-A": "goLineStart",
            "Ctrl-E": "goLineEnd",
            "Ctrl-V": "goPageDown",
            "Shift-Ctrl-V": "goPageUp",
            "Ctrl-D": "delCharAfter",
            "Ctrl-H": "delCharBefore",
            "Alt-D": "delWordAfter",
            "Alt-Backspace": "delWordBefore",
            "Ctrl-K": "killLine",
            "Ctrl-T": "transposeChars"
        }, ar.macDefault = {
            "Cmd-A": "selectAll",
            "Cmd-D": "deleteLine",
            "Cmd-Z": "undo",
            "Shift-Cmd-Z": "redo",
            "Cmd-Y": "redo",
            "Cmd-Home": "goDocStart",
            "Cmd-Up": "goDocStart",
            "Cmd-End": "goDocEnd",
            "Cmd-Down": "goDocEnd",
            "Alt-Left": "goGroupLeft",
            "Alt-Right": "goGroupRight",
            "Cmd-Left": "goLineLeft",
            "Cmd-Right": "goLineRight",
            "Alt-Backspace": "delGroupBefore",
            "Ctrl-Alt-Backspace": "delGroupAfter",
            "Alt-Delete": "delGroupAfter",
            "Cmd-S": "save",
            "Cmd-F": "find",
            "Cmd-G": "findNext",
            "Shift-Cmd-G": "findPrev",
            "Cmd-Alt-F": "replace",
            "Shift-Cmd-Alt-F": "replaceAll",
            "Cmd-[": "indentLess",
            "Cmd-]": "indentMore",
            "Cmd-Backspace": "delWrappedLineLeft",
            "Cmd-Delete": "delWrappedLineRight",
            "Cmd-U": "undoSelection",
            "Shift-Cmd-U": "redoSelection",
            "Ctrl-Up": "goDocStart",
            "Ctrl-Down": "goDocEnd",
            fallthrough: [ "basic", "emacsy" ]
        }, ar.default = m ? ar.macDefault : ar.pcDefault, S.normalizeKeyMap = function(e) {
            var t = {};
            for (var n in e) if (e.hasOwnProperty(n)) {
                var r = e[n];
                if (/^(name|fallthrough|(de|at)tach)$/.test(n)) continue;
                if ("..." == r) {
                    delete e[n];
                    continue;
                }
                for (var i = go(n.split(" "), cr), o = 0; o < i.length; o++) {
                    var l, s;
                    o == i.length - 1 ? (s = i.join(" "), l = r) : (s = i.slice(0, o + 1).join(" "), 
                    l = "...");
                    var a = t[s];
                    if (a) {
                        if (a != l) throw new Error("Inconsistent bindings for " + s);
                    } else t[s] = l;
                }
                delete e[n];
            }
            for (var c in t) e[c] = t[c];
            return e;
        };
        var ur = S.lookupKey = function(e, t, n, r) {
            var i = (t = dr(t)).call ? t.call(e, r) : t[e];
            if (!1 === i) return "nothing";
            if ("..." === i) return "multi";
            if (null != i && n(i)) return "handled";
            if (t.fallthrough) {
                if ("[object Array]" != Object.prototype.toString.call(t.fallthrough)) return ur(e, t.fallthrough, n, r);
                for (var o = 0; o < t.fallthrough.length; o++) {
                    var l = ur(e, t.fallthrough[o], n, r);
                    if (l) return l;
                }
            }
        }, fr = S.isModifierKey = function(e) {
            var t = "string" == typeof e ? e : Yo[e.keyCode];
            return "Ctrl" == t || "Alt" == t || "Shift" == t || "Mod" == t;
        }, hr = S.keyName = function(e, t) {
            if (u && 34 == e.keyCode && e.char) return !1;
            var n = Yo[e.keyCode], r = n;
            return null != r && !e.altGraphKey && (e.altKey && "Alt" != n && (r = "Alt-" + r), 
            (b ? e.metaKey : e.ctrlKey) && "Ctrl" != n && (r = "Ctrl-" + r), (b ? e.ctrlKey : e.metaKey) && "Cmd" != n && (r = "Cmd-" + r), 
            !t && e.shiftKey && "Shift" != n && (r = "Shift-" + r), r);
        };
        function dr(e) {
            return "string" == typeof e ? ar[e] : e;
        }
        S.fromTextArea = function(e, t) {
            if ((t = t ? yo(t) : {}).value = e.value, !t.tabindex && e.tabIndex && (t.tabindex = e.tabIndex), 
            !t.placeholder && e.placeholder && (t.placeholder = e.placeholder), null == t.autofocus) {
                var n = Wo();
                t.autofocus = n == e || null != e.getAttribute("autofocus") && n == document.body;
            }
            function r() {
                e.value = s.getValue();
            }
            if (e.form && (Ki(e.form, "submit", r), !t.leaveSubmitMethodAlone)) {
                var i = e.form, o = i.submit;
                try {
                    var l = i.submit = function() {
                        r(), i.submit = o, i.submit(), i.submit = l;
                    };
                } catch (e) {}
            }
            t.finishInit = function(t) {
                t.save = r, t.getTextArea = function() {
                    return e;
                }, t.toTextArea = function() {
                    t.toTextArea = isNaN, r(), e.parentNode.removeChild(t.getWrapperElement()), e.style.display = "", 
                    e.form && (_i(e.form, "submit", r), "function" == typeof e.form.submit && (e.form.submit = o));
                };
            }, e.style.display = "none";
            var s = S(function(t) {
                e.parentNode.insertBefore(t, e.nextSibling);
            }, t);
            return s;
        };
        var pr = S.StringStream = function(e, t) {
            this.pos = this.start = 0, this.string = e, this.tabSize = t || 8, this.lastColumnPos = this.lastColumnValue = 0, 
            this.lineStart = 0;
        };
        pr.prototype = {
            eol: function() {
                return this.pos >= this.string.length;
            },
            sol: function() {
                return this.pos == this.lineStart;
            },
            peek: function() {
                return this.string.charAt(this.pos) || void 0;
            },
            next: function() {
                if (this.pos < this.string.length) return this.string.charAt(this.pos++);
            },
            eat: function(e) {
                var t = this.string.charAt(this.pos);
                if ("string" == typeof e) var n = t == e; else n = t && (e.test ? e.test(t) : e(t));
                if (n) return ++this.pos, t;
            },
            eatWhile: function(e) {
                for (var t = this.pos; this.eat(e); ) ;
                return this.pos > t;
            },
            eatSpace: function() {
                for (var e = this.pos; /[\s\u00a0]/.test(this.string.charAt(this.pos)); ) ++this.pos;
                return this.pos > e;
            },
            skipToEnd: function() {
                this.pos = this.string.length;
            },
            skipTo: function(e) {
                var t = this.string.indexOf(e, this.pos);
                if (t > -1) return this.pos = t, !0;
            },
            backUp: function(e) {
                this.pos -= e;
            },
            column: function() {
                return this.lastColumnPos < this.start && (this.lastColumnValue = so(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue), 
                this.lastColumnPos = this.start), this.lastColumnValue - (this.lineStart ? so(this.string, this.lineStart, this.tabSize) : 0);
            },
            indentation: function() {
                return so(this.string, null, this.tabSize) - (this.lineStart ? so(this.string, this.lineStart, this.tabSize) : 0);
            },
            match: function(e, t, n) {
                if ("string" != typeof e) {
                    var r = this.string.slice(this.pos).match(e);
                    return r && r.index > 0 ? null : (r && !1 !== t && (this.pos += r[0].length), r);
                }
                var i = function(e) {
                    return n ? e.toLowerCase() : e;
                };
                if (i(this.string.substr(this.pos, e.length)) == i(e)) return !1 !== t && (this.pos += e.length), 
                !0;
            },
            current: function() {
                return this.string.slice(this.start, this.pos);
            },
            hideFirstChars: function(e, t) {
                this.lineStart += e;
                try {
                    return t();
                } finally {
                    this.lineStart -= e;
                }
            }
        };
        var gr = 0, mr = S.TextMarker = function(e, t) {
            this.lines = [], this.type = t, this.doc = e, this.id = ++gr;
        };
        eo(mr), mr.prototype.clear = function() {
            if (!this.explicitlyCleared) {
                var e = this.doc.cm, t = e && !e.curOp;
                if (t && Rt(e), Ji(this, "clear")) {
                    var n = this.find();
                    n && Yi(this, "clear", n.from, n.to);
                }
                for (var r = null, i = null, o = 0; o < this.lines.length; ++o) {
                    var l = this.lines[o], s = Cr(l.markedSpans, this);
                    e && !this.collapsed ? Qt(e, Ci(l), "text") : e && (null != s.to && (i = Ci(l)), 
                    null != s.from && (r = Ci(l))), l.markedSpans = Sr(l.markedSpans, s), null == s.from && this.collapsed && !Rr(this.doc, l) && e && xi(l, Ht(e.display));
                }
                if (e && this.collapsed && !e.options.lineWrapping) for (o = 0; o < this.lines.length; ++o) {
                    var a = Ir(this.lines[o]), c = F(a);
                    c > e.display.maxLineLength && (e.display.maxLine = a, e.display.maxLineLength = c, 
                    e.display.maxLineChanged = !0);
                }
                null != r && e && this.collapsed && Zt(e, r, i + 1), this.lines.length = 0, this.explicitlyCleared = !0, 
                this.atomic && this.doc.cantEdit && (this.doc.cantEdit = !1, e && qe(e.doc)), e && Yi(e, "markerCleared", e, this), 
                t && Bt(e), this.parent && this.parent.clear();
            }
        }, mr.prototype.find = function(e, t) {
            var n, r;
            null == e && "bookmark" == this.type && (e = 1);
            for (var i = 0; i < this.lines.length; ++i) {
                var o = this.lines[i], l = Cr(o.markedSpans, this);
                if (null != l.from && (n = fe(t ? o : Ci(o), l.from), -1 == e)) return n;
                if (null != l.to && (r = fe(t ? o : Ci(o), l.to), 1 == e)) return r;
            }
            return n && {
                from: n,
                to: r
            };
        }, mr.prototype.changed = function() {
            var e = this.find(-1, !0), t = this, n = this.doc.cm;
            e && n && jt(n, function() {
                var r = e.line, i = Ci(e.line), o = pt(n, i);
                if (o && (wt(o), n.curOp.selectionChanged = n.curOp.forceUpdate = !0), n.curOp.updateMaxLine = !0, 
                !Rr(t.doc, r) && null != t.height) {
                    var l = t.height;
                    t.height = null;
                    var s = Kr(t) - l;
                    s && xi(r, r.height + s);
                }
            });
        }, mr.prototype.attachLine = function(e) {
            if (!this.lines.length && this.doc.cm) {
                var t = this.doc.cm.curOp;
                t.maybeHiddenMarkers && -1 != po(t.maybeHiddenMarkers, this) || (t.maybeUnhiddenMarkers || (t.maybeUnhiddenMarkers = [])).push(this);
            }
            this.lines.push(e);
        }, mr.prototype.detachLine = function(e) {
            if (this.lines.splice(po(this.lines, e), 1), !this.lines.length && this.doc.cm) {
                var t = this.doc.cm.curOp;
                (t.maybeHiddenMarkers || (t.maybeHiddenMarkers = [])).push(this);
            }
        };
        gr = 0;
        function vr(e, t, n, r, i) {
            if (r && r.shared) return function(e, t, n, r, i) {
                (r = yo(r)).shared = !1;
                var o = [ vr(e, t, n, r, i) ], l = o[0], s = r.widgetNode;
                return mi(e, function(e) {
                    s && (r.widgetNode = s.cloneNode(!0)), o.push(vr(e, Pe(e, t), Pe(e, n), r, i));
                    for (var a = 0; a < e.linked.length; ++a) if (e.linked[a].isParent) return;
                    l = fo(o);
                }), new yr(o, l);
            }(e, t, n, r, i);
            if (e.cm && !e.cm.curOp) return _t(e.cm, vr)(e, t, n, r, i);
            var o = new mr(e, i), l = he(t, n);
            if (r && yo(r, o, !1), l > 0 || 0 == l && !1 !== o.clearWhenEmpty) return o;
            if (o.replacedWith && (o.collapsed = !0, o.widgetNode = To("span", [ o.replacedWith ], "CodeMirror-widget"), 
            r.handleMouseEvents || o.widgetNode.setAttribute("cm-ignore-events", "true"), r.insertLeft && (o.widgetNode.insertLeft = !0)), 
            o.collapsed) {
                if (Pr(e, t.line, t, n, o) || t.line != n.line && Pr(e, n.line, t, n, o)) throw new Error("Inserting collapsed marker partially overlapping an existing one");
                C = !0;
            }
            o.addToHistory && Oi(e, {
                from: t,
                to: n,
                origin: "markText"
            }, e.sel, NaN);
            var s, a = t.line, c = e.cm;
            if (e.iter(a, n.line + 1, function(e) {
                var r, i;
                c && o.collapsed && !c.options.lineWrapping && Ir(e) == c.display.maxLine && (s = !0), 
                o.collapsed && a != t.line && xi(e, 0), r = e, i = new xr(o, a == t.line ? t.ch : null, a == n.line ? n.ch : null), 
                r.markedSpans = r.markedSpans ? r.markedSpans.concat([ i ]) : [ i ], i.marker.attachLine(r), 
                ++a;
            }), o.collapsed && e.iter(t.line, n.line + 1, function(t) {
                Rr(e, t) && xi(t, 0);
            }), o.clearOnEnter && Ki(o, "beforeCursorEnter", function() {
                o.clear();
            }), o.readOnly && (x = !0, (e.history.done.length || e.history.undone.length) && e.clearHistory()), 
            o.collapsed && (o.id = ++gr, o.atomic = !0), c) {
                if (s && (c.curOp.updateMaxLine = !0), o.collapsed) Zt(c, t.line, n.line + 1); else if (o.className || o.title || o.startStyle || o.endStyle || o.css) for (var u = t.line; u <= n.line; u++) Qt(c, u, "text");
                o.atomic && qe(c.doc), Yi(c, "markerAdded", c, o);
            }
            return o;
        }
        var yr = S.SharedTextMarker = function(e, t) {
            this.markers = e, this.primary = t;
            for (var n = 0; n < e.length; ++n) e[n].parent = this;
        };
        function br(e) {
            return e.findMarks(fe(e.first, 0), e.clipPos(fe(e.lastLine())), function(e) {
                return e.parent;
            });
        }
        function wr(e) {
            for (var t = 0; t < e.length; t++) {
                var n = e[t], r = [ n.primary.doc ];
                mi(n.primary.doc, function(e) {
                    r.push(e);
                });
                for (var i = 0; i < n.markers.length; i++) {
                    var o = n.markers[i];
                    -1 == po(r, o.doc) && (o.parent = null, n.markers.splice(i--, 1));
                }
            }
        }
        function xr(e, t, n) {
            this.marker = e, this.from = t, this.to = n;
        }
        function Cr(e, t) {
            if (e) for (var n = 0; n < e.length; ++n) {
                var r = e[n];
                if (r.marker == t) return r;
            }
        }
        function Sr(e, t) {
            for (var n, r = 0; r < e.length; ++r) e[r] != t && (n || (n = [])).push(e[r]);
            return n;
        }
        function kr(e, t) {
            if (t.full) return null;
            var n = Ie(e, t.from.line) && yi(e, t.from.line).markedSpans, r = Ie(e, t.to.line) && yi(e, t.to.line).markedSpans;
            if (!n && !r) return null;
            var i = t.from.ch, o = t.to.ch, l = 0 == he(t.from, t.to), s = function(e, t, n) {
                if (e) for (var r, i = 0; i < e.length; ++i) {
                    var o = e[i], l = o.marker;
                    if (null == o.from || (l.inclusiveLeft ? o.from <= t : o.from < t) || o.from == t && "bookmark" == l.type && (!n || !o.marker.insertLeft)) {
                        var s = null == o.to || (l.inclusiveRight ? o.to >= t : o.to > t);
                        (r || (r = [])).push(new xr(l, o.from, s ? null : o.to));
                    }
                }
                return r;
            }(n, i, l), a = function(e, t, n) {
                if (e) for (var r, i = 0; i < e.length; ++i) {
                    var o = e[i], l = o.marker;
                    if (null == o.to || (l.inclusiveRight ? o.to >= t : o.to > t) || o.from == t && "bookmark" == l.type && (!n || o.marker.insertLeft)) {
                        var s = null == o.from || (l.inclusiveLeft ? o.from <= t : o.from < t);
                        (r || (r = [])).push(new xr(l, s ? null : o.from - t, null == o.to ? null : o.to - t));
                    }
                }
                return r;
            }(r, o, l), c = 1 == t.text.length, u = fo(t.text).length + (c ? i : 0);
            if (s) for (var f = 0; f < s.length; ++f) {
                if (null == (h = s[f]).to) (d = Cr(a, h.marker)) ? c && (h.to = null == d.to ? null : d.to + u) : h.to = i;
            }
            if (a) for (f = 0; f < a.length; ++f) {
                var h, d;
                if (null != (h = a[f]).to && (h.to += u), null == h.from) (d = Cr(s, h.marker)) || (h.from = u, 
                c && (s || (s = [])).push(h)); else h.from += u, c && (s || (s = [])).push(h);
            }
            s && (s = Lr(s)), a && a != s && (a = Lr(a));
            var p = [ s ];
            if (!c) {
                var g, m = t.text.length - 2;
                if (m > 0 && s) for (f = 0; f < s.length; ++f) null == s[f].to && (g || (g = [])).push(new xr(s[f].marker, null, null));
                for (f = 0; f < m; ++f) p.push(g);
                p.push(a);
            }
            return p;
        }
        function Lr(e) {
            for (var t = 0; t < e.length; ++t) {
                var n = e[t];
                null != n.from && n.from == n.to && !1 !== n.marker.clearWhenEmpty && e.splice(t--, 1);
            }
            return e.length ? e : null;
        }
        function Mr(e, t) {
            var n = function(e, t) {
                var n = t["spans_" + e.id];
                if (!n) return null;
                for (var r = 0, i = []; r < t.text.length; ++r) i.push(Fi(n[r]));
                return i;
            }(e, t), r = kr(e, t);
            if (!n) return r;
            if (!r) return n;
            for (var i = 0; i < n.length; ++i) {
                var o = n[i], l = r[i];
                if (o && l) e: for (var s = 0; s < l.length; ++s) {
                    for (var a = l[s], c = 0; c < o.length; ++c) if (o[c].marker == a.marker) continue e;
                    o.push(a);
                } else l && (n[i] = l);
            }
            return n;
        }
        function Tr(e) {
            var t = e.markedSpans;
            if (t) {
                for (var n = 0; n < t.length; ++n) t[n].marker.detachLine(e);
                e.markedSpans = null;
            }
        }
        function Nr(e, t) {
            if (t) {
                for (var n = 0; n < t.length; ++n) t[n].marker.attachLine(e);
                e.markedSpans = t;
            }
        }
        function Or(e) {
            return e.inclusiveLeft ? -1 : 0;
        }
        function Ar(e) {
            return e.inclusiveRight ? 1 : 0;
        }
        function Wr(e, t) {
            var n = e.lines.length - t.lines.length;
            if (0 != n) return n;
            var r = e.find(), i = t.find(), o = he(r.from, i.from) || Or(e) - Or(t);
            if (o) return -o;
            var l = he(r.to, i.to) || Ar(e) - Ar(t);
            return l || t.id - e.id;
        }
        function Fr(e, t) {
            var n, r = C && e.markedSpans;
            if (r) for (var i, o = 0; o < r.length; ++o) (i = r[o]).marker.collapsed && null == (t ? i.from : i.to) && (!n || Wr(n, i.marker) < 0) && (n = i.marker);
            return n;
        }
        function Hr(e) {
            return Fr(e, !0);
        }
        function Dr(e) {
            return Fr(e, !1);
        }
        function Pr(e, t, n, r, i) {
            var o = yi(e, t), l = C && o.markedSpans;
            if (l) for (var s = 0; s < l.length; ++s) {
                var a = l[s];
                if (a.marker.collapsed) {
                    var c = a.marker.find(0), u = he(c.from, n) || Or(a.marker) - Or(i), f = he(c.to, r) || Ar(a.marker) - Ar(i);
                    if (!(u >= 0 && f <= 0 || u <= 0 && f >= 0) && (u <= 0 && (he(c.to, n) > 0 || a.marker.inclusiveRight && i.inclusiveLeft) || u >= 0 && (he(c.from, r) < 0 || a.marker.inclusiveLeft && i.inclusiveRight))) return !0;
                }
            }
        }
        function Ir(e) {
            for (var t; t = Hr(e); ) e = t.find(-1, !0).line;
            return e;
        }
        function Er(e, t) {
            var n = yi(e, t), r = Ir(n);
            return n == r ? t : Ci(r);
        }
        function zr(e, t) {
            if (t > e.lastLine()) return t;
            var n, r = yi(e, t);
            if (!Rr(e, r)) return t;
            for (;n = Dr(r); ) r = n.find(1, !0).line;
            return Ci(r) + 1;
        }
        function Rr(e, t) {
            var n = C && t.markedSpans;
            if (n) for (var r, i = 0; i < n.length; ++i) if ((r = n[i]).marker.collapsed) {
                if (null == r.from) return !0;
                if (!r.marker.widgetNode && 0 == r.from && r.marker.inclusiveLeft && Br(e, t, r)) return !0;
            }
        }
        function Br(e, t, n) {
            if (null == n.to) {
                var r = n.marker.find(1, !0);
                return Br(e, r.line, Cr(r.line.markedSpans, n.marker));
            }
            if (n.marker.inclusiveRight && n.to == t.text.length) return !0;
            for (var i, o = 0; o < t.markedSpans.length; ++o) if ((i = t.markedSpans[o]).marker.collapsed && !i.marker.widgetNode && i.from == n.to && (null == i.to || i.to != n.from) && (i.marker.inclusiveLeft || n.marker.inclusiveRight) && Br(e, t, i)) return !0;
        }
        eo(yr), yr.prototype.clear = function() {
            if (!this.explicitlyCleared) {
                this.explicitlyCleared = !0;
                for (var e = 0; e < this.markers.length; ++e) this.markers[e].clear();
                Yi(this, "clear");
            }
        }, yr.prototype.find = function(e, t) {
            return this.primary.find(e, t);
        };
        var Ur = S.LineWidget = function(e, t, n) {
            if (n) for (var r in n) n.hasOwnProperty(r) && (this[r] = n[r]);
            this.doc = e, this.node = t;
        };
        function Gr(e, t, n) {
            ki(t) < (e.curOp && e.curOp.scrollTop || e.doc.scrollTop) && Gn(e, null, n);
        }
        function Kr(e) {
            if (null != e.height) return e.height;
            var t = e.doc.cm;
            if (!t) return 0;
            if (!Ao(document.body, e.node)) {
                var n = "position: relative;";
                e.coverGutter && (n += "margin-left: -" + t.display.gutters.offsetWidth + "px;"), 
                e.noHScroll && (n += "width: " + t.display.wrapper.clientWidth + "px;"), Oo(t.display.measure, To("div", [ e.node ], null, n));
            }
            return e.height = e.node.parentNode.offsetHeight;
        }
        eo(Ur), Ur.prototype.clear = function() {
            var e = this.doc.cm, t = this.line.widgets, n = this.line, r = Ci(n);
            if (null != r && t) {
                for (var i = 0; i < t.length; ++i) t[i] == this && t.splice(i--, 1);
                t.length || (n.widgets = null);
                var o = Kr(this);
                xi(n, Math.max(0, n.height - o)), e && jt(e, function() {
                    Gr(e, n, -o), Qt(e, r, "widget");
                });
            }
        }, Ur.prototype.changed = function() {
            var e = this.height, t = this.doc.cm, n = this.line;
            this.height = null;
            var r = Kr(this) - e;
            r && (xi(n, n.height + r), t && jt(t, function() {
                t.curOp.forceUpdate = !0, Gr(t, n, r);
            }));
        };
        var Vr = S.Line = function(e, t, n) {
            this.text = e, Nr(this, t), this.height = n ? n(this) : 1;
        };
        function jr(e, t) {
            if (e) for (;;) {
                var n = e.match(/(?:^|\s+)line-(background-)?(\S+)/);
                if (!n) break;
                e = e.slice(0, n.index) + e.slice(n.index + n[0].length);
                var r = n[1] ? "bgClass" : "textClass";
                null == t[r] ? t[r] = n[2] : new RegExp("(?:^|s)" + n[2] + "(?:$|s)").test(t[r]) || (t[r] += " " + n[2]);
            }
            return e;
        }
        function _r(e, t) {
            if (e.blankLine) return e.blankLine(t);
            if (e.innerMode) {
                var n = S.innerMode(e, t);
                return n.mode.blankLine ? n.mode.blankLine(n.state) : void 0;
            }
        }
        function qr(e, t, n, r) {
            for (var i = 0; i < 10; i++) {
                r && (r[0] = S.innerMode(e, n).mode);
                var o = e.token(t, n);
                if (t.pos > t.start) return o;
            }
            throw new Error("Mode " + e.name + " failed to advance stream.");
        }
        function Xr(e, t, n, r) {
            function i(e) {
                return {
                    start: f.start,
                    end: f.pos,
                    string: f.current(),
                    type: o || null,
                    state: e ? or(l.mode, u) : u
                };
            }
            var o, l = e.doc, s = l.mode;
            t = Pe(l, t);
            var a, c = yi(l, t.line), u = ot(e, t.line, n), f = new pr(c.text, e.options.tabSize);
            for (r && (a = []); (r || f.pos < t.ch) && !f.eol(); ) f.start = f.pos, o = qr(s, f, u), 
            r && a.push(i(!0));
            return r ? a : i();
        }
        function Yr(e, t, n, r, i, o, l) {
            var s = n.flattenSpans;
            null == s && (s = e.options.flattenSpans);
            var a, c = 0, u = null, f = new pr(t, e.options.tabSize), h = e.options.addModeClass && [ null ];
            for ("" == t && jr(_r(n, r), o); !f.eol(); ) {
                if (f.pos > e.options.maxHighlightLength ? (s = !1, l && Qr(e, t, r, f.pos), f.pos = t.length, 
                a = null) : a = jr(qr(n, f, r, h), o), h) {
                    var d = h[0].name;
                    d && (a = "m-" + (a ? d + " " + a : d));
                }
                if (!s || u != a) {
                    for (;c < f.start; ) i(c = Math.min(f.start, c + 5e4), u);
                    u = a;
                }
                f.start = f.pos;
            }
            for (;c < f.pos; ) {
                var p = Math.min(f.pos, c + 5e4);
                i(p, u), c = p;
            }
        }
        function $r(e, t, n, r) {
            var i = [ e.state.modeGen ], o = {};
            Yr(e, t.text, e.doc.mode, n, function(e, t) {
                i.push(e, t);
            }, o, r);
            for (var l = 0; l < e.state.overlays.length; ++l) {
                var s = e.state.overlays[l], a = 1, c = 0;
                Yr(e, t.text, s.mode, !0, function(e, t) {
                    for (var n = a; c < e; ) {
                        var r = i[a];
                        r > e && i.splice(a, 1, e, i[a + 1], r), a += 2, c = Math.min(e, r);
                    }
                    if (t) if (s.opaque) i.splice(n, a - n, e, "cm-overlay " + t), a = n + 2; else for (;n < a; n += 2) {
                        var o = i[n + 1];
                        i[n + 1] = (o ? o + " " : "") + "cm-overlay " + t;
                    }
                }, o);
            }
            return {
                styles: i,
                classes: o.bgClass || o.textClass ? o : null
            };
        }
        function Zr(e, t, n) {
            if (!t.styles || t.styles[0] != e.state.modeGen) {
                var r = ot(e, Ci(t)), i = $r(e, t, t.text.length > e.options.maxHighlightLength ? or(e.doc.mode, r) : r);
                t.stateAfter = r, t.styles = i.styles, i.classes ? t.styleClasses = i.classes : t.styleClasses && (t.styleClasses = null), 
                n === e.doc.frontier && e.doc.frontier++;
            }
            return t.styles;
        }
        function Qr(e, t, n, r) {
            var i = e.doc.mode, o = new pr(t, e.options.tabSize);
            for (o.start = o.pos = r || 0, "" == t && _r(i, n); !o.eol(); ) qr(i, o, n), o.start = o.pos;
        }
        eo(Vr), Vr.prototype.lineNo = function() {
            return Ci(this);
        };
        var Jr = {}, ei = {};
        function ti(e, t) {
            if (!e || /^\s*$/.test(e)) return null;
            var n = t.addModeClass ? ei : Jr;
            return n[e] || (n[e] = e.replace(/\S+/g, "cm-$&"));
        }
        function ni(e, t) {
            var n = To("span", null, null, s ? "padding-right: .1px" : null), r = {
                pre: To("pre", [ n ], "CodeMirror-line"),
                content: n,
                col: 0,
                pos: 0,
                cm: e,
                splitSpaces: (o || s) && e.getOption("lineWrapping")
            };
            t.measure = {};
            for (var i = 0; i <= (t.rest ? t.rest.length : 0); i++) {
                var l, a = i ? t.rest[i - 1] : t.line;
                r.pos = 0, r.addToken = ri, Go(e.display.measure) && (l = Li(a)) && (r.addToken = oi(r.addToken, l)), 
                r.map = [], si(a, r, Zr(e, a, t != e.display.externalMeasured && Ci(a))), a.styleClasses && (a.styleClasses.bgClass && (r.bgClass = Po(a.styleClasses.bgClass, r.bgClass || "")), 
                a.styleClasses.textClass && (r.textClass = Po(a.styleClasses.textClass, r.textClass || ""))), 
                0 == r.map.length && r.map.push(0, 0, r.content.appendChild(Uo(e.display.measure))), 
                0 == i ? (t.measure.map = r.map, t.measure.cache = {}) : ((t.measure.maps || (t.measure.maps = [])).push(r.map), 
                (t.measure.caches || (t.measure.caches = [])).push({}));
            }
            return s && /\bcm-tab\b/.test(r.content.lastChild.className) && (r.content.className = "cm-tab-wrap-hack"), 
            qi(e, "renderLine", e, t.line, r.pre), r.pre.className && (r.textClass = Po(r.pre.className, r.textClass || "")), 
            r;
        }
        function ri(e, t, n, r, i, s, a) {
            if (t) {
                var c = e.splitSpaces ? t.replace(/ {3,}/g, ii) : t, u = e.cm.state.specialChars, f = !1;
                if (u.test(t)) {
                    y = document.createDocumentFragment();
                    for (var h = 0; ;) {
                        u.lastIndex = h;
                        var d = u.exec(t), p = d ? d.index - h : t.length - h;
                        if (p) {
                            var g = document.createTextNode(c.slice(h, h + p));
                            o && l < 9 ? y.appendChild(To("span", [ g ])) : y.appendChild(g), e.map.push(e.pos, e.pos + p, g), 
                            e.col += p, e.pos += p;
                        }
                        if (!d) break;
                        if (h += p + 1, "\t" == d[0]) {
                            var m = e.cm.options.tabSize, v = m - e.col % m;
                            (g = y.appendChild(To("span", uo(v), "cm-tab"))).setAttribute("role", "presentation"), 
                            g.setAttribute("cm-text", "\t"), e.col += v;
                        } else if ("\r" == d[0] || "\n" == d[0]) {
                            (g = y.appendChild(To("span", "\r" == d[0] ? "\u240d" : "\u2424", "cm-invalidchar"))).setAttribute("cm-text", d[0]), 
                            e.col += 1;
                        } else {
                            (g = e.cm.options.specialCharPlaceholder(d[0])).setAttribute("cm-text", d[0]), o && l < 9 ? y.appendChild(To("span", [ g ])) : y.appendChild(g), 
                            e.col += 1;
                        }
                        e.map.push(e.pos, e.pos + 1, g), e.pos++;
                    }
                } else {
                    e.col += t.length;
                    var y = document.createTextNode(c);
                    e.map.push(e.pos, e.pos + t.length, y), o && l < 9 && (f = !0), e.pos += t.length;
                }
                if (n || r || i || f || a) {
                    var b = n || "";
                    r && (b += r), i && (b += i);
                    var w = To("span", [ y ], b, a);
                    return s && (w.title = s), e.content.appendChild(w);
                }
                e.content.appendChild(y);
            }
        }
        function ii(e) {
            for (var t = " ", n = 0; n < e.length - 2; ++n) t += n % 2 ? " " : "\xa0";
            return t += " ";
        }
        function oi(e, t) {
            return function(n, r, i, o, l, s, a) {
                i = i ? i + " cm-force-border" : "cm-force-border";
                for (var c = n.pos, u = c + r.length; ;) {
                    for (var f = 0; f < t.length; f++) {
                        var h = t[f];
                        if (h.to > c && h.from <= c) break;
                    }
                    if (h.to >= u) return e(n, r, i, o, l, s, a);
                    e(n, r.slice(0, h.to - c), i, o, null, s, a), o = null, r = r.slice(h.to - c), c = h.to;
                }
            };
        }
        function li(e, t, n, r) {
            var i = !r && n.widgetNode;
            i && e.map.push(e.pos, e.pos + t, i), !r && e.cm.display.input.needsContentAttribute && (i || (i = e.content.appendChild(document.createElement("span"))), 
            i.setAttribute("cm-marker", n.id)), i && (e.cm.display.input.setUneditable(i), e.content.appendChild(i)), 
            e.pos += t;
        }
        function si(e, t, n) {
            var r = e.markedSpans, i = e.text, o = 0;
            if (r) for (var l, s, a, c, u, f, h, d = i.length, p = 0, g = (L = 1, ""), m = 0; ;) {
                if (m == p) {
                    a = c = u = f = s = "", h = null, m = 1 / 0;
                    for (var v, y = [], b = 0; b < r.length; ++b) {
                        var w = r[b], x = w.marker;
                        "bookmark" == x.type && w.from == p && x.widgetNode ? y.push(x) : w.from <= p && (null == w.to || w.to > p || x.collapsed && w.to == p && w.from == p) ? (null != w.to && w.to != p && m > w.to && (m = w.to, 
                        c = ""), x.className && (a += " " + x.className), x.css && (s = (s ? s + ";" : "") + x.css), 
                        x.startStyle && w.from == p && (u += " " + x.startStyle), x.endStyle && w.to == m && (v || (v = [])).push(x.endStyle, w.to), 
                        x.title && !f && (f = x.title), x.collapsed && (!h || Wr(h.marker, x) < 0) && (h = w)) : w.from > p && m > w.from && (m = w.from);
                    }
                    if (v) for (b = 0; b < v.length; b += 2) v[b + 1] == m && (c += " " + v[b]);
                    if (!h || h.from == p) for (b = 0; b < y.length; ++b) li(t, 0, y[b]);
                    if (h && (h.from || 0) == p) {
                        if (li(t, (null == h.to ? d + 1 : h.to) - p, h.marker, null == h.from), null == h.to) return;
                        h.to == p && (h = !1);
                    }
                }
                if (p >= d) break;
                for (var C = Math.min(d, m); ;) {
                    if (g) {
                        var S = p + g.length;
                        if (!h) {
                            var k = S > C ? g.slice(0, C - p) : g;
                            t.addToken(t, k, l ? l + a : a, u, p + k.length == m ? c : "", f, s);
                        }
                        if (S >= C) {
                            g = g.slice(C - p), p = C;
                            break;
                        }
                        p = S, u = "";
                    }
                    g = i.slice(o, o = n[L++]), l = ti(n[L++], t.cm.options);
                }
            } else for (var L = 1; L < n.length; L += 2) t.addToken(t, i.slice(o, o = n[L]), ti(n[L + 1], t.cm.options));
        }
        function ai(e, t) {
            return 0 == t.from.ch && 0 == t.to.ch && "" == fo(t.text) && (!e.cm || e.cm.options.wholeLineUpdateBefore);
        }
        function ci(e, t, n, r) {
            function i(e) {
                return n ? n[e] : null;
            }
            function o(e, n, i) {
                !function(e, t, n, r) {
                    e.text = t, e.stateAfter && (e.stateAfter = null), e.styles && (e.styles = null), 
                    null != e.order && (e.order = null), Tr(e), Nr(e, n);
                    var i = r ? r(e) : 1;
                    i != e.height && xi(e, i);
                }(e, n, i, r), Yi(e, "change", e, t);
            }
            function l(e, t) {
                for (var n = e, o = []; n < t; ++n) o.push(new Vr(c[n], i(n), r));
                return o;
            }
            var s = t.from, a = t.to, c = t.text, u = yi(e, s.line), f = yi(e, a.line), h = fo(c), d = i(c.length - 1), p = a.line - s.line;
            if (t.full) e.insert(0, l(0, c.length)), e.remove(c.length, e.size - c.length); else if (ai(e, t)) {
                var g = l(0, c.length - 1);
                o(f, f.text, d), p && e.remove(s.line, p), g.length && e.insert(s.line, g);
            } else if (u == f) {
                if (1 == c.length) o(u, u.text.slice(0, s.ch) + h + u.text.slice(a.ch), d); else (g = l(1, c.length - 1)).push(new Vr(h + u.text.slice(a.ch), d, r)), 
                o(u, u.text.slice(0, s.ch) + c[0], i(0)), e.insert(s.line + 1, g);
            } else if (1 == c.length) o(u, u.text.slice(0, s.ch) + c[0] + f.text.slice(a.ch), i(0)), 
            e.remove(s.line + 1, p); else {
                o(u, u.text.slice(0, s.ch) + c[0], i(0)), o(f, h + f.text.slice(a.ch), d);
                g = l(1, c.length - 1);
                p > 1 && e.remove(s.line + 1, p - 1), e.insert(s.line + 1, g);
            }
            Yi(e, "change", e, t);
        }
        function ui(e) {
            this.lines = e, this.parent = null;
            for (var t = 0, n = 0; t < e.length; ++t) e[t].parent = this, n += e[t].height;
            this.height = n;
        }
        function fi(e) {
            this.children = e;
            for (var t = 0, n = 0, r = 0; r < e.length; ++r) {
                var i = e[r];
                t += i.chunkSize(), n += i.height, i.parent = this;
            }
            this.size = t, this.height = n, this.parent = null;
        }
        ui.prototype = {
            chunkSize: function() {
                return this.lines.length;
            },
            removeInner: function(e, t) {
                for (var n = e, r = e + t; n < r; ++n) {
                    var i = this.lines[n];
                    this.height -= i.height, (o = i).parent = null, Tr(o), Yi(i, "delete");
                }
                var o;
                this.lines.splice(e, t);
            },
            collapse: function(e) {
                e.push.apply(e, this.lines);
            },
            insertInner: function(e, t, n) {
                this.height += n, this.lines = this.lines.slice(0, e).concat(t).concat(this.lines.slice(e));
                for (var r = 0; r < t.length; ++r) t[r].parent = this;
            },
            iterN: function(e, t, n) {
                for (var r = e + t; e < r; ++e) if (n(this.lines[e])) return !0;
            }
        }, fi.prototype = {
            chunkSize: function() {
                return this.size;
            },
            removeInner: function(e, t) {
                this.size -= t;
                for (var n = 0; n < this.children.length; ++n) {
                    var r = this.children[n], i = r.chunkSize();
                    if (e < i) {
                        var o = Math.min(t, i - e), l = r.height;
                        if (r.removeInner(e, o), this.height -= l - r.height, i == o && (this.children.splice(n--, 1), 
                        r.parent = null), 0 == (t -= o)) break;
                        e = 0;
                    } else e -= i;
                }
                if (this.size - t < 25 && (this.children.length > 1 || !(this.children[0] instanceof ui))) {
                    var s = [];
                    this.collapse(s), this.children = [ new ui(s) ], this.children[0].parent = this;
                }
            },
            collapse: function(e) {
                for (var t = 0; t < this.children.length; ++t) this.children[t].collapse(e);
            },
            insertInner: function(e, t, n) {
                this.size += t.length, this.height += n;
                for (var r = 0; r < this.children.length; ++r) {
                    var i = this.children[r], o = i.chunkSize();
                    if (e <= o) {
                        if (i.insertInner(e, t, n), i.lines && i.lines.length > 50) {
                            for (;i.lines.length > 50; ) {
                                var l = new ui(i.lines.splice(i.lines.length - 25, 25));
                                i.height -= l.height, this.children.splice(r + 1, 0, l), l.parent = this;
                            }
                            this.maybeSpill();
                        }
                        break;
                    }
                    e -= o;
                }
            },
            maybeSpill: function() {
                if (!(this.children.length <= 10)) {
                    var e = this;
                    do {
                        var t = new fi(e.children.splice(e.children.length - 5, 5));
                        if (e.parent) {
                            e.size -= t.size, e.height -= t.height;
                            var n = po(e.parent.children, e);
                            e.parent.children.splice(n + 1, 0, t);
                        } else {
                            var r = new fi(e.children);
                            r.parent = e, e.children = [ r, t ], e = r;
                        }
                        t.parent = e.parent;
                    } while (e.children.length > 10);
                    e.parent.maybeSpill();
                }
            },
            iterN: function(e, t, n) {
                for (var r = 0; r < this.children.length; ++r) {
                    var i = this.children[r], o = i.chunkSize();
                    if (e < o) {
                        var l = Math.min(t, o - e);
                        if (i.iterN(e, l, n)) return !0;
                        if (0 == (t -= l)) break;
                        e = 0;
                    } else e -= o;
                }
            }
        };
        var hi = 0, di = S.Doc = function(e, t, n, r) {
            if (!(this instanceof di)) return new di(e, t, n, r);
            null == n && (n = 0), fi.call(this, [ new ui([ new Vr("", null) ]) ]), this.first = n, 
            this.scrollTop = this.scrollLeft = 0, this.cantEdit = !1, this.cleanGeneration = 1, 
            this.frontier = n;
            var i = fe(n, 0);
            this.sel = He(i), this.history = new Mi(null), this.id = ++hi, this.modeOption = t, 
            this.lineSep = r, this.extend = !1, "string" == typeof e && (e = this.splitLines(e)), 
            ci(this, {
                from: i,
                to: i,
                text: e
            }), Ve(this, He(i), ro);
        };
        di.prototype = vo(fi.prototype, {
            constructor: di,
            iter: function(e, t, n) {
                n ? this.iterN(e - this.first, t - e, n) : this.iterN(this.first, this.first + this.size, e);
            },
            insert: function(e, t) {
                for (var n = 0, r = 0; r < t.length; ++r) n += t[r].height;
                this.insertInner(e - this.first, t, n);
            },
            remove: function(e, t) {
                this.removeInner(e - this.first, t);
            },
            getValue: function(e) {
                var t = wi(this, this.first, this.first + this.size);
                return !1 === e ? t : t.join(e || this.lineSeparator());
            },
            setValue: Xt(function(e) {
                var t = fe(this.first, 0), n = this.first + this.size - 1;
                Pn(this, {
                    from: t,
                    to: fe(n, yi(this, n).text.length),
                    text: this.splitLines(e),
                    origin: "setValue",
                    full: !0
                }, !0), Ve(this, He(t));
            }),
            replaceRange: function(e, t, n, r) {
                Bn(this, e, t = Pe(this, t), n = n ? Pe(this, n) : t, r);
            },
            getRange: function(e, t, n) {
                var r = bi(this, Pe(this, e), Pe(this, t));
                return !1 === n ? r : r.join(n || this.lineSeparator());
            },
            getLine: function(e) {
                var t = this.getLineHandle(e);
                return t && t.text;
            },
            getLineHandle: function(e) {
                if (Ie(this, e)) return yi(this, e);
            },
            getLineNumber: function(e) {
                return Ci(e);
            },
            getLineHandleVisualStart: function(e) {
                return "number" == typeof e && (e = yi(this, e)), Ir(e);
            },
            lineCount: function() {
                return this.size;
            },
            firstLine: function() {
                return this.first;
            },
            lastLine: function() {
                return this.first + this.size - 1;
            },
            clipPos: function(e) {
                return Pe(this, e);
            },
            getCursor: function(e) {
                var t = this.sel.primary();
                return null == e || "head" == e ? t.head : "anchor" == e ? t.anchor : "end" == e || "to" == e || !1 === e ? t.to() : t.from();
            },
            listSelections: function() {
                return this.sel.ranges;
            },
            somethingSelected: function() {
                return this.sel.somethingSelected();
            },
            setCursor: Xt(function(e, t, n) {
                Ge(this, Pe(this, "number" == typeof e ? fe(e, t || 0) : e), null, n);
            }),
            setSelection: Xt(function(e, t, n) {
                Ge(this, Pe(this, e), Pe(this, t || e), n);
            }),
            extendSelection: Xt(function(e, t, n) {
                Re(this, Pe(this, e), t && Pe(this, t), n);
            }),
            extendSelections: Xt(function(e, t) {
                Be(this, Ee(this, e), t);
            }),
            extendSelectionsBy: Xt(function(e, t) {
                Be(this, Ee(this, go(this.sel.ranges, e)), t);
            }),
            setSelections: Xt(function(e, t, n) {
                if (e.length) {
                    for (var r = 0, i = []; r < e.length; r++) i[r] = new We(Pe(this, e[r].anchor), Pe(this, e[r].head));
                    null == t && (t = Math.min(e.length - 1, this.sel.primIndex)), Ve(this, Fe(i, t), n);
                }
            }),
            addSelection: Xt(function(e, t, n) {
                var r = this.sel.ranges.slice(0);
                r.push(new We(Pe(this, e), Pe(this, t || e))), Ve(this, Fe(r, r.length - 1), n);
            }),
            getSelection: function(e) {
                for (var t, n = this.sel.ranges, r = 0; r < n.length; r++) {
                    var i = bi(this, n[r].from(), n[r].to());
                    t = t ? t.concat(i) : i;
                }
                return !1 === e ? t : t.join(e || this.lineSeparator());
            },
            getSelections: function(e) {
                for (var t = [], n = this.sel.ranges, r = 0; r < n.length; r++) {
                    var i = bi(this, n[r].from(), n[r].to());
                    !1 !== e && (i = i.join(e || this.lineSeparator())), t[r] = i;
                }
                return t;
            },
            replaceSelection: function(e, t, n) {
                for (var r = [], i = 0; i < this.sel.ranges.length; i++) r[i] = e;
                this.replaceSelections(r, t, n || "+input");
            },
            replaceSelections: Xt(function(e, t, n) {
                for (var r = [], i = this.sel, o = 0; o < i.ranges.length; o++) {
                    var l = i.ranges[o];
                    r[o] = {
                        from: l.from(),
                        to: l.to(),
                        text: this.splitLines(e[o]),
                        origin: n
                    };
                }
                var s = t && "end" != t && function(e, t, n) {
                    for (var r = [], i = fe(e.first, 0), o = i, l = 0; l < t.length; l++) {
                        var s = t[l], a = Hn(s.from, i, o), c = Hn(An(s), i, o);
                        if (i = s.to, o = c, "around" == n) {
                            var u = e.sel.ranges[l], f = he(u.head, u.anchor) < 0;
                            r[l] = new We(f ? c : a, f ? a : c);
                        } else r[l] = new We(a, a);
                    }
                    return new Ae(r, e.sel.primIndex);
                }(this, r, t);
                for (o = r.length - 1; o >= 0; o--) Pn(this, r[o]);
                s ? Ke(this, s) : this.cm && Kn(this.cm);
            }),
            undo: Xt(function() {
                En(this, "undo");
            }),
            redo: Xt(function() {
                En(this, "redo");
            }),
            undoSelection: Xt(function() {
                En(this, "undo", !0);
            }),
            redoSelection: Xt(function() {
                En(this, "redo", !0);
            }),
            setExtending: function(e) {
                this.extend = e;
            },
            getExtending: function() {
                return this.extend;
            },
            historySize: function() {
                for (var e = this.history, t = 0, n = 0, r = 0; r < e.done.length; r++) e.done[r].ranges || ++t;
                for (r = 0; r < e.undone.length; r++) e.undone[r].ranges || ++n;
                return {
                    undo: t,
                    redo: n
                };
            },
            clearHistory: function() {
                this.history = new Mi(this.history.maxGeneration);
            },
            markClean: function() {
                this.cleanGeneration = this.changeGeneration(!0);
            },
            changeGeneration: function(e) {
                return e && (this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null), 
                this.history.generation;
            },
            isClean: function(e) {
                return this.history.generation == (e || this.cleanGeneration);
            },
            getHistory: function() {
                return {
                    done: Hi(this.history.done),
                    undone: Hi(this.history.undone)
                };
            },
            setHistory: function(e) {
                var t = this.history = new Mi(this.history.maxGeneration);
                t.done = Hi(e.done.slice(0), null, !0), t.undone = Hi(e.undone.slice(0), null, !0);
            },
            addLineClass: Xt(function(e, t, n) {
                return _n(this, e, "gutter" == t ? "gutter" : "class", function(e) {
                    var r = "text" == t ? "textClass" : "background" == t ? "bgClass" : "gutter" == t ? "gutterClass" : "wrapClass";
                    if (e[r]) {
                        if (Fo(n).test(e[r])) return !1;
                        e[r] += " " + n;
                    } else e[r] = n;
                    return !0;
                });
            }),
            removeLineClass: Xt(function(e, t, n) {
                return _n(this, e, "gutter" == t ? "gutter" : "class", function(e) {
                    var r = "text" == t ? "textClass" : "background" == t ? "bgClass" : "gutter" == t ? "gutterClass" : "wrapClass", i = e[r];
                    if (!i) return !1;
                    if (null == n) e[r] = null; else {
                        var o = i.match(Fo(n));
                        if (!o) return !1;
                        var l = o.index + o[0].length;
                        e[r] = i.slice(0, o.index) + (o.index && l != i.length ? " " : "") + i.slice(l) || null;
                    }
                    return !0;
                });
            }),
            addLineWidget: Xt(function(e, t, n) {
                return i = e, o = new Ur(r = this, t, n), (l = r.cm) && o.noHScroll && (l.display.alignWidgets = !0), 
                _n(r, i, "widget", function(e) {
                    var t = e.widgets || (e.widgets = []);
                    if (null == o.insertAt ? t.push(o) : t.splice(Math.min(t.length - 1, Math.max(0, o.insertAt)), 0, o), 
                    o.line = e, l && !Rr(r, e)) {
                        var n = ki(e) < r.scrollTop;
                        xi(e, e.height + Kr(o)), n && Gn(l, null, o.height), l.curOp.forceUpdate = !0;
                    }
                    return !0;
                }), o;
                var r, i, o, l;
            }),
            removeLineWidget: function(e) {
                e.clear();
            },
            markText: function(e, t, n) {
                return vr(this, Pe(this, e), Pe(this, t), n, n && n.type || "range");
            },
            setBookmark: function(e, t) {
                var n = {
                    replacedWith: t && (null == t.nodeType ? t.widget : t),
                    insertLeft: t && t.insertLeft,
                    clearWhenEmpty: !1,
                    shared: t && t.shared,
                    handleMouseEvents: t && t.handleMouseEvents
                };
                return vr(this, e = Pe(this, e), e, n, "bookmark");
            },
            findMarksAt: function(e) {
                var t = [], n = yi(this, (e = Pe(this, e)).line).markedSpans;
                if (n) for (var r = 0; r < n.length; ++r) {
                    var i = n[r];
                    (null == i.from || i.from <= e.ch) && (null == i.to || i.to >= e.ch) && t.push(i.marker.parent || i.marker);
                }
                return t;
            },
            findMarks: function(e, t, n) {
                e = Pe(this, e), t = Pe(this, t);
                var r = [], i = e.line;
                return this.iter(e.line, t.line + 1, function(o) {
                    var l = o.markedSpans;
                    if (l) for (var s = 0; s < l.length; s++) {
                        var a = l[s];
                        null != a.to && i == e.line && e.ch > a.to || null == a.from && i != e.line || null != a.from && i == t.line && a.from > t.ch || n && !n(a.marker) || r.push(a.marker.parent || a.marker);
                    }
                    ++i;
                }), r;
            },
            getAllMarks: function() {
                var e = [];
                return this.iter(function(t) {
                    var n = t.markedSpans;
                    if (n) for (var r = 0; r < n.length; ++r) null != n[r].from && e.push(n[r].marker);
                }), e;
            },
            posFromIndex: function(e) {
                var t, n = this.first;
                return this.iter(function(r) {
                    var i = r.text.length + 1;
                    if (i > e) return t = e, !0;
                    e -= i, ++n;
                }), Pe(this, fe(n, t));
            },
            indexFromPos: function(e) {
                var t = (e = Pe(this, e)).ch;
                return e.line < this.first || e.ch < 0 ? 0 : (this.iter(this.first, e.line, function(e) {
                    t += e.text.length + 1;
                }), t);
            },
            copy: function(e) {
                var t = new di(wi(this, this.first, this.first + this.size), this.modeOption, this.first, this.lineSep);
                return t.scrollTop = this.scrollTop, t.scrollLeft = this.scrollLeft, t.sel = this.sel, 
                t.extend = !1, e && (t.history.undoDepth = this.history.undoDepth, t.setHistory(this.getHistory())), 
                t;
            },
            linkedDoc: function(e) {
                e || (e = {});
                var t = this.first, n = this.first + this.size;
                null != e.from && e.from > t && (t = e.from), null != e.to && e.to < n && (n = e.to);
                var r = new di(wi(this, t, n), e.mode || this.modeOption, t, this.lineSep);
                return e.sharedHist && (r.history = this.history), (this.linked || (this.linked = [])).push({
                    doc: r,
                    sharedHist: e.sharedHist
                }), r.linked = [ {
                    doc: this,
                    isParent: !0,
                    sharedHist: e.sharedHist
                } ], function(e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var r = t[n], i = r.find(), o = e.clipPos(i.from), l = e.clipPos(i.to);
                        if (he(o, l)) {
                            var s = vr(e, o, l, r.primary, r.primary.type);
                            r.markers.push(s), s.parent = r;
                        }
                    }
                }(r, br(this)), r;
            },
            unlinkDoc: function(e) {
                if (e instanceof S && (e = e.doc), this.linked) for (var t = 0; t < this.linked.length; ++t) {
                    if (this.linked[t].doc == e) {
                        this.linked.splice(t, 1), e.unlinkDoc(this), wr(br(this));
                        break;
                    }
                }
                if (e.history == this.history) {
                    var n = [ e.id ];
                    mi(e, function(e) {
                        n.push(e.id);
                    }, !0), e.history = new Mi(null), e.history.done = Hi(this.history.done, n), e.history.undone = Hi(this.history.undone, n);
                }
            },
            iterLinkedDocs: function(e) {
                mi(this, e);
            },
            getMode: function() {
                return this.mode;
            },
            getEditor: function() {
                return this.cm;
            },
            splitLines: function(e) {
                return this.lineSep ? e.split(this.lineSep) : Vo(e);
            },
            lineSeparator: function() {
                return this.lineSep || "\n";
            }
        }), di.prototype.eachLine = di.prototype.iter;
        var pi = "iter insert remove copy getEditor constructor".split(" ");
        for (var gi in di.prototype) di.prototype.hasOwnProperty(gi) && po(pi, gi) < 0 && (S.prototype[gi] = function(e) {
            return function() {
                return e.apply(this.doc, arguments);
            };
        }(di.prototype[gi]));
        function mi(e, t, n) {
            !function e(r, i, o) {
                if (r.linked) for (var l = 0; l < r.linked.length; ++l) {
                    var s = r.linked[l];
                    if (s.doc != i) {
                        var a = o && s.sharedHist;
                        n && !a || (t(s.doc, a), e(s.doc, r, a));
                    }
                }
            }(e, null, !0);
        }
        function vi(e, t) {
            if (t.cm) throw new Error("This document is already in use.");
            e.doc = t, t.cm = e, T(e), k(e), e.options.lineWrapping || H(e), e.options.mode = t.modeOption, 
            Zt(e);
        }
        function yi(e, t) {
            if ((t -= e.first) < 0 || t >= e.size) throw new Error("There is no line " + (t + e.first) + " in the document.");
            for (var n = e; !n.lines; ) for (var r = 0; ;++r) {
                var i = n.children[r], o = i.chunkSize();
                if (t < o) {
                    n = i;
                    break;
                }
                t -= o;
            }
            return n.lines[t];
        }
        function bi(e, t, n) {
            var r = [], i = t.line;
            return e.iter(t.line, n.line + 1, function(e) {
                var o = e.text;
                i == n.line && (o = o.slice(0, n.ch)), i == t.line && (o = o.slice(t.ch)), r.push(o), 
                ++i;
            }), r;
        }
        function wi(e, t, n) {
            var r = [];
            return e.iter(t, n, function(e) {
                r.push(e.text);
            }), r;
        }
        function xi(e, t) {
            var n = t - e.height;
            if (n) for (var r = e; r; r = r.parent) r.height += n;
        }
        function Ci(e) {
            if (null == e.parent) return null;
            for (var t = e.parent, n = po(t.lines, e), r = t.parent; r; t = r, r = r.parent) for (var i = 0; r.children[i] != t; ++i) n += r.children[i].chunkSize();
            return n + t.first;
        }
        function Si(e, t) {
            var n = e.first;
            e: do {
                for (var r = 0; r < e.children.length; ++r) {
                    var i = e.children[r], o = i.height;
                    if (t < o) {
                        e = i;
                        continue e;
                    }
                    t -= o, n += i.chunkSize();
                }
                return n;
            } while (!e.lines);
            for (r = 0; r < e.lines.length; ++r) {
                var l = e.lines[r].height;
                if (t < l) break;
                t -= l;
            }
            return n + r;
        }
        function ki(e) {
            for (var t = 0, n = (e = Ir(e)).parent, r = 0; r < n.lines.length; ++r) {
                var i = n.lines[r];
                if (i == e) break;
                t += i.height;
            }
            for (var o = n.parent; o; o = (n = o).parent) for (r = 0; r < o.children.length; ++r) {
                var l = o.children[r];
                if (l == n) break;
                t += l.height;
            }
            return t;
        }
        function Li(e) {
            var t = e.order;
            return null == t && (t = e.order = ll(e.text)), t;
        }
        function Mi(e) {
            this.done = [], this.undone = [], this.undoDepth = 1 / 0, this.lastModTime = this.lastSelTime = 0, 
            this.lastOp = this.lastSelOp = null, this.lastOrigin = this.lastSelOrigin = null, 
            this.generation = this.maxGeneration = e || 1;
        }
        function Ti(e, t) {
            var n = {
                from: de(t.from),
                to: An(t),
                text: bi(e, t.from, t.to)
            };
            return Wi(e, n, t.from.line, t.to.line + 1), mi(e, function(e) {
                Wi(e, n, t.from.line, t.to.line + 1);
            }, !0), n;
        }
        function Ni(e) {
            for (;e.length; ) {
                if (!fo(e).ranges) break;
                e.pop();
            }
        }
        function Oi(e, t, n, r) {
            var i = e.history;
            i.undone.length = 0;
            var o, l, s = +new Date();
            if ((i.lastOp == r || i.lastOrigin == t.origin && t.origin && ("+" == t.origin.charAt(0) && e.cm && i.lastModTime > s - e.cm.options.historyEventDelay || "*" == t.origin.charAt(0))) && (l = i, 
            o = i.lastOp == r ? (Ni(l.done), fo(l.done)) : l.done.length && !fo(l.done).ranges ? fo(l.done) : l.done.length > 1 && !l.done[l.done.length - 2].ranges ? (l.done.pop(), 
            fo(l.done)) : void 0)) {
                var a = fo(o.changes);
                0 == he(t.from, t.to) && 0 == he(t.from, a.to) ? a.to = An(t) : o.changes.push(Ti(e, t));
            } else {
                var c = fo(i.done);
                for (c && c.ranges || Ai(e.sel, i.done), o = {
                    changes: [ Ti(e, t) ],
                    generation: i.generation
                }, i.done.push(o); i.done.length > i.undoDepth; ) i.done.shift(), i.done[0].ranges || i.done.shift();
            }
            i.done.push(n), i.generation = ++i.maxGeneration, i.lastModTime = i.lastSelTime = s, 
            i.lastOp = i.lastSelOp = r, i.lastOrigin = i.lastSelOrigin = t.origin, a || qi(e, "historyAdded");
        }
        function Ai(e, t) {
            var n = fo(t);
            n && n.ranges && n.equals(e) || t.push(e);
        }
        function Wi(e, t, n, r) {
            var i = t["spans_" + e.id], o = 0;
            e.iter(Math.max(e.first, n), Math.min(e.first + e.size, r), function(n) {
                n.markedSpans && ((i || (i = t["spans_" + e.id] = {}))[o] = n.markedSpans), ++o;
            });
        }
        function Fi(e) {
            if (!e) return null;
            for (var t, n = 0; n < e.length; ++n) e[n].marker.explicitlyCleared ? t || (t = e.slice(0, n)) : t && t.push(e[n]);
            return t ? t.length ? t : null : e;
        }
        function Hi(e, t, n) {
            for (var r = 0, i = []; r < e.length; ++r) {
                var o = e[r];
                if (o.ranges) i.push(n ? Ae.prototype.deepCopy.call(o) : o); else {
                    var l = o.changes, s = [];
                    i.push({
                        changes: s
                    });
                    for (var a = 0; a < l.length; ++a) {
                        var c, u = l[a];
                        if (s.push({
                            from: u.from,
                            to: u.to,
                            text: u.text
                        }), t) for (var f in u) (c = f.match(/^spans_(\d+)$/)) && po(t, Number(c[1])) > -1 && (fo(s)[f] = u[f], 
                        delete u[f]);
                    }
                }
            }
            return i;
        }
        function Di(e, t, n, r) {
            n < e.line ? e.line += r : t < e.line && (e.line = t, e.ch = 0);
        }
        function Pi(e, t, n, r) {
            for (var i = 0; i < e.length; ++i) {
                var o = e[i], l = !0;
                if (o.ranges) {
                    o.copied || ((o = e[i] = o.deepCopy()).copied = !0);
                    for (var s = 0; s < o.ranges.length; s++) Di(o.ranges[s].anchor, t, n, r), Di(o.ranges[s].head, t, n, r);
                } else {
                    for (s = 0; s < o.changes.length; ++s) {
                        var a = o.changes[s];
                        if (n < a.from.line) a.from = fe(a.from.line + r, a.from.ch), a.to = fe(a.to.line + r, a.to.ch); else if (t <= a.to.line) {
                            l = !1;
                            break;
                        }
                    }
                    l || (e.splice(0, i + 1), i = 0);
                }
            }
        }
        function Ii(e, t) {
            var n = t.from.line, r = t.to.line, i = t.text.length - (r - n) - 1;
            Pi(e.done, n, r, i), Pi(e.undone, n, r, i);
        }
        eo(di);
        var Ei = S.e_preventDefault = function(e) {
            e.preventDefault ? e.preventDefault() : e.returnValue = !1;
        }, zi = S.e_stopPropagation = function(e) {
            e.stopPropagation ? e.stopPropagation() : e.cancelBubble = !0;
        };
        function Ri(e) {
            return null != e.defaultPrevented ? e.defaultPrevented : 0 == e.returnValue;
        }
        var Bi = S.e_stop = function(e) {
            Ei(e), zi(e);
        };
        function Ui(e) {
            return e.target || e.srcElement;
        }
        function Gi(e) {
            var t = e.which;
            return null == t && (1 & e.button ? t = 1 : 2 & e.button ? t = 3 : 4 & e.button && (t = 2)), 
            m && e.ctrlKey && 1 == t && (t = 3), t;
        }
        var Ki = S.on = function(e, t, n) {
            if (e.addEventListener) e.addEventListener(t, n, !1); else if (e.attachEvent) e.attachEvent("on" + t, n); else {
                var r = e._handlers || (e._handlers = {});
                (r[t] || (r[t] = [])).push(n);
            }
        }, Vi = [];
        function ji(e, t, n) {
            var r = e._handlers && e._handlers[t];
            return n ? r && r.length > 0 ? r.slice() : Vi : r || Vi;
        }
        var _i = S.off = function(e, t, n) {
            if (e.removeEventListener) e.removeEventListener(t, n, !1); else if (e.detachEvent) e.detachEvent("on" + t, n); else for (var r = ji(e, t, !1), i = 0; i < r.length; ++i) if (r[i] == n) {
                r.splice(i, 1);
                break;
            }
        }, qi = S.signal = function(e, t) {
            var n = ji(e, t, !0);
            if (n.length) for (var r = Array.prototype.slice.call(arguments, 2), i = 0; i < n.length; ++i) n[i].apply(null, r);
        }, Xi = null;
        function Yi(e, t) {
            var n = ji(e, t, !1);
            if (n.length) {
                var r, i = Array.prototype.slice.call(arguments, 2);
                Et ? r = Et.delayedCallbacks : Xi ? r = Xi : (r = Xi = [], setTimeout($i, 0));
                for (var o = 0; o < n.length; ++o) r.push(l(n[o]));
            }
            function l(e) {
                return function() {
                    e.apply(null, i);
                };
            }
        }
        function $i() {
            var e = Xi;
            Xi = null;
            for (var t = 0; t < e.length; ++t) e[t]();
        }
        function Zi(e, t, n) {
            return "string" == typeof t && (t = {
                type: t,
                preventDefault: function() {
                    this.defaultPrevented = !0;
                }
            }), qi(e, n || t.type, e, t), Ri(t) || t.codemirrorIgnore;
        }
        function Qi(e) {
            var t = e._handlers && e._handlers.cursorActivity;
            if (t) for (var n = e.curOp.cursorActivityHandlers || (e.curOp.cursorActivityHandlers = []), r = 0; r < t.length; ++r) -1 == po(n, t[r]) && n.push(t[r]);
        }
        function Ji(e, t) {
            return ji(e, t).length > 0;
        }
        function eo(e) {
            e.prototype.on = function(e, t) {
                Ki(this, e, t);
            }, e.prototype.off = function(e, t) {
                _i(this, e, t);
            };
        }
        var to = 30, no = S.Pass = {
            toString: function() {
                return "CodeMirror.Pass";
            }
        }, ro = {
            scroll: !1
        }, io = {
            origin: "*mouse"
        }, oo = {
            origin: "+move"
        };
        function lo() {
            this.id = null;
        }
        lo.prototype.set = function(e, t) {
            clearTimeout(this.id), this.id = setTimeout(t, e);
        };
        var so = S.countColumn = function(e, t, n, r, i) {
            null == t && -1 == (t = e.search(/[^\s\u00a0]/)) && (t = e.length);
            for (var o = r || 0, l = i || 0; ;) {
                var s = e.indexOf("\t", o);
                if (s < 0 || s >= t) return l + (t - o);
                l += s - o, l += n - l % n, o = s + 1;
            }
        }, ao = S.findColumn = function(e, t, n) {
            for (var r = 0, i = 0; ;) {
                var o = e.indexOf("\t", r);
                -1 == o && (o = e.length);
                var l = o - r;
                if (o == e.length || i + l >= t) return r + Math.min(l, t - i);
                if (i += o - r, r = o + 1, (i += n - i % n) >= t) return r;
            }
        }, co = [ "" ];
        function uo(e) {
            for (;co.length <= e; ) co.push(fo(co) + " ");
            return co[e];
        }
        function fo(e) {
            return e[e.length - 1];
        }
        var ho = function(e) {
            e.select();
        };
        function po(e, t) {
            for (var n = 0; n < e.length; ++n) if (e[n] == t) return n;
            return -1;
        }
        function go(e, t) {
            for (var n = [], r = 0; r < e.length; r++) n[r] = t(e[r], r);
            return n;
        }
        function mo() {}
        function vo(e, t) {
            var n;
            return Object.create ? n = Object.create(e) : (mo.prototype = e, n = new mo()), 
            t && yo(t, n), n;
        }
        function yo(e, t, n) {
            for (var r in t || (t = {}), e) !e.hasOwnProperty(r) || !1 === n && t.hasOwnProperty(r) || (t[r] = e[r]);
            return t;
        }
        function bo(e) {
            var t = Array.prototype.slice.call(arguments, 1);
            return function() {
                return e.apply(null, t);
            };
        }
        p ? ho = function(e) {
            e.selectionStart = 0, e.selectionEnd = e.value.length;
        } : o && (ho = function(e) {
            try {
                e.select();
            } catch (e) {}
        });
        var wo = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/, xo = S.isWordChar = function(e) {
            return /\w/.test(e) || e > "\x80" && (e.toUpperCase() != e.toLowerCase() || wo.test(e));
        };
        function Co(e, t) {
            return t ? !!(t.source.indexOf("\\w") > -1 && xo(e)) || t.test(e) : xo(e);
        }
        function So(e) {
            for (var t in e) if (e.hasOwnProperty(t) && e[t]) return !1;
            return !0;
        }
        var ko, Lo = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;
        function Mo(e) {
            return e.charCodeAt(0) >= 768 && Lo.test(e);
        }
        function To(e, t, n, r) {
            var i = document.createElement(e);
            if (n && (i.className = n), r && (i.style.cssText = r), "string" == typeof t) i.appendChild(document.createTextNode(t)); else if (t) for (var o = 0; o < t.length; ++o) i.appendChild(t[o]);
            return i;
        }
        function No(e) {
            for (var t = e.childNodes.length; t > 0; --t) e.removeChild(e.firstChild);
            return e;
        }
        function Oo(e, t) {
            return No(e).appendChild(t);
        }
        ko = document.createRange ? function(e, t, n, r) {
            var i = document.createRange();
            return i.setEnd(r || e, n), i.setStart(e, t), i;
        } : function(e, t, n) {
            var r = document.body.createTextRange();
            try {
                r.moveToElementText(e.parentNode);
            } catch (e) {
                return r;
            }
            return r.collapse(!0), r.moveEnd("character", n), r.moveStart("character", t), r;
        };
        var Ao = S.contains = function(e, t) {
            if (3 == t.nodeType && (t = t.parentNode), e.contains) return e.contains(t);
            do {
                if (11 == t.nodeType && (t = t.host), t == e) return !0;
            } while (t = t.parentNode);
        };
        function Wo() {
            for (var e = document.activeElement; e && e.root && e.root.activeElement; ) e = e.root.activeElement;
            return e;
        }
        function Fo(e) {
            return new RegExp("(^|\\s)" + e + "(?:$|\\s)\\s*");
        }
        o && l < 11 && (Wo = function() {
            try {
                return document.activeElement;
            } catch (e) {
                return document.body;
            }
        });
        var Ho = S.rmClass = function(e, t) {
            var n = e.className, r = Fo(t).exec(n);
            if (r) {
                var i = n.slice(r.index + r[0].length);
                e.className = n.slice(0, r.index) + (i ? r[1] + i : "");
            }
        }, Do = S.addClass = function(e, t) {
            var n = e.className;
            Fo(t).test(n) || (e.className += (n ? " " : "") + t);
        };
        function Po(e, t) {
            for (var n = e.split(" "), r = 0; r < n.length; r++) n[r] && !Fo(n[r]).test(t) && (t += " " + n[r]);
            return t;
        }
        function Io(e) {
            if (document.body.getElementsByClassName) for (var t = document.body.getElementsByClassName("CodeMirror"), n = 0; n < t.length; n++) {
                var r = t[n].CodeMirror;
                r && e(r);
            }
        }
        var Eo = !1;
        var zo, Ro, Bo = function() {
            if (o && l < 9) return !1;
            var e = To("div");
            return "draggable" in e || "dragDrop" in e;
        }();
        function Uo(e) {
            if (null == zo) {
                var t = To("span", "\u200b");
                Oo(e, To("span", [ t, document.createTextNode("x") ])), 0 != e.firstChild.offsetHeight && (zo = t.offsetWidth <= 1 && t.offsetHeight > 2 && !(o && l < 8));
            }
            var n = zo ? To("span", "\u200b") : To("span", "\xa0", null, "display: inline-block; width: 1px; margin-right: -1px");
            return n.setAttribute("cm-text", ""), n;
        }
        function Go(e) {
            if (null != Ro) return Ro;
            var t = Oo(e, document.createTextNode("A\u062eA")), n = ko(t, 0, 1).getBoundingClientRect();
            if (!n || n.left == n.right) return !1;
            var r = ko(t, 1, 2).getBoundingClientRect();
            return Ro = r.right - n.right < 3;
        }
        var Ko, Vo = S.splitLines = 3 != "\n\nb".split(/\n/).length ? function(e) {
            for (var t = 0, n = [], r = e.length; t <= r; ) {
                var i = e.indexOf("\n", t);
                -1 == i && (i = e.length);
                var o = e.slice(t, "\r" == e.charAt(i - 1) ? i - 1 : i), l = o.indexOf("\r");
                -1 != l ? (n.push(o.slice(0, l)), t += l + 1) : (n.push(o), t = i + 1);
            }
            return n;
        } : function(e) {
            return e.split(/\r\n?|\n/);
        }, jo = window.getSelection ? function(e) {
            try {
                return e.selectionStart != e.selectionEnd;
            } catch (e) {
                return !1;
            }
        } : function(e) {
            try {
                var t = e.ownerDocument.selection.createRange();
            } catch (e) {}
            return !(!t || t.parentElement() != e) && 0 != t.compareEndPoints("StartToEnd", t);
        }, _o = "oncopy" in (Ko = To("div")) || (Ko.setAttribute("oncopy", "return;"), "function" == typeof Ko.oncopy), qo = null;
        var Xo, Yo = S.keyNames = {
            3: "Enter",
            8: "Backspace",
            9: "Tab",
            13: "Enter",
            16: "Shift",
            17: "Ctrl",
            18: "Alt",
            19: "Pause",
            20: "CapsLock",
            27: "Esc",
            32: "Space",
            33: "PageUp",
            34: "PageDown",
            35: "End",
            36: "Home",
            37: "Left",
            38: "Up",
            39: "Right",
            40: "Down",
            44: "PrintScrn",
            45: "Insert",
            46: "Delete",
            59: ";",
            61: "=",
            91: "Mod",
            92: "Mod",
            93: "Mod",
            106: "*",
            107: "=",
            109: "-",
            110: ".",
            111: "/",
            127: "Delete",
            173: "-",
            186: ";",
            187: "=",
            188: ",",
            189: "-",
            190: ".",
            191: "/",
            192: "`",
            219: "[",
            220: "\\",
            221: "]",
            222: "'",
            63232: "Up",
            63233: "Down",
            63234: "Left",
            63235: "Right",
            63272: "Delete",
            63273: "Home",
            63275: "End",
            63276: "PageUp",
            63277: "PageDown",
            63302: "Insert"
        };
        function $o(e) {
            return e.level % 2 ? e.to : e.from;
        }
        function Zo(e) {
            return e.level % 2 ? e.from : e.to;
        }
        function Qo(e) {
            var t = Li(e);
            return t ? $o(t[0]) : 0;
        }
        function Jo(e) {
            var t = Li(e);
            return t ? Zo(fo(t)) : e.text.length;
        }
        function el(e, t) {
            var n = yi(e.doc, t), r = Ir(n);
            r != n && (t = Ci(r));
            var i = Li(r), o = i ? i[0].level % 2 ? Jo(r) : Qo(r) : 0;
            return fe(t, o);
        }
        function tl(e, t) {
            var n = el(e, t.line), r = yi(e.doc, n.line), i = Li(r);
            if (!i || 0 == i[0].level) {
                var o = Math.max(0, r.text.search(/\S/)), l = t.line == n.line && t.ch <= o && t.ch;
                return fe(n.line, l ? 0 : o);
            }
            return n;
        }
        function nl(e, t) {
            Xo = null;
            for (var n, r = 0; r < e.length; ++r) {
                var i = e[r];
                if (i.from < t && i.to > t) return r;
                if (i.from == t || i.to == t) {
                    if (null != n) return o = e, l = i.level, s = e[n].level, void 0, a = o[0].level, 
                    l == a || s != a && l < s ? (i.from != i.to && (Xo = n), r) : (i.from != i.to && (Xo = r), 
                    n);
                    n = r;
                }
            }
            var o, l, s, a;
            return n;
        }
        function rl(e, t, n, r) {
            if (!r) return t + n;
            do {
                t += n;
            } while (t > 0 && Mo(e.text.charAt(t)));
            return t;
        }
        function il(e, t, n, r) {
            var i = Li(e);
            if (!i) return ol(e, t, n, r);
            for (var o = nl(i, t), l = i[o], s = rl(e, t, l.level % 2 ? -n : n, r); ;) {
                if (s > l.from && s < l.to) return s;
                if (s == l.from || s == l.to) return nl(i, s) == o ? s : n > 0 == (l = i[o += n]).level % 2 ? l.to : l.from;
                if (!(l = i[o += n])) return null;
                s = n > 0 == l.level % 2 ? rl(e, l.to, -1, r) : rl(e, l.from, 1, r);
            }
        }
        function ol(e, t, n, r) {
            var i = t + n;
            if (r) for (;i > 0 && Mo(e.text.charAt(i)); ) i += n;
            return i < 0 || i > e.text.length ? null : i;
        }
        !function() {
            for (var e = 0; e < 10; e++) Yo[e + 48] = Yo[e + 96] = String(e);
            for (e = 65; e <= 90; e++) Yo[e] = String.fromCharCode(e);
            for (e = 1; e <= 12; e++) Yo[e + 111] = Yo[e + 63235] = "F" + e;
        }();
        var ll = function() {
            var e = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN", t = "rrrrrrrrrrrr,rNNmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmrrrrrrrnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmNmmmm";
            var n = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/, r = /[stwN]/, i = /[LRr]/, o = /[Lb1n]/, l = /[1n]/;
            function s(e, t, n) {
                this.level = e, this.from = t, this.to = n;
            }
            return function(a) {
                if (!n.test(a)) return !1;
                for (var c, u = a.length, f = [], h = 0; h < u; ++h) f.push(y = (c = a.charCodeAt(h)) <= 247 ? e.charAt(c) : 1424 <= c && c <= 1524 ? "R" : 1536 <= c && c <= 1773 ? t.charAt(c - 1536) : 1774 <= c && c <= 2220 ? "r" : 8192 <= c && c <= 8203 ? "w" : 8204 == c ? "b" : "L");
                h = 0;
                for (var d = "L"; h < u; ++h) {
                    "m" == (y = f[h]) ? f[h] = d : d = y;
                }
                h = 0;
                for (var p = "L"; h < u; ++h) {
                    "1" == (y = f[h]) && "r" == p ? f[h] = "n" : i.test(y) && (p = y, "r" == y && (f[h] = "R"));
                }
                for (h = 1, d = f[0]; h < u - 1; ++h) {
                    "+" == (y = f[h]) && "1" == d && "1" == f[h + 1] ? f[h] = "1" : "," != y || d != f[h + 1] || "1" != d && "n" != d || (f[h] = d), 
                    d = y;
                }
                for (h = 0; h < u; ++h) {
                    if ("," == (y = f[h])) f[h] = "N"; else if ("%" == y) {
                        for (var g = h + 1; g < u && "%" == f[g]; ++g) ;
                        for (var m = h && "!" == f[h - 1] || g < u && "1" == f[g] ? "1" : "N", v = h; v < g; ++v) f[v] = m;
                        h = g - 1;
                    }
                }
                for (h = 0, p = "L"; h < u; ++h) {
                    var y = f[h];
                    "L" == p && "1" == y ? f[h] = "L" : i.test(y) && (p = y);
                }
                for (h = 0; h < u; ++h) if (r.test(f[h])) {
                    for (g = h + 1; g < u && r.test(f[g]); ++g) ;
                    var b = "L" == (h ? f[h - 1] : "L"), w = "L" == (g < u ? f[g] : "L");
                    for (m = b || w ? "L" : "R", v = h; v < g; ++v) f[v] = m;
                    h = g - 1;
                }
                var x, C = [];
                for (h = 0; h < u; ) if (o.test(f[h])) {
                    var S = h;
                    for (++h; h < u && o.test(f[h]); ++h) ;
                    C.push(new s(0, S, h));
                } else {
                    var k = h, L = C.length;
                    for (++h; h < u && "L" != f[h]; ++h) ;
                    for (v = k; v < h; ) if (l.test(f[v])) {
                        k < v && C.splice(L, 0, new s(1, k, v));
                        var M = v;
                        for (++v; v < h && l.test(f[v]); ++v) ;
                        C.splice(L, 0, new s(2, M, v)), k = v;
                    } else ++v;
                    k < h && C.splice(L, 0, new s(1, k, h));
                }
                return 1 == C[0].level && (x = a.match(/^\s+/)) && (C[0].from = x[0].length, C.unshift(new s(0, 0, x[0].length))), 
                1 == fo(C).level && (x = a.match(/\s+$/)) && (fo(C).to -= x[0].length, C.push(new s(0, u - x[0].length, u))), 
                2 == C[0].level && C.unshift(new s(1, C[0].to, C[0].to)), C[0].level != fo(C).level && C.push(new s(C[0].level, u, u)), 
                C;
            };
        }();
        return S.version = "5.13.4", S;
    }), function(e) {
        "use strict";
        var t = e.Pos;
        function n(e, n, i, o) {
            if (this.atOccurrence = !1, this.doc = e, null == o && "string" == typeof n && (o = !1), 
            i = i ? e.clipPos(i) : t(0, 0), this.pos = {
                from: i,
                to: i
            }, "string" != typeof n) n.global || (n = new RegExp(n.source, n.ignoreCase ? "ig" : "g")), 
            this.matches = function(r, i) {
                if (r) {
                    n.lastIndex = 0;
                    for (var o = e.getLine(i.line).slice(0, i.ch), l = 0; ;) {
                        n.lastIndex = l;
                        var s = n.exec(o);
                        if (!s) break;
                        if (c = (a = s).index, (l = a.index + (a[0].length || 1)) == o.length) break;
                    }
                    (u = a && a[0].length || 0) || (0 == c && 0 == o.length ? a = void 0 : c != e.getLine(i.line).length && u++);
                } else {
                    n.lastIndex = i.ch;
                    o = e.getLine(i.line);
                    var a, c, u = (a = n.exec(o)) && a[0].length || 0;
                    (c = a && a.index) + u == o.length || u || (u = 1);
                }
                if (a && u) return {
                    from: t(i.line, c),
                    to: t(i.line, c + u),
                    match: a
                };
            }; else {
                var l = n;
                o && (n = n.toLowerCase());
                var s = o ? function(e) {
                    return e.toLowerCase();
                } : function(e) {
                    return e;
                }, a = n.split("\n");
                if (1 == a.length) n.length ? this.matches = function(i, o) {
                    if (i) {
                        var a = e.getLine(o.line).slice(0, o.ch);
                        if ((u = (c = s(a)).lastIndexOf(n)) > -1) return u = r(a, c, u), {
                            from: t(o.line, u),
                            to: t(o.line, u + l.length)
                        };
                    } else {
                        var c, u;
                        a = e.getLine(o.line).slice(o.ch);
                        if ((u = (c = s(a)).indexOf(n)) > -1) return u = r(a, c, u) + o.ch, {
                            from: t(o.line, u),
                            to: t(o.line, u + l.length)
                        };
                    }
                } : this.matches = function() {}; else {
                    var c = l.split("\n");
                    this.matches = function(n, r) {
                        var i = a.length - 1;
                        if (n) {
                            if (r.line - (a.length - 1) < e.firstLine()) return;
                            if (s(e.getLine(r.line).slice(0, c[i].length)) != a[a.length - 1]) return;
                            for (var o = t(r.line, c[i].length), l = r.line - 1, u = i - 1; u >= 1; --u, --l) if (a[u] != s(e.getLine(l))) return;
                            var f = (h = e.getLine(l)).length - c[0].length;
                            if (s(h.slice(f)) != a[0]) return;
                            return {
                                from: t(l, f),
                                to: o
                            };
                        }
                        if (!(r.line + (a.length - 1) > e.lastLine())) {
                            var h;
                            f = (h = e.getLine(r.line)).length - c[0].length;
                            if (s(h.slice(f)) == a[0]) {
                                var d = t(r.line, f);
                                for (l = r.line + 1, u = 1; u < i; ++u, ++l) if (a[u] != s(e.getLine(l))) return;
                                if (s(e.getLine(l).slice(0, c[i].length)) == a[i]) return {
                                    from: d,
                                    to: t(l, c[i].length)
                                };
                            }
                        }
                    };
                }
            }
        }
        function r(e, t, n) {
            if (e.length == t.length) return n;
            for (var r = Math.min(n, e.length); ;) {
                var i = e.slice(0, r).toLowerCase().length;
                if (i < n) ++r; else {
                    if (!(i > n)) return r;
                    --r;
                }
            }
        }
        n.prototype = {
            findNext: function() {
                return this.find(!1);
            },
            findPrevious: function() {
                return this.find(!0);
            },
            find: function(e) {
                var n = this, r = this.doc.clipPos(e ? this.pos.from : this.pos.to);
                function i(e) {
                    var r = t(e, 0);
                    return n.pos = {
                        from: r,
                        to: r
                    }, n.atOccurrence = !1, !1;
                }
                for (;;) {
                    if (this.pos = this.matches(e, r)) return this.atOccurrence = !0, this.pos.match || !0;
                    if (e) {
                        if (!r.line) return i(0);
                        r = t(r.line - 1, this.doc.getLine(r.line - 1).length);
                    } else {
                        var o = this.doc.lineCount();
                        if (r.line == o - 1) return i(o);
                        r = t(r.line + 1, 0);
                    }
                }
            },
            from: function() {
                if (this.atOccurrence) return this.pos.from;
            },
            to: function() {
                if (this.atOccurrence) return this.pos.to;
            },
            replace: function(n, r) {
                if (this.atOccurrence) {
                    var i = e.splitLines(n);
                    this.doc.replaceRange(i, this.pos.from, this.pos.to, r), this.pos.to = t(this.pos.from.line + i.length - 1, i[i.length - 1].length + (1 == i.length ? this.pos.from.ch : 0));
                }
            }
        }, e.defineExtension("getSearchCursor", function(e, t, r) {
            return new n(this.doc, e, t, r);
        }), e.defineDocExtension("getSearchCursor", function(e, t, r) {
            return new n(this, e, t, r);
        }), e.defineExtension("selectMatches", function(t, n) {
            for (var r = [], i = this.getSearchCursor(t, this.getCursor("from"), n); i.findNext() && !(e.cmpPos(i.to(), this.getCursor("to")) > 0); ) r.push({
                anchor: i.from(),
                head: i.to()
            });
            r.length && this.setSelections(r, 0);
        });
    }(CodeMirror), function(e) {
        "use strict";
        function t(t, n, i, o) {
            if (i && i.call) {
                var l = i;
                i = null;
            } else l = r(t, i, "rangeFinder");
            "number" == typeof n && (n = e.Pos(n, 0));
            var s = r(t, i, "minFoldSize");
            function a(e) {
                var r = l(t, n);
                if (!r || r.to.line - r.from.line < s) return null;
                for (var i = t.findMarksAt(r.from), a = 0; a < i.length; ++a) if (i[a].__isFold && "fold" !== o) {
                    if (!e) return null;
                    r.cleared = !0, i[a].clear();
                }
                return r;
            }
            var c = a(!0);
            if (r(t, i, "scanUp")) for (;!c && n.line > t.firstLine(); ) n = e.Pos(n.line - 1, 0), 
            c = a(!1);
            if (c && !c.cleared && "unfold" !== o) {
                var u = function(e, t) {
                    var n = r(e, t, "widget");
                    if ("string" == typeof n) {
                        var i = document.createTextNode(n);
                        (n = document.createElement("span")).appendChild(i), n.className = "CodeMirror-foldmarker";
                    }
                    return n;
                }(t, i);
                e.on(u, "mousedown", function(t) {
                    f.clear(), e.e_preventDefault(t);
                });
                var f = t.markText(c.from, c.to, {
                    replacedWith: u,
                    clearOnEnter: !0,
                    __isFold: !0
                });
                f.on("clear", function(n, r) {
                    e.signal(t, "unfold", t, n, r);
                }), e.signal(t, "fold", t, c.from, c.to);
            }
        }
        e.newFoldFunction = function(e, n) {
            return function(r, i) {
                t(r, i, {
                    rangeFinder: e,
                    widget: n
                });
            };
        }, e.defineExtension("foldCode", function(e, n, r) {
            t(this, e, n, r);
        }), e.defineExtension("isFolded", function(e) {
            for (var t = this.findMarksAt(e), n = 0; n < t.length; ++n) if (t[n].__isFold) return !0;
        }), e.commands.toggleFold = function(e) {
            e.foldCode(e.getCursor());
        }, e.commands.fold = function(e) {
            e.foldCode(e.getCursor(), null, "fold");
        }, e.commands.unfold = function(e) {
            e.foldCode(e.getCursor(), null, "unfold");
        }, e.commands.foldAll = function(t) {
            t.operation(function() {
                for (var n = t.firstLine(), r = t.lastLine(); n <= r; n++) t.foldCode(e.Pos(n, 0), null, "fold");
            });
        }, e.commands.unfoldAll = function(t) {
            t.operation(function() {
                for (var n = t.firstLine(), r = t.lastLine(); n <= r; n++) t.foldCode(e.Pos(n, 0), null, "unfold");
            });
        }, e.registerHelper("fold", "combine", function() {
            var e = Array.prototype.slice.call(arguments, 0);
            return function(t, n) {
                for (var r = 0; r < e.length; ++r) {
                    var i = e[r](t, n);
                    if (i) return i;
                }
            };
        }), e.registerHelper("fold", "auto", function(e, t) {
            for (var n = e.getHelpers(t, "fold"), r = 0; r < n.length; r++) {
                var i = n[r](e, t);
                if (i) return i;
            }
        });
        var n = {
            rangeFinder: e.fold.auto,
            widget: "\u2194",
            minFoldSize: 0,
            scanUp: !1
        };
        function r(e, t, r) {
            if (t && void 0 !== t[r]) return t[r];
            var i = e.options.foldOptions;
            return i && void 0 !== i[r] ? i[r] : n[r];
        }
        e.defineOption("foldOptions", null), e.defineExtension("foldOption", function(e, t) {
            return r(this, e, t);
        });
    }(CodeMirror), function(e) {
        "use strict";
        e.defineOption("foldGutter", !1, function(t, n, r) {
            r && r != e.Init && (t.clearGutter(t.state.foldGutter.options.gutter), t.state.foldGutter = null, 
            t.off("gutterClick", l), t.off("change", s), t.off("viewportChange", a), t.off("fold", c), 
            t.off("unfold", c), t.off("swapDoc", s)), n && (t.state.foldGutter = new function(e) {
                this.options = e, this.from = this.to = 0;
            }(function(e) {
                !0 === e && (e = {});
                null == e.gutter && (e.gutter = "CodeMirror-foldgutter");
                null == e.indicatorOpen && (e.indicatorOpen = "CodeMirror-foldgutter-open");
                null == e.indicatorFolded && (e.indicatorFolded = "CodeMirror-foldgutter-folded");
                return e;
            }(n)), o(t), t.on("gutterClick", l), t.on("change", s), t.on("viewportChange", a), 
            t.on("fold", c), t.on("unfold", c), t.on("swapDoc", s));
        });
        var t = e.Pos;
        function n(e, n) {
            for (var r = e.findMarksAt(t(n)), i = 0; i < r.length; ++i) if (r[i].__isFold && r[i].find().from.line == n) return r[i];
        }
        function r(e) {
            if ("string" == typeof e) {
                var t = document.createElement("div");
                return t.className = e + " CodeMirror-guttermarker-subtle", t;
            }
            return e.cloneNode(!0);
        }
        function i(e, i, o) {
            var l = e.state.foldGutter.options, s = i, a = e.foldOption(l, "minFoldSize"), c = e.foldOption(l, "rangeFinder");
            e.eachLine(i, o, function(i) {
                var o = null;
                if (n(e, s)) o = r(l.indicatorFolded); else {
                    var u = t(s, 0), f = c && c(e, u);
                    f && f.to.line - f.from.line >= a && (o = r(l.indicatorOpen));
                }
                e.setGutterMarker(i, l.gutter, o), ++s;
            });
        }
        function o(e) {
            var t = e.getViewport(), n = e.state.foldGutter;
            n && (e.operation(function() {
                i(e, t.from, t.to);
            }), n.from = t.from, n.to = t.to);
        }
        function l(e, r, i) {
            var o = e.state.foldGutter;
            if (o) {
                var l = o.options;
                if (i == l.gutter) {
                    var s = n(e, r);
                    s ? s.clear() : e.foldCode(t(r, 0), l.rangeFinder);
                }
            }
        }
        function s(e) {
            var t = e.state.foldGutter;
            if (t) {
                var n = t.options;
                t.from = t.to = 0, clearTimeout(t.changeUpdate), t.changeUpdate = setTimeout(function() {
                    o(e);
                }, n.foldOnChangeTimeSpan || 600);
            }
        }
        function a(e) {
            var t = e.state.foldGutter;
            if (t) {
                var n = t.options;
                clearTimeout(t.changeUpdate), t.changeUpdate = setTimeout(function() {
                    var n = e.getViewport();
                    t.from == t.to || n.from - t.to > 20 || t.from - n.to > 20 ? o(e) : e.operation(function() {
                        n.from < t.from && (i(e, n.from, t.from), t.from = n.from), n.to > t.to && (i(e, t.to, n.to), 
                        t.to = n.to);
                    });
                }, n.updateViewportTimeSpan || 400);
            }
        }
        function c(e, t) {
            var n = e.state.foldGutter;
            if (n) {
                var r = t.line;
                r >= n.from && r < n.to && i(e, r, r + 1);
            }
        }
    }(CodeMirror), function(e) {
        "use strict";
        var t = e.Pos;
        var n = "A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", r = new RegExp("<(/?)([" + n + "][A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD-:.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*)", "g");
        function i(e, t, n, r) {
            this.line = t, this.ch = n, this.cm = e, this.text = e.getLine(t), this.min = r ? r.from : e.firstLine(), 
            this.max = r ? r.to - 1 : e.lastLine();
        }
        function o(e, n) {
            var r = e.cm.getTokenTypeAt(t(e.line, n));
            return r && /\btag\b/.test(r);
        }
        function l(e) {
            if (!(e.line >= e.max)) return e.ch = 0, e.text = e.cm.getLine(++e.line), !0;
        }
        function s(e) {
            if (!(e.line <= e.min)) return e.text = e.cm.getLine(--e.line), e.ch = e.text.length, 
            !0;
        }
        function a(e) {
            for (;;) {
                var t = e.text.indexOf(">", e.ch);
                if (-1 == t) {
                    if (l(e)) continue;
                    return;
                }
                if (o(e, t + 1)) {
                    var n = e.text.lastIndexOf("/", t), r = n > -1 && !/\S/.test(e.text.slice(n + 1, t));
                    return e.ch = t + 1, r ? "selfClose" : "regular";
                }
                e.ch = t + 1;
            }
        }
        function c(e) {
            for (;;) {
                var t = e.ch ? e.text.lastIndexOf("<", e.ch - 1) : -1;
                if (-1 == t) {
                    if (s(e)) continue;
                    return;
                }
                if (o(e, t + 1)) {
                    r.lastIndex = t, e.ch = t;
                    var n = r.exec(e.text);
                    if (n && n.index == t) return n;
                } else e.ch = t;
            }
        }
        function u(e) {
            for (;;) {
                r.lastIndex = e.ch;
                var t = r.exec(e.text);
                if (!t) {
                    if (l(e)) continue;
                    return;
                }
                if (o(e, t.index + 1)) return e.ch = t.index + t[0].length, t;
                e.ch = t.index + 1;
            }
        }
        function f(e) {
            for (;;) {
                var t = e.ch ? e.text.lastIndexOf(">", e.ch - 1) : -1;
                if (-1 == t) {
                    if (s(e)) continue;
                    return;
                }
                if (o(e, t + 1)) {
                    var n = e.text.lastIndexOf("/", t), r = n > -1 && !/\S/.test(e.text.slice(n + 1, t));
                    return e.ch = t + 1, r ? "selfClose" : "regular";
                }
                e.ch = t;
            }
        }
        function h(e, n) {
            for (var r = []; ;) {
                var i, o = u(e), l = e.line, s = e.ch - (o ? o[0].length : 0);
                if (!o || !(i = a(e))) return;
                if ("selfClose" != i) if (o[1]) {
                    for (var c = r.length - 1; c >= 0; --c) if (r[c] == o[2]) {
                        r.length = c;
                        break;
                    }
                    if (c < 0 && (!n || n == o[2])) return {
                        tag: o[2],
                        from: t(l, s),
                        to: t(e.line, e.ch)
                    };
                } else r.push(o[2]);
            }
        }
        function d(e, n) {
            for (var r = []; ;) {
                var i = f(e);
                if (!i) return;
                if ("selfClose" != i) {
                    var o = e.line, l = e.ch, s = c(e);
                    if (!s) return;
                    if (s[1]) r.push(s[2]); else {
                        for (var a = r.length - 1; a >= 0; --a) if (r[a] == s[2]) {
                            r.length = a;
                            break;
                        }
                        if (a < 0 && (!n || n == s[2])) return {
                            tag: s[2],
                            from: t(e.line, e.ch),
                            to: t(o, l)
                        };
                    }
                } else c(e);
            }
        }
        e.registerHelper("fold", "xml", function(e, n) {
            for (var r = new i(e, n.line, 0); ;) {
                var o, l = u(r);
                if (!l || r.line != n.line || !(o = a(r))) return;
                if (!l[1] && "selfClose" != o) {
                    n = t(r.line, r.ch);
                    var s = h(r, l[2]);
                    return s && {
                        from: n,
                        to: s.from
                    };
                }
            }
        }), e.findMatchingTag = function(e, n, r) {
            var o = new i(e, n.line, n.ch, r);
            if (-1 != o.text.indexOf(">") || -1 != o.text.indexOf("<")) {
                var l = a(o), s = l && t(o.line, o.ch), u = l && c(o);
                if (l && u && (p = n, !(((f = o).line - p.line || f.ch - p.ch) > 0))) {
                    var f, p, g = {
                        from: t(o.line, o.ch),
                        to: s,
                        tag: u[2]
                    };
                    return "selfClose" == l ? {
                        open: g,
                        close: null,
                        at: "open"
                    } : u[1] ? {
                        open: d(o, u[2]),
                        close: g,
                        at: "close"
                    } : {
                        open: g,
                        close: h(o = new i(e, s.line, s.ch, r), u[2]),
                        at: "open"
                    };
                }
            }
        }, e.findEnclosingTag = function(e, t, n) {
            for (var r = new i(e, t.line, t.ch, n); ;) {
                var o = d(r);
                if (!o) break;
                var l = h(new i(e, t.line, t.ch, n), o.tag);
                if (l) return {
                    open: o,
                    close: l
                };
            }
        }, e.scanForClosingTag = function(e, t, n, r) {
            return h(new i(e, t.line, t.ch, r ? {
                from: 0,
                to: r
            } : null), n);
        };
    }(CodeMirror), function(e) {
        "use strict";
        function t(e) {
            e.state.tagHit && e.state.tagHit.clear(), e.state.tagOther && e.state.tagOther.clear(), 
            e.state.tagHit = e.state.tagOther = null;
        }
        function n(n) {
            n.state.failedTagMatch = !1, n.operation(function() {
                if (t(n), !n.somethingSelected()) {
                    var r = n.getCursor(), i = n.getViewport();
                    i.from = Math.min(i.from, r.line), i.to = Math.max(r.line + 1, i.to);
                    var o = e.findMatchingTag(n, r, i);
                    if (o) {
                        if (n.state.matchBothTags) {
                            var l = "open" == o.at ? o.open : o.close;
                            l && (n.state.tagHit = n.markText(l.from, l.to, {
                                className: "CodeMirror-matchingtag"
                            }));
                        }
                        var s = "close" == o.at ? o.open : o.close;
                        s ? n.state.tagOther = n.markText(s.from, s.to, {
                            className: "CodeMirror-matchingtag"
                        }) : n.state.failedTagMatch = !0;
                    }
                }
            });
        }
        function r(e) {
            e.state.failedTagMatch && n(e);
        }
        e.defineOption("matchTags", !1, function(i, o, l) {
            l && l != e.Init && (i.off("cursorActivity", n), i.off("viewportChange", r), t(i)), 
            o && (i.state.matchBothTags = "object" == typeof o && o.bothTags, i.on("cursorActivity", n), 
            i.on("viewportChange", r), n(i));
        }), e.commands.toMatchingTag = function(t) {
            var n = e.findMatchingTag(t, t.getCursor());
            if (n) {
                var r = "close" == n.at ? n.open : n.close;
                r && t.extendSelection(r.to, r.from);
            }
        };
    }(CodeMirror), function(e) {
        "use strict";
        var t = "CodeMirror-hint", n = "CodeMirror-hint-active";
        function r(e, t) {
            this.cm = e, this.options = t, this.widget = null, this.debounce = 0, this.tick = 0, 
            this.startPos = this.cm.getCursor("start"), this.startLen = this.cm.getLine(this.startPos.line).length - this.cm.getSelection().length;
            var n = this;
            e.on("cursorActivity", this.activityFunc = function() {
                n.cursorActivity();
            });
        }
        e.showHint = function(e, t, n) {
            if (!t) return e.showHint(n);
            n && n.async && (t.async = !0);
            var r = {
                hint: t
            };
            if (n) for (var i in n) r[i] = n[i];
            return e.showHint(r);
        }, e.defineExtension("showHint", function(t) {
            t = function(e, t, n) {
                var r = e.options.hintOptions, i = {};
                for (var o in u) i[o] = u[o];
                if (r) for (var o in r) void 0 !== r[o] && (i[o] = r[o]);
                if (n) for (var o in n) void 0 !== n[o] && (i[o] = n[o]);
                i.hint.resolve && (i.hint = i.hint.resolve(e, t));
                return i;
            }(this, this.getCursor("start"), t);
            var n = this.listSelections();
            if (!(n.length > 1)) {
                if (this.somethingSelected()) {
                    if (!t.hint.supportsSelection) return;
                    for (var i = 0; i < n.length; i++) if (n[i].head.line != n[i].anchor.line) return;
                }
                this.state.completionActive && this.state.completionActive.close();
                var o = this.state.completionActive = new r(this, t);
                o.options.hint && (e.signal(this, "startCompletion", this), o.update(!0));
            }
        });
        var i = window.requestAnimationFrame || function(e) {
            return setTimeout(e, 1e3 / 60);
        }, o = window.cancelAnimationFrame || clearTimeout;
        function l(e) {
            return "string" == typeof e ? e : e.text;
        }
        function s(e, t) {
            for (;t && t != e; ) {
                if ("LI" === t.nodeName.toUpperCase() && t.parentNode == e) return t;
                t = t.parentNode;
            }
        }
        function a(r, i) {
            this.completion = r, this.data = i, this.picked = !1;
            var o = this, a = r.cm, c = this.hints = document.createElement("ul");
            c.className = "CodeMirror-hints", this.selectedHint = i.selectedHint || 0;
            for (var u = i.list, f = 0; f < u.length; ++f) {
                var h = c.appendChild(document.createElement("li")), d = u[f], p = t + (f != this.selectedHint ? "" : " " + n);
                null != d.className && (p = d.className + " " + p), h.className = p, d.render ? d.render(h, i, d) : h.appendChild(document.createTextNode(d.displayText || l(d))), 
                h.hintId = f;
            }
            var g = a.cursorCoords(r.options.alignWithWord ? i.from : null), m = g.left, v = g.bottom, y = !0;
            c.style.left = m + "px", c.style.top = v + "px";
            var b = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth), w = window.innerHeight || Math.max(document.body.offsetHeight, document.documentElement.offsetHeight);
            (r.options.container || document.body).appendChild(c);
            var x = c.getBoundingClientRect();
            if (x.bottom - w > 0) {
                var C = x.bottom - x.top;
                if (g.top - (g.bottom - x.top) - C > 0) c.style.top = (v = g.top - C) + "px", y = !1; else if (C > w) {
                    c.style.height = w - 5 + "px", c.style.top = (v = g.bottom - x.top) + "px";
                    var S = a.getCursor();
                    i.from.ch != S.ch && (g = a.cursorCoords(S), c.style.left = (m = g.left) + "px", 
                    x = c.getBoundingClientRect());
                }
            }
            var k, L = x.right - b;
            (L > 0 && (x.right - x.left > b && (c.style.width = b - 5 + "px", L -= x.right - x.left - b), 
            c.style.left = (m = g.left - L) + "px"), a.addKeyMap(this.keyMap = function(e, t) {
                var n = {
                    Up: function() {
                        t.moveFocus(-1);
                    },
                    Down: function() {
                        t.moveFocus(1);
                    },
                    PageUp: function() {
                        t.moveFocus(1 - t.menuSize(), !0);
                    },
                    PageDown: function() {
                        t.moveFocus(t.menuSize() - 1, !0);
                    },
                    Home: function() {
                        t.setFocus(0);
                    },
                    End: function() {
                        t.setFocus(t.length - 1);
                    },
                    Enter: t.pick,
                    Tab: t.pick,
                    Esc: t.close
                }, r = e.options.customKeys, i = r ? {} : n;
                function o(e, r) {
                    var o;
                    o = "string" != typeof r ? function(e) {
                        return r(e, t);
                    } : n.hasOwnProperty(r) ? n[r] : r, i[e] = o;
                }
                if (r) for (var l in r) r.hasOwnProperty(l) && o(l, r[l]);
                var s = e.options.extraKeys;
                if (s) for (var l in s) s.hasOwnProperty(l) && o(l, s[l]);
                return i;
            }(r, {
                moveFocus: function(e, t) {
                    o.changeActive(o.selectedHint + e, t);
                },
                setFocus: function(e) {
                    o.changeActive(e);
                },
                menuSize: function() {
                    return o.screenAmount();
                },
                length: u.length,
                close: function() {
                    r.close();
                },
                pick: function() {
                    o.pick();
                },
                data: i
            })), r.options.closeOnUnfocus) && (a.on("blur", this.onBlur = function() {
                k = setTimeout(function() {
                    r.close();
                }, 100);
            }), a.on("focus", this.onFocus = function() {
                clearTimeout(k);
            }));
            var M = a.getScrollInfo();
            return a.on("scroll", this.onScroll = function() {
                var e = a.getScrollInfo(), t = a.getWrapperElement().getBoundingClientRect(), n = v + M.top - e.top, i = n - (window.pageYOffset || (document.documentElement || document.body).scrollTop);
                if (y || (i += c.offsetHeight), i <= t.top || i >= t.bottom) return r.close();
                c.style.top = n + "px", c.style.left = m + M.left - e.left + "px";
            }), e.on(c, "dblclick", function(e) {
                var t = s(c, e.target || e.srcElement);
                t && null != t.hintId && (o.changeActive(t.hintId), o.pick());
            }), e.on(c, "click", function(e) {
                var t = s(c, e.target || e.srcElement);
                t && null != t.hintId && (o.changeActive(t.hintId), r.options.completeOnSingleClick && o.pick());
            }), e.on(c, "mousedown", function() {
                setTimeout(function() {
                    a.focus();
                }, 20);
            }), e.signal(i, "select", u[0], c.firstChild), !0;
        }
        function c(e, t) {
            if (!e.somethingSelected()) return t;
            for (var n = [], r = 0; r < t.length; r++) t[r].supportsSelection && n.push(t[r]);
            return n;
        }
        r.prototype = {
            close: function() {
                this.active() && (this.cm.state.completionActive = null, this.tick = null, this.cm.off("cursorActivity", this.activityFunc), 
                this.widget && this.data && e.signal(this.data, "close"), this.widget && this.widget.close(), 
                e.signal(this.cm, "endCompletion", this.cm));
            },
            active: function() {
                return this.cm.state.completionActive == this;
            },
            pick: function(t, n) {
                var r = t.list[n];
                r.hint ? r.hint(this.cm, t, r) : this.cm.replaceRange(l(r), r.from || t.from, r.to || t.to, "complete"), 
                e.signal(t, "pick", r), this.close();
            },
            cursorActivity: function() {
                this.debounce && (o(this.debounce), this.debounce = 0);
                var e = this.cm.getCursor(), t = this.cm.getLine(e.line);
                if (e.line != this.startPos.line || t.length - e.ch != this.startLen - this.startPos.ch || e.ch < this.startPos.ch || this.cm.somethingSelected() || e.ch && this.options.closeCharacters.test(t.charAt(e.ch - 1))) this.close(); else {
                    var n = this;
                    this.debounce = i(function() {
                        n.update();
                    }), this.widget && this.widget.disable();
                }
            },
            update: function(e) {
                if (null != this.tick) if (this.options.hint.async) {
                    var t = ++this.tick, n = this;
                    this.options.hint(this.cm, function(r) {
                        n.tick == t && n.finishUpdate(r, e);
                    }, this.options);
                } else this.finishUpdate(this.options.hint(this.cm, this.options), e);
            },
            finishUpdate: function(t, n) {
                this.data && e.signal(this.data, "update");
                var r, i, o = this.widget && this.widget.picked || n && this.options.completeSingle;
                (this.widget && this.widget.close(), t && this.data && (r = this.data, i = t, e.cmpPos(i.from, r.from) > 0 && r.to.ch - r.from.ch != i.to.ch - i.from.ch)) || (this.data = t, 
                t && t.list.length && (o && 1 == t.list.length ? this.pick(t, 0) : (this.widget = new a(this, t), 
                e.signal(t, "shown"))));
            }
        }, a.prototype = {
            close: function() {
                if (this.completion.widget == this) {
                    this.completion.widget = null, this.hints.parentNode.removeChild(this.hints), this.completion.cm.removeKeyMap(this.keyMap);
                    var e = this.completion.cm;
                    this.completion.options.closeOnUnfocus && (e.off("blur", this.onBlur), e.off("focus", this.onFocus)), 
                    e.off("scroll", this.onScroll);
                }
            },
            disable: function() {
                this.completion.cm.removeKeyMap(this.keyMap);
                var e = this;
                this.keyMap = {
                    Enter: function() {
                        e.picked = !0;
                    }
                }, this.completion.cm.addKeyMap(this.keyMap);
            },
            pick: function() {
                this.completion.pick(this.data, this.selectedHint);
            },
            changeActive: function(t, r) {
                if (t >= this.data.list.length ? t = r ? this.data.list.length - 1 : 0 : t < 0 && (t = r ? 0 : this.data.list.length - 1), 
                this.selectedHint != t) {
                    var i = this.hints.childNodes[this.selectedHint];
                    i.className = i.className.replace(" " + n, ""), (i = this.hints.childNodes[this.selectedHint = t]).className += " " + n, 
                    i.offsetTop < this.hints.scrollTop ? this.hints.scrollTop = i.offsetTop - 3 : i.offsetTop + i.offsetHeight > this.hints.scrollTop + this.hints.clientHeight && (this.hints.scrollTop = i.offsetTop + i.offsetHeight - this.hints.clientHeight + 3), 
                    e.signal(this.data, "select", this.data.list[this.selectedHint], i);
                }
            },
            screenAmount: function() {
                return Math.floor(this.hints.clientHeight / this.hints.firstChild.offsetHeight) || 1;
            }
        }, e.registerHelper("hint", "auto", {
            resolve: function(t, n) {
                var r, i = t.getHelpers(n, "hint");
                if (i.length) {
                    for (var o, l = !1, s = 0; s < i.length; s++) i[s].async && (l = !0);
                    return l ? (o = function(e, t, n) {
                        var r = c(e, i);
                        !function i(o, l) {
                            if (o == r.length) return t(null);
                            var s = r[o];
                            s.async ? s(e, function(e) {
                                e ? t(e) : i(o + 1);
                            }, n) : (l = s(e, n)) ? t(l) : i(o + 1);
                        }(0);
                    }).async = !0 : o = function(e, t) {
                        for (var n = c(e, i), r = 0; r < n.length; r++) {
                            var o = n[r](e, t);
                            if (o && o.list.length) return o;
                        }
                    }, o.supportsSelection = !0, o;
                }
                return (r = t.getHelper(t.getCursor(), "hintWords")) ? function(t) {
                    return e.hint.fromList(t, {
                        words: r
                    });
                } : e.hint.anyword ? function(t, n) {
                    return e.hint.anyword(t, n);
                } : function() {};
            }
        }), e.registerHelper("hint", "fromList", function(t, n) {
            var r = t.getCursor(), i = t.getTokenAt(r), o = e.Pos(r.line, i.end);
            if (i.string && /\w/.test(i.string[i.string.length - 1])) var l = i.string, s = e.Pos(r.line, i.start); else l = "", 
            s = o;
            for (var a = [], c = 0; c < n.words.length; c++) {
                var u = n.words[c];
                u.slice(0, l.length) == l && a.push(u);
            }
            if (a.length) return {
                list: a,
                from: s,
                to: o
            };
        }), e.commands.autocomplete = e.showHint;
        var u = {
            hint: e.hint.auto,
            completeSingle: !0,
            alignWithWord: !0,
            closeCharacters: /[\s()\[\]{};:>,]/,
            closeOnUnfocus: !0,
            completeOnSingleClick: !0,
            container: null,
            customKeys: null,
            extraKeys: null
        };
        e.defineOption("hintOptions", null);
    }(CodeMirror), function(e) {
        "use strict";
        var t = e.Pos;
        e.registerHelper("hint", "xml", function(n, r) {
            var i = r && r.schemaInfo, o = r && r.quoteChar || '"';
            if (i) {
                var l = n.getCursor(), s = n.getTokenAt(l);
                s.end > l.ch && (s.end = l.ch, s.string = s.string.slice(0, l.ch - s.start));
                var a = e.innerMode(n.getMode(), s.state);
                if ("xml" == a.mode.name) {
                    var c, u, f = [], h = !1, d = /\btag\b/.test(s.type) && !/>$/.test(s.string), p = d && /^\w/.test(s.string);
                    if (p) {
                        var g = n.getLine(l.line).slice(Math.max(0, s.start - 2), s.start), m = /<\/$/.test(g) ? "close" : /<$/.test(g) ? "open" : null;
                        m && (u = s.start - ("close" == m ? 2 : 1));
                    } else d && "<" == s.string ? m = "open" : d && "</" == s.string && (m = "close");
                    if (!d && !a.state.tagName || m) {
                        p && (c = s.string), h = m;
                        var v = a.state.context, y = v && i[v.tagName], b = v ? y && y.children : i["!top"];
                        if (b && "close" != m) for (var w = 0; w < b.length; ++w) c && 0 != b[w].lastIndexOf(c, 0) || f.push("<" + b[w]); else if ("close" != m) for (var x in i) !i.hasOwnProperty(x) || "!top" == x || "!attrs" == x || c && 0 != x.lastIndexOf(c, 0) || f.push("<" + x);
                        v && (!c || "close" == m && 0 == v.tagName.lastIndexOf(c, 0)) && f.push("</" + v.tagName + ">");
                    } else {
                        var C = (y = i[a.state.tagName]) && y.attrs, S = i["!attrs"];
                        if (!C && !S) return;
                        if (C) {
                            if (S) {
                                var k = {};
                                for (var L in S) S.hasOwnProperty(L) && (k[L] = S[L]);
                                for (var L in C) C.hasOwnProperty(L) && (k[L] = C[L]);
                                C = k;
                            }
                        } else C = S;
                        if ("string" == s.type || "=" == s.string) {
                            var M, T = (g = n.getRange(t(l.line, Math.max(0, l.ch - 60)), t(l.line, "string" == s.type ? s.start : s.end))).match(/([^\s\u00a0=<>\"\']+)=$/);
                            if (!T || !C.hasOwnProperty(T[1]) || !(M = C[T[1]])) return;
                            if ("function" == typeof M && (M = M.call(this, n)), "string" == s.type) {
                                c = s.string;
                                var N = 0;
                                /['"]/.test(s.string.charAt(0)) && (o = s.string.charAt(0), c = s.string.slice(1), 
                                N++);
                                var O = s.string.length;
                                /['"]/.test(s.string.charAt(O - 1)) && (o = s.string.charAt(O - 1), c = s.string.substr(N, O - 2)), 
                                h = !0;
                            }
                            for (w = 0; w < M.length; ++w) c && 0 != M[w].lastIndexOf(c, 0) || f.push(o + M[w] + o);
                        } else for (var A in "attribute" == s.type && (c = s.string, h = !0), C) !C.hasOwnProperty(A) || c && 0 != A.lastIndexOf(c, 0) || f.push(A);
                    }
                    return {
                        list: f,
                        from: h ? t(l.line, null == u ? s.start : u) : l,
                        to: h ? t(l.line, s.end) : l
                    };
                }
            }
        });
    }(CodeMirror), function(e) {
        "use strict";
        var t = "ab aa af ak sq am ar an hy as av ae ay az bm ba eu be bn bh bi bs br bg my ca ch ce ny zh cv kw co cr hr cs da dv nl dz en eo et ee fo fj fi fr ff gl ka de el gn gu ht ha he hz hi ho hu ia id ie ga ig ik io is it iu ja jv kl kn kr ks kk km ki rw ky kv kg ko ku kj la lb lg li ln lo lt lu lv gv mk mg ms ml mt mi mr mh mn na nv nb nd ne ng nn no ii nr oc oj cu om or os pa pi fa pl ps pt qu rm rn ro ru sa sc sd se sm sg sr gd sn si sk sl so st es su sw ss sv ta te tg th ti bo tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa cy wo fy xh yi yo za zu".split(" "), n = [ "_blank", "_self", "_top", "_parent" ], r = [ "ascii", "utf-8", "utf-16", "latin1", "latin1" ], i = [ "get", "post", "put", "delete" ], o = [ "application/x-www-form-urlencoded", "multipart/form-data", "text/plain" ], l = [ "all", "screen", "print", "embossed", "braille", "handheld", "print", "projection", "screen", "tty", "tv", "speech", "3d-glasses", "resolution [>][<][=] [X]", "device-aspect-ratio: X/Y", "orientation:portrait", "orientation:landscape", "device-height: [X]", "device-width: [X]" ], s = {
            attrs: {}
        }, a = {
            a: {
                attrs: {
                    href: null,
                    ping: null,
                    type: null,
                    media: l,
                    target: n,
                    hreflang: t
                }
            },
            abbr: s,
            acronym: s,
            address: s,
            applet: s,
            area: {
                attrs: {
                    alt: null,
                    coords: null,
                    href: null,
                    target: null,
                    ping: null,
                    media: l,
                    hreflang: t,
                    type: null,
                    shape: [ "default", "rect", "circle", "poly" ]
                }
            },
            article: s,
            aside: s,
            audio: {
                attrs: {
                    src: null,
                    mediagroup: null,
                    crossorigin: [ "anonymous", "use-credentials" ],
                    preload: [ "none", "metadata", "auto" ],
                    autoplay: [ "", "autoplay" ],
                    loop: [ "", "loop" ],
                    controls: [ "", "controls" ]
                }
            },
            b: s,
            base: {
                attrs: {
                    href: null,
                    target: n
                }
            },
            basefont: s,
            bdi: s,
            bdo: s,
            big: s,
            blockquote: {
                attrs: {
                    cite: null
                }
            },
            body: s,
            br: s,
            button: {
                attrs: {
                    form: null,
                    formaction: null,
                    name: null,
                    value: null,
                    autofocus: [ "", "autofocus" ],
                    disabled: [ "", "autofocus" ],
                    formenctype: o,
                    formmethod: i,
                    formnovalidate: [ "", "novalidate" ],
                    formtarget: n,
                    type: [ "submit", "reset", "button" ]
                }
            },
            canvas: {
                attrs: {
                    width: null,
                    height: null
                }
            },
            caption: s,
            center: s,
            cite: s,
            code: s,
            col: {
                attrs: {
                    span: null
                }
            },
            colgroup: {
                attrs: {
                    span: null
                }
            },
            command: {
                attrs: {
                    type: [ "command", "checkbox", "radio" ],
                    label: null,
                    icon: null,
                    radiogroup: null,
                    command: null,
                    title: null,
                    disabled: [ "", "disabled" ],
                    checked: [ "", "checked" ]
                }
            },
            data: {
                attrs: {
                    value: null
                }
            },
            datagrid: {
                attrs: {
                    disabled: [ "", "disabled" ],
                    multiple: [ "", "multiple" ]
                }
            },
            datalist: {
                attrs: {
                    data: null
                }
            },
            dd: s,
            del: {
                attrs: {
                    cite: null,
                    datetime: null
                }
            },
            details: {
                attrs: {
                    open: [ "", "open" ]
                }
            },
            dfn: s,
            dir: s,
            div: s,
            dl: s,
            dt: s,
            em: s,
            embed: {
                attrs: {
                    src: null,
                    type: null,
                    width: null,
                    height: null
                }
            },
            eventsource: {
                attrs: {
                    src: null
                }
            },
            fieldset: {
                attrs: {
                    disabled: [ "", "disabled" ],
                    form: null,
                    name: null
                }
            },
            figcaption: s,
            figure: s,
            font: s,
            footer: s,
            form: {
                attrs: {
                    action: null,
                    name: null,
                    "accept-charset": r,
                    autocomplete: [ "on", "off" ],
                    enctype: o,
                    method: i,
                    novalidate: [ "", "novalidate" ],
                    target: n
                }
            },
            frame: s,
            frameset: s,
            h1: s,
            h2: s,
            h3: s,
            h4: s,
            h5: s,
            h6: s,
            head: {
                attrs: {},
                children: [ "title", "base", "link", "style", "meta", "script", "noscript", "command" ]
            },
            header: s,
            hgroup: s,
            hr: s,
            html: {
                attrs: {
                    manifest: null
                },
                children: [ "head", "body" ]
            },
            i: s,
            iframe: {
                attrs: {
                    src: null,
                    srcdoc: null,
                    name: null,
                    width: null,
                    height: null,
                    sandbox: [ "allow-top-navigation", "allow-same-origin", "allow-forms", "allow-scripts" ],
                    seamless: [ "", "seamless" ]
                }
            },
            img: {
                attrs: {
                    alt: null,
                    src: null,
                    ismap: null,
                    usemap: null,
                    width: null,
                    height: null,
                    crossorigin: [ "anonymous", "use-credentials" ]
                }
            },
            input: {
                attrs: {
                    alt: null,
                    dirname: null,
                    form: null,
                    formaction: null,
                    height: null,
                    list: null,
                    max: null,
                    maxlength: null,
                    min: null,
                    name: null,
                    pattern: null,
                    placeholder: null,
                    size: null,
                    src: null,
                    step: null,
                    value: null,
                    width: null,
                    accept: [ "audio/*", "video/*", "image/*" ],
                    autocomplete: [ "on", "off" ],
                    autofocus: [ "", "autofocus" ],
                    checked: [ "", "checked" ],
                    disabled: [ "", "disabled" ],
                    formenctype: o,
                    formmethod: i,
                    formnovalidate: [ "", "novalidate" ],
                    formtarget: n,
                    multiple: [ "", "multiple" ],
                    readonly: [ "", "readonly" ],
                    required: [ "", "required" ],
                    type: [ "hidden", "text", "search", "tel", "url", "email", "password", "datetime", "date", "month", "week", "time", "datetime-local", "number", "range", "color", "checkbox", "radio", "file", "submit", "image", "reset", "button" ]
                }
            },
            ins: {
                attrs: {
                    cite: null,
                    datetime: null
                }
            },
            kbd: s,
            keygen: {
                attrs: {
                    challenge: null,
                    form: null,
                    name: null,
                    autofocus: [ "", "autofocus" ],
                    disabled: [ "", "disabled" ],
                    keytype: [ "RSA" ]
                }
            },
            label: {
                attrs: {
                    for: null,
                    form: null
                }
            },
            legend: s,
            li: {
                attrs: {
                    value: null
                }
            },
            link: {
                attrs: {
                    href: null,
                    type: null,
                    hreflang: t,
                    media: l,
                    sizes: [ "all", "16x16", "16x16 32x32", "16x16 32x32 64x64" ]
                }
            },
            map: {
                attrs: {
                    name: null
                }
            },
            mark: s,
            menu: {
                attrs: {
                    label: null,
                    type: [ "list", "context", "toolbar" ]
                }
            },
            meta: {
                attrs: {
                    content: null,
                    charset: r,
                    name: [ "viewport", "application-name", "author", "description", "generator", "keywords" ],
                    "http-equiv": [ "content-language", "content-type", "default-style", "refresh" ]
                }
            },
            meter: {
                attrs: {
                    value: null,
                    min: null,
                    low: null,
                    high: null,
                    max: null,
                    optimum: null
                }
            },
            nav: s,
            noframes: s,
            noscript: s,
            object: {
                attrs: {
                    data: null,
                    type: null,
                    name: null,
                    usemap: null,
                    form: null,
                    width: null,
                    height: null,
                    typemustmatch: [ "", "typemustmatch" ]
                }
            },
            ol: {
                attrs: {
                    reversed: [ "", "reversed" ],
                    start: null,
                    type: [ "1", "a", "A", "i", "I" ]
                }
            },
            optgroup: {
                attrs: {
                    disabled: [ "", "disabled" ],
                    label: null
                }
            },
            option: {
                attrs: {
                    disabled: [ "", "disabled" ],
                    label: null,
                    selected: [ "", "selected" ],
                    value: null
                }
            },
            output: {
                attrs: {
                    for: null,
                    form: null,
                    name: null
                }
            },
            p: s,
            param: {
                attrs: {
                    name: null,
                    value: null
                }
            },
            pre: s,
            progress: {
                attrs: {
                    value: null,
                    max: null
                }
            },
            q: {
                attrs: {
                    cite: null
                }
            },
            rp: s,
            rt: s,
            ruby: s,
            s: s,
            samp: s,
            script: {
                attrs: {
                    type: [ "text/javascript" ],
                    src: null,
                    async: [ "", "async" ],
                    defer: [ "", "defer" ],
                    charset: r
                }
            },
            section: s,
            select: {
                attrs: {
                    form: null,
                    name: null,
                    size: null,
                    autofocus: [ "", "autofocus" ],
                    disabled: [ "", "disabled" ],
                    multiple: [ "", "multiple" ]
                }
            },
            small: s,
            source: {
                attrs: {
                    src: null,
                    type: null,
                    media: null
                }
            },
            span: s,
            strike: s,
            strong: s,
            style: {
                attrs: {
                    type: [ "text/css" ],
                    media: l,
                    scoped: null
                }
            },
            sub: s,
            summary: s,
            sup: s,
            table: s,
            tbody: s,
            td: {
                attrs: {
                    colspan: null,
                    rowspan: null,
                    headers: null
                }
            },
            textarea: {
                attrs: {
                    dirname: null,
                    form: null,
                    maxlength: null,
                    name: null,
                    placeholder: null,
                    rows: null,
                    cols: null,
                    autofocus: [ "", "autofocus" ],
                    disabled: [ "", "disabled" ],
                    readonly: [ "", "readonly" ],
                    required: [ "", "required" ],
                    wrap: [ "soft", "hard" ]
                }
            },
            tfoot: s,
            th: {
                attrs: {
                    colspan: null,
                    rowspan: null,
                    headers: null,
                    scope: [ "row", "col", "rowgroup", "colgroup" ]
                }
            },
            thead: s,
            time: {
                attrs: {
                    datetime: null
                }
            },
            title: s,
            tr: s,
            track: {
                attrs: {
                    src: null,
                    label: null,
                    default: null,
                    kind: [ "subtitles", "captions", "descriptions", "chapters", "metadata" ],
                    srclang: t
                }
            },
            tt: s,
            u: s,
            ul: s,
            var: s,
            video: {
                attrs: {
                    src: null,
                    poster: null,
                    width: null,
                    height: null,
                    crossorigin: [ "anonymous", "use-credentials" ],
                    preload: [ "auto", "metadata", "none" ],
                    autoplay: [ "", "autoplay" ],
                    mediagroup: [ "movie" ],
                    muted: [ "", "muted" ],
                    controls: [ "", "controls" ]
                }
            },
            wbr: s
        }, c = {
            accesskey: [ "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" ],
            class: null,
            contenteditable: [ "true", "false" ],
            contextmenu: null,
            dir: [ "ltr", "rtl", "auto" ],
            draggable: [ "true", "false", "auto" ],
            dropzone: [ "copy", "move", "link", "string:", "file:" ],
            hidden: [ "hidden" ],
            id: null,
            inert: [ "inert" ],
            itemid: null,
            itemprop: null,
            itemref: null,
            itemscope: [ "itemscope" ],
            itemtype: null,
            lang: [ "en", "es" ],
            spellcheck: [ "true", "false" ],
            style: null,
            tabindex: [ "1", "2", "3", "4", "5", "6", "7", "8", "9" ],
            title: null,
            translate: [ "yes", "no" ],
            onclick: null,
            rel: [ "stylesheet", "alternate", "author", "bookmark", "help", "license", "next", "nofollow", "noreferrer", "prefetch", "prev", "search", "tag" ]
        };
        function u(e) {
            for (var t in c) c.hasOwnProperty(t) && (e.attrs[t] = c[t]);
        }
        for (var f in u(s), a) a.hasOwnProperty(f) && a[f] != s && u(a[f]);
        e.htmlSchema = a, e.registerHelper("hint", "html", function(t, n) {
            var r = {
                schemaInfo: a
            };
            if (n) for (var i in n) r[i] = n[i];
            return e.hint.xml(t, r);
        });
    }(CodeMirror), function(e) {
        "use strict";
        var t = {
            autoSelfClosers: {
                area: !0,
                base: !0,
                br: !0,
                col: !0,
                command: !0,
                embed: !0,
                frame: !0,
                hr: !0,
                img: !0,
                input: !0,
                keygen: !0,
                link: !0,
                meta: !0,
                param: !0,
                source: !0,
                track: !0,
                wbr: !0,
                menuitem: !0
            },
            implicitlyClosed: {
                dd: !0,
                li: !0,
                optgroup: !0,
                option: !0,
                p: !0,
                rp: !0,
                rt: !0,
                tbody: !0,
                td: !0,
                tfoot: !0,
                th: !0,
                tr: !0
            },
            contextGrabbers: {
                dd: {
                    dd: !0,
                    dt: !0
                },
                dt: {
                    dd: !0,
                    dt: !0
                },
                li: {
                    li: !0
                },
                option: {
                    option: !0,
                    optgroup: !0
                },
                optgroup: {
                    optgroup: !0
                },
                p: {
                    address: !0,
                    article: !0,
                    aside: !0,
                    blockquote: !0,
                    dir: !0,
                    div: !0,
                    dl: !0,
                    fieldset: !0,
                    footer: !0,
                    form: !0,
                    h1: !0,
                    h2: !0,
                    h3: !0,
                    h4: !0,
                    h5: !0,
                    h6: !0,
                    header: !0,
                    hgroup: !0,
                    hr: !0,
                    menu: !0,
                    nav: !0,
                    ol: !0,
                    p: !0,
                    pre: !0,
                    section: !0,
                    table: !0,
                    ul: !0
                },
                rp: {
                    rp: !0,
                    rt: !0
                },
                rt: {
                    rp: !0,
                    rt: !0
                },
                tbody: {
                    tbody: !0,
                    tfoot: !0
                },
                td: {
                    td: !0,
                    th: !0
                },
                tfoot: {
                    tbody: !0
                },
                th: {
                    td: !0,
                    th: !0
                },
                thead: {
                    tbody: !0,
                    tfoot: !0
                },
                tr: {
                    tr: !0
                }
            },
            doNotIndent: {
                pre: !0
            },
            allowUnquoted: !0,
            allowMissing: !0,
            caseFold: !0
        }, n = {
            autoSelfClosers: {},
            implicitlyClosed: {},
            contextGrabbers: {},
            doNotIndent: {},
            allowUnquoted: !1,
            allowMissing: !1,
            caseFold: !1
        };
        e.defineMode("xml", function(r, i) {
            var o, l, s = r.indentUnit, a = {}, c = i.htmlMode ? t : n;
            for (var u in c) a[u] = c[u];
            for (var u in i) a[u] = i[u];
            function f(e, t) {
                function n(n) {
                    return t.tokenize = n, n(e, t);
                }
                var r = e.next();
                return "<" == r ? e.eat("!") ? e.eat("[") ? e.match("CDATA[") ? n(d("atom", "]]>")) : null : e.match("--") ? n(d("comment", "--\x3e")) : e.match("DOCTYPE", !0, !0) ? (e.eatWhile(/[\w\._\-]/), 
                n(function e(t) {
                    return function(n, r) {
                        for (var i; null != (i = n.next()); ) {
                            if ("<" == i) return r.tokenize = e(t + 1), r.tokenize(n, r);
                            if (">" == i) {
                                if (1 == t) {
                                    r.tokenize = f;
                                    break;
                                }
                                return r.tokenize = e(t - 1), r.tokenize(n, r);
                            }
                        }
                        return "meta";
                    };
                }(1))) : null : e.eat("?") ? (e.eatWhile(/[\w\._\-]/), t.tokenize = d("meta", "?>"), 
                "meta") : (o = e.eat("/") ? "closeTag" : "openTag", t.tokenize = h, "tag bracket") : "&" == r ? (e.eat("#") ? e.eat("x") ? e.eatWhile(/[a-fA-F\d]/) && e.eat(";") : e.eatWhile(/[\d]/) && e.eat(";") : e.eatWhile(/[\w\.\-:]/) && e.eat(";")) ? "atom" : "error" : (e.eatWhile(/[^&<]/), 
                null);
            }
            function h(e, t) {
                var n, r, i = e.next();
                if (">" == i || "/" == i && e.eat(">")) return t.tokenize = f, o = ">" == i ? "endTag" : "selfcloseTag", 
                "tag bracket";
                if ("=" == i) return o = "equals", null;
                if ("<" == i) {
                    t.tokenize = f, t.state = m, t.tagName = t.tagStart = null;
                    var l = t.tokenize(e, t);
                    return l ? l + " tag error" : "tag error";
                }
                return /[\'\"]/.test(i) ? (t.tokenize = (n = i, (r = function(e, t) {
                    for (;!e.eol(); ) if (e.next() == n) {
                        t.tokenize = h;
                        break;
                    }
                    return "string";
                }).isInAttribute = !0, r), t.stringStartCol = e.column(), t.tokenize(e, t)) : (e.match(/^[^\s\u00a0=<>\"\']*[^\s\u00a0=<>\"\'\/]/), 
                "word");
            }
            function d(e, t) {
                return function(n, r) {
                    for (;!n.eol(); ) {
                        if (n.match(t)) {
                            r.tokenize = f;
                            break;
                        }
                        n.next();
                    }
                    return e;
                };
            }
            function p(e) {
                e.context && (e.context = e.context.prev);
            }
            function g(e, t) {
                for (var n; ;) {
                    if (!e.context) return;
                    if (n = e.context.tagName, !a.contextGrabbers.hasOwnProperty(n) || !a.contextGrabbers[n].hasOwnProperty(t)) return;
                    p(e);
                }
            }
            function m(e, t, n) {
                return "openTag" == e ? (n.tagStart = t.column(), v) : "closeTag" == e ? y : m;
            }
            function v(e, t, n) {
                return "word" == e ? (n.tagName = t.current(), l = "tag", x) : (l = "error", v);
            }
            function y(e, t, n) {
                if ("word" == e) {
                    var r = t.current();
                    return n.context && n.context.tagName != r && a.implicitlyClosed.hasOwnProperty(n.context.tagName) && p(n), 
                    n.context && n.context.tagName == r || !1 === a.matchClosing ? (l = "tag", b) : (l = "tag error", 
                    w);
                }
                return l = "error", w;
            }
            function b(e, t, n) {
                return "endTag" != e ? (l = "error", b) : (p(n), m);
            }
            function w(e, t, n) {
                return l = "error", b(e, 0, n);
            }
            function x(e, t, n) {
                if ("word" == e) return l = "attribute", C;
                if ("endTag" == e || "selfcloseTag" == e) {
                    var r = n.tagName, i = n.tagStart;
                    return n.tagName = n.tagStart = null, "selfcloseTag" == e || a.autoSelfClosers.hasOwnProperty(r) ? g(n, r) : (g(n, r), 
                    n.context = new function(e, t, n) {
                        this.prev = e.context, this.tagName = t, this.indent = e.indented, this.startOfLine = n, 
                        (a.doNotIndent.hasOwnProperty(t) || e.context && e.context.noIndent) && (this.noIndent = !0);
                    }(n, r, i == n.indented)), m;
                }
                return l = "error", x;
            }
            function C(e, t, n) {
                return "equals" == e ? S : (a.allowMissing || (l = "error"), x(e, 0, n));
            }
            function S(e, t, n) {
                return "string" == e ? k : "word" == e && a.allowUnquoted ? (l = "string", x) : (l = "error", 
                x(e, 0, n));
            }
            function k(e, t, n) {
                return "string" == e ? k : x(e, 0, n);
            }
            return f.isInText = !0, {
                startState: function(e) {
                    var t = {
                        tokenize: f,
                        state: m,
                        indented: e || 0,
                        tagName: null,
                        tagStart: null,
                        context: null
                    };
                    return null != e && (t.baseIndent = e), t;
                },
                token: function(e, t) {
                    if (!t.tagName && e.sol() && (t.indented = e.indentation()), e.eatSpace()) return null;
                    o = null;
                    var n = t.tokenize(e, t);
                    return (n || o) && "comment" != n && (l = null, t.state = t.state(o || n, e, t), 
                    l && (n = "error" == l ? n + " error" : l)), n;
                },
                indent: function(t, n, r) {
                    var i = t.context;
                    if (t.tokenize.isInAttribute) return t.tagStart == t.indented ? t.stringStartCol + 1 : t.indented + s;
                    if (i && i.noIndent) return e.Pass;
                    if (t.tokenize != h && t.tokenize != f) return r ? r.match(/^(\s*)/)[0].length : 0;
                    if (t.tagName) return !1 !== a.multilineTagIndentPastTag ? t.tagStart + t.tagName.length + 2 : t.tagStart + s * (a.multilineTagIndentFactor || 1);
                    if (a.alignCDATA && /<!\[CDATA\[/.test(n)) return 0;
                    var o = n && /^<(\/)?([\w_:\.-]*)/.exec(n);
                    if (o && o[1]) for (;i; ) {
                        if (i.tagName == o[2]) {
                            i = i.prev;
                            break;
                        }
                        if (!a.implicitlyClosed.hasOwnProperty(i.tagName)) break;
                        i = i.prev;
                    } else if (o) for (;i; ) {
                        var l = a.contextGrabbers[i.tagName];
                        if (!l || !l.hasOwnProperty(o[2])) break;
                        i = i.prev;
                    }
                    for (;i && i.prev && !i.startOfLine; ) i = i.prev;
                    return i ? i.indent + s : t.baseIndent || 0;
                },
                electricInput: /<\/[\s\w:]+>$/,
                blockCommentStart: "\x3c!--",
                blockCommentEnd: "--\x3e",
                configuration: a.htmlMode ? "html" : "xml",
                helperType: a.htmlMode ? "html" : "xml",
                skipAttribute: function(e) {
                    e.state == S && (e.state = x);
                }
            };
        }), e.defineMIME("text/xml", "xml"), e.defineMIME("application/xml", "xml"), e.mimeModes.hasOwnProperty("text/html") || e.defineMIME("text/html", {
            name: "xml",
            htmlMode: !0
        });
    }(CodeMirror), function(e) {
        "use strict";
        var t = {
            script: [ [ "lang", /(javascript|babel)/i, "javascript" ], [ "type", /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^$/i, "javascript" ], [ "type", /./, "text/plain" ], [ null, null, "javascript" ] ],
            style: [ [ "lang", /^css$/i, "css" ], [ "type", /^(text\/)?(x-)?(stylesheet|css)$/i, "css" ], [ "type", /./, "text/plain" ], [ null, null, "css" ] ]
        };
        var n = {};
        function r(e, t) {
            var r, i = e.match(n[r = t] || (n[r] = new RegExp("\\s+" + r + "\\s*=\\s*('|\")?([^'\"]+)('|\")?\\s*")));
            return i ? i[2] : "";
        }
        function i(e, t) {
            return new RegExp((t ? "^" : "") + "</s*" + e + "s*>", "i");
        }
        function o(e, t) {
            for (var n in e) for (var r = t[n] || (t[n] = []), i = e[n], o = i.length - 1; o >= 0; o--) r.unshift(i[o]);
        }
        e.defineMode("htmlmixed", function(n, l) {
            var s = e.getMode(n, {
                name: "xml",
                htmlMode: !0,
                multilineTagIndentFactor: l.multilineTagIndentFactor,
                multilineTagIndentPastTag: l.multilineTagIndentPastTag
            }), a = {}, c = l && l.tags, u = l && l.scriptTypes;
            if (o(t, a), c && o(c, a), u) for (var f = u.length - 1; f >= 0; f--) a.script.unshift([ "type", u[f].matches, u[f].mode ]);
            function h(t, o) {
                var l, c = s.token(t, o.htmlState), u = /\btag\b/.test(c);
                if (u && !/[<>\s\/]/.test(t.current()) && (l = o.htmlState.tagName && o.htmlState.tagName.toLowerCase()) && a.hasOwnProperty(l)) o.inTag = l + " "; else if (o.inTag && u && />$/.test(t.current())) {
                    var f = /^([\S]+) (.*)/.exec(o.inTag);
                    o.inTag = null;
                    var d = ">" == t.current() && function(e, t) {
                        for (var n = 0; n < e.length; n++) {
                            var i = e[n];
                            if (!i[0] || i[1].test(r(t, i[0]))) return i[2];
                        }
                    }(a[f[1]], f[2]), p = e.getMode(n, d), g = i(f[1], !0), m = i(f[1], !1);
                    o.token = function(e, t) {
                        return e.match(g, !1) ? (t.token = h, t.localState = t.localMode = null, null) : (n = e, 
                        r = m, i = t.localMode.token(e, t.localState), o = n.current(), (l = o.search(r)) > -1 ? n.backUp(o.length - l) : o.match(/<\/?$/) && (n.backUp(o.length), 
                        n.match(r, !1) || n.match(o)), i);
                        var n, r, i, o, l;
                    }, o.localMode = p, o.localState = e.startState(p, s.indent(o.htmlState, ""));
                } else o.inTag && (o.inTag += t.current(), t.eol() && (o.inTag += " "));
                return c;
            }
            return {
                startState: function() {
                    return {
                        token: h,
                        inTag: null,
                        localMode: null,
                        localState: null,
                        htmlState: s.startState()
                    };
                },
                copyState: function(t) {
                    var n;
                    return t.localState && (n = e.copyState(t.localMode, t.localState)), {
                        token: t.token,
                        inTag: t.inTag,
                        localMode: t.localMode,
                        localState: n,
                        htmlState: e.copyState(s, t.htmlState)
                    };
                },
                token: function(e, t) {
                    return t.token(e, t);
                },
                indent: function(t, n) {
                    return !t.localMode || /^\s*<\//.test(n) ? s.indent(t.htmlState, n) : t.localMode.indent ? t.localMode.indent(t.localState, n) : e.Pass;
                },
                innerMode: function(e) {
                    return {
                        state: e.localState || e.htmlState,
                        mode: e.localMode || s
                    };
                }
            };
        }, "xml", "javascript", "css"), e.defineMIME("text/html", "htmlmixed");
    }(CodeMirror), function(e) {
        "use strict";
        var t = e.keyMap.sublime = {
            fallthrough: "default"
        }, n = e.commands, r = e.Pos, i = e.keyMap.default == e.keyMap.macDefault, o = i ? "Cmd-" : "Ctrl-";
        function l(t, n) {
            t.extendSelectionsBy(function(i) {
                return t.display.shift || t.doc.extend || i.empty() ? function(t, n, i) {
                    if (i < 0 && 0 == n.ch) return t.clipPos(r(n.line - 1));
                    var o = t.getLine(n.line);
                    if (i > 0 && n.ch >= o.length) return t.clipPos(r(n.line + 1, 0));
                    for (var l, s = "start", a = n.ch, c = i < 0 ? 0 : o.length, u = 0; a != c; a += i, 
                    u++) {
                        var f = o.charAt(i < 0 ? a - 1 : a), h = "_" != f && e.isWordChar(f) ? "w" : "o";
                        if ("w" == h && f.toUpperCase() == f && (h = "W"), "start" == s) "o" != h && (s = "in", 
                        l = h); else if ("in" == s && l != h) {
                            if ("w" == l && "W" == h && i < 0 && a--, "W" == l && "w" == h && i > 0) {
                                l = "w";
                                continue;
                            }
                            break;
                        }
                    }
                    return r(n.line, a);
                }(t.doc, i.head, n) : n < 0 ? i.from() : i.to();
            });
        }
        n[t["Alt-Left"] = "goSubwordLeft"] = function(e) {
            l(e, -1);
        }, n[t["Alt-Right"] = "goSubwordRight"] = function(e) {
            l(e, 1);
        };
        var s = i ? "Ctrl-Alt-" : "Ctrl-";
        function a(t, n) {
            if (t.isReadOnly()) return e.Pass;
            t.operation(function() {
                for (var e = t.listSelections().length, i = [], o = -1, l = 0; l < e; l++) {
                    var s = t.listSelections()[l].head;
                    if (!(s.line <= o)) {
                        var a = r(s.line + (n ? 0 : 1), 0);
                        t.replaceRange("\n", a, null, "+insertLine"), t.indentLine(a.line, null, !0), i.push({
                            head: a,
                            anchor: a
                        }), o = s.line + 1;
                    }
                }
                t.setSelections(i);
            });
        }
        function c(t, n) {
            for (var i = n.ch, o = i, l = t.getLine(n.line); i && e.isWordChar(l.charAt(i - 1)); ) --i;
            for (;o < l.length && e.isWordChar(l.charAt(o)); ) ++o;
            return {
                from: r(n.line, i),
                to: r(n.line, o),
                word: l.slice(i, o)
            };
        }
        n[t[s + "Up"] = "scrollLineUp"] = function(e) {
            var t = e.getScrollInfo();
            if (!e.somethingSelected()) {
                var n = e.lineAtHeight(t.top + t.clientHeight, "local");
                e.getCursor().line >= n && e.execCommand("goLineUp");
            }
            e.scrollTo(null, t.top - e.defaultTextHeight());
        }, n[t[s + "Down"] = "scrollLineDown"] = function(e) {
            var t = e.getScrollInfo();
            if (!e.somethingSelected()) {
                var n = e.lineAtHeight(t.top, "local") + 1;
                e.getCursor().line <= n && e.execCommand("goLineDown");
            }
            e.scrollTo(null, t.top + e.defaultTextHeight());
        }, n[t["Shift-" + o + "L"] = "splitSelectionByLine"] = function(e) {
            for (var t = e.listSelections(), n = [], i = 0; i < t.length; i++) for (var o = t[i].from(), l = t[i].to(), s = o.line; s <= l.line; ++s) l.line > o.line && s == l.line && 0 == l.ch || n.push({
                anchor: s == o.line ? o : r(s, 0),
                head: s == l.line ? l : r(s)
            });
            e.setSelections(n, 0);
        }, t["Shift-Tab"] = "indentLess", n[t.Esc = "singleSelectionTop"] = function(e) {
            var t = e.listSelections()[0];
            e.setSelection(t.anchor, t.head, {
                scroll: !1
            });
        }, n[t[o + "L"] = "selectLine"] = function(e) {
            for (var t = e.listSelections(), n = [], i = 0; i < t.length; i++) {
                var o = t[i];
                n.push({
                    anchor: r(o.from().line, 0),
                    head: r(o.to().line + 1, 0)
                });
            }
            e.setSelections(n);
        }, t["Shift-Ctrl-K"] = "deleteLine", n[t[o + "Enter"] = "insertLineAfter"] = function(e) {
            return a(e, !1);
        }, n[t["Shift-" + o + "Enter"] = "insertLineBefore"] = function(e) {
            return a(e, !0);
        }, n[t[o + "D"] = "selectNextOccurrence"] = function(t) {
            var n = t.getCursor("from"), i = t.getCursor("to"), o = t.state.sublimeFindFullWord == t.doc.sel;
            if (0 == e.cmpPos(n, i)) {
                var l = c(t, n);
                if (!l.word) return;
                t.setSelection(l.from, l.to), o = !0;
            } else {
                var s = t.getRange(n, i), a = o ? new RegExp("\\b" + s + "\\b") : s, u = t.getSearchCursor(a, i);
                u.findNext() ? t.addSelection(u.from(), u.to()) : (u = t.getSearchCursor(a, r(t.firstLine(), 0))).findNext() && t.addSelection(u.from(), u.to());
            }
            o && (t.state.sublimeFindFullWord = t.doc.sel);
        };
        var u = "(){}[]";
        function f(e) {
            var t = e.getCursor(), n = e.scanForBracket(t, -1);
            if (n) for (;;) {
                var i = e.scanForBracket(t, 1);
                if (!i) return;
                if (i.ch == u.charAt(u.indexOf(n.ch) + 1)) return e.setSelection(r(n.pos.line, n.pos.ch + 1), i.pos, !1), 
                !0;
                t = r(i.pos.line, i.pos.ch + 1);
            }
        }
        n[t["Shift-" + o + "Space"] = "selectScope"] = function(e) {
            f(e) || e.execCommand("selectAll");
        }, n[t["Shift-" + o + "M"] = "selectBetweenBrackets"] = function(t) {
            if (!f(t)) return e.Pass;
        }, n[t[o + "M"] = "goToBracket"] = function(t) {
            t.extendSelectionsBy(function(n) {
                var i = t.scanForBracket(n.head, 1);
                if (i && 0 != e.cmpPos(i.pos, n.head)) return i.pos;
                var o = t.scanForBracket(n.head, -1);
                return o && r(o.pos.line, o.pos.ch + 1) || n.head;
            });
        };
        var h = i ? "Cmd-Ctrl-" : "Shift-Ctrl-";
        function d(t, n) {
            if (t.isReadOnly()) return e.Pass;
            for (var i, o = t.listSelections(), l = [], s = 0; s < o.length; s++) {
                var a = o[s];
                if (!a.empty()) {
                    for (var c = a.from().line, u = a.to().line; s < o.length - 1 && o[s + 1].from().line == u; ) u = a[++s].to().line;
                    l.push(c, u);
                }
            }
            l.length ? i = !0 : l.push(t.firstLine(), t.lastLine()), t.operation(function() {
                for (var e = [], o = 0; o < l.length; o += 2) {
                    var s = l[o], a = l[o + 1], c = r(s, 0), u = r(a), f = t.getRange(c, u, !1);
                    n ? f.sort() : f.sort(function(e, t) {
                        var n = e.toUpperCase(), r = t.toUpperCase();
                        return n != r && (e = n, t = r), e < t ? -1 : e == t ? 0 : 1;
                    }), t.replaceRange(f, c, u), i && e.push({
                        anchor: c,
                        head: u
                    });
                }
                i && t.setSelections(e, 0);
            });
        }
        n[t[h + "Up"] = "swapLineUp"] = function(t) {
            if (t.isReadOnly()) return e.Pass;
            for (var n = t.listSelections(), i = [], o = t.firstLine() - 1, l = [], s = 0; s < n.length; s++) {
                var a = n[s], c = a.from().line - 1, u = a.to().line;
                l.push({
                    anchor: r(a.anchor.line - 1, a.anchor.ch),
                    head: r(a.head.line - 1, a.head.ch)
                }), 0 != a.to().ch || a.empty() || --u, c > o ? i.push(c, u) : i.length && (i[i.length - 1] = u), 
                o = u;
            }
            t.operation(function() {
                for (var e = 0; e < i.length; e += 2) {
                    var n = i[e], o = i[e + 1], s = t.getLine(n);
                    t.replaceRange("", r(n, 0), r(n + 1, 0), "+swapLine"), o > t.lastLine() ? t.replaceRange("\n" + s, r(t.lastLine()), null, "+swapLine") : t.replaceRange(s + "\n", r(o, 0), null, "+swapLine");
                }
                t.setSelections(l), t.scrollIntoView();
            });
        }, n[t[h + "Down"] = "swapLineDown"] = function(t) {
            if (t.isReadOnly()) return e.Pass;
            for (var n = t.listSelections(), i = [], o = t.lastLine() + 1, l = n.length - 1; l >= 0; l--) {
                var s = n[l], a = s.to().line + 1, c = s.from().line;
                0 != s.to().ch || s.empty() || a--, a < o ? i.push(a, c) : i.length && (i[i.length - 1] = c), 
                o = c;
            }
            t.operation(function() {
                for (var e = i.length - 2; e >= 0; e -= 2) {
                    var n = i[e], o = i[e + 1], l = t.getLine(n);
                    n == t.lastLine() ? t.replaceRange("", r(n - 1), r(n), "+swapLine") : t.replaceRange("", r(n, 0), r(n + 1, 0), "+swapLine"), 
                    t.replaceRange(l + "\n", r(o, 0), null, "+swapLine");
                }
                t.scrollIntoView();
            });
        }, n[t[o + "/"] = "toggleCommentIndented"] = function(e) {
            e.toggleComment({
                indent: !0
            });
        }, n[t[o + "J"] = "joinLines"] = function(e) {
            for (var t = e.listSelections(), n = [], i = 0; i < t.length; i++) {
                for (var o = t[i], l = o.from(), s = l.line, a = o.to().line; i < t.length - 1 && t[i + 1].from().line == a; ) a = t[++i].to().line;
                n.push({
                    start: s,
                    end: a,
                    anchor: !o.empty() && l
                });
            }
            e.operation(function() {
                for (var t = 0, i = [], o = 0; o < n.length; o++) {
                    for (var l, s = n[o], a = s.anchor && r(s.anchor.line - t, s.anchor.ch), c = s.start; c <= s.end; c++) {
                        var u = c - t;
                        c == s.end && (l = r(u, e.getLine(u).length + 1)), u < e.lastLine() && (e.replaceRange(" ", r(u), r(u + 1, /^\s*/.exec(e.getLine(u + 1))[0].length)), 
                        ++t);
                    }
                    i.push({
                        anchor: a || l,
                        head: l
                    });
                }
                e.setSelections(i, 0);
            });
        }, n[t["Shift-" + o + "D"] = "duplicateLine"] = function(e) {
            e.operation(function() {
                for (var t = e.listSelections().length, n = 0; n < t; n++) {
                    var i = e.listSelections()[n];
                    i.empty() ? e.replaceRange(e.getLine(i.head.line) + "\n", r(i.head.line, 0)) : e.replaceRange(e.getRange(i.from(), i.to()), i.from());
                }
                e.scrollIntoView();
            });
        }, t[o + "T"] = "transposeChars", n[t.F9 = "sortLines"] = function(e) {
            d(e, !0);
        }, n[t[o + "F9"] = "sortLinesInsensitive"] = function(e) {
            d(e, !1);
        }, n[t.F2 = "nextBookmark"] = function(e) {
            var t = e.state.sublimeBookmarks;
            if (t) for (;t.length; ) {
                var n = t.shift(), r = n.find();
                if (r) return t.push(n), e.setSelection(r.from, r.to);
            }
        }, n[t["Shift-F2"] = "prevBookmark"] = function(e) {
            var t = e.state.sublimeBookmarks;
            if (t) for (;t.length; ) {
                t.unshift(t.pop());
                var n = t[t.length - 1].find();
                if (n) return e.setSelection(n.from, n.to);
                t.pop();
            }
        }, n[t[o + "F2"] = "toggleBookmark"] = function(e) {
            for (var t = e.listSelections(), n = e.state.sublimeBookmarks || (e.state.sublimeBookmarks = []), r = 0; r < t.length; r++) {
                for (var i = t[r].from(), o = t[r].to(), l = e.findMarks(i, o), s = 0; s < l.length; s++) if (l[s].sublimeBookmark) {
                    l[s].clear();
                    for (var a = 0; a < n.length; a++) n[a] == l[s] && n.splice(a--, 1);
                    break;
                }
                s == l.length && n.push(e.markText(i, o, {
                    sublimeBookmark: !0,
                    clearWhenEmpty: !1
                }));
            }
        }, n[t["Shift-" + o + "F2"] = "clearBookmarks"] = function(e) {
            var t = e.state.sublimeBookmarks;
            if (t) for (var n = 0; n < t.length; n++) t[n].clear();
            t.length = 0;
        }, n[t["Alt-F2"] = "selectBookmarks"] = function(e) {
            var t = e.state.sublimeBookmarks, n = [];
            if (t) for (var r = 0; r < t.length; r++) {
                var i = t[r].find();
                i ? n.push({
                    anchor: i.from,
                    head: i.to
                }) : t.splice(r--, 0);
            }
            n.length && e.setSelections(n, 0);
        }, t["Alt-Q"] = "wrapLines";
        var p = o + "K ";
        function g(t, n) {
            t.operation(function() {
                for (var r = t.listSelections(), i = [], o = [], l = 0; l < r.length; l++) {
                    (a = r[l]).empty() ? (i.push(l), o.push("")) : o.push(n(t.getRange(a.from(), a.to())));
                }
                t.replaceSelections(o, "around", "case");
                var s;
                for (l = i.length - 1; l >= 0; l--) {
                    var a = r[i[l]];
                    if (!(s && e.cmpPos(a.head, s) > 0)) {
                        var u = c(t, a.head);
                        s = u.from, t.replaceRange(n(u.word), u.from, u.to);
                    }
                }
            });
        }
        function m(t) {
            var n = t.getCursor("from"), r = t.getCursor("to");
            if (0 == e.cmpPos(n, r)) {
                var i = c(t, n);
                if (!i.word) return;
                n = i.from, r = i.to;
            }
            return {
                from: n,
                to: r,
                query: t.getRange(n, r),
                word: i
            };
        }
        function v(e, t) {
            var n = m(e);
            if (n) {
                var i = n.query, o = e.getSearchCursor(i, t ? n.to : n.from);
                (t ? o.findNext() : o.findPrevious()) ? e.setSelection(o.from(), o.to()) : (o = e.getSearchCursor(i, t ? r(e.firstLine(), 0) : e.clipPos(r(e.lastLine()))), 
                (t ? o.findNext() : o.findPrevious()) ? e.setSelection(o.from(), o.to()) : n.word && e.setSelection(n.from, n.to));
            }
        }
        t[p + o + "Backspace"] = "delLineLeft", n[t.Backspace = "smartBackspace"] = function(t) {
            if (t.somethingSelected()) return e.Pass;
            var n = t.getCursor(), i = t.getRange({
                line: n.line,
                ch: 0
            }, n), o = e.countColumn(i, null, t.getOption("tabSize")), l = t.getOption("indentUnit");
            if (i && !/\S/.test(i) && o % l == 0) {
                var s = new r(n.line, e.findColumn(i, o - l, l));
                return s.ch == n.ch ? e.Pass : t.replaceRange("", s, n, "+delete");
            }
            return e.Pass;
        }, n[t[p + o + "K"] = "delLineRight"] = function(e) {
            e.operation(function() {
                for (var t = e.listSelections(), n = t.length - 1; n >= 0; n--) e.replaceRange("", t[n].anchor, r(t[n].to().line), "+delete");
                e.scrollIntoView();
            });
        }, n[t[p + o + "U"] = "upcaseAtCursor"] = function(e) {
            g(e, function(e) {
                return e.toUpperCase();
            });
        }, n[t[p + o + "L"] = "downcaseAtCursor"] = function(e) {
            g(e, function(e) {
                return e.toLowerCase();
            });
        }, n[t[p + o + "Space"] = "setSublimeMark"] = function(e) {
            e.state.sublimeMark && e.state.sublimeMark.clear(), e.state.sublimeMark = e.setBookmark(e.getCursor());
        }, n[t[p + o + "A"] = "selectToSublimeMark"] = function(e) {
            var t = e.state.sublimeMark && e.state.sublimeMark.find();
            t && e.setSelection(e.getCursor(), t);
        }, n[t[p + o + "W"] = "deleteToSublimeMark"] = function(t) {
            var n = t.state.sublimeMark && t.state.sublimeMark.find();
            if (n) {
                var r = t.getCursor(), i = n;
                if (e.cmpPos(r, i) > 0) {
                    var o = i;
                    i = r, r = o;
                }
                t.state.sublimeKilled = t.getRange(r, i), t.replaceRange("", r, i);
            }
        }, n[t[p + o + "X"] = "swapWithSublimeMark"] = function(e) {
            var t = e.state.sublimeMark && e.state.sublimeMark.find();
            t && (e.state.sublimeMark.clear(), e.state.sublimeMark = e.setBookmark(e.getCursor()), 
            e.setCursor(t));
        }, n[t[p + o + "Y"] = "sublimeYank"] = function(e) {
            null != e.state.sublimeKilled && e.replaceSelection(e.state.sublimeKilled, null, "paste");
        }, t[p + o + "G"] = "clearBookmarks", n[t[p + o + "C"] = "showInCenter"] = function(e) {
            var t = e.cursorCoords(null, "local");
            e.scrollTo(null, (t.top + t.bottom) / 2 - e.getScrollInfo().clientHeight / 2);
        }, n[t["Shift-Alt-Up"] = "selectLinesUpward"] = function(e) {
            e.operation(function() {
                for (var t = e.listSelections(), n = 0; n < t.length; n++) {
                    var i = t[n];
                    i.head.line > e.firstLine() && e.addSelection(r(i.head.line - 1, i.head.ch));
                }
            });
        }, n[t["Shift-Alt-Down"] = "selectLinesDownward"] = function(e) {
            e.operation(function() {
                for (var t = e.listSelections(), n = 0; n < t.length; n++) {
                    var i = t[n];
                    i.head.line < e.lastLine() && e.addSelection(r(i.head.line + 1, i.head.ch));
                }
            });
        }, n[t[o + "F3"] = "findUnder"] = function(e) {
            v(e, !0);
        }, n[t["Shift-" + o + "F3"] = "findUnderPrevious"] = function(e) {
            v(e, !1);
        }, n[t["Alt-F3"] = "findAllUnder"] = function(e) {
            var t = m(e);
            if (t) {
                for (var n = e.getSearchCursor(t.query), r = [], i = -1; n.findNext(); ) r.push({
                    anchor: n.from(),
                    head: n.to()
                }), n.from().line <= t.from.line && n.from().ch <= t.from.ch && i++;
                e.setSelections(r, i);
            }
        }, t["Shift-" + o + "["] = "fold", t["Shift-" + o + "]"] = "unfold", t[p + o + "0"] = t[p + o + "j"] = "unfoldAll", 
        t[o + "I"] = "findIncremental", t["Shift-" + o + "I"] = "findIncrementalReverse", 
        t[o + "H"] = "replace", t.F3 = "findNext", t["Shift-F3"] = "findPrev", e.normalizeKeyMap(t);
    }(CodeMirror);
    var t = window.CodeMirror;
    return window.CodeMirror = e, t;
});