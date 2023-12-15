/**
 * VIZCore Toolbar 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} view HTML Element
 * @param {Object} vizwide3d VIZWide3D Instance
 * @param {Object} VIZCore VIZCore Instance
 * @class
 */
class Toolbar {
    /**
     * Toolbar 생성
     * @param {Object} view HTML Element
     * @param {Object} vizwide3d VIZWide3D Instance
     * @param {Object} VIZCore VIZCore Instance
     * @example
     * let view = document.getElementById("view");
     * let createtoolbar = new vizwide3d.Toolbar(view, vizwide3d, VIZCore);
     */
    constructor(view, vizwide3d, VIZCore) {
        // console.log(vizwide3d);

        let scope = this;

        this.ReviewType = VIZCore.Enum.REVIEW_TYPES.NONE;

        this.ReviewPanel = undefined;

        this.Element = new Map();

        create();

        show(true); //toolbar 메뉴 사용 여부

        function create() {
            initMenu();
            // initMessage();
            initNote();
            toolbarTouchEvent();
        }

        function initMenu() {


            let divToolbarCtrl = document.createElement('div');
            divToolbarCtrl.id = vizwide3d.Main.GetViewID() + "VIZCore_Toolbar_control";
            divToolbarCtrl.className = "control_uicontainer";

            view.appendChild(divToolbarCtrl);

            //Header
            let divToolbarHeader = document.createElement('div');
            divToolbarHeader.id = vizwide3d.Main.GetViewID() + "VIZCore_Toolbar_header";
            divToolbarHeader.className = "uicontainer_header";

            view.appendChild(divToolbarHeader);

            let uibox_toolbarCtrl = document.createElement('div');
            uibox_toolbarCtrl.id = vizwide3d.Main.GetViewID() + "uibox_header";
            uibox_toolbarCtrl.className = "uibox_header";
            //uibox_toolbarCtrl.style.width = 250;
            divToolbarHeader.appendChild(uibox_toolbarCtrl);

            let ui_toolbarHide = document.createElement('div');
            ui_toolbarHide.id = vizwide3d.Main.GetViewID() + "ui_toolbarHide";
            ui_toolbarHide.className = "uitxt uibox_header_button";
            ui_toolbarHide.style.padding = "5px";
            ui_toolbarHide.innerHTML = "<img id=\"ui_toolbarHide_img\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAZ0lEQVRYhWP8//8/w0ACpgG1fcQ7YFA4gAWboHbPpC8MDAzcaMJfr5bk8VBDHhngCgF0zehilMrDwWgaGLQO+EpAjFJ5OBgtikfLgdFsOFoOjJYDo+XAaDYcLQdGy4FRBwysAxgYGAAjoks3ZLYNSQAAAABJRU5ErkJggg==\" width=\"32px\" >"; //width=\"16px\" >";

            let visibleToolbar = true;
            ui_toolbarHide.addEventListener('click', function () {
                visibleToolbar = !visibleToolbar;
                if (visibleToolbar === true) {
                    showAnimation(true);
                    ui_toolbarHide.innerHTML = "<img id=\"ui_toolbarHide_img\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAZ0lEQVRYhWP8//8/w0ACpgG1fcQ7YFA4gAWboHbPpC8MDAzcaMJfr5bk8VBDHhngCgF0zehilMrDwWgaGLQO+EpAjFJ5OBgtikfLgdFsOFoOjJYDo+XAaDYcLQdGy4FRBwysAxgYGAAjoks3ZLYNSQAAAABJRU5ErkJggg==\" width=\"32px\" >"; //width=\"16px\" >";

                } else {
                    showAnimation(false);
                    ui_toolbarHide.innerHTML = "<img id=\"ui_toolbarHide_img\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAb0lEQVRYhWP8//8/w0ACpgG1fcQ7YFA4gAWboHbPpA8MDAz8aMIfr5bkCVBDnqADQJqvluQxojnqPxXl4WA0DQzORAhKMFji7CMV5eFgtCgeLQdGs+FoOTBaDoyWA6PZcLQcGC0HRh0wsA5gYGAAAK8Wg0Q3Z0eBAAAAAElFTkSuQmCC\" width=\"32px\" >"; //width=\"16px\" >";
                }
            });

            uibox_toolbarCtrl.appendChild(ui_toolbarHide);

            let divToolbar = document.createElement('div');
            divToolbar.id = vizwide3d.Main.GetViewID() + "VIZCore_Toolbar";
            divToolbar.className = "uicontainer";

            divToolbarCtrl.appendChild(divToolbar);

            let divToolbar_Obj = scope.GetButtonObj();
            divToolbar_Obj.id = vizwide3d.Main.GetViewID() + "VIZCore_Toolbar";
            divToolbar_Obj.element = divToolbar;

            scope.Element.set(divToolbar_Obj.id, divToolbar_Obj);

            // 트리 
            let cb_ui_tree_visible = function (bool) {
                if (bool === true) {
                    vizwide3d.ModelTree.Show(true);
                } else {
                    vizwide3d.ModelTree.Show(false);
                }
                scope.SetCheckButton(ui_tree_visible.id, bool);
            }

            let ui_tree_visible = scope.GetButtonObj();
            ui_tree_visible.id = vizwide3d.Main.GetViewID() + "ui_tree_visible";
            ui_tree_visible.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABVUlEQVRYhWP8//8/w0ACpgG1fcQ7AARYaG2Bds8kBwYGBgcsUgeuluQdoLkDoJbX45A7MDyjQLtnEixvP2RgYFhAtAO0eyYlMDAwKJBg14OrJXlYLbhakscINbOBKAe4zV6wlIGBISrWyICBl4OdoM2ff/xkWHzuAkif667UhGgSHI3dAU8/fopq9XBlCNDRJFqzhpgoQ/WO3VEMDAz4HHAArzioKAZhre6J/8kBUH0MyBibGC48IgqiBhzlQOPVkryG4REC2j2TDBgYGALQxEA+/0BI7/AIgasleRcYGBguwPjaPZPqQfHLQERBNPxzATQkcIbC4AqBDVeuk1QUg9QTAkQ3SKT5+ZaByvUbr16TVBmB9BFQirdBAncAqEbT7pm0e/G5CyRVx7tSE/DW94QAShTgqtvJAdBGCWkNEmoBWGOEYbQcgAC8DZLRvuEIdwADAwMAJ+rafW77W9UAAAAASUVORK5CYII=";
            ui_tree_visible.imagesrc_checked = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABBUlEQVRYhe1X2Q3CMAx9QQzQERihIzACI5QJYAMyQpkARukIjAAbdIMgS/6wTJqDo5FIn2Q1cuIjTmynxjmHklgVtV69A4T1DDa2TBoD0VwOnCbmhr+9hI7pHluoj6ADsMkwRAauE3OGvzakQEagB3AB0CQab3h9n7jeC1kJabAP7MiHjp0was4JXjALtANaUQp8csm6qijFVmSFJDuXA0F8qxK2AHaKRzscY4LFIwDKAiYnxjnkk5M86/wgfvkILHXA14xyS3EMyQ+SM9f1NiV9uBkdWC6E4INEOnAEcMtox+MbzesF+gg+UqZAF/ER0/mrS2iYotGs4lk+hPjLv2HlDgB4AvhJp25pdm3+AAAAAElFTkSuQmCC';
            ui_tree_visible.checked = true;
            ui_tree_visible.tooltip = "Tree";
            ui_tree_visible.callback = cb_ui_tree_visible;

            let cb_tree_close = function () {
                scope.SetCheckButton(ui_tree_visible.id, false);
                cb_ui_tree_visible(false);
            };
            vizwide3d.Main.Tree.OnCloseButtonEvent(cb_tree_close);

            // 속성 트리
            let cb_ui_ptree_visible = function (bool) {
                if (bool === true) {
                    vizwide3d.PropertyTree.Show(true);
                } else {
                    vizwide3d.PropertyTree.Show(false);
                }
                scope.SetCheckButton(ui_ptree_visible.id, bool);
            }

            let ui_ptree_visible = scope.GetButtonObj();
            ui_ptree_visible.id = vizwide3d.Main.GetViewID() + "ui_ptree_visible";
            ui_ptree_visible.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABvklEQVRYhWP8//8/w0ACpgG1fcQ7AARYaG2Bds8kBwYGBgcsUgeuluQdYEFSSGpqTLxakreACHUgy+txyB1ACYGrJXlE2azdMwlEzQfRRDoCJyA7DbR6uMIckYDFgf+h+AHNHBCgo4nXEVdL8hivluQp0MwBxDiCGEB2LoCmA2Qwn4GBAVt6OIDDCIg4qCgGYa3uif8pAVD9yGYxEINHREHUgKMcaLxaktcw+ELg6cdPDNU7doNT9+nHTxk2XL2GUzMvOztDm6crmGZA+BaZ/YGQAwZfCEjz8zEsCA+Gs0F5nVgAilMGiO/rkdgN+LQPvhC48eo1Q/Ci5Qxr4yIZNly5zrD43AWcmnnZ2RjWxkWBQwoXgIYEzlDAGgVZVubw4OflYMfjAHa8lhMDMBwAMjTbyhzM1hATBWNKANENEmRw+vETBlNZGYbPP3+CowQdgBwFy3pEAOIbJAxQyxNWrmNYEB7EsP7KdYaNV69j6PLX1gTnf2oADAeAfA6yHESDfBqIJRsSEy3QJt5DHDUkHGCNApDlDND0AGOTAkCNESSH4C0HUByApY6nOYA7ANnVVAZ4GySjfcMR7gAGBgYAla79a2oLu8YAAAAASUVORK5CYII=";
            ui_ptree_visible.imagesrc_checked = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABQklEQVRYhe1X0Y3CMAx1TwzACIzACDAJMAm5DW6Dg0nICIwAG2QDI4MjWZWduFSkH+VJVtwkrV8cO047RIQp8TOp9dkTICwa2Niw9BFJJIGh0XgAgJOTwNEYi30PdE7jRPafdQ8JE2Ni4MAk9gZBklvtI2NiIK/c8kT2ZvgUAQ+JKuRJiANjQEMnxrNezIJ3CVikNAJFzOIoDiIrpIRWBIrQsmDF0bzn4NHyPCPxeOJnmXJB9JuwPNCiRrxAWcCCQn9H0PhWQB3UP30MaB5Ys07tn8E+IyHiSlm125vaXlMB+eX2VAmk5Ck4JbQ4Cd0XEokNT1gCwFoZv3pSTBBwX0jyCxcA2HKO75Q558r54IZGILLxyCvVSuzVYYC24V4r0dYWRG6T0IdAxtKgC0nz3yRJYEwGlGB58Nn//TecOQEAeACLmCa7d0YujgAAAABJRU5ErkJggg==';
            ui_ptree_visible.checked = true;
            ui_ptree_visible.tooltip = "Property Tree";
            ui_ptree_visible.callback = cb_ui_ptree_visible;

            let cb_ptree_close = function () {
                scope.SetCheckButton(ui_ptree_visible.id, false);
                cb_ui_ptree_visible(false);
            };
            vizwide3d.Main.PropertyTree.OnCloseButtonEvent(cb_ptree_close);

            // 속성창
            let cb_ui_property_visible = function (bool) {
                if (bool === true) {
                    vizwide3d.Object3D.UDA.ShowUDADialog(true);
                } else {
                    vizwide3d.Object3D.UDA.ShowUDADialog(false);
                }
                scope.SetCheckButton(ui_property_visible.id, bool);
            }

            let ui_property_visible = scope.GetButtonObj();
            ui_property_visible.id = vizwide3d.Main.GetViewID() + "ui_property_visible";
            ui_property_visible.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABOElEQVRYhe2WzRHCIBCFn44FWIJnTrGDlKAVqBVw4qyeOVFBtAM70BI8cdUS0kGcnSGZBDFEEv/GvBkOIWH5eJBd0OvvNXAZwKSaAVgDiDoy6AxgqwU/2C/uAJhUGzM5fbynwVrwa8isTKoJAGoLAEsAOy346iEAkyoGcASw0oLvQiatgSGABMC87IQNQJOnWvC5Jxit6pI/a8GdW+kYRwCRFnya9w2tb2Jje61Ct8TErpwrG4CUBgZvojtwF8DL5HLurQAu9QAfBxiFDmz67/v0mw60yIQTu8/lwNgXqEUm9AKcTOV6lRamNBeyt2BL1ZAql68aPnsITTWkVil033UfKA0MuREVdwj7kNbdiDoR2cukyozN+SKyJrE7yQNm5WRtUoZ4G0AbiE4zYRniIwAWRK9efgG4AW1FdlsYEZgqAAAAAElFTkSuQmCC";
            ui_property_visible.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAA7klEQVRYhe2W/Q2CQAzFW+MAjsAojMAGMoqb4AaOIBvgCI7gBs9ccibnUbhSwQvJvX9p3/3ach9UVCQJQANgwHpyXo2q2QAuftmbB6msU3K5AGoAnffsUgm1D2zX/jWcp/ee7gSAu6tcYVaFw1kA4ToxzAXME45jlwLUcfxBiHtpDQ16xikSwGZi5rwAkgpAdoCjNZGZeQ2AfY7gh5NwdK9IAKeUkbSflUoC9ER0Nppr5Lwfk3HZb0PK/R4IEi0vojbIr6Jv+heRsdJWgFDvjk0gtADmkzAWM1/9mt2/i/9S0Il8FB+IbABF+xERvQHiNpsnL75mcAAAAABJRU5ErkJggg==";
            ui_property_visible.checked = true;
            ui_property_visible.tooltip = "Property";
            ui_property_visible.callback = cb_ui_property_visible;

            let cb_property_close = function () {
                scope.SetCheckButton(ui_property_visible.id, false);
                cb_ui_property_visible(false);
            };
            vizwide3d.Main.Property.OnCloseButtonEvent(cb_property_close);

            // 리뷰 패널
            scope.ReviewPanel = new vizwide3d.ReviewPanel(view, vizwide3d, VIZCore);
            let cb_ui_review_panele = function (bool) {
                if (bool === true) {
                    scope.ReviewPanel.Show(true);
                } else {
                    scope.ReviewPanel.Show(false);
                }
                scope.SetCheckButton(ui_review_panel.id, bool);
            }

            let ui_review_panel = scope.GetButtonObj();
            ui_review_panel.id = vizwide3d.Main.GetViewID() + "ui_review_panel";
            ui_review_panel.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAB9ElEQVRYhcVXMU7DQBCcRCkoQ0cXalwQiQYERWqqPCEvsIzkB6Sgw4XxC5wfpKBG5gdGwqIN4gHkB0aL5sLJSew7+6KsZNlKzjtzu3O7615ZljimDQTbi5IJgBTAyCGXLwCzIvSzukUD3gV8DWBchP66K7IXJUMAGf2emxAYKXAvSmJ5sQj9fN9zBSwAMNR+WhehHzOqP01k++rBxc51M/YnIrx4ei7l7voy8atSIKE8ynHYEChCv+faucmm+k0LDm0DF/61Yyc2sRH0FgEvSsYApjXvLPWjSPACwAmAT579uvfrCdiYtvM3AHcArgDc2PjYIsDd5buX/5sGnvN+L+DVQtVkrUS4Azxm7q3AxUw1sMm7S3Axqwi4Bhcz1sAhwMVsIvAC4AzAhytwsSYNLNmWpaffAvgG8Ajg2hB80bTANAKK0KsFuKRz1rTmbyaUptGlGXH4EDCJ3qX21zs1k+4bzTYEAJzaDiUEnnPsWjJlWeX/Ka+VrK0SUQRWnAmNG4kXJQIc0GlssD4g2bgI/XmVgOlUvJC8elGSMtwzm5NAgUukMqUP6+8C7iRoO0Gznqh0xG0IOBvdRPht2vGDEl6HCOQsZvbdkIKTPObMqQ34WJVyJdxW7ZgCEiFm1IQJeKC+lvQC1enj1Fkd6GqdK+HRDMAvwqx8Ox4SMvsAAAAASUVORK5CYII=";
            ui_review_panel.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAByElEQVRYhcVXMU7EMBCcO1FQhh/cDziJBiSKPIEn5AkpeMA9IU/IE3gBChIPCAWijagokEhJN8iwPq18wY59PmWkvUSOvbNez25yK5JYEmvhLgEMAJjRBvHrhc2AmTzKgjFDQgoAnVw3cwIwPxdC3gBoAfSee41aiCysDzP2ZTh8AaydhTkxy5/OgDfSRAT9nqn7RcpBB3CqDHixDk04NXIFUEh19E5FBDElwi2AO8/CB6cUDeErgHMAbwA+1fooEabANpwnALcArgDcRPkxGeAfEGkFyZ5kS7IiOZLcOj4Y8pmqAbvzXq6NtHG3SwYxdQRTGtDnno3cIDYDWcl/EaGBOWfuWtBvTADPJD9I3s8kTw7AON6JWZKNzHkn+T2THJKtLFVgRfkI4DrizKvQhFyv41LITAVdqvEXCbYV0R5AZyCqhyviTghG+TpaKatl3AZw+I0oZzGIwouIbrgTMdZqrBZflKv7bJR1ByIs1UIfWiWu3hGjJSiVTzfArfC0bgAxZnfpZmtQ5O7G3H6yDywlAEojmlvzU+OVHU/NwHhkBoZjMmA1MCylgZNUQaqZXXZC1vxzBI087yae7zvhsUjuhMv+PQfwA8tFOW4OG2aJAAAAAElFTkSuQmCC";
            ui_review_panel.checked = true;
            ui_review_panel.tooltip = "Review Panel";
            ui_review_panel.callback = cb_ui_review_panele;

            let cb_review_panel_close = function () {
                scope.SetCheckButton(ui_review_panel.id, false);
                cb_ui_review_panele(false);
            };
            scope.ReviewPanel.OnCloseButtonEvent(cb_review_panel_close);

            let cb_ui_minimap_visible = function (bool) {
                vizwide3d.Main.MiniView.Show(bool);
                scope.SetCheckButtonImg(ui_minimap_visible.id, bool);
            }

            let ui_minimap_visible = scope.GetButtonObj();
            ui_minimap_visible.id = vizwide3d.Main.GetViewID() + "ui_minimap_visible";
            ui_minimap_visible.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAADkUlEQVRYheVXXUhTYRh+3aabtZ0NMsV0ETrNOAmGZGlBP8NKilpdBllJEGLtalcKEUVe7SK2FIMIMwq6iRWVpih5oSlieOHS8gdD7UKt5szNnznjOXpsG+e4s8oMeuBwvn3vu+95vvd733ffohYXF2k9IVtX9v9ewD8hQCFmYK02HRGZkrRM8eikO4dRKSdj5PLS5uJLlZEQsFbbwQSNugrjpstFGaH2oCoIJU2P27RwOpOVGw0p1DE8SvaWNr9nfm5KipAV4kVKPZJuUDQPDn2qvVS4bVUBh+/e79UqlQaeNEnLcPON/QOUo08mjVJJju6eVYUEEpv35ypMO3dQx/AIXXvdJCgg6AiUcoWq1HhAvlufHOT0sLOLGKWSMI8FTTt3yBzdPVp7S5s9987dcgiZmPa8B3GCWp1q3rdELAWiORAOoUIS1Gp/JMSCERADQo9HCCDMiI9DNcky4jdHvBFJAuymE6vaG/sHufeaCRDC1Ows1XR2UWPfAH0Yn1gS0jdAxrRUKszOEo1YKCQ1ItZqC/rcOzZOZx48psrW9hVyAGPMwQYfKYg4Atj5VccL+uyeoi2Mhkry9pIxLWU5AoNU0drG2eDz9PzZsJGIuBUj7Dw5CJCEfJJijDnY4APfcJAk4BT7s7RwzgB2LrQ7zMEW6LsaJAkoL8hfGfNnzoddCLwtMD/EIEkAzn2tIElAaW0D18+B7ZvjuDcSTgy8jff9oxFAnQPIdqHIYM7e8jbI97cFBAJNhs9y1Dt+HUGKB2NT9SMa+z5NulgV5xsOkvrArWP5xKiWMh5ZjtbM94KyugYqqwv2B7nLO0MXnzylQ4YUytEnia4dVgA6Gnp9EsNw2Q0B6Pmo99BWjDPnWzHIe8bGqXd8gl716iITAFKEs/5jv881413QqlT1sdHRyWV1DbvQEyDEaEilkrw93FPR2s59D2MemYkJ3Dq48Ax9/UYKmeyLEFfQjajgXs3QF49H7/MvzIN07Pv0fafF7ODtrNW2Ta/TFrm83isbomM0uGqdy87ijmd00s1FB9Gq7njn8/rmpz1z826f34/bTRQR+YnopdNiPikqgLXaLhCRK5BUDKzVlhWv3njDPTN7dKtOK09kNP7mwaHoZC3zemTSXcWvwVptz4no+HLCQ8RNp8V8XVDAr2JZOOBwWsyu0GVCRDxzWsymPypAClirDbtGXd52Wsxv/roAMfznf82I6AeW1qesaCMs1gAAAABJRU5ErkJggg==";
            ui_minimap_visible.imagesrc_checked = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAB3klEQVRYhe1XwU3DQBCcIAowBaDkwT+mg5TgEkwHaQDJUEGe8DMdWGmAvHmAwx8p/EFyAzDIYiytLj7n4gBBgpFWtufW2fFm17cekMQ+cbDX6H9ewK8XEAFIARQA6kpd6XpbTAAsZOuou8BYRDIlWfATJckpyZH4lSx17muzCcmF/Gc6X/NziYUTtOETiUOAEBs4dbggAZMWxzbeFdIW2BW1JuBwh/rJZXVdZOIyccEIFVDJuoT0QmgbJgDKDT6T7xTQhkgpL9WmtzrPtBaE0L+gDjAw17HeD0PHbyxLA7PWKwORCf4M4AzAkexM3FA+GzPRR8DUBI9VgE2R5uIaEdOvEnBjzhMdM09nVKYtk5b1XgLsHjDWsejwLxzfnQUEV/W2CBWQmz5f6tiV3sTx9aJPBpr0+vq95i4d350FWMxMlZeqj8jMD48AjgG8yrcbgbvhyGzHtcXa9Xx4EX9PMuvaDUMyEJs3W5PyUvyF8z8vxZ0AeABwCuAcwLX31z0ZiDXF1E9ZkczNlJRrQGkbROz1Fcl3k6G70IGkMkHdQCNNSyszao061p+MiDeS800CUs/TtVkskZXGOF+G5greiMi6BPS1VBZ57rciCrv2k9+GmQp3Zkf0/4/T/QoA8AE0qY2DCDTJ5AAAAABJRU5ErkJggg==';
            ui_minimap_visible.checked = true;
            ui_minimap_visible.tooltip = "Mini Map";
            ui_minimap_visible.callback = cb_ui_minimap_visible;

            let cb_minimap_close = function () {
                scope.SetCheckButton(ui_minimap_visible.id, false);
                cb_ui_minimap_visible(false);
            };
            vizwide3d.Main.MiniView.OnCloseButtonEvent(cb_minimap_close);

            let buttons = [];
            buttons.push(ui_tree_visible);
            if (vizwide3d.Main.Configuration.Property.UseTree)
                buttons.push(ui_ptree_visible);
            buttons.push(ui_property_visible);
            buttons.push(ui_review_panel);
            buttons.push(ui_minimap_visible);

            //addButton([ui_tree_visible, ui_property_visible, ui_review_panel]);
            addButton(buttons);

            // 선택 객체 숨기기
            let cb_ui_select_hide = function () {
                vizwide3d.Object3D.ShowSelectedObject(false);
            }

            let ui_select_hide = scope.GetButtonObj();
            ui_select_hide.id = vizwide3d.Main.GetViewID() + "ui_select_hide";
            ui_select_hide.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAByUlEQVRYhe2WvXECMRCFHx7npgScKqIEU4FxBT4qEBcoNsQKQBVwJeAKcAcmUnyuwHRgz3pWg0aW7kdc4jEvuztpv6fVanW46t9rFEuA0OYrNzFWyZHQZgpAAjBWyWPT+NumQDkGGH4AMAbwAaDRwE0OpCP8BGDfNmcwAxH4rC39pOQWeEFb9zIXTmrLAMELCs6QQeFdDBgOOo6ZuBTeaoCDzWImhoC3GmgwUQwB72QgYWIXwoU2k5wG1vkYBiYQrtwqWfeF9zIQmFhfknZfjX2gwURnMNfLLtXaexsIglMdLAE8A5jgfJGRwVfepg2ARSrGELchQSoGOj1yAyODC6tklZqcysC9W1FCtCrqA1uuhxc+lk77LnBS7ytXaLPj1f0EF9ps+LkEUHP7nvtwoc0nmbJK/tqKXqfAg8+8lVENrPl5EsJZTzSPzeYbYHhllXwL3h9dtcfSzuMrNnuRgS2v5CF4L3240GYutFm5jzy+4Pn5BqySJa/E3Qfggpv7cDZzh3MfOHDmyjBm7n+fq4V9pOBWDHenY8nwaC/IMoD4aZjy0YPXB0hlTh9ogxc+nF+/e0Nq/pnZWiVPiTD5ok7p1cBVf1gAvgHeGfOuPi6xAAAAAABJRU5ErkJggg==";
            ui_select_hide.checked = false;
            ui_select_hide.tooltip = "Select Hide";
            ui_select_hide.callback = cb_ui_select_hide;

            // 비 선택 객체 숨기기
            let cb_ui_no_select_hide = function () {
                vizwide3d.Object3D.HideUnselectedObject();
            }

            let ui_no_select_hide = scope.GetButtonObj();
            ui_no_select_hide.id = vizwide3d.Main.GetViewID() + "ui_no_select_hide";
            ui_no_select_hide.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACYklEQVRYhe1Xz2sTURD+dmmTgtpGrEqN0BV/VZ7QBkHQSs3NChXqwYMVakCoB2UbZe/2JIgPWt9BL4r1ICgYSP4BaaBFtKApuNSDQkQUTPEgbaCKuGXsbN0uAd0NEg87sOzm7fz43sz3Zjaa4zhopOgNjf4/AGjy/hBSZQBk6nFoW2Y6iL4/AwaA4yFjh7JtqrUYdBdYzd4YgGtB7SISRgAiABGACEAEoOYwElJNBfTTDmCnx7bE15RtmWUe8zTkJv8EoAygGAA8BU16/HwD0OUdy0KqzwC2J9taX/DIHvM6CfVNKKTqAZAH0MmAFwEM+NQqAJoBbO7a1o7c8BBYd92oD8wBDk5pTgA4zUAoeAHALtsyNQA3AGyl4OaxIzYFn/3wEX2371b9/gJlQEhlcG1J0rZlloRUVDaqr8E6WQDjuqYt3xzob+nfv5eWbwmp6D5Kz7ZlZsNmYAJAmxuc16gMk0KqhJCKSDbe2hIvz1wa+d5rdOL+7EvKTJaD0vMoZzEUgLXd+9YPclnOp5Idc88uXzQ2xJoXM49zkMXpEn6Xjuy+Mtl/SWAS8jEjll+xLXNCSDUN4Cj5utrX++rC4UMpIlv6zr1PC9XqWQApNnWPtjd7oQAkmHgE4h2A3bqmOfLUSefEvj36TPn985EnhWV+/4B369Z80LbMdT0m7DFM8I66N8ZjKGTO/dwUj+P606Kefz1PKl8AvOWeQJyZo/8b3p27UrMT/oVQPbt7dnTMPxw6c6CyVP0x/CgXe1NZcC238EWky9fqgHVlwCMON5dBPmZr7Pan+l8BqFsaOw0BrAB7bcwkkQeB+AAAAABJRU5ErkJggg==";
            ui_no_select_hide.checked = false;
            ui_no_select_hide.tooltip = "UnSelect Hide";
            ui_no_select_hide.callback = cb_ui_no_select_hide;

            // 선택 반전
            let cb_ui_select_reverse = function () {
                vizwide3d.Object3D.InvertSelection();
                // vizwide3d.Object3D.SelectByType(VIZCore.Enum.SelectionModes.INVERT_SELECTION);
            }

            let ui_select_reverse = scope.GetButtonObj();
            ui_select_reverse.id = vizwide3d.Main.GetViewID() + "ui_select_reverse";
            ui_select_reverse.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABvElEQVRYhe1XMU7DQBAcEKIk+QHprwkvILyA0FCHD1gu3BP6k0juBfACSE2T/CCNa+IfkJbGaKUNWh139joxChIZKcU5552Z3b21fVSWJfaJ472y/3sBf0LASVuBjHUrAKuKLXP65Vky/xUBAFIALwAWTCbRA3APYOnf1IoAY10XwIiXyzxLxt7/tC7yLHltXYCxbgjgiZc3IRIWF7q+vQB2TcTXAGZEkmfJR0TgOYBJawKUrjegvYs8S4IN2khAA9e0b8zNR3vvYjHVAupcC3EkaACA1h0A61j9VQI811Ny5rtmcc8AzvjSG4DbjaBQltQCBPmVP0Q8cRKnRGqsG3EmotAISDmlAzlgAq4lLo11aZ4lEy5JFKr3AQoG4BHABY/bkGsfVPt+rPs3qHwYGev6lGZ2suBRWyjIwQ0YPPsSdSUg512u5ScfKy1mYjxHES0BN9hKHKWOknjN86FqOH2jqgRDQaolJ9c9LTmhqgS16RNo5FoiWAJjHdX6XRkjOpI1iGUgVdxbMLH/8tEIsR4Y1gSZ8hnfiZzwQ4B4fldhvm3KfYRKQIEf+MzHzn30DacpDp9mBwH7FQDgC/QZp5aCH5F5AAAAAElFTkSuQmCC";
            ui_select_reverse.checked = false;
            ui_select_reverse.tooltip = "Select Inverse";
            ui_select_reverse.callback = cb_ui_select_reverse;

            // 모델 전체 보이기
            let cb_ui_show_all = function () {
                vizwide3d.Object3D.ShowAll(true);
            }

            let ui_show_all = scope.GetButtonObj();
            ui_show_all.id = vizwide3d.Main.GetViewID() + "ui_show_all";
            ui_show_all.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABqElEQVRYhe1WwXHCMBDcZFJASiBfvygBKjAdxFQgeOjtydsP7AosKkioAErgpTcl0AGZy6wyQhFKICY84p3xyKe7uVvfnU5Gjx63xt2p+FnVTAC8UpxbrepAf5DVavXFR0oX4j6hy73352slKkogq5pHAAWAPYAtgGFWNcM/IwBgwvUNwJLvV8nCKQIu2IokfFLXJZBVzQDAiKKUQOSdrGzMTvEQceYHWQe63MtIJ4iVQHE1AF74uCM4YYN2hqMMsNMl5Xur1TTQSVmGzJDx9o+yZLUa/0TnEJbAfX0szUsSyH0CXr/EkNL1+MC3szoFNuSMc2Pgme5YstpqtU/5uJhAVjUyqhcUDYeWQ85RDl5kJu4lfRmlgrcAWgZ+4vbae8B90be074YAncnXTa1WcwAlZXkfcxW5pF6Oc5EicVZwues5E9zegeXw7Wbun4DyiHaL0Oe5GZBAxmq1Cfa3KZn2hg37KwI10xkOmFA++negfeGN9E+cfQqCHjBMa8E7Y0MyJTM1Z3laytPQ30XH0CNRM3AZpDfcjwa/mAA6nAM3n4Q9/jkAvAOK2qHJQFdZjgAAAABJRU5ErkJggg==";
            ui_show_all.checked = false;
            ui_show_all.tooltip = "Show All";
            ui_show_all.callback = cb_ui_show_all;

            let ui_select = scope.GetButtonObj();
            ui_select.id = vizwide3d.Main.GetViewID() + "ui_select";
            ui_select.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACOUlEQVRYhe1Wy03DQBB9IO6kBHP1hZSAKwAqwKlgk4PPJGcfkq0gpgKgAtIB4eJr0gF0ABr0Fkbr9SqxgxASI0WO9/fezM68Mf7tt+1oF/y0tFMAhq+2Lsz0ULyjBNLSXgBYAkgAzDgsRN4AjOrCrH6EQFrahMBC4AHApC7MVs3NAVwBWJHItiuB4wC4HL4BMACQ1YW5VnMCOuBYxjUb7ulkjQikpX2nV5UiNJYo0PNtXZgztT5ntLIuV9KIgJgDpyV8Oi+TtLT3TEx/7d4WJEDPEkbjikMVf+CYSUs76AMudhKZS9T/qi7MiMTkIWGf1YV560ugNQK8z1Fk75xl2staI8DwLvma03PQe/F8LQn5YwQkvGlpRXzOqQe5ml7p8uxjwStQGT4lkLvrEf+/+GvVmt4RmDHDb5TcZhSgtasEX6Y5t7fFpDgotzGZbjnrU6jqwgSxdmlGQmQIYMHhMRNwwqe833hlK4TueC1zrax7EfC8cEooHlfemBz+qLZcMmkHMfCdCQQILQmwYM7cMhLOHnh9UXCxViHaAVwOnxA8Z4VkIfC0tK/c148AO2POzuc8G7MKKuZByPNrilmjbe8bgTH7gt9216otN8LO9ZV3TZ0ILOiJ3wOMBpcPFyVQrppyVUndCPDOxZMnegz/zvnVJGRO8V1BT4zcxD+zbxWEEm5KcF0dX+38IATQrAbxfMi6h9IBON1oOyf2QRIDzzU4h5/VElFC6d+LQ3y0hAi8qxz4tz9sAD4A7lETU6wKSogAAAAASUVORK5CYII=";
            ui_select.checked = false;
            ui_select.tooltip = "Select";
            ui_select.subButton = [ui_select_hide, ui_no_select_hide, ui_select_reverse, ui_show_all];

            // -----------------------------------------------------------Color pick    
            let ui_color_input = document.createElement('input');
            ui_color_input.id = vizwide3d.Main.GetViewID() + "ui_color_picker";
            ui_color_input.className = "uitxt pick_color_btn";
            ui_color_input.type = "color";

            ui_color_input.addEventListener('input', function () {
                let selObjects = vizwide3d.Object3D.GetSelectedObject3D();

                let vizColor = hexToRgb(ui_color_input.value);
                let r, g, b;
                for (let index = 0; index < vizColor.length; index++) {
                    r = vizColor[0];
                    g = vizColor[1];
                    b = vizColor[2];
                }
                vizwide3d.Object3D.Color.SetColorByNodeID(selObjects, new VIZCore.Color(r, g, b, 255))
            });

            let cb_ui_color = function () {
                ui_color_input.click();
            };

            let cb_ui_colorpicker = function(){
                let button = document.getElementById(vizwide3d.Main.GetViewID() + "ui_color");
                let buttonRect = button.getBoundingClientRect();

                vizwide3d.Main.ColorPicker.Show(true);
                vizwide3d.Main.ColorPicker.SetPosition(buttonRect.top,buttonRect.left );
            }

            let ui_color_pick = scope.GetButtonObj();
            ui_color_pick.id = vizwide3d.Main.GetViewID() + "ui_color_pick";
            ui_color_pick.checked = false;
            ui_color_pick.imagesrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAChUlEQVRYhe2XsWsUQRTGP0VyVS4RjM0ZCPEK4wo5EU1h4WJIITarFoKgnrWwJrB/wNnYuMVlIY2NMUUghbKNZeBsBBXhAi6JECUhXpOkuJxVqpM3zK6zs7Pn7u3FQ/CD5fbNzcz7zXtvZu6Otdtt9FPH++r9nwfQbGdYsx09yxypakCznRKAMgByOqnosg2gRo9nmYs9A+CrrAC4lpgWOABQ9SyzkglAs50qgCe+fe70CKaL43C9dTQOWkG/wlAehjaB1c3v2NjdE6dYo6h5lllPBUD5BeCKq748egaLd28Hfcorb/Bp5wdz/vrBPQzmBli76b7F6uY3ORq6CqJTEVblkF8ZLUBl08p952BROiXPNQRAWRNKAM12ZgE8lNsbrVbI3tjdZ58fdxod+3FNarYTqYdICnjotzh1RMaFCRTyeebE/bIefD1dPMtWLrdLolSMeZbZ9JtPKDrN+s4Hczk8vjrFHC68/8CKK25yyrmY95hipXkNMR1xAEzPbszgenGcvVMBzrx4iZ+Hh3GrC0XDMW6y9/uXLuLO0rIIoYsAoRrg+z0IPUXg9/sAW1USiUVI46hIBY2JhlyEJdGgLebr695+yO4kOUp0NsRJTsGwaFDeaTBFQjpcOmrpcz2IIO0UaWxTNFQ1EFIax6J8CIVcselv/x7Yli8pGWDriAHKcoMMUDsix3QA3fIsMzJ/CMCzTIrAux47fsVPP1fVQVWEkUsooaOKZ5nVtITK61iznVpKiLlunJPidoHBV5VUpRR9/wzAbys9BYTRUwAOUecQawnmUV7dmQAkiKfdOsgEwCGa/JftSSo2xTalND3qmoB2QbfP+efzepbx9Pz/c9pfAAC/AMXbRjT+9sJTAAAAAElFTkSuQmCC';
            ui_color_pick.tooltip = "Pick";
            ui_color_pick.callback = cb_ui_colorpicker;              

            let cb_ui_color_delet = function () {
                let selObjects = vizwide3d.Object3D.GetSelectedObject3D();

                vizwide3d.Object3D.Color.ClearByBodyID(selObjects);
            };

            let ui_color_delet = scope.GetButtonObj();
            ui_color_delet.id = vizwide3d.Main.GetViewID() + "ui_color_delet";
            ui_color_delet.checked = false;
            ui_color_delet.imagesrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACn0lEQVRYhe1XPW8TQRB9ICRX4a6BhkQxggKzkZIGShKBUlCdgYIypqC9GOkKOpyGhpOw7w9g0tCaliKx20hIRuJECgSOQpqABMcfMBprNjr247wGJS7gSSvt7de8nZmdmTs1HA4xTZyeqvR/ngDhjDog4qQOoJtGYV8ZLwOocls2nPUaQIdaGoU/XAmYNOATAREnSyzYF3HSBPAZwHOLcEIA4AWAgYiThisB7RXw5icAMgCkDfqe5+mMb9klQbltUjtBbuwdgJVx2igioKJFZIoOZDM1c0QyJtG37XEl8CiNwmbRTZQzamwOwh6AJRtx11fQkD7hgjQK2wAe8FIyX9u2zZWAl3fMCUhs8Gcg4mTlbwj8KYkGmwDszBqOPRco/nAxjcL86zmRSNjJ9TUzHDsB9v4ef5ZPnIACjYCWC/Jgz60rEQ4c95tpFHYdBcsYMFAnrBrg+L89UyoFT2+vYqZUGjXuE6FtESfW963At00YCXBGXKf+nYUKAlHB9bnZUaM+jTHW2MvHQT5dTQOmdOzLN3ttbhabb/vY2T/A7uHX0fy9zVej/gXvLA6yn+C1Vk2wGT3+1Exm0gDdyHt88wba9+/iyvlzR8IJ1K8uVPDmYQ23Ll+ioXlOQjbIANRTY4BRA9JTO+8/HAlUsXv4DVsfP2Fn/4ucMdqYby/rB2MyM2VDUudawY1U7KVRqGmATTlg9dPtnXOBpqYCZGwyVXiZ7e3xmqrtCBOBcU+rx63Fef43xxJxQsKoAFnMFSTWIsaYjDgGrBvWt9IorBvW+3zLWs7mVJLViqohgjEOsJCXhiktFYs4IZN954y3zLfeGFeKSVhDcRqFNREnXQ7Fi7mCVIUsWHs8356kLAeZwKVdfdbyXddO0v7/nE6XAIBfNypV3MQerYgAAAAASUVORK5CYII=';
            ui_color_delet.tooltip = "Delete";
            ui_color_delet.callback = cb_ui_color_delet;

            let ui_color = scope.GetButtonObj();
            ui_color.id = vizwide3d.Main.GetViewID() + "ui_color";
            ui_color.checked = false;
            ui_color.tooltip = "Color";
            ui_color.imagesrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAChUlEQVRYhe2XsWsUQRTGP0VyVS4RjM0ZCPEK4wo5EU1h4WJIITarFoKgnrWwJrB/wNnYuMVlIY2NMUUghbKNZeBsBBXhAi6JECUhXpOkuJxVqpM3zK6zs7Pn7u3FQ/CD5fbNzcz7zXtvZu6Otdtt9FPH++r9nwfQbGdYsx09yxypakCznRKAMgByOqnosg2gRo9nmYs9A+CrrAC4lpgWOABQ9SyzkglAs50qgCe+fe70CKaL43C9dTQOWkG/wlAehjaB1c3v2NjdE6dYo6h5lllPBUD5BeCKq748egaLd28Hfcorb/Bp5wdz/vrBPQzmBli76b7F6uY3ORq6CqJTEVblkF8ZLUBl08p952BROiXPNQRAWRNKAM12ZgE8lNsbrVbI3tjdZ58fdxod+3FNarYTqYdICnjotzh1RMaFCRTyeebE/bIefD1dPMtWLrdLolSMeZbZ9JtPKDrN+s4Hczk8vjrFHC68/8CKK25yyrmY95hipXkNMR1xAEzPbszgenGcvVMBzrx4iZ+Hh3GrC0XDMW6y9/uXLuLO0rIIoYsAoRrg+z0IPUXg9/sAW1USiUVI46hIBY2JhlyEJdGgLebr695+yO4kOUp0NsRJTsGwaFDeaTBFQjpcOmrpcz2IIO0UaWxTNFQ1EFIax6J8CIVcselv/x7Yli8pGWDriAHKcoMMUDsix3QA3fIsMzJ/CMCzTIrAux47fsVPP1fVQVWEkUsooaOKZ5nVtITK61iznVpKiLlunJPidoHBV5VUpRR9/wzAbys9BYTRUwAOUecQawnmUV7dmQAkiKfdOsgEwCGa/JftSSo2xTalND3qmoB2QbfP+efzepbx9Pz/c9pfAAC/AMXbRjT+9sJTAAAAAElFTkSuQmCC';
            ui_color.subButton = [ui_color_pick, ui_color_delet];

            // -----------------------------------------------------------Search
            let modelSearch = new vizwide3d.Search(view, vizwide3d);
            let cb_ui_search = function (e) {
                modelSearch.ShowPanel(e);
            };
            let ui_search = scope.GetButtonObj();
            ui_search.id = vizwide3d.Main.GetViewID() + "ui_search";
            ui_search.checked = true;
            ui_search.imagesrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACP0lEQVRYhe2Xv0vDQBTHv4rg5I9JQVsQfwySoS46SlGL6KL/gXZxMzhkEBF0EocMJeDiYsV/oIIoUhRxELSICgYHQYRa0U7aTnWpvOOCZ03MJa0/QL9LILl797n33r13qSoWi/hJVf/o6r8BoMZtgKIbbQBmAIQBhIRPFwAOAMRMTb31C+CYA4puNJJxABMSdtYJ0tTUp4oAKLrRAyBu7XhM6cZgVzv6ggHU1dYiXyjgJH2HvesbbJpX1jTyyKSpqedlAfCdk2tDLfV1WBqJoDcYcDSQSt9hOrGFfOHFggh78YRdEsasxZdHh7FydIzl/UNHAwSXnIqCxnOPxWQX/wDAE47FfH4ojNntXaTSGWRyuU+NUFjIU1wT3I53AJ7tLOaXD1nc5/KwwuAm8gTNE+34AaCjxhJu4/SMvZgd6Gc7lBHNE+34AWBZ393UZCUVBjs7ZG2xUyLa8QPAlHl+Zs/eYKv04uC54FW2AK0NDexJCehFVB+8qrQU0zkOXWWzYkJJi4qTYEdKpQCsAFGFk8n8UtE8wY6USkPAigiV19TbbqRE44WyLF2M3gHwrkaNBXM7SemY0jgqx1zrXrqjXRJSEbmgIhRZXXP1BH2ncfzYPgJYkF2cVMluSIs3e21IlbwP0M43OTRBJACcm5qa8AUggEjfiMRWLoyLmpoa9w3gVYpuLNrkgSPEV1xK7W5Ea4puTH4LAI951AFi/MsBOETcAaLnWwBcIN7J9b+gXAhFN56EnX/oEf//hn8cAMArY1X2EN3JC3AAAAAASUVORK5CYII=';
            ui_search.tooltip = "Search";
            ui_search.callback = cb_ui_search;
            let cb_search_close = function () {
                scope.SetCheckButton(ui_search.id, false);
            };
            modelSearch.OnCloseButtonEvent(cb_search_close);

            addButton([ui_select, ui_color, ui_search]);

            let ui_color_element = scope.Element.get(ui_color.id).element;
            ui_color_element.appendChild(ui_color_input);

            // -----------------------------------------------------------Control

            // Control 하위 버튼 추가
            let arrBtnControlSub = [];

            // 자유 궤도 사용 설정
            let cb_ui_control_free = function () {
                vizwide3d.View.Control.EnableFreeRotate(true);
            }

            let ui_control_free = scope.GetButtonObj();
            ui_control_free.id = vizwide3d.Main.GetViewID() + "ui_control_free";
            ui_control_free.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABjElEQVRYhe1Xy22DQBB9jlKAO0juHHAJlOAO4go2OWwZHDAVQAfuIG7Bh73HHaQDoolmotUyfBaDiZQ8yUIsMO/NZ3fGm6ZpsCYeVmX/8wIIjzEvJ3m5B0C/DMBT8PgK4Azg5Kw5Kd9WzppDuD6qCJO8JMJKIe0CiTk4a85CDuDFWbOJFpDkZQHg1Vu6kJfsrY+Mo5N6a0cAWyKnm2gBotwjfhOver7pjJYmoLMI2XMhr8nDIXImoXd2nIZBqEXIXkjYa614BlCMrZeuCFR8/Q57DHOQtngBvNVEPeX8cylyQqsIPSMXZ80uxtgUaCnI+No6TO4lQMI/WPFLCbgronrBVPC2fodyGP3KeUBOsEx5NhVZYLtXgBTffkYBYqtV2JoA2X4p5+4msI00sP0DtRsmefnB2/HCTWj0aRjY2bLXJODqrHkeEwGCNJ+UG8tUFJ73akPrnAeCQaSO6Qvsud/Oj84ataktNZD4nve288VHsi7PRwvADEPpzQI8IZPH8lkELIH//4brCgDwBVSmsQ0kmPi7AAAAAElFTkSuQmCC";
            ui_control_free.checked = false;
            ui_control_free.tooltip = "Free";
            ui_control_free.callback = cb_ui_control_free;
            arrBtnControlSub.push(ui_control_free);

            // 제한 궤도 사용 설정
            let cb_ui_control_limite = function () {
                vizwide3d.View.Control.EnableLimitRotate(true);
            }

            let ui_control_limite = scope.GetButtonObj();
            ui_control_limite.id = vizwide3d.Main.GetViewID() + "ui_control_limite";
            ui_control_limite.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACb0lEQVRYhe1Xv2sUQRT+EoRUmgixssh1Iit64B/gpQhoIVxhZXNXWo0nTG8arRZMFuwE18JC8McVgna3aQTFIlcMBGy8IkG0MYIIQjh54T0yGWd3ds7IFfrBcuzcvHnfvPe9N7Mz4/EY08TsVL3/8wQIx2ImJ2nWBNAF0Aaw5Pw9AlAA6But+h7b3GjVdcdriZAdrwG4VJMrkekarQpxDqBjtJqJJpCkWQ/APWfxPj82WhyZC9bYOoAFck4v0QSEOb/uAugZrfIAYSKSe1LkJVAqQt65OB8CaIScsxMKe5MjFYRXhLwLCfuG0apVZzELa74I+FAWgVX+HXFea8NJWzwB3r2onXL+9W85J/wmQmuRkdGqEbPYJPClQPIdFNxRwCdCEU8xyfqcwh7XP7hf5GWpnHWM/yjkSZpRqx1YUWxwNRVJmi34bNwU1BacxznV/kOrZ7RYQ7e4O6767A4RiFG8B1KubXsdoxX1hA0+xKoJMKSDxTYfcfjRM0x6mq9LQMQX1YAmha8PkOMX/LosR2oVWLxPAVwE8Mgztck6uGq0elkZAb5MSBryMvU6IALneajjeeSIvuYalp0FIpglPljq4LvMOT43h+ed62ifOxs08xLgsK/Ljqg914zEPu5eWcGZU4u4c3kFp+dPxBNgEj0rnxTGTe5yQdx/8xY/9/bw4N17bO9+q5xeeSmlS2SSZlTTNzkdgyTNhtxeCxxE6xC2Pn/BcOcTXm19CJINXss5EsuWMElQt7nlDsrsuk+e7RMJIerTjEu0zU1KDq2TXGavAfyoMKdoPzZa3bAHj+zbsKY+Nt12///jdLoEAPwC2QbgRdn+5P8AAAAASUVORK5CYII=";
            ui_control_limite.checked = false;
            ui_control_limite.tooltip = "Limite";
            ui_control_limite.callback = cb_ui_control_limite;
            arrBtnControlSub.push(ui_control_limite);

            // Pan 사용 설정
            let cb_ui_control_pan = function () {
                vizwide3d.View.Control.EnablePan(true);
            }

            let ui_control_pan = scope.GetButtonObj();
            ui_control_pan.id = vizwide3d.Main.GetViewID() + "ui_control_pan";
            ui_control_pan.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACU0lEQVRYheVXvU5bMRT+qDp0gzcAtkoeSJ8geQNSiZ0wdDUMXjr1MnWxVOQZiTCxho1OTcZKrQQSlhBL4Q0Asady9Rkcx05yHSKGnsXX9rHPd3597tJwOMRr0ptXlQ7gbelBoc0KgAaAO6vkeek9RS4Q2lQAvgRLAwBtq+TdQgAIbVoA9gA4rW8AbCfYrgGc8Ls3q1WmAhDadAAcJbYeADQJLAXo2CrZmQuA0GYNwB9/IQCn1VcA7wB8skoeks9fcgrAndngfB9A3yrZz8mYlgVtjgOnjVXyAMB3rv2Kma2Sjt+565JLLk5+OIC0ZG0AKxxDDdxFHyMf79BCYCB+5vojgAt+Hwlt2oiodhpSQC9a6wLoBkuPHH9bJVtCG2e5XQBVfHZRhchlyr2rEZxXHDcYV4sFYJW8YZHq4NlqA243Qt6sCxg0W5y+LwQRUp9p2wjdMAZAaOMZVusKLaGUC7xw58OfXLt6AVne9yPlegQAtXfCb3ng7KU0DQCMlOjYAi2OfQbOeepQITVnAeAD5x9aq6RzxzrHYgoK0G38YsYAPLqnVElEcwl5AGOKjACgMOf/5VztrktsXDyAbnw8lQWeqUrslWq/TPOPxVIKwAFTcJU1fF7yiiQVGgPAIPHm353HFeykfE1JBnLyLWDU73PqntG9QgxPvs/1i9nHyCpZ+TcewDehTY8BVYd8NpV1ROzpdjjdzJlxAvniU9yS+WbjA6fNKey5O7Lt+sz/BUHjOZjCGlKTAJZyDCV/RnWtcD9psw6A9eBFq0MTS/l//ncM4C9YmNQ0199NoQAAAABJRU5ErkJggg==";
            ui_control_pan.checked = false;
            ui_control_pan.tooltip = "Pan";
            ui_control_pan.callback = cb_ui_control_pan;
            arrBtnControlSub.push(ui_control_pan);

            // Z축 고정 회전 사용
            let cb_ui_control_pivot = function () {
                vizwide3d.View.Control.EnablePivotRotate(true);
            }

            let ui_control_pivot = scope.GetButtonObj();
            ui_control_pivot.id = vizwide3d.Main.GetViewID() + "ui_control_pivot";
            ui_control_pivot.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACIUlEQVRYhe1XsU5bMRQ9VN0hXwBl9UAkPiBBKnPL0K6FhW4ulSzByAiSpQZvZYG5UzoXiccOUhk8VuQPKF+Q6krHkuX4+b2kpRngSE95dq59zz2+9vVbGI/HmCdezNX7kycgeDmNsbJuCcBbPm8yJlcAhvJ4o0fJ2C6Avjd6EPe3VkBZdwhAJj2rcS7oAfgC4E5ZNyDh4LwCsJQOaFRAWbfCqNai7u/si6MUuz7VWQTwSd5JfMC+CRQJRMzDYHG8l8ob4ZxRH5LAMhWrRS0BTjSMnO94o8+bFPNG/xaSyroRl6OIkgJDRiDY8EZXTZNF5LtUoRHZJFTW9ZlQgs8zOK/q1jxF3S4I7G/TbfMvnQsmagGz/o7NVuv+N8gp0A8vj+1ckCOwwt+rx3ZeR+C/YqpaUIKy7jWAHwWTC2/05jwVuMl15hQIx2wv81+TgzTCrwBWAdwDOM4NatqGW97o4ZREwjzvAHxj88AbnSUwsQQsNLds7s3ovAPgiM2bOudZAkQ4/XrKullI7FN6wUHJsPZWrKyrmAcPvMn8bONZWbcO4JrNU2/0x5J9aRds07mc6xULVBsE6e+bohcUvwsyxeVEChVrfs5+l5mPUuK1JhCRiO8GD2xX3LIjSVwm3i8AHUb/Pp3LG32R9jUeRFz7LqMH1fjAq9YllwpMvA7fOzwV02cCrU5CkdwbLbvhlVxQkkIVbrrrbeZK8fxt+MQJAPgDZX69t0kf+CcAAAAASUVORK5CYII=";
            ui_control_pivot.checked = false;
            ui_control_pivot.tooltip = "Z";
            ui_control_pivot.callback = cb_ui_control_pivot;
            arrBtnControlSub.push(ui_control_pivot);

            // -----------------------------------------------------------WalkThrough 사용 설정
            // VIZWeb3D 제품 미지원 기능
            if (vizwide3d.Main.IsVIZWide3DProduct()) {
                let cb_ui_walkthrough = function (bool) {
                    let flyID = vizwide3d.Main.GetViewID() + "ui_fly";
                    let eleFly = scope.Element.get(flyID);
                    if (eleFly !== undefined) {
                        if (eleFly.element.classList[eleFly.element.classList.length - 1] === "clck") {
                            vizwide3d.View.Fly.Enable(false);
                            scope.SetCheckButton(flyID, false);
                        }
                    }
                    vizwide3d.View.Walkthrough.Enable(bool);
                    scope.SetCheckButton(ui_walkthrough.id, bool);
                }

                let ui_walkthrough = scope.GetButtonObj();
                ui_walkthrough.id = vizwide3d.Main.GetViewID() + "ui_walkthrough";
                ui_walkthrough.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABkklEQVRYhe1WwVHDMBBcGAowHZCvX+4gSQWECkgqEHnoDXn7QVQB6YB0QNJB+OgLHeAOYDRznvEod6cokAwP788nn299uycJPXqkUNauOGWTLqSFsnZPAAyAQKABMPfWrM5CgIo/MksDb83nXxK4FOImM340roRESfdJkEIqVtauanO9NZtDSEkSfCs5196aJno/FH0FMOqEdwBm3pqdRkCSoBHiARUTe4iKt++9paZIIrDWkhgMhXhB5LIJOCXnholpk6EalyVAukkm4ghslRpFWbtYHp0AYSHEb+MAbVBaF/ZykgRojLguVIKxxPFkDJomkPjoJA54a9aKebnJSRMgL8RSbJR2z6QRlnyQ6kAgEc6FJXVjQEVGZe1eYilog9KkyCdAH57Tn4Xd7oMOqil3YCmGPK4DHdwzWkqbDDdBrDQ5BDh9WS9QFxpaX5J07F3iYAJ0Dxh3nB6e75SUsbcmFH4H8Azgi3tJvBH9FtGNqv2JvXo5EuRiqNwrzkIg9gt7LzglgUWHREMm7tHjnwHAD2jlb7TznvRMAAAAAElFTkSuQmCC";
                ui_walkthrough.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABTUlEQVRYhe2W4W3CMBCF7zoBI9AN2ABG6AhsUEbIBlEn6Ah0A+gEYYOwQbrBq0wdKTL3LsRJ6J88KUIxZ/uL751tWbSoTwBW/7JIAAoADf4UfvfPntzS+lkADQEop55LCQBI/FVVX9lgADYicvOMqp6zqcjXt7ozZWgDcEriqgiUBcBSELQz4plnmr4qeiHtXwOZt6Q9TH7IAfhw+liVcHXi3wcDqOpFRJiJLIBvZ46VlbZehU4kr5XVF0Dt+CavfA1ne5Xw5gCY0I8AbMiA5rYM4MgIsgDELrETy2ncD1gJD/dBZ+ASwCGcBfEJUJ8kFfvJAToDV8mgprmIIYuxAKYhHdhU7ob0CMDayG/txDdxJcrYd/zFJlZF6/TaO2za/+JqHEdVQiZska6YFcfOgim0be8GnuYE+EneLzPOda/ol+6lNu9ysmjRrBKRX2CmsN5CkHa3AAAAAElFTkSuQmCC";
                ui_walkthrough.checked = true;
                ui_walkthrough.tooltip = "Walkthrough";
                ui_walkthrough.callback = cb_ui_walkthrough;
                arrBtnControlSub.push(ui_walkthrough);
            }

            // -----------------------------------------------------------Fly 사용 설정

            // VIZWeb3D 제품 미지원 기능
            if (vizwide3d.Main.IsVIZWide3DProduct()) {
                let cb_ui_fly = function (bool) {
                    let walkthroughID = vizwide3d.Main.GetViewID() + "ui_walkthrough";
                    let eleWalkthrough = scope.Element.get(walkthroughID);
                    if (eleWalkthrough !== undefined) {
                        if (eleWalkthrough.element.classList[eleWalkthrough.element.classList.length - 1] === "clck") {
                            vizwide3d.View.Walkthrough.Enable(false);
                            scope.SetCheckButton(walkthroughID, false);
                        }
                    }

                    vizwide3d.View.Fly.Enable(bool);
                    scope.SetCheckButtonImg(ui_fly.id, bool);
                }
                let ui_fly = scope.GetButtonObj();
                ui_fly.id = vizwide3d.Main.GetViewID() + "ui_fly";
                ui_fly.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABOUlEQVRYhe2VzVHDMBBGXxgKSAlw9QXSQdwBVAAdiBx0Bp99sStIqIDQgTswJ11JCSmB2UHMGEWWpYkPzKB38Y+02m8/r2QymUzm37MYGlDU7RZ4Bz6AO+ABuJ3ZpMZotfl5uHAGl8Ab0AM3QAVcAxsr6hyOwP0wuU9AOxDyOKOYTmKNVnt3YOG+KOq2D9guVewTP1NltHoZG3QdYOCCjxRnDsAqlFw4cYBvFz6Bq1Cgg8+ZndHqOBXoc0B4TUiO48xaxMQkDwlobFUpyPzSXvvYOK8Aq/6kYwN0tg/W1oXlWQIsVeQacrBI5U/Ac4LosACj1cFWNsavg8V2ezkREy/AMuaCdHrpHixGq866sYoV4N2GQzxbcid7PrbLp7iMmCMubO29JG7mSJyEuFDU7dx/xUwm8wcAvgD07WL3MVysjwAAAABJRU5ErkJggg==";
                ui_fly.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAA5ElEQVRYhe2UYQ2DMBBGP6YACczBJCABCZOABBxMAhKYA+ZgEpDAHLyFpSSEUGgLW/aj7yehd693vVMkEolEpgA1UAAZUAJPjudmLTrQmHT9F2SGmMVqx4HccnCvTAukTs9tI3iITOX1zoGr4622ZDrg4pV8ItE5SqzJuJXcIlB5CkwZKpgFJzcCqbmVbxVyU4XeNddp6WOSJC9Jdw/nh6SzpFxSIym8/COmly58Fsu8bbsFTNB2o+TF7P98PHOUwNJiwoybdcSCx88SbD6S9a4RCxCYLqbyZ4lnEuFbLRKJ/DWS3qo2Ov3gnLw9AAAAAElFTkSuQmCC";
                ui_fly.checked = true;
                ui_fly.tooltip = "Fly";
                ui_fly.callback = cb_ui_fly;
                arrBtnControlSub.push(ui_fly);
            }

            let ui_control = scope.GetButtonObj();
            ui_control.id = vizwide3d.Main.GetViewID() + "ui_control";
            ui_control.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACr0lEQVRYhe1XTWgTQRT+NhVzKvagl5JSawUpI/hHEQS1KAE9iNgeKh5MwB4EcfWwF+uheLBe9lBXKiKKzUWaQ6SeDASlKghaFAOOxUOtJTEXe2gNPaSoK2+YjWt2N9lsIj3UD5bMvnnzfY+3b+ZNFNM0sZYIran6ug+AsKHSwHTjPYBdHv4JrqnxaoRMNyYAxDyms1xTd9sNbhnwEm8GHNyODFjgmqoEEZQZcmSJ6YbrdmuoBphuXKanEQ7PDNQQHgRwB0CbfB8BcJ5ravKfBsB0oxPAUwDd9N4a3ijsxdIqBTLJdOM6gKNcUxf8cvr+BEw3phVg3hI/yXqQOntGPDSW6CYf8vXL65aBRIXwTQAXAShURTu2bMaVI4fQ2xEp+4wej+LUzh7cePYCn74tUvEeZrrxC8AtrqmX3Hgt1OwFTDd+AGiBFE+cHkBrOOzqWyyVEJtMURCW6SfX1Kqf2c8nWLEGRNyfeIipD7MOJ7LRnE38r7Ve8FOElEr0bevCyy8LKHwv4mo6gyn+ERcO7BcO469eYyb3VYxbQiEc3NqJ6c/z5bWNBiAQ792D8f4TiCdTeJsvCMF48lF5PqQo2Bdpx8TgAGZyeSuAmqj7HCCBd/kChtMZ5JaWha2jbRNGj0WxN9JeL12wk5CE0kN/+g2Ng4gHDqCZ8B3AG1lkzfZ1uw9QP4et72fpYLktKj0vKt9+CNlB8/YdIdd68Qq4ZSBmv1BwTe0D8FwBTKvyh59kxKFjgcZkoznyIV9aI9e68lYLwAEiMoEuAHM095jPInr3QdmNxmSTmCPfCnFP+N6GssNtl/1/RHZAgWJplX6WAFzjmjrml5NQ9zkgBcaYbtxTgHOyk9znmjpUL1egAGyBkGAgUV8BeNzhGr0VO+BWhNkaaxqBg/v/f8N1HgCA3/WsBlnMBS5LAAAAAElFTkSuQmCC";
            ui_control.checked = false;
            ui_control.tooltip = "Control";
            ui_control.subButton = arrBtnControlSub;

            addButton([ui_control]);

            // -----------------------------------------------------------isolation
            let cb_ui_isolation = function (bool) {

                let selObjects = vizwide3d.Object3D.GetSelectedObject3D();
                if (selObjects.length === 0 && bool) {
                    alert("선택된 모델이 없습니다.");
                    ui_isolation.element.classList.remove('clck');
                    return;
                }

                vizwide3d.Main.Mode.ShowIsolateView(bool);
                scope.SetCheckButton(ui_isolation.id, bool);
            }

            let ui_isolation = scope.GetButtonObj();
            ui_isolation.id = vizwide3d.Main.GetViewID() + "ui_isolation";
            ui_isolation.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABNElEQVRYhe2WvQ3CMBSED8QAGcF1KlZgAsIEwAQRRWqgToE8AbBBmCCMQJU6I2QDkKWTsAyxwRhofFJkyb689/nfiPq3Bmb+tJTXkExNkT/ksCokwCuxhqGS+SoCRIAIMPrk57SUGwBzAEKrbgEcmyJXbd1XANJSJgBqJj4AOGnNUwB5WkpVzlyxfKegZrkkRK19gvVKu+AAHHaVZAtgDyAzLBnrVbugPxwA5/zAMunxJIYvKIDgnJs9N5XRJ2wm3zVgDfqOfAHafwK03GqVw1fRZ4X1ATgCWLDsO2g6zSdtwZ4eRI6XzIq9WnO/z40FWTH5mrvhbAN47712B3SdhAtti6rRmDRFfgkGoIH03QWSPa8J0gvxEcALgGMXxFevYyabMHmi3SG/ATAgWi7gqKi7ANwAIBVXa82bxE8AAAAASUVORK5CYII=";
            ui_isolation.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABFUlEQVRYhe2W4W2DMBCF30UdgBHIBhkhnaDpBmzQjMAo3QA6QUdoNggb0A1eddFJpQR8xXVKfvhJCBkf9z7O8hlkrS0Z+5NkSiYRufIIKiXAb3JtUpnFKgNkgAzwJwCSNckzf0rHtYV8ejkeIo0LAO8ASgCvAN4G008AXkjq/Tkmudu9SH7YdSDZjCrQ2PNLTHIAK3tvJj2nNZyvQ/kmD6PQAaJrDKC18h8CuTWm0xgR2YYgrgC8eZL7mS8fa+/li90FZeR7yQC6NQE622qtE9da3DLYG+yC42IAR8cFfUC1C/kt+1/7hvQ6YQWgsLG240cROcV4eSBzZ4FWaTdYot6rxE10lxD/DjCA0KWpVgHIul8B+AKgwr7ON4QpowAAAABJRU5ErkJggg==";
            ui_isolation.checked = true;
            ui_isolation.tooltip = "Isolate View";
            ui_isolation.callback = cb_ui_isolation;

            addButton([ui_isolation]);
            // ----------------------------------------------------------초기 위치로
            let cb_ui_camera_home = function () {
                //vizwide3d.Main.Camera.InitDirection();
                vizwide3d.View.ResetView();
            }

            let ui_camera_home = scope.GetButtonObj();
            ui_camera_home.id = vizwide3d.Main.GetViewID() + "ui_camera_home";
            ui_camera_home.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABHElEQVRYhe2XwQ2CMBSGH8azcY8edAPdQDcAF6iXjtFE0gWEDRwBN4BD9zAugGnyIAgFWyiBRP6EQ0v7vj99La94eZ7DlFpNSp+DgfWQyYSLLQAk2DxKRl+2MXqvQAW+wycxmNZQr01Yg1cVS0YDwkVaeZdJRvdtsfqmINLAlfwaHFrGlbJOAeFCwU8dQ2428awMINy3mePMAOEidA03NkC4CADg6hpuZADh9yEQPDX2BggX56Fw1MPaAOFCnd3YAVzpgHuoIe2HCOFPANg4MlDoIhmNqh0NAyPCld5qNSSjadGhS0E4Ehww7lcqJi/HncWIcOHsuiQZ9XT9y43IuhzXl3JompYULAZmbyD70daNMYlTavk3/HMDAPABlO1TpQ9j4dcAAAAASUVORK5CYII=";
            ui_camera_home.checked = false;
            ui_camera_home.tooltip = "Home";
            ui_camera_home.callback = cb_ui_camera_home;

            // -----------------------------------------------------------화면 맞춤
            let cb_ui_camera_fitall = function () {
                vizwide3d.View.FitAll();
            }

            let ui_camera_fitall = scope.GetButtonObj();
            ui_camera_fitall.id = vizwide3d.Main.GetViewID() + "ui_camera_fitall";
            ui_camera_fitall.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABkUlEQVRYhe1WzW3CMBh9VB2AblCuPsEGZQOYoGQCi4PPDOAD8gRhg7IBbBB68bWMwAatPvVZMo5JAkj00DwpUvLy2d/7fvwl6NHj32MQEqCs+35kMrzRgzPikQJiX0+PcnoJzxl1rwC+Yq6Wrl+7BYA1H5fe6E3G5iyruX1qGfBGHxOqSDZ9U9ZVAEoAG16lcPKuaW0ObSUoQmTKuqGyTpzuAJwATLzREvlS7sntxEZsGcymTUStBDnnhJRlmOHF0QHAlGURkTMAL0GEsg7kuwnI1YrOBStl3dEbvY9fMv2rxDbsF0rVTUADRoxEUr2V5qPpmlGLqGnaxE24SgAbVFI9o9OKr6T+c2/0ltnovOe1GQhCxNFWWffB5/kt+9wsIMLnneuvm4TheN1r0ypAJhiPVAypc5Xh43UL9sUp5S99a5oyUCbORuxy4eUUjCMHY+F4Qva0jUVlZ0CbgDMR3uiTN7rgMRsy0ndeFbmp2IhtF+eCLk1YxkOEA2iSfIxq0zFa2w39/wD+4LesR48eAPADgjStVhFCYgYAAAAASUVORK5CYII=";
            ui_camera_fitall.checked = false;
            ui_camera_fitall.tooltip = "Fit All";
            ui_camera_fitall.callback = cb_ui_camera_fitall;
            // -----------------------------------------------------------렌더 모드
            // xray모드 비활성화
            let cb_ui_rendermode_smooth = function () {
                vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Smooth);
                //scope.SetCheckButton(ui_rendermode_xray.id, false);
                //// scope.SetCheckButton(ui_rendermode_plastic.id, false);
                //scope.SetCheckButton(ui_rendermode_hideline.id, false);
                //scope.SetCheckButton(ui_rendermode_wireFrame.id, false);
                //scope.SetCheckButton(ui_rendermode_grayscale.id, false);
                scope.SetCheckSubButtons(ui_rendermode.id, false, ui_rendermode_smooth.id);
            }

            let ui_rendermode_smooth = scope.GetButtonObj();
            ui_rendermode_smooth.id = vizwide3d.Main.GetViewID() + "ui_rendermode_smooth";
            ui_rendermode_smooth.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACMklEQVRYhe2XTWsTURSGn2QSMw35rrViLU3RhWRVcCMIWl0I7vwJ/oOAkI0b61KyMf+gf0B0KQhaEUQQRbCGLmxMMULb0DRNYyftfCDnkkgNneZL7WZeGC53Zjjvc+89Z+4dPJ20fP34Z/KFu0AamGm3CWCu67VPQB0oA2vSFnPZxV6xXQEy+YKY3AEeiGk6lUQPBDgbjajn0j+scm1b9dZ3m7Qsq9MXmIfAs2IuW+8bIJMvLABZPRBIXDozwfyFWRJjeq/B/KG60WJp9Rsrm1UBEvNCMZdd6AmQyRfmgVdiemVmWo16FMlsvFv7rmCAG8VcdulwOL9bbAEY1VwkMSSWm1wBZAr/lo6L5TrEx2/eqkQT+nQyMRRKebuupr6ToAMB3L95nSefv7D4/qMCEYhO5ksldC+PrLVUAO2KEHNpY6EQl89P8aHyYzAAyf57166yvL7By68llc3tRPqtTmV0T/EpTcPv8zEdjzMZjRA/poJ6ZtnF0+NMxWMYpoVhmmqkq1s1DiybSmMHy3aYTSXZt2xlLO8YloVp2+jB3kk8VJqfi0UVUEwPKTMFJsamNXAs1yr4X/IAPAAPwAPwAFwBni4X1Td+VNmOQ2mr5hpF675RffG8PHHrtm9lszr3ulTWN3abTMYiBP0aluP0fcluuGO0qDQa1PYMOZQ+OuqY3v+xPJkgqGmkwmOYtsN4OMy+baltWdpqcw/Lsfl5cKCey7Y99LH8CJh/9mPi6WQF/AL6gBccMB9+3gAAAABJRU5ErkJggg==";
            ui_rendermode_smooth.checked = false;
            ui_rendermode_smooth.tooltip = "Smooth";
            ui_rendermode_smooth.callback = cb_ui_rendermode_smooth;

            // xray모드 활성화
            let cb_ui_rendermode_xray = function (bool) {
                if (bool === true) {
                    //scope.SetCheckButton(ui_rendermode_plastic.id, false);
                    //scope.SetCheckButton(ui_rendermode_hideline.id, false);
                    //scope.SetCheckButton(ui_rendermode_wireFrame.id, false);
                    //scope.SetCheckButton(ui_rendermode_grayscale.id, false);
                    // vizwide3d.View.EnableGraySacle(false);
                    scope.SetCheckSubButtons(ui_rendermode.id, false, ui_rendermode_xray.id);
                    vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Xray);
                } else {
                    vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Smooth);
                }
                scope.SetCheckButton(ui_rendermode_xray.id, bool);
            }

            let ui_rendermode_xray = scope.GetButtonObj();
            ui_rendermode_xray.id = vizwide3d.Main.GetViewID() + "ui_rendermode_xray";
            ui_rendermode_xray.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACRElEQVRYhe1XMW/TQBT+EieHSYIaNaQSYiCICkGFoIgBiYmfwMLCAMwsFkNmytwp/wD+QRdGdiSWDuBULaoCVUXkkDZJm9hJfWd0r3EVgs+xCSqVyCdZTz7fvff5/L13z5jhXyMRJf7SauU5gBKAK0ObB7A8Nm0dQAtADcBXac2y8WaS71ACw8CvZNDFiwXkGMPy5Uv0bLEwj9w5hpbtoDs4Qm1/n8bNujV6L8m8DiMSSGBptbIC4JkM/PDaVTy5ewfXi4VAB9ZhN3B8u7mHtU9VfPi24xN5a5aNlagEPBn48e1bKOayYJqG/Hk9FoG27eCIczR7PbyrbhIRs2z8Fi8ZuBrAiwf3Kfi0KGQyeHpvXC4RCJwWlAT8LZwW0kfLcZReUqoHcmHb5kglk5hTfP8w9LlLGeIKETpPScCHdFDvHKBqNWjEF6NMyZSmkQiFEGj2bBqXohPCQ2k+H4noRALjkG+FEfu5bsV18QvOrghnBGYE/hsCkeoA9zw643uDAd3brkvFZsA5tn406bRMJhLQ08fusmlGa7TE5H4nlIBfx793DqnCqeb4Z8ZBv0+2gS4u6IxOQlk505oWn8Bup3NS7YQXXs+DwIVHZVpeql5CQqkBP/jfQJivs5sF779sn3zTaSDF+3FnV+lBpYGXG1bD2LAapRsLRdxcKFJfEAdy22WGjHTHlaDlkdtyX815Xae0yzCGLEujttc6zgTBSXiO64ILQfaP2/IAIo+GPyJzQxv2YyJtW1qzbKzF2rYZTh0AfgKkNAp8umpE4gAAAABJRU5ErkJggg==";
            ui_rendermode_xray.imagesrc_checked = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACH0lEQVRYhe1XTU7bQBT+xp7EiSFyFfFTKhHYsKzEputegAU3gBsgTgA9Ajdob9CbwA4VVKntpq1aSJyUJI7tGfQeHqmAx9iNVJDIJ1lP8zzz3qeZeT+DGR4boox/rfUugHUAa5l8AWDzzrQTAD0AXwB8JSmEeP+Q7UICmeMDcppoTWPESvO/RCtoDYSTGK4APNdlvS/l32Mi866ISC4BrfUhgB1yTA7o86Wba+D3OMrVRyrFSrOJpWbDEPkghDgsS0CTUzIeK4Wa4yCo1yoRCOOY1zZcF505n4kIIe75c3JXA/g+HLGBaTFOU5z1B1YrVgL/C1YCZgunBdmg47RB2n7wQqUghUBQr1emMUkVwniCJIuaygQMKPx+jEb4FPZZYy7jnJSQjsOXMNUa3WjC+suIxsDavF+K6IME7sJsp5GnvX5VE7fwdC/hjMCMwLMhUCoPUKIZJimGScJjKjCUbChbfh784Wp5qydwJa9x7xe/agRMHv85GuMyy3R5c0zNGMRJpo3Qqkm0vTpnTiJYmQCVY5PtlC7O53mgHfg1jviz9RIEezUsqGBVUWTr6UbB25dLfI7TgrZ/a/WV1YrNw/5G0NrbCFrr5+EAxxdd9CoeyXKzgTcLbbxuUwfPTelR3rzSbTlFQpQqjgjqeHtZt/zt6goLnofFhscteWfe5zDs3PQD/9aW5xDZzh4iQSaLHiYkQ5JCiI9l7M/weABwDZmPAlsid3otAAAAAElFTkSuQmCC';
            ui_rendermode_xray.checked = true;
            ui_rendermode_xray.tooltip = "X-ray";
            ui_rendermode_xray.callback = cb_ui_rendermode_xray;

            // 플라스틱 모드 활성화
            let cb_ui_rendermode_plastic = function (bool) {
                if (bool === true) {
                    //scope.SetCheckButton(ui_rendermode_xray.id, false);
                    //scope.SetCheckButton(ui_rendermode_hideline.id, false);
                    //scope.SetCheckButton(ui_rendermode_wireFrame.id, false);
                    //scope.SetCheckButton(ui_rendermode_grayscale.id, false);

                    scope.SetCheckSubButtons(ui_rendermode.id, false, ui_rendermode_plastic.id);
                    vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Plastic);
                } else {
                    vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Smooth);
                }
                scope.SetCheckButton(ui_rendermode_plastic.id, bool);
            }

            let ui_rendermode_plastic = scope.GetButtonObj();
            ui_rendermode_plastic.id = vizwide3d.Main.GetViewID() + "ui_rendermode_plastic";
            ui_rendermode_plastic.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAB5klEQVRYhWP8//8/w0ACpgG1fcQ7AARY0AW0eyZdYGBg0MehfuHVkrwEfAZq90xawMDAEI9D+uLVkjwDZAFsIYDLcmoADLMxQgAGrpbkMZJjITSEMEJJu2cS1uw2mgtwRgEyQA6+BeHBYPrG69cMsUYGDJ9//mJwnTWf4fPPnxj6iIlGkkIgztiAQUNMlGHVxctgy0GgevturJYTC7CFwEJsennZ2RmyrCwY5p46w1BoZw0W23fnHsPeO3eJtQuruRgOwJXP2zxdGZ59+sQgzM3FIMXHCw76qu27ifYpLnOJigJnFWUGJxUlhtknzxAd9KAQIwYQ5YAKJzuGacdOMqSam4D5xAR9pZMd9RwAA+qiIuCg79h/CK86U1kZBn9tTeo5YMbxUwxZVuZg9rRjJxiefvyEUy0o6EHpBRRiVHOAr5YGmD79+CnDorMX8KrNtoY4lJA6khxgKisNDvrqHfhTPSjoQYm0ioSygeg0QCjoGaBZdfG5CwynHz8h1lhMB4Dqc2idDgdEBb2VOTj+px7FHvfYzMXqAGhjAqVBQSjoQcUzKJESKBswzMXlAAxATNCTWCzDAVG1ITG1GqiMuFqSR7IDRhskOKMARxuO0lYxBsAWAheJ1UwGwDB7tG84wh3AwMAAALWZuPAHZA7KAAAAAElFTkSuQmCC";
            ui_rendermode_plastic.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABv0lEQVRYhWP8//8/w0ACpgG1fcQ7AJcDLjAwMPzHgRcQYeYCPPovEOMAffL8QhTAMBtbLoAJMFLZcqzmjuYCFiLVweMpYeVaMK0hKsqw+NwFBl52NobdaYkMvOzs2PQRjEaSQmDR2QsMN169ZgjT1wVbDgKtnq64LCcKYAuBhdg0fv75k2HasRMMyWYmDP2HjoLFnFSUGJxVlIm1C6u52ByQgE1h1fbdDFJ8fAxvv35jePbpMzjo2zxdifYpLnOJioK9d+4y7LtzjyHV3ITooAeFGDGAKAd07DvEkGVlzjD75Bkwn5igb993iHoOgIGbr9+Ag77C0Q6vutOPnzBsvHqdeg7IsDRjmHbsJJidZWXBIM3Ph1MtKOhB6QUUYlRzwOZrN8C0qaw0Q5yxAV61U49CHEpIHUkOOP34KTjoWz3wp3pQ0IMSaRsJZQPRaYBQ0DNAs2qskQGDqawMscZidcAC9HqfqKA/dhIc/9nWOOMew1wwAFXHaBgG4OJPPnz8jw9cf/nqv1b3xP97bt9BV4VsNjYx4qKAmKAnsViGg9EGyaB2ALZWLSWtYqIdcJE4t5MFMMwe7RuOcAcwMDAAAKtfBuXKnY6dAAAAAElFTkSuQmCC";
            ui_rendermode_plastic.checked = true;
            ui_rendermode_plastic.tooltip = "Plastic";
            ui_rendermode_plastic.callback = cb_ui_rendermode_plastic;

            // 은선 제거
            let cb_ui_rendermode_hideline = function (bool) {
                if (bool === true) {
                    //scope.SetCheckButton(ui_rendermode_xray.id, false);
                    //scope.SetCheckButton(ui_rendermode_plastic.id, false);
                    //scope.SetCheckButton(ui_rendermode_wireFrame.id, false);
                    //scope.SetCheckButton(ui_rendermode_grayscale.id, false);
                    scope.SetCheckSubButtons(ui_rendermode.id, false, ui_rendermode_hideline.id);

                    vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.HiddenLine);
                } else {
                    vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Smooth);
                }
                scope.SetCheckButton(ui_rendermode_hideline.id, bool);
            }

            let ui_rendermode_hideline = scope.GetButtonObj();
            ui_rendermode_hideline.id = vizwide3d.Main.GetViewID() + "ui_rendermode_hideline";
            ui_rendermode_hideline.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACEUlEQVRYhe1Xv0vDQBT+FNcWOyW4WNcQsIvgZru6iH+BurjWpXPbOYtZXax/gbi4Nm6CgxFCV+siyVbaf0A+eYFrubuaFNGhH4T8uHvf+967u3cXrPHX2PiJfy8IzwHUAezKfRtAY6FbDGACYAzgg/dRpz1Yxm0VII67dOpWKuN0NqOTN2mOLg8Pzvhw8/xyB6Ap3/fdSqWRzmZ1EdO3CdEK8IKwB+BMoh1cnxw3dqrVB991emq/JM2+33XfP6fTk6uHRwo+FyF3o067t+hr0yCMUTOqvVGnfbFTrU5smdKBNrQlh3B1df22TAQ6tWUw6rQZfc8LQq0AUwaYxqaprShsXMYMABgmaRZxEq3ouKtM0EICWmI8XCAkYt915uZFkmbq0jwSp7wi4RpCA6MA33VoGCVpRtJ7IVfFqM4XxzevB6e+63AlcGVp/RjngCIkFrLQd50NXhJRS6LLI2wp7fQ2zp3bYBsCm6gIypDk72WwNAO/jbWAtYBSq0ApSEdYcTUsFSCFiNtyQ1NwcjQxX5xYiCa0XVYLrJtRkmasfK8iIFYKUE0KDveJvjzXlPZYbF7JUXozUqocI3+ypVj2hrkCJQK7pn3AmgEpra1VqhxtySFBFBOwiuMiXMYhkHPhQE40peEFYV3OhVqYMtCXQ+m7F4S3n9PpdlEBtKEtOYRLe7D5n8dyg5Bf+TFZ428B4Av6WOgZALxw5AAAAABJRU5ErkJggg==";
            ui_rendermode_hideline.imagesrc_checked = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAB1ElEQVRYhe1XMU7DQBCctVCEaBJ3dIQyFflBkifwAuAlTp6QFwRewBNsXhBTuUKEjs6xkBBKYaMRa3QY+xLHQqHwSJadO+/s7Hlvb4MWh4bs4j/LsmsAfQBneu8BGBZeCwGsAawAvPAuIrfbuK0C1LFHp5s0XXUch04edTp4ff+44sPpyfEdgLGOX2zSdNhxnL6Kme0ipOh4mmXZc/aFxVPytoziZFp8j2NV47ShrXKQ69d7hFOhgVEzqnMRudmk6bpWBABoQ1tyKJdXRwBEZCoiq7qOS3iYC6XRWwVEcTKumqsLG9eRhcuP4iRgEjV07BkJWkvARI39AiERDtzuj7yI4sTcmiN1yitQLh8lKN2GTFsRESUm6b3u/d6Owa/1uhy43bDIaaIyB3IoAZNxPnC7wksjmmh0eYQTY35Om9y5DbZPYBMVwPgk+e99sHUF/hqtgFbAXrvAKEgjNNwN/7cQMaooTlg+l9oFhUYBcrXg8JyY6bNrzIdqwz7C3/swMqocz4QH2xLr2fCjQKlAr+ocsK6AltZJkypHW3JoEPUENHFch6tSgPaF/abOyVHVD9oE8Nux42Uzueg4zq7Z/w3a0JYcylXa2By8LT/4H5MWhwWATzuBAvm0v3xtAAAAAElFTkSuQmCC';
            ui_rendermode_hideline.checked = true;
            ui_rendermode_hideline.tooltip = "Hidden Line";
            ui_rendermode_hideline.callback = cb_ui_rendermode_hideline;

            // 와이어 프레임
            let cb_ui_rendermode_wireFrame = function (bool) {
                if (bool === true) {
                    //scope.SetCheckButton(ui_rendermode_xray.id, false);
                    //scope.SetCheckButton(ui_rendermode_plastic.id, false);
                    //scope.SetCheckButton(ui_rendermode_hideline.id, false);
                    //scope.SetCheckButton(ui_rendermode_grayscale.id, false);
                    scope.SetCheckSubButtons(ui_rendermode.id, false, ui_rendermode_wireFrame.id);

                    vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.WireFrame);
                } else {
                    vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Smooth);
                }
                scope.SetCheckButton(ui_rendermode_wireFrame.id, bool);
            }

            let ui_rendermode_wireFrame = scope.GetButtonObj();
            ui_rendermode_wireFrame.id = vizwide3d.Main.GetViewID() + "ui_rendermode_wireFrame";
            ui_rendermode_wireFrame.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACSklEQVRYhe1Xy1EjMRB9bHGHjWCHqy7rjYBxBOAIMBEIH+aMfdbBKIKxIwAiYIiA4aIr3gwmg91q71OVSpY1trcoLu4q1Xj0ee9J0+pu42hfbSe78CtjxwAKAD/4PAcwiKa1ADoAKwC/5ekqvejDzgog8T1JxRoAr8HvGwBjkj+z/yfFFRQzywlJClDGTgkuIAsCSmtdpX9F84TwGsCDq/Qk6L+isDGFLF2lpzHXty3CZNdLABeu0rc82icRpIydR3PfAcicO56Yt45rL4h1nyLaJgCi1lV6FRFNEkTgET8AqJWxg2hsldp5rwBlbJkQ5YnmCaIJ/eKFzprF6hUgQMrYl3gxieRkagBn0ZoRx8aeWDAoam8BQy8EgIi4JGDJby4Oehfs0l/NJbvKgHi4Cf/Ptt2CP67SJ/wtoI+8++cZwaF1bCNX6TbG3PUE1kYAOVYrAAQZsjVs6/dg3DIQtX34pzvuKBbVIHAu/36I9Z7AZ9tRwFHAQbcgiI6X+M/b0CuAgUii3kAZm8xojHoy17+vA5Gs7YsF2WTEOP4WVEE+6HxnwJkxSIHh2QeolmveUvlkJwFRHG8IKkCFq3QXzFuyaJmzBvBVUxPlk70FSGgdBt/12RMlUvEtT+KRScn3N4KRS0a5gmTDoQKiOiTygvnc2G3OOXM+MFXGFomhEb9vHZF0wZgOcArWiHsJmLEo/VDG1mEaZpk2YiF6E4loWbatUzfXfnDeLEW0T1m+oiO+c9hXwws6Yhn0lxRxWFm+Rcin/DE52tcagL+O1wbCyS+jIwAAAABJRU5ErkJggg==";
            ui_rendermode_wireFrame.imagesrc_checked = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAB5klEQVRYhe1X0VHDMAx95vinG5ANyAakG9AJCBMAExAmKJ0gdIJeJ0g6QcsELRM0G4gzPIPqpk7SA/oT3eViS7Hei6zICno5tZg2+CKSAogAXPI+ABB7j60AVAA2AN7t3Rjz2uQ7SIDATwS1UgJYqPEtgJTgc+qvSC4imec2RHzgTETW8iW5iCw5XtY8N6Nt7OmXXCv0lXUhIHQScV4QaFsDZK+Ua1KlLziOOJdOBLx5EQDKOB7TFmsCh3w6OQuQSHwd9/IFgAWLPdsj86JgsgZ9NRKwjvjmO4sJZJMrB3DhrRnR5iKUMBIFughDmZCAk4K6hGHeulwh2IC2B9kVt+64HCDYWgG2kS3XxHU+226BC/mKYZ0YCoAhr5LX51zZJyxEqyb/55325odUCZVcbn6MNEbgr6Un0BM46itQ1fEav/Q1+AD/VogOEqgpxaLK6gD7fUOqSnVdCe9cCd0B4iqerWo21JExplLPTQHYU9L2CRW3YaEqJEKHUYiALa1Dta9zB1RzFN+xXM9cdKgvrQ9FpD2BuoRSQLkGcoR533vbUHKGGpLvlsyTERvO3AOplO1e+Yk69YM43JRmyp4cajZV29aqKe3Slm+YiG802/b7hnkxZYI6fcJ/h8a2/OQ/Jr2cVgB8APSAnNBWqBbOAAAAAElFTkSuQmCC';
            ui_rendermode_wireFrame.checked = true;
            ui_rendermode_wireFrame.tooltip = "Wireframe";
            ui_rendermode_wireFrame.callback = cb_ui_rendermode_wireFrame;

            // 회색조
            let cb_ui_rendermode_grayscale = function (bool) {
                if (bool === true) {
                    //scope.SetCheckButton(ui_rendermode_xray.id, false);
                    //scope.SetCheckButton(ui_rendermode_plastic.id, false);
                    //scope.SetCheckButton(ui_rendermode_hideline.id, false);
                    //scope.SetCheckButton(ui_rendermode_wireFrame.id, false);
                    scope.SetCheckSubButtons(ui_rendermode.id, false , ui_rendermode_grayscale.id);
                    vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.GrayScale);
                } else {
                    vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Smooth);
                }
                scope.SetCheckButton(ui_rendermode_grayscale.id, bool);
            }

            let ui_rendermode_grayscale = scope.GetButtonObj();
            ui_rendermode_grayscale.id = vizwide3d.Main.GetViewID() + "ui_rendermode_grayscale";
            ui_rendermode_grayscale.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABsUlEQVRYhe2Vv04CQRDGPw0kFJoAlWhzDYZQ8QiWdMoTgE9wsbiaUFMoTyA8AdhR8gZeYU6iDY1/KiGRwgQKM5s5PPaG25PQcb+EZNnb2flmdncGCQkJe89BVALK7U4DQB3AhfbJBdDxHLvL6+i7zeuy2roHAHeeY88kH6KAcrtjAegDqBhOiBxMAFwBGAHo8X+fSwANHtc8xx4ZBbDzRy0SkcppAVY+i8HTs+9gIOxH+9yzyNCaQ2HjfhznJ8dHqJaKSgT9yAk7W4NS7zl2DUCX11gbBfCZm9KuqJbOkUmleFykcTaQbokbAHQPmlEZqMdxTtFbub9gSUjlrBBpz5ewpYvUBei3XcTK50LTLMiUPXX+/GpEAbHwUx8kk04bTaWnuJWAXbKVgJ/lMjy3WBjtpFeiCwgVConJ1zQ0O5mq7LoGU6oFCBYkXUAvjoDP77nvUEEZcd8+Iu05+ibXgxVrAri2m6JQDMcvq6MYjl9pPNM317jlAtcKToevM1CLU4opC+SYSrH7rqK/lm65UIqDvWInzcjl4hJsRjMO4P/NSBOyqR0rZ7toxwkJCXsOgF9eqZo8b/m7DAAAAABJRU5ErkJggg==";
            ui_rendermode_grayscale.imagesrc_checked = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABkUlEQVRYhe2VP04CQRTGv4FoNFishQVWHGGPwA3EE8gVPIF6Ao4gtDZ4A6htwGhsJcZIQeJuIWI0+JkZZnGZ/TchJBbOr9nZt+/N++Zt3hs4HA5HHiSbJHtMMpDfolCSdZJdkoHhKf3OSXpZaUSakWQNQBeAX6BxCGAEoAGgD6Cj3yOOAERCj4UQ/cI/LpOnnCSVx9eAN0/P0adGxn6erk6mjxkwsEkevM/YvX/g1e2dEqJFZ5aa5KX2qcXtJcOpaVF2xXA8xtd8vli/qLUXK3capwBCAGeZAgCc2CQPZx+YvE2X71LIKAhz44UQ0uHCFGkKqNsImEynSdtCUFH1rqG7JkuAFVHp43x+J20mugorrCVgk6wlYKtcTti2S0mbSVqXmAKKBwWAg0oladtTtmFBqJoD8YFkCujYCPB2d6KEClmR2r6XG69PL1uwHbevCBBCtC1OofCr1eWv8A/VOjQ3N2hJ7boVs/nzUYxfETYjeaBHLPWt2dQ3o6+fLX2YIN771uRcx71NXccOh+OfA+AHaTrxuNkplwsAAAAASUVORK5CYII=';
            ui_rendermode_grayscale.checked = true;
            ui_rendermode_grayscale.tooltip = "Grayscale";
            ui_rendermode_grayscale.callback = cb_ui_rendermode_grayscale;

            let ui_rendermode = scope.GetButtonObj();
            ui_rendermode.id = vizwide3d.Main.GetViewID() + "ui_rendermode";
            ui_rendermode.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAADCklEQVRYhe1WPUxTURT+wApoQUsiSBViUaPtk0BRAogDqAkJLJbBwUXazcjwYOgMzG+wb8C4WUbjYAkJIZpojUm1SAQVStUQajA6YKQxVhpsojk3F3LzWtrHK4aFL3nN7f37vnvOuedc7GG3UaCXX1JUG4D7ADoABAF4Il45lq/+nAIkRbUAuAPAbSsvR7fjDCYWPiK2ukrDfgADEa8c33EBnLgfgFxRarZcr69Dx6nazfHg4hIevpvDyq8EkasAfEaEZBQgKaobwKC5qMhGJ+62n4W5aH/avMT6H0xEPzCLJNbXyR3DEa/sNyxAUtQObm4nnba36XxG4kxCRqffMKsAmOVuCeoRYNL8f0Y/Q51XIB2t1H0KEnm7rYW5aOjxUyffR1eAawWgqqyUNoFRCxwxH8T3xG/d4tME3LrYjNmv39hmrx+NQ28MFBYU4Orpk7BXVmAkFDYugOA8ZmUbvfq8jPH5KBOz1S34mUyiwWpFvbUKxaZ9uomzCiCUmEyMsPVEDSajn3A3FGYnFfMAibwmOQwR5xQgCnHVOZiYwPwCE3L88CHcvOBEWXGxYeINFOqdaDlQAndTI2u7zjmykfdEvLLuFJ/TAjrhA0C1wjkSCtskRf3Ll1E+8P1vAZ6RULgdQKy5pppSsiyMtUuKGuB9lohX9uy0gGFOTqkbU8tf+jXjLv4xSIoKrYi0GPBPzyC+ltQroAHAdgpQ2lytgMuxH6uzvhchBOYWkEylcm3obK6pHtP0saLEP+17QdVukLUalphMNsoD9NF1JFCa7mtroWYPBRz5WTAzETZulGVe0md4gBIoHp6LgZnxGvKS2phMpYaDi0vxey+nWHoW0XepNcArp0voHhXfBLw9Koy7+JpNbJkHaHHEKw8BqI2vJf3kEhJCePD2/VbLto183oQ9PPrzcoFuATmELQldMcHsvQI5oVb7kN2JRCRr/hPhYJa5A2KH7lqQBZZ85hqvoxwrTybHKjq7bDwubnAL2Pkw+byLt6OZUnHeMaCFpKj9wlXLWYz2sLsA8A/d3in/17c9qwAAAABJRU5ErkJggg==";
            ui_rendermode.tooltip = "Rendermode";
            ui_rendermode.checked = false;
            ui_rendermode.subButton = [ui_rendermode_smooth, ui_rendermode_xray, ui_rendermode_plastic, ui_rendermode_hideline, ui_rendermode_grayscale, ui_rendermode_wireFrame];
            // -----------------------------------------------------------엣지 설정
            let cb_ui_effect_edge = function (bool) {
                vizwide3d.View.ShowEdge(bool);
                scope.SetCheckButton(ui_effect_edge.id, bool);
            }

            let ui_effect_edge = scope.GetButtonObj();
            ui_effect_edge.id = vizwide3d.Main.GetViewID() + "ui_effect_edge";
            ui_effect_edge.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAxUlEQVRYhWMYBSMeMBIbAFrdExMYGBjmUxpg10rzUexkIcXyCic7Bg91VZIt3XHzNkPHvkNY5ZjoZbmprAzpDqCm5QqCAqQ5gB6W43QAvSzH6gB6Wg4C2HIBOKuBDMGVcgkBYi3H5QCGBjcnsiwG6921j2jLQYBgNqQ1GHXAqANGHUA3Bzx4/2HgHACy/PTjJyBmIt0dgGz5tdL8BXR1ACHLaeoAYiynmQOItZxmDiDWchDAXh3v2kepG4iyfBSMAgYGBgYANjF0QJ/SUbQAAAAASUVORK5CYII=";
            ui_effect_edge.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAv0lEQVRYhWMYBaOAWPD///+E/1QA6NaxEGM/yHIGBob5X37/Yfjx9y/JkcbBzMzAw4rdKiZ6Wb7l8TPSHUBNyy+/+0CaA+hhOU4H0MtyrA6gp+UggC1pzgcRIENwpVxCgFjLcTmAYcPDJ2RZDAIB8jJEWw4CBLMhrcGoA0YdMOoAujlAV0hg4BwAstxHVgrETKS7A5AtZ2RkXEBXBxCynKYOIMZymjmAWMtp5gBiLccKqNH0hjZqRsEoIAwYGBgA8jv3i/enDYsAAAAASUVORK5CYII=";
            ui_effect_edge.checked = true;
            ui_effect_edge.tooltip = "Edge";
            ui_effect_edge.callback = cb_ui_effect_edge;

            let cb_ui_effect_shadow = function (bool) {
                if (bool === true) {
                    vizwide3d.View.EnableShadow(true);
                } else {
                    vizwide3d.View.EnableShadow(false);
                }
                scope.SetCheckButton(ui_effect_shadow.id, bool);
            }

            let ui_effect_shadow = scope.GetButtonObj();
            ui_effect_shadow.id = vizwide3d.Main.GetViewID() + "ui_effect_shadow";
            ui_effect_shadow.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACvUlEQVRYhe2XPWxSURTH/wgF5NUKLaCEkFA/avuqLTF+JE5UE5J2cjG62a4u6MBsnRn0Dbq2dXUxDo3RaBlMk/oV0gjU+lFMJWqBUlCwUJ6Ye/toCDxeHw+6aP8DAe7jnt8595x7DtjVfy+V3ACwfs4JYAKAG0AAwFjY5402G8BtAVg/ZwRwG8Co02TCSF8PpiOLiKZSZHkSwI2wz7vWcgDB8HUAXks7Y7w0cBzuw91b64FPS3gw/w7xX1linANwRwmIKADr50YB3GS0WifxeKT3GBhtW81z2cIGphfe04hkCwVyHLfCPu+kYgDWz7mFcLuIt1dPnRQ1LAYy9fotjQqAoHAsATkAmqrPM+Rl3HMe7AGrbC8I5LVzZ+kRjT957hL2kZXg1QAwMwayCZRGQK/RYL1YlA1fA3B58AQWVuJ4uRzDq+UY5OZAgedh7+iAca8eoR8rygGIeq0WdHd2Yv7bdzwKRahn9apgNZtDF2OAw7AfapXsa0UagEinUeO0w44B20G8iH7Bvdk56mnlPUC8PWoxKzK8LUAlyIUjh3DGYcezj58pCKPVosfchTa1WrHhsvbIfXCfToeL/X30vdNkbIlxItkAO6VdgBqAh6EIfubzijbb4HlEU5v9iPVzM0ILbwhgKJbOBO+/CdKMzxd5WYb5UgmxTAaLiSRpSuWvSV9ZYv3chNBZRSXZDXUatXPQZqN3ASlHoruzc+gX+gQxvJrLIZnN0fcSqtuyRWsp/vRx0OIZnuL/lPKxTMb1IZHUEwAzw9Dr2drOYO33Or6mM/S4JE1vSi9E5IrFM5wm+5cXGpqISKNKZHMNNxwRbbVspTNhSxT2eVWyy5AMoGGfd4gkquBBsxEg+8ifiqtVTlRyMzfws5qxTXkbqxpcAdQtNakqaAqgCoQmqsiy5OjeEoAKkB358/IPC8Bf8rslM9wGpS8AAAAASUVORK5CYII=";
            ui_effect_shadow.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACl0lEQVRYhe2XzU8TQRjGn6GF1i5tarGV6sGViBZjCMaDiV4QEw8kJnjwaMLZi3rxSv0L1EO9ol5MPBgPxhgTkYtEggkIKkbFkoApttIW2y39cH3NDAupbdfuthVj0ucyk5npPL/52vctmmrKqIhIJqLntCFeytuyeUTkJqJRbrteKNDy2pooNfF2dz3zsz8ZA7gM4FJBVd1RRUFyPbvV795hh0+S0GqxJAHcBHCDMZZsCAARDQMYUYnkeCaDVSUDlahsnIUxdEgOeBwOXl8EcI0xdrtmACLqB3AdQB9f7UoqVdG4Ekin0yl2BcAMgCuMsfFaAITbYiIJJZ83sxAhqa0N8s6NK8EY0z3eYrWUNnxTMmKSvS6XWJkR8XF8PP8dhzejMoD7r+cw9ukzLC0M3d5d8LVLuiC8nffzcQVVxa2JSVx99MQUgLVS4/toDOF4HL1+P3r9nXDb7dB7BXn1Jx7MvcXj+Q81HVtFAK7cDxVTS8uYjURwUt6HgM+LDocDq5mMKO1WK8YXwrjzarom46oAxSD8SKaWvuB0d5c463dfowhNTCKWVmo23lTZHdBTKpfDwzfzojf4dKwh5lyGAf6WmgBlAENHeuC02WqazNsuIXhmQNSNhuxSgFN7XK6ZC8f6MHCgCzarxZAx/wRfPHEcoXNncXi3b7OZx5VwtZD92zPUAshRHg0DPu/Ifo9Hno2siG8Bf46VjAd7DmIwcAhSW6ueB4+sQ0RkLmRriUiQiBLfs1l69nGBQi9eijTk/N17oh5NpcmkwlqoN67ijCiWVoRdOJ4wa1yqaS30mwIpzgkbIlMARSD92gq2dwcqgAxrZ2pG5u9AFYiti1oFIqGNqyuDrgYyqmNed+puBuTf/Hn5fwXgF+y32bP3lc+PAAAAAElFTkSuQmCC";
            ui_effect_shadow.checked = true;
            ui_effect_shadow.tooltip = "Shadow";
            ui_effect_shadow.callback = cb_ui_effect_shadow;

            let ui_effect = scope.GetButtonObj();
            ui_effect.id = vizwide3d.Main.GetViewID() + "ui_effect";
            ui_effect.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAxUlEQVRYhWMYBSMeMBIbAFrdExMYGBjmUxpg10rzUexkIcXyCic7Bg91VZIt3XHzNkPHvkNY5ZjoZbmprAzpDqCm5QqCAqQ5gB6W43QAvSzH6gB6Wg4C2HIBOKuBDMGVcgkBYi3H5QCGBjcnsiwG6921j2jLQYBgNqQ1GHXAqANGHUA3Bzx4/2HgHACy/PTjJyBmIt0dgGz5tdL8BXR1ACHLaeoAYiynmQOItZxmDiDWchDAXh3v2kepG4iyfBSMAgYGBgYANjF0QJ/SUbQAAAAASUVORK5CYII=";
            ui_effect.tooltip = "Effect";
            ui_effect.checked = false;
            ui_effect.subButton = [ui_effect_edge];

            // -----------------------------------------------------------평행/원근 설정
            let cb_ui_projection = function (bool) {
                if (bool === true) {
                    vizwide3d.View.SetProjection(VIZCore.Enum.PROJECTION_MODES.Orthographic); // 평행
                } else {
                    vizwide3d.View.SetProjection(VIZCore.Enum.PROJECTION_MODES.Perspective);  // 원근
                }
                scope.SetCheckButton(ui_projection.id, bool);
            }

            let ui_projection = scope.GetButtonObj();
            ui_projection.id = vizwide3d.Main.GetViewID() + "ui_projection";
            ui_projection.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACNElEQVRYhe1WsVErMRB9ZijAVMCRKjp3YFeAXQGmAtmBYuNYwaEKbCqADgwVmEgppgN3ALMz70AIne4wzPwfeCN7Trvv6e3bvcMxjvGvo/fX+Mq6MYBLAFMAewBzb/S66fyfEFDWlQCuAAh4AeARwBOAcxJ5JpHHOPfkF6B9Zd1MWbcFsCX4HYALb/SIx17lP5XYKOvu4zqnBwCPg9tK4QcA197o54aUPdUomfNzApRYs0A/AG3sLdtQUh3JcQAWnQko6woCavZVbrgUcG/0roXwEEBFAmv2f6+syxOQvhJUJB5SPilwl5E4Jr2g8USBOW8vZK5TObECL4HEE2/0QxtoQHxG8F2Yy/ZVyrppKjeegj5vXfJ3F/Ap+yytWnqjL0LiVG7C5/s2BcCxEclWyrorFv02v+zzgq366HPinFymHr9R/LwXHX7zRvdyAJS7CvqcJBioU7EtoxTBRgJRkUXgjXr+l7kxVNbdMG/tjU4aUKJ1DwiIsm7H/T7jKN6mboNPQ9YKte2KdgKybllwIAS80TeZswK+4d4YNbWmEwFl3YpSy34fiJuVdTmiJcHrfrfujSQBmg8cxWXHBSRyr2jKSVN7OhHgLc680YMuBZR1Fb2RNVtTxIuoXiD3lDQH3OfrdUaz/Rhc4gsBb/SEy0LMtBUf0FgxeEGlhvRH1um5aPwiCpYI6IVb2ROchk2w87NvxoMJIP2SKfio/h7obLaDCARECqox5hKa/xb4GMf4PwLAOyge+ydtKTfqAAAAAElFTkSuQmCC";
            ui_projection.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABfklEQVRYhe2W4Y2DMAyFnQ0YgRFuBEboCIzACGzACHSDjsAIHaEjpBu8U04vOl8I4ADXP62lSlXA8Rc/20E+9vbmzkoAgEpEWhF5OueuL00sgA6Ax6/dATSvCNwAeDBsz8AjgIlrNwD1fwSuc0G41vP/JYGrzghcARi46SzNDFonaz3lCb/2SPBuayOdgQzYj+0JrHUe1lKZAlCqkb5TEQCdb8p5s5iiBJQqpj7AX/h8G0A5g87mdiLoRD+fymEFiP3cWQPLXKoxJ5UVIJppmGR0HniIyxGAbJ8n7y3pHNdDPbT6EGYA9T+ddJX8HTJ+bciomVGne5sA1JqeATEzo7EzQja/zHNg6SXVkkWdoQ4QzBcD0LlRLTYVBM5KaAZgmr0qsN4CYCniVQA6e25Uq2erAMllVSyVBsBCHy8CsOVioRYNsbWN0lE6A6DOd8tlVQKR3gezGthzWe0BSYOMPO2uy+oIiE4zDuusrOiznF9CQeOrc+55BsDH3txE5Buc3mlnWzkLAQAAAABJRU5ErkJggg==";
            ui_projection.checked = true;
            ui_projection.tooltip = "Projection";
            ui_projection.callback = cb_ui_projection;

            // -----------------------------------------------------------Camera 
            // +X축 카메라
            let cb_ui_camera_plusx = function () {
                vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.X_PLUS);
            }

            let ui_camera_plusx = scope.GetButtonObj();
            ui_camera_plusx.id = vizwide3d.Main.GetViewID() + "ui_camera_plusx";
            ui_camera_plusx.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAtElEQVRYhe2WzQ2AIAxGq3EaptIJODkFJybAqVhHg9GDym+BcpB3NeR7NrQUOr9niC0AE3IGAJVbML3yR+aUGL7olW+poT75kTB8SRYoGe467xSgCHcKUIVbBSjDDbYuuG+rYkJi2w4lf8KE3JGhwfO2b8E2rI13EKVU4z3hYmlegS7QBcgErgnZRsD3JFcXCL0NVQWy9gGKcIN3FGPHa9Y+UIjofeDzh7nP8QV+H+j8CwA4AITobi5rI5SBAAAAAElFTkSuQmCC";
            ui_camera_plusx.checked = false;
            ui_camera_plusx.tooltip = "+X";
            ui_camera_plusx.callback = cb_ui_camera_plusx;

            // -X축 카메라
            let cb_ui_camera_minusx = function () {
                vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.X_MINUS);
            }

            let ui_camera_minusx = scope.GetButtonObj();
            ui_camera_minusx.id = vizwide3d.Main.GetViewID() + "ui_camera_minusx";
            ui_camera_minusx.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAA0ElEQVRYhe1W2w2DMBC7VkyTqdoJ+GKKfGUCOhXrFCGBlIa7xEdCkGj8ixybe1PD3+OBBsBY9yKiMTdg09D/aHZa8fABLT/EU0F+a4URftSAT56G/pMjLvHFFCBkY90X8BE1z0Yg9899pPg7AyXFEXAp2Kp1NNbtKhcMe5YBsdUWcf9bCTPJNjwbzcDlBqBdIIEr1rBQU2gpgFOwTkio9zXzQXsPJMczVwOxlay6B85YyZffA6KBGuKigVriooEC9wDMZyfZQVEfVY6ZhhuAiGYLCYjV3kCDjQAAAABJRU5ErkJggg==";
            ui_camera_minusx.checked = false;
            ui_camera_minusx.tooltip = "-X";
            ui_camera_minusx.callback = cb_ui_camera_minusx;

            // +Y축 카메라
            let cb_ui_camera_plusy = function () {
                vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.Y_PLUS);
            }

            let ui_camera_plusy = scope.GetButtonObj();
            ui_camera_plusy.id = vizwide3d.Main.GetViewID() + "ui_camera_plusy";
            ui_camera_plusy.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAt0lEQVRYhe2WwQ2AIAxFq3EaptIJODkFJybAqVxHY6IHhWIrtBf5NxLIe2lSWmj5fTpqAYzzIwCE0oKts70xByZ8Wme7cKE5+V4RPrEFasKx96iABhwVqA0/zzQBITjaPakuuC4H4/zXtiPBMYGoVzkxzm9U+JHXNiwIqXqSAqQ0gSagJZAcRFoC2e9YWuD5I0aVkBSI4KnZIiZAgYsKFO0DWnAxAc4+EY3dY5xWEPi0zLT8MACwA+NUe/49YUskAAAAAElFTkSuQmCC";
            ui_camera_plusy.checked = false;
            ui_camera_plusy.tooltip = "+Y";
            ui_camera_plusy.callback = cb_ui_camera_plusy;

            // -Y축 카메라
            let cb_ui_camera_minusy = function () {
                vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.Y_MINUS);
            }

            let ui_camera_minusy = scope.GetButtonObj();
            ui_camera_minusy.id = vizwide3d.Main.GetViewID() + "ui_camera_minusy";
            ui_camera_minusy.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAz0lEQVRYhe2W0Q2DMAxEDWIapioT8MUUfDFBOxXrFCHlA5zYnOsSVarvD8TlHSFcQqG/V4NOQD8vDyJ6eidsncYTs7PC+QBWP1drMA9WMOJXAxzN6zS+PHDJLwaoARcDcHO6/jq8GECAw6vfOnPZiu7n5Y3CFBXh+9jQb7g/xN883csGECDwmtH+AnfpeANUUQSIAGiAjzYiRMh2fKpjpKgsZXYVgNfxZb2WykrbkrVPYIYLgVS/GKAGXA3wU+eBu+BiAA/c6q96HgiFMhHRBp+vpCFCAZvmAAAAAElFTkSuQmCC";
            ui_camera_minusy.checked = false;
            ui_camera_minusy.tooltip = "-Y";
            ui_camera_minusy.callback = cb_ui_camera_minusy;

            // +Z축 카메라
            let cb_ui_camera_plusz = function () {
                vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.Z_PLUS);
            }

            let ui_camera_plusz = scope.GetButtonObj();
            ui_camera_plusz.id = vizwide3d.Main.GetViewID() + "ui_camera_plusz";
            ui_camera_plusz.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAtUlEQVRYhe2WsRGAIAxFo+c0TKUTUDkFFRPoVKyjh6eFGJCApDG/RON//jMmIPq9utwAlLEjACy1gblZ3zwHovnkZr1STVPwrwChOSGJ8P4Jq+u5zGPJRQE4zKMAXOaofLEydjsfQlaq3p+HZ9hHeL3poowtbbuibjmEUX5Vj11LdgGHBEAABIANIPZnZQEIRjIvwNtgagpQtQ9wmDcDoOwDrRLIXkYea3ntOD5Vvg+I/iUA2AERAIB1kyNstgAAAABJRU5ErkJggg==";
            ui_camera_plusz.checked = false;
            ui_camera_plusz.tooltip = "+Z";
            ui_camera_plusz.callback = cb_ui_camera_plusz;

            // -Z축 카메라
            let cb_ui_camera_minusz = function () {
                vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.Z_MINUS);
            }

            let ui_camera_minusz = scope.GetButtonObj();
            ui_camera_minusz.id = vizwide3d.Main.GetViewID() + "ui_camera_minusz";
            ui_camera_minusz.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAx0lEQVRYhe2W3Q2DMAyEr1WnYaoyAU9MwRMTtFOxTlEkpEJwHF8i8oLvmct35Mc2XLfXw7oB3TS/AXxqN2wZhwPzxcLjBVh/rCdh7lmwxa8G2JuXcfjWwFP+ZIAW8GSAVnAxQEt40OlGd9P8Y6GCRHhYO/uKtACWcKw/+wyvlgfwAB7A1I7xr3DVtaAoAFNepWqnteRsgBhumYy2HYi/F8NT8wAxlpngaoAKOKzwoFQ37Ev/fHfWpjujtePSeYDyN50HXK6TAKz5UqaRw2vK6wAAAABJRU5ErkJggg==";
            ui_camera_minusz.checked = false;
            ui_camera_minusz.tooltip = "-Z";
            ui_camera_minusz.callback = cb_ui_camera_minusz;

            // +ISO 카메라
            let cb_ui_camera_plusiso = function () {
                vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.ISO_PLUS);
            }

            let ui_camera_plusiso = scope.GetButtonObj();
            ui_camera_plusiso.id = vizwide3d.Main.GetViewID() + "ui_camera_plusiso";
            ui_camera_plusiso.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACHUlEQVRYhe1Xu3HDMAxFchnA2cBqWcUbSBs4G9gTUC5YS65ZxJwgygT2BtEG6tjKG0QbJAff4x1PkWRacazGr5HBD/AIgCBMd0yNhzH2hTZzInonopiISiJaWyWPY3RdREBoMyOijIhSImKDW8hMaMeyVbL5FwJCmxTGGBurZOHNrYjoDSKT2F2NgNAmhrvnODErd55gwwXGG3gmg3c4LOVoAq04H/jUnhEJEg48bjxy7I1lSH48dhieCW3YcA1liVXyFUQqnHDW2uY8wvMx1icYr1kf8uc8ARhegfmC3Sm0+fTCMIST17D+iP1r6KtDCTimmdBmCfdtEdcQHJGITHzpJW6wBxgR4rfHaRqrZOTlQRca3A5e12DfHnqiPuKdBJi9VXKNODIq5EUBZe1rtsN4gXUVxjl/LkvCFpHSKpkgjjHimFolNzDIoYkgp5iPkT9JyDUcJOAR4ZMvcNWk0KZGtuf8hSwxv/CL1Dk8hS5Eic2FNgUSi7PdleHCJV6oPodgAh6RU5UT2ny4xyjE1X0ICkEPkRJ3fbRxxmgCQpscYchvTkBo8+IVmAzy7QigLA/JfyPQ93B4aFDhCN/BJmRI36/nWGjzhZ+bc/dZaPNtlRzsKfxmxSr53J7v8kCE958TrEJDcjF4H+9HuA5978FFDUm70HR5APuCG5JRLZlrPH0CiPP1WrIOItM0pS0S07XlLSJX+2Nyx7Qgoh8N6BPrVpEljwAAAABJRU5ErkJggg==";
            ui_camera_plusiso.checked = false;
            ui_camera_plusiso.tooltip = "+ISO";
            ui_camera_plusiso.callback = cb_ui_camera_plusiso;

            // -ISO 카메라
            let cb_ui_camera_minusiso = function () {
                vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.ISO_MINUS);
            }

            let ui_camera_minusiso = scope.GetButtonObj();
            ui_camera_minusiso.id = vizwide3d.Main.GetViewID() + "ui_camera_minusiso";
            ui_camera_minusiso.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACaUlEQVRYhe1Xu3HjMBB9vnEBvA6oFJHZAdWB3YFYAXgBY8kxAhIVkB1YHVgdSBFTqQR14JudeRhjIFAmaWmceBMKv923i7eLFX7lp+Vhjn1lbAqgBZAD2AEo+kqf5uiaBEAZmwBYAygBiMFXjgVQI+O+0ue7AFDGljQm8q+vdOetrQDUHAqI5mYAlLE5w53S40a85DUc+0o/4DM6DuSJ17KbDSC45y29PgV7PhyA4JxE43kMPy4A0BNRIGE90HDUkxgAby2nnicAHfVc8OMxcvYIICHyLrI+Sgg6Iz9aRuTvGAAJv2tl7Lmv9Dbi3Xv4u6/0MrLv2SNuEq6L/BnwZsH7exMDytinCMicv/NQuewnsDfqWQzYiQMQ0vSVLgA4r/bK2Jb8ECmCIwUNJ7JP9nN+KXqukXAoAg7IjqEt6OlRGbvpK31gSoJ5f5B58icnf5Zj0vAqAA+IkDEDYAFoZezR5bp8OdZcz6aQN0bCIRCSQhtlbEditQSRMs1e57wHoyJwRdJvnh8PgATbkGC5R0THDyHqxiPq7QCwmOzdPfeVdmkqsuPYcn3P/d8HIOWU+dx6+dwoY2syHsyMms+xA9ayfuTX9A8CkAeF+ewqXsa6sKLhMjhScn7FfRnn31k/BrkyFAGXzy+sAwlTrR4qqZyvuS/huRdXP6YAcC+WpNWW6NcTGJ/yHUn5jriCFe2UYgAWzGsJnRAv9arhV3nuGhHZn/J8S33R92BSQ0IvSrLdv4ozs6BxVzG7IYkAuWjJaGRNUnacP9+0JYsAuWhKXUd016Y0ABG25an3vW9bHgC52R+TX/lZAfAfywk44bFwwMoAAAAASUVORK5CYII=";
            ui_camera_minusiso.checked = false;
            ui_camera_minusiso.tooltip = "-ISO";
            ui_camera_minusiso.callback = cb_ui_camera_minusiso;

            let ui_camera_set = scope.GetButtonObj();
            ui_camera_set.id = vizwide3d.Main.GetViewID() + "ui_camera_set";
            ui_camera_set.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACHUlEQVRYhe1Xu3HDMAxFchnA2cBqWcUbSBs4G9gTUC5YS65ZxJwgygT2BtEG6tjKG0QbJAff4x1PkWRacazGr5HBD/AIgCBMd0yNhzH2hTZzInonopiISiJaWyWPY3RdREBoMyOijIhSImKDW8hMaMeyVbL5FwJCmxTGGBurZOHNrYjoDSKT2F2NgNAmhrvnODErd55gwwXGG3gmg3c4LOVoAq04H/jUnhEJEg48bjxy7I1lSH48dhieCW3YcA1liVXyFUQqnHDW2uY8wvMx1icYr1kf8uc8ARhegfmC3Sm0+fTCMIST17D+iP1r6KtDCTimmdBmCfdtEdcQHJGITHzpJW6wBxgR4rfHaRqrZOTlQRca3A5e12DfHnqiPuKdBJi9VXKNODIq5EUBZe1rtsN4gXUVxjl/LkvCFpHSKpkgjjHimFolNzDIoYkgp5iPkT9JyDUcJOAR4ZMvcNWk0KZGtuf8hSwxv/CL1Dk8hS5Eic2FNgUSi7PdleHCJV6oPodgAh6RU5UT2ny4xyjE1X0ICkEPkRJ3fbRxxmgCQpscYchvTkBo8+IVmAzy7QigLA/JfyPQ93B4aFDhCN/BJmRI36/nWGjzhZ+bc/dZaPNtlRzsKfxmxSr53J7v8kCE958TrEJDcjF4H+9HuA5978FFDUm70HR5APuCG5JRLZlrPH0CiPP1WrIOItM0pS0S07XlLSJX+2Nyx7Qgoh8N6BPrVpEljwAAAABJRU5ErkJggg==";
            ui_camera_set.checked = false;
            ui_camera_set.tooltip = "Camera";
            ui_camera_set.subButton = [ui_camera_plusx, ui_camera_minusx, ui_camera_plusy, ui_camera_minusy, ui_camera_plusz, ui_camera_minusz, ui_camera_plusiso, ui_camera_minusiso];

            if (vizwide3d.Main.useNorthDisplay)
                addButton([ui_camera_home, ui_camera_fitall, ui_rendermode, ui_effect, ui_projection, ui_camera_set]);
            else
                addButton([ui_camera_fitall, ui_rendermode, ui_effect, ui_projection, ui_camera_set]);


            // -----------------------------------------------------------Transform
            let cb_ui_objectTransformHandle = function (e) {

                vizwide3d.Object3D.Transform.SetEnableHandle(e);
                scope.SetCheckButton(ui_transform_handle.id, e);
            }

            let ui_transform_handle = scope.GetButtonObj();
            ui_transform_handle.id = vizwide3d.Main.GetViewID() + "ui_transform_handle";
            ui_transform_handle.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAADqklEQVRYhe1XT0gUURj/7WZoSZkiEeGfDYykIdgMYUVNqUMUhnsIqoO1EkRQTh4GqkPgLYU5LGNE0cGNPdShYomChLDVLFfKEnLoEmEa4VHzsoO6G9/4PR2HdXedlU59MMyb7733fb/3/X3jSiaTcEqSqrXQVl2RXzqV4RiApGq7AMzw5x5dkWedyHE70r5MIQAxfkJOhTgCIKlaMwAPgCg/Hub9GwB84oDlO+DUChsGwL7v1BV5XPB43OkEQN5GN3CwRVLwV3iSqpFFxq0gNw0AW4D87eU38bpIIcWDJRsC2Vgl6zSUVI2CjhRdZNYgByLRJIAmAHMAggCeA3ihK7InjUiTsooBYVI+cTuAYl2RmznwQjwu5hPT2iEAi5KqeTPJzugCVt4H4BEH33oFh5TT3DUAlwEcz8YNaV3Auf2WlOuKHLDNNezIz++n8bxhnABQynHh4acGwG9dkavTAchkATLxoF25r/f+SEFenq9xX6X5PfD9x7utW9yxWMeVugzysgfApq8Ukc68OzsL8m/sLy11yQ0+1JaXmfyP07+gDcd8dXcfJP7EjR5dkW9lC2BdF0iqZua1rsh+/qZIr2yr8eLmsaMp93QPDCH82Uz9n9lkAFG6LGi2FZyZil1FpgJSNG8YKxM0FsppjaVLZqR0MVDE+S0o3nKwGnUV5bjd/wbPJnR01C+7vPf9CHYXFiJ87gxGpqZx78NoPCcAXHRSUk3ZXry6dAHhsS94OPoJiWQScr0PbUcOm8sJgE2WmUm6IrtSyUvpAl2RJ1PxrUQKz3oPoaq0ZEW5E0oXA3OWUpsLeVhWSkoHgC4aIgPIjLXhsXFEJr6tu4HmaA2tlVTNz2w/y8oMQFK1kOVmQxnQKqlajMdX5w2juyc6lGx7/NTMfUE0Jh7N0RpaS02J97aKbCLZkqqtAbNSB7hxRCh/ueVS57tOOU0l1toDqBIuLCV8Jdu3mSm4sJSAvRKyDDJHOYCw6COSqo3zOGq3ALXRLknVOjn9yHfnuRoGrahJUXxxsTGRhOF2uQ0apyjDQd57GgCBmWTZnXy4VQuw2Z9wAaHFAYFwA93QevIg3xvadUUOYTWOgix/VlhBAPgK4AD1FQCv2XSwgPBzY5pl9BE7EFbs53lxCOF7L/PELeoUgCldkatEIWoDcBJAPi8UgRhlIBEW0sXW6JNUbdB2+CZ+k6W6bLXEbxnT4UYBDK8JwmzJdieETXB0o39IOf0bbgbl8mv2H0DuBOAvgjuWtWDhlxkAAAAASUVORK5CYII=";
            ui_transform_handle.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACe0lEQVRYhe1XPYsUQRB9fsCFTmDgZRMayWB4LLipIrKXmTmxGMxP2MzU7JID9/7BIgZmjp7ChQum4k10bOZeoOgdt08aXp9l0/PBzLGRBcV2v66uflPVXd17jSQGyGNNfdvXxRACCYCl2ncArDZNYC4S0OKTPk6u91x8DCAFUEpTYRsjMAOQm34ubCMEXNgLAAuDLYRthMBK+Q/FYi4iWRdnfTZhonxnJu+lolCKoCfQHhVHoKOmJGf8KyXJSloKXZGckrwnvNV318VzOa/UToRPpRCWy8bZfiWZtfnusgdcOF8rx5l2e6zoFErPCwAfAWwHJyUqbXvA5fg9gIOIsxGAN2o/AXBbBFPpfQAnAO4O2QM+vyHusDXJb9J1jd2gPZBrY6UGe0nynOR3koXBC2HnsrkSAnOpjYaT44Y5x7LpdALaNuE4KC7u5lsrvz8B7JixHWGpbJYRf1FpInALQGX6vwAcAngOYAvAZ22yE7W3NHYo20EE0oY5ewBuKDrb0rmwvYi9i2TtUbtZg1c1uJVdUw92O9hHpSkFpy2R6CqpfMWl4ykYk/xB8oLkvrFZSX1/XzbOdlJzmhqP4UyL2TpwpEXySB3wBMI64O+EI/nIzYeUdQQyc37dxfLKnOkkIOorodWwEiaae6EP8z4W5iMROs3Nl7mwPRWJWSR8I5Kn0lFk3F/dj+TLR+qfKMCEZil2lWVoUjGLRCKmiVk8N+Nj4/8yCn7wC8kzku8MS0tiUvMeCENu3wMTM5bJX6FonOm9cHkdu2v0oaqZlalpp+o/U/9DYPtAvweyq2r8OPkN4JOrmkPfhFbsm7CzDP1vOFj6/jH5T+BqBMAf2bHlmHIT1E4AAAAASUVORK5CYII=";
            ui_transform_handle.checked = true;
            ui_transform_handle.tooltip = "Handle";
            ui_transform_handle.callback = cb_ui_objectTransformHandle;

            let cb_ui_objectTransform_Input = function (bool) {
                if (bool === true) {
                    vizwide3d.TransformPanel.Show(true);
                } else {
                    vizwide3d.TransformPanel.Show(false);
                }
                scope.SetCheckButton(ui_transform_input.id, bool);
            }

            let cb_Transform_panel_close = function () {
                scope.SetCheckButton(ui_transform_input.id, false);
                cb_ui_objectTransform_Input(false);
            };
            vizwide3d.TransformPanel.OnCloseButtonEvent(cb_Transform_panel_close);


            let ui_transform_input = scope.GetButtonObj();
            ui_transform_input.id = vizwide3d.Main.GetViewID() + "ui_transform_input";
            ui_transform_input.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAADNklEQVRYhb1WS0wTURQ9LZUWDLQkGiWYwFIyC8dfRDFR4wJ2dKUrQhfqhmT8ZBIXLsSF0cUkmjG4MCSArFwYcQcmxmKCglFSYmbfvUQBA+3Iz9zmvvKYdqCvFE7SzJ336T3vfs6bwMbGBlSgWfYNWu6YxoDSRh8oEdAsOwYgza8tjmnM75ZAUHF9H4ApAEkAz3frXImAZtmXAehMIEUR4LH9IUAOASSkd7JjuyVQThFSGqgI+6QxSkm8nJooiQCH+g4AekZ5eAHAKIAhTs28YxpDqgRCOziOsROdi45OHefpUbbp+Q3ACpNRgm8E2HmS2y4hwitSIMEFcA3AcQCNqmnYLgJ0srRjGuLE5PxJJBS6T3Zt9YF3v5czL7g4x+kwXJRKBIpGgHM+KsRGs+zrhw7WDlcFg+EHVy/l1jz+OIG19XV3bmm5xzGNNypOSyFAzlNU6ZplfwXQ1n1KR2/7OdSFw7k1f10X/ZPTGJkhScCUYxrnyyHgpwNdHIEcyaZoPd7+dPD6Ryq/gGwaozkOf1nwrQHHNIS3bJfWivpwNUZmZnNOAwigKhiAcbENi+4/vPwynZWi1ydrRLkRKED36ZP4cDOB5oYYGmoiOZvGiuChSiR8CWiW3VJs/MyxJjTW1yntKZmAZtk6m+9JZDTLJr0/OzD9fUv+BWiM5gBc4LVx3lsy8l3ArUeCk9As+ymA2wB+ATCoHRtqaqxIKFTVeuQwFrJZLGZdzC0tr/3JZEwAnQA6FA8/TL5kAkl2do9PQoU1RovEjvb+V2OZldWOWCQCd211fLL3VifvlXv5LoBnbM/y80SROSr0QIj/IM4q9lnSfkJKs2zS9zskSMKhJ23eK1nOlVcVC/IoaoAumqNCfjkVaSaiM5GEXGRkc94Li2MTaekTriiEDujSqfMQJNgR/QY1y5aXTPANOejz/+J27PEjoPxBUgyeGrgC4JNkw/Mu7M0aqCBmOSXDfOodFVH1q3gnzPP3wLZ530sCOotZosjcI8c0klw3e0Ygyu3cXOqGShPYDgmOzpZu208CzRydqDxY6S6A54RelSzQmkpFgNpOIK/1fAeIe8A7l9tTESEqGwD+A4WBNZwSW+i1AAAAAElFTkSuQmCC";
            ui_transform_input.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACWUlEQVRYhb1XPW8TQRB9QWloYpdQ2SUVugaJCrmncRpS4oIf4Io6VKHkByA4Cmo7HXQxDRbVUdBbVHQcEgqJjPTQwlsYxncXr3Pxk0Y3np27fTc7H+cdkkjEI7k/T72xCqkEugAW0vsAym0TeAbgFoAzbT66LIFrCb4DABmAOYBCERhsk0DfvfFIR7I1Ark5f0ifSj/ZlMy6ORBCPda1I9s3Ech1NKX0Vgl0tUmmBAz6UGtRD8Q+AFgCuN8mga5Cu9B5x5I7dH7nAB6oOm6mluZuw9pUmw+N7QjAY+mvAbxQcr4NLyPSab0hRKBCBiRLkl2tHZD8SnJJ8kiylO2g5hlrSZ3TlOSh9Pf8g08ke8anJxvl0yqBgEz6nP9QGp/S2OebEmjqA4Wuoe3OlBN74dQke7LN5BPhk7QRdVVAJRVUCTBt96euuzXr9t4L0RSBfo39uyTlnlr4MswU+mOVXyipOwCuA5gA2Hf+wXZPUYmz4TiJgUmIUHq59Kckf5D8THJIckzyVKV3LjmVhLU3TEfuq+CE5G0thAz/YghFmZhtJq5qIsZGLyRVa7RVMFT43pmjuCt7bibdvhJsxxyHn4KF0UvXGQvn+5dAGDQ3TPsd6ZqZvBi5JIvfBysPNVi4Eb6CmIRxo6oHZNooyEu3PlPde3tEHM8Paxlcpo/X5MDA6f73fznQNA03wUcdySu99YVdMeWTbB3EpGs896skkJmc8Xiitj27SgIdlWVv3RvaJtCEUVW1bZNAT9HpWGPbVQD3hr5LrvaalvpAmBmp+D1nNvl73h4A/AIW12kJ1AmYvQAAAABJRU5ErkJggg==";
            ui_transform_input.checked = true;
            ui_transform_input.tooltip = "Transform";
            ui_transform_input.callback = cb_ui_objectTransform_Input;

            let cb_ui_objectTransformRestore = function () {
                vizwide3d.Object3D.Transform.RestoreTransformAll();
            }

            let ui_transform_restore = scope.GetButtonObj();
            ui_transform_restore.id = vizwide3d.Main.GetViewID() + "ui_transform_restore";
            ui_transform_restore.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAA1klEQVRYhe2WwQ2DMAxFfztB5+DECp2IE1NwYiJW4MS1KzBCFRGkCuwQ2wgXKV/Kifj/pyQ4QVERparrX2GctTgpvyc1GcAnjKrr6xPC69UvC+BHAWSwQMTaIXqR2gFMbTMDeAOYLRCb8NVzp4fEYGqbURvO1bIAWghpTRJAaqgBPgTINdZuWRbAUYDlvGQDcEHxkypcDMBAQBuuAiAgoA0PSnXCS3SvLXA9hK6/oWsjcm3FrpeR63VsCZd6cG9CUziWl9W4fVlR81KdUB3OQBQV/aEAfAH019UzDzN1LQAAAABJRU5ErkJggg==";
            ui_transform_restore.checked = false;
            ui_transform_restore.tooltip = "Restore";
            ui_transform_restore.callback = cb_ui_objectTransformRestore;

            let ui_transform = scope.GetButtonObj();
            ui_transform.id = vizwide3d.Main.GetViewID() + "ui_transform";
            ui_transform.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAADqklEQVRYhe1XT0gUURj/7WZoSZkiEeGfDYykIdgMYUVNqUMUhnsIqoO1EkRQTh4GqkPgLYU5LGNE0cGNPdShYomChLDVLFfKEnLoEmEa4VHzsoO6G9/4PR2HdXedlU59MMyb7733fb/3/X3jSiaTcEqSqrXQVl2RXzqV4RiApGq7AMzw5x5dkWedyHE70r5MIQAxfkJOhTgCIKlaMwAPgCg/Hub9GwB84oDlO+DUChsGwL7v1BV5XPB43OkEQN5GN3CwRVLwV3iSqpFFxq0gNw0AW4D87eU38bpIIcWDJRsC2Vgl6zSUVI2CjhRdZNYgByLRJIAmAHMAggCeA3ihK7InjUiTsooBYVI+cTuAYl2RmznwQjwu5hPT2iEAi5KqeTPJzugCVt4H4BEH33oFh5TT3DUAlwEcz8YNaV3Auf2WlOuKHLDNNezIz++n8bxhnABQynHh4acGwG9dkavTAchkATLxoF25r/f+SEFenq9xX6X5PfD9x7utW9yxWMeVugzysgfApq8Ukc68OzsL8m/sLy11yQ0+1JaXmfyP07+gDcd8dXcfJP7EjR5dkW9lC2BdF0iqZua1rsh+/qZIr2yr8eLmsaMp93QPDCH82Uz9n9lkAFG6LGi2FZyZil1FpgJSNG8YKxM0FsppjaVLZqR0MVDE+S0o3nKwGnUV5bjd/wbPJnR01C+7vPf9CHYXFiJ87gxGpqZx78NoPCcAXHRSUk3ZXry6dAHhsS94OPoJiWQScr0PbUcOm8sJgE2WmUm6IrtSyUvpAl2RJ1PxrUQKz3oPoaq0ZEW5E0oXA3OWUpsLeVhWSkoHgC4aIgPIjLXhsXFEJr6tu4HmaA2tlVTNz2w/y8oMQFK1kOVmQxnQKqlajMdX5w2juyc6lGx7/NTMfUE0Jh7N0RpaS02J97aKbCLZkqqtAbNSB7hxRCh/ueVS57tOOU0l1toDqBIuLCV8Jdu3mSm4sJSAvRKyDDJHOYCw6COSqo3zOGq3ALXRLknVOjn9yHfnuRoGrahJUXxxsTGRhOF2uQ0apyjDQd57GgCBmWTZnXy4VQuw2Z9wAaHFAYFwA93QevIg3xvadUUOYTWOgix/VlhBAPgK4AD1FQCv2XSwgPBzY5pl9BE7EFbs53lxCOF7L/PELeoUgCldkatEIWoDcBJAPi8UgRhlIBEW0sXW6JNUbdB2+CZ+k6W6bLXEbxnT4UYBDK8JwmzJdieETXB0o39IOf0bbgbl8mv2H0DuBOAvgjuWtWDhlxkAAAAASUVORK5CYII=";
            ui_transform.checked = false;
            ui_transform.tooltip = "Transform";
            ui_transform.subButton = [ui_transform_handle, ui_transform_input, ui_transform_restore];

            addButton([ui_transform]);

            // -----------------------------------------------------------Clipping
            // X축 단면 생성
            let cb_ui_clipping_yz = function () {
                vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.X);
            }

            let ui_clipping_yz = scope.GetButtonObj();
            ui_clipping_yz.id = vizwide3d.Main.GetViewID() + "ui_clipping_yz";
            ui_clipping_yz.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABWUlEQVRYhe2WwXXCMAyG//Z1gG7Qu0+wAdmgI8AEOeUccvbJE9AN2g1gA3rKHN2APhWZ5yYitmLChXyXEMe2fiTLEmYenqdUBxjr1gB2uQ5rq/KfzRel8U1blR9ao0Pin+9ofCN9j4bAWHfSGhX4E097JYfAWPcO4AdC3FIw1i0AvALYD3lODAEv/uQN1LD4o/8DQ/QEsHFi2Vbl1xgBDLn9OzZJCgEpb1jMkZ9bADV/L8it/LsJxsnNdOBGhewCGwvfVYewOz98l/aKpuEIVKkqCaiFMQ3rXAGHTAEqJAFN5p6q9ZKAvTCmQRXCKQ6hip6ArBw+U2QJuEHxEUPIVTEuYAqGSrIkQOVCASkLrvYTUi2ou3fBiOu4mwnpzUzuGfDrqSQb61ax+ZNcRJp+IqkpTcVYFxpcpvQDvZxnF3ov+PPQ+PSieyIIU8FzVjznjYtRkvGZGQD4Bf8pfZ0uDHfVAAAAAElFTkSuQmCC";
            ui_clipping_yz.checked = false;
            ui_clipping_yz.tooltip = "X";
            ui_clipping_yz.callback = cb_ui_clipping_yz;

            // Y축 단면 생성
            let cb_ui_clipping_zx = function () {
                vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.Y);
            }

            let ui_clipping_zx = scope.GetButtonObj();
            ui_clipping_zx.id = vizwide3d.Main.GetViewID() + "ui_clipping_zx";
            ui_clipping_zx.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABTklEQVRYhe2WwVHDMBBFHwwFmAoYrj6FCkg6SDpwKvBJ50zOvuAKSAfQAU4FcNI5dJAOYMysZxRZkSWPfML/pPHK+n/1Je0y49/jJnQD8qougNeBaY/AJ5ABK2AHLIE98AAUWpUXnHeR5FutysM1YVqVJ+DeCDcyZyGivu21bxORbz3/L2RXzsBzlIBQcjtmkbfYaFV+iR1hAhKQryXz1pp3+bwPEjBB5h2GLUiY+cnIvEPPgt41zKv6x7WwgRc50YV5vSR8kPHGQd6uvdSqbLyr+wSExGL/H7yGU2MKAauY2BQCPmJiswWzBUkEyAvZwWmBvJDpLXCU5N42S214kxf0AkENSQi5URsaa85ahk9WYfrD6B3wFKajMafLHBf5aAEDVXFnkJ+vFabRAgJKcmO0YZmPfJQAH3le1Zlhgd2MOJGyHzDHzgM3Y0YPwC/LYbpe1v3oxAAAAABJRU5ErkJggg==";
            ui_clipping_zx.checked = false;
            ui_clipping_zx.tooltip = "Y";
            ui_clipping_zx.callback = cb_ui_clipping_zx;

            // Z축 단면 생성
            let cb_ui_clipping_xy = function () {
                vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.Z);
            }

            let ui_clipping_xy = scope.GetButtonObj();
            ui_clipping_xy.id = vizwide3d.Main.GetViewID() + "ui_clipping_xy";
            ui_clipping_xy.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABW0lEQVRYhe2UvVHDQBCFPxhyVIciqADowHRgVyASxTaxIlVgOjAd2FRgR4pFB+oARjN7M/pZfHtnmcR+iW/ke/fe7u07rrh43FgbkBblDGiArXx68ax3wBewlHUNzKs862neGcUfgA3wOjjAsl4JPwG+h2d7DUjlLR6rPDtYDCvm9y1f+//WQG4r5wRxpHMHuQ6bASE3Qv6MEJ9J5XT4O5OBTtuSSPFh5Q7vXgNHyFZxV3mtmN8O92tDuBenT2lRbtwaeDZEz+Ev87WlgpV304R80zsgB8+BtXHvaNodLA9RS+5V0RFfVHn24RH/GYocM6+loDepIeI+vtVAtHhalEkoXzOwjBGP5atXECte5VkTytcM3EdW7q4giK+l4E1+12lRmmKnYCQuXTEZGGU1BBJDTVxNwtEUTAHfPJzVQGwM/038bAZOjeEUMMdwNO3tFE9gIPgNueJCAfwCz7HE7yBYT5QAAAAASUVORK5CYII=";
            ui_clipping_xy.checked = false;
            ui_clipping_xy.tooltip = "Z";
            ui_clipping_xy.callback = cb_ui_clipping_xy;


            // 선택 상자 단면 생성
            let cb_ui_clipping_select_box = function () {
                vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.SELECTBOX);
            }

            let ui_clipping_select_box = scope.GetButtonObj();
            ui_clipping_select_box.id = vizwide3d.Main.GetViewID() + "ui_clipping_select_box";
            ui_clipping_select_box.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACn0lEQVRYhe1XTWgTQRT+NhU9SSvopaS06kHKChVFBMFaLAU9ie0h3hqwB6G4etiL9SBe6mUPuqJ4UMhehByUejIQlFpB0KJYcCw9+FMSc2nBaPAQD428cSZus7PJbFzooX6nyZv3vvcyed+8iVGr1bCRSGxo9k1fAGFLo8F03HcABsRHj9lWWtgzAMZ9ru3sLTDbOuDPpzqBAYUtLgS4AyowHZcbmG0ZcWYO4w38BHR8EUgvCdIbGu5K3rbuAdNxUwDuAugSpjKA88y2slG5IhVgOm4vgKcA9tLn7du2cnul+ku6fAQwzGxrue0CRNdCdrHPPmsAgzWA/4anzX5MHj3C926/fIXHbPEPIUCMc8y2hnR4VT0gJSNldBPABV4sgH27duLyiUEc7knWA6ZPjeDM/n5cfzaHpZVVKvC46bhrAG4x27qo4pXQuYgmIb41JffOjq1LLkE22iMfAUPENoVOAT/lYmllFaPeA8y8Xww4kY32yEcVGwYdGdJRYmjPbrz4sozSjwqu5PKYYR/W9cB84StfdyQSONbXi9lPn+uxIbwcLVVgOu43klsmNcqPOZ19iDfFEtYa4hKGgUPJbmRSY5gvFJHOPiJzmdnWjqgn0BSU4G2xhKlcHoXyd+7a09WJ6ZMjOJjsjkoX7AGSi5RMGChRbuLvXKJ1q+RhvKomHG+YenFByav9HngtmixuX50eWKCL5Q7v9CLvfNU9QKB9vyJEbFOoTsDzS0Zcqc/piiVi6u6pJ3lUqtV6AK3JRnvkQ74U03Adeyopag8j1SCSQ8i/jjqQIo9j8Qa46hvFEjSSr2m+DcILCJtaikLuGcA5EX2f2dZEC//2pmEYRMKmSXV4Q1Ug3nBxv4oDUKmgpXT+AQHu//8NN3kBAH4D7XcznwoSRTcAAAAASUVORK5CYII=";
            ui_clipping_select_box.checked = false;
            ui_clipping_select_box.tooltip = "Select Box";
            ui_clipping_select_box.callback = cb_ui_clipping_select_box;

            // 박스 단면 생성
            let cb_ui_clipping_box = function () {
                vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.BOX);
            }

            let ui_clipping_box = scope.GetButtonObj();
            ui_clipping_box.id = vizwide3d.Main.GetViewID() + "ui_clipping_box";
            ui_clipping_box.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAB0klEQVRYhe1WwXHCMBDcZFIAJfDWJ6QCoIJABUAFIg+/Pbz1CKoAUkGgAkgF4eU3JaSDZMScMmdbss7j8Ao7w4yRJe3e6nRn3PDvcSc1QBk7AHAA0OtiWpHpEudDS/IzgHGR6a82pMrYOYBN6N19C/JdR/JFawG0+NORF5ledCEvMr0NzYkeAVu8deRsfAngRK6AIttUno8AnNhJE3lUQAP5CEBOR8GTiRNs2fp1E3lQQIhcGdujsT2ApyLT59iGlTOfNZHHHPB2zmkzjgmRpPa92K6MDWZ+SkDpripj3ynyHv12JMS70KcxH+2S2R7MfI7kNSQyl1CPAIYkYkjEfTZWdQuxu88hKUTOzh1F6XGsTlLGTknoUrDnLyQOJKMg5D5HGP7kCGrRRvDB8sIjKV4i4KqQ5MBIKGDI/1APGacWSRxYCQWsKonqSvWACQq2cYmAXCggZ4XKXcmXItNrRn6gW1KC5AiiZTcwzxM8F5mesnevVDNqR5Jqx075m1DAngngDWxDzrgGdqoukjiQU+2fURQrsttfzxFrw5cc8N8NRD6nBlYjD0IZ+y2amFjvyN1zoKGVcJU6wCJv/BhxuFYhEpE71D7Lux4BQUR+ww0A8APXILPVZmwmmQAAAABJRU5ErkJggg=="
            ui_clipping_box.checked = false;
            ui_clipping_box.tooltip = "Box";
            ui_clipping_box.callback = cb_ui_clipping_box;

            // 단면 방향 전환
            let cb_ui_clipping_inverse = function () {
                vizwide3d.Section.Inverse();
            }

            let ui_clipping_inverse = scope.GetButtonObj();
            ui_clipping_inverse.id = vizwide3d.Main.GetViewID() + "ui_clipping_inverse";
            ui_clipping_inverse.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABc0lEQVRYhe1WwVHDMBBcGAoIHfDWB6gA3AF0kFTgl9/Bb71UgV0CHQAVJC9/gQqgAzOaOYfLSU50tjPDDN7XjaXTrnXSnjDj3+MsdQOMdTcAPgB80acMwIuI/XgJoALwCuANwJpiP7ZsinyP80JBvgFwKxboi2sWP1H+AsCnXPs8kdzjsSnybYpgkf9A4r8B3MnxgyUw1i1pO8fCi3821rXJJWDkdVPkqwF/vhPvyelzKedFS8CSV7G6Kcil8KAEgQCe3BR5Tad4EDnlc9zL+bESdDWvjHUVLdpqRPSQI7IjISSZsS5QrcxvWfwu5x+9hsxspsDVEAFTIlMLkPd2JILdTHFC7QFU4e+XIJY0AvoSaI1IixQBKh/oA3XVSzmcIiBoIAPJN2ofMNYtxpIzRN8TKS+itbFuF9PzquwOlPcJdlUz/F5dP+e6S2Qt+TDG3vsu33dFH1N37MVJfOBIS97DqYwoidwj8PmJrDeJfMYMAPgBfU+KAM4LIqsAAAAASUVORK5CYII=";
            ui_clipping_inverse.checked = false;
            ui_clipping_inverse.tooltip = "Inverse";
            ui_clipping_inverse.callback = cb_ui_clipping_inverse;

            // 단면 전체 삭제
            let cb_ui_clipping_disable = function () {
                vizwide3d.Section.Clear();
            }

            let ui_clipping_disable = scope.GetButtonObj();
            ui_clipping_disable.id = vizwide3d.Main.GetViewID() + "ui_clipping_disable";
            ui_clipping_disable.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAA1klEQVRYhe2WwQ2DMAxFfztB5+DECp2IE1NwYiJW4MS1KzBCFRGkCuwQ2wgXKV/Kifj/pyQ4QVERparrX2GctTgpvyc1GcAnjKrr6xPC69UvC+BHAWSwQMTaIXqR2gFMbTMDeAOYLRCb8NVzp4fEYGqbURvO1bIAWghpTRJAaqgBPgTINdZuWRbAUYDlvGQDcEHxkypcDMBAQBuuAiAgoA0PSnXCS3SvLXA9hK6/oWsjcm3FrpeR63VsCZd6cG9CUziWl9W4fVlR81KdUB3OQBQV/aEAfAH019UzDzN1LQAAAABJRU5ErkJggg==";
            ui_clipping_disable.checked = false;
            ui_clipping_disable.tooltip = "Disable";
            ui_clipping_disable.callback = cb_ui_clipping_disable;

            let ui_clipping = scope.GetButtonObj();
            ui_clipping.id = vizwide3d.Main.GetViewID() + "ui_clipping";
            ui_clipping.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABh0lEQVRYhe2WwVHDMBBFPxkKCB2Yq06kBDoIHUAFgoPOxGcdsCqAEuggkwqSk664BHcAo8xqRqxlIyu2L/jPeJJJJO/br5VWWPRvJLR5FNp883xXcxjgggN4B/DE/7uaM7hV8iMJQGhTAPgakSMavFex9Ro4/7zm5ECnJqkBbrvQZu2e2NjrxBfmuOGD3wHY0283WQC5wen7FkA0+6kAfOYFBa4ANHMBcNsdwMYqWXVNGLMIQ9tfKbjLvHFABDUZAN/nJYBPAPdWyRrAkZ6WxlgCbnttldwAeEiZfClAmPkb2V5ExtVTAHDbD/T5wgdaJW/HBghtd5kfrJK7nBflAISZ7/sOGS+hzbmxxZwYCsBtr2nNW7YzxeoiDSDoZqHtbp+XVO0XqRcg0tUKZnvSVnOnYa4D/CazDk64MjVzq+RpEECH7VtqLC6bhk64JAltngmk1RNaAB13OG+7C1zR2e7vCLWvbqp2X3CuCZ2ENjuqGVACv7RKCD6WOltyCPDnHW7RolEF4AcbBbWygUbU9QAAAABJRU5ErkJggg==";
            ui_clipping.checked = false;
            ui_clipping.tooltip = "Clipping";
            ui_clipping.subButton = [ui_clipping_yz, ui_clipping_zx, ui_clipping_xy, ui_clipping_select_box, ui_clipping_box, ui_clipping_inverse, ui_clipping_disable];

            // -----------------------------------------------------------Measure
            // 위치 측정
            let cb_ui_measure_coordinate = function () {
                vizwide3d.Review.Measure.AddPosition();
            }

            let ui_measure_coordinate = scope.GetButtonObj();
            ui_measure_coordinate.id = vizwide3d.Main.GetViewID() + "ui_measure_coordinate";
            ui_measure_coordinate.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABzElEQVRYhe1WwXHCMBDcZFIAJThfvUgF4AoCFQQqEDz8Tnj7EVSB3QFQAXQQv/zF6cAdJHOZFaMYKUDiSR7xzniwD2n37nR3Njp06PDXuGrqq9T0AbwAmAN4BrAEsACwB1CUiY5VasQ+A3ALYAggAxCXid6R461BK/sfAdyViS7cP649CdAUssIzCgimDmFNUrl2VpyIAYy5Rrie5Jfcn+BzQDKwkRturACMRLRMdEW7EBsAEwARHTqAzgwA9BynN+Q+ywH3OCI+Dhrrlowwb0Qv+4bM3LyR8iMHbjwOVM59xmeJMFOpGTGVkYiq1Mj9q+Os3Z/RuZ5KjWQx93AHM/CRPkYhJNMy0TlJHliY9iwLh9TaI9oKZs0exT25T2bAsAvkzGNrLBM9ZaR7e+ZloufOviE7oWARHsBg+k49/AOo1Ew88+AIvhr4MUSchbg4xXU0CVsQt5M0t3Xzaw5QfAtgfY64oLUjcMQrvkfOgjcDKjXStyu2Fti/Y47g0PotH+PQOh9CGVhxeIx5WYe+Eu9dKi7wDSIwcol4TRGEHKA9+o74Vw54Eejr2pmAFyNUAzalto/lnV+7o7kthGrAfkyseNW0dejQoV0AeAfdqLCWnV+eeAAAAABJRU5ErkJggg==";
            ui_measure_coordinate.checked = false;
            ui_measure_coordinate.tooltip = "Position";
            ui_measure_coordinate.callback = cb_ui_measure_coordinate;

            // 거리 측정
            let cb_ui_measure_2posdistance = function () {
                vizwide3d.Review.Measure.AddDistance();
            }

            let ui_measure_2posdistance = scope.GetButtonObj();
            ui_measure_2posdistance.id = vizwide3d.Main.GetViewID() + "ui_measure_2posdistance";
            ui_measure_2posdistance.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAeUlEQVRYhWMYBSMeMKIHgFb3xP/4AuVaaT6GHqoCfA4g5DhyANNAJ4EBdwALPkmt7okKDAwM9+nnnNE0MABgNA2MpoHRNDCaBkhOA5RGA8H2BC3TADb9o2lgwMsBvA64Vpr/ALnhOizLAZKb5ZQCmjfrR8HQAgwMDAAg+jVhyR0hGQAAAABJRU5ErkJggg==";
            ui_measure_2posdistance.checked = false;
            ui_measure_2posdistance.tooltip = "Distance";
            ui_measure_2posdistance.callback = cb_ui_measure_2posdistance;

            // 각도 측정
            let cb_ui_measure_angle = function () {
                vizwide3d.Review.Measure.AddAngle();
            }

            let ui_measure_angle = scope.GetButtonObj();
            ui_measure_angle.id = vizwide3d.Main.GetViewID() + "ui_measure_angle";
            ui_measure_angle.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABAklEQVRYhe2WsQ3CMBBFP4gBGCG0mYINGIEwgUXhnj4NmQDYgBGSDajcwgjZAGTJQpZj4jh3gQL/xoqV+L+7/FOCpL/XjNKAvKwyAHd3X0kx+FwSgANTADjFAsyZzXexz5IBbHMlxfmrAFRzrdEZ4DAfDcBlPgqA01wrKgOW+Z7DPArAMn8A2HKYDwawzFtdPYAsL6sDB0AwA3bbTeUaogEgAKyUFC0FoLcDTuCOBmIN4GZuKSjmvQC+tCspagC16cQVwGYSgMCoXUwXGrPyAgyYcz0FS7OS1QlhXlZPjoM/KfipdgE4r33FsfwPUPRzgI6mzEB6BT4tfJtTj2JS0lsAXj2dcruq0ed2AAAAAElFTkSuQmCC";
            ui_measure_angle.checked = false;
            ui_measure_angle.tooltip = "Angle";
            ui_measure_angle.callback = cb_ui_measure_angle;

            // 면적 측정    
            let cb_ui_measure_linkarea = function () {
                vizwide3d.Review.Measure.AddLinkArea();
            }

            let ui_measure_linkarea = scope.GetButtonObj();
            ui_measure_linkarea.id = vizwide3d.Main.GetViewID() + "ui_measure_linkarea";
            ui_measure_linkarea.imagesrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABkUlEQVRYhe2XsU4CQRCGP4z2amKN0Y5rTOQRtNbKFirsttrEV8CwDdfaaGvFA/gIkNhsa+hN5BHOrJklx7ICwsEZ8U82e7McM//+M8sOlSzLKBM7pUbfegIOu3kjMek+8A4cAa9uzWp1nJj0EWiIXQlt+a4vpierVTNiD4Gqf38MV4R+1DrdZq3TzdycXy9q1DrdYegrTMF1MBcKp2boLyRwFsyFQlI3iVASl4J1yP+d7991CopCYtI7oA0MrFZ173bqBKzxd8ARcIFPEpNe+MVYDayFgNXqEDgHRlarl9xHjfDdhVOQmNRJOgIOZIfu+RZoAW6XA+DGavWWmLQl6/V5fhdSIDGpD+oHQuRZgiM7bstzW+yPfApiNbBMEZ5K8L7Yl6JG35ORFCyEH9eAk9hqNZCgXznO2TORux/G2Lp+4KlUAu5aXoqA1crl916Gxzx7CrEa2LrLaKoGNqpAbGxUAekLJ/A3+4E8ZNeuw+4RafWiBKLHZTVUgSvgAdibSSB2Y62CQIFe6Or/z2m5BIBPkQbxOa6wPQMAAAAASUVORK5CYII=';
            ui_measure_linkarea.checked = false;
            ui_measure_linkarea.tooltip = "Link Area";
            ui_measure_linkarea.callback = cb_ui_measure_linkarea;

            // 개체 최단 거리 측정
            let cb_ui_measure_mindistance = function () {
                vizwide3d.Review.Measure.AddObjectMinDistance();
            }

            let ui_measure_mindistance = scope.GetButtonObj();
            ui_measure_mindistance.id = vizwide3d.Main.GetViewID() + "ui_measure_mindistance";
            ui_measure_mindistance.imagesrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABmElEQVRYhe1Xy22DQBScRLlDB3DfQ+ggTgfuIHYDyAfKWCloGzAdhBJcQnzgnnTgVODoSYOElwW82OBIzruY1X5mdt9v/HA8HnFLe7wp+t0T+BMEnqY8XGmTACgBRAC+ASyrLP08mwAPWAAIPXAPVZbm/C65dw0g5zgeJEBg2fDiAdzcLyQK3nwt30obmdraa1sECL4DEAD4IesvD/waHHz2nOA5x/0EABQE39NnPuC2LXmBbR0D9oKTSqi0kQUfvHlcZenhAvCzzE7DhL/FHOBiXXVgFnAXgdrfq1sRKOn/SGkjqeOT/6Os1Y4bgYiRaWjbrsrSXdekUw8obRZMx+hKF5UUXLmI9AoSEllcABwyngKOX20SkysixpFUwTdxaZWlJ3E1eTtmPdnQDQFjbD4CDRJ1f0iac3MKEmdKz0KAcVAXtxNB4qoDgypmBLhE/rOcV2XpoCDpVDFKm42nOorZgmtt0WrHLgJOFaO0kSd89wBv2p6FqPWSLgJOFUNCoecLiJV9LnQR6FQxDbF5Nfv/b3jnBAD8ApvFpQifUXHqAAAAAElFTkSuQmCC';
            ui_measure_mindistance.checked = false;
            ui_measure_mindistance.tooltip = "Min Distance";
            ui_measure_mindistance.callback = cb_ui_measure_mindistance;

            // 측정 정보 삭제
            let cb_ui_measure_delet = function () {
                vizwide3d.Review.DeleteAll();
            }

            let ui_measure_delet = scope.GetButtonObj();
            ui_measure_delet.id = vizwide3d.Main.GetViewID() + "ui_measure_delet";
            ui_measure_delet.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAA1klEQVRYhe2WwQ2DMAxFfztB5+DECp2IE1NwYiJW4MS1KzBCFRGkCuwQ2wgXKV/Kifj/pyQ4QVERparrX2GctTgpvyc1GcAnjKrr6xPC69UvC+BHAWSwQMTaIXqR2gFMbTMDeAOYLRCb8NVzp4fEYGqbURvO1bIAWghpTRJAaqgBPgTINdZuWRbAUYDlvGQDcEHxkypcDMBAQBuuAiAgoA0PSnXCS3SvLXA9hK6/oWsjcm3FrpeR63VsCZd6cG9CUziWl9W4fVlR81KdUB3OQBQV/aEAfAH019UzDzN1LQAAAABJRU5ErkJggg==";
            ui_measure_delet.checked = false;
            ui_measure_delet.tooltip = "Delete";
            ui_measure_delet.callback = cb_ui_measure_delet;


            let ui_measure = scope.GetButtonObj();
            ui_measure.id = vizwide3d.Main.GetViewID() + "ui_measure";
            ui_measure.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAeUlEQVRYhWMYBSMeMKIHgFb3xP/4AuVaaT6GHqoCfA4g5DhyANNAJ4EBdwALPkmt7okKDAwM9+nnnNE0MABgNA2MpoHRNDCaBkhOA5RGA8H2BC3TADb9o2lgwMsBvA64Vpr/ALnhOizLAZKb5ZQCmjfrR8HQAgwMDAAg+jVhyR0hGQAAAABJRU5ErkJggg==";
            ui_measure.checked = false;
            ui_measure.tooltip = "Measure";
            ui_measure.subButton = [ui_measure_coordinate, ui_measure_2posdistance, ui_measure_angle, ui_measure_linkarea, ui_measure_mindistance, ui_measure_delet];

            // -----------------------------------------------------------Note
            // 표면 노트
            let cb_ui_note_surface = function () {
                scope.Element.get(vizwide3d.Main.GetViewID() + "div_note_container").element.style.display = "block";
                scope.ReviewType = VIZCore.Enum.REVIEW_TYPES.RK_SURFACE_NOTE;
                initNoteWindow();
                visibleNoteWindow(true);
            }

            let ui_note_surface = scope.GetButtonObj();
            ui_note_surface.id = vizwide3d.Main.GetViewID() + "ui_note_surface";
            ui_note_surface.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABk0lEQVRYhe2WzVHDMBCFXxgKoIT4qhN04HQQKiCpQOHgM+Ssg1EFDh0kFUAHyclXUkI6gFnmiRHGOLLjn4vfTGY0sq33raTdDUYNrUmIvzJ2CiAFMAewBfCYJ/rYBnslgDL2BsAKwBMAMVxzPOX4JU/0qRMAZeycUQuEzRP97D2TsQZw4m5sWwNQxt7SOAawocGfKLk78t4CwDvfO9QFuC6Z2zOy+6rICLVUxu4AZPwu6E75uvpnXqLLlLGrqo/5PKtrGgLgIFJl7F4ZGxeMY5nnEcgxRU0Byo6gKLkTb8pYMXoF8OCde+TSURnbGYDTgr/jufvRFYDT3aW576ssDT+rPsgTPWFl/GhqKmu4cZMdkAWOcub+QqEqBliVBb2oDGAzKECe6KVcNKZZqViGuwEgxCFP9ExKLcvyj1j9Gl/AIAAPxFW5tTct1a9Z1akLQIgTW7EDifzWfKmC05AltzVjp0Z1IFTK2JS9ZBgAmseFuV9/WvouRGI+Gwrg27zYyPoCKDUX1W4mTue6Zoj5qFEA8AW9s4xjlG8ccQAAAABJRU5ErkJggg==";
            ui_note_surface.checked = false;
            ui_note_surface.tooltip = "Surface";
            ui_note_surface.callback = cb_ui_note_surface;

            // 3D 노트
            let cb_ui_note_3d = function () {
                scope.Element.get(vizwide3d.Main.GetViewID() + "div_note_container").element.style.display = "block";
                scope.ReviewType = VIZCore.Enum.REVIEW_TYPES.RK_3D_NOTE;
                initNoteWindow();
                visibleNoteWindow(true);
            }

            let ui_note_3d = scope.GetButtonObj();
            ui_note_3d.id = vizwide3d.Main.GetViewID() + "ui_note_3d";
            ui_note_3d.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABrUlEQVRYhe2WvVXDMBSFLxwGYIS4VUU2cDYIE5BM4KRwDdQqwpvAYYMwQdggqdyGEbIBnMe5zhHG0ZGFEprcxrL+7qe/J+Gi/9ZViL+xMgCwADAGsAIwr8viIwW7F8BYuQUwA/AIQA2fmR4w/VKXxf4kAMbKmKNWCKnL4skp03QBYM/ZWCUDMFbuaJwDWNLg1yg5O1pvAuCd9bZ9AW468jYc2b1vZISaGitvACq2C9pTrq49ZZWxMvM1ZnnV1zQEIOP0L4yVjbGSt4xzzecSLFk/Sl1L0Ezv3FgRjnBtrKjRK4AHZ92z5jgaK+kAHBDtfOSciAmPo3d/9JFvD7ggajbk7zCVuarrGH7WZdG5m5syRsZdrOmx/g8mIWW+ej6123UugbEyiek8Rl0AS8aANaPieQHqspg6G05jQMWwe1D7PykAIbZ1WYw01PIK3jVRkd/oDRgE4IA0UU4YB8BvXNTpC0CIPa/ijG+AzL2a/ypvJGyBaARMZtwoGCBGxooul/cknRSA5nkr78ejJeguSCg1H/0XwLd5+3l3LoBOc1XvN1yjHpfRUfOLLgKAL8ajqiw9irYDAAAAAElFTkSuQmCC";
            ui_note_3d.checked = false;
            ui_note_3d.tooltip = "3D";
            ui_note_3d.callback = cb_ui_note_3d;

            // 2D 노트
            let cb_ui_note_2d = function () {
                scope.Element.get(vizwide3d.Main.GetViewID() + "div_note_container").element.style.display = "block";
                scope.ReviewType = VIZCore.Enum.REVIEW_TYPES.RK_2D_NOTE;
                initNoteWindow();
                visibleNoteWindow(true);
            }

            let ui_note_2d = scope.GetButtonObj();
            ui_note_2d.id = vizwide3d.Main.GetViewID() + "ui_note_2d";
            ui_note_2d.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABRUlEQVRYhe2WwVHDMBBFHwwFpIScdUo6cDqgA9yBJwdXoUOiCgIdQAWhA3zyOR2EDmBE1jMbYUdxRjEM+F9krWTt3/3SSoz497gJE2Cs+0iUlEVdFq+xSXdtxrosvhHrA2Pd9tzprQQ0jHUzYCLEviIy1k2BqSIcjbQLtxHnK+AN8BFtVWR5YxP73liXJycAvABLkWQNZHpQ7HNgB2wkM+kI+NTWZbGWrl/8vWVO5UlK974vgege4CBFLosvO6ZU0k76EohJ0DjfAI8qGyEaaXZ9CZzMgHLud/mTsS5T0SJ9L81K5HlOSgB4kDZTUS7UeHje/WlovjP1fYSTdebcSnhpxQz/i+6Ba6NVgoT3wfXwZyQYCfzOU5AKcp3PfoyAOM8CW6U7Q0tQBaV8UAKVPFSP3hRDEWh17nHx67dHJex0PmIEwCemz2ldYmOwLAAAAABJRU5ErkJggg==";
            ui_note_2d.checked = false;
            ui_note_2d.tooltip = "2D";
            ui_note_2d.callback = cb_ui_note_2d;

            // 노트 삭제
            let cb_ui_note_delet = function () {
                vizwide3d.Review.DeleteAll();
            }

            let ui_note_delet = scope.GetButtonObj();
            ui_note_delet.id = vizwide3d.Main.GetViewID() + "ui_note_delet";
            ui_note_delet.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAA1klEQVRYhe2WwQ2DMAxFfztB5+DECp2IE1NwYiJW4MS1KzBCFRGkCuwQ2wgXKV/Kifj/pyQ4QVERparrX2GctTgpvyc1GcAnjKrr6xPC69UvC+BHAWSwQMTaIXqR2gFMbTMDeAOYLRCb8NVzp4fEYGqbURvO1bIAWghpTRJAaqgBPgTINdZuWRbAUYDlvGQDcEHxkypcDMBAQBuuAiAgoA0PSnXCS3SvLXA9hK6/oWsjcm3FrpeR63VsCZd6cG9CUziWl9W4fVlR81KdUB3OQBQV/aEAfAH019UzDzN1LQAAAABJRU5ErkJggg==";
            ui_note_delet.checked = false;
            ui_note_delet.tooltip = "Delete";
            ui_note_delet.callback = cb_ui_note_delet;

            let ui_note = scope.GetButtonObj();
            ui_note.id = vizwide3d.Main.GetViewID() + "ui_note";
            ui_note.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAmklEQVRYhe2WsRGAIAxFo+cg1mzlBFRMQcUGTkWrm+jRA4kxgSavxct/5wcOMIzZLLV8F9Oj4ZWDr+YNEWjNXKWDvmIC0wU27AMX0w4AF2c4ZdejAjn4u3VcJbAKrILfFZDvd66AdgWoABXuZhWroPwpF1Nv1MESEKrgyMGftYURp6AZPkKgG64tgIZrCpDCCxqPUnK4YcwHAF6g0zxe5+yl1QAAAABJRU5ErkJggg==";
            ui_note.checked = false;
            ui_note.tooltip = "Note";
            ui_note.subButton = [ui_note_surface, ui_note_3d, ui_note_2d, ui_note_delet];

            // -----------------------------------------------------------Draw
            let cb_ui_draw_normal = function () {
                vizwide3d.Review.DrawingMarkup.EnterDrawMode();
                vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.NONE);
            };

            let ui_draw_normal = scope.GetButtonObj();
            ui_draw_normal.id = vizwide3d.Main.GetViewID() + "ui_draw_normal";
            ui_draw_normal.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAsZJREFUWEdjZBhgwDjA9jOMOoCqIWDQ3y/Azcp1CRStX39/07tQWPiBUBRTzQEgy/nZee+YykoLszIzMxy6d/8xMY6gigNAlrMzc16X4uOVAPl4YUQwQ+6GLQx33rw7cDQnzRFfKFDsAJDlXCxcV378+SPtrq4Ktuvc02cMr758+fXz92/za2WFF2jmAFic2ykpysYZGzAkrFzLoCYqynDr9Zs/n398NyVkOchhZIcAsuVtnq5gT04/dophxcVL/958+WJMjOVkOwCb5RuuXGdo3rPv1w8igh05SkgOAWpaTnIIUNtykhxAC8uJdgCtLCfKAcRartU1KYGB4e8FYlM/LCHiTYTEWg4yzGP2wgevvnyW5GVjKzyYnTaNUB1A0AGkWA5zgI+WuvyC0+f+8rCxbfvw83McRZWR59yFTwU5OKVmBPsx8LKzMxDK56AQaHJ3ktcQE2XIWrf5z/13756///bNj1CUYI0CjfZ+BS4OtjuuairMZ588Zci2siBYyMAcYCorAw7dqcdOMsw7deYXoSjB6gDbKbPn2SjJJ2ZbmTPkb9zKcOfN2z+///7BW7ajOwDkiNOPn4BCA2+UYHWAYf+UHwqCguw3X79hkObnO/X0w4d0QkGJzQEgR3z++ZMhYMGyfz///H6KrX2A4QCtrn4DPi7O9VwsbBufvf844UZl4QNiUjQ2B4CiYe2lq38+/Pj+l5+dYxe2hElyXYDLMciJcP2V6wyg6tl55vx/n378mHWmICsTlz6qOiDSUE9+4Znz/z58//YnycyETUNMhKFmx56PJ3IzBOjigFdfv0hxsrDWf/z+9TgHK/uefRlJzKAseevN295TeRkV2BxBtRBAL4qtp8y6YCgtqQ+y9OiDhz/PF+Zw0NQB6IaDyhJ5YYEZv//9v/H8y8cD10sKN9DVAcTkHKJqQ2INIlcd1dLAkHUAAO5bxDAAPJ+wAAAAAElFTkSuQmCC";
            ui_draw_normal.checked = false;
            ui_draw_normal.tooltip = "Select";
            ui_draw_normal.callback = cb_ui_draw_normal;

            let cb_ui_draw_free = function () {
                vizwide3d.Review.DrawingMarkup.EnterDrawMode();
                vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.FREE);
            };

            let ui_draw_free = scope.GetButtonObj();
            ui_draw_free.id = vizwide3d.Main.GetViewID() + "ui_draw_free";
            ui_draw_free.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACI0lEQVRYhe1Wy3HbMBB9zqSApAPqypPcgVVBqAosVgDzgLPsMw8yKpA6iFOBmQrkE652CS7Bs5MHzw4NUAAd++Q3o+EIv327+7ALfOE9qHu3fG8Az0o30OgOwIUafgYwAPgD4M5b8/whBOreVQCOAH5MLBPjDsBtDpFvJQQAbGhcDm4B/ASwAtCJ51wj81sAj3XvruveTZEtjsA1Dx+8NavIfMX5RkVJyN54a25jZ5ZGICAqPm/Nk7dGIrMAcOCwENnVvTvWvbsY7ymNwJIaELTemsOJ9RUF26hh2dMFfRRFwFvzQLWDoT61XiKypk6eOLzhD8UEiBt+K2oih7hoZsG9gxJseR3Av9DulRfnjMwszBVhR3UL9nONC2YRoIBa/l3WvdvNJTArBQGjVKwk16VnzE1BQKfUvT9V9f47gVEqwp3/PAIkMairuYlVuyl8T82xihmW3b9ss6nrJnX+UkXhPJdAVIQTbXdgGX1DhJ7f8+/JMh2QSsFWtd2DEpoYOcbaLFMRiP3KMS5IEaj4lbC3LKOtKj5bEhnn2/HbIBMpAsGTJnjKkC6Y70DyXmoBUwZFMBspAsETMX4VBuXaeWu6SHeT189RleXs3hAlIG1UPSguI/O6uwWvl6PnWhaSpXj0+FiQVGpto15Jh6m1Y7zWAR7ym+FrS4TkrbnTPb4EsUKkPQcfoNkeleJVA/RircQFFp71RxlPQq7VnM72hWIAeAEz6s2INzsNegAAAABJRU5ErkJggg==";
            ui_draw_free.checked = false;
            ui_draw_free.tooltip = "Free";
            ui_draw_free.callback = cb_ui_draw_free;

            let cb_ui_draw_circle = function () {
                vizwide3d.Review.DrawingMarkup.EnterDrawMode();
                vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.CIRCLE);
            };

            let ui_draw_circle = scope.GetButtonObj();
            ui_draw_circle.id = vizwide3d.Main.GetViewID() + "ui_draw_circle";
            ui_draw_circle.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABcklEQVRYhe1WwXGDMBDcpIKU4Hx5UQKugJRgV0B4UAUPQgWmhLiCUAIvvqGElJBRZpW5EZIiS5k4M2Y/mkGwt7fodIcNN4+7SwzI2v4JQAmgALAzthcAI4Dz3FSvoZxBArK2VwFPlqAuKDHHuanGZAFZ23cAnsWjSWXJbCUKupOLZy9zU9XRArK2V1kfROD6p6zoVieEDHNTHV3v33uIOhF8ALAPsZTv7PmNwoFcVlgdYBZvIRn4YDhoTcDlwInrl+0xwYmaHJLTL4Clpk+7+ucfsdH5rU5gR26/AJ5khSnknweIGIULpblvE1BwPacGF9BchblhE6DtT85eQHOtLjJnGf4VNgE2AQvX1YFJQGFwewXoA7MqmQSUBrdXgC6ZnFdyEsiRG9zfcPWCd5bMxDs86jbM2v6BPUUJWOamegxxQEE3n5ytNRayLVsbmnMeMAaR4ZK+wMxlO3cOJlcfSP73SCZEXG8oNYT8+li+4cYB4BOwco7o77ZCAwAAAABJRU5ErkJggg==";
            ui_draw_circle.checked = false;
            ui_draw_circle.tooltip = "Circle";
            ui_draw_circle.callback = cb_ui_draw_circle;

            let cb_ui_draw_line = function () {
                vizwide3d.Review.DrawingMarkup.EnterDrawMode();
                vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.LINE);
            };

            let ui_draw_line = scope.GetButtonObj();
            ui_draw_line.id = vizwide3d.Main.GetViewID() + "ui_draw_line";
            ui_draw_line.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAsklEQVRYhe3XqxGAMBRE0YUKqANFC1SEooooKqIFFJYWKIHJTASEXz7vLYadiYo4Vyb4x1xthsqePVmy/NoMDYDFHW6Aw0cAlX+nHuDhK4B2f1+w8bnvJkpACK4WEIqrBMTg4gGxuGhACi4WkIqLBOTg2QG5eFaABJ4cIIUnBUji0QHSeFSABh4coIUHBWjirwHa+GMAA78NYOGXAUz8FMDGDwHuw7AwcburZzkN//f9AGyZBJN1J/sgYAAAAABJRU5ErkJggg==";
            ui_draw_line.checked = false;
            ui_draw_line.tooltip = "Line";
            ui_draw_line.callback = cb_ui_draw_line;

            let cb_ui_draw_rect = function () {
                vizwide3d.Review.DrawingMarkup.EnterDrawMode();
                vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.RECT);
            };

            let ui_draw_rect = scope.GetButtonObj();
            ui_draw_rect.id = vizwide3d.Main.GetViewID() + "ui_draw_rect";
            ui_draw_rect.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAbklEQVRYhWMYBaNgoAEjNvu1uie+Z2BgEKCy2z5cK80XRBdkwqGY2pbjNJMFn45rpflYQ4hUoNU98T8uLbhCgG5g1AGjDhh1wKgDRh0w6oBRB4w6AG+LCF9LhloAVwh8oIFdtDBzFIwCCgEDAwMADI8NdQOCFtoAAAAASUVORK5CYII=";
            ui_draw_rect.checked = false;
            ui_draw_rect.tooltip = "Rect";
            ui_draw_rect.callback = cb_ui_draw_rect;

            let cb_ui_draw_delet = function () {
                vizwide3d.Review.DrawingMarkup.ExitDrawMode();
            };

            let ui_draw_delet = scope.GetButtonObj();
            ui_draw_delet.id = vizwide3d.Main.GetViewID() + "ui_draw_delet";
            ui_draw_delet.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAA1klEQVRYhe2WwQ2DMAxFfztB5+DECp2IE1NwYiJW4MS1KzBCFRGkCuwQ2wgXKV/Kifj/pyQ4QVERparrX2GctTgpvyc1GcAnjKrr6xPC69UvC+BHAWSwQMTaIXqR2gFMbTMDeAOYLRCb8NVzp4fEYGqbURvO1bIAWghpTRJAaqgBPgTINdZuWRbAUYDlvGQDcEHxkypcDMBAQBuuAiAgoA0PSnXCS3SvLXA9hK6/oWsjcm3FrpeR63VsCZd6cG9CUziWl9W4fVlR81KdUB3OQBQV/aEAfAH019UzDzN1LQAAAABJRU5ErkJggg==";
            ui_draw_delet.checked = false;
            ui_draw_delet.tooltip = "Delete";
            ui_draw_delet.callback = cb_ui_draw_delet;

            let ui_draw = scope.GetButtonObj();
            ui_draw.id = vizwide3d.Main.GetViewID() + "ui_draw";
            ui_draw.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABXUlEQVRYhe2WwW0CMRBFPxEFUAJcfSIVAB3QQUIFhoOr8IG4AuggdJCkgz35ypawJaBBs5Jj1gHCDMmBL1mr9dh632NLM3jor9XT5BsfBgCWAHbR2aprjZoBhn8AGPLUrMvEkzKcNKIM0L/xYZyvFc9AdvJRdLbh+Q2AeZ4J0Qwk8AGPdRJe8Xee7ukrwCnNWwBfADbGhxZOsRrAW7pPJAPZnc/4lBMACwCvAPZtrL0SMQM5PDr7mZmoeZzASTc9wg54k8SmHKtK8JsMnIEXYyIGpOC/MiAJv9qANPwqAxrwiw1owS8yoAk/a0Ab/qOBe8CLBu4FJ5Wq4ZqrmiqcdJIB48OQq1fFTcWxgdCAk7qqIZXPJjr7nLRSUw14ycALgGMXEZ1dcClVgZO+XYHxgWr4O9dzOrXl1oo6nJU0nJQ/QgI2SftEmdhGZ2tpcMnAmB9fiM7utKAP/R8BOABDzdyQYWrkrQAAAABJRU5ErkJggg==";
            ui_draw.checked = false;
            ui_draw.tooltip = "Draw";
            ui_draw.subButton = [ui_draw_normal, ui_draw_free, ui_draw_circle, ui_draw_line, ui_draw_rect, ui_draw_delet];

            // sanpshot
            let cb_ui_sanpshot = function () {


                vizwide3d.Review.Snapshot.Add();


                //vizwide3d.Main.Camera.Backup();
            }

            let ui_sanpshot = scope.GetButtonObj();
            ui_sanpshot.id = vizwide3d.Main.GetViewID() + "ui_sanpshot";
            ui_sanpshot.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABi0lEQVRYhe2XP07DMBTGf60Kd6gqTuABztClAyozElL4MzAwZModWCwheUWCgkBirxhYOAMdcgLUS4BEkZFbOW6dxDRViui3xMqz3/f55T37pTGZTKgTzVrZgdZ0IKR6A3Y98+7SJD4JcSykGgDHHvMoTeI9PbAj4CNfBWZcLdd5msSNKghNxOaiJqTKJF3tObARsD5lqEutzAIhlU6sW4/5NE3iQYGLDE/QSVhAHiKiWIBbLsvCV95rlQMh+ALGwKtZ0wU61oY+gS3rWamAD+AsTeJH+6WQ6gi4MT7PdR6YnLnO4wnNAb3zCHgG7oG+ef8CHAL7wMOiCFSVA2Oz8yeLXKOnBRnbuxX23PD/RsD0m/cW2PrOnFL4c0dx1zyHC2xDZ85KBHRMtkeOCD2OhFQXQDvEYWgZNk2p6TI8sA1G2FWoT7sn/Dm/S/R+2zrjhVSXzkHULkPu8tgLpg1kmeZTR2Inp+nMQ4bHq7iq3rAIm45o/a5jzyVU9Z/RDHYERiEES2LG9c//joFvMD1526jvSpUAAAAASUVORK5CYII=";
            ui_sanpshot.checked = false;
            ui_sanpshot.tooltip = "Snapshot";
            ui_sanpshot.callback = cb_ui_sanpshot;


            addButton([ui_clipping, ui_measure, ui_note, ui_draw, ui_sanpshot]);
            // -----------------------------------------------------------Config

            // VIZWeb3D 제품 미지원 기능
            if (vizwide3d.Main.IsVIZWide3DProduct()) {
                // let cb_ui_config_visible = function (bool) {
                //     let config = scope.Element.get(ui_config_visible.id);
                //     if (bool === true) {
                //         vizwide3d.Main.Config.Show(!vizwide3d.Main.Config.Visible);
                //         config.element.innerHTML = "<img src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABhUlEQVRYhe1V0W2DMBA9qg7gEegGbBBGoBOUERjBGzBC1AkYId2AEcgGYYOrkB7Kk/E1MSHKR3kSknU+/J7vzneyY8c9UNVGr2i2DNqbtaGqR1VtVTUXkQNtHSYb9o5PySDI78VDIqwIjAlnpPgukMWMCPtAprOIfGP9JSI57X1kWXZ+RERIPhVcR+EfVNXRvoNtRrdpYUby7iM+PnRay2e+gpfh5SkASR5EeEDYfUCuKFgW59EjpvUF/kWqgDahD7T0X2X4FJYIqwacYTd9QWD1hH76YgVtgltxUBNdrBUHN74gGjXWi2gl4dYwQoiZqKK9ejauIk+ImCMBJdm5Loa/T7lNkuPAHCnim/IA6xGVKojMQsB7ooYBhTZiHoyq+hPxK1B4jE/MlHQgvGVwG4aHT8U5D5/iKnJZ9v4eYrgwuRcU9BIc/FvupmsENHR7LrAetjryz/obRw5zROYl8vQ2IzMElEE+e1qfNh9GhogmyPuM55OTiALT7YR1t2mud/w/iMgvcIdQ3KkqyZgAAAAASUVORK5CYII='>";
                //     }
                //     else {
                //         vizwide3d.Main.Config.Show(!vizwide3d.Main.Config.Visible);
                //         config.element.innerHTML = "<img src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACD0lEQVRYhe1Wy23CQBQcotxxOoCrT1BBoIJABYQKFg4+E84+wFYAVABUgFMB5OIr7iAuIXpoVlotNlkDyiWMZGk/j/eZ91nwwL9HzYeAMNYjADNux2mk5vcirtSBMNYLADkATeM9Xm3ECQAKQJBGanh3B2j83VPH8hYnnkrO8wo6qsh6O6CdfQZgyi/7RbYSzlLAgnu1ci4G22mkct4HAPYAGryXmvi8tjCLGLALTrAyxgVcr6z7ntUhd3HgT1HkwJi0GgxI+wlcD6x705ZXoawNJb9H6yizaB9Y+Rc000hllnNSQ3UW7JFd0k8jdaiSAuXsxeCEX+OCbIcy4sS3DCojH8a6VcWBoOS8VJYGymaCdM0+jPWHlwOcbEsA0lpNpyY2PJs7U1CM7Lg+0Q5g6DhVd23d5TFi9DuLOcn5hncy0hcM7MyelwOeTgbMu6CbRirhucyJNc+zNFJN+3fPFY1IQUm0Bxbb1kTqDKNZGOshC3BxSWclB6y2yqk8D2OdFMi1WBM2+gXviHcNBFS6LumQKYuyw/uiqNtFs8B3FI+sIhMlXWf61eWNYDqMEWHphft5UfQC3xQY2gN2gdCehLEekJkvI8goa9IZfLjalxT7MrC0IhCaTeuZqXhGednodeHLQIufYBLG+s3aCxtbTz1n8J4DHEYoePtv+pfs/X+ARhKmImFuN1w/8MB1APADgUq5n1GeHmcAAAAASUVORK5CYII='>";
                //     }
                // };

                // let ui_config_visible = scope.GetButtonObj();
                // ui_config_visible.id = vizwide3d.Main.GetViewID() + "ui_config_visible";
                // ui_config_visible.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACD0lEQVRYhe1Wy23CQBQcotxxOoCrT1BBoIJABYQKFg4+E84+wFYAVABUgFMB5OIr7iAuIXpoVlotNlkDyiWMZGk/j/eZ91nwwL9HzYeAMNYjADNux2mk5vcirtSBMNYLADkATeM9Xm3ECQAKQJBGanh3B2j83VPH8hYnnkrO8wo6qsh6O6CdfQZgyi/7RbYSzlLAgnu1ci4G22mkct4HAPYAGryXmvi8tjCLGLALTrAyxgVcr6z7ntUhd3HgT1HkwJi0GgxI+wlcD6x705ZXoawNJb9H6yizaB9Y+Rc000hllnNSQ3UW7JFd0k8jdaiSAuXsxeCEX+OCbIcy4sS3DCojH8a6VcWBoOS8VJYGymaCdM0+jPWHlwOcbEsA0lpNpyY2PJs7U1CM7Lg+0Q5g6DhVd23d5TFi9DuLOcn5hncy0hcM7MyelwOeTgbMu6CbRirhucyJNc+zNFJN+3fPFY1IQUm0Bxbb1kTqDKNZGOshC3BxSWclB6y2yqk8D2OdFMi1WBM2+gXviHcNBFS6LumQKYuyw/uiqNtFs8B3FI+sIhMlXWf61eWNYDqMEWHphft5UfQC3xQY2gN2gdCehLEekJkvI8goa9IZfLjalxT7MrC0IhCaTeuZqXhGednodeHLQIufYBLG+s3aCxtbTz1n8J4DHEYoePtv+pfs/X+ARhKmImFuN1w/8MB1APADgUq5n1GeHmcAAAAASUVORK5CYII=";
                // ui_config_visible.checked = true;
                // ui_config_visible.tooltip = "Config";
                // ui_config_visible.callback = cb_ui_config_visible;

                // addButton([ui_config_visible]);

                let ConfigPanel = new vizwide3d.ConfigPanel(view, vizwide3d, VIZCore);
                let cb_ui_config_visible = function (bool) {
                    ConfigPanel.Show(bool);
                    scope.SetCheckButton(ui_config_visible.id, bool);
                };

                let ui_config_visible = scope.GetButtonObj();
                ui_config_visible.id = vizwide3d.Main.GetViewID() + "ui_config_visible";
                ui_config_visible.imagesrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAACD0lEQVRYhe1Wy23CQBQcotxxOoCrT1BBoIJABYQKFg4+E84+wFYAVABUgFMB5OIr7iAuIXpoVlotNlkDyiWMZGk/j/eZ91nwwL9HzYeAMNYjADNux2mk5vcirtSBMNYLADkATeM9Xm3ECQAKQJBGanh3B2j83VPH8hYnnkrO8wo6qsh6O6CdfQZgyi/7RbYSzlLAgnu1ci4G22mkct4HAPYAGryXmvi8tjCLGLALTrAyxgVcr6z7ntUhd3HgT1HkwJi0GgxI+wlcD6x705ZXoawNJb9H6yizaB9Y+Rc000hllnNSQ3UW7JFd0k8jdaiSAuXsxeCEX+OCbIcy4sS3DCojH8a6VcWBoOS8VJYGymaCdM0+jPWHlwOcbEsA0lpNpyY2PJs7U1CM7Lg+0Q5g6DhVd23d5TFi9DuLOcn5hncy0hcM7MyelwOeTgbMu6CbRirhucyJNc+zNFJN+3fPFY1IQUm0Bxbb1kTqDKNZGOshC3BxSWclB6y2yqk8D2OdFMi1WBM2+gXviHcNBFS6LumQKYuyw/uiqNtFs8B3FI+sIhMlXWf61eWNYDqMEWHphft5UfQC3xQY2gN2gdCehLEekJkvI8goa9IZfLjalxT7MrC0IhCaTeuZqXhGednodeHLQIufYBLG+s3aCxtbTz1n8J4DHEYoePtv+pfs/X+ARhKmImFuN1w/8MB1APADgUq5n1GeHmcAAAAASUVORK5CYII=";
                ui_config_visible.imagesrc_checked = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABhUlEQVRYhe1V0W2DMBA9qg7gEegGbBBGoBOUERjBGzBC1AkYId2AEcgGYYOrkB7Kk/E1MSHKR3kSknU+/J7vzneyY8c9UNVGr2i2DNqbtaGqR1VtVTUXkQNtHSYb9o5PySDI78VDIqwIjAlnpPgukMWMCPtAprOIfGP9JSI57X1kWXZ+RERIPhVcR+EfVNXRvoNtRrdpYUby7iM+PnRay2e+gpfh5SkASR5EeEDYfUCuKFgW59EjpvUF/kWqgDahD7T0X2X4FJYIqwacYTd9QWD1hH76YgVtgltxUBNdrBUHN74gGjXWi2gl4dYwQoiZqKK9ejauIk+ImCMBJdm5Loa/T7lNkuPAHCnim/IA6xGVKojMQsB7ooYBhTZiHoyq+hPxK1B4jE/MlHQgvGVwG4aHT8U5D5/iKnJZ9v4eYrgwuRcU9BIc/FvupmsENHR7LrAetjryz/obRw5zROYl8vQ2IzMElEE+e1qfNh9GhogmyPuM55OTiALT7YR1t2mud/w/iMgvcIdQ3KkqyZgAAAAASUVORK5CYII=";
                ui_config_visible.checked = true;
                ui_config_visible.tooltip = "Config";
                ui_config_visible.callback = cb_ui_config_visible;

                let cb_config_panel_close = function () {
                    scope.SetCheckButton(ui_config_visible.id, false);
                    cb_ui_config_visible(false);
                };
                ConfigPanel.OnCloseButtonEvent(cb_config_panel_close);


                addButton([ui_config_visible]);
            }
        }

        function initNoteWindow() {
            scope.Element.get(vizwide3d.Main.GetViewID() + "div_note_text").element.childNodes[0].value = "";
            if (scope.ReviewType === VIZCore.Enum.REVIEW_TYPES.RK_2D_NOTE)
                scope.Element.get(vizwide3d.Main.GetViewID() + "ui_note_title").element.textContent = "2D Note";
            if (scope.ReviewType === VIZCore.Enum.REVIEW_TYPES.RK_3D_NOTE)
                scope.Element.get(vizwide3d.Main.GetViewID() + "ui_note_title").element.textContent = "3D Note";
            if (scope.ReviewType === VIZCore.Enum.REVIEW_TYPES.RK_SURFACE_NOTE)
                scope.Element.get(vizwide3d.Main.GetViewID() + "ui_note_title").element.textContent = "Surface Note";
        }

        function visibleNoteWindow(visible) {
            let popup = scope.Element.get(vizwide3d.Main.GetViewID() + "div_note_container").element;
            if (popup.style.display === 'block') {
                if (scope.ReviewType === VIZCore.Enum.REVIEW_TYPES.RK_2D_NOTE || scope.ReviewType === VIZCore.Enum.REVIEW_TYPES.RK_3D_NOTE) {
                    if (visible) {
                        scope.Element.get(vizwide3d.Main.GetViewID() + "ui_note_button_select").element.style.display = 'none';
                        scope.Element.get(vizwide3d.Main.GetViewID() + "div_note_container").element.style.display = 'block';
                    }
                    else {
                        scope.Element.get(vizwide3d.Main.GetViewID() + "div_note_container").element.style.display = 'none';
                        scope.ReviewType = VIZCore.Enum.REVIEW_TYPES.NONE;
                    }

                }
                else if (scope.ReviewType === VIZCore.Enum.REVIEW_TYPES.RK_SURFACE_NOTE) {
                    if (visible) {
                        scope.Element.get(vizwide3d.Main.GetViewID() + "ui_note_button_select").element.style.display = 'block';
                        scope.Element.get(vizwide3d.Main.GetViewID() + "div_note_container").element.style.display = 'block';
                    }
                    else {
                        scope.Element.get(vizwide3d.Main.GetViewID() + "div_note_container").element.style.display = 'none';
                        scope.ReviewType = VIZCore.Enum.REVIEW_TYPES.NONE;
                    }

                }
            }
        }

        function initNote() {
            let divNote = document.createElement('div');
            divNote.id = vizwide3d.Main.GetViewID() + "div_note_container";
            divNote.className = "div_note_container";

            let divNote_Obj = scope.GetButtonObj();
            divNote_Obj.id = divNote.id;
            divNote_Obj.element = divNote;

            scope.Element.set(divNote_Obj.id, divNote_Obj);

            let div_title = document.createElement('div');
            div_title.id = vizwide3d.Main.GetViewID() + "div_note_header";
            div_title.className = "div_note_header";
            //div_title.innerHTML = "Note";
            divNote.appendChild(div_title);

            let div_title_Obj = scope.GetButtonObj();
            div_title_Obj.id = div_title.id;
            div_title_Obj.element = div_title;

            scope.Element.set(div_title_Obj.id, div_title_Obj);

            let div_header_text = document.createElement('div');
            div_header_text.id = vizwide3d.Main.GetViewID() + "ui_note_title";
            div_header_text.className = "ui_note_title";
            div_header_text.innerHTML = "Note";
            div_title.appendChild(div_header_text);

            let div_header_text_Obj = scope.GetButtonObj();
            div_header_text_Obj.id = div_header_text.id;
            div_header_text_Obj.element = div_header_text;

            scope.Element.set(div_header_text_Obj.id, div_header_text_Obj);

            let div_button_cancel = document.createElement('div');
            div_button_cancel.id = vizwide3d.Main.GetViewID() + "ui_note_button_cancel";
            div_button_cancel.className = "ui_button_note_cancel";
            div_button_cancel.innerHTML = "<img alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAi0lEQVRYhe2Wyw3AIAxDo07QUdh/qY6QqhKVeqCIECe+xBI38DP/SKk0kqqeT0Mtjsmvd756awB4e/2sAdQb4gPX5QCjgTsh3B4eA8QEto1g8B1DONxiHAZfAYTDZ6A0+CREHvwnhAt+4OMFi7oF1ENIvYbUh4j6FFM/I+p3TC1I6CUZvSgtlVIlIjcKY8/Xmh9j0wAAAABJRU5ErkJggg==\" width=\"18px\" >";
            div_title.appendChild(div_button_cancel);

            let div_button_cancel_Obj = scope.GetButtonObj();
            div_button_cancel_Obj.id = div_button_cancel.id;
            div_button_cancel_Obj.element = div_button_cancel;

            scope.Element.set(div_button_cancel_Obj.id, div_button_cancel_Obj);

            let div_text = document.createElement('div');
            div_text.id = vizwide3d.Main.GetViewID() + "div_note_text";
            //div_text.className = "ui_note_title";
            div_text.innerHTML = "<textarea id=\"" + vizwide3d.Main.GetViewID() + "ui_note_text\" name=\"review\" cols=\"25\" rows=\"8\" autofocus required wrap=\"hard\" placeholder=\"Text...\"></textarea>";
            divNote.appendChild(div_text);

            let div_text_Obj = scope.GetButtonObj();
            div_text_Obj.id = div_text.id;
            div_text_Obj.element = div_text;

            scope.Element.set(div_text_Obj.id, div_text_Obj);

            let div_button = document.createElement('div');
            div_button.id = vizwide3d.Main.GetViewID() + "div_note_button";
            div_button.className = "div_note_button";
            divNote.appendChild(div_button);

            let div_button_Obj = scope.GetButtonObj();
            div_button_Obj.id = div_button.id;
            div_button_Obj.element = div_button;

            scope.Element.set(div_button_Obj.id, div_button_Obj);

            let div_button_ok = document.createElement('div');
            div_button_ok.id = vizwide3d.Main.GetViewID() + "ui_note_button_ok";
            div_button_ok.className = "ui_button_small";
            div_button_ok.innerHTML = "OK";
            div_button.appendChild(div_button_ok);

            let div_button_ok_Obj = scope.GetButtonObj();
            div_button_ok_Obj.id = div_button_ok.id;
            div_button_ok_Obj.element = div_button_ok;

            scope.Element.set(div_button_ok_Obj.id, div_button_ok_Obj);

            let div_button_select = document.createElement('div');
            div_button_select.id = vizwide3d.Main.GetViewID() + "ui_note_button_select";
            div_button_select.className = "ui_button_selectMode";
            div_button_select.innerHTML = "Select Model";
            div_button.appendChild(div_button_select);

            let div_button_select_Obj = scope.GetButtonObj();
            div_button_select_Obj.id = div_button_select.id;
            div_button_select_Obj.element = div_button_select;

            scope.Element.set(div_button_select_Obj.id, div_button_select_Obj);

            view.appendChild(divNote);

            scope.Element.get(div_button_ok.id).element.addEventListener('click', function () {
                let text = scope.Element.get(div_text.id).element.childNodes[0].value;
                let arr = text.split('\n');

                // 텍스트 생성
                if (text.length === 0) {
                    alert("Please enter text.");
                    return;
                }

                scope.Element.get(divNote.id).element.style.display = "none";
                if (scope.ReviewType === VIZCore.Enum.REVIEW_TYPES.RK_2D_NOTE) {
                    vizwide3d.Review.Note.AddNote2D(arr);
                }
                else if (scope.ReviewType === VIZCore.Enum.REVIEW_TYPES.RK_3D_NOTE) {
                    vizwide3d.Review.Note.AddNote3D(arr);
                }
                else if (scope.ReviewType === VIZCore.Enum.REVIEW_TYPES.RK_SURFACE_NOTE) {
                    vizwide3d.Review.Note.AddNoteSurface(arr);
                }
            });

            scope.Element.get(div_button_cancel.id).element.addEventListener('click', function () {
                visibleNoteWindow(false);
            });

            scope.Element.get(div_button_select.id).element.addEventListener('click', function () {
                visibleNoteWindow(false);
                vizwide3d.Review.Note.AddNoteSurface();
            });
        }


        function initMessage() {
            let divMessage = document.createElement('div');
            divMessage.id = vizwide3d.Main.GetViewID() + "VIZCore_Message";
            divMessage.className = "ui_message";

            let divText = document.createElement('div');
            divText.className = "ui_message_text";
            divText.className = "ui_message_text";
            divMessage.appendChild(divText);

            let divText_p1 = document.createElement('div');
            divText_p1.className = "ui_message_text-p1";
            divText_p1.className = "ui_message_text-p1";
            divText.appendChild(divText_p1);

            view.appendChild(divMessage);
            divMessage.style.display = ' none';
            let ui_notice_img = document.createElement('div');
            ui_notice_img.id = vizwide3d.Main.GetViewID() + "ui_notice_img";
            ui_notice_img.style.display = "none";
            ui_notice_img.innerHTML += "<img id=\"ui_notice_img_warning\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsSAAALEgHS3X78AAAClklEQVR4nO1bC3HDMAxVhiAQOgaFUAiFUAiFUAYtg0IohEIIhIzBIGiXnZt6ipL4IytO5ne3u61xY+nZ1teDgoKCgoICXSDiHhEf+Eb3+/5fLAMiHnAc2ycBEdsJAtoMREwHRDwThffmx8Z5q8rXiPhtKXq1nl2tz7sx9bLSJsCUklPkbAIu25w7Hlsi4Gkp1kyMa6xxT10pEwERj2RlD2MzMS7yuHb9qdt7OIy3A6R1u0VEvJAV3Tl8Z0e+c9GRVhiMZe8VMc/u1rM78Qo2cet0i0TBlihob/OeBOt5TY7OfXSiHMEYsxMhhwUZcyJjRo1ndiBub+DOXAgAh/fkqvzsynkQMLmTsoPr2XUlAGZsSY4EUOvNuj1PAnZj3iQr+AjqQ4APsYvCJ4LzJQACIkpV+MbwgQQ45xRLEOCVxYUQAB5ZpSoYtzebx0cQQOsKy7pFJt53CllDCYChW1w2TwhNWiIJGE2yVMGkrc7V3BgCgC+f6btFYpC8ChexBMDQLermCYzb83JJQgREyRCFWPYlCIDIXRgMifMnSECwHQqCVANDigDQ7ipJ+WBhAoJikZCJxKIwSQIgMBoNmUQsDpcmAFJ3laQzMUKmiNBJu0rSubg5TvaKNRLbNklXKWU15nVBQvB9suWz1dTjLIgu2KoqsgZiXSWNmrwRVjyTE+kqpezKGMX/vF96d0XJn7ovl8INMnOE7WCNziyj/C8SzONvwzR684oE+JXPtG5nkJVJttPA95aK1v2cuRsiCeabj2SZbG/9N7QMmFxmGH0Sy59H10UQJPfoPcLHyBT1lu7rGl1YfSprUGcctn1d/Y3Pqqq+ur/6HWA+uC0vW3LcXsqzMLZg6p8a1oo2+ztGBQUFBQWaAIAfJq9d2o1Ek2kAAAAASUVORK5CYII=\" width=\"64px\" >";
            //ui_notice_img.innerHTML += "<img id=\"ui_notice_img_warning\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIZGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDgtMDVUMTk6MjE6NDMrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjM0KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjM0KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmJkYjFjZTgzLWM1MDUtYjU0MS05YWE5LWM3MGU1MDljMmYzMCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjgwZWJlNGU2LTcxYTYtYjM0MC04YmViLTk1ZGEyNTRjMDNhYiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM4N2FmNzA5LWU0NGYtNmQ0Yy1hNTViLTcxODljMWQ2MzM5ZiIgdGlmZjpPcmllbnRhdGlvbj0iMSIgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSIzMjAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI5NiI+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmIiBzdEV2dDp3aGVuPSIyMDE1LTA4LTA1VDE5OjIxOjQzKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxZGE3MzllLTE0NGItMzI0NC04NGNhLTc5MmY4Y2JlY2I1OCIgc3RFdnQ6d2hlbj0iMjAyMC0xMi0wM1QxNjozMDowNiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpiZGIxY2U4My1jNTA1LWI1NDEtOWFhOS1jNzBlNTA5YzJmMzAiIHN0RXZ0OndoZW49IjIwMjAtMTItMzFUMDk6MzE6MzQrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7ge+U5AAAAWUlEQVRIiWP8//8/Ay0BE01NH7VgZFjAgk9Su2cSPun/V0vyGAlZQK4PiM485FhAUs4k1QKSsz0pFpBVphBrAdkFFjEWUFQaErKA4qKWcbS4HrVg1ALaWwAAYM8RJIpsTCIAAAAASUVORK5CYII=\" width=\"64px\" >";
            divMessage.appendChild(ui_notice_img);
        }

        function hexToRgb(hexType) {
            //"#" 기호를 삭제
            var hex = hexType.trim().replace("#", "");

            // rgb로 각각 분리해서 배열에 담기
            var rgb = (3 === hex.length) ?
                hex.match(/[a-f\d]/gi) : hex.match(/[a-f\d]{2}/gi);

            rgb.forEach(function (str, x, arr) {
                // rgb 각각의 헥사값이 한자리일 경우, 두자리로 변경
                if (str.length == 1) str = str + str;

                // 10진수로 변환
                arr[x] = parseInt(str, 16);
            });
            // return rgb.join(", ") + ", " + 255; 
            return rgb;
        }

        function addButton(Item) {
            // GUID 생성
            function guid() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }

            let divToolbar = scope.Element.get(vizwide3d.Main.GetViewID() + "VIZCore_Toolbar").element;

            let uiBoxNum = divToolbar.childNodes.length + 1;

            let uibox = document.createElement('div');
            uibox.id = "uibox" + uiBoxNum; uiBoxNum++;
            uibox.className = "uibox";
            divToolbar.appendChild(uibox);

            // 버튼의 길이가 1인 경우
            if (Item.length === 1) {
                let button = document.createElement('div');

                if (Item[0].id !== undefined && Item[0].id !== null) {
                    button.id = Item[0].id;
                } else {
                    button.id = "button" + guid();
                }

                button.className = "uitxt uialone_line";
                if (Item[0].imagesrc !== undefined && Item[0].imagesrc !== null) {
                    button.innerHTML = "<img src='" + Item[0].imagesrc + "'/>";
                }
                else {
                    button.innerHTML = "<img width='32px' height='32px' />";
                }
                button.style.backgroundColor = Item[0].backgroundColor;

                uibox.appendChild(button);

                Item[0].element = button;

                scope.Element.set(Item[0].id, Item[0]);

                if (Item[0].tooltip !== undefined) {
                    let tooltip = document.createElement('div');
                    tooltip.className = "vizwide3D_toolbar_button_tooltip";
                    tooltip.textContent = Item[0].tooltip;

                    button.appendChild(tooltip);
                    button.addEventListener('mouseover', function () {
                        tooltip.style.display = 'block';
                    });

                    button.addEventListener('mouseout', function () {
                        tooltip.style.display = 'none';
                    });
                }

                // 서브 버튼이 존재하는 경우
                if (Item[0].subButton !== undefined && Item[0].subButton !== null) {
                    let check = document.createElement('div');
                    check.className = "vizwide3D_SubButtonCheck_icon";
                    button.appendChild(check);

                    // 서브버튼이 하나만 존재하는 경우
                    if (Item[0].subButton.length === 1) {
                        // button.addEventListener('mouseover', function () {
                        //     childuibox.style.display = 'block';
                        // });

                        // button.addEventListener('mouseout', function () {
                        //     childuibox.style.display = 'none';
                        // });

                        let childuibox = document.createElement('div');
                        childuibox.id = "_ddbox" + guid();
                        childuibox.className = "ddbox";
                        button.appendChild(childuibox);

                        let childbutton = document.createElement('div');
                        // 아이디 설정
                        if (Item[0].subButton[0].id !== null && Item[0].subButton[0].id !== undefined) {
                            childbutton.id = Item[0].subButton[0].id;
                        } else {
                            childbutton.id = "childbutton" + guid();
                        }

                        // 서브버튼 이미지가 있는 경우
                        childbutton.className = "uitxt uialone_line";
                        if (Item[0].subButton[0].imagesrc !== undefined && Item[0].subButton[0].imagesrc !== null) {
                            childbutton.innerHTML = "<img src='" + Item[0].subButton[0].imagesrc + "'/>";
                        }
                        else {  // 서브버튼 이미지가 없는 경우
                            childbutton.innerHTML = "<img width='32px' height='32px'/>";
                        }
                        childbutton.style.backgroundColor = Item[0].subButton[0].backgroundColor;

                        childuibox.appendChild(childbutton);

                        Item[0].subButton[0].element = childbutton;
                        scope.Element.set(Item[0].subButton[0].id, Item[0].subButton[0]);

                        // 툴팁 표기
                        let tooltip = document.createElement('div');
                        if (Item[0].subButton[0].tooltip !== undefined) {
                            tooltip.className = "vizwide3D_toolbar_subbutton_tooltip";
                            tooltip.textContent = Item[0].subButton[0].tooltip;

                            childbutton.appendChild(tooltip);
                            childbutton.addEventListener('mouseover', function () {
                                tooltip.style.display = 'block';
                            });

                            childbutton.addEventListener('mouseout', function () {
                                tooltip.style.display = 'none';
                            });
                        }

                        if (Item[0].subButton[0].callback !== undefined) {
                            childbutton.addEventListener('click', function () {
                                if (Item[0].subButton[0].checked === true) {
                                    if (childbutton.classList[this.classList.length - 1] !== "clck") {
                                        childbutton.classList.add('clck');
                                        Item[0].subButton[0].callback(true);
                                        childbutton.appendChild(tooltip);
                                    } else {
                                        childbutton.classList.remove('clck');
                                        Item[0].subButton[0].callback(false);
                                        childbutton.appendChild(tooltip);
                                    }
                                } else {
                                    Item[0].subButton[0].callback();
                                }
                            });
                        }
                    }
                    else {  // 서브버튼이 두 개 이상 존재하는 경우
                        // button.addEventListener('mouseover', function (e) {
                        //     childuibox.style.display = 'block';
                        // });

                        // button.addEventListener('mouseout', function () {
                        //     childuibox.style.display = 'none';
                        // });

                        let childuibox = document.createElement('div');
                        childuibox.id = "_ddbox" + guid();
                        childuibox.className = "ddbox";
                        button.appendChild(childuibox);

                        for (let i = 0; i < Item[0].subButton.length; i++) {
                            let childbutton = document.createElement('div');

                            // 아이디 설정
                            if (Item[0].subButton[i].id !== null && Item[0].subButton[i].id !== undefined) {
                                childbutton.id = Item[0].subButton[i].id;
                            } else {
                                childbutton.id = "childbutton" + guid();
                            }

                            if (i === 0) {
                                childbutton.className = "uitxt uistart";
                                if (Item[0].subButton[i].imagesrc !== undefined && Item[0].subButton[i].imagesrc !== null) {
                                    childbutton.innerHTML = "<img src='" + Item[0].subButton[i].imagesrc + "'/>";
                                }
                                else {
                                    childbutton.innerHTML = "<img width='32px' height='32px'/>";
                                }
                                childbutton.style.backgroundColor = Item[0].subButton[i].backgroundColor;
                            }
                            else if (i === (Item[0].subButton.length - 1)) {
                                childbutton.className = "uitxt uiend";
                                if (Item[0].subButton[i].imagesrc !== undefined && Item[0].subButton[i].imagesrc !== null) {
                                    childbutton.innerHTML = "<img src='" + Item[0].subButton[i].imagesrc + "'/>";
                                }
                                else {
                                    childbutton.innerHTML = "<img width='32px' height='32px'/>";
                                }
                                childbutton.style.backgroundColor = Item[0].subButton[i].backgroundColor;
                            }
                            else {
                                childbutton.className = "uitxt uicenter";
                                if (Item[0].subButton[i].imagesrc !== undefined && Item[0].subButton[i].imagesrc !== null) {
                                    childbutton.innerHTML = "<img src='" + Item[0].subButton[i].imagesrc + "'/>";
                                }
                                else {
                                    childbutton.innerHTML = "<img width='32px' height='32px'/>";
                                }
                                childbutton.style.backgroundColor = Item[0].subButton[i].backgroundColor;
                            }
                            childuibox.appendChild(childbutton);

                            Item[0].subButton[i].element = childbutton;

                            scope.Element.set(Item[0].subButton[i].id, Item[0].subButton[i]);

                            // 툴팁 표기
                            let tooltip = document.createElement('div');
                            if (Item[0].subButton[i].tooltip !== undefined) {
                                tooltip.className = "vizwide3D_toolbar_subbutton_tooltip";
                                tooltip.textContent = Item[0].subButton[i].tooltip;

                                childbutton.appendChild(tooltip);
                                childbutton.addEventListener('mouseover', function () {
                                    tooltip.style.display = 'block';
                                });

                                childbutton.addEventListener('mouseout', function () {
                                    tooltip.style.display = 'none';
                                });
                            }

                            if (Item[0].subButton[i].callback !== undefined) {
                                childbutton.addEventListener('click', function () {
                                    if (Item[0].subButton[i].checked === true) {
                                        if (childbutton.classList[this.classList.length - 1] !== "clck") {
                                            childbutton.classList.add('clck');
                                            Item[0].subButton[i].callback(true);
                                            childbutton.appendChild(tooltip);
                                        } else {
                                            childbutton.classList.remove('clck');
                                            Item[0].subButton[i].callback(false);
                                            childbutton.appendChild(tooltip);
                                        }
                                    } else {
                                        Item[0].subButton[i].callback();
                                    }
                                });
                            }
                        }
                    }
                } else { // 서브 버튼이 존재하지 않는 경우
                    if (Item[0].callback !== undefined) {
                        button.addEventListener('click', function () {
                            if (Item[0].checked === true) {
                                if (button.classList[this.classList.length - 1] !== "clck") {
                                    button.classList.add('clck');
                                    Item[0].callback(true);
                                    if (Item[0].tooltip !== undefined) {
                                        let tooltip = document.createElement('div');
                                        tooltip.className = "vizwide3D_toolbar_button_tooltip";
                                        tooltip.textContent = Item[0].tooltip;

                                        button.appendChild(tooltip);
                                        button.addEventListener('mouseover', function () {
                                            tooltip.style.display = 'block';
                                        });

                                        button.addEventListener('mouseout', function () {
                                            tooltip.style.display = 'none';
                                        });
                                    }
                                } else {
                                    button.classList.remove('clck');
                                    Item[0].callback(false);
                                    if (Item[0].tooltip !== undefined) {
                                        let tooltip = document.createElement('div');
                                        tooltip.className = "vizwide3D_toolbar_button_tooltip";
                                        tooltip.textContent = Item[0].tooltip;

                                        button.appendChild(tooltip);
                                        button.addEventListener('mouseover', function () {
                                            tooltip.style.display = 'block';
                                        });

                                        button.addEventListener('mouseout', function () {
                                            tooltip.style.display = 'none';
                                        });
                                    }
                                }
                            } else {
                                Item[0].callback();
                            }
                        });
                    }
                }
            }
            else {    // 버튼 길이가 2이상인 경우
                for (let index = 0; index < Item.length; index++) {
                    let button = document.createElement('div');

                    if (Item[index].id !== null && Item[index].id !== undefined) {
                        button.id = Item[index].id;
                    } else {
                        button.id = "button" + guid();
                    }

                    if (index === 0) {
                        button.className = "uitxt uistart";
                        if (Item[index].imagesrc !== undefined && Item[index].imagesrc !== null) {
                            button.innerHTML = "<img src='" + Item[index].imagesrc + "'/>";
                        }
                        else {
                            button.innerHTML = "<img width='32px' height='32px'/>";
                        }
                        button.style.backgroundColor = Item[index].backgroundColor;
                    }
                    else if (index === (Item.length - 1)) {
                        button.className = "uitxt uiend";
                        if (Item[index].imagesrc !== undefined && Item[index].imagesrc !== null) {
                            button.innerHTML = "<img src='" + Item[index].imagesrc + "'/>";
                        }
                        else {
                            button.innerHTML = "<img width='32px' height='32px'/>";
                        }
                        button.style.backgroundColor = Item[index].backgroundColor;
                    }
                    else {
                        button.className = "uitxt uicenter";
                        if (Item[index].imagesrc !== undefined && Item[index].imagesrc !== null) {
                            button.innerHTML = "<img src='" + Item[index].imagesrc + "'/>";
                        }
                        else {
                            button.innerHTML = "<img width='32px' height='32px'/>";
                        }
                        button.style.backgroundColor = Item[index].backgroundColor;
                    }
                    uibox.appendChild(button);

                    Item[index].element = button;

                    scope.Element.set(Item[index].id, Item[index]);

                    if (Item[index].tooltip !== undefined) {
                        let tooltip = document.createElement('div');
                        tooltip.className = "vizwide3D_toolbar_button_tooltip";
                        tooltip.textContent = Item[index].tooltip;

                        button.appendChild(tooltip);
                        button.addEventListener('mouseover', function (e) {
                            tooltip.style.display = 'block';
                        });

                        button.addEventListener('mouseout', function () {
                            tooltip.style.display = 'none';
                        });
                    }

                    // 서브 버튼이 존재하는 경우
                    if (Item[index].subButton !== undefined && Item[index].subButton !== null) {
                        let check = document.createElement('div');
                        check.className = "vizwide3D_SubButtonCheck_icon";
                        button.appendChild(check);

                        // button.addEventListener('mouseover', function () {
                        //     childuibox.style.display = 'block';
                        // });

                        // button.addEventListener('mouseout', function () {
                        //     childuibox.style.display = 'none';
                        // });

                        let childuibox = document.createElement('div');
                        childuibox.id = "_ddbox" + guid();
                        childuibox.className = "ddbox";
                        button.appendChild(childuibox);

                        // 서브버튼이 하나만 존재하는 경우
                        if (Item[index].subButton.length === 1) {
                            let childbutton = document.createElement('div');

                            // 아이디 설정
                            if (Item[index].subButton[0].id !== null && Item[index].subButton[0].id !== undefined) {
                                childbutton.id = Item[index].subButton[0].id;
                            } else {
                                childbutton.id = "childbutton" + guid();
                            }

                            // 이미지 설정
                            childbutton.className = "uitxt uialone_line";
                            if (Item[index].subButton[0].imagesrc !== undefined && Item[index].subButton[0].imagesrc !== null) {
                                childbutton.innerHTML = "<img src='" + Item[index].subButton[0].imagesrc + "'/>";
                            }
                            else {
                                childbutton.innerHTML = "<img width='32px' height='32px'/>";
                            }
                            childbutton.style.backgroundColor = Item[index].subButton[0].backgroundColor;

                            childuibox.appendChild(childbutton);

                            Item[index].subButton[0].element = childbutton;

                            scope.Element.set(Item[index].subButton[0].id, Item[index].subButton[0]);

                            // 툴팁 표기
                            let tooltip = document.createElement('div');
                            if (Item[index].subButton[0].tooltip !== undefined) {
                                tooltip.className = "vizwide3D_toolbar_subbutton_tooltip";
                                tooltip.textContent = Item[index].subButton[0].tooltip;

                                childbutton.appendChild(tooltip);
                                childbutton.addEventListener('mouseover', function () {
                                    tooltip.style.display = 'block';
                                });

                                childbutton.addEventListener('mouseout', function () {
                                    tooltip.style.display = 'none';
                                });
                            }

                            if (Item[index].subButton[0].callback !== undefined) {
                                childbutton.addEventListener('click', function () {
                                    if (Item[index].subButton[0].checked === true) {
                                        if (childbutton.classList[this.classList.length - 1] !== "clck") {
                                            childbutton.classList.add('clck');
                                            Item[index].subButton[0].callback(true);
                                            childbutton.appendChild(tooltip);
                                        } else {
                                            childbutton.classList.remove('clck');
                                            Item[index].subButton[0].callback(false);
                                            childbutton.appendChild(tooltip);
                                        }
                                    } else {
                                        Item[index].subButton[0].callback();
                                    }
                                });
                            }
                        }
                        else {  // 서브버튼이 두 개 이상인 경우
                            for (let i = 0; i < Item[index].subButton.length; i++) {
                                let childbutton = document.createElement('div');

                                // 아이디 설정
                                if (Item[index].subButton[i].id !== null && Item[index].subButton[i].id !== undefined) {
                                    childbutton.id = Item[index].subButton[i].id;
                                } else {
                                    childbutton.id = "childbutton" + guid();
                                }

                                // 버튼 이미지 설정
                                if (i === 0) {
                                    childbutton.className = "uitxt uistart";
                                    if (Item[index].subButton[i].imagesrc !== undefined && Item[index].subButton[i].imagesrc !== null) {
                                        childbutton.innerHTML = "<img src='" + Item[index].subButton[i].imagesrc + "'/>";
                                    }
                                    else {
                                        childbutton.innerHTML = "<img width='32px' height='32px'/>";
                                    }
                                    childbutton.style.backgroundColor = Item[index].subButton[i].backgroundColor;
                                }
                                else if (i === (Item[index].subButton.length - 1)) {
                                    childbutton.className = "uitxt uiend";
                                    if (Item[index].subButton[i].imagesrc !== undefined && Item[index].subButton[i].imagesrc !== null) {
                                        childbutton.innerHTML = "<img src='" + Item[index].subButton[i].imagesrc + "'/>";
                                    }
                                    else {
                                        childbutton.innerHTML = "<img width='32px' height='32px'/>";
                                    }
                                    childbutton.style.backgroundColor = Item[index].subButton[i].backgroundColor;
                                }
                                else {
                                    childbutton.className = "uitxt uicenter";
                                    if (Item[index].subButton[i].imagesrc !== undefined && Item[index].subButton[i].imagesrc !== null) {
                                        childbutton.innerHTML = "<img src='" + Item[index].subButton[i].imagesrc + "'/>";
                                    }
                                    else {
                                        childbutton.innerHTML = "<img width='32px' height='32px'/>";
                                    }
                                    childbutton.style.backgroundColor = Item[index].subButton[i].backgroundColor;
                                }
                                childuibox.appendChild(childbutton);

                                Item[index].subButton[i].element = childbutton;

                                scope.Element.set(Item[index].subButton[i].id, Item[index].subButton[i]);

                                // 툴팁 표기
                                let tooltip = document.createElement('div');
                                if (Item[index].subButton[i].tooltip !== undefined) {
                                    tooltip.className = "vizwide3D_toolbar_subbutton_tooltip";
                                    tooltip.textContent = Item[index].subButton[i].tooltip;

                                    childbutton.appendChild(tooltip);
                                    childbutton.addEventListener('mouseover', function () {
                                        tooltip.style.display = 'block';
                                    });

                                    childbutton.addEventListener('mouseout', function () {
                                        tooltip.style.display = 'none';
                                    });
                                }

                                if (Item[index].subButton[i].callback !== undefined) {
                                    childbutton.addEventListener('click', function () {
                                        if (Item[index].subButton[i].checked === true) {
                                            if (childbutton.classList[this.classList.length - 1] !== "clck") {
                                                childbutton.classList.add('clck');
                                                Item[index].subButton[i].callback(true);
                                                childbutton.appendChild(tooltip);
                                            } else {
                                                childbutton.classList.remove('clck');
                                                Item[index].subButton[i].callback(false);
                                                childbutton.appendChild(tooltip);
                                            }
                                        } else {
                                            Item[index].subButton[i].callback();
                                        }
                                    });
                                }
                            }
                        }
                    }
                    else {   // 서브 버튼이 존재하지 않는 경우
                        if (Item[index].callback !== undefined) {
                            button.addEventListener('click', function () {
                                if (Item[index].checked === true) {
                                    if (button.classList[this.classList.length - 1] !== "clck") {
                                        button.classList.add('clck');
                                        Item[index].callback(true);

                                        if (Item[index].tooltip !== undefined) {
                                            let tooltip = document.createElement('div');
                                            tooltip.className = "vizwide3D_toolbar_button_tooltip";
                                            tooltip.textContent = Item[index].tooltip;

                                            button.appendChild(tooltip);
                                            button.addEventListener('mouseover', function () {
                                                tooltip.style.display = 'block';
                                            });

                                            button.addEventListener('mouseout', function () {
                                                tooltip.style.display = 'none';
                                            });
                                        }
                                    } else {
                                        button.classList.remove('clck');
                                        Item[index].callback(false);

                                        if (Item[index].tooltip !== undefined) {
                                            let tooltip = document.createElement('div');
                                            tooltip.className = "vizwide3D_toolbar_button_tooltip";
                                            tooltip.textContent = Item[index].tooltip;

                                            button.appendChild(tooltip);
                                            button.addEventListener('mouseover', function () {
                                                tooltip.style.display = 'block';
                                            });

                                            button.addEventListener('mouseout', function () {
                                                tooltip.style.display = 'none';
                                            });
                                        }
                                    }
                                } else {
                                    Item[index].callback();
                                }
                            });
                        }
                    }
                }
            };
        }

        function show(visible) {
            let toolbar = scope.Element.get(vizwide3d.Main.GetViewID() + "VIZCore_Toolbar").element;
            if (toolbar !== null) {
                if (visible === true) {
                    toolbar.style.display = 'block';
                }
                else {
                    toolbar.style.display = 'none';
                }
            }
        }

        function showAnimation(visible) {
            let toolbar = scope.Element.get(vizwide3d.Main.GetViewID() + "VIZCore_Toolbar").element;
            if (toolbar !== null) {
                if (visible === true) {
                    toolbar.className = 'fade-in-box';
                    show(visible);
                }
                else {
                    toolbar.className = 'fade-out-box';
                    show(visible);
                }
            }
        }
        // 모바일인 경우 터치 이벤트
        function toolbarTouchEvent() {
            let parentBtnMap = new Map();   // key: btn 모든 자식 element(btn img, subbmenu check), btn element

            let subMenuMap = new Map(); // key: subbtn element, value: btn element

            let subBtnMap = new Map(); // key btn, value: child btns

            // Map 구성
            scope.Element.forEach((value, key) => {
                if (key !== vizwide3d.Main.GetViewID() + "VIZCore_Toolbar") {
                    for (let index = 0; index < value.element.childNodes.length; index++) {
                        const element = value.element.childNodes[index];
                        if (element.className === 'ddbox' || element.className === 'vizwide3D_toolbar_button_tooltip') {
                            subMenuMap.set(element, value.element);
                        } else {
                            parentBtnMap.set(element, value.element);
                        }

                        // 서브 버튼이 있는 경우
                        if (value.subButton) {
                            let subbtn = [];
                            for (let index = 0; index < value.subButton.length; index++) {
                                const element = value.subButton[index];
                                subbtn.push(element.element);
                            }
                            subBtnMap.set(value.element, subbtn);
                        }
                    }
                }
            });

            // 툴바 제외 선택 시 자식 메뉴, 툴팁 닫힘
            let touchEvent = function (e) {
                if (!parentBtnMap.has(e.target)) {
                    subMenuMap.forEach((value, key) => {
                        if (key.style.display === '') {
                            key.style.display = 'none';
                        } else {
                            if (key.style.display === 'block') {
                                key.style.display = 'none';
                            }
                        }
                    });
                }
            };

            // Control.js로 이벤트 보냄
            vizwide3d.Main.Control.ToolbarEvent = touchEvent;

            // 툴바 영역 터치 시 이벤트
            let toolbar = document.getElementById(vizwide3d.Main.GetViewID() + 'VIZCore_Toolbar');
            toolbar.addEventListener('touchend', function (e) {

                if (parentBtnMap.has(e.target)) {
                    let btn = parentBtnMap.get(e.target);
                    let subbtn = subBtnMap.get(btn);
                    // 서브메뉴가 있는 경우만 실행
                    if (subbtn) {
                        subMenuMap.forEach((value, key) => {
                            // 같은 버튼인 경우 서브 메뉴 Toggle
                            if (value === btn) {
                                if (key.style.display === 'block') {
                                    key.style.display = 'none';
                                } else {
                                    key.style.display = 'block';
                                }
                            } else {    // 다른 버튼인 경우 서브 메뉴 닫기
                                key.style.display = 'none';
                            }
                        });
                    }
                }
            });

        };

        this.InitViewContainer = function () {
            create();
        };

        this.GetReviewPanel = function () {
            return this.ReviewPanel;
        };

        /**
        * 버튼 생성
        * @param {Array} Item : button object
        * @example 
        * import { VIZCore } from "./VIZCore/VIZCore.js";
        * let view = document.getElementById("view");
        * let vizwide3d = new VIZWide3D(view);
        * let createtoolbar = new createToolbar(view, vizwide3d, VIZCore);
        * 
        * let button = createtoolbar.GetButtonObj();
        * button.id = "button";
        * button.checked = true;
        * button.subButton = [subButton];
        * button.callback = callback;
        * 
        * createtoolbar.AddButton([button]);
        */
        this.AddButton = function (Item) {
            addButton(Item);
        };

        /**
        * Toolbar 보이기/숨기기
        * @param {Boolean} visible : Toolbar show/hide
        * @example 
        * import { VIZCore } from "./VIZCore/VIZCore.js";
        * let view = document.getElementById("view");
        * let vizwide3d = new VIZWide3D(view);
        * let createtoolbar = new vizwide3d.Toolbar(view, vizwide3d, VIZCore);
        * createtoolbar.Show(true);
        */
        this.Show = function (visible) {
            show(visible);
        };

        this.ShowAllButtons = function (visible) {
            let show = function (bShow) {
                scope.ShowButton(view.GetViewID() + 'ui_tree_visible', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_property_visible', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_select', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_color', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_search', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_control', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_isolation', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_camera_fitall', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_rendermode', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_effect', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_projection', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_camera_set', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_transform', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_clipping', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_measure', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_note', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_draw', bShow);
                scope.ShowButton(view.GetViewID() + 'ui_config_visible', bShow);
                // 스냅샷
                scope.ShowButton(view.GetViewID() + 'ui_sanpshot', bShow);
                // 리뷰 창
                scope.ShowButton(view.GetViewID() + 'ui_review_panel', bShow);
            }

            show(visible);
        };
    }

    /**
    * 버튼 object
    * @param {String} id : button id
    * @param {String} imagesrc : button image
    * @param {String} backgroundColor : button backgroundCOlor
    * @param {Boolean} checked : button checked
    * @param {Object} callback : button callback
    * @param {Array} subButton : button sub
    * @param {String} tooltip : button tooltip text
    * @example 
    * import { VIZCore } from "./VIZCore/VIZCore.js";
    * let view = document.getElementById("view");
    * let vizwide3d = new VIZWide3D(view);
    * let createtoolbar = new vizwide3d.Toolbar(view, vizwide3d, VIZCore);
    * 
    * let subbutton = createtoolbar.GetButtonObj();
    * subbutton.id = "subbutton";
    * subbutton.checked = fasle;
    * subbutton.callback = subcallback;
    * 
    * let button = createtoolbar.GetButtonObj();
    * button.id = "button";
    * button.checked = true;
    * button.subButton = [subButton];
    * button.callback = callback;
    */
    GetButtonObj() {
        let button = {
            id: undefined,
            imagesrc: undefined,
            imagesrc_checked: undefined,
            backgroundColor: undefined,
            checked: false,
            callback: undefined,
            subButton: undefined,
            tooltip: undefined,
            element: undefined
        };
        return button;
    };

    // /**
    // * 서브 버튼 추가
    // * @param {String} parentID : 서브 버튼 추가할 부모 버튼 id
    // * @param {Array} child : subbutton array
    // * @example 
    // * import { VIZCore } from "./VIZCore/VIZCore.js";
    // * let view = document.getElementById("view");
    // * let vizwide3d = new VIZWide3D(view);
    // * let createtoolbar = new createToolbar(view, vizwide3d, VIZCore);
    // * 
    // * let button = createtoolbar.GetButtonObj();
    // * button.id = "button";
    // * button.checked = true;
    // * button.callback = callback;
    // * 
    // * createtoolbar.AddButton([button]);
    // * 
    // * let subbutton = createtoolbar.GetButtonObj();
    // * subbutton.id = "button";
    // * subbutton.checked = true;
    // * subbutton.callback = callback;
    // * 
    // * createtoolbar.AddSubButton(button.id ,[subbutton]);
    // */
    // AddSubButton(parentID, child) {
    //     let parentElement = this.Element.get(parentID).element;

    //     // GUID 생성
    //     function guid() {
    //         return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    //             var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    //             return v.toString(16);
    //         });
    //     }

    //     if (parentElement.childNodes[3] !== undefined) {
    //         let subbox = parentElement.childNodes[3];
    //         subbox.innerHTML = ""
    //     }

    //     // 기존에 서브버튼이 존재할 때
    //     if (parentElement.childNodes[3] !== undefined && parentElement.childNodes[3].length > 0 ) {
    //         let subbox = parentElement.childNodes[3];

    //         // 기존 서브버튼의 마지막 버튼 클래스 수정
    //         if (parentElement.childNodes[3].childNodes.length === 1) {
    //             parentElement.childNodes[3].childNodes[parentElement.childNodes[3].childNodes.length - 1].className = "uitxt uistart";
    //         } else {
    //             parentElement.childNodes[3].childNodes[parentElement.childNodes[3].childNodes.length - 1].className = "uitxt uicenter";
    //         }

    //         for (let index = 0; index < child.length; index++) {
    //             if (child.length === 1) {
    //                 let childbutton = document.createElement('div');
    //                 // 아이디 설정
    //                 if (child[0].id !== null && child[0].id !== undefined) {
    //                     childbutton.id = child[0].id;
    //                 } else {
    //                     childbutton.id = "childbutton" + guid();
    //                 }

    //                 // 서브버튼 이미지가 있는 경우
    //                 childbutton.className = "uitxt uiend";
    //                 if (child[0].imagesrc !== undefined && child[0].imagesrc !== null) {
    //                     childbutton.innerHTML = "<img src='" + child[0].imagesrc + "'/>";
    //                 }
    //                 else {  // 서브버튼 이미지가 없는 경우
    //                     childbutton.innerHTML = "<img width='32px' height='32px'/>";
    //                 }
    //                 childbutton.style.backgroundColor = child[0].backgroundColor;

    //                 subbox.appendChild(childbutton);

    //                 child[0].element = childbutton;

    //                 // 툴팁 표기
    //                 if (child[0].tooltip !== undefined) {
    //                     let tooltip = document.createElement('div');
    //                     tooltip.className = "vizwide3D_toolbar_subbutton_tooltip";
    //                     tooltip.textContent = child[0].tooltip;

    //                     childbutton.appendChild(tooltip);
    //                     childbutton.addEventListener('mouseover', function () {
    //                         tooltip.style.display = 'block';
    //                     });

    //                     childbutton.addEventListener('mouseout', function () {
    //                         tooltip.style.display = 'none';
    //                     });
    //                 }

    //                 if (child[0].callback !== undefined) {
    //                     childbutton.addEventListener('click', function () {
    //                         if (child[0].checked === true) {
    //                             if (childbutton.classList[this.classList.length - 1] !== "clck") {
    //                                 childbutton.classList.add('clck');
    //                                 child[0].callback(true);
    //                             } else {
    //                                 childbutton.classList.remove('clck');
    //                                 child[0].callback(false);
    //                             }
    //                         } else {
    //                             child[0].callback();
    //                         }
    //                     });
    //                 }
    //             }
    //             else {  // 서브버튼이 두 개 이상 존재하는 경우
    //                 let childbutton = document.createElement('div');

    //                 // 아이디 설정
    //                 if (child[index].id !== null && child[index].id !== undefined) {
    //                     childbutton.id = child[index].id;
    //                 } else {
    //                     childbutton.id = "childbutton" + guid();
    //                 }

    //                 if (index === (child.length - 1)) {
    //                     childbutton.className = "uitxt uiend";
    //                     if (child[index].imagesrc !== undefined && child[index].imagesrc !== null) {
    //                         childbutton.innerHTML = "<img src='" + child[index].imagesrc + "'/>";
    //                     }
    //                     else {
    //                         childbutton.innerHTML = "<img width='32px' height='32px'/>";
    //                     }
    //                     childbutton.style.backgroundColor = child[index].backgroundColor;
    //                 }
    //                 else {
    //                     childbutton.className = "uitxt uicenter";
    //                     if (child[index].imagesrc !== undefined && child[index].imagesrc !== null) {
    //                         childbutton.innerHTML = "<img src='" + child[index].imagesrc + "'/>";
    //                     }
    //                     else {
    //                         childbutton.innerHTML = "<img width='32px' height='32px'/>";
    //                     }
    //                     childbutton.style.backgroundColor = child[index].backgroundColor;
    //                 }
    //                 subbox.appendChild(childbutton);

    //                 child[index].element = childbutton;

    //                 // 툴팁 표기
    //                 if (child[index].tooltip !== undefined) {
    //                     let tooltip = document.createElement('div');
    //                     tooltip.className = "vizwide3D_toolbar_subbutton_tooltip";
    //                     tooltip.textContent = child[index].tooltip;

    //                     childbutton.appendChild(tooltip);
    //                     childbutton.addEventListener('mouseover', function () {
    //                         tooltip.style.display = 'block';
    //                     });

    //                     childbutton.addEventListener('mouseout', function () {
    //                         tooltip.style.display = 'none';
    //                     });
    //                 }

    //                 if (child[index].callback !== undefined) {
    //                     childbutton.addEventListener('click', function () {
    //                         if (child[index].checked === true) {
    //                             if (childbutton.classList[this.classList.length - 1] !== "clck") {
    //                                 childbutton.classList.add('clck');
    //                                 child[index].callback(true);
    //                             } else {
    //                                 childbutton.classList.remove('clck');
    //                                 child[index].callback(false);
    //                             }
    //                         } else {
    //                             child[index].callback();
    //                         }
    //                     });
    //                 }
    //             }
    //         }
    //     }
    //     else { // 기존에 서브버튼이 존재하지 않을 때
    //         let button = parentElement;

    //         let check = document.createElement('div');
    //         check.className = "vizwide3D_SubButtonCheck_icon";
    //         button.appendChild(check);

    //         // button.addEventListener('mouseover', function () {
    //         //     subbox.style.display = 'block';
    //         // });

    //         // button.addEventListener('mouseout', function () {
    //         //     subbox.style.display = 'none';
    //         // });

    //         let subbox = document.createElement('div');
    //         subbox.id = "_ddbox" + guid();
    //         subbox.className = "ddbox";
    //         button.appendChild(subbox);

    //         for (let index = 0; index < child.length; index++) {
    //             if (child.length === 1) {  // 서브 버튼이 한 개만 존재하는 경우
    //                 let childbutton = document.createElement('div');
    //                 // 아이디 설정
    //                 if (child[0].id !== null && child[0].id !== undefined) {
    //                     childbutton.id = child[0].id;
    //                 } else {
    //                     childbutton.id = "childbutton" + guid();
    //                 }

    //                 // 서브버튼 이미지가 있는 경우
    //                 childbutton.className = "uitxt uialone_line";
    //                 if (child[0].imagesrc !== undefined && child[0].imagesrc !== null) {
    //                     childbutton.innerHTML = "<img src='" + child[0].imagesrc + "'/>";
    //                 }
    //                 else {  // 서브버튼 이미지가 없는 경우
    //                     childbutton.innerHTML = "<img width='32px' height='32px'/>";
    //                 }
    //                 childbutton.style.backgroundColor = child[0].backgroundColor;

    //                 subbox.appendChild(childbutton);

    //                 child[0].element = childbutton;

    //                 // 툴팁 표기
    //                 if (child[0].tooltip !== undefined) {
    //                     let tooltip = document.createElement('div');
    //                     tooltip.className = "vizwide3D_toolbar_subbutton_tooltip";
    //                     tooltip.textContent = child[0].tooltip;

    //                     childbutton.appendChild(tooltip);
    //                     childbutton.addEventListener('mouseover', function () {
    //                         tooltip.style.display = 'block';
    //                     });

    //                     childbutton.addEventListener('mouseout', function () {
    //                         tooltip.style.display = 'none';
    //                     });
    //                 }

    //                 if (child[0].callback !== undefined) {
    //                     childbutton.addEventListener('click', function () {
    //                         if (child[0].checked === true) {
    //                             if (childbutton.classList[this.classList.length - 1] !== "clck") {
    //                                 childbutton.classList.add('clck');
    //                                 child[0].callback(true);
    //                             } else {
    //                                 childbutton.classList.remove('clck');
    //                                 child[0].callback(false);
    //                             }
    //                         } else {
    //                             child[0].callback();
    //                         }
    //                     });
    //                 }
    //             }
    //             else {  // 서브버튼이 두 개 이상 존재하는 경우
    //                 let childbutton = document.createElement('div');

    //                 // 아이디 설정
    //                 if (child[index].id !== null && child[index].id !== undefined) {
    //                     childbutton.id = child[index].id;
    //                 } else {
    //                     childbutton.id = "childbutton" + guid();
    //                 }

    //                 if (index === 0) {
    //                     childbutton.className = "uitxt uistart";
    //                     if (child[index].imagesrc !== undefined && child[index].imagesrc !== null) {
    //                         childbutton.innerHTML = "<img src='" + child[index].imagesrc + "'/>";
    //                     }
    //                     else {
    //                         childbutton.innerHTML = "<img width='32px' height='32px'/>";
    //                     }
    //                     childbutton.style.backgroundColor = child[index].backgroundColor;
    //                 }
    //                 else if (index === (child.length - 1)) {
    //                     childbutton.className = "uitxt uiend";
    //                     if (child[index].imagesrc !== undefined && child[index].imagesrc !== null) {
    //                         childbutton.innerHTML = "<img src='" + child[index].imagesrc + "'/>";
    //                     }
    //                     else {
    //                         childbutton.innerHTML = "<img width='32px' height='32px'/>";
    //                     }
    //                     childbutton.style.backgroundColor = child[index].backgroundColor;
    //                 }
    //                 else {
    //                     childbutton.className = "uitxt uicenter";
    //                     if (child[index].imagesrc !== undefined && child[index].imagesrc !== null) {
    //                         childbutton.innerHTML = "<img src='" + child[index].imagesrc + "'/>";
    //                     }
    //                     else {
    //                         childbutton.innerHTML = "<img width='32px' height='32px'/>";
    //                     }
    //                     childbutton.style.backgroundColor = child[index].backgroundColor;
    //                 }
    //                 subbox.appendChild(childbutton);

    //                 child[index].element = childbutton;

    //                 this.Element.set(child[index].id, child[index]);

    //                 // 툴팁 표기
    //                 if (child[index].tooltip !== undefined) {
    //                     let tooltip = document.createElement('div');
    //                     tooltip.className = "vizwide3D_toolbar_subbutton_tooltip";
    //                     tooltip.textContent = child[index].tooltip;

    //                     childbutton.appendChild(tooltip);
    //                     childbutton.addEventListener('mouseover', function () {
    //                         tooltip.style.display = 'block';
    //                     });

    //                     childbutton.addEventListener('mouseout', function () {
    //                         tooltip.style.display = 'none';
    //                     });
    //                 }

    //                 if (child[index].callback !== undefined) {
    //                     childbutton.addEventListener('click', function () {
    //                         if (child[index].checked === true) {
    //                             if (childbutton.classList[this.classList.length - 1] !== "clck") {
    //                                 childbutton.classList.add('clck');
    //                                 child[index].callback(true);
    //                             } else {
    //                                 childbutton.classList.remove('clck');
    //                                 child[index].callback(false);
    //                             }
    //                         } else {
    //                             child[index].callback();
    //                         }
    //                     });
    //                 }
    //             }
    //         }
    //     }
    // };
    /**
    * 서브 버튼 추가
    * @param {String} parentID : 서브 버튼 추가할 부모 버튼 id
    * @param {Object} childInfo : subbutton info
    * @param {Number} Position : subbutton 순서
    * @example 
    * import { VIZCore } from "./VIZCore/VIZCore.js";
    * let view = document.getElementById("view");
    * let vizwide3d = new VIZWide3D(view);
    * let createtoolbar = new createToolbar(view, vizwide3d, VIZCore);
    * 
    * let button = createtoolbar.GetButtonObj();
    * button.id = "button";
    * button.checked = true;
    * button.callback = callback;
    * 
    * createtoolbar.AddButton([button]);
    * 
    * let subbutton = createtoolbar.GetButtonObj();
    * subbutton.id = "button";
    * subbutton.checked = true;
    * subbutton.callback = callback;
    * 
    * createtoolbar.AddSubButton(button.id ,subbutton, 0);
    */
    AddSubButton(parentID, childInfo, position) {
        let parentElement = this.Element.get(parentID).element;

        // 기존에 있는 child
        let child = this.Element.get(parentID).subButton;

        if (!child) {
            child = [];
        }

        // 위치 정보에 따라 배열 재구성
        if (position) {
            child.splice(position, 0, childInfo);
        } else {
            child.push(childInfo);
        }

        // 데이터 재할당
        this.Element.get(parentID).subButton = child;

        // GUID 생성
        function guid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        let parentButton = parentElement;
        // 기존에 서브버튼이 존재할 때
        let subbox;
        if (parentElement.childNodes.length !== 0) {
            for (let index = 0; index < parentElement.childNodes.length; index++) {
                const element = parentElement.childNodes[index];
                if (element.className === "ddbox") {
                    subbox = element;
                }
            }
        }

        if (!subbox) {
            let check = document.createElement('div');
            check.className = "vizwide3D_SubButtonCheck_icon";
            parentButton.appendChild(check);

            subbox = document.createElement('div');
            subbox.id = "_ddbox" + guid();
            subbox.className = "ddbox";
            parentButton.appendChild(subbox);
        }
        // 초기화
        subbox.innerHTML = "";

        for (let index = 0; index < child.length; index++) {
            let childbutton = document.createElement('div');

            // 아이디 설정
            if (child[index].id !== null && child[index].id !== undefined) {
                childbutton.id = child[index].id;
            } else {
                childbutton.id = "childbutton" + guid();
            }

            if (child.length === 1) {  // 서브 버튼이 한 개만 존재하는 경우
                // 서브버튼 이미지가 있는 경우
                childbutton.className = "uitxt uialone_line";
                if (child[0].imagesrc !== undefined && child[0].imagesrc !== null) {
                    childbutton.innerHTML = "<img src='" + child[0].imagesrc + "'/>";
                }
                else {  // 서브버튼 이미지가 없는 경우
                    childbutton.innerHTML = "<img width='32px' height='32px'/>";
                }
            }
            else {  // 서브버튼이 두 개 이상 존재하는 경우
                if (index === 0) {
                    childbutton.className = "uitxt uistart";
                    if (child[index].imagesrc !== undefined && child[index].imagesrc !== null) {
                        childbutton.innerHTML = "<img src='" + child[index].imagesrc + "'/>";
                    }
                    else {
                        childbutton.innerHTML = "<img width='32px' height='32px'/>";
                    }
                }
                else if (index === (child.length - 1)) {
                    childbutton.className = "uitxt uiend";
                    if (child[index].imagesrc !== undefined && child[index].imagesrc !== null) {
                        childbutton.innerHTML = "<img src='" + child[index].imagesrc + "'/>";
                    }
                    else {
                        childbutton.innerHTML = "<img width='32px' height='32px'/>";
                    }
                }
                else {
                    childbutton.className = "uitxt uicenter";
                    if (child[index].imagesrc !== undefined && child[index].imagesrc !== null) {
                        childbutton.innerHTML = "<img src='" + child[index].imagesrc + "'/>";
                    }
                    else {
                        childbutton.innerHTML = "<img width='32px' height='32px'/>";
                    }
                }
            }

            childbutton.style.backgroundColor = child[index].backgroundColor;

            subbox.appendChild(childbutton);

            child[index].element = childbutton;

            // 툴팁 표기
            if (child[index].tooltip !== undefined) {
                let tooltip = document.createElement('div');
                tooltip.className = "vizwide3D_toolbar_subbutton_tooltip";
                tooltip.textContent = child[index].tooltip;

                childbutton.appendChild(tooltip);
                childbutton.addEventListener('mouseover', function () {
                    tooltip.style.display = 'block';
                });

                childbutton.addEventListener('mouseout', function () {
                    tooltip.style.display = 'none';
                });
            }

            // Callback
            if (child[index].callback !== undefined) {
                childbutton.addEventListener('click', function () {
                    if (child[index].checked === true) {
                        if (childbutton.classList[this.classList.length - 1] !== "clck") {
                            childbutton.classList.add('clck');
                            child[index].callback(true);
                        } else {
                            childbutton.classList.remove('clck');
                            child[index].callback(false);
                        }
                    } else {
                        child[index].callback();
                    }
                });
            }

            this.Element.set(child[index].id, child[index]);
        }
    };


    /**
    * Button Check
    * @param {String} id : button id
    * @param {boolean} check : button check
    * @example 
    * let button = createtoolbar.GetButtonObj();
    * button.id = "button";
    * button.checked = true;
    * button.callback = callback;
    * 
    * createtoolbar.SetCheckButton(id, true);
    */
    SetCheckButton(id, check) {
        let button = this.Element.get(id);
        if(button === undefined || button === null)
            return;
        if (check === true) {
            button.element.classList.add('clck');
        }
        else {
            button.element.classList.remove('clck');
        }
        this.SetCheckButtonImg(id, check);
    };

    /**
    * Button Check
    * @param {String} parentID : parent button ID
    * @param {String} exceptSubId : except Sub button ID
    * @param {boolean} check : button check
    * @example 
    * let parentbutton = createtoolbar.GetButtonObj();
    * parentbutton.id = "button";
    * parentbutton.checked = true;
    * parentbutton.callback = callback;
    * 
    * let exceptbutton = createtoolbar.GetButtonObj();
    * 
    * createtoolbar.SetCheckSubButtons(parentbutton.id , true, exceptbutton.id);
    */
    SetCheckSubButtons(parentID, check, exceptSubId) {
        let parentButton = this.Element.get(parentID);
       
        // 서브버튼
        if (parentButton.subButton.length !== 0)
        {
          for (let i = 0; i < parentButton.subButton.length; i++)
          {
            let subButton = this.Element.get(parentButton.subButton[i].id);
            if (subButton !== undefined && exceptSubId !== subButton.id)
            {
                if (check === true) {
                    subButton.element.classList.add('clck');
                }
                else {
                    subButton.element.classList.remove('clck');
                }
                this.SetCheckButtonImg(subButton.id, check);
            }
          }   
        }
    };

    /**
    * Button Check Image
    * @param {String} id : button id
    * @param {boolean} check : button check
    * @example 
    * let button = createtoolbar.GetButtonObj();
    * button.id = "button";
    * button.checked = true;
    * button.callback = callback;
    * 
    * createtoolbar.SetCheckButtonImg(id, true);
    */
    SetCheckButtonImg(id, check) {
        let button = this.Element.get(id).element;
        let image = this.Element.get(id).imagesrc;
        let checkimage = this.Element.get(id).imagesrc_checked;
        if (checkimage !== undefined) {
            if (check === true) {
                button.querySelector('img').src = checkimage;
                button.addEventListener('click', function () {
                    if (button.classList[button.classList.length - 1] !== "clck") {
                        button.querySelector('img').src = image;
                    } else {
                        button.querySelector('img').src = checkimage;
                    }
                });
            } else {
                button.querySelector('img').src = image;
                button.addEventListener('click', function () {
                    if (button.classList[button.classList.length - 1] === "clck") {
                        button.querySelector('img').src = checkimage;
                    } else {
                        button.querySelector('img').src = image;
                    }
                });
            }
        }

    };

    /**
    * Button 보이기/ 숨기기
    * @param {String} id : button id
    * @param {boolean} show : button show
    * @example 
    * let button = createtoolbar.GetButtonObj();
    * button.id = "button";
    * button.checked = true;
    * button.callback = callback;
    * 
    * createtoolbar.ShowButton(button.id, true);
    * // 기본 제공 버튼은 toolbar.Element 에서 확인 가능
    * console.log(createtoolbar.Element); 
    */
    ShowButton(id, show) {
        let button = this.Element.get(id).element;

        if (show === true) {
            button.style.display = "block";
        } else {
            button.style.display = "none";
        }
    }
}
export default Toolbar