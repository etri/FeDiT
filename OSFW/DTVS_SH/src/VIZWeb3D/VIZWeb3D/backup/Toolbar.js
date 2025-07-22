/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.Toolbar = function (View) {

    var scope = this;
    var view = View;
    var visible = true;
    var leftSide;
    var rightSide;
    var splitterBar;
    var leftSideWidth;
    var rightSideWidth;
    initMenu();

    function create() {

    }

    function initMenu() {
        //if (0)
        {
            if ($('.splitter-container').length > 0) {
                $('.splitter-container').css('display', 'flex');

                leftSide = $('.splitter-container').children('.left').first();
                rightSide = $('.splitter-container').children('.right').first();

                leftSideWidth = leftSide.width();
                splitterBar = $('.splitter-container').children('.splitter-bar').first();
                leftSide.after(splitterBar);

                let isDragging = false;

                splitterBar.on('mousedown', function (event) {
                    isDragging = true;
                    $('.splitter-container').on('mousemove', function (event) {
                        if (isDragging) {
                            let leftOfLeft = leftSide.position().left;
                            var widthLeft = leftSide.width();
                            var width = $('.splitter-container').width();
                            var widthSplit = splitterBar.width();
                            var eventX = event.pageX;
                            if (eventX <= widthSplit / 2)
                                eventX = widthSplit / 2;

                            leftSideWidth = eventX - leftOfLeft - widthSplit / 2;
                            var widthRight = width - leftSideWidth - widthSplit;
                            splitterBar.css('width', widthSplit);
                            leftSide.css('width', leftSideWidth);
                            rightSide.css('width', widthRight);
                            rightSideWidth = rightSide.width();

                            //console.log("LeftSideWidth : " + leftSideWidth);
                            //console.log("SplitWidth : " + splitterBar.width());
                            //console.log("RightSideWidth : " + rightSideWidth);

                            if (leftSideWidth < 0)
                                view.Tree.Option.Visible = false;
                            else
                                view.Tree.Option.Visible = true;
                            view.Refresh();
                        }
                    });
                    return false;
                });

                splitterBar.on('mouseup', function (event) {
                    isDragging = false;
                    $('.splitter-container').off('mousemove');
                    return false;
                });

                splitterBar.on('touchstart', function (event) {
                    isDragging = true;
                    $('.splitter-container').on('touchmove', function (event) {
                        event.preventDefault();
                        var e = event.originalEvent;
                        moveTouchX = e.targetTouches[0].pageX;
                        moveTouchY = e.targetTouches[0].pageY;
                        if (isDragging) {
                            let leftOfLeft = leftSide.position().left;
                            var widthLeft = leftSide.width();
                            var width = $('.splitter-container').width();
                            var widthSplit = splitterBar.width();
                            var eventX = moveTouchX;
                            if (eventX <= widthSplit / 2)
                                eventX = widthSplit / 2;

                            leftSideWidth = eventX - leftOfLeft - widthSplit / 2;
                            var widthRight = width - leftSideWidth - widthSplit;
                            splitterBar.css('width', widthSplit);
                            leftSide.css('width', leftSideWidth);
                            rightSide.css('width', widthRight);
                            rightSideWidth = rightSide.width();

                            //console.log("LeftSideWidth : " + leftSideWidth);
                            //console.log("SplitWidth : " + splitterBar.width());
                            //console.log("RightSideWidth : " + rightSideWidth);

                            if (leftSideWidth < 0)
                                view.Tree.Option.Visible = false;
                            else
                                view.Tree.Option.Visible = true;
                            view.Refresh();

                            //let leftOfLeft = leftSide.position().left;
                            //var widthLeft = leftSide.width();
                            //leftSideWidth = moveTouchX - leftOfLeft - splitterBar.width() / 2;
                            //leftSide.width(leftSideWidth);
                            //var widthRight = rightSide.width();
                            //rightSide.width(widthRight + (widthLeft - leftSideWidth));
                            //rightSideWidth = rightSide.width();
                            //if (leftSideWidth === 0)
                            //    view.Tree.Option.Visible = false;
                            //else
                            //    view.Tree.Option.Visible = true;
                            //view.Refresh();
                        }
                    });
                    return false;
                });
                splitterBar.on('touchend', function (event) {
                    isDragging = false;
                    $('.splitter-container').off('touchmove');
                    return false;
                });

                if ($('#ui_splitter_img').length > 0) {
                    $('#ui_splitter_img').on('dblclick', function (event) {
                        event.preventDefault();
                        setSplitPos();
                    });
                }
            }
        }
        //    var uibox = document.getElementById('uibox');
        //    if (uibox !== undefined) {
        //        uibox.addEventListener("mouseover", function () {
        //            view.Lock(true);
        //        });
        //        uibox.addEventListener("mouseout", function () {
        //            view.Lock(false);
        //        });
        //    }
        //}
        //else

        {
            // 모델 보기
            if ($("#ui_test").length > 0) {
                $("#ui_test").addClass('clck');
                $("#ui_test").click(function () {
                    view.Control.Model.Visible = !view.Control.Model.Visible;
                    if (view.Control.Model.Visible)
                        $(this).addClass('clck');
                    else
                        $(this).removeClass('clck');
                });
            }

            // 모델 보기
            if ($("#ui_model_visible").length > 0) {
                $('#ui_model_visible').attr('data-tooltip-text', 'Model');
                $("#ui_model_visible").addClass('clck');
                $("#ui_model_visible").click(function () {
                    view.Control.Model.Visible = !view.Control.Model.Visible;
                    if (view.Control.Model.Visible)
                        $(this).addClass('clck');
                    else
                        $(this).removeClass('clck');
                });
            }
            // 바닥 면
            if ($("#ui_ground_visible").length > 0) {
                $('#ui_ground_visible').attr('data-tooltip-text', 'Ground');
                $("#ui_ground_visible").addClass('clck');
                $("#ui_ground_visible").click(function () {
                    view.Ground.Option.Visible = !view.Ground.Option.Visible;
                    if (view.Ground.Option.Visible)
                        $(this).addClass('clck');
                    else
                        $(this).removeClass('clck');
                });
            }

            // 좌표축
            if ($("#ui_coordinate_visible").length > 0) {
                $('#ui_coordinate_visible').attr('data-tooltip-text', 'Coodinate');
                //$("#ui_coordinate_visible").removeClass('uitxt');
                $("#ui_coordinate_visible").addClass('clck');
                $("#ui_coordinate_visible").click(function () {
                    view.Coordinate.Option.Visible = !view.Coordinate.Option.Visible;
                    if (view.Coordinate.Option.Visible)
                        $(this).addClass('clck');
                    else
                        $(this).removeClass('clck');
                });
            }

            // 모서리
            if ($("#ui_edge_visible").length > 0) {
                $('#ui_edge_visible').attr('data-tooltip-text', 'Edge');
                $("#ui_edge_visible").click(function () {
                    view.Control.Edge.Visible = !view.Control.Edge.Visible;
                    if (view.Control.Edge.Visible)
                        $(this).addClass('clck');
                    else
                        $(this).removeClass('clck');
                });
            }

            // RenderMode
            if ($("#ui_rendermode_smooth").length > 0
                && $("#ui_rendermode_flat").length > 0
                && $("#ui_rendermode_wireframe").length > 0
                && $("#ui_rendermode_text_img").length > 0
                && $("#ui_rendermode_hiddenline").length > 0
                && $("#ui_rendermode_hiddenline_elimination").length > 0
                && $("#ui_rendermode_xray").length > 0
                && $("#ui_rendermode_smoothedge").length > 0
            ) {
                $('#ui_rendermode_smooth').attr('data-tooltip-text', 'Smooth');
                $('#ui_rendermode_flat').attr('data-tooltip-text', 'Rough');
                $('#ui_rendermode_wireframe').attr('data-tooltip-text', 'Wireframe');
                $('#ui_rendermode_hiddenline').attr('data-tooltip-text', 'Hidden Line');
                $('#ui_rendermode_hiddenline_elimination').attr('data-tooltip-text', 'Hidden Line Elimination');
                $('#ui_rendermode_xray').attr('data-tooltip-text', 'Xray');
                $('#ui_rendermode_smoothedge').attr('data-tooltip-text', 'Smooth Edge');

                $("#ui_rendermode_smooth").addClass('clck');
                $("#ui_rendermode_smooth").click(function () {
                    view.Control.Model.RenderMode = RENDER_MODES.Smooth;
                    $("#ui_rendermode_smooth").addClass('clck');
                    $("#ui_rendermode_flat").removeClass('clck');
                    $("#ui_rendermode_wireframe").removeClass('clck');
                    $("#ui_rendermode_hiddenline").removeClass('clck');
                    $("#ui_rendermode_hiddenline_elimination").removeClass('clck');
                    $("#ui_rendermode_xray").removeClass('clck');
                    $("#ui_rendermode_smoothedge").removeClass('clck');
                    var src = $("#ui_rendermode_smooth_img").attr("src");
                    if (src)
                        $("#ui_rendermode_text_img").attr("src", src);
                    else
                        $("#ui_rendermode_text_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAACCElEQVRYhe1Xy4rqQBA9iqiIEh8gKKJx40436p+49l7wR+4nzCfMXfsJrsStbtSFiGAGRFc+gg98gH2pJvE2mfQQRwYHJgeaSleaqpPq6lS1hzGGZ8L7VO8AfA7WRAH8NqQqjJxl3RsATRgbAK+GlIO2QDJUxtgLY2zDPo+NYUOV+bHLAfq6PwB+icrFYoHT6YTlcnmbi0ilUnyWSCQQCARucwF/DbuaqLQjQCFT6OF8PmMwGGA8HmO73TrYrf+IRCIoFAooFovw+/2mXje28kMCXNHr9bhzIvEIyDmRKJfLN5+iOekpIAKPOocRRbIlgzQCtNdm+B+BuQ2UG3YRkBIwsdvt0O12oWma44hQ2FVVRaVSQTgctr52RkDXdSiK8s44EaKEFE+EmfmUeDYO0e/3USqV7iPQ6XQQDAaRyWTsjpQjtFotNJtNTKdT/mxH4MM/4Wq1wmw2w36/RzQaxfF45NLr9SKZTPJQX69XHhHKlfV6jeFwyNe12214PB7EYjHE43GpDye/Yo75fI7D4cAdkbQOIinqnOLpxcgl4BJwCbgEXAJSArlcDj6f41IhBZXoer0ufW/ngRpHJZvNIp1OYzKZYDQa3VVgCFTGa7UaGo2G2CPo1nV3teVEgqri5XLhpKjsUmNCklov0ufzeYRCIVSrVatd27b8W15MrPjSq9kPvx0D+AducOedPh2ShAAAAABJRU5ErkJggg==");
                });
                $("#ui_rendermode_flat").click(function () {
                    view.Control.Model.RenderMode = RENDER_MODES.Flat;
                    $("#ui_rendermode_flat").addClass('clck');
                    $("#ui_rendermode_smooth").removeClass('clck');
                    $("#ui_rendermode_wireframe").removeClass('clck');
                    $("#ui_rendermode_hiddenline").removeClass('clck');
                    $("#ui_rendermode_hiddenline_elimination").removeClass('clck');
                    $("#ui_rendermode_xray").removeClass('clck');
                    $("#ui_rendermode_smoothedge").removeClass('clck');

                    var src = $("#ui_rendermode_flat_img").attr("src");
                    if (src)
                        $("#ui_rendermode_text_img").attr("src", src);
                    else
                        $("#ui_rendermode_text_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAB+ElEQVRYhe1XvW7CMBD+WhAwAI2EhIClWQITavl5gL5JO/EcPEIfoX0G3oEJJrLAFC+AkJCoYAAWV2fFqZXEyCVqWfJJ1sXO6e7z+efOd5xz3BL3N/UOIGugYwF486WttMeQHgPgKW0H4MOXetASaJrNOX/nnO/49dj5Nmydn7g9QLMbAnhVB1erFU6nE7bbbdBXUa/XRa9SqSCfzwd9BZ++XU8djCNAIXugj/P5jNlshsVigf1+b7BaPyiVSmg2m2i328jlcnL8y1/KiwTEwHQ6Fc6JRBKQcyLR6/UCn6o57SkgAkmdw48i2dJBGwFaaxn+JJDLQHsjLgJaAhKHwwGTyQSe5xlHhMJu2zb6/T6KxWL4txkB2nS0kcIgQvRPPRFy55N+jENxYpRTYUaA1o0MVqtVWJYV1jECRc11XSyXSwwGg1gCF29Cmik113WZvPlqtRoKhUIgKQqkM5/PRXRIEhzHYeVyOXxbRmByFQvQbFQpMRqNYvUdxzGye/NklBJICaQEUgIpAS2BRqOBTCaT2AHVBko5FoE2GVH+plS82WzAGDNOWhKWZWU7nU64KI3AuCxnjOF4PGK9Xou+zIrj8VhIOctWqyXqiG63G7YbW5b/x8Nk+NuHSSSaAF4APPvfUj6F9K56miV9Hcta7fL77w8JJAOAbzbJuJe/JwQYAAAAAElFTkSuQmCC");
                });
                $("#ui_rendermode_wireframe").click(function () {
                    view.Control.Model.RenderMode = RENDER_MODES.Wireframe;
                    $("#ui_rendermode_wireframe").addClass('clck');
                    $("#ui_rendermode_flat").removeClass('clck');
                    $("#ui_rendermode_smooth").removeClass('clck');
                    $("#ui_rendermode_hiddenline").removeClass('clck');
                    $("#ui_rendermode_hiddenline_elimination").removeClass('clck');
                    $("#ui_rendermode_xray").removeClass('clck');
                    $("#ui_rendermode_smoothedge").removeClass('clck');
                    var src = $("#ui_rendermode_wireframe_img").attr("src");
                    if (src)
                        $("#ui_rendermode_text_img").attr("src", src);
                    else
                        $("#ui_rendermode_text_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABwElEQVRYhe1X0W2EMAx1q/4fG5QNjhHYoGxQNmhH4DZgBG6DdANGyG1AN6ATpIr0orqWzQXUEx+9J0WGxHHsxHachxAC7YnHXVcnoqcMnoKIWtCStWfB90lEE2szEQ2gNuIRGK0MIfQhhDlsxwwZpbWO1hmZB2PJKLBDq5Xx2O8MpQdNEU0BPjl+eyGoZ7zaIrF/xL9X5P1aT3PCA+gJ5+3E+BsRNaLvDPpKRO+s30HGScj+gbIDCem/Y9Z4ZkkleL2wNB2JJdfcgQQP70+Y8f8FSwbBXxPRRbG0hSwdCzsgMWK8VcbS3Cojaq46YcJoCJiURRz4pwXlVytACDUZBWvgIcP0gWuZcIQnH3G+0cMrZMVIX8D3gXOeQXvMcZBhIicVcycchcB0k8mwXE6/DLtfRncF7gqsiYIC6ZaHYYITYVhkS907EW1NxSPSr4R1D2xKxRbWFCQashXwuPk6RUgreHkJ1zEFOvDyY1x1Ga0pSLjVf1KQdMKbZ+R8qyBpjIKkgKzsKLCK0lSQNAvnWor5m4rSihWZB1yrqd+BXsScGla2eJgkHNlunEXuMHeAW3Pzh0nO4/SmT7N//jomom+zn4VK106VRgAAAABJRU5ErkJggg==");
                });

                $("#ui_rendermode_hiddenline").click(function () {
                    view.Control.Model.RenderMode = RENDER_MODES.HiddenLine;

                    $("#ui_rendermode_wireframe").removeClass('clck');
                    $("#ui_rendermode_flat").removeClass('clck');
                    $("#ui_rendermode_smooth").removeClass('clck');
                    $("#ui_rendermode_hiddenline").addClass('clck');
                    $("#ui_rendermode_hiddenline_elimination").removeClass('clck');
                    $("#ui_rendermode_xray").removeClass('clck');
                    $("#ui_rendermode_smoothedge").removeClass('clck');

                    var src = $("#ui_rendermode_hiddenline_img").attr("src");
                    if (src)
                        $("#ui_rendermode_text_img").attr("src", src);
                    else
                        $("#ui_rendermode_text_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAACWElEQVRYhe1XsW7bMBA9F9mjVVOVlYv1B1IHz8niWc3iuf0C6v7As5dGs5dk9hDlD6zFa51JKwN0NVRccRKuKknJVoEseQAh6UTeHXnHx+OsaRp4T3yaaDvgdjGuRhr5ys9ItM+9fhUAGADYi2fJ725QCBwtapomP51Ov5oLwWPXrMtqx5YDNLscADIprOvahGH4wjMjlEVRPNNLlmVfACBleVzXdRKGYT80Bes9SqEtBD/F+9vhcNjvdrvEGFNpre9kx+Ox01Vy+4PNZlMGQZAsFosXpVQMANc8IWozqcOXhEirsd1uS2P8YbSBxtBYXlF09fM5kA8m0EhfWJcVzl2AiBTr9VTriEg76JvW+jwHAGAOAD8m2rdbHekAZXwivhNEpC3zypnchQcRHwVP9PnBpquDbRu2ghkiphyG+dBMPJOg5d9LvbKDl4q11pTFj/xJTEf7/Z6zuhBdn1j2nftULC/ZuBNjqLiFYYc6IGLGjt715KN3z9TDaDI+HPhw4JxdEDAvxEw6cfsDER+YnNo2ukoaIqKYicjKYiNQMRGVLiJyOoCILvqUVHzLsqchKtZat7r+csAXgr5xUpJKAZ8NNiIq++eIy4gvCStBu5cCWUflGu9cAa11zLNxFhNjoLWmBH0QOTB6BfKpNT8j8FVEPgeomDgul8s0CM73g8bQWE5YZ2FiC8GNKMuvlVKJUorK8jkfzV1ZHkVROyaVZflqtZqHYQi95CusKzFwMVn/h4tJfu7F5J/V5NlJBgwsVdJrjw0NJ5+3Nph6O26T4+Ly/X2v5wDwG0Iprsun+rgfAAAAAElFTkSuQmCC");
                });


                $("#ui_rendermode_hiddenline_elimination").click(function () {
                    view.Control.Model.RenderMode = RENDER_MODES.HiddenLine_Elimination;
                    $("#ui_rendermode_wireframe").removeClass('clck');
                    $("#ui_rendermode_flat").removeClass('clck');
                    $("#ui_rendermode_smooth").removeClass('clck');
                    $("#ui_rendermode_hiddenline").removeClass('clck');
                    $("#ui_rendermode_hiddenline_elimination").addClass('clck');
                    $("#ui_rendermode_xray").removeClass('clck');
                    $("#ui_rendermode_smoothedge").removeClass('clck');

                    var src = $("#ui_rendermode_hiddenline_elimination_img").attr("src");
                    if (src)
                        $("#ui_rendermode_text_img").attr("src", src);
                    else
                        $("#ui_rendermode_text_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABd0lEQVRYhe1X0U3EMAz1If7JBtwG1w04NmADOgIjdISOABvABPQ2CBuUDXoTGEV6Qa5x01xyEj99klUrTRwndpyXHTPTf+Kmcm4HKcZt5iQtvnsh96rfFxFNROTFd4C+jBCCBdkzc8fME5cjjO1hy5zHyoGwuo6InlX7SayMsDqJI/QGu/Wg/r/B7jhrNbySmLALiyso2MFZv5QDYbArmFiLgy3TASsEsWFXnNo2TLupY+iR/bVoRd78xUoOBIzM3F4YDocxo2EvOwQnI5MDvpHJ8kQ0ok7o+qBtzUOb2IGgH5nZV9SBgZkbw+6vrFXCcNbfieiASveiqmGsFR+qAvYYMyTjn1mKIyaj+EQHnoy+Wai9jKqxObA5sDmwObA5kHKgq+X8gIMtGxmk1IurNXV1SxnQ7tdI6SW0/Kyu16B/Qn9UtDzod2p8Ni2XtLq/wsMkSetzHqcOK4q0K34Pql+kaqOgbK9r3KD2dRyTNJuAXNuBOhDRD0NxSrpv5ToQAAAAAElFTkSuQmCC");
                });

                $("#ui_rendermode_xray").click(function () {
                    view.Control.Model.RenderMode = RENDER_MODES.Xray;
                    $("#ui_rendermode_wireframe").removeClass('clck');
                    $("#ui_rendermode_flat").removeClass('clck');
                    $("#ui_rendermode_smooth").removeClass('clck');
                    $("#ui_rendermode_hiddenline").removeClass('clck');
                    $("#ui_rendermode_hiddenline_elimination").removeClass('clck');
                    $("#ui_rendermode_xray").addClass('clck');
                    $("#ui_rendermode_smoothedge").removeClass('clck');

                    var src = $("#ui_rendermode_xray_img").attr("src");
                    if (src)
                        $("#ui_rendermode_text_img").attr("src", src);
                    else
                        $("#ui_rendermode_text_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAClElEQVRYhe1XzaraQBQ+SfxJjN66E13o1YVuhLp2VfAFCn2AduemD3EfoYs+wO0DFHwBoUs3QuvChaJUBSXiL2gSo8mUMzfaXMn0GhXuhd4PhjM5mTnfN2Rmcg5HCIHnBH8hd9RuZ8N3Iskn297aDftvj8b9AoAFAPx02B92nw38BIwWJYTcWZa1JmfCnvuFEHLL4nHbA7jCOwD46HQahgGWZcFut6PPm82G2ul0Sm0kEqFWkiQQBOHw7MA3O+5vp9NNwMFhmiaMx2MaEPtuGA6Hrv5AIADBYBAymQz4fI++NHeSgNFoBIqiUOJEIsH8hCwB+xh+vx/S6TRks1lXAcxTgIFZq/aC7XYLrVaLOePSY3gxmAJ0Xb8ayXK5NFjvmPfAfD4HjuNUWZYtVVXDoVDIEynOn8/na1wIIUT2LAAe7ojQarWCarV68MmyrKCNRqM+v9+/a7fbeDR9s9mMnk9d12O4d/AEpFIpJvFJAtywXq9j8GDp20aj4TXEI7zcTfgq4FXAfyPA8z1gmubKNE2VEMJrmmYuFgvMAQSe501BEGSe58NXE0AIMRRFMbvdroRXq42w3Sg6nY7r3Hw+D7FYTLu5uRE4jgt4FtDr9YzJZEInOshPRq/Xw+tYwvHJZBJ/Rq4imHtgT34N9Pt9ZqyXewoKhQKIongxAf7Gi8Ui8/0/k1LMfGu1GlQqFVBV1TVAvV539cfjcSiXy1AqlWim7OR8SsA7Xdc/i6L4Ye/QNA0GgwFt2MdUfDKZ0H6z2aQpOCauSIr9XC5Hmyz/TQc0TfsuSdJXu1hxLJddmGAxcX9uUYLYbreaHcNTYXIMLFTe2+VYwWHfHI1b2uUYOEqy+6dKs0ur432duCf2jOctzwHgDwTm7JImQfRFAAAAAElFTkSuQmCC");
                });

                $("#ui_rendermode_smoothedge").click(function () {
                    view.Control.Model.RenderMode = RENDER_MODES.SmoothEdge;
                    $("#ui_rendermode_wireframe").removeClass('clck');
                    $("#ui_rendermode_flat").removeClass('clck');
                    $("#ui_rendermode_smooth").removeClass('clck');
                    $("#ui_rendermode_hiddenline").removeClass('clck');
                    $("#ui_rendermode_hiddenline_elimination").removeClass('clck');
                    $("#ui_rendermode_xray").removeClass('clck');
                    $("#ui_rendermode_smoothedge").addClass('clck');

                    var src = $("#ui_rendermode_smoothedge_img").attr("src");
                    if (src)
                        $("#ui_rendermode_text_img").attr("src", src);
                    else
                        $("#ui_rendermode_text_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAACCElEQVRYhe1Xy4rqQBA9iqiIEh8gKKJx40436p+49l7wR+4nzCfMXfsJrsStbtSFiGAGRFc+gg98gH2pJvE2mfQQRwYHJgeaSleaqpPq6lS1hzGGZ8L7VO8AfA7WRAH8NqQqjJxl3RsATRgbAK+GlIO2QDJUxtgLY2zDPo+NYUOV+bHLAfq6PwB+icrFYoHT6YTlcnmbi0ilUnyWSCQQCARucwF/DbuaqLQjQCFT6OF8PmMwGGA8HmO73TrYrf+IRCIoFAooFovw+/2mXje28kMCXNHr9bhzIvEIyDmRKJfLN5+iOekpIAKPOocRRbIlgzQCtNdm+B+BuQ2UG3YRkBIwsdvt0O12oWma44hQ2FVVRaVSQTgctr52RkDXdSiK8s44EaKEFE+EmfmUeDYO0e/3USqV7iPQ6XQQDAaRyWTsjpQjtFotNJtNTKdT/mxH4MM/4Wq1wmw2w36/RzQaxfF45NLr9SKZTPJQX69XHhHKlfV6jeFwyNe12214PB7EYjHE43GpDye/Yo75fI7D4cAdkbQOIinqnOLpxcgl4BJwCbgEXAJSArlcDj6f41IhBZXoer0ufW/ngRpHJZvNIp1OYzKZYDQa3VVgCFTGa7UaGo2G2CPo1nV3teVEgqri5XLhpKjsUmNCklov0ufzeYRCIVSrVatd27b8W15MrPjSq9kPvx0D+AducOedPh2ShAAAAABJRU5ErkJggg==");
                });

            }

            // Projection
            if ($("#ui_projection").length > 0
                && $("#ui_projection_img").length > 0) {
                $('#ui_projection').attr('data-tooltip-text', 'Projection');
                $("#ui_projection").click(function () {
                    if (view.Control.Camera.Projection === PROJECTION_MODES.Orthographic) {
                        view.Control.Camera.Projection = PROJECTION_MODES.Perspective;
                        //$("#ui_projection_text").text("원근");
                        if (view.Configuration.Thema.Type === THEMA_TYPES.Splitter)
                            $("#ui_projection_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAADCklEQVRYhcWXP2hUQRDGf2pArbwiiBaSoGARhFirkKSyEPFARNTC+KewMJg2iONlEAyCELESBC+ViIUXsFCri9qKORAs/IPXqAERU6iIysnK7GXZvHvv3V0g07z35nZnvv1m9tu9NY1Gg9W0tauaHehZqUCqOgrcskW9AqZE5F7WvK5LoKq7gWlgKOHnP1lgOgagqgWgBFww16IBWQ8cAba7+MGUn8Bj4LqIPO8KgKqOW/JN5poFxkXkQzTuqoHZEYV4LSIDbQNQ1WFb5aC5apa4mjGvD3BgjnmfiPxnJ1cTqmq/rfikuRzdJRGZzondjR8Ivl/4l0wAquoSjwd0z9iqv+UE73qlaqz9sh55mAnA6C4Dfeaas8TzeRIH5kvmWFgAdhqgZABGt5t0yFyLlrjcZmIXq2xlczEOAk/tp+YieoLBBaP6chDjhtU6F90tkjtzIrXO3mthvJCBN0CvvX8C9sTbqsPkp0SkoqqP7PttODY8C3qD960OkKq+VNWjXSYvq2oR2G++++H4pg6o6rw1i2uUzZGKeUkdC1UsZ/J+q7nbRTMiMtqKAV+XcyLi/FPAO6BhpXKa/0xVf6jqA1XdlyO566uKJa/FyZ2FPTBvB4pLVBGRCWDCgt8GDgBbgI2Ao7Soql7f/wKHw+T2Hm7BYhJrIQDPQCEeJCJnWZLUSwlgvDWT2/HsGSm2auiYAYyBRBOROhCDOQFsAO4GyV2MOxZjMu2sSOqBZQy0AmPMLJjrGkt6UjHfrIiU0uKEADwDgy3GLjPr8D4D5OdXzFc3AUq1JoBQnWwVecyXa46lg2vIN10eBY0vpTV7tuyDyIbts2qHl5fx3IdWDKCtPggAfAzqPtPOwRUD+GLPsu39LPP9MpYmNmkWH8dPTFBcsDOqehp4D1yMb7VGubOvwK40sUmzZXdCk9grwN4IoFc9V9+6NVx4dI9k3Q2TLPVSarff8wlX7M/Ab2CbfU9m7feOAARAvOodN/kNrSoiI50kzw0gAuNKdNPq/h3o7+TG1DGAlbbV/XcM/APXR0eE+FHD/QAAAABJRU5ErkJggg==");
                        else
                            $("#ui_projection_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAACIElEQVRYheVXvUoDQRD+9AnuDZJHyANEzCOkS5vKOm/gdbZ5AIvYWAmmtPPshUQEQbAQCxVEiI0/CH5yMgPDZi63exEsHFhu53Kz33ezM99tNkjiL23zT9F/mcAQwAeATwAzAIOoqHIL1hwdkgV9+yQ5IzmowlgHPCM5NrALkjnJPZI3JL8CSq8kj0l2f4PASADVpiTbznNKJrSrpgR6JOdmsbncq4trkTwMSCQRKN9uEqR7lLhdlvh5CoE8SPdEFmwC/i7XPIZAmdpbA1xIxadum2aufIlrmfdWEWhLUdl0DxsWqwXfMmtmHoFMUmNtnJhuD7y0vry1Fi48Ak8m4L6irZqAa/ZOxD+qIhBarYolgPfNvUEVAa3UR0fFlEy3AXjbdNEkjLGO6nlf/CRJrQC3LTj3SFtHdT13Htwn+eBsk5I5csDDLnBryjraAeMVKW6tIBOCD839Srm2jhZKEVlsSuZN4g7Nbx0D7mXUJeD2acRQtVSVzMy9aV28dTLDOha87cRoMd/GiJg9ki3MPIs8hnXkeibXHMA2gBcA/WBN18Iz4UWwcJ315PdC5rvijwDMYxYICSjj2AwogXsAU5kfAJhExi99DbWfF1LhdTWgdtmwgJcI7AR9/SVq6H0PtGue68QmhQBEYgvRf2uqeq1AuGrFJpWAHaOK70GphHexYrMOAR2qeq9cttOm4CkEwi2ayRYt1jgx/Yx//u8YwDfHJPB+vmSCFAAAAABJRU5ErkJggg==");
                    }
                    else {
                        view.Control.Camera.Projection = PROJECTION_MODES.Orthographic;
                        //$("#ui_projection_text").text("평행");
                        if (view.Configuration.Thema.Type === THEMA_TYPES.Splitter)
                            $("#ui_projection_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAACPElEQVRYheWXMWgUQRSGv0gaCzFCQDtBLQWT3iJXWSh4FmLpiXYWBmxi4a95FtoIWlhZGEuxiaCFhSZFehOwU0Sx0U5FsBFOBt7IZN11Z+e8pHBguZ3Zm/n/ffPPe/9ODIdDtrPt2FZ0YLJ0opnNAC+APcA74LGkK13XKdoCMxsADxoefwKeATckffinBMxsCrgDnPWhJ8BT4CJwuCaiP4DnwG1JayMR8JAvAUd8aFHS9cp/jgKXgWPAzsoSP4HXwC1JjzoRMLO+g+8GvgJ9Sastc/YDV4HjwL7K4++SdmURMLMQ8kve3QDmJH1pZf3nOi+BXuxLmgi/jafA93s1CfldSfMFwFE3vbrntXnAzOaA9w4eQn6qEHzGXyKKdrGVgJkFYa34fseQLxeA95MIhpfoVUUb2mQyYcqFdtKHHgLzhfudrZtUA2+Aab9fkTQoAO6sm5TAdHLfM7Nhl6zmullOjuogZ+vqTsF6ktXC+T0fLjNrzGqum2ve3XDw9TbwWgKSZqnPauEKwuqbWcxq94ATo+imMQ/4W65Rn9XCvHDE7idTzklaygVuJVAhE/b/Quyb2U3gNHDQh2ZzQ15tRYYk1H1Jh5J+Frgnpk1tyxyRe4hX3v0Yx4sdUQfgOg/xO8eMlUCOhxgbgVwPMRYCpbUgTn5b6nBHrQWfgb1+thfMbGErasEmS2ZmZwJ4rsP1goUbjaJa0OgJMx1uNbF0rgW5rvhvDje2olpQ+mUUa8EB4JurvKgW/Odfx8Av06Ma+bJKhrsAAAAASUVORK5CYII=");
                        else
                            $("#ui_projection_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABhUlEQVRYhcWXzY3CQAyFzVaQDmiBAjhQAjeuOVAIN64UsAc6gApogRSQGwdWQiuttBIXJN4q0gwyw0zGdsjG0oj8jMef4jdjMwJAQ9rHoNE7AkyI6JuI7kRUE9HatEqTAsMokbYzgE8AY8m62uAFgC0LvQewBHAEcIsgXQHsAEzfATABULHFV5E5UxfwGoG5OdCFBWAO4Mct1PzOBD5jl4pzBOZXA7BhjpVLg0U3hwAiC1AEn3xjDBzqRgQwCz753Bg8ppssAJ9UuUUswVO6SQIUblt523bId5tukgAX9vLQId853SQBYqY51aS6yQJYTjWNbrIA/l5yqi0NuhED8NF2qnkrhToxAYRjDaBmPpqt+hSHd0T+YqSp5kqfpoc4cp//7IhKFvz0eGpMgcYn1kM8hNo3QLaH6BNA1EP0BSDuIWKL1W6bWQDUPQS/+cKr5WoBBzD1EOGDhbIWcHHxTy4+mNpeSmpBaOoeQjrxnbXABBAOXwvuLt/Wtu2pFgxiw/47JqI/Uf1aiMFmIFYAAAAASUVORK5CYII=");
                    }
                });
            }

            // InitPos
            if ($("#ui_camera_fitall").length > 0) {
                $('#ui_camera_fitall').attr('data-tooltip-text', 'Reset View');
                $("#ui_camera_fitall").click(function () {
                    view.Control.Camera.InitPos();
                });
            }
            if ($("#ui_camera_set").length > 0) {
                if ($("#ui_camera_plusx").length > 0) {
                    $('#ui_camera_plusx').attr('data-tooltip-text', '+X');
                    $("#ui_camera_plusx").click(function () {
                        view.Control.Camera.Direction = CAMERA_DIRECTIONS.PlusX;
                        $("#ui_camera_plusx").addClass('clck');
                        $("#ui_camera_minusx").removeClass('clck');
                        $("#ui_camera_plusy").removeClass('clck');
                        $("#ui_camera_minusy").removeClass('clck');
                        $("#ui_camera_plusz").removeClass('clck');
                        $("#ui_camera_minusz").removeClass('clck');
                        $("#ui_camera_plusiso").removeClass('clck');
                        $("#ui_camera_minusiso").removeClass('clck');

                        var src = $("#ui_camera_plusx_img").attr("src");
                        if (src)
                            $("#ui_camera_img").attr("src", src);
                        else
                            $("#ui_camera_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABHElEQVRYhe2W4Q2CMBBGP4z/dRRGYAQ30BHc4LgNHEE3cISO4CgwAaaGNFhb7hAo0XAJEJLm3msL18uapsGSsVmU/oVACaAZeV0HCTBzzsznwVMLxw3ACUCuErBwAAbAfmK4EQU68N0McJczKJAKHhRICf8QSA23sfXeCwCXwDjjPaWo2jzihOashBI8sze3Asxc9iQzRGTaFSoEsGmvg2Yru1tAisSFYhyg36rfOwtWgVXg/wT8UiyF5v8eVLY1AjWAeyeptsioxkoCFl4Q0aNtyzSd0atsM3OsbFdE5A68PoEu3DaSRwXcSUTKdu1LxT7CMfBYuJySQDJ4SCAp3BdIDvcFpoZXEtzGW0s2EZyJqK+7igssEcueBQCeKn+ZIQl35yYAAAAASUVORK5CYII=");

                    });
                }
                if ($("#ui_camera_minusx").length > 0) {
                    $('#ui_camera_minusx').attr('data-tooltip-text', '-X');
                    $("#ui_camera_minusx").click(function () {
                        view.Control.Camera.Direction = CAMERA_DIRECTIONS.MinusX;
                        $("#ui_camera_plusx").removeClass('clck');
                        $("#ui_camera_minusx").addClass('clck');
                        $("#ui_camera_plusy").removeClass('clck');
                        $("#ui_camera_minusy").removeClass('clck');
                        $("#ui_camera_plusz").removeClass('clck');
                        $("#ui_camera_minusz").removeClass('clck');
                        $("#ui_camera_plusiso").removeClass('clck');
                        $("#ui_camera_minusiso").removeClass('clck');

                        var src = $("#ui_camera_minusx_img").attr("src");
                        if (src)
                            $("#ui_camera_img").attr("src", src);
                        else
                            $("#ui_camera_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAA0klEQVRYhe2Wyw3CMBBEJ4g7rVACJVACnUzcQVqgE5dAKUkFRrYMskhgc7B3D3ikVRQp2vfsyJ8hhADLHEzpAI57PnLOnQF4AKcKzDvJ2+tFnIEW8NxTFmgI96JAY/i756aAFnxTQBO+EtCGx3wuwwuAqQJ8JjntGVCznVCCkxzis5yBsRLb57ru+ZWlACsJoFznUszPgi7QBbrA3woslgJLPvRMBBKc5MNCYAXXFNiEawl8hWsI/IS3FpgleEq8kuWqlbHoKVZ5I0p3NO3YbsUAnvWizoBpwhvvAAAAAElFTkSuQmCC");
                    });
                }
                if ($("#ui_camera_plusy").length > 0) {
                    $('#ui_camera_plusy').attr('data-tooltip-text', '+Y');
                    $("#ui_camera_plusy").click(function () {
                        view.Control.Camera.Direction = CAMERA_DIRECTIONS.PlusY;
                        $("#ui_camera_plusx").removeClass('clck');
                        $("#ui_camera_minusx").removeClass('clck');
                        $("#ui_camera_plusy").addClass('clck');
                        $("#ui_camera_minusy").removeClass('clck');
                        $("#ui_camera_plusz").removeClass('clck');
                        $("#ui_camera_minusz").removeClass('clck');
                        $("#ui_camera_plusiso").removeClass('clck');
                        $("#ui_camera_minusiso").removeClass('clck');

                        var src = $("#ui_camera_plusy_img").attr("src");
                        if (src)
                            $("#ui_camera_img").attr("src", src);
                        else
                            $("#ui_camera_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABGklEQVRYhe2X4Q2DIBCFn03/t6M4giN0g3YENzhvA0doN2GEjqIT2GDUIBE4ouKP+v4Qkwvf85AHZl3X4UhdDqUDuMYUM3MFgFYyP0T0Gh8kHcgBlCuhMzgz51IDulABuG8MVxIDY+FtB/g0p8tAErjLQDL4koGkcC17GxYA6oU6ZY0hNURUh+BauyVhCE5EmR7NDlSe+fREipmLoUs+KSLS9Q/JUpoGQgmnBrgkCaVLdfxZcBo4DZwGom5Ewv0dFdtmFLsyuR0C6CuyGKlQByY4M5fCm1EfxZ7Y7g+q8cFnwIS/ATwj3s0V261tyvURroG71M9JRLOlXDKQDL5kICncNpAcbhvYGt6E4FrmLtgSDnOr+fTnf8cAfnFajtF7hmIoAAAAAElFTkSuQmCC");
                    });
                }
                if ($("#ui_camera_minusy").length > 0) {
                    $('#ui_camera_minusy').attr('data-tooltip-text', '-Y');
                    $("#ui_camera_minusy").click(function () {
                        view.Control.Camera.Direction = CAMERA_DIRECTIONS.MinusY;
                        $("#ui_camera_plusx").removeClass('clck');
                        $("#ui_camera_minusx").removeClass('clck');
                        $("#ui_camera_plusy").removeClass('clck');
                        $("#ui_camera_minusy").addClass('clck');
                        $("#ui_camera_plusz").removeClass('clck');
                        $("#ui_camera_minusz").removeClass('clck');
                        $("#ui_camera_plusiso").removeClass('clck');
                        $("#ui_camera_minusiso").removeClass('clck');

                        var src = $("#ui_camera_minusy_img").attr("src");
                        if (src)
                            $("#ui_camera_img").attr("src", src);
                        else
                            $("#ui_camera_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAAy0lEQVRYhe2X2wnDMAxFb0r/u0pG6AgdoZuo2iArdBOP0FGSCVwMTQiNW5lgSR/x/TAYjM9Bxq8uxgjPnFzpAM4lg5i5BxAAXCown0R0nztiBZTgfZGAIjyIAsrwZc6sgBU8K2AJ3whYw1O+t+EVwFABPhLRIMFTNE9CCd6lZqkAMz8qgQMRJfCtZCnXS0CVBLDe51Lc74Im0ASawGEFJk+B6XPpuQjM8JeHwAZuKZCFWwn8hFsI/IVrC4wSPKXoa7YzRW/Lg/+OAbwB1ntMfOwzPIsAAAAASUVORK5CYII=");
                    });
                }
                if ($("#ui_camera_plusz").length > 0) {
                    $('#ui_camera_plusz').attr('data-tooltip-text', '+Z');
                    $("#ui_camera_plusz").click(function () {
                        view.Control.Camera.Direction = CAMERA_DIRECTIONS.PlusZ;
                        $("#ui_camera_plusx").removeClass('clck');
                        $("#ui_camera_minusx").removeClass('clck');
                        $("#ui_camera_plusy").removeClass('clck');
                        $("#ui_camera_minusy").removeClass('clck');
                        $("#ui_camera_plusz").addClass('clck');
                        $("#ui_camera_minusz").removeClass('clck');
                        $("#ui_camera_plusiso").removeClass('clck');
                        $("#ui_camera_minusiso").removeClass('clck');

                        var src = $("#ui_camera_plusz_img").attr("src");
                        if (src)
                            $("#ui_camera_img").attr("src", src);
                        else
                            $("#ui_camera_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAA4ElEQVRYhe2X0Q3CIBCGf43vrsIIjuAIbnKwQUeom3SEjtJOcOYaq20tpZorROVPeODlvo8jBNgxM1Jmn5T+hoAB0ABghVGOKssWBIZh5oZ1UgrLWmt6ZqgDsvIKwPHjHj9zBXBxzvU1uywJbAl/1PQJRIH7BKLB5wSiwiWHyfwEoFCAy5EtQvA5AQ14lzXwkYBzziqxKyIS8HnNVg47QEoCGJ7zUL7mLsgCWSAL/JxAm1KgvV96SQQ6OBHVKQRe4DEFZuGxBLzwGAKL8K0FmhBcMn2SqYWIVj3v/vx3DOAG2P7IEccdVA8AAAAASUVORK5CYII=");
                    });
                }
                if ($("#ui_camera_minusz").length > 0) {
                    $('#ui_camera_minusz').attr('data-tooltip-text', '-Z');
                    $("#ui_camera_minusz").click(function () {
                        view.Control.Camera.Direction = CAMERA_DIRECTIONS.MinusZ;
                        $("#ui_camera_plusx").removeClass('clck');
                        $("#ui_camera_minusx").removeClass('clck');
                        $("#ui_camera_plusy").removeClass('clck');
                        $("#ui_camera_minusy").removeClass('clck');
                        $("#ui_camera_plusz").removeClass('clck');
                        $("#ui_camera_minusz").addClass('clck');
                        $("#ui_camera_plusiso").removeClass('clck');
                        $("#ui_camera_minusiso").removeClass('clck');

                        var src = $("#ui_camera_minusz_img").attr("src");
                        if (src)
                            $("#ui_camera_img").attr("src", src);
                        else
                            $("#ui_camera_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABHklEQVRYhe2X4Q2DIBCFn43/21E6giN0g3YENzhvA0ewmzBCR9EJaDBqkKJAUPxRLyHE5OR7cPLATEqJI+NyKB1AHpLMzBUAimS+ieg1PjhXgJnvzFxGQmdwNaaXgCFRALhtDBdOAVridQf4NKZVQCq4VUBK+I+A1HAV5jYsANSWPGH0rmiJqPaZ0G5O6IITUab6XHuhWhlPEJFg5mJYpbXocwE8fEqpl8DlcGKA+zihb6mOPwtOAaeAU0DQjchzfwfZ9mTFzLzkyZ0yICL6+KoMCdcK6PDS82YkNNe02XarH3hrAnR4A+AZMLEl2+5MUUsfYQx8KUb4rJQ2AcngNgFJ4aaA5HBTwNbw1gXvQ/mA1hoZH5Ux5mr7879jAF+ZzP6b+DXT6gAAAABJRU5ErkJggg==");
                    });
                }
                if ($("#ui_camera_plusiso").length > 0) {
                    $('#ui_camera_plusiso').attr('data-tooltip-text', '+ISO');
                    $("#ui_camera_plusiso").click(function () {
                        view.Control.Camera.Direction = CAMERA_DIRECTIONS.PlusISO;
                        $("#ui_camera_plusx").removeClass('clck');
                        $("#ui_camera_minusx").removeClass('clck');
                        $("#ui_camera_plusy").removeClass('clck');
                        $("#ui_camera_minusy").removeClass('clck');
                        $("#ui_camera_plusz").removeClass('clck');
                        $("#ui_camera_minusz").removeClass('clck');
                        $("#ui_camera_plusiso").addClass('clck');
                        $("#ui_camera_minusiso").removeClass('clck');
                        var src = $("#ui_camera_plusiso_img").attr("src");
                        if (src)
                            $("#ui_camera_img").attr("src", src);
                        else
                            $("#ui_camera_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAACB0lEQVRYheVX7XGCQBBdM/kfOggdxA6kg5gKpAQ62NsKQgdiB6YD0oHpgHRAKtjMOnvkRA7Ow8QfeTOMyu3te7df4IKZ4Za4uyn7DAEZAFQA0OpV6b3LISkIvFJmNszcsB+N2qShfqcMEmbOmbkeIfWh1r1JjIA1M1fM3EYQ99Gqr/WUAAlbORHiuWiUo0vRUBEm8TU9iXPfTgQKzZfN++GKJz849ZAo11kKLCRfS723nFELrceXhVeAha1icFSH1EfjRBNGumhSgOvQ7e2sdxKLStdCZ0awAB+JjYp7Wp+4qwmwODjpgciiPe51n4Yxj8XF3L3uHPiMcBKLjssVkALACwC8/yLxu3Kk3R2bC2NMYYxJnCoO6f+Q+rHzIFWeRLjs3ntH3atcRLQDgBIRcx2d8lkAwOOFp5Uwl/a9gYiW+n2j67J2IsBCDDZEJOGqELFU40yFPE8Qv6l9LT+IKNdDrIaMhwRYyIYVERlVLmLWmr9CnVp8qY0QN0QkNkZtRiPXtSERhbTSToXUQ4tElCnpZmjdBSIupiIwBJueD62TCn7CLFF5utBf9EupEG2d39sY8r6A2w4iRPyzQaRcR5zUACLuAWDvVLFU/cNMUukQ8WsQsekvDhahGuZEdJVBhIitz2i0C3TjcRBpiwUPIl+rXiSgJ0Yc1poe7yAaCvMY/vm/YwD4Bmagap1CrIglAAAAAElFTkSuQmCC");
                    });
                }
                if ($("#ui_camera_minusiso").length > 0) {
                    $('#ui_camera_minusiso').attr('data-tooltip-text', '-ISO');
                    $("#ui_camera_minusiso").click(function () {
                        view.Control.Camera.Direction = CAMERA_DIRECTIONS.MinusISO;
                        $("#ui_camera_plusx").removeClass('clck');
                        $("#ui_camera_minusx").removeClass('clck');
                        $("#ui_camera_plusy").removeClass('clck');
                        $("#ui_camera_minusy").removeClass('clck');
                        $("#ui_camera_plusz").removeClass('clck');
                        $("#ui_camera_minusz").removeClass('clck');
                        $("#ui_camera_plusiso").removeClass('clck');
                        $("#ui_camera_minusiso").addClass('clck');
                        var src = $("#ui_camera_minusiso_img").attr("src");
                        if (src)
                            $("#ui_camera_img").attr("src", src);
                        else
                            $("#ui_camera_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAACIElEQVRYheVX223jMBCcHO4/6uBUgjs4dxB3cEoFcQfkdpAOzqkgTgdKB04HcgdKBTxsMBQohpIoxoE/boCFQYrcGXIfkm+cc7gmflyVHcDPtRtEpAawB9AYYyrO9QAOAB6NMd23CBCRLYnvEo9vATyoicgLhbRfFiAiesIdAAvgV6ZWFXgnImfuOxpj+lUCeM2W5LeZxDFU8F+9DRE5qr9UeEYCRGTHa/5dSJqCHuCPmoi8MjxHv26oAhFRdc8XJo+hvp/JNRawIsaXwMBV2gfeANwH43vOrcbaPvCk9R6XmDFGe8CBpdow5lnIEfCuiUNijV3NsRJVXNPz+ce8iFg+3y9V0fAuEJH4pfBKpweOU43ohr/h3hcKbOm3oZhRchtjPvambuCJpXLiCZuSRgTgzNo/MjwbHmAcHr0BNWvt3lpbcVw75w7Oud7Nw++fQ09fNXkq5fJ7EThR2znn2gWHIXIEhGjJMXCG3wNdQS9I5UAOzkzmkYCSL5NSAcPeqzcirIyjJtOW6zVh9zSfvFuuyc6fHAGaxdZn8QxJKK7mnrkqWhSgGdtEp+0yTtZFt9JMVNakAD3JhnObzH6QQj/ha1KAV11R9amAdAon+qyC2/wkQOP2WHjaXPTk8PmULMPJD8gL4LPvqBWHLbk09jF8LuxSXFMCvFUzWbyENoj7JMeSgDhH7EIpdlHPWLQ1AkLbBiHqoya0yv7zf8cA/gG9Pcxsu3JUYAAAAABJRU5ErkJggg==");
                    });
                }
            }

            if ($("#ui_clipping_xy").length > 0
                && $("#ui_clipping_yz").length > 0
                && $("#ui_clipping_zx").length > 0
                && $("#ui_clipping_img").length > 0
                && $("#ui_clipping").length > 0
            ) {
                $('#ui_clipping_xy').attr('data-tooltip-text', 'Cutting Plane Z');
                $('#ui_clipping_yz').attr('data-tooltip-text', 'Cutting Plane X');
                $('#ui_clipping_zx').attr('data-tooltip-text', 'Cutting Plane Y');

                $("#ui_clipping_xy").click(function () {
                    view.Clipping.Enable(true, CLIPPING_MODES.Z);

                    $("#ui_clipping_xy").addClass('clck');
                    $("#ui_clipping_yz").removeClass('clck');
                    $("#ui_clipping_zx").removeClass('clck');
                    $("#ui_clipping").addClass('clck');

                    var src = $("#ui_clipping_xy_img").attr("src");
                    if (src)
                        $("#ui_clipping_img").attr("src", src);
                    else
                        $("#ui_clipping_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABNUlEQVRYhe2XMRKCMBBFv460yFFS0+gR9AZ6MvUEegRtqG3oPQKhpYizmuiKCYIELOTP7AyZwL7PJiwwUkrhlxr/lP73BgYDTQysAGQAlKc4m8STmvDN9/doVVTXwANeFAWSJEGe541pYRgijmMEQUBDSrAwc1WNiE7adwCf8SVwGRAATnR9l3CSbRN2DV/puKlcgT7u3ABHZQMPOA3SNIWUsjGcoEKIqrI7DdBzPm1MdMu65mUDfA9cPMKlA/4m3geERwMuvTF4BSLeoVrKlofgR3383Fy0B3ScdaBlbHWeiOURSqlM3ZXp8W2Ow4zaGjCaf4JTdP06NmWf6rLP63TC3uAk3gdens8Wsr1clgAOtpR9fBGtXXCS7XvA548CwbdVJ/AK7DyCZR04afgzGgz8uQEAVxbyWWEoTMxnAAAAAElFTkSuQmCC");
                });

                $("#ui_clipping_yz").click(function () {
                    view.Clipping.Enable(true, CLIPPING_MODES.X);

                    $("#ui_clipping_yz").addClass('clck');
                    $("#ui_clipping_xy").removeClass('clck');
                    $("#ui_clipping_zx").removeClass('clck');
                    $("#ui_clipping").addClass('clck');
                    var src = $("#ui_clipping_yz_img").attr("src");
                    if (src)
                        $("#ui_clipping_img").attr("src", src);
                    else
                        $("#ui_clipping_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABB0lEQVRYhe2X3Q2CMBSFP4zvmrCAPvGKGzAKI7CJbKAjOIIbqI8MQYITYEpaUwtYRLQx9iQ3JDTlfL389BDUdY1LzZy6/wpAClRAPVFV+sVtz4Aw3729zLYCdcbWgVQeL8BGTny11sC1z2BuAdgDRyA3W/eCVsBCQizMad94DVeykwfgpHyfAWTAcgLjSnZOlzK7A5i3QJhvJzDXZUI8yARoVl6WZVNjFYZhU0M62fkQCvOiKEYDRFGkAKzyn2IP4AE8wF8BxC4BYpkrMMPJtwByLZRk+oAtEU0pYZ4AZxcASd9AJ4DYSsWWOlZDt+IugIrHQPGurEHWBFDx6VOZsCX/c+oWALgBX4JJVxZHKrIAAAAASUVORK5CYII=");
                });

                $("#ui_clipping_zx").click(function () {
                    view.Clipping.Enable(true, CLIPPING_MODES.Y);

                    $("#ui_clipping_zx").addClass('clck');
                    $("#ui_clipping_yz").removeClass('clck');
                    $("#ui_clipping_xy").removeClass('clck');
                    $("#ui_clipping").addClass('clck');
                    var src = $("#ui_clipping_zx_img").attr("src");
                    if (src)
                        $("#ui_clipping_img").attr("src", src);
                    else
                        $("#ui_clipping_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABS0lEQVRYhe2Xz22DMBjFX6qcERIXLkjdoN6gGaGdoNmgI7TdoCOQDbJBO4J75BbBApQjHBy5+kxRZPyHxnAoT/qQLT3ze7KNsDdCCCypm0XpEwPEAD4BiJGqAbCB/518D9cIoOD3jv4cwDO1mc7gE0DB76h/ALDRlPRxgj9Z3yo3oUPFQggufpVbxuTK2batar7qvEHhZVmKoiiMAWxLoJv2vcHfT3tVVeCcW1fAFCA4XGrrCP8iwI76NW20P8FNAfYDOKj9ceF5BHAk7yS41NgSxJZx3wBO1L6Vj6ZpvOGmAEpvlm+9V9d13nCXAMG1BlgDrAGCB4iiaLkAjDGkaaq69awBJDzLMtVVP7N5Amjgu9lmwAd+9QAX8IMNLjV2HvBWkiQ/NYCbTk+9QuwBZ7iULcCL4+1nEtwU4EinHhepg4k3XOqf344BnAH5oC9/LqtvRAAAAABJRU5ErkJggg==");
                });
            }

            if ($("#ui_clipping_inverse").length > 0) {
                $('#ui_clipping_inverse').attr('data-tooltip-text', 'Cutting Plane Toggle');
                $("#ui_clipping_inverse").click(function () {
                    view.Clipping.Inverse();

                });
            }
            if ($("#ui_clipping_disable").length > 0) {
                $('#ui_clipping_disable').attr('data-tooltip-text', 'Cutting Plane Reset');
                $("#ui_clipping_disable").click(function () {
                    view.Clipping.Enable(false);
                    view.Clipping.Option.Visible = false;

                    $("#ui_clipping").removeClass('clck');
                    $("#ui_clipping_yz").removeClass('clck');
                    $("#ui_clipping_xy").removeClass('clck');
                    $("#ui_clipping_zx").removeClass('clck');

                    if (view.Configuration.Thema.Type === THEMA_TYPES.Splitter)
                        $("#ui_clipping_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABn0lEQVRYheVXu23DMBB9CdLHsAZI0qj2CBlBnsAeQV7g4NwC0QjZIBohnVttILtUadUGHDA4BhfqY31oucgDDMJHgu/dO54o3Z3PZ9wS9zdlB/AwJRkzLwAkADIiiicVIORfAB51fJISOORHALGda3SAmc2imScNsSJ/JaKsVYCQv3sit6iQNwqwmQdBgPl8PoitLEsURaFDW5e8TcAPDHkYhoPI8zy3f49CntSt9d4Fhny32+F0OqHJdg2vXdBEzszPVxfQQh4ByGW8joALti+c0a+AvjX3KqAjeQrgIGMFg7uga+YS83sIx9qu0duBvuRyERn7o7p1vRwYmLlpvycZK+gswKftGp0EjCTPnLGfgLGZE5Gp/4uMFbQeQnurjbWdiPZNc60OmPvcR82Zed0016UN3YvFPtNTK0hazZ7yTNvNzB8AVsw8q3snqAiQzWIV2qor9VPF1+oJl0qr2T1MzfeS+aotuz8lqHl73VjVUsclgDf56b6OVHxpa05EJvuN3sfF76dZDbmXPr8E7UAyNbmB2wWTkhv8869jAN++OT1lTm52awAAAABJRU5ErkJggg==");
                    else
                        $("#ui_clipping_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAABeUlEQVRYheVXy3GDMBTcZMKV5Mgt0AFnTinBqcAugRJSgktwCS7BJXDlFFIAM3YF8jwszYhnWSB4mEN2RqNBfPZ9peVFKYU18boq+woG5ABOAPZm4W0F8vfeKtXAE0aulDqrG876uuP1RaAE8CHkfak9vwD4AlANRaBU8uh5PhSBzvO2bbsxBXEcI0kS+82fnuca3iIk8rqug+mJPMsyc3nR5HvXs+JdQORFUSCKIjhzziC6D3jI08UN8JBvAPzqeRkDBsKes1nWgNCcixowkvwI4E/Pd5jcBQGeyxfh3LDPMmACORVfA4kinOg5td/n7DaUDHuwATPJKzb3MNgFAp5T+2W6DsIMMKeaQNid5ARvCug8F8r57tGNMRsRP1hMOx3Zfm+qvGK73gHAVouce03gkGO2gFRantF6ykRaY73TsHupXt85vuOVZLZ05kqG8vjNImCwYREwOT9YwtapiB557hSQSwz7o6dnk9PgXSC2w43FP/87BnAFKZ1vLjbYOEMAAAAASUVORK5CYII=");
                });
            }

            if ($("#ui_clipping").length > 0) {
                $("#ui_clipping").click(function () {
                    //view.Clipping.Option.Visible = !view.Clipping.Option.Visible;
                    if (view.Clipping.Option.Visible)
                        $("#ui_clipping").addClass('clck');
                    else
                        $("#ui_clipping").removeClass('clck');
                });
            }

            if ($("#ui_measure_2posdistance").length > 0) {
                $('#ui_measure_2posdistance').attr('data-tooltip-text', 'Distance');
                $("#ui_measure_2posdistance").click(function () {
                    if (view.Note.ReviewMode) {
                        view.Note.End();
                        scope.Refresh();
                    }
                    if (view.Measure.ReviewMode) {
                        view.Measure.End();
                        if (view.Measure.ReviewType !== REVIEW_TYPES.RK_MEASURE_DISTANCE)
                            view.Measure.Start(REVIEW_TYPES.RK_MEASURE_DISTANCE);
                    }
                    else
                        view.Measure.Start(REVIEW_TYPES.RK_MEASURE_DISTANCE);

                    if (view.Measure.ReviewMode) {
                        $("#ui_measure_2posdistance").addClass('clck');
                        $("#ui_measure_coordinate").removeClass('clck');
                        $("#ui_measure_angle").removeClass('clck');
                    }
                    else
                        $("#ui_measure_2posdistance").removeClass('clck');
                });
            }

            if ($("#ui_measure_coordinate").length > 0) {
                $('#ui_measure_coordinate').attr('data-tooltip-text', 'Coordinate');
                $("#ui_measure_coordinate").click(function () {
                    if (view.Note.ReviewMode) {
                        view.Note.End();
                        scope.Refresh();
                    }
                    if (view.Measure.ReviewMode) {
                        view.Measure.End();
                        if (view.Measure.ReviewType !== REVIEW_TYPES.RK_MEASURE_POS)
                            view.Measure.Start(REVIEW_TYPES.RK_MEASURE_POS);
                    }
                    else
                        view.Measure.Start(REVIEW_TYPES.RK_MEASURE_POS);

                    if (view.Measure.ReviewMode) {
                        $("#ui_measure_coordinate").addClass('clck');
                        $("#ui_measure_angle").removeClass('clck');
                        $("#ui_measure_2posdistance").removeClass('clck');
                    }
                    else
                        $("#ui_measure_coordinate").removeClass('clck');

                });
            }

            if ($("#ui_measure_angle").length > 0) {
                $('#ui_measure_angle').attr('data-tooltip-text', 'Angle');
                $("#ui_measure_angle").click(function () {
                    if (view.Note.ReviewMode) {
                        view.Note.End();
                        scope.Refresh();
                    }
                    if (view.Measure.ReviewMode) {
                        view.Measure.End();
                        if (view.Measure.ReviewType !== REVIEW_TYPES.RK_MEASURE_ANGLE)
                            view.Measure.Start(REVIEW_TYPES.RK_MEASURE_ANGLE);
                    }
                    else
                        view.Measure.Start(REVIEW_TYPES.RK_MEASURE_ANGLE);

                    if (view.Measure.ReviewMode) {
                        $("#ui_measure_angle").addClass('clck');
                        $("#ui_measure_coordinate").removeClass('clck');
                        $("#ui_measure_2posdistance").removeClass('clck');
                    }
                    else
                        $("#ui_measure_angle").removeClass('clck');
                });
            }

            if ($("#ui_measure_delete").length > 0) {
                $('#ui_measure_delete').attr('data-tooltip-text', 'Delete all');
                $("#ui_measure_delete").click(function () {
                    view.Measure.DeleteAll();
                });
            }

            if ($("#ui_note_surface").length > 0) {
                $('#ui_note_surface').attr('data-tooltip-text', 'Surface Note');
                $("#ui_note_surface").click(function () {
                    if (view.Measure.ReviewMode) {
                        view.Measure.End();
                        scope.Refresh();
                    }

                    if (view.Note.ReviewMode) {
                        view.Note.End();
                        if (view.Note.ReviewType !== REVIEW_TYPES.RK_SURFACE_NOTE)
                            view.Note.Start(REVIEW_TYPES.RK_SURFACE_NOTE);
                    }
                    else
                        view.Note.Start(REVIEW_TYPES.RK_SURFACE_NOTE);

                    if (view.Note.ReviewMode) {
                        $("#ui_note_surface").addClass('clck');
                        $("#ui_note_3d").removeClass('clck');
                        $("#ui_note_2d").removeClass('clck');
                    }
                    else
                        $("#ui_note_surface").removeClass('clck');
                });
            }

            if ($("#ui_note_3d").length > 0) {
                $('#ui_note_3d').attr('data-tooltip-text', '3D Note');
                $("#ui_note_3d").click(function () {
                    if (view.Measure.ReviewMode) {
                        view.Measure.End();
                        scope.Refresh();
                    }
                    if (view.Note.ReviewMode) {
                        view.Note.End();
                        if (view.Note.ReviewType !== REVIEW_TYPES.RK_3D_NOTE)
                            view.Note.Start(REVIEW_TYPES.RK_3D_NOTE);
                    }
                    else
                        view.Note.Start(REVIEW_TYPES.RK_3D_NOTE);

                    if (view.Note.ReviewMode) {
                        $("#ui_note_3d").addClass('clck');
                        $("#ui_note_surface").removeClass('clck');
                        $("#ui_note_2d").removeClass('clck');
                    }
                    else
                        $("#ui_note_3d").removeClass('clck');
                });
            }

            if ($("#ui_note_2d").length > 0) {
                $('#ui_note_2d').attr('data-tooltip-text', '2D Note');
                $("#ui_note_2d").click(function () {
                    if (view.Measure.ReviewMode) {
                        view.Measure.End();
                        scope.Refresh();
                    }
                    if (view.Note.ReviewMode) {
                        view.Note.End();
                        if (view.Note.ReviewType !== REVIEW_TYPES.RK_2D_NOTE)
                            view.Note.Start(REVIEW_TYPES.RK_2D_NOTE);
                    }
                    else
                        view.Note.Start(REVIEW_TYPES.RK_2D_NOTE);

                    if (view.Note.ReviewMode) {
                        $("#ui_note_2d").addClass('clck');
                        $("#ui_note_surface").removeClass('clck');
                        $("#ui_note_3d").removeClass('clck');
                    }
                    else
                        $("#ui_note_2d").removeClass('clck');
                });
            }

            if ($("#ui_note_delete").length > 0) {
                $('#ui_note_delete').attr('data-tooltip-text', 'Delete all');
                $("#ui_note_delete").click(function () {
                    view.Note.DeleteAll();
                });
            }

            if ($("#ui_property_visible").length > 0) {
                $('#ui_property_visible').attr('data-tooltip-text', 'Property');
                $("#ui_property_visible").click(function () {
                    view.Property.Option.Visible = !view.Property.Option.Visible;
                    if (view.Property.Option.Visible)
                        $("#ui_property_visible").addClass('clck');
                    else
                        $("#ui_property_visible").removeClass('clck');
                });
            }

            //Snapshot
            if ($("#ui_snapshot").length > 0) {
                $('#ui_snapshot').attr('data-tooltip-text', 'Snapshot');
                $("#ui_snapshot").click(function () {
                    view.Snapshot();
                });
            }

            // Configuration
            if ($("#ui_config_visible").length > 0) {
                $('#ui_config_visible').attr('data-tooltip-text', 'Config');
                $("#ui_config_visible").click(function () {
                    view.Configuration_UI.Option.Visible = !view.Configuration_UI.Option.Visible;
                    if (view.Configuration_UI.Option.Visible)
                        $("#ui_config_visible").addClass('clck');
                    else
                        $("#ui_config_visible").removeClass('clck');
                });
            }

            if ($("#ui_drawing").length > 0) {

                if ($("#ui_drawing_free").length > 0) {
                    $('#ui_drawing_free').attr('data-tooltip-text', 'Free Line');
                    $("#ui_drawing_free").click(function (event) {
                        if (view.Drawing.DrawingMode) {
                            view.Drawing.Continue(DRAWING_TYPES.FREE);
                        }
                        else
                            view.Drawing.Start(DRAWING_TYPES.FREE);

                        if (view.Drawing.DrawingMode) {
                            $("#ui_drawing_free").addClass('clck');
                            $("#ui_drawing_line").removeClass('clck');
                            $("#ui_drawing_quadrangle").removeClass('clck');
                            $("#ui_drawing_circle").removeClass('clck');
                        }
                        else
                            $("#ui_drawing_free").removeClass('clck');
                    });
                }

                if ($("#ui_drawing_circle").length > 0) {
                    $('#ui_drawing_circle').attr('data-tooltip-text', 'Circle');
                    $("#ui_drawing_circle").click(function () {
                        if (view.Drawing.DrawingMode) {
                            view.Drawing.Continue(DRAWING_TYPES.CIRCLE);
                        }
                        else
                            view.Drawing.Start(DRAWING_TYPES.CIRCLE);

                        if (view.Drawing.DrawingMode) {
                            $("#ui_drawing_free").removeClass('clck');
                            $("#ui_drawing_line").removeClass('clck');
                            $("#ui_drawing_quadrangle").removeClass('clck');
                            $("#ui_drawing_circle").addClass('clck');
                        }
                        else
                            $("#ui_drawing_circle").removeClass('clck');
                    });
                }

                if ($("#ui_drawing_quadrangle").length > 0) {
                    $('#ui_drawing_quadrangle').attr('data-tooltip-text', 'Quadrangle');
                    $("#ui_drawing_quadrangle").click(function () {
                        if (view.Drawing.DrawingMode) {
                            view.Drawing.Continue(DRAWING_TYPES.QUADRANGLE);
                        }
                        else
                            view.Drawing.Start(DRAWING_TYPES.QUADRANGLE);

                        if (view.Drawing.DrawingMode) {
                            $("#ui_drawing_free").removeClass('clck');
                            $("#ui_drawing_line").removeClass('clck');
                            $("#ui_drawing_quadrangle").addClass('clck');
                            $("#ui_drawing_circle").removeClass('clck');
                        }
                        else
                            $("#ui_drawing_quadrangle").removeClass('clck');
                    });
                }

                if ($("#ui_drawing_line").length > 0) {
                    $('#ui_drawing_line').attr('data-tooltip-text', 'Line');
                    $("#ui_drawing_line").click(function () {
                        if (view.Drawing.DrawingMode) {
                            view.Drawing.Continue(DRAWING_TYPES.LINE);
                        }
                        else
                            view.Drawing.Start(DRAWING_TYPES.LINE);

                        if (view.Drawing.DrawingMode) {
                            $("#ui_drawing_free").removeClass('clck');
                            $("#ui_drawing_line").addClass('clck');
                            $("#ui_drawing_quadrangle").removeClass('clck');
                            $("#ui_drawing_circle").removeClass('clck');
                        }
                        else
                            $("#ui_drawing_line").removeClass('clck');
                    });
                }

                if ($("#ui_drawing_delete").length > 0) {
                    $('#ui_drawing_delete').attr('data-tooltip-text', 'Delete all');
                    $("#ui_drawing_delete").click(function () {
                        view.Drawing.DeleteAll();
                    });
                }

                if ($("#ui_drawing_close").length > 0) {
                    $('#ui_drawing_close').attr('data-tooltip-text', 'Close');
                    $("#ui_drawing_close").click(function () {
                        if (view.Drawing.DrawingMode) {
                            view.Drawing.End();
                            scope.Refresh();
                        }

                        if (view.Drawing.DrawingMode) {
                            $("#ui_drawing_free").removeClass('clck');
                            $("#ui_drawing_line").removeClass('clck');
                            $("#ui_drawing_quadrangle").removeClass('clck');
                            $("#ui_drawing_circle").removeClass('clck');
                        }
                    });
                }
            }


            if ($("#ui_toolbar_visible").length > 0) {
                $('#ui_toolbar_visible').attr('data-tooltip-text', 'Hide Toolbar');
                $("#ui_toolbar_visible").click(function () {
                    view.Toolbar.Option.Visible = !view.Toolbar.Option.Visible;
                    if (view.Toolbar.Option.Visible) {
                        $('#ui_toolbar_visible').attr('data-tooltip-text', 'Hide Toolbar');
                        $("#ui_toolbar_visible_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAAAOklEQVQ4jWMYBYMB/P////x/CDiP7B5ixRlBLJgkIyMjI5JCosSZGBgYLkD5FxhQAanio2CIAgYGBgCZdDOgxD75RwAAAABJRU5ErkJggg==");
                    }
                    else {
                        $('#ui_toolbar_visible').attr('data-tooltip-text', 'Show Toolbar');
                        $("#ui_toolbar_visible_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAAALElEQVQ4jWMYcMAIc8D/////ozuGkZGRkZAcE6U+GAYGDDwYjcahH40MDAwASwwQE2uZQ7IAAAAASUVORK5CYII=");
                    }
                });
            }

            



            $(".uibox").mouseover(function () {
                view.Lock(true);
            }).mouseout(function () {
                view.Lock(false);
            });

            // 모바일 버튼 제어
            if (view.Browser.Platform === PLATFORM_TYPES.Mobile) {
                if ($("#ui_pc_separator").length > 0) {
                    $("#ui_pc_separator").css('display', 'none');
                }

                if ($("#ui_note").length > 0) {
                    $('#ui_note').attr('disabled', false);
                    $("#ui_note").css('display', 'none');
                }
                if ($("#ui_measure").length > 0) {
                    $('#ui_measure').attr('disabled', false);
                    $("#ui_measure").css('display', 'none');
                }
            }
        }
    }

    function resize() {
        var rect = view.ViewSize();
        if ($("#ui_tree_collapse").length > 0) {
            $("#ui_tree_collapse").css('verticalAlign', 'middle');
        }



        if ($("#ui_configuration_div").length > 0) {
            $("#ui_configuration_div").css('width', '400px');
            $("#ui_configuration_div").css('height', '350px');
            $("#ui_configuration_div").css('margin', '-200px 0 0 -200px');

            var height = $("#ui_configuration_div").height();
            var width = $("#ui_configuration_div").width();
            if (rect.height < height) {
                $("#ui_configuration_div").css('height', rect.height / 2 + 'px');
                $("#ui_configuration_div").css('margin', (-rect.height / 2 + 50) + 'px 0 0 ' + -width / 2 + 'px');
            }
            height = $("#ui_configuration_div").height();
            if (rect.width < width) {
                $("#ui_configuration_div").css('width', rect.width * 0.6 + 'px');
                $("#ui_configuration_div").css('margin', -height / 2 + 'px 0 0 ' + -rect.width * 0.6 / 2 + 'px');
            }
        }


        if (view.Configuration.Thema.Type !== THEMA_TYPES.Splitter) {
            if (view.Browser.Platform === PLATFORM_TYPES.Mobile) {
                if (rect.width > rect.height) {
                    if ($("#VIZWeb3D_Toolbar").length > 0) {
                        $("#VIZWeb3D_Toolbar").removeClass('uicontainer_mobile');
                        $("#VIZWeb3D_Toolbar").addClass('uicontainer');
                    }

                    //if ($("#ui_property_drag").length > 0) {
                    //    $("#ui_property_drag").css('top', '10%');
                    //    $("#ui_property_drag").css('right', '0');
                    //    $("#ui_property_drag").css('width', '300px');
                    //    $("#ui_property_drag").css('height', '300px');
                    //}
                    if ($("#uinav_drag").length > 0) {
                        $("#uinav_drag").css('top', '0%');
                        $("#uinav_drag").css('right', '0');
                        if (rect.width > 720)
                            $("#uinav_drag").css('width', '300px');
                        else
                            $("#uinav_drag").css('width', '50%');
                        $("#uinav_drag").css('height', '70%');
                    }

                    if ($("#ui_property_drag").length > 0) {
                        $("#ui_property_drag").css('top', '0%');

                        $("#ui_property_drag").css('right', '0px');

                        if (rect.width > 720) {
                            $("#ui_property_drag").css('width', '300px');
                            $("#ui_property_drag").css('left', '');
                        }
                        else {
                            $("#ui_property_drag").css('left', 'calc(50%)');
                            $("#ui_property_drag").css('width', '50%');
                        }
                        $("#ui_property_drag").css('height', '70%');
                    }
                    if ($("#ui_property_dragheader").length > 0) {
                        $("#ui_property_dragheader").css('height', '37px');
                    }


                    if ($(".ddbox").length > 0) {
                        $(".ddbox").css('margin', '-92px -23px');
                        $(".ddbox").css('width', '');
                    }

                    if ($(".uistart").length > 0) {
                        $(".uistart").css('borderTopRightRadius', '0px');
                        $(".uistart").css('borderTopLeftRadius', '5px');
                        $(".uistart").css('borderBottomLeftRadius', '5px');
                        $(".uistart").css('paddingLeft', '12px');
                        $(".uistart").css('borderRight', 'none');
                        $(".uistart").css('marginRight', '-2px');
                        $(".uistart").css('borderTop', 'solid');
                        $(".uistart").css('borderRight', 'none');
                        $(".uistart").css('borderLeft', 'solid');
                        $(".uistart").css('borderBottom', 'solid');
                        $(".uistart").css('borderWidth', '1px');
                    }

                    if ($(".uicenter").length > 0) {
                        $(".uicenter").css('marginLeft', '-3px');
                        $(".uicenter").css('marginRight', '-2px');
                        $(".uicenter").css('marginTop', '0px');
                        $(".uicenter").css('marginBottom', '0px');
                        $(".uicenter").css('borderTop', 'solid');
                        $(".uicenter").css('borderBottom', 'solid');
                        $(".uicenter").css('borderRight', 'none');
                        $(".uicenter").css('borderLeft', 'none');
                        $(".uicenter").css('borderWidth', '1px');
                    }

                    if ($(".uiend").length > 0) {
                        $(".uiend").css('borderBottomLeftRadius', '0px');
                        $(".uiend").css('borderTopLeftRadius', '0px');
                        $(".uiend").css('borderTopRightRadius', '5px');
                        $(".uiend").css('borderBottomRightRadius', '5px');
                        $(".uiend").css('paddingLeft', '12px');
                        $(".uiend").css('paddingRight', '12px');
                        $(".uiend").css('marginRight', '0px');
                        $(".uiend").css('marginLeft', '-3px');
                        $(".uiend").css('borderTop', 'solid');
                        $(".uiend").css('borderRight', 'solid');
                        $(".uiend").css('borderLeft', 'none');
                        $(".uiend").css('borderBottom', 'solid');
                        $(".uiend").css('borderWidth', '1px');
                    }

                    if ($(".uicenter_line").length > 0) {
                        $(".uicenter_line").css('borderTop', 'solid');
                        $(".uicenter_line").css('borderBottom', 'solid');
                        $(".uicenter_line").css('borderRight', 'none');
                        $(".uicenter_line").css('borderLeft', 'solid');
                        $(".uicenter_line").css('marginLeft', '-2px');
                        $(".uicenter_line").css('marginRight', '-2px');
                        $(".uicenter_line").css('borderWidth', '1px');
                    }

                    if ($(".uiend_line").length > 0) {
                        $(".uiend_line").css('borderBottomLeftRadius', '0px');
                        $(".uiend_line").css('borderTopLeftRadius', '0px');
                        $(".uiend_line").css('borderTopRightRadius', '5px');
                        $(".uiend_line").css('borderBottomRightRadius', '5px');
                        $(".uiend_line").css('paddingRight', '12px');
                        $(".uiend_line").css('borderTop', 'solid');
                        $(".uiend_line").css('borderBottom', 'solid');
                        $(".uiend_line").css('borderRight', 'solid');
                        $(".uiend_line").css('borderLeft', 'solid');
                        $(".uiend_line").css('marginLeft', '-2px');
                        $(".uiend_line").css('marginRight', '0px');
                        $(".uiend_line").css('borderWidth', '1px');
                    }
                }
                else {
                    if ($("#VIZWeb3D_Toolbar").length > 0) {
                        $("#VIZWeb3D_Toolbar").removeClass('uicontainer');
                        $("#VIZWeb3D_Toolbar").addClass('uicontainer_mobile');
                    }

                    //if ($("#ui_property_drag").length > 0) {
                    //    $("#ui_property_drag").css('top', '10%');
                    //    $("#ui_property_drag").css('right', '0px');
                    //    $("#ui_property_drag").css('width', '100px');
                    //    $("#ui_property_drag").css('height', '300px');
                    //}

                    if ($("#uinav_drag").length > 0) {
                        $("#uinav_drag").css('top', '0%');
                        $("#uinav_drag").css('right', '0px');
                        if (rect.width < 720) {
                            $("#uinav_drag").css('width', 'calc(100% - 120px)');
                            $("#uinav_drag").css('height', '50%');
                        }
                        else {
                            $("#uinav_drag").css('width', '50%');
                            $("#uinav_drag").css('height', '50%');
                        }
                    }

                    if ($("#ui_property_drag").length > 0) {
                        $("#ui_property_drag").css('top', '0%');
                        if (rect.width < 720) {
                            $("#ui_property_drag").css('top', '50%');
                            $("#ui_property_drag").css('left', '0px');
                            $("#ui_property_drag").css('width', 'calc(100% - 120px)');
                        }
                        else {
                            $("#ui_property_drag").css('right', '120px');
                            $("#ui_property_drag").css('width', 'calc(50% - 120px)');
                        }

                        $("#ui_property_drag").css('height', '50%');
                    }

                    if ($("#ui_property_dragheader").length > 0) {
                        $("#ui_property_dragheader").css('height', '37px');
                    }

                    if ($(".ddbox").length > 0) {
                        $(".ddbox").css('margin', '-139px 0px 0px -68px');
                        $(".ddbox").css('width', '32px');
                    }

                    if ($(".uistart").length > 0) {
                        $(".uistart").css('borderBottomLeftRadius', '0px');
                        $(".uistart").css('borderTopLeftRadius', '5px');
                        $(".uistart").css('borderTopRightRadius', '5px');
                        $(".uistart").css('borderBottomRightRadius', '0px');
                        $(".uistart").css('paddingLeft', '10px');
                        $(".uistart").css('marginRight', '0px');
                        $(".uistart").css('borderTop', 'solid');
                        $(".uistart").css('borderRight', 'solid');
                        $(".uistart").css('borderLeft', 'solid');
                        $(".uistart").css('borderBottom', 'none');
                        $(".uistart").css('borderWidth', '1px');
                    }

                    if ($(".uicenter").length > 0) {
                        $(".uicenter").css('marginLeft', '0px');
                        $(".uicenter").css('marginRight', '0px');
                        $(".uicenter").css('marginTop', '0px');
                        $(".uicenter").css('marginBottom', '0px');
                        $(".uicenter").css('borderTop', 'solid');
                        $(".uicenter").css('borderBottom', 'solid');
                        $(".uicenter").css('borderRight', 'solid');
                        $(".uicenter").css('borderLeft', 'solid');
                        $(".uicenter").css('borderWidth', '1px');
                    }

                    if ($(".uiend").length > 0) {
                        $(".uiend").css('borderBottomLeftRadius', '5px');
                        $(".uiend").css('borderTopLeftRadius', '0px');
                        $(".uiend").css('borderTopRightRadius', '0px');
                        $(".uiend").css('borderBottomRightRadius', '5px');
                        $(".uiend").css('paddingLeft', '10px');
                        $(".uiend").css('paddingRight', '10px');
                        $(".uiend").css('marginRight', '0px');
                        $(".uiend").css('marginLeft', '0px');
                        $(".uiend").css('borderTop', 'solid');
                        $(".uiend").css('borderRight', 'solid');
                        $(".uiend").css('borderLeft', 'solid');
                        $(".uiend").css('borderBottom', 'solid');
                        $(".uiend").css('borderWidth', '1px');
                    }

                    if ($(".uicenter_line").length > 0) {
                        $(".uicenter_line").css('borderTop', 'solid');
                        $(".uicenter_line").css('borderBottom', 'none');
                        $(".uicenter_line").css('borderRight', 'solid');
                        $(".uicenter_line").css('borderLeft', 'solid');
                        $(".uicenter_line").css('marginLeft', '0px');
                        $(".uicenter_line").css('marginRight', '0px');
                        $(".uicenter_line").css('borderWidth', '1px');
                    }

                    if ($(".uiend_line").length > 0) {
                        $(".uiend_line").css('borderBottomLeftRadius', '5px');
                        $(".uiend_line").css('borderTopLeftRadius', '0px');
                        $(".uiend_line").css('borderTopRightRadius', '0px');
                        $(".uiend_line").css('borderBottomRightRadius', '5px');
                        $(".uiend_line").css('paddingRight', '10px');
                        $(".uiend_line").css('borderTop', 'solid');
                        $(".uiend_line").css('borderBottom', 'solid');
                        $(".uiend_line").css('borderRight', 'solid');
                        $(".uiend_line").css('borderLeft', 'solid');
                        $(".uiend_line").css('marginLeft', '0px');
                        $(".uiend_line").css('marginRight', '0px');
                        $(".uiend_line").css('borderWidth', '1px');
                    }
                }


            }
        }
        else {
            if (view.Browser.Platform === PLATFORM_TYPES.Mobile) {
                if (rect.width > rect.height) {
                    if ($(".icon-bar").length > 0) {
                        $(".icon-bar").css('height', '40px');
                    }

                    if ($(".icon-bar img").length > 0) {
                        $(".icon-bar img").css('height', '32px');
                        $(".icon-bar img").css('width', '32px');
                    }

                    if ($(".icon-bar a").length > 0) {
                        $(".icon-bar a").css('height', '38px');
                        $(".icon-bar a").css('width', '38px');
                    }

                    if ($(".splitter-container").length > 0) {
                        $(".splitter-container").css('height', 'calc(100% - 40px)');
                    }

                    if ($(".submenu-render").length > 0) {
                        $(".submenu-render").css('height', '110px');
                        $(".submenu-render").css('width', '110px');
                    }
                    if ($(".submenu-camera").length > 0) {
                        $(".submenu-camera").css('height', '110px');
                        $(".submenu-camera").css('width', '110px');
                    }
                    if ($(".submenu-clipping").length > 0) {
                        $(".submenu-clipping").css('height', '76px');
                        $(".submenu-clipping").css('width', '110px');
                    }
                    if ($(".submenu-measure").length > 0) {
                        $(".submenu-measure").css('height', '76px');
                        $(".submenu-measure").css('width', '110px');
                    }
                    if ($(".submenu-note").length > 0) {
                        $(".submenu-note").css('height', '76px');
                        $(".submenu-note").css('width', '110px');
                    }
                }
                else {
                    if ($(".icon-bar").length > 0) {
                        $(".icon-bar").css('height', '40px');
                    }

                    if ($(".icon-bar img").length > 0) {
                        $(".icon-bar img").css('height', '32px');
                        $(".icon-bar img").css('width', '32px');
                    }

                    if ($(".icon-bar a").length > 0) {
                        $(".icon-bar a").css('height', '38px');
                        $(".icon-bar a").css('width', '38px');
                    }

                    if ($(".splitter-container").length > 0) {
                        $(".splitter-container").css('height', 'calc(100% - 40px)');
                    }

                    if ($(".submenu-render").length > 0) {
                        $(".submenu-render").css('height', '110px');
                        $(".submenu-render").css('width', '110px');
                    }
                    if ($(".submenu-camera").length > 0) {
                        $(".submenu-camera").css('height', '110px');
                        $(".submenu-camera").css('width', '110px');
                    }
                    if ($(".submenu-clipping").length > 0) {
                        $(".submenu-clipping").css('height', '76px');
                        $(".submenu-clipping").css('width', '110px');
                    }
                    if ($(".submenu-measure").length > 0) {
                        $(".submenu-measure").css('height', '76px');
                        $(".submenu-measure").css('width', '110px');
                    }
                    if ($(".submenu-note").length > 0) {
                        $(".submenu-note").css('height', '76px');
                        $(".submenu-note").css('width', '110px');
                    }
                }
            }
        }
    }

    function setSplitPos() {
        var widthLeft = leftSide.width();
        if (widthLeft === 0) {
            rightSide.width(rightSideWidth);
            leftSideWidth = window.innerWidth - rightSideWidth - splitterBar.width() / 2;
            leftSide.width(leftSideWidth);
            view.Tree.Option.Visible = true;
            view.Refresh();
        }
        else {
            rightSideWidth = rightSide.width(); //Backup
            leftSide.width(0);
            var rightWidth = window.innerWidth - leftSide.width() - splitterBar.width() / 2;
            rightSide.width(rightWidth);
            leftSideWidth = 0;
            view.Tree.Option.Visible = false;
            view.Refresh();
        }
    }

    this.SetSplitterPos = function (visible) {
        if (visible) {
            rightSide.width(rightSideWidth);
            leftSideWidth = window.innerWidth - rightSideWidth - splitterBar.width() / 2;
            leftSide.width(leftSideWidth);
            view.Refresh();
        }
        else {
            rightSideWidth = rightSide.width(); //Backup
            leftSide.width(0);
            var rightWidth = window.innerWidth - leftSide.width() - splitterBar.width() / 2;
            rightSide.width(rightWidth);
            leftSideWidth = 0;
            view.Refresh();
        }
    };

    this.Resize = function () {
        resize();
    };

    this.SetOption = function (parameters) {
        if (parameters === undefined) parameters = {};
        scope.Option.Visible = parameters.hasOwnProperty("Option") ? parameters["Option"].Visible : visible;

        if ($("#ui_ground_visible").length > 0) {
            if (view.Ground.Option.Visible) {
                $("#ui_ground_visible").addClass('clck');
            } else {
                $("#ui_ground_visible").removeClass('clck');
            }
        }

    };

    // API
    this.Option = {
        get 'Visible'() {
            return visible;
        },
        set 'Visible'(v) {
            visible = v;

            var toolbar = $("#uibox_toolbar");
            var toolbar_visible = $("#uibox_toolbar_visible");
            toolbar_visible.css({ visibility: "visible" });
            if (toolbar.length > 0)
                if (visible) {
                    toolbar.css({ visibility: "visible" });
                    toolbar.css({ display: "inline-block" });
                }
                else {
                    toolbar.css({ visibility: "hidden" });
                    toolbar.css({ display: "none" });
                }
        }
    };

    this.Refresh = function () {
        if (view.Measure.ReviewMode) {
            if (view.Measure.ReviewType === REVIEW_TYPES.RK_MEASURE_DISTANCE)
                $("#ui_measure_2posdistance").addClass('clck');
            else if (view.Measure.ReviewType === REVIEW_TYPES.RK_MEASURE_POS)
                $("#ui_measure_coordinate").addClass('clck');
            else if (view.Measure.ReviewType === REVIEW_TYPES.RK_MEASURE_ANGLE)
                $("#ui_measure_angle").addClass('clck');
        }
        else {
            $("#ui_measure_2posdistance").removeClass('clck');
            $("#ui_measure_coordinate").removeClass('clck');
            $("#ui_measure_angle").removeClass('clck');
        }

        if (view.Drawing.DrawingMode) {
            if (view.Drawing.DrawingType === DRAWING_TYPES.FREE)
                $("#ui_drawing_free").addClass('clck');
            else if (view.Drawing.DrawingType === DRAWING_TYPES.LINE)
                $("#ui_drawing_line").addClass('clck');
            else if (view.Drawing.DrawingType === DRAWING_TYPES.QUADRANGLE)
                $("#ui_drawing_quadrangle").addClass('clck');
            else if (view.Drawing.DrawingType === DRAWING_TYPES.CIRCLE)
                $("#ui_drawing_circle").addClass('clck');
        }
        else {
            $("#ui_drawing_free").removeClass('clck');
            $("#ui_drawing_line").removeClass('clck');
            $("#ui_drawing_quadrangle").removeClass('clck');
            $("#ui_drawing_circle").removeClass('clck');
        }

        if (view.Note.ReviewMode) {
            if (view.Note.ReviewType === REVIEW_TYPES.RK_SURFACE_NOTE)
                $("#ui_note_surface").addClass('clck');
            else if (view.Note.ReviewType === REVIEW_TYPES.RK_3D_NOTE)
                $("#ui_note_3d").addClass('clck');
            else if (view.Note.ReviewType === REVIEW_TYPES.RK_2D_NOTE)
                $("#ui_note_2d").addClass('clck');
        }
        else {
            $("#ui_note_surface").removeClass('clck');
            $("#ui_note_3d").removeClass('clck');
            $("#ui_note_2d").removeClass('clck');
        }

        $("#ui_rendermode_smooth").removeClass('clck');
        $("#ui_rendermode_flat").removeClass('clck');
        $("#ui_rendermode_wireframe").removeClass('clck');
        $("#ui_rendermode_hiddenline").removeClass('clck');
        $("#ui_rendermode_hiddenline_elimination").removeClass('clck');
        $("#ui_rendermode_xray").removeClass('clck');
        $("#ui_rendermode_smoothedge").removeClass('clck');
        var src;
        switch (view.Control.Model.RenderMode) {
            case RENDER_MODES.Smooth:
                $("#ui_rendermode_smooth").addClass('clck');
                src = $("#ui_rendermode_smooth_img").attr("src");
                break;
            case RENDER_MODES.SmoothEdge:
                $("#ui_rendermode_smoothedge").addClass('clck');
                src = $("#ui_rendermode_smoothedge_img").attr("src");
                break;
            case RENDER_MODES.Flat:
                $("#ui_rendermode_flat").addClass('clck');
                src = $("#ui_rendermode_flat_img").attr("src");
                break;
            case RENDER_MODES.Wireframe:
                $("#ui_rendermode_wireframe").addClass('clck');
                src = $("#ui_rendermode_wireframe_img").attr("src");
                break;
            case RENDER_MODES.HiddenLine:
                $("#ui_rendermode_hiddenline").addClass('clck');
                src = $("#ui_rendermode_hiddenline_img").attr("src");
                break;
            case RENDER_MODES.HiddenLine_Elimination:
                $("#ui_rendermode_hiddenline_elimination").addClass('clck');
                src = $("#ui_rendermode_hiddenline_elimination_img").attr("src");
                break;
            case RENDER_MODES.Xray:
                $("#ui_rendermode_xray").addClass('clck');
                src = $("#ui_rendermode_xray_img").attr("src");
                break;
        }

        if (src)
            $("#ui_rendermode_text_img").attr("src", src);
        else
            $("#ui_rendermode_text_img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAACCElEQVRYhe1Xy4rqQBA9iqiIEh8gKKJx40436p+49l7wR+4nzCfMXfsJrsStbtSFiGAGRFc+gg98gH2pJvE2mfQQRwYHJgeaSleaqpPq6lS1hzGGZ8L7VO8AfA7WRAH8NqQqjJxl3RsATRgbAK+GlIO2QDJUxtgLY2zDPo+NYUOV+bHLAfq6PwB+icrFYoHT6YTlcnmbi0ilUnyWSCQQCARucwF/DbuaqLQjQCFT6OF8PmMwGGA8HmO73TrYrf+IRCIoFAooFovw+/2mXje28kMCXNHr9bhzIvEIyDmRKJfLN5+iOekpIAKPOocRRbIlgzQCtNdm+B+BuQ2UG3YRkBIwsdvt0O12oWma44hQ2FVVRaVSQTgctr52RkDXdSiK8s44EaKEFE+EmfmUeDYO0e/3USqV7iPQ6XQQDAaRyWTsjpQjtFotNJtNTKdT/mxH4MM/4Wq1wmw2w36/RzQaxfF45NLr9SKZTPJQX69XHhHKlfV6jeFwyNe12214PB7EYjHE43GpDye/Yo75fI7D4cAdkbQOIinqnOLpxcgl4BJwCbgEXAJSArlcDj6f41IhBZXoer0ufW/ngRpHJZvNIp1OYzKZYDQa3VVgCFTGa7UaGo2G2CPo1nV3teVEgqri5XLhpKjsUmNCklov0ufzeYRCIVSrVatd27b8W15MrPjSq9kPvx0D+AducOedPh2ShAAAAABJRU5ErkJggg==");

        if ($("#ui_ground_visible").length > 0) {
            if (view.Ground.Option.Visible) {
                $("#ui_ground_visible").addClass('clck');
            } else {
                $("#ui_ground_visible").removeClass('clck');
            }
        }

        if ($("#ui_coordinate_visible").length > 0) {
            if (view.Coordinate.Option.Visible) {
                $("#ui_coordinate_visible").addClass('clck');
            } else {
                $("#ui_coordinate_visible").removeClass('clck');
            }
        }

        if ($("#ui_config_visible").length > 0) {
            if (view.Configuration_UI.Option.Visible)
                $("#ui_config_visible").addClass('clck');
            else
                $("#ui_config_visible").removeClass('clck');
        }
    };

    this.onEdgeLoadingCompleted = function () {
        if (view.Control.Edge.Visible)
            $("#ui_edge_visible").addClass('clck');
        else
            $("#ui_edge_visible").removeClass('clck');
    };

    this.CalcSplitBar = function () {
        if ($('.splitter-container').length > 0) {
            var left = leftSideWidth;
            var right = window.innerWidth - leftSideWidth - splitterBar.width();
            leftSide.width(left);
            rightSide.width(right);
        }
    };
};